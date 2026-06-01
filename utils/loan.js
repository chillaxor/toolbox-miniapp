/**
 * 贷款计算器
 * 支持等额本息 / 等额本金
 */

/**
 * 等额本息计算
 * @param {number} principal - 贷款总额（万元）
 * @param {number} yearRate - 年利率（%），如 4.9
 * @param {number} months - 贷款月数
 * @returns {Object}
 */
function equalInstallment(principal, yearRate, months) {
  var P = principal * 10000; // 万元→元
  var r = yearRate / 100 / 12; // 月利率
  if (r === 0) {
    var monthly = Math.round(P / months * 100) / 100;
    return {
      monthlyPayment: monthly,
      totalPayment: Math.round(monthly * months * 100) / 100,
      totalInterest: 0,
      principal: P,
      months: months
    };
  }
  var pow = Math.pow(1 + r, months);
  var monthly = P * r * pow / (pow - 1);
  monthly = Math.round(monthly * 100) / 100;
  var totalPayment = Math.round(monthly * months * 100) / 100;
  var totalInterest = Math.round((totalPayment - P) * 100) / 100;
  return {
    monthlyPayment: monthly,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    principal: P,
    months: months
  };
}

/**
 * 等额本金计算
 * @param {number} principal - 贷款总额（万元）
 * @param {number} yearRate - 年利率（%）
 * @param {number} months - 贷款月数
 * @returns {Object}
 */
function equalPrincipal(principal, yearRate, months) {
  var P = principal * 10000;
  var r = yearRate / 100 / 12;
  var monthlyPrincipal = Math.round(P / months * 100) / 100;
  var totalInterest = 0;
  var firstMonth = 0;
  var lastMonth = 0;
  var schedule = [];

  for (var i = 0; i < months; i++) {
    var interest = (P - monthlyPrincipal * i) * r;
    interest = Math.round(interest * 100) / 100;
    var payment = Math.round((monthlyPrincipal + interest) * 100) / 100;
    totalInterest = Math.round((totalInterest + interest) * 100) / 100;
    if (i === 0) firstMonth = payment;
    if (i === months - 1) lastMonth = payment;

    // 每月递减金额
    schedule.push({
      month: i + 1,
      payment: payment,
      principal: monthlyPrincipal,
      interest: interest,
      remain: Math.max(0, P - monthlyPrincipal * (i + 1))
    });
  }

  var totalPayment = Math.round((P + totalInterest) * 100) / 100;
  var decreaseAmount = Math.round(monthlyPrincipal * r * 100) / 100;

  return {
    firstMonthPayment: firstMonth,
    lastMonthPayment: lastMonth,
    decreaseAmount: decreaseAmount,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    principal: P,
    months: months,
    schedule: schedule
  };
}

/**
 * 提前还款计算
 * @param {number} principal - 原贷款总额（万元）
 * @param {number} yearRate - 年利率（%）
 * @param {number} totalMonths - 原贷款月数
 * @param {number} paidMonths - 已还月数
 * @param {number} prepayAmount - 提前还款金额（万元）
 * @param {string} prepayType - 'reduce_month'(减少月供) 或 'reduce_term'(缩短年限)
 * @returns {Object}
 */
function prepayment(principal, yearRate, totalMonths, paidMonths, prepayAmount, prepayType) {
  var P = principal * 10000;
  var r = yearRate / 100 / 12;
  var pow = Math.pow(1 + r, totalMonths);
  var monthly = P * r * pow / (pow - 1);

  // 已还本金
  var paidPrincipal = 0;
  var remainPrincipal = P;
  for (var i = 0; i < paidMonths; i++) {
    var interest = remainPrincipal * r;
    var pp = monthly - interest;
    paidPrincipal += pp;
    remainPrincipal -= pp;
  }
  remainPrincipal = Math.round(remainPrincipal * 100) / 100;

  // 提前还款后剩余本金
  var prepay = prepayAmount * 10000;
  if (prepay > remainPrincipal) prepay = remainPrincipal;
  var afterRemain = Math.round((remainPrincipal - prepay) * 100) / 100;

  var savedInterest = 0;

  if (prepayType === 'reduce_month') {
    // 减少月供，期限不变
    var remainMonths = totalMonths - paidMonths;
    if (r === 0) {
      var newMonthly = Math.round(afterRemain / remainMonths * 100) / 100;
    } else {
      var newPow = Math.pow(1 + r, remainMonths);
      var newMonthly = afterRemain * r * newPow / (newPow - 1);
      newMonthly = Math.round(newMonthly * 100) / 100;
    }
    // 原总利息
    var origTotalInterest = Math.round((monthly * totalMonths - P) * 100) / 100;
    // 新总利息
    var newTotalInterest = Math.round((monthly * paidMonths + prepay + newMonthly * remainMonths - P) * 100) / 100;
    savedInterest = Math.max(0, Math.round((origTotalInterest - newTotalInterest) * 100) / 100);

    return {
      originalMonthly: Math.round(monthly * 100) / 100,
      newMonthly: newMonthly,
      savedInterest: savedInterest,
      afterRemain: afterRemain,
      remainMonths: remainMonths
    };
  } else {
    // 缩短年限
    var newMonths = 0;
    if (r === 0) {
      newMonths = Math.ceil(afterRemain / monthly);
    } else {
      // 月供不变，算新期限
      newMonths = Math.log(monthly / (monthly - afterRemain * r)) / Math.log(1 + r);
      newMonths = Math.ceil(newMonths);
    }
    var origTotalInterest = Math.round((monthly * totalMonths - P) * 100) / 100;
    var newTotalInterest = Math.round((monthly * (paidMonths + newMonths) + prepay - P) * 100) / 100;
    savedInterest = Math.max(0, Math.round((origTotalInterest - newTotalInterest) * 100) / 100);

    return {
      originalMonths: totalMonths,
      newMonths: newMonths,
      savedMonths: totalMonths - paidMonths - newMonths,
      savedInterest: savedInterest,
      afterRemain: afterRemain,
      monthlyPayment: Math.round(monthly * 100) / 100
    };
  }
}

/**
 * 获取常见利率列表
 */
function getCommonRates() {
  return [
    { label: '公积金(3.1%)', rate: 3.1 },
    { label: '商贷(4.2%)', rate: 4.2 },
    { label: '商贷(4.9%)', rate: 4.9 },
    { label: '二套房(4.9%)', rate: 4.9 },
    { label: '车贷(5.6%)', rate: 5.6 },
    { label: '消费贷(7.2%)', rate: 7.2 }
  ];
}

/**
 * 获取常见贷款期限
 */
function getCommonTerms() {
  return [
    { label: '1年', months: 12 },
    { label: '3年', months: 36 },
    { label: '5年', months: 60 },
    { label: '10年', months: 120 },
    { label: '15年', months: 180 },
    { label: '20年', months: 240 },
    { label: '25年', months: 300 },
    { label: '30年', months: 360 }
  ];
}

module.exports = {
  equalInstallment: equalInstallment,
  equalPrincipal: equalPrincipal,
  prepayment: prepayment,
  getCommonRates: getCommonRates,
  getCommonTerms: getCommonTerms
};
