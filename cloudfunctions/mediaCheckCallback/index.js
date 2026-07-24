/**
 * 多媒体内容安全识别 - 异步结果回调
 *
 * 微信在 /wxa/media_check_async 检测完成后，会把结果 POST 到
 * 「小程序后台 → 开发管理 → 开发设置 → 内容安全(消息校验)」里配置的回调地址。
 * 该地址应指向本云函数的 HTTP 触发入口。
 *
 * 推送报文（节选）：
 * {
 *   "ToUserName": "wx...",
 *   "FromUserName": "用户的openid",
 *   "CreateTime": 1234567890,
 *   "MsgType": "event",
 *   "Event": "wxa_media_check",
 *   "appid": "wx...",
 *   "trace_id": "xxxx",
 *   "status": 1,            // 1=命中风险  0=正常（以微信最新文档为准）
 *   "suggest": "",
 *   "version": 2,
 *   "detail": []
 * }
 *
 * 处理逻辑：
 *   1. 按 trace_id 找到 media_check 记录
 *   2. 更新 status 为 pass / risky
 *   3. 若命中风险且记录里带了 fileID（云存储文件），直接删除该文件
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  let payload = event;

  // HTTP 触发时，body 可能是字符串或包在 event.body 里
  if (typeof event === 'string') {
    try { payload = JSON.parse(event); } catch (e) { payload = {}; }
  } else if (event && typeof event.body === 'string') {
    try { payload = JSON.parse(event.body); } catch (e) { payload = event; }
  }

  const trace_id = payload && payload.trace_id;
  if (!trace_id) {
    return { ok: false, errmsg: 'missing trace_id' };
  }

  // status: 1 命中风险，0 正常（按微信文档；个别版本字段名可能不同，做了兼容）
  const rawStatus = payload.status;
  const isRisky = (rawStatus === 1 || rawStatus === '1' || /risk|unsafe|block/i.test(String(payload.suggest || '')));

  try {
    const db = cloud.database();
    const res = await db.collection('media_check').where({ trace_id: trace_id }).limit(1).get();
    if (res && res.data && res.data.length) {
      const rec = res.data[0];
      await db.collection('media_check').doc(rec._id).update({
        data: {
          status: isRisky ? 'risky' : 'pass',
          suggest: payload.suggest || '',
          rawResult: payload,
          updateTime: Date.now()
        }
      });

      // 命中风险且关联了云存储文件 → 删除违规内容
      if (isRisky && rec.fileID) {
        try {
          await cloud.deleteFile({ fileList: [rec.fileID] });
        } catch (e) {
          // 删除失败记录日志即可
          console.warn('[mediaCheckCallback] 删除违规文件失败', rec.fileID, e);
        }
      }
    }
  } catch (e) {
    console.warn('[mediaCheckCallback] 更新记录失败', e);
  }

  return { ok: true };
};
