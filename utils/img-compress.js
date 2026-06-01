/**
 * 图片压缩工具
 * 使用 Canvas 重绘方式压缩图片
 */

/**
 * 压缩图片
 * @param {string} filePath - 图片临时路径
 * @param {Object} options - 压缩选项 { quality: 0-1, maxWidth: 最大宽度 }
 * @returns {Promise} { tempFilePath, originalSize, compressedSize, compressRatio }
 */
function compressImage(filePath, options) {
  options = options || {};
  var quality = options.quality || 0.5;
  var maxWidth = options.maxWidth || 1080;

  return new Promise(function (resolve, reject) {
    // 获取图片信息
    wx.getImageInfo({
      src: filePath,
      success: function (info) {
        var width = info.width;
        var height = info.height;

        // 计算缩放
        var scale = 1;
        if (width > maxWidth) {
          scale = maxWidth / width;
        }
        var targetWidth = Math.floor(width * scale);
        var targetHeight = Math.floor(height * scale);

        // 创建 canvas 绘制
        var canvasId = 'compressCanvas';
        var query = wx.createSelectorQuery();
        query.select('#' + canvasId).fields({ node: true, size: true }).exec(function (res) {
          if (!res || !res[0]) {
            // 降级方案：使用 wx.compressImage
            wx.compressImage({
              src: filePath,
              quality: Math.round(quality * 100),
              success: function (compressRes) {
                resolve({
                  tempFilePath: compressRes.tempFilePath,
                  originalSize: 0,
                  compressedSize: 0,
                  compressRatio: 0
                });
              },
              fail: function (err) {
                reject(err);
              }
            });
            return;
          }

          var canvas = res[0].node;
          var ctx = canvas.getContext('2d');
          var dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = targetWidth * dpr;
          canvas.height = targetHeight * dpr;
          ctx.scale(dpr, dpr);

          var img = canvas.createImage();
          img.onload = function () {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            wx.canvasToTempFilePath({
              canvas: canvas,
              quality: quality,
              destWidth: targetWidth,
              destHeight: targetHeight,
              success: function (tempRes) {
                resolve({
                  tempFilePath: tempRes.tempFilePath,
                  originalSize: 0,
                  compressedSize: 0,
                  compressRatio: 0
                });
              },
              fail: function (err) {
                reject(err);
              }
            });
          };
          img.src = filePath;
        });
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取文件大小
 * @param {string} filePath
 * @returns {Promise<number>}
 */
function getFileSize(filePath) {
  return new Promise(function (resolve) {
    try {
      var fs = wx.getFileSystemManager();
      var stats = fs.statSync(filePath);
      resolve(stats.size);
    } catch (e) {
      resolve(0);
    }
  });
}

/**
 * 格式化文件大小
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

module.exports = {
  compressImage: compressImage,
  getFileSize: getFileSize,
  formatFileSize: formatFileSize
};
