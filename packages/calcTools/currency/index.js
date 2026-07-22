var currencyUtil = require('../../../utils/currency.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    amount: '',
    fromIndex: 0,
    toIndex: 1,
    currencyNames: [],
    currencyCodes: [],
    result: null,
    rate: '',
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.initCurrencyList();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('currency') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('currency');
    this.setData({ isFavorite: fav });
  },

  initCurrencyList: function () {
    var list = currencyUtil.getCurrencyList();
    var names = list.map(function (c) { return c.name + ' (' + c.code + ')'; });
    var codes = list.map(function (c) { return c.code; });

    // 默认选中人民币→美元
    var fromIdx = codes.indexOf('CNY');
    var toIdx = codes.indexOf('USD');

    this.setData({
      currencyNames: names,
      currencyCodes: codes,
      fromIndex: fromIdx >= 0 ? fromIdx : 0,
      toIndex: toIdx >= 0 ? toIdx : 1
    });
  },

  onAmountInput: function (e) {
    this.setData({ amount: e.detail.value });
  },

  onFromChange: function (e) {
    this.setData({ fromIndex: e.detail.value, result: null });
  },

  onToChange: function (e) {
    this.setData({ toIndex: e.detail.value, result: null });
  },

  onSwap: function () {
    var fromIdx = this.data.fromIndex;
    var toIdx = this.data.toIndex;
    this.setData({
      fromIndex: toIdx,
      toIndex: fromIdx,
      result: null
    });
  },

  onConvert: function () {
    var amount = parseFloat(this.data.amount);
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    var fromCode = this.data.currencyCodes[this.data.fromIndex];
    var toCode = this.data.currencyCodes[this.data.toIndex];
    var convertResult = currencyUtil.convertCurrency(amount, fromCode, toCode);

    this.setData({
      result: convertResult.result,
      rate: convertResult.rate
    });

    storage.addHistory({
      toolId: 'currency',
      toolName: '汇率转换',
      category: 'life',
      summary: amount + ' ' + fromCode + ' → ' + convertResult.result + ' ' + toCode,
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: '汇率转换 - 工具箱',
      path: '/packages/calcTools/currency/index'
    };
  }
});
