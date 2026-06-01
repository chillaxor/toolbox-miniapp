/**
 * Base64 编解码工具
 */

/**
 * Base64编码
 * @param {string} str
 * @returns {string}
 */
function encodeBase64(str) {
  if (!str) return '';

  // 微信小程序中使用内置方法
  try {
    return wx.arrayBufferToBase64(new TextEncoder().encode(str).buffer);
  } catch (e) {
    // 降级方案：手动实现
    var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var result = '';
    var i = 0;

    while (i < str.length) {
      var a = str.charCodeAt(i++);
      var b = i < str.length ? str.charCodeAt(i++) : 0;
      var c = i < str.length ? str.charCodeAt(i++) : 0;

      var bitmap = (a << 16) | (b << 8) | c;

      result += base64Chars.charAt((bitmap >> 18) & 63);
      result += base64Chars.charAt((bitmap >> 12) & 63);
      result += i > str.length + 1 ? '=' : base64Chars.charAt((bitmap >> 6) & 63);
      result += i > str.length ? '=' : base64Chars.charAt(bitmap & 63);
    }

    return result;
  }
}

/**
 * Base64解码
 * @param {string} base64Str
 * @returns {Object} { success, result, error }
 */
function decodeBase64(base64Str) {
  if (!base64Str || !base64Str.trim()) {
    return { success: false, result: '', error: '请输入Base64字符串' };
  }

  try {
    var arrayBuffer = wx.base64ToArrayBuffer(base64Str.trim());
    // 将 ArrayBuffer 转为字符串
    var uint8Array = new Uint8Array(arrayBuffer);
    var result = '';
    for (var i = 0; i < uint8Array.length; i++) {
      result += String.fromCharCode(uint8Array[i]);
    }
    return { success: true, result: result, error: '' };
  } catch (e) {
    return { success: false, result: '', error: 'Base64解码失败：' + e.message };
  }
}

module.exports = {
  encodeBase64: encodeBase64,
  decodeBase64: decodeBase64
};
