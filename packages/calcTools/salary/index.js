var salaryUtil = require('../../../utils/salary.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    grossSalary: '',
    socialBase: '',
    fundBase: '',
    fundRate: '',
    result: null,
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('salary') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('salary');
    this.setData({ isFavorite: fav });
  },

  onGrossSalaryInput: function (e) { this.setData({ grossSalary: e.detail.value }); },
  onSocialBaseInput: function (e) { this.setData({ socialBase: e.detail.value }); },
  onFundBaseInput: function (e) { this.setData({ fundBase: e.detail.value }); },
  onFundRateInput: function (e) { this.setData({ fundRate: e.detail.value }); },

  onCalculate: function () {
    var grossSalary = parseFloat(this.data.grossSalary);
    if (!grossSalary || grossSalary <= 0) {
      wx.showToast({ title: '请输入税前月薪', icon: 'none' });
      return;
    }

    var socialBase = this.data.socialBase ? parseFloat(this.data.socialBase) : grossSalary;
    var fundBase = this.data.fundBase ? parseFloat(this.data.fundBase) : grossSalary;
    var fundRate = this.data.fundRate ? parseFloat(this.data.fundRate) / 100 : 0.07;

    if (fundRate <= 0 || fundRate > 0.12) {
      wx.showToast({ title: '公积金比例范围1%-12%', icon: 'none' });
      return;
    }

    var result = salaryUtil.calculateSalary(grossSalary, socialBase, fundBase, fundRate);
    this.setData({ result: result });

    storage.addHistory({
      toolId: 'salary',
      toolName: '税后工资',
      category: 'life',
      summary: '税前¥' + grossSalary + ' → 税后¥' + result.netSalary,
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: '税后工资计算 - 工具箱',
      path: '/packages/calcTools/salary/index'
    };
  }
});
