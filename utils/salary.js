/**
 * 税后工资计算逻辑
 * 使用2024年个税税率表（起征点5000元）
 * 社保公积金默认比例：养老8% + 医疗2% + 失业0.5% + 公积金7%
 */

// 个人所得税税率表（综合所得）
var TAX_BRACKETS = [
  { threshold: 0, rate: 0.03, deduction: 0 },
  { threshold: 36000, rate: 0.10, deduction: 2520 },
  { threshold: 144000, rate: 0.20, deduction: 16920 },
  { threshold: 300000, rate: 0.25, deduction: 31920 },
  { threshold: 420000, rate: 0.30, deduction: 52920 },
  { threshold: 660000, rate: 0.35, deduction: 85920 },
  { threshold: 960000, rate: 0.45, deduction: 181920 }
];

var TAX_THRESHOLD = 5000; // 起征点

// 社保默认比例
var DEFAULT_SOCIAL_RATES = {
  pension: 0.08,      // 养老保险 8%
  medical: 0.02,      // 医疗保险 2%
  unemployment: 0.005, // 失业保险 0.5%
  fund: 0.07           // 住房公积金 7%
};

/**
 * 计算税后工资
 * @param {number} grossSalary - 税前月薪
 * @param {number} socialBase - 社保缴费基数（默认=税前工资）
 * @param {number} fundBase - 公积金缴费基数（默认=税前工资）
 * @param {number} fundRate - 公积金个人缴费比例（默认7%）
 * @returns {Object}
 */
function calculateSalary(grossSalary, socialBase, fundBase, fundRate) {
  // 参数默认值处理
  socialBase = socialBase || grossSalary;
  fundBase = fundBase || grossSalary;
  fundRate = fundRate || DEFAULT_SOCIAL_RATES.fund;

  if (!grossSalary || grossSalary <= 0) {
    return {
      grossSalary: 0,
      socialInsurance: 0,
      housingFund: 0,
      taxableIncome: 0,
      incomeTax: 0,
      netSalary: 0,
      deductionDetail: {}
    };
  }

  // 计算社保
  var pension = Math.round(socialBase * DEFAULT_SOCIAL_RATES.pension * 100) / 100;
  var medical = Math.round(socialBase * DEFAULT_SOCIAL_RATES.medical * 100) / 100;
  var unemployment = Math.round(socialBase * DEFAULT_SOCIAL_RATES.unemployment * 100) / 100;
  var socialInsurance = Math.round((pension + medical + unemployment) * 100) / 100;

  // 计算公积金
  var housingFund = Math.round(fundBase * fundRate * 100) / 100;

  // 计算应纳税所得额
  var totalDeduction = socialInsurance + housingFund + TAX_THRESHOLD;
  var taxableIncome = grossSalary - totalDeduction;
  taxableIncome = Math.max(0, taxableIncome);
  taxableIncome = Math.round(taxableIncome * 100) / 100;

  // 计算个税（月度换算为年度计算再换回月度）
  var annualTaxableIncome = taxableIncome * 12;
  var annualTax = calculateAnnualTax(annualTaxableIncome);
  var incomeTax = Math.round(annualTax / 12 * 100) / 100;
  incomeTax = Math.max(0, incomeTax);

  // 税后工资
  var netSalary = Math.round((grossSalary - socialInsurance - housingFund - incomeTax) * 100) / 100;

  return {
    grossSalary: grossSalary,
    socialInsurance: socialInsurance,
    housingFund: housingFund,
    taxableIncome: taxableIncome,
    incomeTax: incomeTax,
    netSalary: netSalary,
    deductionDetail: {
      pension: pension,
      medical: medical,
      unemployment: unemployment,
      fundRate: fundRate,
      taxThreshold: TAX_THRESHOLD
    }
  };
}

/**
 * 计算年度个税
 * @param {number} annualTaxableIncome - 年度应纳税所得额
 * @returns {number} 年度个税
 */
function calculateAnnualTax(annualTaxableIncome) {
  if (annualTaxableIncome <= 0) return 0;

  var tax = 0;
  for (var i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (annualTaxableIncome > TAX_BRACKETS[i].threshold) {
      tax = annualTaxableIncome * TAX_BRACKETS[i].rate - TAX_BRACKETS[i].deduction;
      break;
    }
  }

  return Math.max(0, tax);
}

module.exports = {
  calculateSalary: calculateSalary,
  calculateAnnualTax: calculateAnnualTax,
  TAX_BRACKETS: TAX_BRACKETS,
  TAX_THRESHOLD: TAX_THRESHOLD,
  DEFAULT_SOCIAL_RATES: DEFAULT_SOCIAL_RATES
};
