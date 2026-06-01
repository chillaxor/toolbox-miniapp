/**
 * 图片转 Base64 工具
 */

/**
 * 将图片转为 Base64 字符串
 * @param {string} filePath - 图片临时路径
 * @returns {Promise} { base64, mimeType, fileSize }
 */
function imageToBase64(filePath) {
  return new Promise(function (resolve, reject) {
    try {
      var fs = wx.getFileSystemManager();
      var stats = fs.statSync(filePath);
      var fileSize = stats.size;

      // 判断文件类型
      var ext = filePath.toLowerCase().split('.').pop();
      var mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      if (ext === 'gif') mimeType = 'image/gif';
      if (ext === 'webp') mimeType = 'image/webp';

      // 读取文件为 base64
      var base64Data = fs.readFileSync(filePath, 'base64');
      var base64Str = 'data:' + mimeType + ';base64,' + base64Data;

      resolve({
        base64: base64Str,
        rawBase64: base64Data,
        mimeType: mimeType,
        fileSize: fileSize
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

module.exports = {
  imageToBase64: imageToBase64,
  formatFileSize: formatFileSize
};
