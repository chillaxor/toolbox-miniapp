/**
 * 多媒体内容安全识别（统一公共接口）
 * 封装微信开放接口 /wxa/media_check_async (2.0)
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/server/API/sec-center/sec-check/api_mediacheckasync.html
 *
 * 能力：
 *   - media_type = 2 图片：传 media_url（公网可访问的图片 URL）
 *   - media_type = 1 音频：传 media_url（公网可访问的音频 URL）
 *
 * ⚠️ 2.0 接口只支持 media_url，不支持文件直传/base64。
 *    客户端需先把文件上传到云存储，拿到 tempFileURL 后再传入。
 *
 * openid 自动从云函数上下文（WXContext）获取，无需客户端传入，更安全。
 *
 * access_token 获取方式：wx-server-sdk 2.6.3 未暴露 cloud.getAccessToken()，
 * 故改用标准 cgi-bin/token 接口：appid 取自 WXContext（开放平台注入），
 * appsecret 取自云函数环境变量 WX_APP_SECRET（与项目内 BAIDU_API_KEY 同一套配置）。
 * 部署时需在云函数配置里加上 WX_APP_SECRET（小程序 AppSecret）。
 *
 * 每次提交都会落库到 media_check 集合（status=submitted），
 * 待微信异步回调（mediaCheckCallback）回填 pass / risky。
 *
 * 调用方式（客户端）：
 *   wx.cloud.callFunction({
 *     name: 'mediaCheck',
 *     data: { media_type: 2, media_url: 'https://...', scene: 1 }
 *   })
 */

const cloud = require('wx-server-sdk');
const https = require('https');
const { URL } = require('url');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const CHECK_API = 'https://api.weixin.qq.com/wxa/media_check_async';
const TOKEN_API = 'https://api.weixin.qq.com/cgi-bin/token';

// ===== 入口 =====
exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || '';

  const media_type = event.media_type;   // 1=音频, 2=图片
  const media_url = event.media_url;     // 公网可访问的 URL（必填）
  const scene = event.scene || 1;
  const version = event.version || 2;
  const fileID = event.fileID || '';

  // 入参校验
  if (media_type !== 1 && media_type !== 2) {
    return { errcode: 40001, errmsg: 'media_type 必须是 1(音频) 或 2(图片)' };
  }
  if (!media_url) {
    return { errcode: 40002, errmsg: '需提供 media_url（图片/音频的公网可访问URL）' };
  }

  // 获取 access_token：wx-server-sdk 2.6.3 未暴露 cloud.getAccessToken()，
  // 改用标准 cgi-bin/token 接口（appid 取上下文、appsecret 取环境变量）。
  let accessToken;
  try {
    accessToken = await fetchAccessToken(wxContext);
  } catch (e) {
    return { errcode: 50001, errmsg: '获取 access_token 失败: ' + (e && e.message ? e.message : e) };
  }
  if (!accessToken) {
    return { errcode: 50001, errmsg: 'access_token 为空，请检查云函数环境变量 WX_APP_SECRET 是否已配置' };
  }

  // 组装请求体（2.0 接口只接受 media_url，不支持文件直传）
  const body = {
    media_type: media_type,
    version: version,
    openid: openid,
    scene: scene,
    media_url: media_url
  };

  // ===== 调试日志：打印发给微信的请求数据 =====
  console.log('[mediaCheck] >>> 请求微信接口 URL:', CHECK_API + '?access_token=' + (accessToken ? accessToken.slice(0, 8) + '***(' + accessToken.length + '字符)' : 'EMPTY'));
  console.log('[mediaCheck] >>> 请求 body(JSON):', JSON.stringify({
    media_type: body.media_type,
    version: body.version,
    openid: body.openid ? body.openid.slice(0, 6) + '***' : 'EMPTY',
    scene: body.scene,
    media_url: body.media_url ? body.media_url.slice(0, 80) + '...' : 'EMPTY'
  }));
  console.log('[mediaCheck] >>> body 字段类型: media_type=' + typeof body.media_type + '(' + body.media_type + '), version=' + typeof body.version + '(' + body.version + '), scene=' + typeof body.scene + '(' + body.scene + '), openid=' + (body.openid ? body.openid.slice(0, 6) + '***' : 'EMPTY') + ', media_url=' + (body.media_url ? body.media_url.slice(0, 60) + '...' : 'EMPTY'));

  // 调用微信接口
  let wxResp;
  try {
    wxResp = await httpsPostJson(CHECK_API + '?access_token=' + accessToken, body);
  } catch (e) {
    return { errcode: 50002, errmsg: '请求微信接口失败: ' + (e && e.message ? e.message : e) };
  }
  console.log('[mediaCheck] <<< 微信返回:', JSON.stringify(wxResp));

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

// ===== 工具：access_token 获取 + 缓存 =====
let tokenCache = { token: '', expireAt: 0 };

/**
 * 用 appid + appsecret 换 access_token（标准 cgi-bin/token 接口）
 * wx-server-sdk 2.6.3 未暴露 cloud.getAccessToken()，故自行实现。
 * @param {object} wxContext - cloud.getWXContext() 返回值
 */
async function fetchAccessToken(wxContext) {
  const appid = (wxContext && (wxContext.APPID || wxContext.appid)) || process.env.WX_APPID || '';
  const appsecret = process.env.WX_APP_SECRET || '';
  if (!appid || !appsecret) {
    throw new Error('缺少 appid 或 appsecret（需在云函数环境变量配置 WX_APP_SECRET）');
  }
  // 命中有效缓存，直接复用
  if (tokenCache.token && tokenCache.expireAt > Date.now()) {
    return tokenCache.token;
  }
  const url = TOKEN_API + '?grant_type=client_credential&appid=' +
    encodeURIComponent(appid) + '&secret=' + encodeURIComponent(appsecret);
  const res = await httpsGetJson(url);
  if (!res || !res.access_token) {
    throw new Error('微信返回: ' + JSON.stringify(res || {}));
  }
  tokenCache.token = res.access_token;
  // 提前 5 分钟过期，避开边界失效
  const expiresIn = parseInt(res.expires_in, 10) || 7200;
  tokenCache.expireAt = Date.now() + (expiresIn - 300) * 1000;
  return res.access_token;
}

// ===== 工具：GET JSON via https =====
function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { chunks += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch (e) { reject(new Error('解析 token 响应失败: ' + chunks)); }
      });
    }).on('error', reject);
  });
}

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
