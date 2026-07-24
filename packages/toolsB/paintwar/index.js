var storage = require('../../../utils/storage.js');

// ---------------- 常量 ----------------
var COLORS = [
  { id: 'blue',   c: '#3b82f6', name: '蓝' },
  { id: 'red',    c: '#ef4444', name: '红' },
  { id: 'green',  c: '#22c55e', name: '绿' },
  { id: 'purple', c: '#a855f7', name: '紫' },
  { id: 'orange', c: '#f59e0b', name: '橙' },
  { id: 'pink',   c: '#ec4899', name: '粉' }
];
var DIFFS = {
  easy: { speedK: 0.100, turn: 3.0 },
  mid:  { speedK: 0.135, turn: 3.6 },
  hard: { speedK: 0.175, turn: 4.2 }
};
var SKILL_DUR = 3000;    // 加速持续
var SKILL_CD = 10000;    // 加速冷却
var SKILL_USES = 2;      // 每局次数
var GRACE_MS = 380;      // 自己新画的线的碰撞豁免时间
var EXTRA_MS = 10000;    // 一方死亡后另一方最多再玩10秒
var MIN_TRAIL_CLOSE = 12;// 触发封闭所需最少轨迹格数

function colorById(id) {
  for (var i = 0; i < COLORS.length; i++) if (COLORS[i].id === id) return COLORS[i];
  return COLORS[0];
}
function hexToRgba(hex, a) {
  var r = parseInt(hex.substr(1, 2), 16);
  var g = parseInt(hex.substr(3, 2), 16);
  var b = parseInt(hex.substr(5, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

Page({
  data: {
    isFavorite: false,
    statusBar: 20,
    canvasW: 375,
    canvasH: 667,
    // idle(菜单/设置) | tutorial | rotate(横屏引导) | countdown | playing | over
    gameState: 'idle',
    countText: '',
    oriPaused: false,       // 游戏中转回竖屏导致的暂停
    pauseType: '',          // ori | hide
    resumeNum: 0,           // 恢复倒计时数字
    settings: {
      mode: 'classic',      // classic 经典圈地 | paint 领地染色
      duration: 90,         // 60 / 90 / 120
      diff: 'mid',          // easy / mid / hard
      skills: true,
      sound: true,
      colorA: 'blue',
      colorB: 'red'
    },
    colorsA: [],
    colorsB: [],
    // 对局 HUD
    aPct: 0, bPct: 0,
    timeLeft: 0, timeLow: false,
    aDead: false, bDead: false,
    aColor: '#3b82f6', bColor: '#ef4444',
    aName: '蓝', bName: '红',
    aSkillTxt: '', bSkillTxt: '',
    aSkillOn: false, bSkillOn: false,
    aSkillDis: false, bSkillDis: false,
    // 结果
    result: null
  },

  // ---------------- 生命周期 ----------------
  onLoad: function () {
    var flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (flags.paintwar === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var saved = wx.getStorageSync('paintwar_settings') || {};
    var st = this.data.settings;
    for (var k in saved) if (saved.hasOwnProperty(k) && st.hasOwnProperty(k)) st[k] = saved[k];
    this.setData({ settings: st });
    this._applyColors();
    this.checkFavorite();
    this._setOri('portrait');
    this._computeSize();
  },

  onReady: function () {
    this._computeSize();
    this._initCanvas();
    var self = this;
    this._onResize = function () { self._onResizeEvt(); };
    wx.onWindowResize(this._onResize);
  },

  onShow: function () {
    this.checkFavorite();
    var gs = this.data.gameState;
    this._setOri((gs === 'playing' || gs === 'countdown' || gs === 'over' || gs === 'rotate') ? 'landscape' : 'portrait');
  },

  onHide: function () {
    if (this.data.gameState === 'playing' && !this.data.oriPaused) {
      this._pauseStart = Date.now();
      this.setData({ oriPaused: true, pauseType: 'hide', resumeNum: 0 });
    }
  },

  onUnload: function () {
    if (this._onResize) { wx.offWindowResize(this._onResize); this._onResize = null; }
    this._stopLoop();
    this._clearTimers();
    this._setOri('portrait');
  },

  onBack: function () {
    this._setOri('portrait');
    wx.navigateBack({
      delta: 1,
      fail: function () { wx.reLaunch({ url: '/pages/index/index' }); }
    });
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('paintwar') });
  },
  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('paintwar') });
  },

  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o, fail: function () {} }); } catch (e) {}
  },

  _clearTimers: function () {
    if (this._cdTimers) {
      for (var i = 0; i < this._cdTimers.length; i++) clearTimeout(this._cdTimers[i]);
    }
    this._cdTimers = [];
  },

  // ---------------- 尺寸 / 方向 ----------------
  _isLandscape: function () {
    var W = this.data.canvasW, H = this.data.canvasH;
    return W > H && (W / H) > 1.3;
  },

  _computeSize: function () {
    var sys = wx.getSystemInfoSync();
    var W = sys.windowWidth, H = sys.windowHeight;
    this.setData({ canvasW: W, canvasH: H, statusBar: sys.statusBarHeight || 20 });
    if (this._canvas && this._ctx) {
      var dpr = sys.pixelRatio || 2;
      this._canvas.width = W * dpr;
      this._canvas.height = H * dpr;
      this._ctx.scale(dpr, dpr);
      this._renderStatic();
    }
  },

  _onResizeEvt: function () {
    this._computeSize();
    var land = this._isLandscape();
    var gs = this.data.gameState;
    if (gs === 'rotate' && land) {
      this._beginCountdown();
      return;
    }
    if (gs === 'playing') {
      if (!land && !this.data.oriPaused) {
        // 游戏中转竖屏 -> 自动暂停
        this._pauseStart = Date.now();
        this.setData({ oriPaused: true, pauseType: 'ori', resumeNum: 0 });
      } else if (land && this.data.oriPaused && this.data.pauseType === 'ori') {
        this._resumeWithCount();
      }
    }
  },

  resumeFromHide: function () {
    if (this.data.gameState === 'playing' && this.data.oriPaused) {
      if (!this._isLandscape()) {
        this._setOri('landscape');
        this.setData({ pauseType: 'ori' });
        return;
      }
      this._resumeWithCount();
    }
  },

  _resumeWithCount: function () {
    var self = this;
    this._clearTimers();
    this.setData({ resumeNum: 3 });
    var n = 3;
    var tick = function () {
      n--;
      if (n > 0) {
        self.setData({ resumeNum: n });
        self._cdTimers.push(setTimeout(tick, 1000));
      } else {
        var pausedMs = Date.now() - (self._pauseStart || Date.now());
        self._endAt += pausedMs;
        if (self._extraEndAt) self._extraEndAt += pausedMs;
        self.setData({ oriPaused: false, pauseType: '', resumeNum: 0 });
        self._lastTs = 0;
      }
    };
    this._cdTimers.push(setTimeout(tick, 1000));
  },

  // ---------------- Canvas ----------------
  _initCanvas: function () {
    var self = this;
    this.createSelectorQuery().select('#warCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res[0]) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getSystemInfoSync().pixelRatio || 2;
        canvas.width = self.data.canvasW * dpr;
        canvas.height = self.data.canvasH * dpr;
        ctx.scale(dpr, dpr);
        self._canvas = canvas;
        self._ctx = ctx;
        self._renderStatic();
      });
  },

  _renderStatic: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var gs = this.data.gameState;
    if (gs === 'countdown' || gs === 'playing' || gs === 'over') {
      if (this._st) this._render();
      return;
    }
    ctx.fillStyle = '#fdf6ec';
    ctx.fillRect(0, 0, this.data.canvasW, this.data.canvasH);
  },

  // ---------------- 设置交互 ----------------
  _applyColors: function () {
    var s = this.data.settings;
    var ca = colorById(s.colorA), cb = colorById(s.colorB);
    var la = [], lb = [];
    for (var i = 0; i < COLORS.length; i++) {
      var o = COLORS[i];
      la.push({ id: o.id, c: o.c, name: o.name, sel: o.id === s.colorA, dis: o.id === s.colorB });
      lb.push({ id: o.id, c: o.c, name: o.name, sel: o.id === s.colorB, dis: o.id === s.colorA });
    }
    this.setData({
      colorsA: la, colorsB: lb,
      aColor: ca.c, bColor: cb.c, aName: ca.name, bName: cb.name
    });
  },

  _saveSettings: function () {
    wx.setStorageSync('paintwar_settings', this.data.settings);
  },

  setMode: function (e) {
    this.setData({ 'settings.mode': e.currentTarget.dataset.mode });
    this._saveSettings();
  },
  setDuration: function (e) {
    this.setData({ 'settings.duration': Number(e.currentTarget.dataset.v) });
    this._saveSettings();
  },
  setDiff: function (e) {
    this.setData({ 'settings.diff': e.currentTarget.dataset.v });
    this._saveSettings();
  },
  toggleSkills: function () {
    this.setData({ 'settings.skills': !this.data.settings.skills });
    this._saveSettings();
  },
  toggleSound: function () {
    this.setData({ 'settings.sound': !this.data.settings.sound });
    this._saveSettings();
  },
  pickColorA: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.settings.colorB) return;
    this.setData({ 'settings.colorA': id });
    this._applyColors(); this._saveSettings();
  },
  pickColorB: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.settings.colorA) return;
    this.setData({ 'settings.colorB': id });
    this._applyColors(); this._saveSettings();
  },
  openTutorial: function () { this.setData({ gameState: 'tutorial' }); },
  closeTutorial: function () { this.setData({ gameState: 'idle' }); },

  // ---------------- 开始 / 横屏引导 ----------------
  startGame: function () {
    if (this._starting) return;
    this._starting = true;
    var self = this;
    this.setData({ gameState: 'rotate', result: null });
    this._setOri('landscape');
    // 兜底: 部分环境 resize 事件不触发
    setTimeout(function () {
      self._starting = false;
      if (self.data.gameState === 'rotate') {
        self._computeSize();
        if (self._isLandscape()) self._beginCountdown();
      }
    }, 1100);
    // 再兜底一次
    setTimeout(function () {
      if (self.data.gameState === 'rotate') {
        self._computeSize();
        if (self._isLandscape()) self._beginCountdown();
      }
    }, 2500);
  },

  cancelRotate: function () {
    this._clearTimers();
    this._setOri('portrait');
    this.setData({ gameState: 'idle' });
  },

  // ---------------- 对局初始化 ----------------
  _initMatch: function () {
    var W = this.data.canvasW, H = this.data.canvasH;
    var s = this.data.settings;
    var playH = Math.floor(H * 0.75);
    var pad = 8;
    var cell = Math.max(4, Math.floor((playH - pad * 2) / 46));
    var cols = Math.floor((W - pad * 2) / cell);
    if (cols > 176) cols = 176;
    var rows = Math.floor((playH - pad * 2) / cell);
    var ox = Math.floor((W - cols * cell) / 2);
    var oy = pad + Math.floor((playH - pad * 2 - rows * cell) / 2);

    var d = DIFFS[s.diff] || DIFFS.mid;
    var ca = colorById(s.colorA), cb = colorById(s.colorB);

    var st = {
      mode: s.mode,
      cell: cell, cols: cols, rows: rows, ox: ox, oy: oy,
      pw: cols * cell, ph: rows * cell,
      lineW: Math.max(4, cell),
      speed: W * d.speedK,          // px / s
      turn: d.turn,                 // rad / s
      terr: new Uint8Array(cols * rows),   // 0 无 1 A领地 2 B领地
      trail: new Uint8Array(cols * rows),  // 0 无 1 A线 2 B线
      stamp: new Float64Array(cols * rows),
      aCount: 0, bCount: 0, total: cols * rows,
      pens: []
    };

    var cy = oy + st.ph / 2;
    st.pens.push(this._makePen(1, ox + st.pw * 0.25, cy, 0, ca.c));           // A 向右(向中心)
    st.pens.push(this._makePen(2, ox + st.pw * 0.75, cy, Math.PI, cb.c));     // B 向左(向中心)

    this._st = st;

    // 初始基地(经典模式): 出生点小圆领地
    if (st.mode === 'classic') {
      this._fillTerrDisc(st.pens[0], 4);
      this._fillTerrDisc(st.pens[1], 4);
    } else {
      this._paintDisc(st.pens[0], 3);
      this._paintDisc(st.pens[1], 3);
    }
    this._recount();

    // 领地离屏层
    this._makeTerrLayer();
    this._redrawTerr();

    this._touchA = null;
    this._touchB = null;

    this.setData({
      aPct: this._pct(st.aCount), bPct: this._pct(st.bCount),
      timeLeft: s.duration, timeLow: false,
      aDead: false, bDead: false,
      aSkillTxt: 'x' + SKILL_USES, bSkillTxt: 'x' + SKILL_USES,
      aSkillOn: false, bSkillOn: false,
      aSkillDis: false, bSkillDis: false,
      oriPaused: false, pauseType: '', resumeNum: 0
    });
  },

  _makePen: function (owner, x, y, ang, color) {
    return {
      owner: owner, x: x, y: y, ang: ang, targetAng: ang,
      color: color, colorFill: hexToRgba(color, 0.35),
      moving: false, alive: true, deadAt: 0, bornAt: Date.now(),
      trailPts: [], trailCells: [], trailLen: 0,
      skillUses: SKILL_USES, skillUntil: 0, skillCd: 0
    };
  },

  _makeTerrLayer: function () {
    var W = this.data.canvasW, playH = Math.floor(this.data.canvasH * 0.75);
    var dpr = 2;
    try { dpr = wx.getSystemInfoSync().pixelRatio || 2; } catch (e0) {}
    try {
      this._terrCanvas = wx.createOffscreenCanvas({ type: '2d', width: W * dpr, height: playH * dpr });
      this._terrCtx = this._terrCanvas.getContext('2d');
      this._terrCtx.scale(dpr, dpr);
      this._terrW = W;
      this._terrH = playH;
      this._terrDpr = dpr;
    } catch (e) {
      this._terrCanvas = null;
      this._terrCtx = null;
    }
  },

  _redrawTerr: function () {
    var tc = this._terrCtx;
    if (!tc) return;
    var st = this._st;
    var W = this.data.canvasW, playH = Math.floor(this.data.canvasH * 0.75);
    tc.clearRect(0, 0, W, playH);
    // 背景
    tc.fillStyle = '#fffdf5';
    tc.fillRect(0, 0, W, playH);
    // 网格
    tc.strokeStyle = 'rgba(140,120,90,0.10)';
    tc.lineWidth = 1;
    var i, g;
    for (i = 0; i <= st.cols; i += 4) {
      g = st.ox + i * st.cell;
      tc.beginPath(); tc.moveTo(g, st.oy); tc.lineTo(g, st.oy + st.ph); tc.stroke();
    }
    for (i = 0; i <= st.rows; i += 4) {
      g = st.oy + i * st.cell;
      tc.beginPath(); tc.moveTo(st.ox, g); tc.lineTo(st.ox + st.pw, g); tc.stroke();
    }
    // 领地
    var fa = this._st.pens[0].colorFill, fb = this._st.pens[1].colorFill;
    for (var r = 0; r < st.rows; r++) {
      for (var c = 0; c < st.cols; c++) {
        var v = st.terr[r * st.cols + c];
        if (v === 0) continue;
        tc.fillStyle = v === 1 ? fa : fb;
        tc.fillRect(st.ox + c * st.cell, st.oy + r * st.cell, st.cell, st.cell);
      }
    }
  },

  // ---------------- 格子工具 ----------------
  _cellAt: function (x, y) {
    var st = this._st;
    var c = Math.floor((x - st.ox) / st.cell);
    var r = Math.floor((y - st.oy) / st.cell);
    if (c < 0 || r < 0 || c >= st.cols || r >= st.rows) return -1;
    return r * st.cols + c;
  },

  _discCells: function (x, y, radCells) {
    var st = this._st;
    var out = [];
    var cc = (x - st.ox) / st.cell, cr = (y - st.oy) / st.cell;
    var lo = Math.floor(-radCells), hi = Math.ceil(radCells);
    for (var dr = lo; dr <= hi; dr++) {
      for (var dc = lo; dc <= hi; dc++) {
        var c = Math.floor(cc + dc), r = Math.floor(cr + dr);
        if (c < 0 || r < 0 || c >= st.cols || r >= st.rows) continue;
        var dx = c + 0.5 - cc, dy = r + 0.5 - cr;
        if (dx * dx + dy * dy <= radCells * radCells) out.push(r * st.cols + c);
      }
    }
    return out;
  },

  _fillTerrDisc: function (pen, radCells) {
    var st = this._st;
    var cells = this._discCells(pen.x, pen.y, radCells);
    for (var i = 0; i < cells.length; i++) st.terr[cells[i]] = pen.owner;
  },

  _paintDisc: function (pen, radCells) {
    var st = this._st;
    var cells = this._discCells(pen.x, pen.y, radCells);
    var changed = false;
    for (var i = 0; i < cells.length; i++) {
      var ci = cells[i];
      if (st.terr[ci] !== pen.owner) {
        if (st.terr[ci] === 1) st.aCount--;
        else if (st.terr[ci] === 2) st.bCount--;
        st.terr[ci] = pen.owner;
        if (pen.owner === 1) st.aCount++; else st.bCount++;
        changed = true;
      }
    }
    // 染色模式直接把颜色画到领地层
    if (changed && this._terrCtx) {
      this._terrCtx.fillStyle = pen.colorFill;
      this._terrCtx.beginPath();
      this._terrCtx.arc(pen.x, pen.y, radCells * st.cell, 0, Math.PI * 2);
      this._terrCtx.fill();
    }
  },

  _recount: function () {
    var st = this._st;
    var a = 0, b = 0;
    for (var i = 0; i < st.terr.length; i++) {
      if (st.terr[i] === 1) a++;
      else if (st.terr[i] === 2) b++;
    }
    st.aCount = a; st.bCount = b;
  },

  _pct: function (n) {
    var st = this._st;
    if (!st || !st.total) return 0;
    return Math.round(n * 100 / st.total);
  },

  // ---------------- 倒计时开局 ----------------
  _beginCountdown: function () {
    if (this._counting) return;
    this._counting = true;
    var self = this;
    this._clearTimers();
    this._computeSize();
    this._initMatch();
    this.setData({ gameState: 'countdown', countText: '准备' });
    this._startLoop();
    var seq = ['3', '2', '1', 'GO'];
    var idx = 0;
    var next = function () {
      if (idx < seq.length) {
        self.setData({ countText: seq[idx] });
        idx++;
        self._cdTimers.push(setTimeout(next, idx === seq.length ? 600 : 800));
      } else {
        self._counting = false;
        self._endAt = Date.now() + self.data.settings.duration * 1000;
        self._extraEndAt = 0;
        self._lastTs = 0;
        self._lastSync = 0;
        self.setData({ gameState: 'playing', countText: '' });
      }
    };
    this._cdTimers.push(setTimeout(next, 700));
  },

  // ---------------- 主循环 ----------------
  _startLoop: function () {
    var self = this;
    this._stopLoop();
    this._lastTs = 0;
    var frame = function (ts) {
      self._rafId = null;
      var gs = self.data.gameState;
      if (gs !== 'countdown' && gs !== 'playing') return;
      var now = Date.now();
      var dt = self._lastTs ? Math.min(50, now - self._lastTs) / 1000 : 0;
      self._lastTs = now;
      if (gs === 'playing' && !self.data.oriPaused) {
        self._step(dt, now);
      }
      self._render();
      if (self._canvas) self._rafId = self._canvas.requestAnimationFrame(frame);
    };
    if (this._canvas) this._rafId = this._canvas.requestAnimationFrame(frame);
  },

  _stopLoop: function () {
    if (this._rafId && this._canvas) {
      try { this._canvas.cancelAnimationFrame(this._rafId); } catch (e) {}
    }
    this._rafId = null;
  },

  _step: function (dt, now) {
    var st = this._st;
    if (!st || dt <= 0) { this._syncHud(now); return; }

    for (var i = 0; i < st.pens.length; i++) {
      this._stepPen(st.pens[i], st.pens[1 - i], dt, now);
    }

    // 结束条件
    var aAlive = st.pens[0].alive, bAlive = st.pens[1].alive;
    if (st.mode === 'classic') {
      if (!aAlive && !bAlive) { this._finishMatch(); return; }
      if ((!aAlive || !bAlive) && !this._extraEndAt) {
        this._extraEndAt = Math.min(this._endAt, now + EXTRA_MS);
      }
    }
    var endAt = this._extraEndAt || this._endAt;
    if (now >= endAt) { this._finishMatch(); return; }

    this._syncHud(now);
  },

  _stepPen: function (p, other, dt, now) {
    if (!p.alive || !p.moving) return;
    var st = this._st;

    // 技能加速
    var boost = (p.skillUntil > now) ? 2 : 1;

    // 转向(最小转弯半径 = speed / turn)
    var diff = p.targetAng - p.ang;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    var maxTurn = st.turn * dt;
    if (diff > maxTurn) diff = maxTurn;
    if (diff < -maxTurn) diff = -maxTurn;
    p.ang += diff;

    var spd = st.speed * boost;
    var nx = p.x + Math.cos(p.ang) * spd * dt;
    var ny = p.y + Math.sin(p.ang) * spd * dt;

    var m = st.lineW * 0.5;
    var minX = st.ox + m, maxX = st.ox + st.pw - m;
    var minY = st.oy + m, maxY = st.oy + st.ph - m;

    if (st.mode === 'paint') {
      // 染色模式: 无死亡, 撞墙停住
      if (nx < minX) nx = minX; if (nx > maxX) nx = maxX;
      if (ny < minY) ny = minY; if (ny > maxY) ny = maxY;
      p.x = nx; p.y = ny;
      this._paintDisc(p, 1.6);
      return;
    }

    // ----- 经典模式 -----
    // 撞墙死
    if (nx < minX || nx > maxX || ny < minY || ny > maxY) {
      this._killPen(p, now);
      return;
    }

    // 碰线检测
    var cells = this._discCells(nx, ny, 1.0);
    for (var i = 0; i < cells.length; i++) {
      var ci = cells[i];
      var tv = st.trail[ci];
      if (tv === 0) continue;
      if (tv !== p.owner) { this._killPen(p, now); return; }        // 碰对方线, 主动方死
      if (now - st.stamp[ci] > GRACE_MS) { this._killPen(p, now); return; } // 碰自己旧线死
    }

    p.x = nx; p.y = ny;

    // 回到自己领地 -> 封闭占地
    var hc = this._cellAt(nx, ny);
    if (hc >= 0 && st.terr[hc] === p.owner && p.trailCells.length > MIN_TRAIL_CLOSE) {
      this._closeRegion(p);
      return;
    }

    // 写入轨迹格
    if (hc >= 0 && st.terr[hc] !== p.owner) {
      var wcells = this._discCells(nx, ny, 1.0);
      for (var j = 0; j < wcells.length; j++) {
        var wi = wcells[j];
        if (st.trail[wi] === 0 && st.terr[wi] !== p.owner) {
          st.trail[wi] = p.owner;
          st.stamp[wi] = now;
          p.trailCells.push(wi);
        }
      }
      // 渲染用轨迹点
      var pts = p.trailPts;
      var last = pts.length ? pts[pts.length - 1] : null;
      if (!last || (nx - last.x) * (nx - last.x) + (ny - last.y) * (ny - last.y) > st.cell * st.cell * 0.5) {
        pts.push({ x: nx, y: ny });
      }
    } else if (p.trailCells.length === 0) {
      // 还在自己基地里移动, 不产生轨迹
      p.trailPts = [];
    }
  },

  _killPen: function (p, now) {
    p.alive = false;
    p.deadAt = now;
    if (this.data.settings.sound) {
      try { wx.vibrateShort({ type: 'medium' }); } catch (e) { try { wx.vibrateShort(); } catch (e2) {} }
    }
    this.setData(p.owner === 1 ? { aDead: true } : { bDead: true });
  },

  // 封闭区域: 轨迹转领地 + 洪水填充圈住的地盘
  _closeRegion: function (p) {
    var st = this._st;
    var i;
    for (i = 0; i < p.trailCells.length; i++) {
      var ci = p.trailCells[i];
      st.trail[ci] = 0;
      st.terr[ci] = p.owner;
    }
    p.trailCells = [];
    p.trailPts = [];

    // 从边界 BFS 所有"非本方领地"可达区域, 不可达的都归本方
    var cols = st.cols, rows = st.rows, me = p.owner;
    var total = cols * rows;
    var vis = new Uint8Array(total);
    var queue = new Int32Array(total);
    var qh = 0, qt = 0;
    var c, r, idx;
    for (c = 0; c < cols; c++) {
      idx = c;
      if (st.terr[idx] !== me && !vis[idx]) { vis[idx] = 1; queue[qt++] = idx; }
      idx = (rows - 1) * cols + c;
      if (st.terr[idx] !== me && !vis[idx]) { vis[idx] = 1; queue[qt++] = idx; }
    }
    for (r = 0; r < rows; r++) {
      idx = r * cols;
      if (st.terr[idx] !== me && !vis[idx]) { vis[idx] = 1; queue[qt++] = idx; }
      idx = r * cols + cols - 1;
      if (st.terr[idx] !== me && !vis[idx]) { vis[idx] = 1; queue[qt++] = idx; }
    }
    while (qh < qt) {
      idx = queue[qh++];
      c = idx % cols; r = (idx - c) / cols;
      var nb;
      if (c > 0) { nb = idx - 1; if (!vis[nb] && st.terr[nb] !== me) { vis[nb] = 1; queue[qt++] = nb; } }
      if (c + 1 < cols) { nb = idx + 1; if (!vis[nb] && st.terr[nb] !== me) { vis[nb] = 1; queue[qt++] = nb; } }
      if (r > 0) { nb = idx - cols; if (!vis[nb] && st.terr[nb] !== me) { vis[nb] = 1; queue[qt++] = nb; } }
      if (r + 1 < rows) { nb = idx + cols; if (!vis[nb] && st.terr[nb] !== me) { vis[nb] = 1; queue[qt++] = nb; } }
    }
    for (i = 0; i < total; i++) {
      if (!vis[i] && st.terr[i] !== me) {
        st.terr[i] = me;
        if (st.trail[i] === me) st.trail[i] = 0; // 被包进来的自己残线清掉
      }
    }
    this._recount();
    this._redrawTerr();
    if (this.data.settings.sound) {
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
    }
  },

  // ---------------- HUD 同步(节流) ----------------
  _syncHud: function (now) {
    if (now - (this._lastSync || 0) < 300) return;
    this._lastSync = now;
    var st = this._st;
    var endAt = this._extraEndAt || this._endAt;
    var left = Math.max(0, Math.ceil((endAt - now) / 1000));
    var d = {
      aPct: this._pct(st.aCount),
      bPct: this._pct(st.bCount),
      timeLeft: left,
      timeLow: left > 0 && left <= 10
    };
    if (this.data.settings.skills) {
      var pa = st.pens[0], pb = st.pens[1];
      d.aSkillOn = pa.skillUntil > now;
      d.bSkillOn = pb.skillUntil > now;
      d.aSkillDis = !pa.alive || pa.skillUses === 0 || pa.skillCd > now;
      d.bSkillDis = !pb.alive || pb.skillUses === 0 || pb.skillCd > now;
      d.aSkillTxt = pa.skillCd > now ? Math.ceil((pa.skillCd - now) / 1000) + 's' : 'x' + pa.skillUses;
      d.bSkillTxt = pb.skillCd > now ? Math.ceil((pb.skillCd - now) / 1000) + 's' : 'x' + pb.skillUses;
    }
    this.setData(d);
  },

  useSkillA: function () { this._useSkill(0); },
  useSkillB: function () { this._useSkill(1); },
  _useSkill: function (i) {
    if (this.data.gameState !== 'playing' || this.data.oriPaused) return;
    if (!this.data.settings.skills || !this._st) return;
    var p = this._st.pens[i];
    var now = Date.now();
    if (!p.alive || p.skillUses <= 0 || p.skillCd > now) return;
    p.skillUses--;
    p.skillUntil = now + SKILL_DUR;
    p.skillCd = now + SKILL_CD;
    this._lastSync = 0;
    this._syncHud(now);
  },

  // 停笔后重新出发: 刷新头部附近自己线的豁免时间, 避免原地判死
  _refreshGrace: function (p) {
    var st = this._st;
    var now = Date.now();
    var cells = this._discCells(p.x, p.y, 2.0);
    for (var i = 0; i < cells.length; i++) {
      if (st.trail[cells[i]] === p.owner) st.stamp[cells[i]] = now;
    }
  },

  // ---------------- 触摸控制 ----------------
  onTouchStart: function (e) {
    if (this.data.gameState !== 'playing' || this.data.oriPaused) return;
    var W = this.data.canvasW;
    var st = this._st;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var x = t.clientX;
      if (x < W * 0.45) {
        if (!this._touchA) {
          this._touchA = { id: t.identifier, x: t.clientX, y: t.clientY };
          if (st.pens[0].alive) { st.pens[0].moving = true; this._refreshGrace(st.pens[0]); }
        }
      } else if (x > W * 0.55) {
        if (!this._touchB) {
          this._touchB = { id: t.identifier, x: t.clientX, y: t.clientY };
          if (st.pens[1].alive) { st.pens[1].moving = true; this._refreshGrace(st.pens[1]); }
        }
      }
      // 中间 10% 隔离区: 忽略
    }
  },

  onTouchMove: function (e) {
    if (this.data.gameState !== 'playing' || this.data.oriPaused) return;
    var st = this._st;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var slot = null, pen = null;
      if (this._touchA && t.identifier === this._touchA.id) { slot = this._touchA; pen = st.pens[0]; }
      else if (this._touchB && t.identifier === this._touchB.id) { slot = this._touchB; pen = st.pens[1]; }
      if (!slot) continue;
      var dx = t.clientX - slot.x, dy = t.clientY - slot.y;
      if (dx * dx + dy * dy >= 36) {
        pen.targetAng = Math.atan2(dy, dx);
        slot.x = t.clientX; slot.y = t.clientY;
      }
    }
  },

  onTouchEnd: function (e) {
    var st = this._st;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (this._touchA && t.identifier === this._touchA.id) {
        this._touchA = null;
        if (st) st.pens[0].moving = false;
      } else if (this._touchB && t.identifier === this._touchB.id) {
        this._touchB = null;
        if (st) st.pens[1].moving = false;
      }
    }
  },

  // ---------------- 渲染 ----------------
  _render: function () {
    var ctx = this._ctx;
    var st = this._st;
    if (!ctx || !st) return;
    var W = this.data.canvasW, H = this.data.canvasH;
    var now = Date.now();

    ctx.fillStyle = '#fdf6ec';
    ctx.fillRect(0, 0, W, H);

    // 领地层
    if (this._terrCanvas) {
      ctx.drawImage(this._terrCanvas, 0, 0, this._terrW * this._terrDpr, this._terrH * this._terrDpr,
        0, 0, this._terrW, this._terrH);
    } else {
      // 兜底: 直接画
      var fa = st.pens[0].colorFill, fb = st.pens[1].colorFill;
      for (var r0 = 0; r0 < st.rows; r0++) {
        for (var c0 = 0; c0 < st.cols; c0++) {
          var v0 = st.terr[r0 * st.cols + c0];
          if (v0 === 0) continue;
          ctx.fillStyle = v0 === 1 ? fa : fb;
          ctx.fillRect(st.ox + c0 * st.cell, st.oy + r0 * st.cell, st.cell, st.cell);
        }
      }
    }

    // 边界墙
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 4;
    ctx.strokeRect(st.ox - 2, st.oy - 2, st.pw + 4, st.ph + 4);

    // 中线提示(淡)
    ctx.strokeStyle = 'rgba(141,110,99,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(st.ox + st.pw / 2, st.oy);
    ctx.lineTo(st.ox + st.pw / 2, st.oy + st.ph);
    ctx.stroke();
    ctx.setLineDash([]);

    // 轨迹与画笔
    var blink = this.data.gameState === 'countdown' ? (Math.floor(now / 300) % 2 === 0) : true;
    for (var i = 0; i < st.pens.length; i++) {
      var p = st.pens[i];
      // 轨迹
      if (st.mode === 'classic' && p.trailPts.length > 0) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = st.lineW;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trailPts[0].x, p.trailPts[0].y);
        for (var k = 1; k < p.trailPts.length; k++) ctx.lineTo(p.trailPts[k].x, p.trailPts[k].y);
        if (p.alive) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      // 画笔头
      if (!blink && this.data.gameState === 'countdown') continue;
      var pr = st.lineW * 0.9 + 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = p.alive ? p.color : '#9e9e9e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (p.alive) {
        // 方向箭头
        var ax = p.x + Math.cos(p.ang) * (pr + 6);
        var ay = p.y + Math.sin(p.ang) * (pr + 6);
        var la = p.ang + 2.5, ra = p.ang - 2.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(la) * 7, ay + Math.sin(la) * 7);
        ctx.lineTo(ax + Math.cos(ra) * 7, ay + Math.sin(ra) * 7);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        // 加速光环
        if (p.skillUntil > now) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr + 5, 0, Math.PI * 2);
          ctx.strokeStyle = hexToRgba(p.color, 0.5);
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else {
        // 死亡: 灰色 + ×
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 3;
        var xr = pr * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x - xr, p.y - xr); ctx.lineTo(p.x + xr, p.y + xr);
        ctx.moveTo(p.x + xr, p.y - xr); ctx.lineTo(p.x - xr, p.y + xr);
        ctx.stroke();
      }
    }
  },

  // ---------------- 结束 ----------------
  endMatchEarly: function () {
    var self = this;
    if (this.data.gameState !== 'playing') return;
    wx.showModal({
      title: '结束本局?',
      content: '按当前占地面积结算',
      confirmText: '结束',
      cancelText: '继续玩',
      success: function (res) {
        if (res.confirm && self.data.gameState === 'playing') self._finishMatch();
      }
    });
  },

  _finishMatch: function () {
    var st = this._st;
    if (!st) return;
    this._recount();
    var aPct = this._pct(st.aCount), bPct = this._pct(st.bCount);
    var an = this.data.aName, bn = this.data.bName;
    var title, winner;
    if (aPct > bPct) { title = an + '方获胜!'; winner = 1; }
    else if (bPct > aPct) { title = bn + '方获胜!'; winner = 2; }
    else { title = '平局!'; winner = 0; }
    var mx = Math.max(aPct, bPct, 1);
    var subs = [];
    var dur = this.data.settings.duration;
    for (var i = 0; i < st.pens.length; i++) {
      var p = st.pens[i];
      if (!p.alive && p.deadAt) {
        var lived = Math.max(1, Math.round((p.deadAt - (this._endAt - dur * 1000)) / 1000));
        if (lived > 0 && lived <= dur) {
          subs.push((i === 0 ? an : bn) + '方存活 ' + lived + ' 秒');
        }
      }
    }
    this.setData({
      gameState: 'over',
      result: {
        title: title,
        winner: winner,
        aPct: aPct,
        bPct: bPct,
        aBarW: Math.round(aPct * 100 / mx),
        bBarW: Math.round(bPct * 100 / mx),
        sub: subs.join(' · ')
      }
    });
    this._stopLoop();
    this._render();
  },

  playAgain: function () {
    // 保持横屏, 直接重开
    this._clearTimers();
    this._counting = false;
    if (this._isLandscape()) {
      this._beginCountdown();
    } else {
      this.setData({ gameState: 'rotate' });
      this._setOri('landscape');
    }
  },

  backToSettings: function () {
    this._stopLoop();
    this._clearTimers();
    this._counting = false;
    this._setOri('portrait');
    this.setData({ gameState: 'idle', result: null });
  }
});
