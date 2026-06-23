/**
 * 试卷擦除云函数
 * 支持两个 provider：
 *   - baidu:  百度智能云「文档去手写」API
 *   - youdao: 有道智云「试卷手写体擦除」API
 *
 * 限制：每人每天2次 + 全局每月50次
 */

const axios = require('axios');
const crypto = require('crypto');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== 百度配置（通过云函数环境变量注入） ======
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';

// ====== 有道配置（通过云函数环境变量注入） ======
const YOUDAO_APP_KEY = process.env.YOUDAO_APP_KEY || '';
const YOUDAO_APP_SECRET = process.env.YOUDAO_APP_SECRET || '';

// ====== 额度配置 ======
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT, 10) || 2;
const TOTAL_MONTHLY_LIMIT = parseInt(process.env.TOTAL_MONTHLY_LIMIT, 10) || 50;

// ====== 百度 Access Token 缓存 ======
let tokenCache = { token: '', expireAt: 0 };

/**
 * 云函数入口
 * @param {string} event.action    - 'clean' | 'quota'
 * @param {string} event.provider  - 'baidu' | 'youdao'（默认 baidu）
 * @param {string} event.imageBase64 - 图片base64（不含data:image前缀）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();
  const action = event.action || 'clean';
  const provider = event.provider || 'baidu';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  // ── 查询额度 ──
  if (action === 'quota') {
    const dailyRes = await db.collection('paperclean_usage')
      .where({ openid, dateKey })
      .count();
    const dailyUsed = dailyRes.total || 0;

    const monthlyRes = await db.collection('paperclean_usage')
      .where({ monthKey })
      .count();
    const monthlyUsed = monthlyRes.total || 0;

    return {
      success: true,
      dailyUsed,
      dailyRemaining: Math.max(0, DAILY_LIMIT - dailyUsed),
      dailyLimit: DAILY_LIMIT,
      monthlyUsed,
      monthlyRemaining: Math.max(0, TOTAL_MONTHLY_LIMIT - monthlyUsed),
      monthlyLimit: TOTAL_MONTHLY_LIMIT,
      baiduAvailable: !!(BAIDU_API_KEY && BAIDU_SECRET_KEY),
      youdaoAvailable: !!(YOUDAO_APP_KEY && YOUDAO_APP_SECRET)
    };
  }

  // ── 擦除操作 ──
  if (action === 'clean') {
    // 1. 检查全局月额度
    const monthlyRes = await db.collection('paperclean_usage')
      .where({ monthKey })
      .count();
    const monthlyUsed = monthlyRes.total || 0;

    if (monthlyUsed >= TOTAL_MONTHLY_LIMIT) {
      return {
        success: false,
        errorCode: 'QUOTA_EXCEEDED',
        errorMsg: '本月总额度已用完，下月自动恢复'
      };
    }

    // 2. 检查个人每日额度
    const dailyRes = await db.collection('paperclean_usage')
      .where({ openid, dateKey })
      .count();
    const dailyUsed = dailyRes.total || 0;

    if (dailyUsed >= DAILY_LIMIT) {
      return {
        success: false,
        errorCode: 'DAILY_LIMIT',
        errorMsg: '今日次数已用完，明天再来吧'
      };
    }

    // 3. 验证图片数据
    if (!event.imageBase64) {
      return {
        success: false,
        errorCode: 'NO_IMAGE',
        errorMsg: '请提供图片数据'
      };
    }

    // 4. 根据 provider 调用对应 API
    try {
      var imageProcessed, logId;

      if (provider === 'youdao') {
        var result = await callYoudaoApi(event.imageBase64);
        imageProcessed = result.imageProcessed;
        logId = result.requestId;
      } else {
        var result = await callBaiduApi(event.imageBase64);
        imageProcessed = result.imageProcessed;
        logId = result.logId;
      }

      // 5. 成功 → 记录使用次数
      await db.collection('paperclean_usage').add({
        data: {
          openid,
          monthKey,
          dateKey,
          provider,
          timestamp: Date.now(),
          date: now.toISOString()
        }
      });

      return {
        success: true,
        imageProcessed: imageProcessed,
        logId: logId,
        provider: provider,
        dailyUsed: dailyUsed + 1,
        dailyRemaining: Math.max(0, DAILY_LIMIT - dailyUsed - 1),
        monthlyUsed: monthlyUsed + 1,
        monthlyRemaining: Math.max(0, TOTAL_MONTHLY_LIMIT - monthlyUsed - 1)
      };

    } catch (err) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMsg: '请求失败: ' + (err.message || '未知错误')
      };
    }
  }

  return { success: false, errorCode: 'INVALID_ACTION', errorMsg: '未知操作' };
};

// ==================== 百度 API ====================

async function callBaiduApi(imageBase64) {
  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
    throw new Error('百度 API 未配置：需设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
  }

  const accessToken = await fetchBaiduAccessToken();
  const encodedImage = encodeURIComponent(imageBase64);
  const apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/remove_handwriting?access_token=${accessToken}`;

  const apiRes = await axios.post(apiUrl, `image=${encodedImage}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000
  });

  const data = apiRes.data;

  if (data.error_code) {
    throw new Error(data.error_msg || '百度API调用失败 (code: ' + data.error_code + ')');
  }

  if (!data.image_processed) {
    throw new Error('API未返回处理结果');
  }

  return { imageProcessed: data.image_processed, logId: data.log_id };
}

/**
 * 获取百度 Access Token（带缓存）
 */
async function fetchBaiduAccessToken() {
  if (tokenCache.token && tokenCache.expireAt > Date.now()) {
    return tokenCache.token;
  }

  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;

  const res = await axios.post(tokenUrl, null, { timeout: 10000 });
  const data = res.data;

  if (!data.access_token) {
    throw new Error('获取access_token失败: ' + (data.error_msg || '未知错误'));
  }

  tokenCache.token = data.access_token;
  tokenCache.expireAt = Date.now() + (data.expires_in - 86400) * 1000;

  return data.access_token;
}

// ==================== 有道 API ====================

async function callYoudaoApi(imageBase64) {
  if (!YOUDAO_APP_KEY || !YOUDAO_APP_SECRET) {
    throw new Error('有道 API 未配置：需设置 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET');
  }

  var salt = crypto.randomBytes(16).toString('hex');
  var curtime = String(Math.floor(Date.now() / 1000));

  // input 计算规则：q 长度 > 20 时取前10 + 长度 + 后10，否则直接用 q
  var input;
  if (imageBase64.length > 20) {
    input = imageBase64.substring(0, 10) + String(imageBase64.length) + imageBase64.substring(imageBase64.length - 10);
  } else {
    input = imageBase64;
  }

  // sign = sha256(appKey + input + salt + curtime + appSecret)
  var signStr = YOUDAO_APP_KEY + input + salt + curtime + YOUDAO_APP_SECRET;
  var sign = crypto.createHash('sha256').update(signStr, 'utf8').digest('hex');

  var params = new URLSearchParams();
  params.append('appKey', YOUDAO_APP_KEY);
  params.append('q', imageBase64);
  params.append('salt', salt);
  params.append('curtime', curtime);
  params.append('sign', sign);
  params.append('signType', 'v3');

  var apiRes = await axios.post('https://openapi.youdao.com/ocr_writing_erase', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 60000
  });

  var data = apiRes.data;

  if (data.errorCode && data.errorCode !== '0') {
    var errorMap = {
      '101': '缺少必填参数',
      '108': '应用ID无效',
      '110': '无有效服务实例，请在有道智云控制台绑定',
      '113': '图片数据为空',
      '202': '签名校验失败',
      '206': '时间戳无效',
      '411': '访问频率受限',
      '45001': '未接收到图片',
      '45002': '图片过大',
      '45003': '图片擦除失败',
      '45004': '不支持的角度类型'
    };
    throw new Error(errorMap[data.errorCode] || '有道API错误 (code: ' + data.errorCode + ')');
  }

  if (!data.eraseEnhanceImg) {
    throw new Error('有道API未返回擦除结果');
  }

  return { imageProcessed: data.eraseEnhanceImg, requestId: data.requestId };
}