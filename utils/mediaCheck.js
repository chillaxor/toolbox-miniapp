/**
 * 多媒体内容安全识别 - 统一公共接口（客户端）
 * --------------------------------------------------
 * 所有「用户上传图片/音频」的入口都走这里，统一调用云函数 mediaCheck
 * （内部封装微信 /wxa/media_check_async 2.0）。
 *
 * ⚠️ 2.0 接口只支持 media_url（公网URL），不支持文件直传/base64。
 *    所以图片/音频都会先上传到云存储，拿到 tempFileURL 后再提交审核。
 *
 * 核心方法：
 *   - chooseImageWithCheck(options)  包装 wx.chooseImage，选图后自动提交安全审核
 *   - chooseMediaWithCheck(options)  包装 wx.chooseMedia，选图后自动提交安全审核
 *   - checkImageFile(filePath, opts) 直接对本地图片文件提交审核
 *   - checkImageBase64(base64, opts) 对 base64 图片提交审核（先写临时文件再上传）
 *   - checkAudioFile(filePath, opts) 对本地音频文件提交审核
 *
 * 设计要点：
 *   - /wxa/media_check_async 是【异步】接口，选图后我们「立即提交、不阻塞用户」，
 *     真正的 pass / risky 结果由微信异步回调（mediaCheckCallback）回填。
 *   - 审核提交失败 / 网络异常时「静默降级」，绝不阻断用户的正常选图流程。
 *   - options 里可带 _scene（场景值，整数）用于后台区分来源，提交后会被剔除，不传给 wx。
 *
 * media_type 对照（微信官方定义）：
 *   1 = 音频
 *   2 = 图片
 *
 * 用法（在页面 Page 顶部 require）：
 *   var mediaCheck = require('../../../utils/mediaCheck.js');
 *   // 把原来的 wx.chooseImage({...}) 直接改成 mediaCheck.chooseImageWithCheck({...})
 */

var CLOUD_FUNC = 'mediaCheck';

// media_type 常量（微信官方定义：1=音频, 2=图片）
var MEDIA_TYPE_IMAGE = 2;
var MEDIA_TYPE_AUDIO = 1;

// 去掉 base64 的 data:image/xxx;base64, 前缀
function stripDataUri(b64) {
  if (typeof b64 === 'string' && b64.indexOf('base64,') >= 0) {
    return b64.split('base64,')[1];
  }
  return b64;
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

/**
 * 通用：上传文件到云存储 → 拿 tempFileURL → 提交审核
 * 图片和音频共用此逻辑。
 * @param {string} filePath  本地临时文件路径
 * @param {number} mediaType  1=音频, 2=图片
 * @param {object} opts       { scene, fileID }
 */
function uploadAndCheck(filePath, mediaType, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    var ext = (filePath.split('.').pop() || 'jpg').split('?')[0];
    var folder = mediaType === MEDIA_TYPE_IMAGE ? 'image' : 'audio';
    var cloudPath = 'media_check/' + folder + '/' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.' + ext;
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: function (up) {
        wx.cloud.getTempFileURL({
          fileList: [up.fileID],
          success: function (urlRes) {
            var f = urlRes.fileList && urlRes.fileList[0];
            if (!f || !f.tempFileURL) { reject(new Error('获取文件URL失败')); return; }
            callCloudCheck({
              media_type: mediaType,
              media_url: f.tempFileURL,
              scene: opts.scene || 1,
              fileID: opts.fileID || up.fileID
            }).then(resolve).catch(reject);
          },
          fail: reject
        });
      },
      fail: reject
    });
  }).catch(function (e) {
    console.warn('[mediaCheck] 审核提交失败:', e);
    return null;
  });
}

// 提交单张图片审核（静默，不阻断业务）
function checkImageFile(filePath, opts) {
  return uploadAndCheck(filePath, MEDIA_TYPE_IMAGE, opts);
}

// 对 base64 图片提交审核：先写入临时文件，再走上传+审核流程
function checkImageBase64(base64, opts) {
  opts = opts || {};
  var pure = stripDataUri(base64);
  var filePath = wx.env.USER_DATA_PATH + '/mc_img_' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.jpg';
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().writeFile({
      filePath: filePath,
      data: pure,
      encoding: 'base64',
      success: function () {
        uploadAndCheck(filePath, MEDIA_TYPE_IMAGE, opts).then(resolve).catch(reject);
      },
      fail: reject
    });
  }).catch(function (e) {
    console.warn('[mediaCheck] 图片审核提交失败:', e);
    return null;
  });
}

// 音频：本地临时文件上传云存储拿公网 URL 后提交审核
function checkAudioFile(filePath, opts) {
  return uploadAndCheck(filePath, MEDIA_TYPE_AUDIO, opts);
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
