// 别按这个按钮：屏幕上冒出各种诱人的按钮，忍住别碰，坚持越久分越高
// 所有漂浮按钮都是陷阱，点中任意一只 = 游戏结束；唯一安全可点是右上角"结束"

// 10 种诱惑按钮配置
var TYPES = {
  blink:     { cls: 't-blink',    label: '点我！',               weight: 3 },
  countdown: { cls: 't-count',    label: '3秒后消失，快按！',    weight: 2, count: 3 },
  reward:    { cls: 't-reward',   label: '按一下 +1000分',       weight: 2 },
  system:    { cls: 't-system',   label: '系统错误，点击修复',    weight: 2 },
  vibrate:   { cls: 't-vibrate',  label: '有消息！',             weight: 2 },
  camo:      { cls: 't-camo',     label: '',                     weight: 2, w: 18 },
  move:      { cls: 't-move',     label: '抓我呀～',             weight: 2, moving: true },
  split:     { cls: 't-split',    label: '别按我…',             weight: 2 },
  fakeend:   { cls: 't-fakeend',  label: '游戏结束，查看成绩',    weight: 1 },
  friend:    { cls: 't-friend',   label: '好友坚持58秒，超过他！', weight: 1 }
};

// 前 8 秒只放基础款，后面再上"进阶款"增加难度
var BASIC = ['blink', 'countdown', 'reward', 'system'];

// 点中不同按钮的嘲讽语（结果页显示）
var TAUNT = {
  blink: '你没忍住那句"点我！"',
  countdown: '紧迫感骗到你了，其实它根本不会消失',
  reward: '贪婪让你去按那个"+1000分"',
  system: '好奇心害死猫，偏要"修复系统"',
  vibrate: '本能反应，一震就按了"有消息"',
  camo: '一不小心误触了伪装成背景的按钮',
  move: '追着乱跑的按钮跑，结果按到了',
  split: '强迫症发作，非去按那个分裂按钮',
  fakeend: '你以为游戏结束了，其实它还在进行',
  friend: '被好友挑战激起了胜负欲'
};

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    difficulty: 'normal',    // normal | hard | hell
    seconds: 0,
    best: 0,
    rating: '',
    trapTaunt: '',
    buttons: []              // 漂浮的诱惑按钮：{ id, type, cls, label, w, left, top, moving, vx, vy, count }
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.dontpress === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var best = 0;
    try { best = wx.getStorageSync('dontpress_best') || 0; } catch (e) {}
    this.setData({ best: best });
  },

  onShow: function () {
    // 从后台回来且仍在游戏中：恢复计时器（onHide 会清掉）
    if (this.data.phase === 'playing' && !this._timer) {
      this._resumeTimers();
    }
  },

  onHide: function () { this._stop(); },
  onUnload: function () { this._stop(); },

  // ---------- 设置 ----------
  selectDifficulty: function (e) {
    this.setData({ difficulty: e.currentTarget.dataset.d });
  },

  // ---------- 开局 ----------
  onStart: function () {
    var d = this.data.difficulty;
    this._maxBase = d === 'hell' ? 12 : (d === 'hard' ? 8 : 5);
    this._intervalMin = d === 'hell' ? 350 : (d === 'hard' ? 600 : 900);
    this._interval = d === 'hell' ? 1100 : (d === 'hard' ? 1600 : 2200);
    this._seq = 1;
    this.setData({
      phase: 'playing',
      seconds: 0,
      rating: '',
      trapTaunt: '',
      buttons: []
    });
    this._resumeTimers();
  },

  _resumeTimers: function () {
    var self = this;
    this._timer = setInterval(function () { self._tick(); }, 1000);
    this._moveTimer = setInterval(function () { self._moveTick(); }, 400);
    this._splitTimer = setInterval(function () { self._splitTick(); }, 3500);
    this._spawn = setTimeout(function () { self._spawnTick(); }, 700);
  },

  _stop: function () {
    if (this._timer) clearInterval(this._timer);
    if (this._moveTimer) clearInterval(this._moveTimer);
    if (this._splitTimer) clearInterval(this._splitTimer);
    if (this._spawn) clearTimeout(this._spawn);
    this._timer = this._moveTimer = this._splitTimer = this._spawn = null;
  },

  // ---------- 每秒：计时 + 倒计时按钮数字滚动 ----------
  _tick: function () {
    if (this.data.phase !== 'playing') return;
    var seconds = this.data.seconds + 1;
    var btns = this.data.buttons;
    var hasCount = false, i;
    for (i = 0; i < btns.length; i++) {
      if (btns[i].type === 'countdown') { hasCount = true; break; }
    }
    if (hasCount) {
      var nb = [];
      for (i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.type !== 'countdown') { nb.push(b); continue; }
        var c = b.count - 1; if (c < 1) c = 3;
        nb.push({
          id: b.id, type: b.type, cls: b.cls,
          label: c + '秒后消失，快按！',
          w: b.w, left: b.left, top: b.top,
          moving: b.moving, vx: b.vx, vy: b.vy, count: c
        });
      }
      this.setData({ seconds: seconds, buttons: nb });
    } else {
      this.setData({ seconds: seconds });
    }
  },

  // ---------- 生成按钮 ----------
  _pickType: function () {
    var pool = this.data.seconds < 8 ? BASIC : Object.keys(TYPES);
    var bag = [];
    for (var i = 0; i < pool.length; i++) {
      var k = pool[i];
      var w = TYPES[k].weight || 1;
      for (var j = 0; j < w; j++) bag.push(k);
    }
    return bag[Math.floor(Math.random() * bag.length)];
  },

  _makeButton: function (type) {
    var cfg = TYPES[type];
    var w = cfg.w || 22;
    var left = 3 + Math.random() * (100 - w - 6);
    var top = 3 + Math.random() * (100 - w - 6);
    var b = {
      id: this._seq++,
      type: type,
      cls: cfg.cls,
      label: cfg.label,
      w: w,
      left: +left.toFixed(1),
      top: +top.toFixed(1),
      moving: !!cfg.moving,
      vx: 0, vy: 0,
      count: cfg.count || 0
    };
    if (b.moving) {
      b.vx = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.8);
      b.vy = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.8);
    }
    if (type === 'vibrate' && wx.vibrateShort) {
      try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
    }
    return b;
  },

  _cap: function () {
    var base = this._maxBase + Math.floor(this.data.seconds / 15);
    return Math.min(base, 14);
  },

  // ---------- 定时冒出新按钮，间隔随时间缩短 ----------
  _spawnTick: function () {
    if (this.data.phase !== 'playing') return;
    var btns = this.data.buttons;
    if (btns.length < this._cap()) {
      this.setData({ buttons: btns.concat(this._makeButton(this._pickType())) });
    }
    this._interval = Math.max(this._intervalMin, this._interval - 90);
    var self = this;
    this._spawn = setTimeout(function () { self._spawnTick(); }, this._interval);
  },

  // ---------- 移动按钮漂移（撞墙反弹） ----------
  _moveTick: function () {
    if (this.data.phase !== 'playing') return;
    var btns = this.data.buttons;
    var moved = false;
    var nb = [];
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!b.moving) { nb.push(b); continue; }
      moved = true;
      var nx = b.left + b.vx;
      var ny = b.top + b.vy;
      if (nx < 3) { nx = 3; b.vx = -b.vx; }
      if (nx > 100 - b.w - 3) { nx = 100 - b.w - 3; b.vx = -b.vx; }
      if (ny < 3) { ny = 3; b.vy = -b.vy; }
      if (ny > 100 - b.w - 3) { ny = 100 - b.w - 3; b.vy = -b.vy; }
      nb.push({
        id: b.id, type: b.type, cls: b.cls, label: b.label,
        w: b.w, left: +nx.toFixed(1), top: +ny.toFixed(1),
        moving: true, vx: b.vx, vy: b.vy, count: b.count
      });
    }
    if (moved) this.setData({ buttons: nb });
  },

  // ---------- 分裂按钮：活着就不断复制（受总数上限约束） ----------
  _splitTick: function () {
    if (this.data.phase !== 'playing') return;
    var btns = this.data.buttons;
    var cap = this._cap();
    var added = [];
    for (var i = 0; i < btns.length && btns.length + added.length < cap; i++) {
      if (btns[i].type === 'split') added.push(this._makeButton('split'));
    }
    if (added.length) this.setData({ buttons: btns.concat(added) });
  },

  // ---------- 点中任意漂浮按钮 = 结束 ----------
  tapButton: function (e) {
    if (this.data.phase !== 'playing') return;
    var id = parseInt(e.currentTarget.dataset.id, 10);
    var btns = this.data.buttons;
    var pressed = null;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].id === id) { pressed = btns[i]; break; }
    }
    this._end(pressed);
  },

  // ---------- 右上角"结束"：唯一安全的退出 ----------
  endGame: function () {
    if (this.data.phase === 'playing') this._end(null);
  },

  _end: function (pressed) {
    this._stop();
    var seconds = this.data.seconds;
    var best = this.data.best;
    if (seconds > best) {
      best = seconds;
      try { wx.setStorageSync('dontpress_best', best); } catch (e) {}
    }
    var rating = this._rating(seconds);
    var taunt = pressed ? (TAUNT[pressed.type] || '你还是没忍住') : '你主动认输，体面退场';
    this.setData({
      phase: 'result',
      buttons: [],
      best: best,
      rating: rating,
      trapTaunt: taunt
    });
    if (wx.vibrateLong) { try { wx.vibrateLong(); } catch (e) {} }
  },

  _rating: function (s) {
    if (s < 10) return '手残级';
    if (s < 30) return '还行';
    if (s < 60) return '挺能忍';
    if (s < 120) return '忍者';
    return '佛系大师';
  },

  // ---------- 结果 ----------
  backSetup: function () {
    this.setData({ phase: 'setup', buttons: [], seconds: 0, rating: '', trapTaunt: '' });
  },

  replay: function () {
    this.onStart();
  },

  onShareAppMessage: function () {
    return {
      title: '别按这个按钮·你能忍住几秒？',
      path: '/packages/toolsB/dontpress/index'
    };
  }
});
