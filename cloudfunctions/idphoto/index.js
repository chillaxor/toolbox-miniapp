/**
 * 证件照云函数
 * 调用百度智能云「人像分割」API，返回 alpha matte（人像遮罩）
 *
 * 接口：POST https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg
 * 鉴权：access_token（API Key + Secret Key → OAuth2.0）
 * 返回：foreground（前景图base64）或 labelmap（语义分割图）
 * 限制：可通过 MONTHLY_LIMIT 环境变量配置每月免费调用上限
 *
 * actions:
 *   segment  - 人像分割（主要功能）
 *   quota    - 查询本月额度使用情况
 */

const axios = require('axios');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== 配置区（通过云函数环境变量注入，勿硬编码） ======
const API_KEY = process.env.BAIDU_API_KEY || '';
const SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';
// 每月调用上限（百度免费额度通常为500次/月）
const MONTHLY_LIMIT = parseInt(process.env.MONTHLY_LIMIT, 10) || 500;
// 每用户每天上限（防止单用户滥用）
const DAILY_USER_LIMIT = parseInt(process.env.DAILY_USER_LIMIT, 10) || 10;

// ====== Access Token 缓存（冷启动间共享，热实例复用） ======
let tokenCache = { token: '', expireAt: 0 };

/**
 * 云函数入口
 * @param {string}  event.action       - 'segment' | 'quota'
 * @param {string}  event.imageBase64  - 图片base64（不含 data:image 前缀）
 * @param {string}  event.imageType    - 可选，'jpg'|'png'，默认 'jpg'
 */
exports.main = async (event, context) => {
  // 校验环境变量
  if (!API_KEY || !SECRET_KEY) {
    return {
      success: false,
      errorCode: 'ENV_NOT_CONFIGURED',
      errorMsg: '云函数环境变量未配置：需设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY'
    };
  }

  const db = cloud.database();
  const action = event.action || 'segment';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayKey = `${monthKey}-${String(now.getDate()).padStart(2, '0')}`;

  // 获取调用方 openid（云调用自动注入）
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || 'anonymous';

  // ── 查询额度 ──────────────────────────────────────────────
  if (action === 'quota') {
    const [monthRes, todayUserRes] = await Promise.all([
      db.collection('idphoto_usage').where({ monthKey }).count(),
      db.collection('idphoto_usage').where({ todayKey, openid }).count()
    ]);
    const used = monthRes.total || 0;
    const todayUserUsed = todayUserRes.total || 0;
    return {
      success: true,
      used,
      remaining: Math.max(0, MONTHLY_LIMIT - used),
      limit: MONTHLY_LIMIT,
      dailyUserUsed: todayUserUsed,
      dailyUserRemaining: Math.max(0, DAILY_USER_LIMIT - todayUserUsed),
      dailyUserLimit: DAILY_USER_LIMIT
    };
  }

  // ── 人像分割 ──────────────────────────────────────────────
  if (action === 'segment') {
    // 1. 检查图片数据
    if (!event.imageBase64) {
      return { success: false, errorCode: 'NO_IMAGE', errorMsg: '请提供图片数据' };
    }

    // 2. 检查月度总额度
    const monthCountRes = await db.collection('idphoto_usage').where({ monthKey }).count();
    const monthUsed = monthCountRes.total || 0;
    if (monthUsed >= MONTHLY_LIMIT) {
      return {
        success: false,
        errorCode: 'QUOTA_EXCEEDED',
        errorMsg: `本月云端AI额度已用完（${MONTHLY_LIMIT}次），请使用本地AI模式`
      };
    }

    // 3. 检查用户当天额度
    const todayUserRes = await db.collection('idphoto_usage').where({ todayKey, openid }).count();
    const todayUserUsed = todayUserRes.total || 0;
    if (todayUserUsed >= DAILY_USER_LIMIT) {
      return {
        success: false,
        errorCode: 'USER_DAILY_QUOTA_EXCEEDED',
        errorMsg: `今日使用次数已达上限（${DAILY_USER_LIMIT}次），请明天再试或使用本地AI模式`
      };
    }

    try {
      // 4. 获取百度 access_token
      const accessToken = await fetchAccessToken();

      // 5. 调用百度人像分割 API
      // body_seg 接口返回：foreground（前景RGBA图）和 scoremap（置信度图）
      const encodedImage = encodeURIComponent(event.imageBase64);
      // type=foreground: 返回去背景后的前景图（RGBA PNG base64）
      // type=scoremap: 返回灰度置信度图（值越大=越是人像）
      const apiUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg?access_token=${accessToken}`;

      const apiRes = await axios.post(
        apiUrl,
        `image=${encodedImage}&type=foreground`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000
        }
      );

      const data = apiRes.data;

      // 6. 处理百度API错误
      if (data.error_code) {
        return {
          success: false,
          errorCode: String(data.error_code),
          errorMsg: data.error_msg || '百度API调用失败'
        };
      }

      // body_seg 返回字段：foreground（前景图base64）
      if (!data.foreground) {
        return {
          success: false,
          errorCode: 'NO_RESULT',
          errorMsg: 'API未返回处理结果，请检查图片是否包含清晰人像'
        };
      }

      // 7. 记录使用次数（成功后才计数）
      await db.collection('idphoto_usage').add({
        data: {
          monthKey,
          todayKey,
          openid,
          timestamp: Date.now(),
          date: now.toISOString()
        }
      });

      return {
        success: true,
        foreground: data.foreground, // 前景图（RGBA PNG base64，背景已透明）
        logId: data.log_id,
        used: monthUsed + 1,
        remaining: Math.max(0, MONTHLY_LIMIT - monthUsed - 1),
        dailyUserUsed: todayUserUsed + 1,
        dailyUserRemaining: Math.max(0, DAILY_USER_LIMIT - todayUserUsed - 1)
      };

    } catch (err) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMsg: '请求失败: ' + (err.message || '未知错误')
      };
    }
  }

  return { success: false, errorCode: 'INVALID_ACTION', errorMsg: '未知操作: ' + action };
};

/**
 * 获取百度 Access Token（带内存缓存）
 * 有效期29天（百度30天，提前1天刷新）
 */
async function fetchAccessToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expireAt > now) {
    return tokenCache.token;
  }

  const tokenUrl =
    `https://aip.baidubce.com/oauth/2.0/token` +
    `?grant_type=client_credentials` +
    `&client_id=${API_KEY}` +
    `&client_secret=${SECRET_KEY}`;

  const res = await axios.post(tokenUrl, null, { timeout: 10000 });
  const data = res.data;

  if (!data.access_token) {
    throw new Error('获取access_token失败: ' + (data.error || data.error_description || '未知错误'));
  }

  // 缓存，提前1天（86400s）刷新
  tokenCache.token = data.access_token;
  tokenCache.expireAt = now + (data.expires_in - 86400) * 1000;

  return data.access_token;
}
