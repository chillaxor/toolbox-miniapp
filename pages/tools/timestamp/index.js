var storage = require('../../../utils/storage.js');

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatDateTime(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate()) + ' ' + padZero(d.getHours()) + ':' + padZero(d.getMinutes()) + ':' + padZero(d.getSeconds());
}

Page({
  data: {
    isFavorite: false,
    currentTs: '',
    currentDt: '',
    mode: 'ts2date',
    inputVal: '',
    result: '',
    unit: 'ms',
    dateStr: '',
    timeStr: ''
  },

  onLoad: function () {
    this.checkFavorite();
    this.refreshCurrent();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('timestamp') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('timestamp');
    this.setData({ isFavorite: fav });
  },

  refreshCurrent: function () {
    var now = Date.now();
    this.setData({
      currentTs: String(now),
      currentDt: formatDateTime(now)
    });
  },

  onSwitchMode: function (e) {
    this.setData({
      mode: e.currentTarget.dataset.mode,
      inputVal: '',
      result: ''
    });
  },

  onUnitChange: function (e) {
    this.setData({ unit: e.currentTarget.dataset.unit });
  },

  onInputChange: function (e) {
    this.setData({ inputVal: e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ dateStr: e.detail.value });
  },

  onTimeChange: function (e) {
    this.setData({ timeStr: e.detail.value });
  },

  onConvert: function () {
    var mode = this.data.mode;
    if (mode === 'ts2date') {
      var val = Number(this.data.inputVal);
      if (!val) {
        wx.showToast({ title: '请输入时间戳', icon: 'none' });
        return;
      }
      if (this.data.unit === 's') val = val * 1000;
      var dt = formatDateTime(val);
      this.setData({ result: dt });
      storage.addHistory({
        toolId: 'timestamp', toolName: '时间戳转换', category: 'text',
        summary: this.data.inputVal + ' → ' + dt, timestamp: Date.now()
      });
    } else {
      if (!this.data.dateStr) {
        wx.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      var timeStr = this.data.timeStr || '00:00:00';
      var parts = timeStr.split(':');
      var dateParts = this.data.dateStr.split('-');
      var d = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]),
        Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0));
      var ts = this.data.unit === 's' ? Math.floor(d.getTime() / 1000) : d.getTime();
      this.setData({ result: String(ts) });
      storage.addHistory({
        toolId: 'timestamp', toolName: '时间戳转换', category: 'text',
        summary: this.data.dateStr + ' → ' + ts, timestamp: Date.now()
      });
    }
  },

  onCopyResult: function () {
    if (!this.data.result) return;
    wx.setClipboardData({ data: this.data.result });
  },

  onCopyCurrent: function () {
    wx.setClipboardData({ data: this.data.currentTs });
  },

  onShareAppMessage: function () {
    return { title: '时间戳转换 - 工具箱', path: '/pages/tools/timestamp/index' };
  }
});
