// 反着来：屏幕显示指令，玩家必须做出"相反"的反应才能得分
// 7 类反向指令：方向(左/右/上/下)、动作(快/长按)、数量(非3)、颜色(补色)、文字(不要点我→点)、真假(错题为对)
// 连击倍率 + 速度奖励 + 冷静期；生命/限时/难度递增；视觉干扰(颜色冲突/假指令/旋转/闪烁/缩小)

var LONG = 500; // 长按阈值(ms)

// 假算术题（本身错误，反向规则要求点"对"）
var FALSE_STMTS = ['1+1=3', '2×3=5', '10-4=7', '8÷2=5', '3+5=9', '6×1=7', '4+4=9', '9-3=8', '5×2=11', '7÷1=6'];

var MODES = {
  classic: { name: '经典', lives: 3, startLevel: 1, timed: false },
  endless: { name: '无尽', lives: 0, startLevel: 1, timed: false },
  timed:   { name: '限时', lives: 0, startLevel: 1, timed: true },
  hell:    { name: '地狱', lives: 3, startLevel: 10, timed: false }
};

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    mode: 'classic',
    ready: false,
    level: 1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    timeLeft: 0,             // 限时模式剩余秒
    qIndex: 0,               // 已出题数
    correctCount: 0,
    q: null,                 // 当前题
    cntNum: 0,               // 数量题实时点击数
    feedback: '',            // '' | 'correct' | 'wrong'
    wrongTip: '',
    best: 0,
    // 结果
    starsText: '',
    totalDone: 0,
    correctDone: 0
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.reverse === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var best = 0;
    try { best = wx.getStorageSync('reverse_best') || 0; } catch (e) {}
    this.setData({ best: best });
  },

  onShow: function () {
    // 后台返回且仍在游戏中：恢复计时器（onHide 会清掉）
    if (this.data.phase === 'playing' && !this.data.ready && !this._qTimer) {
      this._startQTimer();
      if (this.data.mode === 'timed' && !this._modeTimer) this._startModeTimer();
    }
  },

  onHide: function () { this._stop(); },
  onUnload: function () { this._stop(); },

  // ---------- 设置 ----------
  selectMode: function (e) {
    this.setData({ mode: e.currentTarget.dataset.m });
  },

  // ---------- 开局 ----------
  onStart: function () {
    var m = MODES[this.data.mode];
    this._startLevel = m.startLevel;
    this.setData({
      phase: 'playing',
      ready: true,
      level: m.startLevel,
      score: 0,
      combo: 0,
      bestCombo: 0,
      lives: m.lives,
      timeLeft: m.timed ? 60 : 0,
      qIndex: 0,
      correctCount: 0,
      q: null,
      cntNum: 0,
      feedback: '',
      wrongTip: '',
      calmUntil: 0
    });
    this._locked = false;
    var self = this;
    this._readyTimer = setTimeout(function () {
      self.setData({ ready: false });
      self._next();
    }, 2000);
    if (m.timed) this._startModeTimer();
  },

  _startModeTimer: function () {
    var self = this;
    this._modeTimer = setInterval(function () {
      if (self.data.ready) return;
      var t = self.data.timeLeft - 1;
      self.setData({ timeLeft: t });
      if (t <= 0) { self._stop(); self._end(); }
    }, 1000);
  },

  _stop: function () {
    var keys = ['_qTimer', '_modeTimer', '_readyTimer', '_lockTimer', '_idleTimer'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (this[k]) { clearInterval(this[k]); clearTimeout(this[k]); this[k] = null; }
    }
  },

  _next: function () {
    if (this._isOver()) { this._end(); return; }
    var level = this._startLevel + this.data.qIndex; // 第 N 题 = level N
    this.setData({ level: level });
    this._genQuestion();
  },

  _isOver: function () {
    var m = this.data.mode;
    if (m === 'classic' || m === 'hell') return this.data.lives <= 0;
    if (m === 'timed') return this.data.timeLeft <= 0;
    return false; // endless
  },

  // ---------- 出题 ----------
  _genQuestion: function () {
    var lvl = this.data.level;
    var pool = ['dirLR'];
    if (lvl >= 4) { pool.push('dirUD', 'word'); }
    if (lvl >= 7) { pool.push('action'); }
    if (lvl >= 11) { pool.push('count'); }
    if (lvl >= 16) { pool.push('color'); }
    if (lvl >= 21) { pool.push('truefalse'); }
    var type = pool[Math.floor(Math.random() * pool.length)];

    var q = {
      type: type, targets: [], correctId: '', needLong: false, correctWhenNot3: false,
      timeLimit: Math.max(1000, 3000 - (lvl - 1) * 60), timeLeft: 0, timePct: 100,
      decoy: '', instrStyle: '', blink: false, actLabel: '', cntLabel: '连点这里',
      instruction: ''
    };
    q.timeLeft = q.timeLimit;

    if (type === 'dirLR') {
      var sayLeft = Math.random() < 0.5;
      q.instruction = sayLeft ? '点左边' : '点右边';
      q.correctId = sayLeft ? 'R' : 'L';
      q.targets = [{ id: 'L', label: '左', cls: 'zone' }, { id: 'R', label: '右', cls: 'zone' }];
    } else if (type === 'dirUD') {
      var sayUp = Math.random() < 0.5;
      q.instruction = sayUp ? '点上方' : '点下方';
      q.correctId = sayUp ? 'D' : 'U';
      q.targets = [{ id: 'U', label: '上', cls: 'zone' }, { id: 'D', label: '下', cls: 'zone' }];
    } else if (type === 'word') {
      q.instruction = '不要点我';
      q.correctId = 'W';
      q.targets = [{ id: 'W', label: '不要点我', cls: 'word-btn' }];
    } else if (type === 'action') {
      var quick = Math.random() < 0.5;
      q.instruction = quick ? '快速点击' : '长按';
      q.needLong = !quick;
      q.actLabel = quick ? '快点点我' : '长按我';
    } else if (type === 'count') {
      q.instruction = '点 3 下';
      q.correctWhenNot3 = true;
    } else if (type === 'color') {
      var sayRed = Math.random() < 0.5;
      q.instruction = sayRed ? '点红色' : '点绿色';
      q.correctId = sayRed ? 'G' : 'R';
      q.targets = [{ id: 'R', label: '', cls: 'c-red' }, { id: 'G', label: '', cls: 'c-green' }];
    } else if (type === 'truefalse') {
      var stmt = FALSE_STMTS[Math.floor(Math.random() * FALSE_STMTS.length)];
      q.instruction = stmt + ' 对吗？';
      q.correctId = 'Y';
      q.targets = [{ id: 'Y', label: '对', cls: 'tf' }, { id: 'N', label: '错', cls: 'tf' }];
    }

    // 视觉干扰
    if (lvl >= 4 && Math.random() < 0.5) q.conflictColor = (Math.random() < 0.5) ? '#ff6b6b' : '#4be08a';
    if (lvl >= 4 && Math.random() < 0.4) q.decoy = this._fakeDecoy(q.instruction);
    if (lvl >= 11 && Math.random() < 0.4) q.rotate = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8);
    if (lvl >= 16 && Math.random() < 0.4) q.blink = true;
    if (lvl >= 21 && Math.random() < 0.4) q.fontScale = 0.55 + Math.random() * 0.2;

    var st = '';
    if (q.rotate) st += 'transform:rotate(' + q.rotate.toFixed(1) + 'deg);';
    if (q.conflictColor) st += 'color:' + q.conflictColor + ';';
    if (q.fontScale) st += 'font-size:' + Math.round(64 * q.fontScale) + 'rpx;';
    q.instrStyle = st;

    this._curQ = q;
    this._tapCount = 0;
    this.setData({ q: q, cntNum: 0 });
    this._startQTimer();
  },

  _fakeDecoy: function (main) {
    var arr = ['点左边', '点右边', '点红色', '点绿色', '快速点击', '长按', '点 3 下', '不要点我', '向上滑'];
    var d;
    do { d = arr[Math.floor(Math.random() * arr.length)]; } while (d === main);
    return d;
  },

  _startQTimer: function () {
    var self = this;
    this._qTimer = setInterval(function () {
      if (self._locked) return;
      var q = self.data.q;
      if (!q) return;
      var tl = Math.max(0, q.timeLeft - 100);
      var pct = Math.max(0, tl / q.timeLimit * 100);
      q.timeLeft = tl; q.timePct = pct;
      self.setData({ 'q.timeLeft': tl, 'q.timePct': pct });
      if (tl <= 0) {
        clearInterval(self._qTimer); self._qTimer = null;
        var correct = (q.type === 'count') ? (self._tapCount !== 3 && self._tapCount > 0) : false;
        self._judge(correct, 'timeout');
      }
    }, 100);
  },

  // ---------- 玩家输入 ----------
  onTapTarget: function (e) {
    if (this._locked || !this.data.q) return;
    var id = e.currentTarget.dataset.id;
    this._judge(id === this.data.q.correctId, 'wrong');
  },

  onActStart: function () {
    if (this._locked || !this.data.q) return;
    this._actStart = Date.now();
  },

  onActEnd: function () {
    if (this._locked || !this.data.q || !this._actStart) return;
    var dur = Date.now() - this._actStart;
    this._actStart = 0;
    var correct = this.data.q.needLong ? (dur >= LONG) : (dur < LONG);
    this._judge(correct, 'gesture');
  },

  onCntTap: function () {
    if (this._locked || !this.data.q) return;
    this._tapCount = (this._tapCount || 0) + 1;
    this.setData({ cntNum: this._tapCount });
    var self = this;
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(function () {
      self._idleTimer = null;
      var c = self._tapCount;
      self._judge(c !== 3 && c > 0, 'count');
    }, 650);
  },

  // ---------- 结束本局 ----------
  endGame: function () {
    if (this.data.phase === 'playing') { this._stop(); this._end(); }
  },

  _judge: function (correct, reason) {
    if (this._locked) return;
    this._locked = true;
    if (this._qTimer) { clearInterval(this._qTimer); this._qTimer = null; }
    if (this._idleTimer) { clearTimeout(this._idleTimer); this._idleTimer = null; }

    var q = this.data.q;
    var tl = q ? q.timeLeft : 0;
    var tlMax = q ? q.timeLimit : 1;
    var upd = { qIndex: this.data.qIndex + 1 };

    if (correct) {
      var combo = this.data.combo + 1;
      var gained = this._computeScore(tl, tlMax, combo);
      upd.combo = combo;
      upd.score = this.data.score + gained;
      upd.bestCombo = Math.max(this.data.bestCombo, combo);
      upd.feedback = 'correct';
      upd.correctCount = this.data.correctCount + 1;
      if (wx.vibrateShort && combo >= 21) { try { wx.vibrateShort({ type: 'heavy' }); } catch (e) {} }
    } else {
      upd.combo = 0;
      upd.feedback = 'wrong';
      upd.wrongTip = (reason === 'timeout') ? '太慢了！' : '反了！';
      upd.calmUntil = Date.now() + 3000;
      if (this.data.mode === 'classic' || this.data.mode === 'hell') upd.lives = this.data.lives - 1;
      if (wx.vibrateLong) { try { wx.vibrateLong(); } catch (e) {} }
    }
    this.setData(upd);

    var self = this;
    this._lockTimer = setTimeout(function () {
      self._lockTimer = null;
      self._locked = false;
      self.setData({ feedback: '' });
      if (self._isOver()) self._end();
      else self._next();
    }, 520);
  },

  _computeScore: function (tl, tlMax, combo) {
    var base = 100;
    var diffCoef = 1 + this.data.level * 0.1;
    var mult = combo >= 21 ? 3 : (combo >= 11 ? 2 : (combo >= 6 ? 1.5 : 1));
    var speed = 1 + (tl / tlMax) * 0.5; // 1 ~ 1.5
    var s = base * diffCoef * mult * speed;
    if (Date.now() < (this.data.calmUntil || 0)) s *= 0.5; // 冷静期减半
    return Math.round(s);
  },

  _stars: function (total, correct) {
    var acc = total ? correct / total : 0;
    if (total >= 100 && correct === total) return 5;
    if (total >= 50 && acc > 0.9) return 4;
    if (total >= 30 && acc > 0.85) return 3;
    if (total >= 20 && acc > 0.7) return 2;
    if (total >= 10) return 1;
    return 0;
  },

  _end: function () {
    this._stop();
    var total = this.data.qIndex;
    var correct = this.data.correctCount;
    var stars = this._stars(total, correct);
    var starsText = '';
    for (var i = 0; i < 5; i++) starsText += (i < stars ? '★' : '☆');
    var best = this.data.best;
    if (this.data.score > best) {
      best = this.data.score;
      try { wx.setStorageSync('reverse_best', best); } catch (e) {}
    }
    this.setData({
      phase: 'result', best: best, starsText: starsText,
      totalDone: total, correctDone: correct
    });
  },

  // ---------- 结果 ----------
  backSetup: function () {
    this.setData({ phase: 'setup', q: null, feedback: '', wrongTip: '', cntNum: 0 });
  },

  replay: function () {
    this.onStart();
  },

  onShareAppMessage: function () {
    return {
      title: '反着来·屏幕让你点左你偏点右·你能撑几关？',
      path: '/pages/tools/reverse/index'
    };
  }
});
