/**
 * 多媒体内容安全识别 - 异步结果回调
 *
 * 推荐接法（云函数消息推送模式，官方推荐、最省事）：
 *   云开发控制台 → 设置 → 其他设置 → 消息推送
 *     推送模式 = 云函数
 *     消息类型 = event        （对应收包的 MsgType）
 *     事件类型 = wxa_media_check（异步安全校验事件）
 *     云函数   = mediaCheckCallback
 *   配置后，微信会直接把【解密后的 JSON 对象】作为 event 传进来，
 *   无需 Token / EncodingAESKey / 验签 / AES 解密 / HTTP 触发。
 *
 * 官方回调 JSON（event 直接就是这个）结构：
 * {
 *   "ToUserName":"gh_xxx","FromUserName":"oXxx","CreateTime":123,
 *   "MsgType":"event","Event":"wxa_media_check",
 *   "appid":"wx...","trace_id":"60f96f1d-...","version":2,
 *   "errcode":0,"errmsg":"ok",
 *   "result":{ "suggest":"pass","label":100 },
 *   "detail":[ { "strategy":"content_model","errcode":0,
 *                "suggest":"pass","label":100,"prob":90 } ]
 * }
 * suggest 取值：pass（正常）/ risky（违规）/ review（需人工）。
 *
 * 兜底：若仍用旧「开发者服务器 / HTTP 触发」模式部署，本函数也能处理
 *   （GET echostr 验证、明文 / 安全加密两种模式）。那种模式才需要
 *   WX_MSG_TOKEN / WX_MSG_AESKEY 环境变量。
 */

const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  let obj;

  // 云函数消息推送模式：event 直接是 JSON 对象
  const isHttpTrigger = !!(event && (event.httpMethod || event.queryString || event.isBase64Encoded !== undefined));
  if (!isHttpTrigger) {
    obj = (event && typeof event === 'object') ? event : {};
  } else {
    // 兜底：旧 HTTP 触发模式（开发者服务器），需验签 / 解密
    obj = await decodeHttp(event);
    if (!obj) return 'success';
  }

  // ===== 调试日志：打印收到的回调数据 =====
  console.log('[mediaCheckCallback] 收到推送, Event=' + (obj.Event || '?') + ', trace_id=' + (obj.trace_id || '?') + ', errcode=' + (obj.errcode !== undefined ? obj.errcode : '?'));
  console.log('[mediaCheckCallback] 完整数据:', JSON.stringify(obj).slice(0, 500));

  const trace_id = obj.trace_id;
  if (!trace_id) {
    console.warn('[mediaCheckCallback] 缺少 trace_id，跳过。MsgType=' + obj.MsgType + ', Event=' + obj.Event);
    return 'success';
  }

  // 微信文档：errcode 仅当为 0 时结果有效；-1008 表示下载错误
  const wxErrcode = obj.errcode;
  let status, suggest, label;

  if (wxErrcode && wxErrcode !== 0) {
    // 微信侧出错（如 -1008 下载失败），结果无效
    status = 'error';
    suggest = '';
    label = 0;
    console.warn('[mediaCheckCallback] 微信返回错误 errcode=' + wxErrcode + ', errmsg=' + obj.errmsg + ', trace_id=' + trace_id);
  } else {
    status = classify(obj);          // 'pass' | 'risky' | 'review' | 'unknown'
    suggest =
      (obj.result && obj.result.suggest) ||
      (obj.detail && obj.detail[0] && obj.detail[0].suggest) ||
      obj.suggest || '';
    label =
      (obj.result && obj.result.label) ||
      (obj.detail && obj.detail[0] && obj.detail[0].label) || 0;
    console.log('[mediaCheckCallback] 审核结果: status=' + status + ', suggest=' + suggest + ', label=' + label + ', trace_id=' + trace_id);
  }

  const isRisky = status === 'risky';  // 仅 risky 命中才删云存储文件

  try {
    const db = cloud.database();
    const res = await db.collection('media_check').where({ trace_id: trace_id }).limit(1).get();
    if (res && res.data && res.data.length) {
      const rec = res.data[0];
      await db.collection('media_check').doc(rec._id).update({
        data: {
          status: status,
          suggest: suggest,
          label: label,
          rawResult: obj,
          updateTime: Date.now()
        }
      });
      console.log('[mediaCheckCallback] DB 更新成功, rec._id=' + rec._id + ', status=' + status);
      // 命中风险且关联了云存储文件 → 删除违规内容
      if (isRisky && rec.fileID) {
        try {
          await cloud.deleteFile({ fileList: [rec.fileID] });
          console.log('[mediaCheckCallback] 已删除违规文件:', rec.fileID);
        } catch (e) {
          console.warn('[mediaCheckCallback] 删除违规文件失败', rec.fileID, e && e.message);
        }
      }
    } else {
      // 提交记录缺失（如提交时集合不存在导致写入失败），这里补建一条，保证结果可追溯
      console.warn('[mediaCheckCallback] 未找到 trace_id=' + trace_id + ' 对应的提交记录，尝试补建');
      try {
        await db.collection('media_check').add({
          data: {
            openid: (obj.userInfo && obj.userInfo.openId) || '',
            trace_id: trace_id,
            status: status,
            suggest: suggest,
            label: label,
            rawResult: obj,
            createTime: Date.now(),
            updateTime: Date.now()
          }
        });
        console.log('[mediaCheckCallback] 已补建记录, trace_id=' + trace_id + ', status=' + status);
        // 注：补建的记录没有 fileID（提交时未落库），risky 时无法自动删文件，仅保留结果可追溯
      } catch (e) {
        console.warn('[mediaCheckCallback] 补建记录失败', e && e.message);
      }
    }
  } catch (e) {
    console.warn('[mediaCheckCallback] 更新记录失败', e && e.message);
  }

  return 'success';
};

// ============ 兜底：HTTP 触发（开发者服务器）模式 ============
// 仅当用旧模式部署时才走到这里；云函数消息推送模式不会进此分支。
async function decodeHttp(event) {
  const qs = event.queryString || event.queryStringParameters || {};
  const method = (event.httpMethod || '').toUpperCase();
  const isGet = method === 'GET' || (!method && Object.prototype.hasOwnProperty.call(qs, 'echostr'));
  const token = process.env.WX_MSG_TOKEN || '';
  const aesKey = process.env.WX_MSG_AESKEY || '';

  if (isGet) {
    if (!token || verifySignature(token, [token, qs.timestamp, qs.nonce], qs.signature)) {
      return qs.echostr || 'success';
    }
    return 'verify failed';
  }

  const rawBody = typeof event.body === 'string' ? event.body : '';
  try {
    const isSecure = qs.encrypt_type === 'aes' || /"Encrypt"\s*:|<Encrypt>/.test(rawBody);
    if (!isSecure) {
      if (token && !verifySignature(token, [token, qs.timestamp, qs.nonce], qs.signature)) {
        throw new Error('明文模式 signature 校验失败');
      }
      return parseBody(rawBody);
    }
    const encrypt = extractEncrypt(rawBody);
    if (!encrypt) throw new Error('缺少 Encrypt 字段');
    if (!token || !aesKey) throw new Error('安全模式需配置 WX_MSG_TOKEN / WX_MSG_AESKEY');
    if (!verifySignature(token, [token, qs.timestamp, qs.nonce, encrypt], qs.msg_signature)) {
      throw new Error('msg_signature 校验失败');
    }
    return parseBody(aesDecrypt(aesKey, encrypt));
  } catch (e) {
    console.warn('[mediaCheckCallback] 解析推送失败', e && e.message);
    return null;
  }
}

// ===== 解析 body（优先 JSON，XML 兜底） =====
function parseBody(text) {
  if (!text) return {};
  const t = text.trim();
  if (t.startsWith('{')) {
    try { return JSON.parse(t); } catch (e) { return {}; }
  }
  return extractAllTags(t);
}

// ===== 判定结果：pass / risky / review =====
function classify(o) {
  const suggest = String(
    (o.result && o.result.suggest) ||
    (o.detail && o.detail[0] && o.detail[0].suggest) ||
    o.suggest || ''
  ).toLowerCase();
  if (suggest === 'risky') return 'risky';
  if (suggest === 'pass') return 'pass';
  if (suggest === 'review') return 'review';
  if (o.isrisky === 1) return 'risky';
  if (o.isrisky === 0) return 'pass';
  return 'unknown';
}

// ===== 签名校验（token/timestamp/nonce[/encrypt] 字典序拼接后 sha1） =====
function verifySignature(token, parts, expect) {
  if (!expect) return false;
  const sorted = parts
    .filter(p => p !== undefined && p !== null)
    .map(String)
    .sort();
  const calc = crypto.createHash('sha1').update(sorted.join('')).digest('hex');
  return calc === String(expect);
}

// ===== 提取 Encrypt 字段（兼容 JSON / XML） =====
function extractEncrypt(body) {
  if (!body) return '';
  if (body.indexOf('<Encrypt>') !== -1) {
    const m = body.match(/<Encrypt>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/Encrypt>|<Encrypt>(.*?)<\/Encrypt>/s);
    return m ? (m[1] || m[2] || '') : '';
  }
  try {
    const o = JSON.parse(body);
    return o.Encrypt || '';
  } catch (e) {
    return '';
  }
}

// ===== AES-256-CBC 解密 =====
// EncodingAESKey（43 字符）尾部补 '=' 做 base64 解码 → 32 字节 key；IV = key 前 16 字节
// 解密后 FullStr = random(16B) + msgLen(4B,BE) + msg + appid
function aesDecrypt(encodingAESKey, encryptB64) {
  const key = Buffer.from(encodingAESKey + '=', 'base64');
  const iv = key.slice(0, 16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.from(encryptB64, 'base64');
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const msgLen = decrypted.readUInt32BE(16);
  const msg = decrypted.slice(20, 20 + msgLen).toString('utf8');
  return msg;
}

// ===== 简易 XML 标签提取（兜底用） =====
function extractAllTags(xml) {
  const o = {};
  const re = /<(\w+)>\s*<!\[CDATA\[(.*?)\]\]>\s*<|(\w+)>(.*?)<\/\3>/g;
  let m;
  while ((m = re.exec(xml))) {
    const tag = m[1] || m[3];
    const val = (m[2] !== undefined ? m[2] : m[4]) || '';
    o[tag] = isNaN(Number(val)) ? val : Number(val);
  }
  return o;
}
