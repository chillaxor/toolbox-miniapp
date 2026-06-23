/**
 * PDF转Word云函数
 * 基于有道智云「PDF转Word」API
 * 文档：https://ai.youdao.com/DOCSIRMA/html/ocr/api/pdf-wd/
 *
 * 限额配置在云函数环境变量中：
 *   DAILY_USER_LIMIT  - 每人每天次数（默认 1）
 *   DAILY_TOTAL_LIMIT - 全局每天总量（默认 20）
 *
 * 流程：upload → 轮询 query → download
 */

const axios = require('axios');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== 有道配置（通过云函数环境变量注入） ======
const YOUDAO_APP_KEY = process.env.YOUDAO_APP_KEY || '';
const YOUDAO_APP_SECRET = process.env.YOUDAO_APP_SECRET || '';

// ====== 额度配置（全部从云函数环境变量读取，修改后需重新部署） ======
const DAILY_USER_LIMIT = parseInt(process.env.DAILY_USER_LIMIT, 10) || 1;
const DAILY_TOTAL_LIMIT = parseInt(process.env.DAILY_TOTAL_LIMIT, 10) || 20;

const URL_UPLOAD = 'https://openapi.youdao.com/file_convert/upload';
const URL_QUERY = 'https://openapi.youdao.com/file_convert/query';
const URL_DOWNLOAD = 'https://openapi.youdao.com/file_convert/download';

// ====== 错误码表 ======
const ERROR_MAP = {
  '101': '缺少必填参数',
  '108': '应用ID无效',
  '110': '无有效服务实例，请在有道智云控制台绑定',
  '202': '签名校验失败',
  '203': 'IP不在白名单',
  '206': '时间戳无效',
  '207': '重放请求',
  '401': '账户已欠费',
  '411': '访问频率受限，请稍后再试',
  '412': '长请求过于频繁',
  '18001': '需要参数',
  '18002': '需要流水号',
  '18003': '需要文件名',
  '18004': '需要文件类型',
  '18007': '需要翻译文件',
  '18008': '上传文件失败',
  '18009': '错误的流水号',
  '18010': '未完成',
  '18011': '转换失败',
  '18012': '找不到文件',
  '18013': '需要文件下载类型',
  '18015': '不支持的文件类型',
  '18016': '不支持的下载类型',
  '18017': '文件过大'
};

// ====== 工具函数 ======

/**
 * 截断 input：长度 <=20 直接用；否则前10 + 长度 + 后10
 */
function truncate(q) {
  if (q == null) return '';
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10);
}

/**
 * 生成 UUID（无横线）
 */
function uuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * SHA-256 签名
 */
function sha256(str) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * 翻译错误码
 */
function mapError(code) {
  return ERROR_MAP[code] || ('有道API错误 (code: ' + code + ')');
}

// ====== 有道 API 调用 ======

async function callYoudaoUpload(fileBase64, fileName) {
  if (!YOUDAO_APP_KEY || !YOUDAO_APP_SECRET) {
    throw { errorCode: 'NO_CONFIG', errorMsg: '有道API未配置：需设置 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET' };
  }
  const salt = uuid();
  const curtime = String(Math.floor(Date.now() / 1000));
  const signStr = YOUDAO_APP_KEY + truncate(fileBase64) + salt + curtime + YOUDAO_APP_SECRET;
  const sign = sha256(signStr);

  const params = new URLSearchParams();
  params.append('q', fileBase64);
  params.append('fileName', fileName);
  params.append('fileType', 'pdf');
  params.append('appKey', YOUDAO_APP_KEY);
  params.append('salt', salt);
  params.append('curtime', curtime);
  params.append('sign', sign);
  params.append('docType', 'json');
  params.append('signType', 'v3');

  const res = await axios.post(URL_UPLOAD, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 60000
  });

  const data = res.data;
  if (data.errorCode !== '0') {
    throw { errorCode: data.errorCode, errorMsg: mapError(data.errorCode) };
  }
  return data.flownumber;
}

async function callYoudaoQuery(flownumber) {
  const salt = uuid();
  const curtime = String(Math.floor(Date.now() / 1000));
  const signStr = YOUDAO_APP_KEY + truncate(flownumber) + salt + curtime + YOUDAO_APP_SECRET;
  const sign = sha256(signStr);

  const params = new URLSearchParams();
  params.append('flownumber', flownumber);
  params.append('appKey', YOUDAO_APP_KEY);
  params.append('salt', salt);
  params.append('curtime', curtime);
  params.append('sign', sign);
  params.append('docType', 'json');
  params.append('signType', 'v3');

  const res = await axios.post(URL_QUERY, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000
  });

  return res.data;
}

async function callYoudaoDownload(flownumber) {
  const salt = uuid();
  const curtime = String(Math.floor(Date.now() / 1000));
  const signStr = YOUDAO_APP_KEY + truncate(flownumber) + salt + curtime + YOUDAO_APP_SECRET;
  const sign = sha256(signStr);

  const params = new URLSearchParams();
  params.append('flownumber', flownumber);
  params.append('downloadFileType', 'word');
  params.append('appKey', YOUDAO_APP_KEY);
  params.append('salt', salt);
  params.append('curtime', curtime);
  params.append('sign', sign);
  params.append('docType', 'json');
  params.append('signType', 'v3');

  const res = await axios.post(URL_DOWNLOAD, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 120000,
    responseType: 'arraybuffer'
  });

  // 检查Content-Type判断是否成功
  const contentType = res.headers['content-type'] || '';
  if (contentType.indexOf('application/json') !== -1) {
    // 失败时返回JSON
    const errText = Buffer.from(res.data).toString('utf-8');
    let errData;
    try { errData = JSON.parse(errText); } catch (e) { errData = {}; }
    throw { errorCode: errData.errorCode || 'UNKNOWN', errorMsg: mapError(errData.errorCode) };
  }
  return Buffer.from(res.data);
}

/**
 * 轮询查询直到完成或失败
 */
async function pollUntilDone(flownumber) {
  const maxAttempts = 60; // 最多60次
  const interval = 2000;  // 每次间隔2秒，总计最多2分钟

  for (let i = 0; i < maxAttempts; i++) {
    const data = await callYoudaoQuery(flownumber);
    if (data.errorCode !== '0') {
      throw { errorCode: data.errorCode, errorMsg: mapError(data.errorCode) };
    }
    const status = parseInt(data.status, 10);
    if (status === 4) {
      return; // 已完成
    }
    if (status === -1 || status === -2 || status === -4 || status === -5 || status === -11) {
      throw { errorCode: 'CONVERT_FAILED', errorMsg: '有道转换失败（status=' + status + '）' };
    }
    await new Promise(function (resolve) { setTimeout(resolve, interval); });
  }
  throw { errorCode: 'TIMEOUT', errorMsg: '转换超时，请稍后重试' };
}

// ====== 云函数入口 ======

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();
  const action = event.action || 'convert';
  const now = new Date();
  const dateKey = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

  // ── 查询额度 ──
  if (action === 'quota') {
    const dailyUserRes = await db.collection('pdf2word_usage')
      .where({ openid, dateKey })
      .count();
    const dailyTotalRes = await db.collection('pdf2word_usage')
      .where({ dateKey })
      .count();
    const userUsed = dailyUserRes.total || 0;
    const totalUsed = dailyTotalRes.total || 0;
    return {
      success: true,
      youdaoAvailable: !!(YOUDAO_APP_KEY && YOUDAO_APP_SECRET),
      dailyUserUsed: userUsed,
      dailyUserLimit: DAILY_USER_LIMIT,
      dailyUserRemaining: Math.max(0, DAILY_USER_LIMIT - userUsed),
      dailyTotalUsed: totalUsed,
      dailyTotalLimit: DAILY_TOTAL_LIMIT,
      dailyTotalRemaining: Math.max(0, DAILY_TOTAL_LIMIT - totalUsed)
    };
  }

  // ── 转换操作 ──
  if (action === 'convert') {
    // 1. 检查全局每日总量
    const totalRes = await db.collection('pdf2word_usage').where({ dateKey }).count();
    const totalUsed = totalRes.total || 0;
    if (totalUsed >= DAILY_TOTAL_LIMIT) {
      return {
        success: false,
        errorCode: 'TOTAL_LIMIT',
        errorMsg: '今日总量已用完（' + DAILY_TOTAL_LIMIT + '次），明天再来'
      };
    }

    // 2. 检查个人每日额度
    const userRes = await db.collection('pdf2word_usage').where({ openid, dateKey }).count();
    const userUsed = userRes.total || 0;
    if (userUsed >= DAILY_USER_LIMIT) {
      return {
        success: false,
        errorCode: 'USER_LIMIT',
        errorMsg: '今日你已使用 ' + DAILY_USER_LIMIT + ' 次，明天再来'
      };
    }

    // 3. 校验入参
    if (!event.fileBase64) {
      return { success: false, errorCode: 'NO_FILE', errorMsg: '未提供PDF文件' };
    }
    const fileName = event.fileName || ('document_' + Date.now() + '.pdf');
    const fileBase64 = event.fileBase64;

    try {
      // 4. upload
      const flownumber = await callYoudaoUpload(fileBase64, fileName);

      // 5. 轮询 query 直到完成
      await pollUntilDone(flownumber);

      // 6. download
      const fileBuffer = await callYoudaoDownload(flownumber);

      // 7. 记录使用次数
      await db.collection('pdf2word_usage').add({
        data: {
          openid,
          dateKey,
          fileName,
          timestamp: Date.now(),
          date: now.toISOString()
        }
      });

      // 8. 把Word文件上传到云存储，返回fileID
      const uploadRes = await cloud.uploadFile({
        cloudPath: 'pdf2word/' + openid + '/' + Date.now() + '_' + fileName.replace(/\.pdf$/i, '') + '.docx',
        fileContent: fileBuffer
      });

      return {
        success: true,
        fileID: uploadRes.fileID,
        fileName: fileName.replace(/\.pdf$/i, '') + '.docx',
        fileSize: fileBuffer.length,
        dailyUserUsed: userUsed + 1,
        dailyUserRemaining: Math.max(0, DAILY_USER_LIMIT - userUsed - 1),
        dailyTotalUsed: totalUsed + 1,
        dailyTotalRemaining: Math.max(0, DAILY_TOTAL_LIMIT - totalUsed - 1)
      };
    } catch (err) {
      return {
        success: false,
        errorCode: err.errorCode || 'NETWORK_ERROR',
        errorMsg: err.errorMsg || ('请求失败: ' + (err.message || '未知错误'))
      };
    }
  }

  return { success: false, errorCode: 'INVALID_ACTION', errorMsg: '未知操作' };
};
