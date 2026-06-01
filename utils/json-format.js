/**
 * JSON 格式化/压缩工具
 */

/**
 * 格式化JSON
 * @param {string} jsonStr
 * @param {number} indent - 缩进空格数，默认2
 * @returns {Object} { success, result, error }
 */
function formatJSON(jsonStr, indent) {
  if (!jsonStr || !jsonStr.trim()) {
    return { success: false, result: '', error: '请输入JSON内容' };
  }

  try {
    var obj = JSON.parse(jsonStr);
    var result = JSON.stringify(obj, null, indent || 2);
    return { success: true, result: result, error: '' };
  } catch (e) {
    return { success: false, result: '', error: 'JSON格式错误：' + e.message };
  }
}

/**
 * 压缩JSON
 * @param {string} jsonStr
 * @returns {Object} { success, result, error }
 */
function minifyJSON(jsonStr) {
  if (!jsonStr || !jsonStr.trim()) {
    return { success: false, result: '', error: '请输入JSON内容' };
  }

  try {
    var obj = JSON.parse(jsonStr);
    var result = JSON.stringify(obj);
    return { success: true, result: result, error: '' };
  } catch (e) {
    return { success: false, result: '', error: 'JSON格式错误：' + e.message };
  }
}

module.exports = {
  formatJSON: formatJSON,
  minifyJSON: minifyJSON
};
