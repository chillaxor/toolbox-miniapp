var storage = require('../../../utils/storage.js');

// 身体动作指令库（emoji + 文字）
var ACTIONS = [
  { name: '抬手', emoji: '✋' },
  { name: '摸头', emoji: '🤚' },
  { name: '摸耳朵', emoji: '👂' },
  { name: '跺脚', emoji: '🦶' },
  { name: '转一圈', emoji: '🔄' },
  { name: '蹲下', emoji: '🧎' },
  { name: '跳一下', emoji: '⤴️' },
  { name: '笑一个', emoji: '😄' },
  { name: '闭眼', emoji: '😑' },
  { name: '拍手', emoji: '👏' },
  { name: '点头', emoji: '🙆' },
  { name: '深呼吸', emoji: '💨' }
];

// 每条指令停留时长（毫秒），到点自动切换下一条，无需玩家点击
var INTERVAL = 3000;

function randInt(n) { return Math.floor(Math.random() * n); }

Page({
  data: {
    isFavorite: false,
    phase: 'setup',        // setup | playing
    round: 0,
    cmdText: '',
    cmdEmoji: '',
    progress: 0,           // 0~100，倒计时条（仅视觉提示，不要求点击）
    interval: INTERVAL
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.commandreaction) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.checkFavorite();
  },
  onShow: function () { this.checkFavorite(); },
  onUnload: function () { this.clearTimers(); },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('commandreaction') });
  },
  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('commandreaction') });
  },

  clearTimers: function () {
    if (this._nextTimer) { clearTimeout(this._nextTimer); this._nextTimer = null; }
    if (this._barTimer) { clearInterval(this._barTimer); this._barTimer = null; }
  },

  startGame: function () {
    this.clearTimers();
    this.setData({ phase: 'playing', round: 0, progress: 0 });
    this.nextRound();
  },

  // 出一条随机指令，INTERVAL 毫秒后自动切换下一条
  nextRound: function () {
    var round = this.data.round + 1;
    var act = ACTIONS[randInt(ACTIONS.length)];
    var self = this;
    this.setData({
      round: round,
      cmdText: act.name,
      cmdEmoji: act.emoji,
      progress: 0
    });
    try { wx.vibrateShort({ type: 'light' }); } catch (e) {}

    // 进度条（纯视觉提示，用来告诉大家还有多久切换）
    var start = Date.now();
    this._barTimer = setInterval(function () {
      var p = Math.min(100, ((Date.now() - start) / INTERVAL) * 100);
      self.setData({ progress: p });
    }, 50);

    // 到点自动出下一条指令
    this._nextTimer = setTimeout(function () {
      self._nextTimer = null;
      if (self._barTimer) { clearInterval(self._barTimer); self._barTimer = null; }
      if (self.data.phase !== 'playing') return;
      self.nextRound();
    }, INTERVAL);
  },

  // 结束，回到开始页（无需计分）
  stopGame: function () {
    this.clearTimers();
    this.setData({ phase: 'setup', progress: 0 });
  },

  onShareAppMessage: function () {
    return {
      title: '指令反应 - 跟着指令一起做动作',
      path: '/packages/toolsA/commandreaction/index'
    };
  }
});
