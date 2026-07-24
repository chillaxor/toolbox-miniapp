/**
 * 多媒体内容安全识别（统一公共接口）
 * 封装微信开放接口 /wxa/media_check_async
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.mediaCheckAsync.html
 *
 * 能力：
 *   - media_type = 1 图片：支持 media_file（base64，不含 data: 前缀）
 *   - media_type = 2 音频：仅支持 media_url（需公网可访问的音频地址）
 *
 * openid 自动从云函数上下文（WXContext）获取，无需客户端传入，更安全。
 * 每次提交都会落库到 media_check 集合（status=submitted），
 * 待微信异步回调（mediaCheckCallback）回填 pass / risky。
 *
 * 调用方式（客户端）：
 *   wx.cloud.callFunction({
 *     name: 'mediaCheck',
 *     data: { media_type: 1, media_file: '<base64>', scene: 1 }
 *   })
 */

const cloud = require('wx-server-sdk');
const https = require('https');
const { URL } = require('url');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const CHECK_API = 'https://api.weixin.qq.com/wxa/media_check_async';

// ===== 入口 =====
exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || '';

  const media_type = event.media_type;
  const media_url = event.media_url;
  const media_file = event.media_file;
  const scene = event.scene || 1;
  const version = event.version || 2;
  const fileID = event.fileID || '';

  // 入参校验
  if (media_type !== 1 && media_type !== 2) {
    return { errcode: 40001, errmsg: 'media_type 必须是 1(图片) 或 2(音频)' };
  }
  if (media_type === 1 && !media_file && !media_url) {
    return { errcode: 40002, errmsg: '图片检测需提供 media_file 或 media_url' };
  }
  if (media_type === 2 && !media_url) {
    return { errcode: 40003, errmsg: '音频检测仅支持 media_url' };
  }

  // 获取 access_token（云开发环境自动注入，无需 appsecret）
  let accessToken;
  try {
    const tokenRes = await cloud.getAccessToken();
    accessToken = tokenRes && tokenRes.access_token;
  } catch (e) {
    return { errcode: 50001, errmsg: '获取 access_token 失败: ' + (e && e.message ? e.message : e) };
  }
  if (!accessToken) {
    return { errcode: 50001, errmsg: 'access_token 为空' };
  }

  // 组装请求体
  const body = {
    media_type: media_type,
    version: version,
    openid: openid,
    scene: scene
  };
  if (media_url) body.media_url = media_url;
  if (media_file) body.media_file = media_file;

  // 调用微信接口
  let wxResp;
  try {
    wxResp = await httpsPostJson(CHECK_API + '?access_token=' + accessToken, body);
  } catch (e) {
    return { errcode: 50002, errmsg: '请求微信接口失败: ' + (e && e.message ? e.message : e) };
  }

  // 落库（集合不存在会失败，吞掉异常不影响主流程）
  try {
    const db = cloud.database();
    await db.collection('media_check').add({
      data: {
        openid: openid,
        media_type: media_type,
        trace_id: (wxResp && wxResp.trace_id) || '',
        status: 'submitted',
        scene: scene,
        fileID: fileID,
        errcode: (wxResp && wxResp.errcode) || 0,
        errmsg: (wxResp && wxResp.errmsg) || '',
        createTime: Date.now()
      }
    });
  } catch (e) {
    // 集合可能未创建，忽略
  }

  return {
    errcode: (wxResp && wxResp.errcode) || 0,
    errmsg: (wxResp && wxResp.errmsg) || 'ok',
    trace_id: (wxResp && wxResp.trace_id) || ''
  };
};

// ===== 工具：POST JSON via https =====
function httpsPostJson(url, bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyObj);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { chunks += c; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks));
        } catch (e) {
          reject(new Error('解析微信响应失败: ' + chunks));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
