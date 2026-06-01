var storage = require('../../../utils/storage.js');

Page({
  data: {
    eventName: '',
    targetDate: '',
    result: null,
    timer: null,
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('countdown') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('countdown');
    this.setData({ isFavorite: fav });
  },

  onEventInput: function (e) {
    this.setData({ eventName: e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ targetDate: e.detail.value });
  },

  onStartCountdown: function () {
    if (!this.data.targetDate) {
      wx.showToast({ title: '请选择目标日期', icon: 'none' });
      return;
    }

    var self = this;
    this.calculateCountdown();

    // 每秒更新
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    var timer = setInterval(function () {
      self.calculateCountdown();
    }, 1000);
    this.setData({ timer: timer });
  },

  calculateCountdown: function () {
    var target = new Date(this.data.targetDate + 'T00:00:00');
    var now = new Date();
    var diff = target.getTime() - now.getTime();
    var isPast = diff < 0;
    var absDiff = Math.abs(diff);

    var days = Math.floor(absDiff / 86400000);
    var hours = Math.floor((absDiff % 86400000) / 3600000);
    var minutes = Math.floor((absDiff % 3600000) / 60000);
    var seconds = Math.floor((absDiff % 60000) / 1000);

    this.setData({
      result: {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        isPast: isPast
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '倒计时 - 工具箱',
      path: '/pages/tools/countdown/index'
    };
  }
});
