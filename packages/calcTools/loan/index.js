var loanUtil = require('../../../utils/loan.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    principal: '100',
    yearRate: '4.2',
    months: 360,
    method: 'equal_installment',
    isFavorite: false,
    result: null,
    commonRates: [],
    commonTerms: []
  },

  onLoad: function () {
    this.setData({
      commonRates: loanUtil.getCommonRates(),
      commonTerms: loanUtil.getCommonTerms()
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('loan') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('loan');
    this.setData({ isFavorite: fav });
  },

  onPrincipalInput: function (e) {
    this.setData({ principal: e.detail.value });
  },

  onRateInput: function (e) {
    this.setData({ yearRate: e.detail.value });
  },

  onRateSelect: function (e) {
    var rate = e.currentTarget.dataset.rate;
    this.setData({ yearRate: String(rate) });
  },

  onTermSelect: function (e) {
    var months = e.currentTarget.dataset.months;
    this.setData({ months: months });
  },

  onMethodChange: function (e) {
    this.setData({ method: e.currentTarget.dataset.method });
  },

  onCalculate: function () {
    var principal = parseFloat(this.data.principal);
    var yearRate = parseFloat(this.data.yearRate);
    var months = this.data.months;

    if (!principal || principal <= 0) {
      wx.showToast({ title: '请输入贷款金额', icon: 'none' });
      return;
    }
    if (!yearRate || yearRate < 0) {
      wx.showToast({ title: '请输入年利率', icon: 'none' });
      return;
    }

    var result;
    if (this.data.method === 'equal_installment') {
      result = loanUtil.equalInstallment(principal, yearRate, months);
      result.methodName = '等额本息';
    } else {
      result = loanUtil.equalPrincipal(principal, yearRate, months);
      result.methodName = '等额本金';
    }
    result.principalWan = principal;
    result.yearRatePercent = yearRate;
    result.monthsLabel = this.formatMonths(months);
    result.totalPaymentWan = (result.totalPayment / 10000).toFixed(2);
    result.totalInterestWan = (result.totalInterest / 10000).toFixed(2);

    this.setData({ result: result });

    var summary = principal + '万 ' + result.methodName + ' → 月供' + (result.monthlyPayment || result.firstMonthPayment) + '元';
    storage.addHistory({
      toolId: 'loan',
      toolName: '贷款计算器',
      category: 'life',
      summary: summary,
      timestamp: Date.now()
    });
  },

  formatMonths: function (m) {
    if (m % 12 === 0) return (m / 12) + '年';
    return m + '个月';
  },

  onShareAppMessage: function () {
    return {
      title: '贷款计算器 - 工具箱',
      path: '/packages/calcTools/loan/index'
    };
  }
});
