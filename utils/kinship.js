/**
 * 亲戚称呼计算器工具函数
 */

// 关系树数据：每一步选择的关系都会改变"视角"
// self = 自己的视角（男性）
// self_f = 自己的视角（女性）
var RELATIONS = {
  male: {
    '父亲': { desc: '爸爸', goto: 'father' },
    '母亲': { desc: '妈妈', goto: 'mother' },
    '哥哥': { desc: '哥哥', goto: 'elder_brother' },
    '弟弟': { desc: '弟弟', goto: 'younger_brother' },
    '姐姐': { desc: '姐姐', goto: 'elder_sister' },
    '妹妹': { desc: '妹妹', goto: 'younger_sister' },
    '儿子': { desc: '儿子', goto: 'son' },
    '女儿': { desc: '女儿', goto: 'daughter' },
    '丈夫': { desc: '自己（丈夫）', goto: 'self' },
    '妻子': { desc: '妻子', goto: 'wife' }
  },
  female: {
    '父亲': { desc: '爸爸', goto: 'father' },
    '母亲': { desc: '妈妈', goto: 'mother' },
    '哥哥': { desc: '哥哥', goto: 'elder_brother' },
    '弟弟': { desc: '弟弟', goto: 'younger_brother' },
    '姐姐': { desc: '姐姐', goto: 'elder_sister' },
    '妹妹': { desc: '妹妹', goto: 'younger_sister' },
    '儿子': { desc: '儿子', goto: 'son' },
    '女儿': { desc: '女儿', goto: 'daughter' },
    '丈夫': { desc: '丈夫', goto: 'husband' },
    '妻子': { desc: '自己（妻子）', goto: 'self' }
  }
};

// 简化的称呼映射表：根据关系链计算最终称呼
// key: 关系路径编码, value: 称呼
var CALL_MAP = {
  // 父系
  '父亲': { male: '爸爸', female: '爸爸' },
  '母亲': { male: '妈妈', female: '妈妈' },
  '父亲的父亲': { male: '爷爷', female: '爷爷' },
  '父亲的母亲': { male: '奶奶', female: '奶奶' },
  '母亲的父亲': { male: '外公', female: '外公' },
  '母亲的母亲': { male: '外婆', female: '外婆' },
  '父亲的哥哥': { male: '伯伯', female: '伯伯' },
  '父亲的弟弟': { male: '叔叔', female: '叔叔' },
  '父亲的姐姐': { male: '姑妈', female: '姑妈' },
  '父亲的妹妹': { male: '姑姑', female: '姑姑' },
  '母亲的哥哥': { male: '舅舅', female: '舅舅' },
  '母亲的弟弟': { male: '舅舅', female: '舅舅' },
  '母亲的姐姐': { male: '姨妈', female: '姨妈' },
  '母亲的妹妹': { male: '阿姨', female: '阿姨' },
  '父亲的哥哥的儿子': { male: '堂哥/堂弟', female: '堂哥/堂弟' },
  '父亲的哥哥的女儿': { male: '堂姐/堂妹', female: '堂姐/堂妹' },
  '父亲的弟弟的儿子': { male: '堂哥/堂弟', female: '堂哥/堂弟' },
  '父亲的弟弟的女儿': { male: '堂姐/堂妹', female: '堂姐/堂妹' },
  '父亲的姐姐的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '父亲的姐姐的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  '父亲的妹妹的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '父亲的妹妹的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  '母亲的哥哥的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '母亲的哥哥的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  '母亲的弟弟的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '母亲的弟弟的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  '母亲的姐姐的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '母亲的姐姐的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  '母亲的妹妹的儿子': { male: '表哥/表弟', female: '表哥/表弟' },
  '母亲的妹妹的女儿': { male: '表姐/表妹', female: '表姐/表妹' },
  // 子女
  '儿子': { male: '儿子', female: '儿子' },
  '女儿': { male: '女儿', female: '女儿' },
  '哥哥': { male: '哥哥', female: '哥哥' },
  '弟弟': { male: '弟弟', female: '弟弟' },
  '姐姐': { male: '姐姐', female: '姐姐' },
  '妹妹': { male: '妹妹', female: '妹妹' },
  '儿子的儿子': { male: '孙子', female: '孙子' },
  '儿子的女儿': { male: '孙女', female: '孙女' },
  '女儿的儿子': { male: '外孙', female: '外孙' },
  '女儿的女儿': { male: '外孙女', female: '外孙女' },
  '哥哥的儿子': { male: '侄子', female: '侄子' },
  '哥哥的女儿': { male: '侄女', female: '侄女' },
  '弟弟的儿子': { male: '侄子', female: '侄子' },
  '弟弟的女儿': { male: '侄女', female: '侄女' },
  '姐姐的儿子': { male: '外甥', female: '外甥' },
  '姐姐的女儿': { male: '外甥女', female: '外甥女' },
  '妹妹的儿子': { male: '外甥', female: '外甥' },
  '妹妹的女儿': { male: '外甥女', female: '外甥女' }
};

/**
 * 获取可选的关系列表
 */
function getRelationOptions() {
  return ['父亲', '母亲', '哥哥', '弟弟', '姐姐', '妹妹', '儿子', '女儿', '丈夫', '妻子'];
}

/**
 * 根据关系链计算称呼
 * @param {Array} chain - 关系链，如 ['父亲', '姐姐', '儿子']
 * @param {string} gender - 'male' 或 'female'（自己的性别）
 * @returns {Object} { result: 称呼, path: 描述路径 }
 */
function calculate(chain, gender) {
  if (!chain || chain.length === 0) {
    return { result: '请选择关系', path: '' };
  }

  var pathStr = chain.join('的');
  
  // 先查表
  if (CALL_MAP[pathStr]) {
    return {
      result: CALL_MAP[pathStr][gender] || CALL_MAP[pathStr].male,
      path: '我 → ' + chain.join(' → ')
    };
  }

  // 如果超过3层关系，使用通用算法
  var result = guessRelation(chain, gender);
  return {
    result: result,
    path: '我 → ' + chain.join(' → ')
  };
}

/**
 * 通用关系推测算法
 */
function guessRelation(chain, gender) {
  var upCount = 0; // 向上辈分（父/母）
  var downCount = 0; // 向下辈分（子/女）
  var sameCount = 0; // 同辈（兄弟姐妹）

  for (var i = 0; i < chain.length; i++) {
    var r = chain[i];
    if (r === '父亲' || r === '母亲') upCount++;
    else if (r === '儿子' || r === '女儿') downCount++;
    else if (r === '哥哥' || r === '弟弟' || r === '姐姐' || r === '妹妹') sameCount++;
  }

  var level = upCount - downCount; // 正=长辈, 负=晚辈, 0=同辈

  if (level > 0) {
    if (level === 1) return sameCount > 0 ? '表/堂亲长辈' : '父/母辈';
    if (level === 2) return '祖辈';
    return '第' + level + '代长辈';
  } else if (level < 0) {
    var abs = Math.abs(level);
    if (abs === 1) return sameCount > 0 ? '侄/甥辈' : '子/女辈';
    if (abs === 2) return '孙辈';
    return '第' + abs + '代晚辈';
  } else {
    // 同辈
    if (sameCount > 0) return '堂/表兄弟姐妹';
    return '同辈亲戚';
  }
}

/**
 * 获取关系描述文本
 */
function getChainText(chain) {
  if (!chain || chain.length === 0) return '我';
  return '的' + chain.join('的');
}

module.exports = {
  getRelationOptions: getRelationOptions,
  calculate: calculate,
  getChainText: getChainText
};
