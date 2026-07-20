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

var MAX_LIVES = 3;

function randInt(n) { return Math.floor(Math.random() * n); }
// 连击加成：每多 1 连击 +0.1，封顶 2 倍（第 11 连击起不再涨）
function comboMult(combo) { return 1 + Math.min(combo - 1, 10) * 0.1; }

Page({
  data: {
    isFavorite: false,
    phase: 'setup',        // setup | playing | result
    round: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: MAX_LIVES,
    avgReaction: 0,
    bestScore: 0,
    // 当前指令
    cmdType: 'action',     // action（做动作并确认）| hold（别动）
    cmdText: '',
    cmdEmoji: '',
    locked: false,         // 防抢答窗口（动作题前 0.3s）
    holdActive: false,     // 「别动」进行中（此期间点确认=错）
    holdDuration: 0,
    showTime: 0,           // 指令可作答的时刻（用于测反应）
    // 反馈
    feedback: '',          // '' | correct | wrong
    lastGain: 0,
    wrongReason: '',
    // 内部累计（不展示）
    _rSum: 0,
    _rCnt: 0,
    // 结果
    resultScore: 0,
    resultCombo: 0,
    resultAvg: 0
  },

  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('commandreaction_best') || 0;
    this.setData({ bestScore: best });
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
    if (this._lockTimer) { clearTimeout(this._lockTimer); this._lockTimer = null; }
    if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }
    if (this._nextTimer) { clearTimeout(this._nextTimer); this._nextTimer = null; }
    if (this._fbTimer) { clearTimeout(this._fbTimer); this._fbTimer = null; }
  },

  startGame: function () {
    this.clearTimers();
    this.setData({
      phase: 'playing',
      round: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
      lives: MAX_LIVES,
      avgReaction: 0,
      feedback: '',
      wrongReason: '',
      holdActive: false,
      locked: false,
      showTime: 0,
      _rSum: 0,
      _rCnt: 0
    });
    this.nextRound();
  },

  nextRound: function () {
    var round = this.data.round + 1;
    // 难度：第 4 题起才出现「别动」陷阱，概率随轮数上升（封顶 35%）
    var holdProb = round < 4 ? 0 : Math.min(0.35, 0.15 + round * 0.02);
    var isHold = Math.random() < holdProb;

    if (isHold) {
      var dur = 800 + randInt(500); // 800~1300ms 的「忍住」窗口
      this.setData({
        round: round,
        cmdType: 'hold',
        cmdText: '别动！',
        cmdEmoji: '🛑',
        locked: false,
        holdActive: true,
        holdDuration: dur,
        feedback: '',
        lastGain: 0,
        wrongReason: ''
      });
      var self = this;
      this._holdTimer = setTimeout(function () {
        self._holdTimer = null;
        if (self.data.phase !== 'playing') return;
        self.resolveHoldSuccess();
      }, dur);
    } else {
      var act = ACTIONS[randInt(ACTIONS.length)];
      this.setData({
        round: round,
        cmdType: 'action',
        cmdText: act.name,
        cmdEmoji: act.emoji,
        locked: true,        // 防抢答 0.3s
        holdActive: false,
        feedback: '',
        lastGain: 0,
        wrongReason: ''
      });
      var self2 = this;
      this._lockTimer = setTimeout(function () {
        self2._lockTimer = null;
        if (self2.data.phase !== 'playing') return;
        self2.setData({ locked: false, showTime: Date.now() });
      }, 300);
    }
  },

  onConfirm: function () {
    if (this.data.phase !== 'playing') return;
    if (this.data.feedback) return;   // 正在结算，忽略
    if (this.data.locked) return;     // 防抢答窗口，忽略

    if (this.data.cmdType === 'hold') {
      if (this.data.holdActive) {
        // 该忍住却动了手
        this.failRound('该忍住却动了手！');
      }
      return;
    }
    // 动作题：确认即正确，按「指令出现→确认」计时
    var rt = Date.now() - (this.data.showTime || Date.now());
    if (rt < 0) rt = 0;
    this.successRound(rt);
  },

  successRound: function (reactionMs) {
    var combo = this.data.combo + 1;
    var speedBonus = Math.max(0, 200 - Math.floor(reactionMs / 5));
    var gain = Math.round((100 + speedBonus) * comboMult(combo));
    var rSum = this.data._rSum + reactionMs;
    var rCnt = this.data._rCnt + 1;

    this.setData({
      score: this.data.score + gain,
      combo: combo,
      bestCombo: Math.max(this.data.bestCombo, combo),
      feedback: 'correct',
      lastGain: gain,
      _rSum: rSum,
      _rCnt: rCnt,
      avgReaction: Math.round(rSum / rCnt)
    });
    wx.vibrateShort({ type: 'light' });
    this.scheduleNext(550);
  },

  resolveHoldSuccess: function () {
    if (this.data.feedback) return;
    var combo = this.data.combo + 1;
    var gain = Math.round(150 * comboMult(combo));
    this.setData({
      holdActive: false,
      score: this.data.score + gain,
      combo: combo,
      bestCombo: Math.max(this.data.bestCombo, combo),
      feedback: 'correct',
      lastGain: gain
    });
    wx.vibrateShort({ type: 'light' });
    this.scheduleNext(550);
  },

  failRound: function (reason) {
    var lives = this.data.lives - 1;
    this.setData({
      lives: lives,
      combo: 0,
      feedback: 'wrong',
      wrongReason: reason
    });
    wx.vibrateShort({ type: 'heavy' });
    var self = this;
    this._fbTimer = setTimeout(function () {
      self._fbTimer = null;
      if (self.data.phase !== 'playing') return;
      if (lives <= 0) {
        self.gameOver();
      } else {
        self.nextRound();
      }
    }, 750);
  },

  scheduleNext: function (delay) {
    var self = this;
    this._nextTimer = setTimeout(function () {
      self._nextTimer = null;
      if (self.data.phase !== 'playing') return;
      self.setData({ feedback: '' });
      self.nextRound();
    }, delay);
  },

  gameOver: function () {
    this.clearTimers();
    var best = this.data.bestScore;
    var score = this.data.score;
    if (score > best) {
      best = score;
      wx.setStorageSync('commandreaction_best', best);
    }
    this.setData({
      phase: 'result',
      bestScore: best,
      resultScore: score,
      resultCombo: this.data.bestCombo,
      resultAvg: this.data.avgReaction
    });
    storage.addHistory({
      toolId: 'commandreaction',
      toolName: '指令反应',
      category: 'fun',
      summary: '得分 ' + score + ' · 最高连击 ' + this.data.bestCombo,
      timestamp: Date.now()
    });
  },

  backToSetup: function () {
    this.clearTimers();
    this.setData({ phase: 'setup', feedback: '' });
  },

  onShareAppMessage: function () {
    return {
      title: '指令反应 - 我得了 ' + this.data.score + ' 分，来挑战！',
      path: '/pages/tools/commandreaction/index'
    };
  }
});
