var storage = require('../../../utils/storage.js');

var N = 20;                 // 格子数 (N x N)
var START_LIVES = 3;        // 每人初始命数
var INVINCIBLE_MS = 2000;   // 出生/开局无敌时长
var RESPAWN_MS = 1500;      // 死亡后复活等待
var SWIPE_MIN = 18;         // 触发转向的最小滑动像素

var PROP_SPAWN_MS = 6000;   // 道具生成间隔
var PROP_MAX = 3;           // 场上最多道具数
var STAR_MS = 5000;         // 无敌星: 穿墙穿身
var SLOW_MS = 5000;         // 减速光环: 对方半速
var REVERSE_MS = 5000;      // 反向操控: 对方左右反转
var MAGNET_MS = 10000;      // 食物磁铁: 吸附近食
var MAGNET_RANGE = 3;       // 磁铁吸附范围(曼哈顿距离)

// 道具外观
var PROP_META = {
  star:    { color: '#ffd54f', sym: '★', name: '无敌星' },
  slow:    { color: '#22d3ee', sym: '❄', name: '减速' },
  reverse: { color: '#c084fc', sym: '↔', name: '反向' },
  magnet:  { color: '#34d399', sym: '磁', name: '磁铁' },
  shrink:  { color: '#fb923c', sym: '缩', name: '缩小' }
};
var PROP_TYPES = ['star', 'slow', 'reverse', 'magnet', 'shrink'];

var DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function opposite(a, b) {
  return a && b && a.x === -b.x && a.y === -b.y;
}

Page({
  data: {
    isFavorite: false,
    canvasW: 300,
    canvasH: 500,
    statusBar: 20,
    gameState: 'idle', // idle | playing | over
    isPaused: false,
    aScore: 0,
    bScore: 0,
    aLivesArr: [],
    bLivesArr: [],
    aBuffs: [],
    bBuffs: [],
    resultTitle: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.snakebattle === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.checkFavorite();
    // 设置/规则页用竖屏, 点开始后再切横屏
    this._setOri('portrait');
    this._computeSize();
  },

  onReady: function () {
    this._computeSize();
    this._initCanvas();
    // 监听旋转/尺寸变化, 实时重算画布
    var self = this;
    this._onResize = function () { self._computeSize(); };
    wx.onWindowResize(this._onResize);
  },

  onShow: function () {
    this.checkFavorite();
    // 回到页面时按状态恢复方向
    this._setOri(this.data.gameState === 'playing' ? 'landscape' : 'portrait');
  },

  _setOri: function (o) {
    try { wx.setPageOrientation({ orientation: o, fail: function () {} }); } catch (e) {}
  },

  onHide: function () {
    if (this.data.gameState === 'playing' && !this.data.isPaused) {
      this.togglePause();
    }
  },

  onUnload: function () {
    if (this._onResize) { wx.offWindowResize(this._onResize); this._onResize = null; }
    this._stopLoop();
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
    this.setData({ isFavorite: storage.isFavorite('snakebattle') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('snakebattle');
    this.setData({ isFavorite: fav });
  },

  // ---------- 尺寸 (全屏) ----------
  _computeSize: function () {
    var sys = wx.getSystemInfoSync();
    var W = sys.windowWidth;
    var H = sys.windowHeight;
    var cell = Math.floor(Math.min(W, H) / N);
    this._cell = cell;
    this._offX = Math.floor((W - cell * N) / 2);
    this._offY = Math.floor((H - cell * N) / 2);
    this.setData({
      canvasW: W,
      canvasH: H,
      statusBar: sys.statusBarHeight || 20
    });
    // 画布已初始化: 同步缩放并重绘, 适配横屏/旋转
    if (this._canvas && this._ctx) {
      var dpr = sys.pixelRatio || 2;
      this._canvas.width = W * dpr;
      this._canvas.height = H * dpr;
      this._ctx.scale(dpr, dpr);
      if (this.data.gameState === 'playing') this._render();
      else this._drawIdle();
    }
  },

  // ---------- Canvas ----------
  _initCanvas: function () {
    var self = this;
    var query = this.createSelectorQuery();
    query.select('#battleCanvas')
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
        self._drawIdle();
      });
  },

  _drawIdle: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var W = this.data.canvasW, H = this.data.canvasH;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    this._drawGrid();
  },

  _drawGrid: function () {
    var ctx = this._ctx;
    var c = this._cell, ox = this._offX, oy = this._offY;
    var total = c * N;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= N; i++) {
      var gx = ox + i * c, gy = oy + i * c;
      ctx.beginPath(); ctx.moveTo(gx, oy); ctx.lineTo(gx, oy + total); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + total, gy); ctx.stroke();
    }
  },

  // ---------- 游戏开始 ----------
  startGame: function () {
    var self = this;
    if (this._starting) return;
    this._starting = true;
    // 先切横屏, 等旋转/尺寸生效后再正式开局
    var sys = wx.getSystemInfoSync();
    var needRotate = sys.windowHeight > sys.windowWidth; // 当前仍是竖屏
    this._setOri('landscape');
    if (needRotate) wx.showToast({ title: '请横屏握持手机', icon: 'none', duration: 900 });
    setTimeout(function () {
      self._starting = false;
      self._computeSize();
      self._beginMatch();
    }, needRotate ? 900 : 120);
  },

  _beginMatch: function () {
    var now = Date.now();
    // 玩家A: 左上, 向右; 玩家B: 右下, 向左
    var A = this._makeSnake('topleft', DIRS.right, [
      { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }
    ], now);
    var B = this._makeSnake('bottomright', DIRS.left, [
      { x: N - 4, y: N - 3 }, { x: N - 3, y: N - 3 }, { x: N - 2, y: N - 3 }
    ], now);
    this._state = {
      A: A, B: B,
      corpses: [],       // { x, y, owner }
      food: null,
      props: [],         // { x, y, type }
      lastProp: now,
      tick: 0
    };
    this._spawnFood();
    this._touches = {};  // identifier -> {side, x, y}

    this.setData({
      gameState: 'playing',
      isPaused: false,
      aScore: 0,
      bScore: 0,
      resultTitle: '',
      aLivesArr: this._livesArr(START_LIVES),
      bLivesArr: this._livesArr(START_LIVES),
      aBuffs: [],
      bBuffs: []
    });

    this._stopLoop();
    this._loop();
  },

  _makeSnake: function (home, dir, body, now) {
    return {
      home: home,
      body: body,
      dir: dir,
      pendingDir: dir,
      grow: 0,
      alive: true,
      lives: START_LIVES,
      score: 0,
      invincibleUntil: now + INVINCIBLE_MS,
      respawnAt: 0,
      starUntil: 0,
      slowUntil: 0,
      reverseUntil: 0,
      magnetUntil: 0
    };
  },

  _livesArr: function (n) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    return arr;
  },

  // ---------- 循环 ----------
  _loop: function () {
    var self = this;
    if (this.data.gameState !== 'playing') return;
    if (!this.data.isPaused) {
      this._step();
    }
    if (this.data.gameState !== 'playing') return;
    var interval = this._speed();
    this._timer = setTimeout(function () { self._loop(); }, interval);
  },

  _stopLoop: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  },

  _speed: function () {
    var st = this._state;
    var maxLen = Math.max(st.A.body.length, st.B.body.length);
    if (maxLen <= 10) return 300;
    if (maxLen <= 20) return 200;
    if (maxLen <= 30) return 150;
    return 110;
  },

  togglePause: function () {
    var p = !this.data.isPaused;
    this.setData({ isPaused: p });
    if (!p) this._loop();
  },

  // ---------- 单步推进 ----------
  _step: function () {
    var st = this._state;
    var now = Date.now();
    st.tick++;

    // 复活处理
    ['A', 'B'].forEach(function (k) {
      var p = st[k];
      if (!p.alive && p.lives > 0 && p.respawnAt !== 0 && now >= p.respawnAt) {
        this._respawn(p);
      }
    }, this);

    var A = st.A, B = st.B;

    // 道具定时生成
    if (now - st.lastProp > PROP_SPAWN_MS && st.props.length < PROP_MAX) {
      this._spawnProp();
      st.lastProp = now;
    }

    // 减速光环: 被减速方隔 tick 才移动(半速)
    var aSlow = A.alive && now < A.slowUntil;
    var bSlow = B.alive && now < B.slowUntil;
    var aMove = A.alive && (!aSlow || st.tick % 2 === 0);
    var bMove = B.alive && (!bSlow || st.tick % 2 === 0);

    var newA = aMove ? this._nextHead(A) : null;
    var newB = bMove ? this._nextHead(B) : null;

    var aStar = A.alive && now < A.starUntil;
    var bStar = B.alive && now < B.starUntil;
    var aInv = A.alive && now < A.invincibleUntil;
    var bInv = B.alive && now < B.invincibleUntil;

    var deadA = false, deadB = false;
    var blockA = false, blockB = false;

    // 撞墙判定 (无敌星穿墙/出生无敌挡墙)
    if (A.alive && aMove) {
      if (this._isWall(newA)) {
        if (aStar) newA = this._wrap(newA);
        else if (aInv) blockA = true;
        else deadA = true;
      }
    }
    if (B.alive && bMove) {
      if (this._isWall(newB)) {
        if (bStar) newB = this._wrap(newB);
        else if (bInv) blockB = true;
        else deadB = true;
      }
    }

    // 身体碰撞判定 (无敌星 / 出生无敌豁免)
    if (A.alive && aMove && !deadA && !blockA && !aStar && !aInv) {
      if (this._hitBody(newA, A, true) || this._hitBody(newA, B, false)) deadA = true;
    }
    if (B.alive && bMove && !deadB && !blockB && !bStar && !bInv) {
      if (this._hitBody(newB, B, true) || this._hitBody(newB, A, false)) deadB = true;
    }
    // 头对头
    if (A.alive && B.alive && aMove && bMove && newA && newB && newA.x === newB.x && newA.y === newB.y) {
      if (!aStar && !aInv) deadA = true;
      if (!bStar && !bInv) deadB = true;
    }

    // 应用死亡
    if (deadA) this._kill(A);
    if (deadB) this._kill(B);

    // 应用移动
    if (A.alive && aMove && !deadA && !blockA) this._advance(A, newA);
    if (B.alive && bMove && !deadB && !blockB) this._advance(B, newB);

    // 食物磁铁吸附
    if (A.alive && now < A.magnetUntil) this._magnetPull(A);
    if (B.alive && now < B.magnetUntil) this._magnetPull(B);

    // 分数/命数/buff 显示
    this.setData({
      aScore: A.score,
      bScore: B.score,
      aLivesArr: this._livesArr(A.lives),
      bLivesArr: this._livesArr(B.lives),
      aBuffs: this._buffList(A, now),
      bBuffs: this._buffList(B, now)
    });

    // 胜负判定
    if (A.lives <= 0 || B.lives <= 0) {
      this._gameOver();
      return;
    }

    this._render();
  },

  _nextHead: function (p) {
    if (p.pendingDir && !opposite(p.pendingDir, p.dir)) {
      p.dir = p.pendingDir;
    }
    var head = p.body[0];
    return { x: head.x + p.dir.x, y: head.y + p.dir.y };
  },

  _wrap: function (pos) {
    return { x: (pos.x + N) % N, y: (pos.y + N) % N };
  },

  _isWall: function (pos) {
    return pos.x < 0 || pos.y < 0 || pos.x >= N || pos.y >= N;
  },

  _hitBody: function (pos, snake, isSelf) {
    if (!snake.alive || !pos) return false;
    var body = snake.body;
    var end = body.length;
    if (isSelf && snake.grow <= 0) end = body.length - 1;
    for (var i = 0; i < end; i++) {
      if (body[i].x === pos.x && body[i].y === pos.y) return true;
    }
    return false;
  },

  _advance: function (p, newHead) {
    var st = this._state;
    var ateGrow = 0;

    // 道具优先判定
    var pi = this._propIndex(newHead);
    if (pi >= 0) {
      var prop = st.props[pi];
      st.props.splice(pi, 1);
      this._applyProp(p, prop.type);
      // 道具不阻止继续吃食物/尸体 (同格不会重叠, 这里直接走食物逻辑)
    }

    // 食物
    if (st.food && st.food.x === newHead.x && st.food.y === newHead.y) {
      ateGrow = 1;
      p.score += 10;
      this._spawnFood();
    } else {
      // 尸体
      var ci = this._corpseIndex(newHead);
      if (ci >= 0) {
        var corpse = st.corpses[ci];
        if (corpse.owner === p) { ateGrow = 1; p.score += 5; }
        else { ateGrow = 3; p.score += 30; }
        st.corpses.splice(ci, 1);
      }
    }

    p.body.unshift(newHead);
    if (ateGrow > 0) p.grow += ateGrow;
    if (p.grow > 0) p.grow--;
    else p.body.pop();
  },

  _applyProp: function (p, type) {
    var now = Date.now();
    var opp = (p === this._state.A) ? this._state.B : this._state.A;
    if (type === 'star') {
      p.starUntil = now + STAR_MS;
    } else if (type === 'slow') {
      opp.slowUntil = now + SLOW_MS;
    } else if (type === 'reverse') {
      opp.reverseUntil = now + REVERSE_MS;
    } else if (type === 'magnet') {
      p.magnetUntil = now + MAGNET_MS;
    } else if (type === 'shrink') {
      var keep = Math.max(3, Math.floor(p.body.length / 2));
      p.body = p.body.slice(0, keep);
      p.grow = 0;
    }
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  _corpseIndex: function (pos) {
    var arr = this._state.corpses;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].x === pos.x && arr[i].y === pos.y) return i;
    }
    return -1;
  },

  _propIndex: function (pos) {
    var arr = this._state.props;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].x === pos.x && arr[i].y === pos.y) return i;
    }
    return -1;
  },

  _buffList: function (p, now) {
    var arr = [];
    if (now < p.starUntil) arr.push({ icon: PROP_META.star.sym, color: PROP_META.star.color });
    if (now < p.slowUntil) arr.push({ icon: PROP_META.slow.sym, color: PROP_META.slow.color });
    if (now < p.reverseUntil) arr.push({ icon: PROP_META.reverse.sym, color: PROP_META.reverse.color });
    if (now < p.magnetUntil) arr.push({ icon: PROP_META.magnet.sym, color: PROP_META.magnet.color });
    return arr;
  },

  _magnetPull: function (p) {
    var st = this._state;
    if (!st.food) return;
    var head = p.body[0];
    var dx = st.food.x - head.x;
    var dy = st.food.y - head.y;
    var dist = Math.abs(dx) + Math.abs(dy);
    if (dist > 0 && dist <= MAGNET_RANGE) {
      if (Math.abs(dx) >= Math.abs(dy)) st.food.x -= Math.sign(dx);
      else st.food.y -= Math.sign(dy);
    }
  },

  _kill: function (p) {
    var st = this._state;
    for (var i = 0; i < p.body.length; i++) {
      if (st.food && st.food.x === p.body[i].x && st.food.y === p.body[i].y) continue;
      if (this._corpseIndex(p.body[i]) < 0) {
        st.corpses.push({ x: p.body[i].x, y: p.body[i].y, owner: p });
      }
    }
    p.alive = false;
    p.lives--;
    p.grow = 0;
    p.body = [];
    if (p.lives > 0) p.respawnAt = Date.now() + RESPAWN_MS;
    else p.respawnAt = 0;
    wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
  },

  _respawn: function (p) {
    var now = Date.now();
    var body, dir;
    if (p.home === 'topleft') {
      body = [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
      dir = DIRS.right;
    } else {
      body = [{ x: N - 4, y: N - 3 }, { x: N - 3, y: N - 3 }, { x: N - 2, y: N - 3 }];
      dir = DIRS.left;
    }
    p.body = body;
    p.dir = dir;
    p.pendingDir = dir;
    p.grow = 0;
    p.alive = true;
    p.invincibleUntil = now + INVINCIBLE_MS;
    p.respawnAt = 0;
    // 复活清除持续状态
    p.starUntil = 0;
    p.slowUntil = 0;
    p.reverseUntil = 0;
    p.magnetUntil = 0;
  },

  _spawnFood: function () {
    var st = this._state;
    var tries = 0;
    while (tries < 200) {
      tries++;
      var x = Math.floor(Math.random() * N);
      var y = Math.floor(Math.random() * N);
      if (this._occupied(x, y)) continue;
      st.food = { x: x, y: y };
      return;
    }
    st.food = null;
  },

  _spawnProp: function () {
    var st = this._state;
    var tries = 0;
    while (tries < 200) {
      tries++;
      var x = Math.floor(Math.random() * N);
      var y = Math.floor(Math.random() * N);
      if (this._occupiedProp(x, y)) continue;
      var type = PROP_TYPES[Math.floor(Math.random() * PROP_TYPES.length)];
      st.props.push({ x: x, y: y, type: type });
      return;
    }
  },

  _occupied: function (x, y) {
    var st = this._state;
    var chk = function (p) {
      if (!p.alive) return false;
      for (var i = 0; i < p.body.length; i++) {
        if (p.body[i].x === x && p.body[i].y === y) return true;
      }
      return false;
    };
    if (chk(st.A) || chk(st.B)) return true;
    for (var i = 0; i < st.corpses.length; i++) {
      if (st.corpses[i].x === x && st.corpses[i].y === y) return true;
    }
    if (st.food && st.food.x === x && st.food.y === y) return true;
    for (var j = 0; j < st.props.length; j++) {
      if (st.props[j].x === x && st.props[j].y === y) return true;
    }
    return false;
  },

  _occupiedProp: function (x, y) {
    return this._occupied(x, y);
  },

  // ---------- 触摸控制: 左半A 右半B ----------
  onTouchStart: function (e) {
    if (this.data.gameState !== 'playing' || this.data.isPaused) return;
    var half = this.data.canvasW / 2;
    var touches = e.touches || e.changedTouches || [];
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];
      var x = t.x;
      if (x == null) continue;
      var side = x < half ? 'A' : 'B';
      this._touches[t.identifier] = { side: side, x: t.x, y: t.y };
    }
  },

  onTouchEnd: function (e) {
    if (this.data.gameState !== 'playing' || this.data.isPaused) return;
    var touches = e.changedTouches || [];
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];
      var start = this._touches[t.identifier];
      if (!start) continue;
      var dx = (t.x != null ? t.x : start.x) - start.x;
      var dy = (t.y != null ? t.y : start.y) - start.y;
      delete this._touches[t.identifier];
      this._applySwipe(start.side, dx, dy);
    }
  },

  _applySwipe: function (side, dx, dy) {
    var absX = Math.abs(dx), absY = Math.abs(dy);
    if (absX < SWIPE_MIN && absY < SWIPE_MIN) return;
    var dir;
    if (absX > absY) dir = dx > 0 ? DIRS.right : DIRS.left;
    else dir = dy > 0 ? DIRS.down : DIRS.up;

    var p = side === 'A' ? this._state.A : this._state.B;
    if (!p || !p.alive) return;
    // 反向操控: 左右互换
    if (p.reverseUntil && Date.now() < p.reverseUntil) {
      if (dir === DIRS.left) dir = DIRS.right;
      else if (dir === DIRS.right) dir = DIRS.left;
    }
    if (opposite(dir, p.dir)) return; // 禁止直接掉头
    p.pendingDir = dir;
  },

  // ---------- 结束 ----------
  _gameOver: function () {
    this._stopLoop();
    var st = this._state;
    var A = st.A, B = st.B;
    var title;
    if (A.lives <= 0 && B.lives <= 0) {
      if (A.score > B.score) title = '🔵 蓝方胜利!';
      else if (B.score > A.score) title = '🔴 红方胜利!';
      else title = '🤝 平局!';
    } else if (A.lives <= 0) {
      title = '🔴 红方胜利!';
    } else {
      title = '🔵 蓝方胜利!';
    }
    this._render();
    this.setData({ gameState: 'over', resultTitle: title });
  },

  // ---------- 渲染 ----------
  _render: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var st = this._state;
    var W = this.data.canvasW, H = this.data.canvasH;
    var c = this._cell, ox = this._offX, oy = this._offY;
    var now = Date.now();

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    this._drawGrid();

    // 尸体
    for (var i = 0; i < st.corpses.length; i++) {
      var cp = st.corpses[i];
      this._roundCell(ctx, cp.x, cp.y, c, '#5b6479', 0.85);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = Math.floor(c * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('z', ox + cp.x * c + c / 2, oy + cp.y * c + c / 2);
    }

    // 道具
    for (var k = 0; k < st.props.length; k++) {
      var pr = st.props[k];
      var meta = PROP_META[pr.type];
      // 呼吸光晕
      var pulse = 0.5 + 0.5 * Math.sin(now / 250 + k);
      ctx.save();
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 6 + pulse * 8;
      this._roundCell(ctx, pr.x, pr.y, c, meta.color, 0.95);
      ctx.restore();
      ctx.fillStyle = '#0a0e1a';
      ctx.font = 'bold ' + Math.floor(c * 0.52) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.sym, ox + pr.x * c + c / 2, oy + pr.y * c + c / 2 + 1);
    }

    // 食物 (糖果)
    if (st.food) {
      var fx = ox + st.food.x * c + c / 2;
      var fy = oy + st.food.y * c + c / 2;
      ctx.beginPath();
      ctx.fillStyle = '#ffd54f';
      ctx.arc(fx, fy, c * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#ff8a65';
      ctx.arc(fx, fy, c * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // 蛇
    this._drawSnake(ctx, st.A, '#3b82f6', '#93c5fd', c, ox, oy, now);
    this._drawSnake(ctx, st.B, '#ef4444', '#fca5a5', c, ox, oy, now);
  },

  _drawSnake: function (ctx, p, bodyColor, headColor, c, ox, oy, now) {
    if (!p.alive || !p.body.length) return;
    var inv = now < p.invincibleUntil;
    var star = now < p.starUntil;
    if (inv && Math.floor(now / 150) % 2 === 0) ctx.globalAlpha = 0.45;

    for (var i = p.body.length - 1; i >= 0; i--) {
      var seg = p.body[i];
      var color = i === 0 ? headColor : bodyColor;
      this._roundCell(ctx, seg.x, seg.y, c, color, 1);
    }
    ctx.globalAlpha = 1;

    // 无敌星光环
    if (star) {
      var h = p.body[0];
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = Math.max(2, c * 0.12);
      ctx.beginPath();
      ctx.arc(ox + h.x * c + c / 2, oy + h.y * c + c / 2, c * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 眼睛
    var head = p.body[0];
    ctx.fillStyle = '#0a0e1a';
    var ex = ox + head.x * c, ey = oy + head.y * c;
    var r = c * 0.1;
    var off = c * 0.28;
    var e1x, e1y, e2x, e2y;
    if (p.dir === DIRS.left || p.dir === DIRS.right) {
      e1x = ex + c / 2 + (p.dir.x * off * 0.6); e1y = ey + off;
      e2x = e1x; e2y = ey + c - off;
    } else {
      e1x = ex + off; e1y = ey + c / 2 + (p.dir.y * off * 0.6);
      e2x = ex + c - off; e2y = e1y;
    }
    ctx.beginPath(); ctx.arc(e1x, e1y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x, e2y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  },

  _roundCell: function (ctx, gx, gy, c, color, alpha) {
    var pad = Math.max(1, c * 0.06);
    var x = this._offX + gx * c + pad;
    var y = this._offY + gy * c + pad;
    var w = c - pad * 2;
    var rr = Math.max(2, c * 0.22);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + w, rr);
    ctx.arcTo(x + w, y + w, x, y + w, rr);
    ctx.arcTo(x, y + w, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
});
