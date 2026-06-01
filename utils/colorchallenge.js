/**
 * 色感挑战 - 核心算法
 * 生成色块网格，其中一个颜色略有不同
 */

/**
 * 生成一轮色块数据
 * @param {number} round - 当前轮次（从1开始）
 * @returns {Object} { gridSize, baseColor, diffColor, diffIndex }
 */
function generateRound(round) {
  // 网格大小随轮次增长：2→3→3→4→4→5→5→6...
  var gridSize = Math.min(2 + Math.floor((round + 1) / 2), 8);

  // 色差随轮次缩小
  var diffLevel = Math.max(5, 50 - round * 4);

  // 随机基础颜色（HSL）
  var h = Math.floor(Math.random() * 360);
  var s = 50 + Math.floor(Math.random() * 40); // 50-90%
  var l = 40 + Math.floor(Math.random() * 30); // 40-70%

  var baseColor = 'hsl(' + h + ',' + s + '%,' + l + '%)';

  // 不同色块：随机偏移亮度或色相
  var diffH = h;
  var diffS = s;
  var diffL = l;
  var pick = Math.floor(Math.random() * 3);
  if (pick === 0) {
    // 偏移亮度
    diffL = Math.min(95, Math.max(5, l + (Math.random() > 0.5 ? diffLevel : -diffLevel)));
  } else if (pick === 1) {
    // 偏移色相
    diffH = (h + (Math.random() > 0.5 ? diffLevel : -diffLevel) + 360) % 360;
  } else {
    // 偏移饱和度
    diffS = Math.min(100, Math.max(10, s + (Math.random() > 0.5 ? diffLevel : -diffLevel)));
  }

  var diffColor = 'hsl(' + diffH + ',' + diffS + '%,' + diffL + '%)';

  // 随机位置
  var totalCells = gridSize * gridSize;
  var diffIndex = Math.floor(Math.random() * totalCells);

  return {
    gridSize: gridSize,
    baseColor: baseColor,
    diffColor: diffColor,
    diffIndex: diffIndex,
    diffLevel: diffLevel
  };
}

/**
 * 根据通过的轮数评级
 */
function getRating(round) {
  if (round <= 2) return { level: '色弱', emoji: '😅', desc: '再多练练，色感有待提升' };
  if (round <= 5) return { level: '正常', emoji: '👍', desc: '色感正常，继续挑战' };
  if (round <= 10) return { level: '优秀', emoji: '🔥', desc: '色感敏锐，视觉达人' };
  if (round <= 15) return { level: '大神', emoji: '👑', desc: '顶级色感，千里挑一' };
  return { level: '超神', emoji: '🌈', desc: '超越人类极限的色感' };
}

module.exports = {
  generateRound: generateRound,
  getRating: getRating
};
