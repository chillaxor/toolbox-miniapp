var app = getApp();
var storage = require('../../../utils/storage.js');

Page({
  data: {
    phase: 'setting', // setting / focus / rest
    focusMin: 25,
    restMin: 5,
    totalRounds: 4,
    currentRound: 1,
    noiseType: 'none',
    noiseIcon: '',
    noiseOn: true,
    timeDisplay: '25:00',
    progress: 0,
    isFocus: true,
    isPaused: false,
    showComplete: false,
    todayCount: 0,
    todayMinutes: 0,
    streak: 0
  },

  totalSeconds: 0,
  remainSeconds: 0,
  timer: null,

  onLoad: function () {
    this.loadStats();
  },

  onUnload: function () {
    this.clearTimer();
  },

  onHide: function () {
    // 页面隐藏时不自动暂停，允许后台计时
  },

  setFocus: function (e) {
    this.setData({ focusMin: parseInt(e.currentTarget.dataset.v) });
  },

  setRest: function (e) {
    this.setData({ restMin: parseInt(e.currentTarget.dataset.v) });
  },

  setRounds: function (e) {
    this.setData({ totalRounds: parseInt(e.currentTarget.dataset.v) });
  },

  setNoise: function (e) {
    var type = e.currentTarget.dataset.v;
    var icons = { none: '', rain: '🌧', forest: '🌲', waves: '🌊', fire: '🔥' };
    this.setData({ noiseType: type, noiseIcon: icons[type] || '', noiseOn: true });
  },

  toggleNoise: function () {
    this.setData({ noiseOn: !this.data.noiseOn });
  },

  startTimer: function () {
    var focusSec = this.data.focusMin * 60;
    this.totalSeconds = focusSec;
    this.remainSeconds = focusSec;
    this.setData({
      phase: 'focus',
      isFocus: true,
      currentRound: 1,
      timeDisplay: this.formatTime(focusSec),
      progress: 0,
      isPaused: false,
      showComplete: false
    });
    this.runTimer();
  },

  runTimer: function () {
    var that = this;
    this.clearTimer();
    this.timer = setInterval(function () {
      if (that.data.isPaused) return;

      that.remainSeconds--;
      if (that.remainSeconds <= 0) {
        that.remainSeconds = 0;
        that.clearTimer();
        that.onPhaseComplete();
        return;
      }

      var prog = ((that.totalSeconds - that.remainSeconds) / that.totalSeconds) * 100;
      that.setData({
        timeDisplay: that.formatTime(that.remainSeconds),
        progress: prog.toFixed(1)
      });
    }, 1000);
  },

  clearTimer: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  formatTime: function (sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  },

  onPhaseComplete: function () {
    var isFocus = this.data.isFocus;

    if (isFocus) {
      // 专注阶段完成
      this.saveFocusRecord(this.data.focusMin);
      this.loadStats();
      // 震动提醒
      wx.vibrateShort({ type: 'heavy' });
      wx.showToast({ title: '专注完成！休息一下', icon: 'none', duration: 2000 });
    } else {
      // 休息阶段完成
      wx.vibrateShort({ type: 'heavy' });
      wx.showToast({ title: '休息结束，继续专注！', icon: 'none', duration: 2000 });
    }

    if (this.data.currentRound >= this.data.totalRounds && isFocus) {
      // 所有轮次完成
      this.setData({ showComplete: true });
      return;
    }

    // 切换阶段
    this.switchPhase(isFocus);
  },

  switchPhase: function (wasFocus) {
    var that = this;
    if (wasFocus) {
      // 专注→休息
      var restSec = this.data.restMin * 60;
      this.totalSeconds = restSec;
      this.remainSeconds = restSec;
      this.setData({
        isFocus: false,
        phase: 'rest',
        timeDisplay: this.formatTime(restSec),
        progress: 0
      });
    } else {
      // 休息→专注
      var focusSec = this.data.focusMin * 60;
      this.totalSeconds = focusSec;
      this.remainSeconds = focusSec;
      this.setData({
        isFocus: true,
        phase: 'focus',
        currentRound: this.data.currentRound + 1,
        timeDisplay: this.formatTime(focusSec),
        progress: 0
      });
    }
    this.runTimer();
  },

  toggleTimer: function () {
    this.setData({ isPaused: !this.data.isPaused });
  },

  skipPhase: function () {
    this.clearTimer();
    this.onPhaseComplete();
  },

  stopTimer: function () {
    this.clearTimer();
    this.setData({
      phase: 'setting',
      showComplete: false,
      currentRound: 1,
      isFocus: true,
      isPaused: false,
      progress: 0,
      timeDisplay: this.data.focusMin + ':00'
    });
  },

  continueNext: function () {
    this.setData({ showComplete: false });
    if (this.data.isFocus) {
      // 刚完成专注，进入休息
      this.switchPhase(true);
    } else {
      // 刚完成休息，进入下一轮专注
      this.switchPhase(false);
    }
  },

  closeComplete: function () {
    this.setData({ showComplete: false });
    this.stopTimer();
  },

  // 保存专注记录
  saveFocusRecord: function (minutes) {
    var today = this.getToday();
    var records = wx.getStorageSync('pomodoro_records') || {};
    if (!records[today]) {
      records[today] = { count: 0, minutes: 0 };
    }
    records[today].count++;
    records[today].minutes += minutes;
    wx.setStorageSync('pomodoro_records', records);
  },

  // 加载统计
  loadStats: function () {
    var today = this.getToday();
    var records = wx.getStorageSync('pomodoro_records') || {};
    var todayData = records[today] || { count: 0, minutes: 0 };
    
    // 计算连续天数
    var streak = 0;
    var checkDate = new Date();
    while (true) {
      var dateStr = this.formatDate(checkDate);
      if (records[dateStr] && records[dateStr].count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.setData({
      todayCount: todayData.count,
      todayMinutes: todayData.minutes,
      streak: streak
    });
  },

  getToday: function () {
    return this.formatDate(new Date());
  },

  formatDate: function (d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  },

  onShareAppMessage: function () {
    return {
      title: '番茄钟 - 专注工作，高效休息',
      path: '/pages/tools/pomodoro/index'
    };
  }
});
