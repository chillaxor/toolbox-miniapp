// 抢颜色：斯特鲁普效应双人抢点游戏
// 中间蹦出一个带颜色的字，答案是「字的颜色」而非「字的意思」，
// 左右两位玩家抢点自己这边对应颜色的按钮，先点对得分。

var COLORS = [
  { key: 'red',    name: '红', hex: '#FF3B30' },
  { key: 'blue',   name: '蓝', hex: '#0A84FF' },
  { key: 'green',  name: '绿', hex: '#34C759' },
  { key: 'yellow', name: '黄', hex: '#FFD60A' },
  { key: 'purple', name: '紫', hex: '#BF5AF2' },
  { key: 'orange', name: '橙', hex: '#FF9F0A' }
];

var DRAW_MS = 200;          // 同时触碰判定为平局的窗口
var RESOLVE_MS = 850;       // 每轮结算后停留时长

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    mode: 'classic',         // classic | timed | survival | coop
    // 对战
    round: 0,
    wordText: '',
    wordColor: '#000000',
    answerKey: '',
    activeColors: [],
    scoreA: 0,
    scoreB: 0,
    livesA: 3,
    livesB: 3,
    goalText: '',
    timeLeft: 0,
    // 合作
    teamScore: 0,
    aiScore: 0,
    // 反馈
    flash: '',
    resultLine: '',
    // 结果
    winnerText: '',
    modeText: '',
    summary: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.grabcolor === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._setOri('portrait');   // 设置页 / 结果页竖屏
  },

  // 运行时切换屏幕方向（需 pageOrientation:auto 才生效）
  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o }); } catch (e) {}
  },

  _modeName: function (m) {
    return m === 'classic' ? '经典模式' : m === 'timed' ? '限时模式'
      : m === 'survival' ? '生存模式' : '合作模式';
  },

  _clearTimers: function () {
    clearTimeout(this._nextTimer);
    clearTimeout(this._aiTimer);
    clearTimeout(this._decoyTimer);
    clearTimeout(this._pending && this._pending.timer);
    clearInterval(this._modeTimer);
    this._nextTimer = this._aiTimer = this._decoyTimer = this._modeTimer = null;
    this._pending = null;
  },

  // ---------- 设置 ----------
  selectMode: function (e) {
    this.setData({ mode: e.currentTarget.dataset.m });
  },

  // ---------- 开局 ----------
  onStart: function () {
    var mode = this.data.mode;
    this._goal = 10;
    var patch = {
      phase: 'playing',
      round: 0,
      scoreA: 0, scoreB: 0,
      livesA: 3, livesB: 3,
      teamScore: 0, aiScore: 0,
      flash: '', resultLine: '',
      wordText: '', wordColor: '#000000', answerKey: '',
      activeColors: []
    };
    if (mode === 'timed') { patch.timeLeft = 60; patch.goalText = '60 秒内分高者胜'; }
    else if (mode === 'classic') { patch.goalText = '先得 ' + this._goal + ' 分获胜'; }
    else if (mode === 'survival') { patch.goalText = '各 3 条命·点错丢命'; }
    else { patch.goalText = '合作击败 AI'; }
    this.setData(patch);
    this._clearTimers();
    this._setOri('landscape');   // 游戏开始转横屏
    this._startRound();
    if (mode === 'timed') this._startModeTimer();
  },

  // ---------- 出题 ----------
  _pickWord: function (round, pool) {
    var textColor = rand(pool);                       // 正确答案 = 字的颜色
    var rate = round < 11 ? 0 : (round <= 15 ? 0.5 : 0.8);
    var wordName;
    if (Math.random() < rate) {                        // 不一致：字义 ≠ 颜色
      var others = pool.filter(function (c) { return c.key !== textColor.key; });
      wordName = rand(others);
    } else {
      wordName = textColor;                            // 一致：字义 = 颜色
    }
    return { text: wordName.name, color: textColor.hex, key: textColor.key };
  },

  _startRound: function () {
    if (this.data.phase !== 'playing') return;
    this._resolved = false;
    this._taps = { A: null, B: null };
    this._pending = null;
    this._locked = false;
    var round = this.data.round + 1;
    var count = round <= 5 ? 4 : 6;                    // 6-10 轮起解锁 6 色
    var pool = COLORS.slice(0, count);
    var w = this._pickWord(round, pool);
    var patch = {
      round: round,
      wordText: w.text,
      wordColor: w.color,
      answerKey: w.key,
      activeColors: pool,
      flash: '',
      resultLine: ''
    };
    // 21 轮起随机「假动作」：先闪一个干扰词，110ms 后再变真词
    if (round >= 21 && Math.random() < 0.5) {
      var d = this._pickWord(round, pool);
      patch.wordText = d.text;
      patch.wordColor = d.color;
      this._locked = true;
      var self = this;
      this._decoyTimer = setTimeout(function () {
        self._locked = false;
        self.setData({ wordText: w.text, wordColor: w.color });
      }, 110);
    }
    this.setData(patch);
    if (this.data.mode === 'coop') {
      var delay = Math.max(420, 820 - round * 25);     // AI 越往后越快
      var self2 = this;
      this._aiTimer = setTimeout(function () { self2._aiFire(); }, delay);
    }
  },

  // ---------- 抢点 ----------
  tapA: function (e) { this._onTap('A', e.currentTarget.dataset.key); },
  tapB: function (e) { this._onTap('B', e.currentTarget.dataset.key); },

  _onTap: function (side, colorKey) {
    if (this.data.phase !== 'playing' || this._resolved || this._locked) return;
    if (this.data.mode === 'coop') { this._onTapCoop(side, colorKey); return; }
    if (this._taps[side]) return;                      // 本轮已点过
    this._taps[side] = { color: colorKey, t: Date.now() };
    this._recompute();
  },

  _recompute: function () {
    var ans = this.data.answerKey;
    var a = this._taps.A, b = this._taps.B;
    var aC = a && a.color === ans, bC = b && b.color === ans;
    var aW = a && !aC, bW = b && !bC;

    if (aC && bC) {                                     // 两边都对
      if (Math.abs(a.t - b.t) <= DRAW_MS) return this._resolve('draw');
      return this._resolve(a.t < b.t ? 'A' : 'B');
    }
    if (aC && bW) return this._resolve('A');            // A 对 B 错 → A 胜
    if (bC && aW) return this._resolve('B');
    if (aC && !b && !this._pending) {                   // A 对、B 未点 → 等平局窗口
      this._pending = { side: 'A' };
      this._startDrawTimer();
      return;
    }
    if (bC && !a && !this._pending) {
      this._pending = { side: 'B' };
      this._startDrawTimer();
      return;
    }
    if (aW && !b) return this._resolve('B');            // A 错、B 未点 → B 胜
    if (bW && !a) return this._resolve('A');
    if (aW && bW) return this._resolve('bothwrong');    // 双双点错
  },

  _startDrawTimer: function () {
    var self = this;
    this._pending.timer = setTimeout(function () {
      if (!self._resolved && self._pending) self._resolve(self._pending.side);
    }, DRAW_MS);
  },

  // ---------- 结算（对战） ----------
  _resolve: function (kind) {
    if (this._resolved) return;
    this._resolved = true;
    if (this._pending && this._pending.timer) clearTimeout(this._pending.timer);
    this._pending = null;

    var mode = this.data.mode;
    var flash = '', line = '', dA = 0, dB = 0, lA = 0, lB = 0;

    // 生存模式：谁点错谁扣命（与输赢无关），单独按 tap 状态算
    if (mode === 'survival') {
      var ans = this.data.answerKey;
      var ta = this._taps.A, tb = this._taps.B;
      var aC = ta && ta.color === ans, bC = tb && tb.color === ans;
      lA = (ta && !aC) ? 1 : 0;
      lB = (tb && !bC) ? 1 : 0;
    }

    if (kind === 'draw') {
      flash = 'yellow'; line = '平局！';
    } else if (kind === 'A') {
      flash = 'green';
      if (mode === 'survival') line = lB ? '玩家B 失误 −1❤️' : '玩家A 抢先 +1';
      else line = '玩家A +1';
      if (mode !== 'survival') dA = 1;
    } else if (kind === 'B') {
      flash = 'green';
      if (mode === 'survival') line = lA ? '玩家A 失误 −1❤️' : '玩家B 抢先 +1';
      else line = '玩家B +1';
      if (mode !== 'survival') dB = 1;
    } else if (kind === 'bothwrong') {
      flash = 'red'; line = '双双点错！';
      if (mode === 'survival') { lA = 1; lB = 1; }
    }

    var patch = { flash: flash, resultLine: line };
    if (mode === 'classic' || mode === 'timed') {
      if (dA) patch.scoreA = this.data.scoreA + dA;
      if (dB) patch.scoreB = this.data.scoreB + dB;
    } else if (mode === 'survival') {
      patch.livesA = Math.max(0, this.data.livesA - lA);
      patch.livesB = Math.max(0, this.data.livesB - lB);
    }
    this._vibrate(flash);
    this.setData(patch);

    var self = this;
    this._nextTimer = setTimeout(function () { self._afterResolve(); }, RESOLVE_MS);
  },

  _afterResolve: function () {
    this._resolved = false;
    var m = this.data.mode;
    if (m === 'classic') {
      if (this.data.scoreA >= this._goal) return this._endGame('A');
      if (this.data.scoreB >= this._goal) return this._endGame('B');
    } else if (m === 'survival') {
      if (this.data.livesB <= 0) return this._endGame('A');
      if (this.data.livesA <= 0) return this._endGame('B');
    } else if (m === 'timed') {
      if (this.data.timeLeft <= 0) {
        return this._endGame(this.data.scoreA > this.data.scoreB ? 'A'
          : (this.data.scoreB > this.data.scoreA ? 'B' : 'draw'));
      }
    } else if (m === 'coop') {
      if (this.data.teamScore >= this._goal) return this._endGame('team');
      if (this.data.aiScore >= this._goal) return this._endGame('ai');
    }
    this._startRound();
  },

  // ---------- 合作模式 ----------
  _onTapCoop: function (side, colorKey) {
    if (this._resolved || this._locked) return;
    if (this._taps[side]) return;
    this._taps[side] = colorKey;
    if (colorKey === this.data.answerKey) this._resolveCoop('team');
    // 点错：该侧本轮回合锁定，不扣分（合作向）
  },

  _aiFire: function () {
    if (this._resolved || this.data.phase !== 'playing') return;
    this._resolveCoop('ai');
  },

  _resolveCoop: function (kind) {
    if (this._resolved) return;
    this._resolved = true;
    if (this._aiTimer) clearTimeout(this._aiTimer);
    var flash, line, patch = {};
    if (kind === 'team') {
      flash = 'team'; line = '团队 +1 🎉';
      patch.teamScore = this.data.teamScore + 1;
    } else {
      flash = 'red'; line = '🤖 AI 抢先！';
      patch.aiScore = this.data.aiScore + 1;
    }
    patch.flash = flash; patch.resultLine = line;
    this._vibrate(flash);
    this.setData(patch);
    var self = this;
    this._nextTimer = setTimeout(function () { self._afterResolve(); }, RESOLVE_MS);
  },

  // ---------- 限时模式计时 ----------
  _startModeTimer: function () {
    var self = this;
    this._modeTimer = setInterval(function () {
      if (self.data.phase !== 'playing') { clearInterval(self._modeTimer); return; }
      var t = self.data.timeLeft - 1;
      if (t <= 0) {
        self.setData({ timeLeft: 0 });
        clearInterval(self._modeTimer);
        self._endGame(self.data.scoreA > self.data.scoreB ? 'A'
          : (self.data.scoreB > self.data.scoreA ? 'B' : 'draw'));
      } else {
        self.setData({ timeLeft: t });
      }
    }, 1000);
  },

  // ---------- 结束 ----------
  _endGame: function (kind) {
    this._clearTimers();
    this._resolved = true;
    var wt = '';
    if (kind === 'A') wt = '🏆 玩家A 获胜！';
    else if (kind === 'B') wt = '🏆 玩家B 获胜！';
    else if (kind === 'team') wt = '🏆 团队击败 AI！';
    else if (kind === 'ai') wt = '🤖 AI 获胜·再接再厉';
    else wt = '🤝 平局！';

    var sum;
    if (this.data.mode === 'coop') sum = '队伍 ' + this.data.teamScore + ' : ' + this.data.aiScore + ' AI';
    else if (this.data.mode === 'survival') sum = '剩余命数  A ' + this.data.livesA + ' · B ' + this.data.livesB;
    else sum = '比分  A ' + this.data.scoreA + ' : ' + this.data.scoreB + ' B';

    this.setData({
      phase: 'result',
      winnerText: wt,
      summary: sum,
      modeText: this._modeName(this.data.mode),
      flash: '', resultLine: ''
    });
    this._setOri('portrait');   // 结果页竖屏
  },

  _vibrate: function (flash) {
    try {
      if (flash === 'green' || flash === 'team') wx.vibrateShort({ type: 'light' });
      else if (flash === 'red') wx.vibrateShort({ type: 'heavy' });
    } catch (e) {}
  },

  // ---------- 结果页 ----------
  backSetup: function () {
    this._clearTimers();
    this.setData({ phase: 'setup', flash: '', resultLine: '' });
    this._setOri('portrait');
  },

  replay: function () { this.onStart(); },

  onHide: function () { this._clearTimers(); },

  onShow: function () {
    this._setOri(this.data.phase === 'playing' ? 'landscape' : 'portrait');
    if (this.data.phase === 'playing') {
      if (this.data.mode === 'timed' && !this._modeTimer) this._startModeTimer();
      if (this.data.mode === 'coop' && !this._resolved && !this._aiTimer) {
        var self = this;
        var delay = Math.max(420, 820 - this.data.round * 25);
        this._aiTimer = setTimeout(function () { self._aiFire(); }, delay);
      }
    }
  },

  onShareAppMessage: function () {
    return { title: '抢颜色·斯特鲁普效应·你反应得过来吗？', path: '/pages/tools/grabcolor/index' };
  }
});
