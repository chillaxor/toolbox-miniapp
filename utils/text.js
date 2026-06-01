/**
 * 文本处理工具
 */

/**
 * 统计文本信息
 * @param {string} text
 * @returns {Object}
 */
function countText(text) {
  if (!text) {
    return { totalChars: 0, charNoSpace: 0, chineseChars: 0, englishWords: 0, paragraphs: 0, lines: 0 };
  }

  var totalChars = text.length;
  var charNoSpace = text.replace(/\s/g, '').length;

  // 中文字符数
  var chineseMatch = text.match(/[\u4e00-\u9fa5]/g);
  var chineseChars = chineseMatch ? chineseMatch.length : 0;

  // 英文单词数
  var englishMatch = text.match(/[a-zA-Z]+/g);
  var englishWords = englishMatch ? englishMatch.length : 0;

  // 段落数（非空行）
  var paragraphs = text.split(/\n+/).filter(function (line) {
    return line.trim().length > 0;
  }).length;

  // 行数
  var lines = text.split('\n').length;

  return {
    totalChars: totalChars,
    charNoSpace: charNoSpace,
    chineseChars: chineseChars,
    englishWords: englishWords,
    paragraphs: paragraphs,
    lines: lines
  };
}

/**
 * 大小写转换
 * @param {string} text
 * @param {string} mode - 'upper'|'lower'|'capitalize'|'toggle'
 * @returns {string}
 */
function convertCase(text, mode) {
  if (!text) return '';

  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    case 'toggle':
      var result = '';
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c === c.toUpperCase()) {
          result += c.toLowerCase();
        } else {
          result += c.toUpperCase();
        }
      }
      return result;
    default:
      return text;
  }
}

module.exports = {
  countText: countText,
  convertCase: convertCase
};
