// 左右互搏：屏幕左右严格分屏，玩家A（左）/ 玩家B（右）各答各题，
// 但答题行为会"干扰"对方（视觉 / 时间 / 题目 三类干扰）。
// 含能量 + 连击 + 狂暴模式、防挫败机制，支持 限时 / 生存 / 合作 三种模式与单手模式。
//
// 实现约束（微信小程序铁律）：WXML 绑定里不能写裸 '<'、不能调用方法、
// 不能 require json。所有状态（含选项 correct、各类干扰布尔）均在 JS 预计算后 setData。

// ---------- 静态配置 ----------
var COLORS = [
  { key: 'red',    name: '红', hex: '#FF3B30' },
  { key: 'blue',   name: '蓝', hex: '#0A84FF' },
  { key: 'green',  name: '绿', hex: '#34C759' },
  { key: 'yellow', name: '黄', hex: '#FFD60A' }
];
var DIRS = [
  { key: 'L', arrow: '←', mirror: 'R' },
  { key: 'R', arrow: '→', mirror: 'L' },
  { key: 'U', arrow: '↑', mirror: 'U' },
  { key: 'D', arrow: '↓', mirror: 'D' }
];

// 难度：题型池 / 能量恢复 / 干扰强度（basic=仅闪光, small=+变色, medium=+乱跳+加速, all=全部+镜像联动）
var DIFF = {
  entry:  { name: '入门', types: ['math'],                    recover: 20, interference: 'basic' },
  easy:   { name: '简单', types: ['math', 'color'],            recover: 15, interference: 'small' },
  medium: { name: '中等', types: ['math', 'color', 'dir'],     recover: 10, interference: 'medium' },
  hard:   { name: '困难', types: ['math', 'color', 'dir', 'mirror'], recover: 10, interference: 'all' },
  master: { name: '大师', types: ['color', 'dir', 'mirror'], recover: 5,  interference: 'all' }
};

var KIND_NAME = {
  flash: '遮罩', pollute: '颜色污染', wobble: '按钮乱跳', occlude: '遮挡物',
  skip: '强制跳题', swap: '互换时间',
  time: '加速对方', harder: '偷换题目'
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 根据 q 的 kind+rule 计算 answerKey 并刷新每个选项的 correct
function applyRuleToOptions(q) {
  if (q.kind === 'color') {
    q.answerKey = (q.rule === 'color') ? q.meta.colorKey : q.meta.meaningKey;
  } else if (q.kind === 'dir') {
    q.answerKey = q.meta.dirKey;
  } else if (q.kind === 'mirror') {
    q.answerKey = (q.rule === 'actual') ? q.meta.dirKey : q.meta.mirrorKey;
  } else if (q.kind === 'math') {
    q.answerKey = String(q.ans);
  }
  q.options.forEach(function (o) { o.correct = (o.key === q.answerKey); });
  return q;
}

// 生成一道题。hard=true 时倾向更难的题型（用于"偷换题目/强制跳题"）
function genQuestion(diff, hard) {
  var cfg = DIFF[diff] || DIFF.easy;
  var type;
  if (hard) {
    type = rand(['color', 'dir', 'mirror']);
  } else {
    type = rand(cfg.types);
  }
  var q = { kind: type, meta: {}, rule: '', ruleText: '', options: [], promptText: '', displayText: '', displayColor: '', arrow: '' };

  if (type === 'math') {
    var op = rand(['+', '-']);
    var a, b, ans;
    if (op === '+') { a = randInt(2, 9); b = randInt(2, 9); ans = a + b; }
    else { a = randInt(4, 12); b = randInt(2, a); ans = a - b; }
    q.ans = ans;
    q.promptText = a + ' ' + op + ' ' + b + ' = ?';
    var opts = [ans];
    while (opts.length < 4) {
      var v = ans + randInt(-7, 7);
      if (v !== ans && opts.indexOf(v) === -1) opts.push(v);
    }
    q.options = shuffle(opts.map(function (n) {
      return { key: String(n), label: String(n), bg: '#2a2a44', correct: false };
    }));
    applyRuleToOptions(q);
    return q;
  }

  if (type === 'color') {
    var meaning = rand(COLORS);                                   // 显示的字（字义）
    var display = (Math.random() < 0.6) ? rand(COLORS.filter(function (c) { return c.key !== meaning.key; })) : meaning; // 字的颜色（60% 不一致）
    q.meta.meaningKey = meaning.key;
    q.meta.colorKey = display.key;
    q.displayText = meaning.name;
    q.displayColor = display.hex;
    q.rule = (Math.random() < 0.5) ? 'color' : 'meaning';
    q.ruleText = (q.rule === 'color') ? '点字的「颜色」' : '点字的「意思」';
    q.options = shuffle(COLORS.map(function (c) { return { key: c.key, label: c.name, bg: c.hex, correct: false }; }));
    applyRuleToOptions(q);
    return q;
  }

  if (type === 'dir') {
    var d = rand(DIRS);
    q.meta.dirKey = d.key; q.meta.mirrorKey = d.mirror;
    q.arrow = d.arrow;
    q.rule = 'actual';
    q.ruleText = '点实际方向';
    q.options = shuffle(DIRS.map(function (x) { return { key: x.key, label: x.arrow, bg: '#2a2a44', correct: false }; }));
    applyRuleToOptions(q);
    return q;
  }

  // mirror（左右联动题）
  var m = rand(DIRS);
  q.meta.dirKey = m.key; q.meta.mirrorKey = m.mirror;
  q.arrow = m.arrow;
  q.rule = (Math.random() < 0.5) ? 'actual' : 'mirror';
  q.ruleText = (q.rule === 'actual') ? '点实际方向' : '点镜像方向（左右相反）';
  q.options = shuffle(DIRS.map(function (x) { return { key: x.key, label: x.arrow, bg: null, correct: false }; }));
  applyRuleToOptions(q);
  return q;
}

function makeSide(key, name) {
  return {
    key: key, name: name,
    score: 0, energy: 0, combo: 0, lives: 3,
    shield: false, frozen: false, cooldown: false, berserk: 0, comeback: 0,
    flash: false, pollute: false, wobble: false, occlude: false,
    interferedCount: 0, wrongStreak: 0,
    timeLeft: 60, out: false,
    q: null, answered: false, pick: false, note: '', showCorrect: false, ruleFlip: false,
    smallCost: 20, midCost: 50, bigCost: 100,
    smallReady: false, midReady: false, bigReady: false
  };
}

// 构造单次标志位 patch（供 setS 转成路径）
function mkFlag(flag, val) { var o = {}; o[flag] = val; return o; }

Page({
  data: {
    phase: 'setup',            // setup | playing | result
    mode: 'timed',            // timed | survival | coop
    difficulty: 'easy',
    single: false,             // 单手模式（一人左右开弓）
    goalText: '',
    sides: [makeSide('A', '玩家A'), makeSide('B', '玩家B')],
    coopGoal: 15,
    teamScore: 0,
    winnerText: '', modeText: '', summary: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.leftright === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._T = { A: {}, B: {} };   // 各副作用计时器
    this._qStart = { A: 0, B: 0 };
    this._tick = null;
    this._next = { A: null, B: null };
    this._setOri('portrait');
  },

  onShow: function () {
    if (this.data.phase === 'setup') {
      this._setOri('portrait');
    } else if (this.data.phase === 'playing' && this.data.mode === 'timed' && !this._tick) {
      this._startTick();   // 从后台返回时恢复计时
    }
  },

  onHide: function () { this._clearTimers(); },
  onUnload: function () { this._clearTimers(); },

  _clearTimers: function () {
    var self = this;
    ['A', 'B'].forEach(function (k) {
      var t = self._T[k] || {};
      Object.keys(t).forEach(function (f) { clearTimeout(t[f]); });
      self._T[k] = {};
      if (self._next[k]) { clearTimeout(self._next[k]); self._next[k] = null; }
    });
    if (this._tick) { clearInterval(this._tick); this._tick = null; }
  },

  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o }); } catch (e) {}
  },

  // ---------- 工具：按 key 读写某一侧 ----------
  _idx: function (key) { return key === 'A' ? 0 : 1; },
  _other: function (key) { return key === 'A' ? 'B' : 'A'; },
  getS: function (key) { return this.data.sides[this._idx(key)]; },
  setS: function (key, patch) {
    var idx = this._idx(key);
    var obj = {};
    for (var k in patch) {
      if (patch.hasOwnProperty(k)) obj['sides[' + idx + '].' + k] = patch[k];
    }
    this.setData(obj);
  },
  // 提交玩家状态并刷新技能可用性
  commit: function (key, patch) { this.setS(key, patch); this.refreshReadiness(key); },
  refreshReadiness: function (key) {
    var S = this.getS(key);
    var smallCost = S.combo >= 3 ? 0 : 20;
    var midCost = S.combo >= 5 ? 25 : 50;
    var bigCost = 100;
    this.setS(key, {
      smallCost: smallCost, midCost: midCost, bigCost: bigCost,
      smallReady: S.energy >= smallCost,
      midReady: S.energy >= midCost,
      bigReady: S.energy >= bigCost
    });
  },

  // 干扰记录不再展示（保留空函数，避免改动所有调用点）
  _log: function () {},

  _modeName: function () {
    var m = this.data.mode;
    return m === 'timed' ? '限时模式' : m === 'survival' ? '生存模式' : '合作模式';
  },
  _diffName: function () { return (DIFF[this.data.difficulty] || DIFF.easy).name; },

  // ---------- 设置 ----------
  selectMode: function (e) { this.setData({ mode: e.currentTarget.dataset.m }); },
  selectDiff: function (e) { this.setData({ difficulty: e.currentTarget.dataset.d }); },
  toggleSingle: function () { this.setData({ single: !this.data.single }); },

  // ---------- 开局 ----------
  onStart: function () {
    var mode = this.data.mode;
    var diff = this.data.difficulty;
    var cfg = DIFF[diff] || DIFF.easy;
    var a = makeSide('A', '玩家A');
    var b = makeSide('B', '玩家B');
    var patch = {
      phase: 'playing', mode: mode, difficulty: diff,
      sides: [a, b], teamScore: 0,
      winnerText: '', modeText: '', summary: '', goalText: ''
    };
    if (mode === 'timed') {
      patch.goalText = '60 秒 · 分高者胜';
    } else if (mode === 'survival') {
      patch.goalText = '各 3 条命 · 答错丢命';
    } else {
      patch.goalText = '同题两人都对才得分 · 先到 ' + this.data.coopGoal + ' 分';
    }
    this.setData(patch);
    this._setOri('landscape');

    this._clearTimers();
    this._qStart = { A: Date.now(), B: Date.now() };

    if (mode === 'coop') {
      var q = genQuestion(diff, false);
      var qa = JSON.parse(JSON.stringify(q));
      var qb = JSON.parse(JSON.stringify(q));
      this.setS('A', { q: qa, answered: false });
      this.setS('B', { q: qb, answered: false });
    } else {
      this.setS('A', { q: genQuestion(diff, false), answered: false });
      this.setS('B', { q: genQuestion(diff, false), answered: false });
    }
    this.refreshReadiness('A');
    this.refreshReadiness('B');

    if (mode === 'timed') this._startTick();
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
  },

  // ---------- 出题 / 切换 ----------
  _nextQ: function (key, hard) {
    if (this.data.phase !== 'playing') return;
    var S = this.getS(key);
    if (S.out) return;
    this.setS(key, { q: genQuestion(this.data.difficulty, !!hard), answered: false, note: '', showCorrect: false, ruleFlip: false });
    this._qStart[key] = Date.now();
  },
  _scheduleNext: function (key, ms) {
    var self = this;
    if (this._next[key]) clearTimeout(this._next[key]);
    this._next[key] = setTimeout(function () {
      self._next[key] = null;
      if (self.data.phase === 'playing') self._nextQ(key, false);
    }, ms);
  },

  // 镜像联动：一方答对 → 对方若是 mirror 题则反转规则
  _flipOpponentRule: function (winnerKey) {
    var ok = this._other(winnerKey);
    var S = this.getS(ok);
    if (!S.q || S.q.kind !== 'mirror' || S.out) return;
    S.q.rule = (S.q.rule === 'actual') ? 'mirror' : 'actual';
    S.q.ruleText = (S.q.rule === 'actual') ? '点实际方向' : '点镜像方向（左右相反）';
    applyRuleToOptions(S.q);
    this.setS(ok, { q: S.q, note: '⚠️ 对方规则反转！', ruleFlip: true });
  },

  // ---------- 答题 ----------
  answer: function (e) {
    if (this.data.phase !== 'playing') return;
    var key = e.currentTarget.dataset.side;
    var i = Number(e.currentTarget.dataset.i);
    var S = this.getS(key);
    if (!S.q || S.answered || S.out || S.frozen || S.cooldown) return;
    var opt = S.q.options[i];
    if (!opt) return;
    var correct = !!opt.correct;

    if (this.data.mode === 'coop') { this._answerCoop(key, correct); return; }
    this._answerSolo(key, correct);
  },

  _answerSolo: function (key, correct) {
    var diff = this.data.difficulty;
    var cfg = DIFF[diff] || DIFF.easy;
    var S = this.getS(key);
    var interfered = S.pollute || S.wobble || S.occlude;

    if (correct) {
      var now = Date.now();
      var fast = (now - (this._qStart[key] || now)) < 2000;
      var combo = S.combo + 1;
      var base = interfered ? 20 : 10;
      var mult = combo >= 5 ? 3 : (combo >= 3 ? 2 : 1);
      var cbActive = S.comeback > 0;
      var pts = base * mult;
      if (cbActive) pts = pts * 2;
      var score = S.score + pts;
      var energy = Math.min(100, S.energy + cfg.recover);
      var note = '✅ +' + pts + '分' + (interfered ? ' · 干扰题' : (mult > 1 ? ' · ×' + mult : '')) + ' · +' + cfg.recover + '能量';
      var newCb = cbActive ? S.comeback - 1 : S.comeback;
      this.commit(key, {
        answered: true, score: score, energy: energy, combo: combo,
        wrongStreak: 0, comeback: newCb, note: note, showCorrect: false
      });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}

      // 狂暴模式触发 / 维持
      if (combo === 10) this.setS(key, { berserk: 5, note: '🔥 狂暴模式！' });
      else if (S.berserk > 0) this.setS(key, { berserk: S.berserk - 1 });

      // 落后方奋起直追
      this._checkComeback();

      // 自动干扰对方
      this._autoInterfere(key, combo, fast, S.q);

      // 镜像联动：反转对方规则
      this._flipOpponentRule(key);

      this._scheduleNext(key, 700);
    } else {
      var mercy = interfered || S.ruleFlip;   // 被干扰 / 规则被反转时，不扣能量（只丢分/命）
      var energy2 = mercy ? S.energy : Math.max(0, S.energy - 5);
      var wrongStreak = S.wrongStreak + 1;
      var note = mercy ? '❌ 被干扰答错' : '❌ 答错 −5能量';
      this.commit(key, {
        answered: true, energy: energy2, combo: 0, berserk: 0,
        wrongStreak: wrongStreak, note: note, showCorrect: true
      });
      try { wx.vibrateShort({ type: 'heavy' }); } catch (e) {}

      // 若答错方正处于被干扰状态 → 干扰方成功
      if (interfered) {
        var atk = this._other(key);
        var A = this.getS(atk);
        var apatch = { score: A.score + 5 };
        if (this.data.mode === 'survival' && A.lives < 5) apatch.lives = A.lives + 1;
        this.commit(atk, apatch);
        this.setS(atk, { note: '🎯 干扰成功 +5' });
      }

      if (this.data.mode === 'survival') {
        var lives = S.lives - 1;
        this.setS(key, { lives: lives });
        if (lives <= 0) {
          this._clearTimers();
          this._endGame(this._other(key));
          return;
        }
      }

      // 连续答错 3 题 → 冷静期
      if (wrongStreak >= 3) {
        this.setS(key, { cooldown: true, note: '😌 冷静一下…' });
        var self2 = this;
        this._next[key] = setTimeout(function () {
          self2._next[key] = null;
          if (self2.data.phase === 'playing') {
            self2.setS(key, { cooldown: false });
            self2._nextQ(key, false);
          }
        }, 5000);
      } else {
        this._scheduleNext(key, 900);
      }
    }
  },

  // ---------- 合作模式 ----------
  _answerCoop: function (key, correct) {
    this.setS(key, { answered: true, pick: correct });
    var a = this.getS('A'), b = this.getS('B');
    if (!a.answered || !b.answered) return;   // 等待另一方
    if (a.pick && b.pick) {
      var ts = this.data.teamScore + 10;
      this.setData({ teamScore: ts });
      this.setS('A', { note: '✅ 合作成功 +10', combo: a.combo + 1, energy: Math.min(100, a.energy + 10) });
      this.setS('B', { note: '✅ 合作成功 +10', combo: b.combo + 1, energy: Math.min(100, b.energy + 10) });
      if (ts >= this.data.coopGoal) { this._endGame('team'); return; }
    } else {
      this.setS('A', { note: '❌ 不同步，不得分', combo: 0, showCorrect: true });
      this.setS('B', { note: '❌ 不同步，不得分', combo: 0, showCorrect: true });
    }
    var diff = this.data.difficulty;
    var q = genQuestion(diff, false);
    var qa = JSON.parse(JSON.stringify(q));
    var qb = JSON.parse(JSON.stringify(q));
    this.setS('A', { q: qa, answered: false, pick: false, showCorrect: false });
    this.setS('B', { q: qb, answered: false, pick: false, showCorrect: false });
  },

  // ---------- 自动干扰（答对后触发） ----------
  _autoInterfere: function (winnerKey, combo, fast, myQ) {
    var y = this._other(winnerKey);
    if (this.getS(y).out) return;
    var diff = this.data.difficulty;
    var lvl = (DIFF[diff] || DIFF.easy).interference;

    this._interfere(y, 'flash', 500);                 // 闪光弹：每次答对都触发
    if (this.data.mode === 'timed' && lvl !== 'basic') {
      var t = Math.max(0, this.getS(y).timeLeft - 2);
      this.setS(y, { timeLeft: t });
      if (t <= 0) this.setS(y, { out: true, note: '时间到' });
      this._log(winnerKey, y, 'time');
    }
    if (combo % 3 === 0 && lvl !== 'basic') {
      this._interfere(y, 'pollute', 2500);
      this._log(winnerKey, y, 'pollute');
      this._forceSkip(y, winnerKey);                   // 强制跳题
    }
    if (fast && (lvl === 'medium' || lvl === 'all')) {
      this._interfere(y, 'wobble', 2500);
      this._log(winnerKey, y, 'wobble');
    }
    if ((myQ.kind === 'mirror' || myQ.kind === 'dir') && lvl !== 'basic' && lvl !== 'small') {
      this._interfere(y, 'occlude', 1200);
      this._log(winnerKey, y, 'occlude');
    }
    if (combo % 5 === 0 && lvl === 'all') {
      if (this.data.mode === 'timed') this._swapTime();
      else this.setS(winnerKey, { shield: true, note: '🛡️ 获得护盾' });
      this._log(winnerKey, y, 'swap');
    }
    // 狂暴模式：自动随机追加干扰
    if (this.getS(winnerKey).berserk > 0) {
      var extra = rand(['pollute', 'wobble', 'occlude']);
      this._interfere(y, extra, 2200);
    }
  },

  // 施加一次干扰（含护盾抵消逻辑）
  _interfere: function (key, kind, ms) {
    var S = this.getS(key);
    if (S.out) return;
    if (S.shield) {
      this.setS(key, { shield: false, note: '🛡️ 护盾抵消！' });
      return;
    }
    if (kind === 'flash') this._setFlag(key, 'flash', 500);
    else if (kind === 'pollute') this._setFlag(key, 'pollute', 2500);
    else if (kind === 'wobble') this._setFlag(key, 'wobble', 2500);
    else if (kind === 'occlude') this._setFlag(key, 'occlude', 1200);

    var c = S.interferedCount + 1;
    var patch = { interferedCount: c };
    if (c % 3 === 0) patch.shield = true;     // 被连续干扰 → 获得护盾
    this.setS(key, patch);
    if (c % 3 === 0) this.setS(key, { note: '🛡️ 获得护盾' });
  },

  _setFlag: function (key, flag, ms) {
    var T = this._T[key];
    if (T[flag]) clearTimeout(T[flag]);
    var self = this;
    T[flag] = setTimeout(function () {
      self.setS(key, mkFlag(flag, false));
      T[flag] = null;
    }, ms);
    this.setS(key, mkFlag(flag, true));
  },

  _forceSkip: function (key, fromKey) {
    this.setS(key, { q: genQuestion(this.data.difficulty, true), answered: false, note: '⚡ 被强制跳题' });
    this._qStart[key] = Date.now();
    this._log(fromKey, key, 'skip');
  },

  _swapTime: function () {
    var a = this.getS('A').timeLeft, b = this.getS('B').timeLeft;
    this.setS('A', { timeLeft: b });
    this.setS('B', { timeLeft: a });
  },

  _checkComeback: function () {
    var a = this.getS('A'), b = this.getS('B');
    if (b.score - a.score >= 20 && a.comeback === 0) {
      this.setS('A', { comeback: 3, note: '🔥 奋起直追 ×2' });
    }
    if (a.score - b.score >= 20 && b.comeback === 0) {
      this.setS('B', { comeback: 3, note: '🔥 奋起直追 ×2' });
    }
  },

  // ---------- 手动技能 ----------
  useSkill: function (e) {
    if (this.data.phase !== 'playing') return;
    var key = e.currentTarget.dataset.side;
    var k = e.currentTarget.dataset.k;     // small | mid | big
    var S = this.getS(key);
    if (S.out || S.frozen || S.cooldown) return;
    var cost = (k === 'small') ? S.smallCost : (k === 'mid') ? S.midCost : 100;
    if (S.energy < cost) { try { wx.vibrateShort({ type: 'heavy' }); } catch (e2) {} return; }
    var y = this._other(key);

    if (k === 'small') {
      this._interfere(y, 'flash', 500);
      this._interfere(y, 'pollute', 2500);
      this._log(key, y, 'pollute');
    } else if (k === 'mid') {
      this._interfere(y, 'flash', 500);
      this._interfere(y, 'pollute', 2500);
      this._interfere(y, 'wobble', 2500);
      this._forceSkip(y, key);
      if (this.data.mode === 'timed') {
        var t = Math.max(0, this.getS(y).timeLeft - 2);
        this.setS(y, { timeLeft: t });
        if (t <= 0) this.setS(y, { out: true, note: '时间到' });
      }
      this._log(key, y, 'harder');
    } else {
      if (this.data.mode === 'timed') this._swapTime();
      else { this._forceSkip(y, key); this.setS(key, { shield: true, note: '🛡️ 获得护盾' }); }
      this._log(key, y, this.data.mode === 'timed' ? 'swap' : 'skip');
    }
    this.commit(key, { energy: Math.max(0, S.energy - cost) });
    try { wx.vibrateShort({ type: 'medium' }); } catch (e3) {}
  },

  // ---------- 限时模式计时 ----------
  _startTick: function () {
    var self = this;
    this._tick = setInterval(function () {
      if (self.data.phase !== 'playing') { clearInterval(self._tick); self._tick = null; return; }
      var obj = {};
      ['A', 'B'].forEach(function (k) {
        var idx = (k === 'A') ? 0 : 1;
        var s = self.data.sides[idx];
        if (s.out || s.frozen) return;
        var t = s.timeLeft - 1;
        if (t <= 0) { obj['sides[' + idx + '].timeLeft'] = 0; obj['sides[' + idx + '].out'] = true; obj['sides[' + idx + '].note'] = '时间到'; }
        else { obj['sides[' + idx + '].timeLeft'] = t; }
      });
      if (Object.keys(obj).length) self.setData(obj);
      var aOut = self.data.sides[0].out, bOut = self.data.sides[1].out;
      if (aOut && bOut) { clearInterval(self._tick); self._tick = null; self._endGame(self._cmp()); }
    }, 1000);
  },

  _cmp: function () {
    var a = this.data.sides[0].score, b = this.data.sides[1].score;
    return a > b ? 'A' : (b > a ? 'B' : 'draw');
  },

  // ---------- 结束 ----------
  _endGame: function (kind) {
    this._clearTimers();
    var wt = '';
    if (kind === 'A') wt = '🏆 玩家A 获胜！';
    else if (kind === 'B') wt = '🏆 玩家B 获胜！';
    else if (kind === 'team') wt = '🤝 合作成功！';
    else wt = '🤝 平局！';

    var sum;
    if (this.data.mode === 'coop') sum = '团队得分 ' + this.data.teamScore;
    else if (this.data.mode === 'survival') sum = '剩余命数  A ' + this.getS('A').lives + ' · B ' + this.getS('B').lives;
    else sum = '比分  A ' + this.getS('A').score + ' : ' + this.getS('B').score + ' B';

    this.setData({
      phase: 'result', winnerText: wt, summary: sum,
      modeText: this._modeName() + ' · ' + this._diffName() + (this.data.single ? ' · 单手' : '')
    });
    try { wx.vibrateShort({ type: 'heavy' }); } catch (e) {}
  },

  backSetup: function () {
    this._clearTimers();
    this._setOri('portrait');
    this.setData({ phase: 'setup', winnerText: '', modeText: '', summary: '' });
  },
  // 设置页返回首页（自定义导航栏后系统返回键消失，自绘返回）
  navBack: function () {
    var pages = (getCurrentPages && getCurrentPages()) || [];
    if (pages.length > 1) { try { wx.navigateBack(); } catch (e) { wx.reLaunch({ url: '/pages/index/index' }); } }
    else wx.reLaunch({ url: '/pages/index/index' });
  },
  // 直接回工具箱首页（无视页面栈，结束/卡住时都能去其他工具）
  goHome: function () {
    this._clearTimers();
    this._setOri('portrait');
    wx.reLaunch({ url: '/pages/index/index' });
  },
  replay: function () { this.onStart(); },

  onShareAppMessage: function () {
    return { title: '左右互搏·你干扰我我干扰你，脑瓜够用吗？', path: '/packages/toolsB/leftright/index' };
  }
});
