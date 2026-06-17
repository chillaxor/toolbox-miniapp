/**
 * 试卷擦除云函数
 * 调用百度智能云「文档去手写」API
 * 擦除试卷图片中的手写笔迹，还原空白试卷
 *
 * 接口：POST https://aip.baidubce.com/rest/2.0/ocr/v1/remove_handwriting
 * 鉴权：access_token（API Key + Secret Key → OAuth2.0）
 * 限制：每月50次免费额度，超出提示暂不可用
 */

const axios = require('axios');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== 配置区（通过云函数环境变量注入，勿硬编码） ======
const API_KEY = process.env.BAIDU_API_KEY || '';
const SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';
const MONTHLY_LIMIT = parseInt(process.env.MONTHLY_LIMIT, 10) || 50;

// ====== Access Token 缓存 ======
let tokenCache = { token: '', expireAt: 0 };

/**
 * 云函数入口
 * @param {string} event.action  - 'clean' | 'quota'
 * @param {string} event.imageBase64 - 图片base64（不含data:image前缀）
 */
exports.main = async (event, context) => {
  // 校验环境变量是否已配置
  if (!API_KEY || !SECRET_KEY) {
    return {
      success: false,
      errorCode: 'ENV_NOT_CONFIGURED',
      errorMsg: '云函数环境变量未配置：需设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY'
    };
  }

  const db = cloud.database();
  const action = event.action || 'clean';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

  // ── 查询额度 ──
  if (action === 'quota') {
    const countRes = await db.collection('paperclean_usage')
      .where({ monthKey })
      .count();
    const used = countRes.total || 0;
    return {
      success: true,
      used,
      remaining: MONTHLY_LIMIT - used,
      limit: MONTHLY_LIMIT
    };
  }

  // ── 擦除操作 ──
  if (action === 'clean') {
    // 1. 检查月额度
    const countRes = await db.collection('paperclean_usage')
      .where({ monthKey })
      .count();
    const used = countRes.total || 0;

    if (used >= MONTHLY_LIMIT) {
      return {
        success: false,
        errorCode: 'QUOTA_EXCEEDED',
        errorMsg: '本月免费额度已用完（50次），该功能暂不可用'
      };
    }

    // 2. 验证图片数据
    if (!event.imageBase64) {
      return {
        success: false,
        errorCode: 'NO_IMAGE',
        errorMsg: '请提供图片数据'
      };
    }

    // 3. 获取百度 access_token
    try {
      const accessToken = await fetchAccessToken();

      // 4. 调用百度去手写API
      const encodedImage = encodeURIComponent(event.imageBase64);
      const apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/remove_handwriting?access_token=${accessToken}`;

      const apiRes = await axios.post(apiUrl, `image=${encodedImage}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000
      });

      const data = apiRes.data;

      // 5. 处理百度API返回
      if (data.error_code) {
        return {
          success: false,
          errorCode: String(data.error_code),
          errorMsg: data.error_msg || '百度API调用失败'
        };
      }

      if (!data.image_processed) {
        return {
          success: false,
          errorCode: 'NO_RESULT',
          errorMsg: 'API未返回处理结果'
        };
      }

      // 6. 成功 → 记录使用次数
      await db.collection('paperclean_usage').add({
        data: {
          monthKey,
          timestamp: Date.now(),
          date: now.toISOString()
        }
      });

      return {
        success: true,
        imageProcessed: data.image_processed,
        logId: data.log_id,
        used: used + 1,
        remaining: MONTHLY_LIMIT - used - 1
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

/**
 * 获取百度 Access Token（带缓存）
 * 有效期30天，提前1天刷新
 */
async function fetchAccessToken() {
  if (tokenCache.token && tokenCache.expireAt > Date.now()) {
    return tokenCache.token;
  }

  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;

  const res = await axios.post(tokenUrl, null, { timeout: 10000 });
  const data = res.data;

  if (!data.access_token) {
    throw new Error('获取access_token失败: ' + (data.error_msg || '未知错误'));
  }

  // 缓存，提前1天刷新
  tokenCache.token = data.access_token;
  tokenCache.expireAt = Date.now() + (data.expires_in - 86400) * 1000;

  return data.access_token;
}