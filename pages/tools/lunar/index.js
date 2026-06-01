var lunarUtil = require('../../../utils/lunar.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    mode: 'solar2lunar', // solar2lunar 或 lunar2solar
    solarYear: 2026,
    solarMonth: 5,
    solarDay: 29,
    lunarYear: 2026,
    lunarMonth: 1,
    lunarDay: 1,
    isLeap: false,
    result: null,
    isFavorite: false
  },

  onLoad: function () {
    var now = new Date();
    this.setData({
      solarYear: now.getFullYear(),
      solarMonth: now.getMonth() + 1,
      solarDay: now.getDate()
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('lunar') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('lunar');
    this.setData({ isFavorite: fav });
  },

  switchMode: function (e) {
    this.setData({ mode: e.currentTarget.dataset.mode, result: null });
  },

  onSolarDateChange: function (e) {
    var parts = e.detail.value.split('-');
    this.setData({
      solarYear: parseInt(parts[0]),
      solarMonth: parseInt(parts[1]),
      solarDay: parseInt(parts[2])
    });
  },

  onLunarYearInput: function (e) {
    this.setData({ lunarYear: parseInt(e.detail.value) || 2026 });
  },

  onLunarMonthInput: function (e) {
    this.setData({ lunarMonth: parseInt(e.detail.value) || 1 });
  },

  onLunarDayInput: function (e) {
    this.setData({ lunarDay: parseInt(e.detail.value) || 1 });
  },

  onConvert: function () {
    var result = null;

    if (this.data.mode === 'solar2lunar') {
      result = lunarUtil.solarToLunar(this.data.solarYear, this.data.solarMonth, this.data.solarDay);
      result.type = 'solar2lunar';
      result.sourceDate = this.data.solarYear + '年' + this.data.solarMonth + '月' + this.data.solarDay + '日';

      storage.addHistory({
        toolId: 'lunar',
        toolName: '农历转换',
        category: 'date',
        summary: result.sourceDate + ' → ' + result.lunarMonthName + result.lunarDayName,
        timestamp: Date.now()
      });
    } else {
      result = lunarUtil.lunarToSolar(this.data.lunarYear, this.data.lunarMonth, this.data.lunarDay, this.data.isLeap);
      result.type = 'lunar2solar';
      result.lunarSource = '农历' + this.data.lunarYear + '年' + this.data.lunarMonth + '月' + this.data.lunarDay + '日';

      storage.addHistory({
        toolId: 'lunar',
        toolName: '农历转换',
        category: 'date',
        summary: result.lunarSource + ' → ' + result.year + '年' + result.month + '月' + result.day + '日',
        timestamp: Date.now()
      });
    }

    this.setData({ result: result });
  },

  onShareAppMessage: function () {
    return {
      title: '农历转换 - 工具箱',
      path: '/pages/tools/lunar/index'
    };
  }
});
