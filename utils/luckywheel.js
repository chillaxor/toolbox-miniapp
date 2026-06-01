/**
 * 大转盘/抽签助手 - 核心逻辑
 */

var PRESET_TEMPLATES = {
  'lunch': {
    name: '午餐吃什么',
    options: ['火锅', '烧烤', '面条', '米饭', '汉堡', '沙拉', '饺子', '麻辣烫']
  },
  'decision': {
    name: '帮我做决定',
    options: ['做', '不做', '明天再说', '交给命运', '再想想', '就现在']
  },
  'treat': {
    name: '谁请客',
    options: ['你请', '我请', 'AA', '请他', '下次吧', '摇骰子定']
  },
  'activity': {
    name: '周末干啥',
    options: ['看电影', '逛街', '宅家', '运动', '旅行', '学习', '打游戏', '约朋友']
  }
};

/**
 * 获取预设模板列表
 */
function getPresets() {
  var keys = Object.keys(PRESET_TEMPLATES);
  var result = [];
  for (var i = 0; i < keys.length; i++) {
    result.push({
      id: keys[i],
      name: PRESET_TEMPLATES[keys[i]].name,
      options: PRESET_TEMPLATES[keys[i]].options.slice(),
      preview: PRESET_TEMPLATES[keys[i]].options.slice(0, 4).join(' / ') + (PRESET_TEMPLATES[keys[i]].options.length > 4 ? ' ...' : '')
    });
  }
  return result;
}

/**
 * 计算转盘结果索引
 * @param {number} itemCount - 选项数量
 * @param {number} finalAngle - 最终旋转角度（度）
 * @returns {number} 选中的索引
 */
function getResultIndex(itemCount, finalAngle) {
  var sliceAngle = 360 / itemCount;
  // 转盘从顶部(12点方向)开始，顺时针
  var normalizedAngle = (360 - (finalAngle % 360)) % 360;
  return Math.floor(normalizedAngle / sliceAngle) % itemCount;
}

/**
 * 生成旋转动画参数
 * @param {number} targetIndex - 目标扇区索引
 * @param {number} itemCount - 总选项数
 * @param {number} spins - 旋转圈数（3-6圈）
 * @returns {Object} { startAngle, endAngle, duration }
 */
function generateSpinParams(targetIndex, itemCount, spins) {
  var sliceAngle = 360 / itemCount;
  // 目标角度：让指针指向目标扇区中间
  var targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
  // 加上额外旋转圈数
  var totalRotation = spins * 360 + targetAngle;
  // 随机微调，不总是正中间
  totalRotation += (Math.random() - 0.5) * sliceAngle * 0.6;

  return {
    startAngle: 0,
    endAngle: totalRotation,
    duration: 3000 + spins * 500 // 3-6秒
  };
}

/**
 * 扇区颜色列表
 */
var SLICE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA'
];

function getSliceColor(index) {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}

module.exports = {
  getPresets: getPresets,
  getResultIndex: getResultIndex,
  generateSpinParams: generateSpinParams,
  getSliceColor: getSliceColor,
  SLICE_COLORS: SLICE_COLORS
};
