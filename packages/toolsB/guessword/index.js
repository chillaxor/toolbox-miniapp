// 复用「多图编号抢答画猜」的同一份词库（本地副本，纯 word 数组）
var WORDS = require('../../../data/drawguess_words.js');

var FLIP_THRESHOLD = 55;   // 相对起始姿态的翻动角度阈值（度）
var FLIP_REARM = 25;       // 回到该偏差内才允许再次触发
var ADVANCE_DELAY = 280;   // 换词动画间隔（ms）

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    roundLen: '20',          // '20' | '40' | 'all'
    flipOn: true,            // 翻手机切词开关
    currentWord: '',
    index: 0,
    total: 0,
    progress: 0,
    progressPercent: 0,
    wordSize: 150,           // 横屏词字号（按词长自适应，开局由 _fitSize 重新计算）
    pulse: false
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.guessword) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._setLightBar();
    this.setOri('portrait');
  },

  onShow: function () {
    // 设置/结果页竖屏，游戏页横屏；从后台切回也保持正确方向
    this._setLightBar();
    this.setOri(this.data.phase === 'playing' ? 'landscape' : 'portrait');
  },

  // 自定义导航栏下，把状态栏文字（时间/电量）设为白色，避免深色背景上消失
  _setLightBar: function () {
    try {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#4a3a8c',
        fail: function () {}
      });
    } catch (e) {}
  },

  onHide: function () {
    this.stopFlip();
  },

  // 运行时切换页面方向（需页面 json 配 pageOrientation: "auto"）
  setOri: function (ori) {
    try {
      wx.setPageOrientation({ orientation: ori, fail: function () {} });
    } catch (e) {}
  },

  onUnload: function () {
    this.stopFlip();
  },

  // ---------- 设置 ----------
  selectLen: function (e) {
    this.setData({ roundLen: e.currentTarget.dataset.len });
  },

  toggleFlip: function () {
    this.setData({ flipOn: !this.data.flipOn });
  },

  // ---------- 开局 ----------
  onStart: function () {
    var list = shuffle(WORDS);
    var n = this.data.roundLen;
    if (n !== 'all') {
      var cnt = parseInt(n, 10);
      if (cnt > 0 && cnt < list.length) list = list.slice(0, cnt);
    }
    this._deck = list;
    this._idx = 0;
    this.setData({
      phase: 'playing',
      total: list.length,
      progress: 1,
      index: 0,
      currentWord: list[0],
      wordSize: this._fitSize(list[0]),
      progressPercent: list.length ? Math.round(1 / list.length * 100) : 0
    });
    this.setOri('landscape');
    this.startFlip();
  },

  // 按词长计算横屏字号，整体偏小一档，避免横屏下被裁切看不全
  _fitSize: function (word) {
    var n = (word || '').length;
    if (n <= 1) return 200;
    if (n <= 2) return 150;
    if (n <= 3) return 115;
    if (n <= 4) return 95;
    return 78;
  },

  // ---------- 游戏中：翻手机 / 轻触 换词 ----------
  nextWord: function () {
    if (this.data.phase !== 'playing') return;
    if (this._busy) return;
    this._busy = true;
    var self = this;
    this._idx += 1;
    if (this._idx >= this._deck.length) {
      this._busy = false;
      this.finish();
      return;
    }
    this.setData({
      index: this._idx,
      currentWord: this._deck[this._idx],
      progress: this._idx + 1,
      wordSize: this._fitSize(this._deck[this._idx]),
      progressPercent: this._deck.length ? Math.round((this._idx + 1) / this._deck.length * 100) : 0,
      pulse: true
    });
    setTimeout(function () {
      self._busy = false;
      self.setData({ pulse: false });
    }, ADVANCE_DELAY);
  },

  // ---------- 结束 ----------
  finish: function () {
    this.stopFlip();
    this.setData({ phase: 'result' });
    this.setOri('portrait');
  },

  onBackSetup: function () {
    this.stopFlip();
    this.setData({
      phase: 'setup',
      currentWord: '',
      index: 0,
      progress: 0,
      progressPercent: 0
    });
    this.setOri('portrait');
  },

  replay: function () {
    this.onStart();
  },

  // 直接回工具箱首页（无视页面栈，结束/卡住时都能去其他工具）
  goHome: function () {
    this.stopFlip();
    this.setOri('portrait');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  // ---------- 翻手机切词（设备方向监听） ----------
  startFlip: function () {
    if (!this.data.flipOn) return;
    var self = this;
    this._beta0 = null;
    this._gamma0 = null;
    this._armed = true;
    this._motionHandler = function (res) {
      if (self._beta0 === null || self._beta0 === undefined) {
        self._beta0 = res.beta;
        self._gamma0 = res.gamma;
        return;
      }
      // 竖屏额头：向下翻手机改变 beta（绕X轴）；横屏额头：手机横置，向下翻改变 gamma（绕Y轴）
      // 两轴都测，取相对初始姿态的最大偏移，保证横竖屏都能触发切词
      var db = res.beta - self._beta0;
      var dg = res.gamma - self._gamma0;
      while (db > 180) db -= 360;
      while (db < -180) db += 360;
      while (dg > 180) dg -= 360;
      while (dg < -180) dg += 360;
      var dmax = Math.max(Math.abs(db), Math.abs(dg));
      if (self._armed && dmax > FLIP_THRESHOLD) {
        self._armed = false;       // 防连触发，需回到中位才重新武装
        self.nextWord();           // 翻手机 = 换下一个词
      } else if (!self._armed && dmax < FLIP_REARM) {
        self._armed = true;
      }
    };
    wx.startDeviceMotionListening({
      interval: 'game',
      success: function () {
        wx.onDeviceMotionChange(self._motionHandler);
      },
      fail: function () {
        // 设备方向不可用（如被系统权限拦截）→ 静默回退到轻触
        self.setData({ flipOn: false });
        wx.showToast({ title: '翻手机不可用·轻触换词', icon: 'none' });
      }
    });
  },

  stopFlip: function () {
    try { wx.stopDeviceMotionListening(); } catch (e) {}
    try {
      if (this._motionHandler) wx.offDeviceMotionChange(this._motionHandler);
    } catch (e) {}
    this._motionHandler = null;
  },

  onShareAppMessage: function () {
    return {
      title: '头顶猜词·双人聚会神器',
      path: '/packages/toolsB/guessword/index'
    };
  }
});
