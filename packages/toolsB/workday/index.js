var workdayUtil = require('../../../utils/workday.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    startDate: '',
    endDate: '',
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
    this.setData({ isFavorite: storage.isFavorite('workday') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('workday');
    this.setData({ isFavorite: fav });
  },

  onStartDateChange: function (e) {
    this.setData({ startDate: e.detail.value });
  },

  onEndDateChange: function (e) {
    this.setData({ endDate: e.detail.value });
  },

  onCalculate: function () {
    if (!this.data.startDate || !this.data.endDate) {
      wx.showToast({ title: '请选择起止日期', icon: 'none' });
      return;
    }

    var result = workdayUtil.calculateWorkdays(this.data.startDate, this.data.endDate);
    this.setData({ result: result });

    storage.addHistory({
      toolId: 'workday',
      toolName: '工作日计算',
      category: 'date',
      summary: this.data.startDate + ' 至 ' + this.data.endDate + ' 共' + result.workdays + '个工作日',
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: '工作日计算 - 工具箱',
      path: '/packages/toolsB/workday/index'
    };
  }
});
