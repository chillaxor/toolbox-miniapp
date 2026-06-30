# -*- coding: utf-8 -*-
"""
PDF转Word云函数（Python版）
使用 PyMuPDF(fitz) 提取 PDF 文本，用 python-docx 生成 .docx 文件。
纯本地处理，不依赖外部API，不上传第三方。

由于微信云开发官方仅提供 Node.js 版 SDK（wx-server-sdk），Python 云函数需要
直接调用微信云开发 HTTP API（tcb 系列）完成数据库读写、文件上传等操作。

需要的环境变量（在 SCF / 云开发控制台「函数配置 → 环境变量」中配置）：
  WX_APPID        - 小程序 AppID
  WX_APPSECRET    - 小程序 AppSecret
  CLOUD_ENV       - 云环境 ID（如 cloud1-d9gm1qla9bebafa31）
  DAILY_USER_LIMIT  - 每人每天次数（默认 5）
  DAILY_TOTAL_LIMIT - 全局每天总量（默认 100）

openid 说明：
  微信云开发调用云函数时，会在 event 中注入 wxContext（含 OPENID / APPID / UNIONID），
  本函数优先从 event.wxContext.OPENID 读取。
"""

import base64
import datetime
import io
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from xml.sax.saxutils import escape

import fitz  # PyMuPDF


# ====== 配置 ======
WX_APPID = os.environ.get('WX_APPID', '').strip()
WX_APPSECRET = os.environ.get('WX_APPSECRET', '').strip()
CLOUD_ENV = os.environ.get('CLOUD_ENV', 'cloud1-d9gm1qla9bebafa31').strip()

DAILY_USER_LIMIT = int(os.environ.get('DAILY_USER_LIMIT', '5'))
DAILY_TOTAL_LIMIT = int(os.environ.get('DAILY_TOTAL_LIMIT', '100'))

# ====== 安全限制 ======
MAX_PDF_SIZE = 20 * 1024 * 1024  # 20MB
MAX_PAGES = 30  # 最多提取30页，超出截断

# ====== 微信 API ======
API_BASE = 'https://api.weixin.qq.com'

# 函数实例内 access_token 缓存（云函数实例复用时有效）
_token_cache = {'token': '', 'expire_at': 0}


# ====== 工具函数 ======

def _ok(**kwargs):
    """成功返回"""
    return {'success': True, **kwargs}


def _fail(code, msg, **kwargs):
    """失败返回"""
    return {'success': False, 'errorCode': code, 'errorMsg': msg, **kwargs}


def _get_date_key():
    """返回日期 key（yyyy-mm-dd）"""
    return datetime.datetime.now().strftime('%Y-%m-%d')


def _sanitize_name(name):
    """过滤文件名中的非法字符，截断到40字符"""
    name = re.sub(r'[\\/:*?"<>|]', '_', name)
    return (name[:40] or 'document')


def _safe_dump(obj, max_len=2000):
    """安全序列化对象为字符串，超长截断。"""
    try:
        s = json.dumps(obj, ensure_ascii=False, default=str)
    except Exception as e:
        s = '<unserializable: {}>'.format(e)
    return s[:max_len]


def _http_post_json(url, payload, timeout=10):
    """POST JSON，返回解析后的 dict。失败抛异常。"""
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode('utf-8')
    result = json.loads(body)
    if result.get('errcode') and result['errcode'] != 0:
        raise RuntimeError('WeChat API error: {} {}'.format(
            result.get('errcode'), result.get('errmsg', '')))
    return result


def _get_access_token():
    """获取（并缓存）微信 access_token"""
    import time
    now = time.time()
    if _token_cache['token'] and now < _token_cache['expire_at'] - 60:
        return _token_cache['token']

    if not WX_APPID or not WX_APPSECRET:
        raise RuntimeError('missing WX_APPID or WX_APPSECRET env')

    url = '{}/cgi-bin/token?grant_type=client_credential&appid={}&secret={}'.format(
        API_BASE,
        urllib.parse.quote(WX_APPID),
        urllib.parse.quote(WX_APPSECRET)
    )
    with urllib.request.urlopen(url, timeout=10) as resp:
        body = json.loads(resp.read().decode('utf-8'))

    if 'access_token' not in body:
        raise RuntimeError('get access_token failed: {} {}'.format(
            body.get('errcode'), body.get('errmsg', '')))

    _token_cache['token'] = body['access_token']
    _token_cache['expire_at'] = now + int(body.get('expires_in', 7200))
    return _token_cache['token']


def _db_add(token, collection, doc):
    """数据库新增（/tcb/databaseadd）"""
    url = '{}/tcb/databaseadd?access_token={}'.format(API_BASE, token)
    payload = {
        'env': CLOUD_ENV,
        'query': 'db.collection("{}").add({{ data: {} }})'.format(
            collection, json.dumps(doc, ensure_ascii=False)
        )
    }
    return _http_post_json(url, payload)


def _db_count(token, query):
    """数据库 count 查询，返回总数"""
    url = '{}/tcb/databasecount?access_token={}'.format(API_BASE, token)
    payload = {
        'env': CLOUD_ENV,
        'query': query
    }
    res = _http_post_json(url, payload)
    return int(res.get('count', 0) or 0)


def _query_quota(token, openid, date_key):
    """查询个人和全局额度"""
    user_query = 'db.collection("pdf2word_usage").where({{openid:"{}",dateKey:"{}"}}).count()'.format(
        openid, date_key)
    total_query = 'db.collection("pdf2word_usage").where({{dateKey:"{}"}}).count()'.format(
        date_key)
    user_used = _db_count(token, user_query)
    total_used = _db_count(token, total_query)
    return user_used, total_used


def _record_usage(token, openid, date_key, file_name, file_id, char_count):
    """记录一次使用，同时保存 fileID 用于后续清理"""
    doc = {
        'openid': openid,
        'dateKey': date_key,
        'fileName': file_name,
        'fileID': file_id,
        'charCount': char_count,
        'timestamp': int(datetime.datetime.now().timestamp() * 1000),
        'date': datetime.datetime.now().isoformat()
    }
    try:
        _db_add(token, 'pdf2word_usage', doc)
    except Exception as e:
        print('[pdf2word] record usage error:', e)


def _upload_to_cloud(token, cloud_path, file_bytes):
    """上传文件到云存储：先取上传签名，再 POST multipart 到 COS。返回 fileID。"""
    # 1. 获取上传凭证
    url = '{}/tcb/uploadfile?access_token={}'.format(API_BASE, token)
    payload = {
        'env': CLOUD_ENV,
        'path': cloud_path
    }
    res = _http_post_json(url, payload)
    # 腾讯云返回字段：url / authorization / token / cosfileid / file_id（带下划线）
    upload_url = res.get('url')
    auth = res.get('authorization')
    token_field = res.get('token', '')
    cos_file_id = res.get('cosfileid', '')
    # 注意：字段名是 file_id（带下划线），不是 fileid
    file_id = res.get('file_id') or res.get('fileid') or ''

    if not upload_url or not auth:
        raise RuntimeError('get upload signature failed: {}'.format(res))

    # 2. 构造 multipart/form-data 上传
    boundary = '----WebKitFormBoundarypdf2word' + str(
        int(datetime.datetime.now().timestamp() * 1000))
    body_parts = []
    body_parts.append('--' + boundary)
    body_parts.append('Content-Disposition: form-data; name="key"')
    body_parts.append('')
    body_parts.append(cloud_path)
    body_parts.append('--' + boundary)
    body_parts.append('Content-Disposition: form-data; name="Signature"')
    body_parts.append('')
    body_parts.append(auth)
    body_parts.append('--' + boundary)
    body_parts.append('Content-Disposition: form-data; name="x-cos-security-token"')
    body_parts.append('')
    body_parts.append(token_field)
    body_parts.append('--' + boundary)
    body_parts.append('Content-Disposition: form-data; name="x-cos-meta-fileid"')
    body_parts.append('')
    body_parts.append(cos_file_id)
    body_parts.append('--' + boundary)
    body_parts.append(
        'Content-Disposition: form-data; name="file"; filename="{}"'.format(
            os.path.basename(cloud_path))
    )
    body_parts.append('Content-Type: application/octet-stream')
    body_parts.append('')

    head_bytes = '\r\n'.join(body_parts).encode('utf-8') + b'\r\n'
    tail_bytes = ('\r\n--' + boundary + '--\r\n').encode('utf-8')
    full_body = head_bytes + file_bytes + tail_bytes

    req = urllib.request.Request(
        upload_url,
        data=full_body,
        headers={'Content-Type': 'multipart/form-data; boundary=' + boundary},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            cos_status = resp.getcode()
            cos_body = resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as he:
        cos_status = he.code
        cos_body = he.read().decode('utf-8', errors='replace')
    except Exception as e:
        raise RuntimeError('COS upload exception: {}'.format(e))

    # COS 上传成功一般返回 204 No Content，或 200 + 空 body
    if cos_status not in (200, 204):
        raise RuntimeError('COS upload failed status={} body={}'.format(
            cos_status, cos_body[:500]))

    if not file_id:
        print('[pdf2word] WARN upload ok but no file_id. tcb/uploadfile res=',
              _safe_dump(res),
              '| cos_status=', cos_status,
              '| cos_body=', cos_body[:300])

    return file_id


def _find_openid(event, context):
    """从 event / context 多个可能位置提取 openid。返回 (openid, source)。"""
    if not isinstance(event, dict):
        event = {}
    if not isinstance(context, dict):
        context = {}

    # 1. event.wxContext.OPENID （Node wx-server-sdk 风格）
    wx_ctx = event.get('wxContext')
    if isinstance(wx_ctx, dict):
        v = wx_ctx.get('OPENID') or wx_ctx.get('openid')
        if v:
            return v, 'event.wxContext.OPENID'

    # 2. event 顶层
    for k in ('openid', 'OPENID', 'openId', 'wxOpenId'):
        v = event.get(k)
        if v:
            return v, 'event.' + k

    # 3. event.userInfo
    ui = event.get('userInfo')
    if isinstance(ui, dict):
        v = ui.get('openId') or ui.get('openid')
        if v:
            return v, 'event.userInfo.openId'

    # 4. context 顶层
    for k in ('openid', 'OPENID', 'openId', 'wxOpenId'):
        v = context.get(k)
        if v:
            return v, 'context.' + k

    # 5. context.wxContext
    wx_ctx2 = context.get('wxContext')
    if isinstance(wx_ctx2, dict):
        v = wx_ctx2.get('OPENID') or wx_ctx2.get('openid')
        if v:
            return v, 'context.wxContext.OPENID'

    # 6. context.identity
    ident = context.get('identity') or {}
    if isinstance(ident, dict):
        v = ident.get('openid') or ident.get('OPENID')
        if v:
            return v, 'context.identity.openid'

    return '', ''


# ====== PDF 处理 ======

def _extract_pdf_text(pdf_bytes, max_pages):
    """
    用 PyMuPDF 从 PDF 提取文本。
    返回 (pages_text, actual_page_count, truncated)
    pages_text: 列表，每项是一页的文本字符串
    """
    src = fitz.open(stream=pdf_bytes, filetype='pdf')
    actual_pages = src.page_count
    truncated = False
    page_count = actual_pages

    if actual_pages > max_pages:
        page_count = max_pages
        truncated = True

    pages_text = []
    for i in range(page_count):
        page = src[i]
        text = page.get_text('text')
        if text:
            pages_text.append(text.strip())

    src.close()
    return pages_text, actual_pages, truncated


def _build_docx(pages_text):
    """
    用标准库 zipfile + XML 直接生成 .docx 文件（不依赖 python-docx / lxml）。
    .docx 本质是一个 OOXML zip 包。
    返回 bytes
    """
    # 构造 document.xml 的 body 内容
    body_parts = []
    for idx, page_text in enumerate(pages_text):
        for line in page_text.split('\n'):
            text = line.strip()
            # 空行也保留一个空段落，避免排版塌陷
            body_parts.append(
                '<w:p>'
                '<w:pPr>'
                '<w:spacing w:after="120" w:line="360" w:lineRule="auto"/>'
                '<w:jc w:val="left"/>'
                '</w:pPr>'
                '<w:r>'
                '<w:rPr>'
                '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun"/>'
                '<w:sz w:val="24"/>'
                '<w:szCs w:val="24"/>'
                '</w:rPr>'
                '<w:t xml:space="preserve">{}</w:t>'
                '</w:r>'
                '</w:p>'.format(escape(text) if text else '')
            )
        # 页间空段落分隔（最后一页不加）
        if idx < len(pages_text) - 1:
            body_parts.append('<w:p/>')

    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:body>'
        + ''.join(body_parts) +
        '</w:body>'
        '</w:document>'
    )

    # docx 必备的最小文件集
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        '</Types>'
    )

    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="word/document.xml"/>'
        '</Relationships>'
    )

    word_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('word/_rels/document.xml.rels', word_rels)
        z.writestr('word/document.xml', document_xml)
    return buf.getvalue()


# ====== 云函数入口 ======

def main_handler(event, context):
    # 把 context 也转成 dict 方便统一处理
    try:
        ctx_dict = dict(context) if context else {}
    except Exception:
        ctx_dict = {}

    try:
        token = _get_access_token()
    except Exception as e:
        return _fail('TOKEN_FAILED', '获取 access_token 失败：' + str(e))

    openid, openid_source = _find_openid(event, ctx_dict)
    if not openid:
        print('[pdf2word] NO_OPENID event=', _safe_dump(event))
        print('[pdf2word] NO_OPENID context=', _safe_dump(ctx_dict))
        return _fail('NO_OPENID',
                     '无法获取 openid。event keys: {}, context keys: {}'.format(
                         list(event.keys()) if isinstance(event, dict) else type(event).__name__,
                         list(ctx_dict.keys())
                     ))

    action = (event or {}).get('action', 'convert')
    date_key = _get_date_key()

    # ── 查询额度 ──
    if action == 'quota':
        try:
            user_used, total_used = _query_quota(token, openid, date_key)
        except Exception as e:
            return _fail('DB_ERROR', '额度查询失败：' + str(e))
        return _ok(
            dailyUserUsed=user_used,
            dailyUserRemaining=max(0, DAILY_USER_LIMIT - user_used),
            dailyTotalUsed=total_used,
            dailyTotalRemaining=max(0, DAILY_TOTAL_LIMIT - total_used),
            dailyUserLimit=DAILY_USER_LIMIT,
            dailyTotalLimit=DAILY_TOTAL_LIMIT
        )

    # ── 转换操作 ──
    if action == 'convert':
        # 1. 合并额度查询
        try:
            user_used, total_used = _query_quota(token, openid, date_key)
        except Exception as e:
            return _fail('DB_ERROR', '额度查询失败：' + str(e))

        if total_used >= DAILY_TOTAL_LIMIT:
            return _fail('TOTAL_LIMIT',
                         '今日总量已用完（{}次），明天再来'.format(DAILY_TOTAL_LIMIT))
        if user_used >= DAILY_USER_LIMIT:
            return _fail('USER_LIMIT',
                         '今日你已使用{}次，明天再来'.format(DAILY_USER_LIMIT))

        # 2. 校验入参
        file_base64 = (event or {}).get('fileBase64', '') or ''
        if not file_base64:
            return _fail('NO_FILE', '未提供PDF文件')

        file_name = (event or {}).get('fileName', 'document.pdf')

        # 3. 解码 + 大小校验
        try:
            pdf_bytes = base64.b64decode(file_base64)
        except Exception:
            return _fail('BAD_FILE', '文件内容无法解码')

        if len(pdf_bytes) > MAX_PDF_SIZE:
            return _fail('FILE_TOO_LARGE',
                         'PDF文件不能超过{}MB'.format(MAX_PDF_SIZE // 1024 // 1024))

        # 4. 提取文本
        try:
            pages_text, actual_pages, truncated = _extract_pdf_text(
                pdf_bytes, MAX_PAGES)
        except Exception as e:
            return _fail('BAD_FILE', 'PDF文件无法打开：' + str(e))

        # 检查是否提取到文字（扫描件等可能提取为空）
        all_text = '\n'.join(pages_text).strip()
        if not all_text or len(all_text) < 10:
            return _fail('NO_TEXT',
                         '未能从PDF中提取到文字，可能是扫描件（纯图片PDF），建议使用OCR工具')

        # 5. 生成 .docx
        try:
            docx_bytes = _build_docx(pages_text)
        except Exception as e:
            return _fail('CONVERT_FAILED', '生成Word文件失败：' + str(e))

        # 6. 上传云存储
        base_name = _sanitize_name(
            os.path.splitext(file_name)[0] or 'document')
        cloud_path = 'pdf2word/{}/{}/{}.docx'.format(
            openid, date_key, base_name)

        try:
            file_id = _upload_to_cloud(token, cloud_path, docx_bytes)
        except Exception as e:
            print('[pdf2word] upload error:', e, '| openid:', openid)
            return _fail('UPLOAD_FAILED', '上传云存储失败：' + str(e))

        if not file_id:
            return _fail('UPLOAD_FAILED', '上传云存储失败：未返回 fileID')

        # 7. 记录使用次数
        _record_usage(token, openid, date_key, file_name, file_id,
                      len(all_text))

        # 8. 返回结果
        result = _ok(
            fileID=file_id,
            fileName=base_name + '.docx',
            fileSize=len(docx_bytes),
            charCount=len(all_text),
            pageCount=len(pages_text),
            dailyUserUsed=user_used + 1,
            dailyUserRemaining=max(0, DAILY_USER_LIMIT - user_used - 1),
            dailyTotalUsed=total_used + 1,
            dailyTotalRemaining=max(0, DAILY_TOTAL_LIMIT - total_used - 1)
        )
        if truncated:
            result['truncated'] = True
            result['maxPages'] = MAX_PAGES
            result['actualPages'] = actual_pages

        return result

    return _fail('INVALID_ACTION', '未知操作')
