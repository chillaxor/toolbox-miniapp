/**
 * BMI 计算逻辑
 * BMI = 体重(kg) / 身高(m)^2
 */

/**
 * 计算BMI
 * @param {number} height - 身高(厘米)
 * @param {number} weight - 体重(千克)
 * @returns {Object} { bmi, category, suggestion }
 */
function calculateBMI(height, weight) {
  // 参数校验
  if (!height || !weight || height <= 0 || weight <= 0) {
    return { bmi: 0, category: '数据无效', suggestion: '请输入有效的身高和体重' };
  }

  var heightM = height / 100;
  var bmi = weight / (heightM * heightM);
  bmi = Math.round(bmi * 10) / 10;

  var category = '';
  var suggestion = '';

  if (bmi < 18.5) {
    category = '偏瘦';
    suggestion = '建议适当增加营养摄入，均衡饮食，适度运动增强体质';
  } else if (bmi < 24) {
    category = '正常';
    suggestion = '恭喜！体重在正常范围内，请继续保持健康的生活方式';
  } else if (bmi < 28) {
    category = '偏胖';
    suggestion = '建议控制饮食，减少高热量食物摄入，增加有氧运动';
  } else if (bmi < 32) {
    category = '肥胖';
    suggestion = '建议咨询医生或营养师，制定科学的减重计划';
  } else {
    category = '重度肥胖';
    suggestion = '强烈建议就医，在专业指导下进行体重管理';
  }

  return {
    bmi: bmi,
    category: category,
    suggestion: suggestion
  };
}

module.exports = {
  calculateBMI: calculateBMI
};
