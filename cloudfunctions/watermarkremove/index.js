/**
 * 去水印云函数
 * 调用百度智能云「图像修复」API
 * 自动识别并去除图片中的水印
 *
 * 接口：POST https://aip.baidubce.com/rest/2.0/image-process/v1/inpainting
 * 鉴权：access_token（API Key + Secret Key → OAuth2.0）
 * 限制：每人每天2次 + 全局每月50次（均可通过环境变量调节）
 */

const axios = require('axios');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

var API_KEY = process.env.BAIDU_API_KEY || '';
var SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';
var DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT, 10) || 2;
var TOTAL_MONTHLY_LIMIT = parseInt(process.env.TOTAL_MONTHLY_LIMIT, 10) || 50;

var tokenCache = { token: '', expireAt: 0 };

/**
 * 云函数入口
 * @param {string} event.action - 'remove' | 'quota'
 * @param {string} event.imageBase64 - 图片base64（不含data:image前缀）
 */
exports.main = async function (event) {
  if (!API_KEY || !SECRET_KEY) {
    return {
      success: false,
      errorCode: 'ENV_NOT_CONFIGURED',
      errorMsg: '云函数环境变量未配置：需设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY'
    };
  }

  var wxContext = cloud.getWXContext();
  var openid = wxContext.OPENID;
  var db = cloud.database();
  var action = event.action || 'remove';
  var now = new Date();
  var monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);
  var dateKey = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

  // ── 查询额度 ──
  if (action === 'quota') {
    var dailyRes = await db.collection('watermarkremove_usage')
      .where({ openid: openid, dateKey: dateKey })
      .count();
    var dailyUsed = dailyRes.total || 0;

    var monthlyRes = await db.collection('watermarkremove_usage')
      .where({ monthKey: monthKey })
      .count();
    var monthlyUsed = monthlyRes.total || 0;

    return {
      success: true,
      dailyUsed: dailyUsed,
      dailyRemaining: Math.max(0, DAILY_LIMIT - dailyUsed),
      dailyLimit: DAILY_LIMIT,
      monthlyUsed: monthlyUsed,
      monthlyRemaining: Math.max(0, TOTAL_MONTHLY_LIMIT - monthlyUsed),
      monthlyLimit: TOTAL_MONTHLY_LIMIT
    };
  }

  // ── 去水印操作 ──
  if (action === 'remove') {
    // 1. 检查全局月额度
    var monthlyRes2 = await db.collection('watermarkremove_usage')
      .where({ monthKey: monthKey })
      .count();
    var monthlyUsed2 = monthlyRes2.total || 0;

    if (monthlyUsed2 >= TOTAL_MONTHLY_LIMIT) {
      return {
        success: false,
        errorCode: 'QUOTA_EXCEEDED',
        errorMsg: '本月总额度已用完，下月自动恢复'
      };
    }

    // 2. 检查个人每日额度
    var dailyRes2 = await db.collection('watermarkremove_usage')
      .where({ openid: openid, dateKey: dateKey })
      .count();
    var dailyUsed2 = dailyRes2.total || 0;

    if (dailyUsed2 >= DAILY_LIMIT) {
      return {
        success: false,
        errorCode: 'DAILY_LIMIT',
        errorMsg: '今日次数已用完，明天再来吧'
      };
    }

    if (!event.imageBase64) {
      return {
        success: false,
        errorCode: 'NO_IMAGE',
        errorMsg: '请提供图片数据'
      };
    }

    // rectangle 必填：[{left, top, width, height}] 坐标基于原图像素
    var rectangle = event.rectangle;
    if (!rectangle || !Array.isArray(rectangle) || rectangle.length === 0) {
      return {
        success: false,
        errorCode: 'NO_RECTANGLE',
        errorMsg: '请先在图片上框选水印区域'
      };
    }

    try {
      var accessToken = await fetchAccessToken();
      var apiUrl = 'https://aip.baidubce.com/rest/2.0/image-process/v1/inpainting?access_token=' + accessToken;

      var apiRes = await axios.post(apiUrl, {
        image: event.imageBase64,
        rectangle: rectangle
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      var data = apiRes.data;

      if (data.error_code) {
        return {
          success: false,
          errorCode: String(data.error_code),
          errorMsg: data.error_msg || '百度API调用失败'
        };
      }

      if (!data.image) {
        return {
          success: false,
          errorCode: 'NO_RESULT',
          errorMsg: 'API未返回处理结果'
        };
      }

      await db.collection('watermarkremove_usage').add({
        data: {
          openid: openid,
          monthKey: monthKey,
          dateKey: dateKey,
          timestamp: Date.now(),
          date: now.toISOString()
        }
      });

      return {
        success: true,
        imageProcessed: data.image,
        logId: data.log_id,
        dailyUsed: dailyUsed2 + 1,
        dailyRemaining: Math.max(0, DAILY_LIMIT - dailyUsed2 - 1),
        monthlyUsed: monthlyUsed2 + 1,
        monthlyRemaining: Math.max(0, TOTAL_MONTHLY_LIMIT - monthlyUsed2 - 1)
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

async function fetchAccessToken() {
  if (tokenCache.token && tokenCache.expireAt > Date.now()) {
    return tokenCache.token;
  }

  var tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + API_KEY + '&client_secret=' + SECRET_KEY;
  var res = await axios.post(tokenUrl, null, { timeout: 10000 });
  var data = res.data;

  if (!data.access_token) {
    throw new Error('获取access_token失败: ' + (data.error_msg || '未知错误'));
  }

  tokenCache.token = data.access_token;
  tokenCache.expireAt = Date.now() + (data.expires_in - 86400) * 1000;

  return data.access_token;
}
