var storage = require('../../../utils/storage.js');

Page({
  data: {
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    result: null,
    isFavorite: false
  },

  onLoad: function () {
    var now = new Date();
    var today = this.formatDate(now);
    var time = this.formatTime(now);
    this.setData({
      startDate: today,
      startTime: time,
      endDate: today,
      endTime: time,
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('timediff') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('timediff');
    this.setData({ isFavorite: fav });
  },

  formatDate: function (d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  },

  formatTime: function (d) {
    var h = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    return h + ':' + min;
  },

  onStartDateChange: function (e) {
    this.setData({ startDate: e.detail.value });
  },

  onStartTimeChange: function (e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndDateChange: function (e) {
    this.setData({ endDate: e.detail.value });
  },

  onEndTimeChange: function (e) {
    this.setData({ endTime: e.detail.value });
  },

  onSwap: function () {
    this.setData({
      startDate: this.data.endDate,
      startTime: this.data.endTime,
      endDate: this.data.startDate,
      endTime: this.data.startTime
    });
  },

  onCalculate: function () {
    var sd = this.data.startDate;
    var st = this.data.startTime;
    var ed = this.data.endDate;
    var et = this.data.endTime;

    if (!sd || !st || !ed || !et) {
      wx.showToast({ title: '请选择完整日期时间', icon: 'none' });
      return;
    }

    var start = new Date(sd + 'T' + st + ':00');
    var end = new Date(ed + 'T' + et + ':00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      wx.showToast({ title: '日期时间格式错误', icon: 'none' });
      return;
    }

    var diffMs = Math.abs(end.getTime() - start.getTime());
    var isNegative = end.getTime() < start.getTime();

    var totalSeconds = Math.floor(diffMs / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    // 精确年月日计算
    var earlier = start < end ? start : end;
    var later = start < end ? end : start;

    var years = later.getFullYear() - earlier.getFullYear();
    var months = later.getMonth() - earlier.getMonth();
    var dayDiff = later.getDate() - earlier.getDate();

    if (dayDiff < 0) {
      months--;
      var prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
      dayDiff += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // 计算周数和剩余天数
    var weeks = Math.floor(days / 7);
    var remainDays = days % 7;

    // 总共多少个工作日（简化计算，周一到周五）
    var workdays = 0;
    var tmpDate = new Date(earlier.getTime());
    while (tmpDate < later) {
      var dow = tmpDate.getDay();
      if (dow !== 0 && dow !== 6) {
        workdays++;
      }
      tmpDate.setDate(tmpDate.getDate() + 1);
    }

    var result = {
      years: years,
      months: months,
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      weeks: weeks,
      remainDays: remainDays,
      workdays: workdays,
      totalHours: Math.floor(totalSeconds / 3600),
      totalMinutes: Math.floor(totalSeconds / 60),
      totalSeconds: totalSeconds,
      isNegative: isNegative
    };

    this.setData({ result: result });

    storage.addHistory({
      toolId: 'timediff',
      toolName: '时间差计算',
      category: 'date',
      summary: sd + ' ' + st + ' ~ ' + ed + ' ' + et + ' = ' + days + '天',
      timestamp: Date.now()
    });
  },

  onSetToday: function (which) {
    var now = new Date();
    var data = {};
    data[which + 'Date'] = this.formatDate(now);
    data[which + 'Time'] = this.formatTime(now);
    this.setData(data);
  },

  onSetNowStart: function () {
    this.onSetToday('start');
  },

  onSetNowEnd: function () {
    this.onSetToday('end');
  },

  onShareAppMessage: function () {
    return {
      title: '时间差计算 - 工具箱',
      path: '/pages/tools/timediff/index'
    };
  }
});
