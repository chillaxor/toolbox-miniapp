// 分裂球 · 同屏双人实时反应游戏
// 中央分裂出双色球飞向左右，玩家点自己颜色得分，点错对方颜色对方得分
// Canvas 2D 渲染 + 游戏循环；HUD 用 WXML 叠加层

var app = getApp();

// 调色板（前 colorCount 个参与随机）
var PALETTE = [
  { name: '红', hex: '#ff5b5b' },
  { name: '蓝', hex: '#4d8bff' },
  { name: '绿', hex: '#37d67a' },
  { name: '黄', hex: '#ffd23f' },
  { name: '紫', hex: '#b06bff' },
  { name: '橙', hex: '#ff8a3d' }
];

Page({
  data: {
    phase: 'setup', // setup | playing | result

    // 设置项
    modes: [
      { id: 'timed', name: '限时 60s' },
      { id: 'survival', name: '生存 3命' },
      { id: 'endless', name: '无尽' }
    ],
    mode: 'timed',
    difficulties: [
      { id: 'kid', name: '儿童' },
      { id: 'normal', name: '标准' },
      { id: 'hard', name: '困难' }
    ],
    difficulty: 'normal',
    colorOpts: [2, 3, 4, 5, 6],
    colorCount: 4,
    stroop: false,
    colorSwap: false,
    coop: false,
    advanced: false,

    // HUD
    scoreA: 0,
    scoreB: 0,
    comboA: 0,
    comboB: 0,
    livesA: 3,
    livesB: 3,
    ballCount: 0,
    timeText: '60',
    colorAHex: PALETTE[0].hex,
    colorBHex: PALETTE[1].hex,
    banner: '',

    // 结果
    resultTitle: '',
    resultDetail: ''
  },

  onLoad: function () {
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    if (flags.splitball === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._sid = 1;
    this._flash = { A: null, B: null };
    this._setOri('portrait');
  },

  onReady: function () {
    this._initCanvas();
  },

  onHide: function () {
    this._stopLoop();
  },

  onUnload: function () {
    this._stopLoop();
    if (this._bannerTimer) clearTimeout(this._bannerTimer);
    if (this._startTimer) clearTimeout(this._startTimer);
  },

  onShow: function () {
    // 若仍在游戏中（从后台回来），恢复循环
    if (this.data.phase === 'playing' && !this._running) {
      this._startLoop();
    } else if (this.data.phase !== 'playing') {
      this._setOri('portrait');
    }
  },

  // 设置运行时屏幕方向（带 try/catch 兜底，部分基础库/阶段可能不支持）
  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o }); } catch (e) {}
  },

  // 屏幕旋转后，用真实尺寸重建画布像素比例
  onResize: function (res) {
    if (!res || !res.size) return;
    this._resizeCanvas(res.size.windowWidth, res.size.windowHeight);
  },

  // ---------- 画布初始化 ----------
  _initCanvas: function (cb) {
    var self = this;
    wx.createSelectorQuery().select('#game').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) { if (cb) cb(); return; }
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      self._canvas = canvas;
      self._ctx = ctx;
      var w = res[0].width || 360;
      var h = res[0].height || 640;
      self._resizeCanvas(w, h);
      if (cb) cb();
    });
  },

  // 按 CSS 尺寸(w,h) 重设画布像素与缩放，保持绘制坐标系为 CSS 像素
  _resizeCanvas: function (w, h) {
    if (!this._canvas || !this._ctx) return;
    var info = (wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : { pixelRatio: 2 }));
    var dpr = info.pixelRatio || 2;
    this._canvas.width = w * dpr;
    this._canvas.height = h * dpr;
    this._ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._ctx.scale(dpr, dpr);
    this._W = w;
    this._H = h;
  },

  // ---------- 设置交互 ----------
  selMode: function (e) { this.setData({ mode: e.currentTarget.dataset.v }); },
  selDiff: function (e) { this.setData({ difficulty: e.currentTarget.dataset.v }); },
  selColor: function (e) { this.setData({ colorCount: parseInt(e.currentTarget.dataset.v, 10) }); },
  tglStroop: function () { this.setData({ stroop: !this.data.stroop }); },
  tglSwap: function () { this.setData({ colorSwap: !this.data.colorSwap }); },
  tglCoop: function () { this.setData({ coop: !this.data.coop }); },
  tglAdv: function () { this.setData({ advanced: !this.data.advanced }); },

  // 返回首页（自定义导航栏下无系统返回键）
  onHome: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () { wx.reLaunch({ url: '/pages/index/index' }); }
    });
  },

  // ---------- 开始 / 重开 / 返回 ----------
  onStart: function () {
    this._buildCfg();

    this._running = true;
    this._scoreA = 0; this._scoreB = 0;
    this._comboA = 0; this._comboB = 0;
    this._maxComboA = 0; this._maxComboB = 0;
    this._livesA = 3; this._livesB = 3;
    this._ballCount = 0;
    this._since = 0;
    this._balls = [];
    this._timeLeft = this._cfg.mode === 'timed' ? 60 : 0;
    this._elapsed = 0;
    this._lastHud = 0;
    this._flash = { A: null, B: null };

    this.setData({
      phase: 'playing',
      banner: '',
      scoreA: 0, scoreB: 0, comboA: 0, comboB: 0,
      livesA: 3, livesB: 3, ballCount: 0,
      colorAHex: PALETTE[this._cfg.targetA].hex,
      colorBHex: PALETTE[this._cfg.targetB].hex,
      timeText: this._timeText()
    });

    this._setOri('landscape');
    var self = this;
    if (this._startTimer) clearTimeout(this._startTimer);
    // 等横屏方向稳定后，用横屏真实尺寸重建画布再启动循环
    this._startTimer = setTimeout(function () {
      self._initCanvas(function () { self._startLoop(); });
    }, 320);
  },

  onRestart: function () { this.onStart(); },

  onBack: function () {
    this._stopLoop();
    this._setOri('portrait');
    this.setData({ phase: 'setup', banner: '' });
  },

  onQuit: function () {
    this._stopLoop();
    if (this._startTimer) clearTimeout(this._startTimer);
    this._setOri('portrait');
    this.setData({ phase: 'setup', banner: '' });
  },

  _buildCfg: function () {
    var d = this.data;
    var diff = d.difficulty;
    var colorCount = d.colorCount;
    this._cfg = {
      mode: d.mode,
      colorCount: colorCount,
      difficulty: diff,
      stroop: d.stroop,
      colorSwap: d.colorSwap,
      coop: d.coop,
      advanced: d.advanced,
      targetA: 0,
      targetB: colorCount > 1 ? 1 : 0,
      fakeOn: diff !== 'kid',
      bounceOn: diff !== 'kid',
      changeOn: diff !== 'kid',
      burstOn: diff !== 'kid',
      fakeProb: diff === 'hard' ? 0.2 : 0.14,
      changeProb: 0.32,
      speedScale: diff === 'hard' ? 0.85 : 1.0,
      intervalCap: diff === 'kid' ? 1000 : 0
    };
    if (d.coop) {
      this._cfg.targetB = this._cfg.targetA; // 合作：双方同色
    }
  },

  // ---------- 游戏循环 ----------
  _startLoop: function () {
    var self = this;
    if (!this._canvas) return;
    this._running = true;
    this._last = Date.now();
    var step = function () {
      if (!self._running) return;
      var now = Date.now();
      var dt = (now - self._last) / 1000;
      if (dt > 0.1) dt = 0.1; // 切后台回来/卡顿保护
      self._last = now;
      self._update(dt, now);
      self._draw(now);
      self._raf = self._canvas.requestAnimationFrame(step);
    };
    this._raf = this._canvas.requestAnimationFrame(step);
  },

  _stopLoop: function () {
    this._running = false;
    if (this._raf && this._canvas && this._canvas.cancelAnimationFrame) {
      this._canvas.cancelAnimationFrame(this._raf);
    }
    this._raf = null;
  },

  _update: function (dt, now) {
    // 计时
    if (this._cfg.mode === 'timed') {
      this._timeLeft -= dt;
      if (this._timeLeft <= 0) {
        this._timeLeft = 0;
        this._checkEnd();
      }
    } else {
      this._elapsed += dt;
    }

    // 生成
    this._since += dt * 1000;
    var iv = this._currentInterval();
    if (this._since >= iv) {
      this._since -= iv;
      this._spawn(now);
      if (this._cfg.burstOn && this._ballCount >= 31 && Math.random() < 0.6) {
        var extra = 1 + (Math.random() < 0.4 ? 1 : 0);
        for (var k = 0; k < extra; k++) this._spawn(now);
      }
    }

    // 更新球
    var W = this._W, H = this._H;
    var keep = [];
    for (var i = 0; i < this._balls.length; i++) {
      var b = this._balls[i];
      if (b.popped) {
        if (now - b.popAt <= 260) keep.push(b);
        continue;
      }
      if (!b.alive) {
        if (now - (b.missAt || now) <= 200) keep.push(b);
        continue;
      }
      // 变色
      if (b.changing && b.changeTimes.length) {
        while (b.changeTimes.length && now >= b.changeTimes[0]) {
          b.changeTimes.shift();
          b.colorKey = this._randColor();
          if (b.stroopText) b.stroopText = PALETTE[this._randColor()].name;
        }
      }
      // 移动
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // 反弹球寿命（防止无限堆积）
      if (b.bounce && now - b.bornAt > 5200) {
        b.alive = false; b.missAt = now; keep.push(b); continue;
      }
      if (b.bounce) {
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
        if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
        if (b.side === 'L') {
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
          if (b.x > W / 2 - b.r) { b.x = W / 2 - b.r; b.vx = -Math.abs(b.vx); }
        } else if (b.side === 'R') {
          if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
          if (b.x < W / 2 + b.r) { b.x = W / 2 + b.r; b.vx = Math.abs(b.vx); }
        } else {
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
          if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        }
      } else {
        if (b.x < -b.r || b.x > W + b.r || b.y < -b.r || b.y > H + b.r) {
          b.alive = false; b.missAt = now;
        }
      }
      keep.push(b);
    }
    this._balls = keep;
    // 安全上限
    while (this._balls.length > 30) this._balls.shift();

    if (now - this._lastHud > 120) {
      this._syncHud();
      this._lastHud = now;
    }
  },

  // 分阶段生成间隔（毫秒）
  _currentInterval: function () {
    var n = this._ballCount;
    var base;
    if (n <= 10) base = 2000;
    else if (n <= 20) base = 1500;
    else if (n <= 30) base = 1000;
    else if (n <= 40) base = 700;
    else base = 500;
    var iv = base * this._cfg.speedScale;
    if (this._cfg.intervalCap && iv < this._cfg.intervalCap) iv = this._cfg.intervalCap;
    return iv;
  },

  // 球速：约在间隔的 0.7 倍时间内飞越半屏
  _ballSpeed: function () {
    var iv = this._currentInterval();
    var halfW = this._W / 2;
    return halfW / ((iv * 0.7) / 1000);
  },

  _randColor: function () {
    return Math.floor(Math.random() * this._cfg.colorCount);
  },

  _stroopText: function (colorKey) {
    if (this._cfg.colorCount <= 1) return PALETTE[0].name;
    var others = [];
    for (var i = 0; i < this._cfg.colorCount; i++) if (i !== colorKey) others.push(i);
    return PALETTE[others[Math.floor(Math.random() * others.length)]].name;
  },

  _spawn: function (now) {
    now = now || Date.now();
    this._ballCount++;

    // 颜色互换：每 10 球
    if (this._cfg.colorSwap && this._ballCount % 10 === 0) {
      var t = this._cfg.targetA;
      this._cfg.targetA = this._cfg.targetB;
      this._cfg.targetB = t;
      this.setData({
        colorAHex: PALETTE[this._cfg.targetA].hex,
        colorBHex: PALETTE[this._cfg.targetB].hex
      });
      this._showBanner('🔄 颜色互换！');
    }

    var type = '2';
    if (this._cfg.advanced && this._ballCount > 3) {
      var r = Math.random();
      if (r < 0.18) type = '4';
      else if (r < 0.5) type = '3';
    }
    var subs = type === '2' ? [['L'], ['R']]
      : type === '3' ? [['L'], ['C'], ['R']]
        : [['L'], ['L'], ['R'], ['R']];
    for (var i = 0; i < subs.length; i++) this._makeBall(subs[i][0], now);
  },

  _makeBall: function (side, now) {
    var W = this._W, H = this._H;
    var r = Math.max(20, Math.min(W, H) * 0.052);
    var dir = side === 'L' ? -1 : (side === 'R' ? 1 : (Math.random() < 0.5 ? -1 : 1));
    var ang = (Math.random() * 0.7 - 0.35);
    var speed = this._ballSpeed() * (0.85 + Math.random() * 0.3);
    var vx = dir * speed * Math.cos(ang);
    var vy = speed * Math.sin(ang);

    var fake = this._cfg.fakeOn && this._ballCount >= 11 && Math.random() < this._cfg.fakeProb;
    var colorKey = fake ? -1 : this._randColor();
    var changing = this._cfg.changeOn && this._ballCount >= 21 && !fake && Math.random() < this._cfg.changeProb;
    var bounce = this._cfg.bounceOn && this._ballCount >= 21;

    var ball = {
      id: this._sid++, side: side, x: W / 2, y: H / 2,
      vx: vx, vy: vy, r: r,
      colorKey: colorKey, fake: fake, changing: changing, changeTimes: [],
      bounce: bounce, alive: true, popped: false, bornAt: now,
      stroopText: (this._cfg.stroop && !fake) ? this._stroopText(colorKey) : null
    };
    if (changing) {
      var n = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (var c = 0; c < n; c++) ball.changeTimes.push(now + 450 + c * 550 + Math.random() * 250);
    }
    this._balls.push(ball);
  },

  // ---------- 点击处理 ----------
  onTap: function (e) {
    if (this.data.phase !== 'playing') return;
    var touches = (e.touches && e.touches.length) ? e.touches : (e.changedTouches || []);
    for (var i = 0; i < touches.length; i++) {
      this._processTap(touches[i].x, touches[i].y);
    }
  },

  _processTap: function (x, y) {
    var W = this._W;
    var side = x < W / 2 ? 'L' : 'R';
    var player = side === 'L' ? 'A' : 'B';
    var ball = null;
    for (var i = this._balls.length - 1; i >= 0; i--) {
      var b = this._balls[i];
      if (!b.alive || b.popped) continue;
      if (b.side !== side && b.side !== 'C') continue;
      var dx = x - b.x, dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) { ball = b; break; }
    }
    if (!ball) return;
    this._handleHit(player, ball);
  },

  _handleHit: function (player, ball) {
    if (ball.fake) {
      this._addScore(player, -1);
      this._comboReset(player);
      this._flash[player] = { kind: 'bad', at: Date.now() };
      this._popBall(ball, 'bad');
      if (this._cfg.mode === 'survival') this._loseLife(player);
      this._syncHud();
      try { wx.vibrateShort({ type: 'medium' }); } catch (err) {}
      this._checkEnd();
      return;
    }
    var myKey = player === 'A' ? this._cfg.targetA : this._cfg.targetB;
    var oppKey = player === 'A' ? this._cfg.targetB : this._cfg.targetA;
    if (ball.colorKey === myKey) {
      this._comboInc(player);
      var mult = this._comboMult(player);
      this._addScore(player, mult);
      this._flash[player] = { kind: 'good', at: Date.now() };
      this._popBall(ball, 'good');
    } else if (ball.colorKey === oppKey) {
      var opp = player === 'A' ? 'B' : 'A';
      this._addScore(opp, 1);
      this._comboReset(player);
      this._flash[player] = { kind: 'opp', at: Date.now() };
      this._popBall(ball, 'opp');
      if (this._cfg.mode === 'survival') this._loseLife(player);
      if (this._cfg.mode === 'endless') {
        this._syncHud();
        this._endGame(opp, '玩家' + player + ' 点错颜色');
        return;
      }
    } else {
      // 第三色：点了无分，断连击
      this._comboReset(player);
      this._popBall(ball, 'neutral');
    }
    this._syncHud();
    this._checkEnd();
  },

  _popBall: function (ball, kind) {
    ball.alive = false;
    ball.popped = true;
    ball.popAt = Date.now();
    ball.popKind = kind;
  },

  // ---------- 计分 / 连击 / 命数 ----------
  _addScore: function (player, delta) {
    if (player === 'A') {
      this._scoreA += delta;
      if (this._scoreA < 0) this._scoreA = 0;
    } else {
      this._scoreB += delta;
      if (this._scoreB < 0) this._scoreB = 0;
    }
  },

  _comboInc: function (player) {
    if (player === 'A') {
      this._comboA++;
      if (this._comboA > this._maxComboA) this._maxComboA = this._comboA;
    } else {
      this._comboB++;
      if (this._comboB > this._maxComboB) this._maxComboB = this._comboB;
    }
  },

  _comboReset: function (player) {
    if (player === 'A') this._comboA = 0; else this._comboB = 0;
  },

  _comboMult: function (player) {
    var c = player === 'A' ? this._comboA : this._comboB;
    return c >= 10 ? 5 : c >= 5 ? 3 : c >= 3 ? 2 : 1;
  },

  _loseLife: function (player) {
    if (player === 'A') { this._livesA--; if (this._livesA < 0) this._livesA = 0; }
    else { this._livesB--; if (this._livesB < 0) this._livesB = 0; }
  },

  // ---------- 胜负 ----------
  _checkEnd: function () {
    if (this.data.phase !== 'playing') return;
    if (this._cfg.mode === 'timed') {
      if (this._timeLeft <= 0) this._finishTimed();
    } else if (this._cfg.mode === 'survival') {
      if (this._livesA <= 0) this._endGame('B', '玩家A 命数耗尽');
      else if (this._livesB <= 0) this._endGame('A', '玩家B 命数耗尽');
    }
  },

  _finishTimed: function () {
    var ta = this._scoreA, tb = this._scoreB;
    var w = ta > tb ? 'A' : tb > ta ? 'B'
      : (this._maxComboA > this._maxComboB ? 'A'
        : (this._maxComboB > this._maxComboA ? 'B' : 'draw'));
    this._endGame(w, '时间到');
  },

  _endGame: function (winner, reason) {
    this._stopLoop();
    var ta = this._scoreA, tb = this._scoreB;
    var title;
    if (winner === 'A') title = '🅰️ 玩家A 获胜！';
    else if (winner === 'B') title = '🅱️ 玩家B 获胜！';
    else title = '🤝 平局！';
    var detail = 'A  ' + ta + '  :  ' + tb + '  B\n最高连击  A×' + this._maxComboA + ' / B×' + this._maxComboB
      + (reason ? ('\n' + reason) : '');
    this._setOri('portrait');
    this.setData({ phase: 'result', resultTitle: title, resultDetail: detail });
  },

  // ---------- HUD / 横幅 ----------
  _syncHud: function () {
    this.setData({
      scoreA: this._scoreA, scoreB: this._scoreB,
      comboA: this._comboA, comboB: this._comboB,
      livesA: this._livesA, livesB: this._livesB,
      ballCount: this._ballCount,
      timeText: this._timeText()
    });
  },

  _timeText: function () {
    if (this._cfg && this._cfg.mode === 'timed') {
      return Math.max(0, Math.ceil(this._timeLeft)).toString();
    }
    var s = Math.floor(this._elapsed || 0);
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  },

  _showBanner: function (t) {
    var self = this;
    this.setData({ banner: t });
    if (this._bannerTimer) clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(function () { self.setData({ banner: '' }); }, 1000);
  },

  // ---------- 绘制 ----------
  _draw: function (now) {
    var ctx = this._ctx, W = this._W, H = this._H;
    if (!ctx) return;
    now = now || Date.now();

    ctx.fillStyle = '#0e1020';
    ctx.fillRect(0, 0, W, H);

    // 中线
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    // 球
    for (var i = 0; i < this._balls.length; i++) {
      var b = this._balls[i];
      if (b.popped) {
        var p = (now - b.popAt) / 260;
        if (p >= 1) continue;
        var rg = b.r * (1 + p * 1.6);
        var col = b.popKind === 'good' ? '76,217,122'
          : b.popKind === 'bad' ? '255,91,91'
            : b.popKind === 'opp' ? '255,160,60' : '200,200,200';
        ctx.strokeStyle = 'rgba(' + col + ',' + (1 - p) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, rg, 0, 2 * Math.PI);
        ctx.stroke();
        continue;
      }
      if (!b.alive) {
        var pf = (now - (b.missAt || now)) / 200;
        if (pf >= 1) continue;
        ctx.globalAlpha = 1 - pf;
      }
      var hex = b.fake ? '#8a8f9c' : PALETTE[b.colorKey].hex;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
      ctx.fillStyle = hex;
      ctx.fill();
      // 高光
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      if (b.fake) {
        ctx.fillStyle = '#ff5b5b';
        ctx.font = (b.r * 0.9) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', b.x, b.y);
      }
      if (b.stroopText) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + (b.r * 0.85) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.stroopText, b.x, b.y);
      }
      ctx.globalAlpha = 1;
    }

    // 半屏闪光反馈
    this._drawFlash('A', now);
    this._drawFlash('B', now);
  },

  _drawFlash: function (player, now) {
    var f = this._flash[player];
    if (!f) return;
    var age = now - f.at;
    if (age > 300) { this._flash[player] = null; return; }
    var a = (1 - age / 300) * 0.35;
    var col = f.kind === 'good' ? '76,217,122' : f.kind === 'bad' ? '255,91,91' : '255,170,60';
    var ctx = this._ctx, W = this._W, H = this._H;
    ctx.fillStyle = 'rgba(' + col + ',' + a + ')';
    if (player === 'A') ctx.fillRect(0, 0, W / 2, H);
    else ctx.fillRect(W / 2, 0, W / 2, H);
  }
});
