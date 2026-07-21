var storage = require('../../../utils/storage.js');
// 复用「多图编号抢答画猜」的同一份词库（本地副本，纯 word 数组）
var WORDS = require('../../../data/drawguess_words.js');

var FLIP_THRESHOLD = 55;   // 相对起始姿态的翻动角度阈值（度）
var FLIP_REARM = 25;       // 回到该偏差内才允许再次触发
var ADVANCE_DELAY = 320;   // 翻牌动画间隔（ms）

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    roundLen: '20',          // '20' | '40' | 'all'
    flipOn: true,            // 翻手机切词开关
    currentWord: '',
    index: 0,
    total: 0,
    progress: 0,
    correct: 0,
    skipped: 0,
    feedback: '',            // '' | 'correct' | 'skip'
    isFavorite: false,
    best: 0,
    isBest: false
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.guessword) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
  },

  onShow: function () {
    this.setData({ isFavorite: storage.isFavorite('guessword') });
  },

  onHide: function () {
    this.stopFlip();
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

  toggleFavorite: function () {
    var f = storage.toggleFavorite('guessword');
    this.setData({ isFavorite: f });
  },

  // ---------- 开局 ----------
  onStart: function () {
    var list = WORDS.slice();
    // Fisher-Yates 洗牌（词库本地副本，离线可用，不依赖网络）
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
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
      correct: 0,
      skipped: 0,
      feedback: ''
    });
    this.loadCurrent();
    this.startFlip();
  },

  loadCurrent: function () {
    var i = this._idx;
    if (i >= this._deck.length) { this.finish(); return; }
    this.setData({
      index: i,
      currentWord: this._deck[i],
      progress: i + 1,
      feedback: ''
    });
  },

  // ---------- 答题 ----------
  onCorrect: function () { this.advance('correct'); },
  skipWord: function () { this.advance('skip'); },

  advance: function (result) {
    if (this.data.phase !== 'playing') return;
    if (this._busy) return;
    this._busy = true;
    var self = this;
    var correct = this.data.correct + (result === 'correct' ? 1 : 0);
    var skipped = this.data.skipped + (result === 'skip' ? 1 : 0);
    this.setData({ correct: correct, skipped: skipped, feedback: result });
    try { wx.vibrateShort({ type: result === 'correct' ? 'medium' : 'light' }); } catch (e) {}
    setTimeout(function () {
      self._idx += 1;
      self._busy = false;
      if (self._idx >= self._deck.length) {
        self.finish();
      } else {
        self.loadCurrent();
      }
    }, ADVANCE_DELAY);
  },

  // ---------- 结束 ----------
  finish: function () {
    this.stopFlip();
    var prevBest = storage.getSync('guessword_best', 0);
    var isBest = this.data.correct > prevBest;
    if (isBest) storage.setSync('guessword_best', this.data.correct);
    storage.addHistory({
      toolId: 'guessword',
      toolName: '头顶猜词',
      category: 'fun',
      summary: '猜对' + this.data.correct + '·跳过' + this.data.skipped
    });
    this.setData({
      phase: 'result',
      best: Math.max(prevBest, this.data.correct),
      isBest: isBest
    });
  },

  onBackSetup: function () {
    this.stopFlip();
    this.setData({
      phase: 'setup',
      feedback: '',
      currentWord: '',
      index: 0,
      progress: 0,
      correct: 0,
      skipped: 0
    });
  },

  replay: function () {
    this.onStart();
  },

  // ---------- 翻手机切词（设备方向监听） ----------
  startFlip: function () {
    if (!this.data.flipOn) return;
    var self = this;
    this._beta0 = null;
    this._armed = true;
    this._motionHandler = function (res) {
      if (self._beta0 === null || self._beta0 === undefined) {
        self._beta0 = res.beta;
        return;
      }
      var d = res.beta - self._beta0;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (self._armed && Math.abs(d) > FLIP_THRESHOLD) {
        self._armed = false;       // 防连触发，需回到中位才重新武装
        self.skipWord();           // 翻手机 = 跳过切下一个
      } else if (!self._armed && Math.abs(d) < FLIP_REARM) {
        self._armed = true;
      }
    };
    wx.startDeviceMotionListening({
      interval: 'game',
      success: function () {
        wx.onDeviceMotionChange(self._motionHandler);
      },
      fail: function () {
        // 设备方向不可用（如被系统权限拦截）→ 静默回退到按钮
        self.setData({ flipOn: false });
        wx.showToast({ title: '翻手机不可用·用按钮切词', icon: 'none' });
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
      path: '/pages/tools/guessword/index'
    };
  }
});
