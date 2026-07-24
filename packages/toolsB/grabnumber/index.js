// 抢数字：竖屏设置 / 横屏对战
// 屏幕中央蹦出一个数字，左右两位玩家各握一边、各点自己那半屏。
// 普通数字 → 抢先者得分；禁止数字 → 抢了要扣分、对手加分；都不点(漏禁止) → 双方 +1(聪明)。

var DRAW_MS = 180;        // 同时点击判定平分/双输的时间窗口
var RESOLVE_MS = 780;     // 每次结算后停留时长
var GAP_MS = 260;         // 结算到下一个数字之间的空档
var BASE_WINDOW = 1200;   // 数字初始显示时长(ms)
var MIN_WINDOW = 500;     // 数字显示时长下限(ms)
var DECOY_MS = 150;       // 干扰假动作停留时长(ms)

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (var i = 3; i * i <= n; i += 2) { if (n % i === 0) return false; }
  return true;
}
function isSquare(n) {
  if (n < 0) return false;
  var r = Math.round(Math.sqrt(n));
  return r * r === n;
}
function containsDigit(n, d) {
  return String(n).indexOf(String(d)) >= 0;
}

// 分数格式化：整数不带小数，0.5 保留一位
function fmt(x) {
  var v = Math.round(x * 10) / 10;
  return (v % 1 === 0) ? String(v) : v.toFixed(1);
}

Page({
  data: {
    phase: 'setup',            // setup | playing | result

    // ---- 设置 ----
    rangeMax: 50,              // 数字范围上限(1..rangeMax)
    forbidType: 'multiple',    // multiple | contains | prime | square
    forbidValue: 7,            // multiple/contains 的参数
    duration: 60,              // 游戏时长(秒)
    speedStep: 10,             // 每多少轮提一次速
    penalty: 2,                // 惩罚强度(点禁止扣的分)
    interfere: true,           // 干扰机制开关

    // 设置页展示用文案
    forbidDesc: '',

    // ---- 对战 ----
    countdown: 0,              // 3-2-1 倒计时(>0 显示遮罩)
    round: 0,
    number: 0,
    numForbidden: false,
    numState: 'normal',        // normal | forbidden | gone
    shake: false,              // 干扰抖动
    scoreA: 0, scoreB: 0,
    scoreAText: '0', scoreBText: '0',
    timeLeft: 60,
    flash: '',                 // green | red | yellow
    resultLine: '',
    floatA: '', floatB: '',    // 得分飘字

    // ---- 结果 ----
    winnerText: '',
    summary: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.grabnumber === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._setLightBar();
    this._setOri('portrait');
    this._syncForbidDesc();
  },

  onShow: function () {
    this._setLightBar();
    this._setOri(this.data.phase === 'playing' ? 'landscape' : 'portrait');
    // 从后台/中途退出再回来：onHide 已把所有计时器清掉，需重建，否则倒计时与游戏卡住不动
    if (this.data.phase === 'playing') this._resume();
  },

  onHide: function () { this._clearTimers(); },
  onUnload: function () { this._clearTimers(); },

  _setLightBar: function () {
    try {
      wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#101024', fail: function () {} });
    } catch (e) {}
  },

  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o, fail: function () {} }); } catch (e) {}
  },

  _clearTimers: function () {
    clearTimeout(this._dispTimer);
    clearTimeout(this._pendTimer);
    clearTimeout(this._gapTimer);
    clearTimeout(this._decoyTimer);
    clearTimeout(this._nextTimer);
    clearInterval(this._gameTimer);
    clearInterval(this._countTimer);
    this._dispTimer = this._pendTimer = this._gapTimer = null;
    this._decoyTimer = this._nextTimer = this._gameTimer = this._countTimer = null;
  },

  // 从后台返回 / 中途退出再进：重建被清掉的计时器，让倒计时与游戏继续
  _resume: function () {
    if (this.data.phase !== 'playing') return;
    // 仍在 3-2-1 倒计时阶段
    if (this.data.countdown > 0) {
      if (!this._countTimer) this._startCountdown();
      return;
    }
    // 游戏进行中：先恢复总计时器
    if (!this._gameTimer) this._startGameTimer();
    // 干扰假数字阶段被打断：直接重开本轮
    if (this._locked) { this._locked = false; this._startRound(); return; }
    // 处于结算后的过渡间隙（RESOLVE/GAP）：推进到下一轮
    if (this._resolved) {
      if (!this._nextTimer && !this._gapTimer) this._afterResolve();
      return;
    }
    // 正在等待抢点：重建显示窗口
    if (!this._dispTimer) this._armWindow();
  },

  // ==================== 设置 ====================
  selectRange: function (e) {
    this.setData({ rangeMax: parseInt(e.currentTarget.dataset.v, 10) });
  },
  selectForbid: function (e) {
    this.setData({ forbidType: e.currentTarget.dataset.v }, this._syncForbidDesc.bind(this));
  },
  selectForbidValue: function (e) {
    this.setData({ forbidValue: parseInt(e.currentTarget.dataset.v, 10) }, this._syncForbidDesc.bind(this));
  },
  selectDuration: function (e) {
    this.setData({ duration: parseInt(e.currentTarget.dataset.v, 10) });
  },
  selectSpeed: function (e) {
    this.setData({ speedStep: parseInt(e.currentTarget.dataset.v, 10) });
  },
  selectPenalty: function (e) {
    this.setData({ penalty: parseInt(e.currentTarget.dataset.v, 10) });
  },
  toggleInterfere: function () {
    this.setData({ interfere: !this.data.interfere });
  },

  _syncForbidDesc: function () {
    var t = this.data.forbidType, v = this.data.forbidValue, s = '';
    if (t === 'multiple') s = '禁止「' + v + ' 的倍数」，如 ' + v + '、' + (v * 2) + '、' + (v * 3) + '…';
    else if (t === 'contains') s = '禁止「含数字 ' + v + '」，如 ' + v + '、1' + v + '、' + v + '3…';
    else if (t === 'prime') s = '禁止「质数」，如 2、3、5、7、11…';
    else if (t === 'square') s = '禁止「完全平方数」，如 1、4、9、16、25…';
    this.setData({ forbidDesc: s });
  },

  _isForbidden: function (n) {
    var t = this.data.forbidType, v = this.data.forbidValue;
    if (t === 'multiple') return v > 0 && n % v === 0;
    if (t === 'contains') return containsDigit(n, v);
    if (t === 'prime') return isPrime(n);
    if (t === 'square') return isSquare(n);
    return false;
  },

  // 预生成禁止/普通两个池，保证每局都有足够的禁止数字出现
  _buildPools: function () {
    var forbid = [], normal = [];
    for (var n = 1; n <= this.data.rangeMax; n++) {
      if (this._isForbidden(n)) forbid.push(n); else normal.push(n);
    }
    this._forbidPool = forbid;
    this._normalPool = normal;
  },

  // ==================== 开局 ====================
  onStart: function () {
    this._buildPools();
    this._clearTimers();
    this.setData({
      phase: 'playing',
      countdown: 3,
      round: 0,
      number: 0,
      numForbidden: false,
      numState: 'normal',
      shake: false,
      scoreA: 0, scoreB: 0,
      scoreAText: '0', scoreBText: '0',
      timeLeft: this.data.duration,
      flash: '', resultLine: '',
      floatA: '', floatB: ''
    });
    this._setOri('landscape');
    this._startCountdown();
  },

  _startCountdown: function () {
    var self = this;
    this._countTimer = setInterval(function () {
      var c = self.data.countdown - 1;
      if (c <= 0) {
        clearInterval(self._countTimer);
        self._countTimer = null;
        self.setData({ countdown: 0 });
        self._startGameTimer();
        self._startRound();
      } else {
        self.setData({ countdown: c });
      }
    }, 800);
  },

  _startGameTimer: function () {
    var self = this;
    this._gameTimer = setInterval(function () {
      if (self.data.phase !== 'playing') { clearInterval(self._gameTimer); return; }
      var t = self.data.timeLeft - 1;
      if (t <= 0) {
        self.setData({ timeLeft: 0 });
        clearInterval(self._gameTimer);
        self._gameTimer = null;
        self._finishByTime();
      } else {
        self.setData({ timeLeft: t });
      }
    }, 1000);
  },

  // 当前数字显示时长：每 speedStep 轮减 100ms，最低 500ms
  _window: function () {
    var steps = Math.floor((this.data.round - 1) / this.data.speedStep);
    return Math.max(MIN_WINDOW, BASE_WINDOW - steps * 100);
  },

  _pickNumber: function () {
    // ~35% 出禁止数字（池空则回退另一池）
    var wantForbid = Math.random() < 0.35;
    var pool = wantForbid ? this._forbidPool : this._normalPool;
    if (!pool || !pool.length) pool = wantForbid ? this._normalPool : this._forbidPool;
    if (!pool || !pool.length) return { n: randInt(1, this.data.rangeMax), forbidden: false };
    var n = pool[Math.floor(Math.random() * pool.length)];
    return { n: n, forbidden: this._isForbidden(n) };
  },

  _startRound: function () {
    if (this.data.phase !== 'playing') return;
    this._resolved = false;
    this._locked = false;
    this._taps = { A: null, B: null };
    this._pending = null;

    var round = this.data.round + 1;
    var pk = this._pickNumber();
    var patch = {
      round: round,
      number: pk.n,
      numForbidden: pk.forbidden,
      numState: pk.forbidden ? 'forbidden' : 'normal',
      shake: false,
      flash: '', resultLine: '',
      floatA: '', floatB: ''
    };

    var self = this;
    // 干扰：8 轮起、开启干扰时，先闪一个「假数字」再变真数字
    if (this.data.interfere && round >= 8 && Math.random() < 0.4) {
      var dk = this._pickNumber();
      patch.number = dk.n;
      patch.numForbidden = dk.forbidden;
      patch.numState = dk.forbidden ? 'forbidden' : 'normal';
      patch.shake = true;
      this._locked = true;
      this.setData(patch);
      this._decoyTimer = setTimeout(function () {
        self._locked = false;
        self.setData({
          number: pk.n,
          numForbidden: pk.forbidden,
          numState: pk.forbidden ? 'forbidden' : 'normal',
          shake: false
        });
        self._armWindow();
      }, DECOY_MS);
      return;
    }

    this.setData(patch);
    this._armWindow();
  },

  // 开启本数字的显示计时：到点没人抢 → 判为漏点
  _armWindow: function () {
    var self = this;
    clearTimeout(this._dispTimer);
    this._dispTimer = setTimeout(function () {
      if (!self._resolved) self._resolve('miss');
    }, this._window());
  },

  // ==================== 抢点 ====================
  tapA: function () { this._onTap('A'); },
  tapB: function () { this._onTap('B'); },

  _onTap: function (side) {
    if (this.data.phase !== 'playing' || this._resolved || this._locked) return;
    if (this.data.countdown > 0) return;
    if (this._taps[side]) return;               // 本轮该侧已点过
    this._taps[side] = Date.now();

    var other = side === 'A' ? 'B' : 'A';
    if (this._taps[other]) {
      // 双方都已点：按时间差判断同时/先后
      var diff = Math.abs(this._taps[side] - this._taps[other]);
      if (diff <= DRAW_MS) return this._resolve('both');
      return this._resolve(this._taps.A < this._taps.B ? 'A' : 'B');
    }
    // 仅一方点：留一个平分窗口，看对方是否几乎同时点
    var self = this;
    this._pending = side;
    this._pendTimer = setTimeout(function () {
      if (!self._resolved) self._resolve(self._pending);
    }, DRAW_MS);
  },

  // ==================== 结算 ====================
  _resolve: function (kind) {
    if (this._resolved) return;
    this._resolved = true;
    clearTimeout(this._dispTimer);
    clearTimeout(this._pendTimer);
    this._pending = null;

    var forbidden = this.data.numForbidden;
    var pen = this.data.penalty;
    var dA = 0, dB = 0, flash = '', line = '', fA = '', fB = '';
    var numState = this.data.numState;

    if (kind === 'A' || kind === 'B') {
      var win = kind, lose = kind === 'A' ? 'B' : 'A';
      if (forbidden) {
        // 抢了禁止数字：抢的人扣分，对手加分
        if (win === 'A') { dA = -pen; dB = 1; fA = '−' + pen; fB = '+1'; }
        else { dB = -pen; dA = 1; fB = '−' + pen; fA = '+1'; }
        flash = 'red';
        line = '玩家' + win + ' 抢了禁止数字！−' + pen + '，玩家' + lose + ' +1';
        this._vibe('heavy');
      } else {
        if (win === 'A') { dA = 1; fA = '+1'; } else { dB = 1; fB = '+1'; }
        flash = 'green';
        line = '玩家' + win + ' 抢先 +1';
        this._vibe('light');
      }
    } else if (kind === 'both') {
      if (forbidden) {
        dA = -1; dB = -1; fA = '−1'; fB = '−1';
        flash = 'red'; line = '双双抢了禁止数字·双输 −1';
        this._vibe('heavy');
      } else {
        dA = 0.5; dB = 0.5; fA = '+0.5'; fB = '+0.5';
        flash = 'yellow'; line = '几乎同时·平分 +0.5';
        this._vibe('light');
      }
    } else { // miss
      if (forbidden) {
        dA = 1; dB = 1; fA = '+1'; fB = '+1';
        flash = 'green'; line = '都没点·聪明！双方 +1';
        this._vibe('light');
      } else {
        flash = ''; line = '无人抢·数字飘走';
        numState = 'gone';
      }
    }

    var sA = Math.round((this.data.scoreA + dA) * 10) / 10;
    var sB = Math.round((this.data.scoreB + dB) * 10) / 10;
    this.setData({
      scoreA: sA, scoreB: sB,
      scoreAText: fmt(sA), scoreBText: fmt(sB),
      flash: flash, resultLine: line,
      floatA: fA, floatB: fB,
      numState: numState
    });

    var self = this;
    this._nextTimer = setTimeout(function () { self._afterResolve(); }, RESOLVE_MS);
  },

  _afterResolve: function () {
    if (this.data.phase !== 'playing') return;
    if (this.data.timeLeft <= 0) return;         // 时间到由计时器收尾
    var self = this;
    this.setData({ flash: '', resultLine: '', floatA: '', floatB: '' });
    this._gapTimer = setTimeout(function () { self._startRound(); }, GAP_MS);
  },

  _finishByTime: function () {
    var a = this.data.scoreA, b = this.data.scoreB;
    var kind = a > b ? 'A' : (b > a ? 'B' : 'draw');
    this._endGame(kind);
  },

  _endGame: function (kind) {
    this._clearTimers();
    this._resolved = true;
    var wt = kind === 'A' ? '🏆 玩家A 获胜！'
      : kind === 'B' ? '🏆 玩家B 获胜！'
      : '🤝 平局！';
    var sum = '比分  A ' + fmt(this.data.scoreA) + ' : ' + fmt(this.data.scoreB) + ' B';
    this.setData({
      phase: 'result',
      winnerText: wt,
      summary: sum,
      flash: '', resultLine: '', floatA: '', floatB: ''
    });
    this._setOri('portrait');
  },

  _vibe: function (type) {
    try { wx.vibrateShort({ type: type || 'light' }); } catch (e) {}
  },

  // ==================== 结果 / 返回 ====================
  backSetup: function () {
    this._clearTimers();
    this.setData({ phase: 'setup', countdown: 0, flash: '', resultLine: '' });
    this._setOri('portrait');
  },

  replay: function () { this.onStart(); },

  goHome: function () {
    this._clearTimers();
    this._setOri('portrait');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage: function () {
    return { title: '抢数字·横屏双人·手快脑稳者胜', path: '/packages/toolsB/grabnumber/index' };
  }
});
