/**
 * 汇率转换逻辑
 * 使用内置汇率数据，支持自定义汇率
 */

var ratesData = require('../data/exchange-rates.js');
var storage = require('./storage.js');

/**
 * 汇率转换
 * @param {number} amount - 金额
 * @param {string} fromCurrency - 源币种代码
 * @param {string} toCurrency - 目标币种代码
 * @returns {Object} { result, rate }
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || amount <= 0) {
    return { result: 0, rate: 0 };
  }

  var fromRate = getRate(fromCurrency);
  var toRate = getRate(toCurrency);

  if (!fromRate || !toRate) {
    return { result: 0, rate: 0 };
  }

  // 通过USD作为中间汇率换算
  // amount in fromCurrency -> USD -> toCurrency
  var amountInUSD = amount / fromRate;
  var result = amountInUSD * toRate;
  var rate = toRate / fromRate;

  return {
    result: Math.round(result * 100) / 100,
    rate: Math.round(rate * 10000) / 10000
  };
}

/**
 * 获取汇率（优先自定义，其次内置）
 * @param {string} code - 币种代码
 * @returns {number} 对USD的汇率
 */
function getRate(code) {
  // 先查自定义汇率
  var customRates = storage.getCustomRates();
  if (customRates && customRates[code] !== undefined) {
    return customRates[code];
  }

  // 再查内置汇率
  var currency = ratesData.getCurrencyByCode(code);
  return currency ? currency.rate : 0;
}

/**
 * 获取所有币种列表
 * @returns {Array}
 */
function getCurrencyList() {
  return ratesData.CURRENCIES;
}

/**
 * 获取币种名称
 * @param {string} code - 币种代码
 * @returns {string}
 */
function getCurrencyName(code) {
  var currency = ratesData.getCurrencyByCode(code);
  return currency ? currency.name + ' (' + code + ')' : code;
}

module.exports = {
  convertCurrency: convertCurrency,
  getRate: getRate,
  getCurrencyList: getCurrencyList,
  getCurrencyName: getCurrencyName
};
