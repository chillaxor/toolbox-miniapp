/**
 * 多媒体内容安全识别 - 统一公共接口（客户端）
 * --------------------------------------------------
 * 所有「用户上传图片」的入口都走这里，统一调用云函数 mediaCheck
 * （内部封装微信 /wxa/media_check_async）。
 *
 * 核心方法：
 *   - chooseImageWithCheck(options)  包装 wx.chooseImage，选图后自动提交安全审核
 *   - chooseMediaWithCheck(options)  包装 wx.chooseMedia，选图后自动提交安全审核
 *   - checkImageFile(filePath, opts) 直接对本地图片文件提交审核
 *   - checkImageBase64(base64, opts) 对 base64 图片提交审核
 *   - checkAudioFile(filePath, opts) 对本地音频文件提交审核（需先传云存储拿 URL）
 *
 * 设计要点：
 *   - /wxa/media_check_async 是【异步】接口，选图后我们「立即提交、不阻塞用户」，
 *     真正的 pass / risky 结果由微信异步回调（mediaCheckCallback）回填。
 *   - 审核提交失败 / 网络异常时「静默降级」，绝不阻断用户的正常选图流程。
 *   - options 里可带 _scene（场景值，整数）用于后台区分来源，提交后会被剔除，不传给 wx。
 *
 * 用法（在页面 Page 顶部 require）：
 *   var mediaCheck = require('../../../utils/mediaCheck.js');
 *   // 把原来的 wx.chooseImage({...}) 直接改成 mediaCheck.chooseImageWithCheck({...})
 */

var CLOUD_FUNC = 'mediaCheck';

// 去掉 base64 的 data:image/xxx;base64, 前缀（接口只接受纯 base64）
function stripDataUri(b64) {
  if (typeof b64 === 'string' && b64.indexOf('base64,') >= 0) {
    return b64.split('base64,')[1];
  }
  return b64;
}

function readFileBase64(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: function (r) { resolve(stripDataUri(r.data)); },
      fail: function (err) { reject(err); }
    });
  });
}

function callCloudCheck(data) {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: CLOUD_FUNC,
      data: data,
      success: function (res) { resolve(res.result); },
      fail: function (err) { reject(err); }
    });
  });
}

// 提交单张图片审核（静默，不阻断业务）
function checkImageFile(filePath, opts) {
  opts = opts || {};
  return readFileBase64(filePath)
    .then(function (b64) {
      return callCloudCheck({
        media_type: 1,
        media_file: b64,
        scene: opts.scene || 1,
        fileID: opts.fileID || ''
      });
    })
    .catch(function (e) {
      console.warn('[mediaCheck] 图片审核提交失败:', e);
      return null;
    });
}

function checkImageBase64(base64, opts) {
  opts = opts || {};
  return callCloudCheck({
    media_type: 1,
    media_file: stripDataUri(base64),
    scene: opts.scene || 1,
    fileID: opts.fileID || ''
  }).catch(function (e) {
    console.warn('[mediaCheck] 图片审核提交失败:', e);
    return null;
  });
}

// 音频：本地临时文件需先传云存储拿到公网 URL 才能提交
function checkAudioFile(filePath, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    var ext = (filePath.split('.').pop() || 'mp3').split('?')[0];
    var cloudPath = 'media_check/audio/' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.' + ext;
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: function (up) {
        wx.cloud.getTempFileURL({
          fileList: [up.fileID],
          success: function (urlRes) {
            var f = urlRes.fileList && urlRes.fileList[0];
            if (!f || !f.tempFileURL) { reject(new Error('获取音频URL失败')); return; }
            callCloudCheck({
              media_type: 2,
              media_url: f.tempFileURL,
              scene: opts.scene || 1,
              fileID: up.fileID
            }).then(resolve).catch(reject);
          },
          fail: reject
        });
      },
      fail: reject
    });
  }).catch(function (e) {
    console.warn('[mediaCheck] 音频审核提交失败:', e);
    return null;
  });
}

// ===== 统一包装「选图」入口 =====
function chooseImageWithCheck(options) {
  options = options || {};
  var origSuccess = options.success;
  var scene = options._scene || 1;
  var wrapped = Object.assign({}, options);
  delete wrapped._scene;
  wrapped.success = function (res) {
    if (res && res.tempFilePaths) {
      res.tempFilePaths.forEach(function (p) { checkImageFile(p, { scene: scene }); });
    }
    if (origSuccess) origSuccess(res);
  };
  wx.chooseImage(wrapped);
}

function chooseMediaWithCheck(options) {
  options = options || {};
  var origSuccess = options.success;
  var scene = options._scene || 1;
  var wrapped = Object.assign({}, options);
  delete wrapped._scene;
  wrapped.success = function (res) {
    if (res && res.tempFiles) {
      res.tempFiles.forEach(function (f) { checkImageFile(f.tempFilePath, { scene: scene }); });
    }
    if (origSuccess) origSuccess(res);
  };
  wx.chooseMedia(wrapped);
}

module.exports = {
  chooseImageWithCheck: chooseImageWithCheck,
  chooseMediaWithCheck: chooseMediaWithCheck,
  checkImageFile: checkImageFile,
  checkImageBase64: checkImageBase64,
  checkAudioFile: checkAudioFile
};
