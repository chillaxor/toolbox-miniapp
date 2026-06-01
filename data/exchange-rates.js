/**
 * 内置主要币种汇率数据
 * 基准：1 USD = x 货币单位
 * 数据为内置静态数据，实际使用中可手动更新
 */

const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥', rate: 7.25 },
  { code: 'USD', name: '美元', symbol: '$', rate: 1.00 },
  { code: 'EUR', name: '欧元', symbol: '€', rate: 0.92 },
  { code: 'GBP', name: '英镑', symbol: '£', rate: 0.79 },
  { code: 'JPY', name: '日元', symbol: '¥', rate: 149.50 },
  { code: 'KRW', name: '韩元', symbol: '₩', rate: 1320.00 },
  { code: 'HKD', name: '港币', symbol: 'HK$', rate: 7.82 },
  { code: 'TWD', name: '新台币', symbol: 'NT$', rate: 32.50 },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', rate: 1.34 },
  { code: 'AUD', name: '澳元', symbol: 'A$', rate: 1.53 },
  { code: 'CAD', name: '加元', symbol: 'C$', rate: 1.36 },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', rate: 0.88 },
  { code: 'THB', name: '泰铢', symbol: '฿', rate: 35.20 },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM', rate: 4.68 },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽', rate: 92.50 },
  { code: 'INR', name: '印度卢比', symbol: '₹', rate: 83.10 }
];

/**
 * 根据币种代码获取货币信息
 * @param {string} code - 币种代码
 * @returns {Object|null}
 */
function getCurrencyByCode(code) {
  for (var i = 0; i < CURRENCIES.length; i++) {
    if (CURRENCIES[i].code === code) {
      return CURRENCIES[i];
    }
  }
  return null;
}

/**
 * 获取所有币种代码列表
 * @returns {Array<string>}
 */
function getCurrencyCodes() {
  return CURRENCIES.map(function (c) { return c.code; });
}

/**
 * 获取币种名称列表（用于Picker显示）
 * @returns {Array<string>}
 */
function getCurrencyNames() {
  return CURRENCIES.map(function (c) { return c.name + ' (' + c.code + ')'; });
}

module.exports = {
  CURRENCIES: CURRENCIES,
  getCurrencyByCode: getCurrencyByCode,
  getCurrencyCodes: getCurrencyCodes,
  getCurrencyNames: getCurrencyNames
};
