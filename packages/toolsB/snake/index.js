var storage = require('../../../utils/storage.js');

var GRID_SIZE = 20;  // 格子大小(px)
var COLS = 17;       // 列数
var ROWS = 22;       // 行数

// 方向常量
var DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

Page({
  data: {
    isFavorite: false,
    canvasWidth: COLS * GRID_SIZE,
    canvasHeight: ROWS * GRID_SIZE,
    score: 0,
    bestScore: 0,
    level: 1,
    gameState: 'idle', // idle, playing, over
    isPaused: false,
    isNewBest: false
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.snake) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.checkFavorite();
    var best = wx.getStorageSync('toolbox_snake_best') || 0;
    this.setData({ bestScore: best });
  },

  onReady: function () {
    this._initCanvas();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    this._stopGame();
  },

  onHide: function () {
    if (this.data.gameState === 'playing' && !this.data.isPaused) {
      this.togglePause();
    }
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('snake') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('snake');
    this.setData({ isFavorite: fav });
  },

  // ---------- Canvas 初始化 ----------
  _initCanvas: function () {
    var self = this;
    var query = this.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res[0]) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = self.data.canvasWidth * dpr;
        canvas.height = self.data.canvasHeight * dpr;
        ctx.scale(dpr, dpr);
        self._canvas = canvas;
        self._ctx = ctx;
        self._drawEmpty();
      });
  },

  _drawEmpty: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var w = this.data.canvasWidth;
    var h = this.data.canvasHeight;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, w, h);
    // 画网格
    ctx.strokeStyle = '#1a2745';
    ctx.lineWidth = 0.5;
    for (var x = 0; x <= w; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (var y = 0; y <= h; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  },

  // ---------- 互动逻辑 ----------
  startGame: function () {
    // 初始化蛇
    var startX = Math.floor(COLS / 2);
    var startY = Math.floor(ROWS / 2);
    this._snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    this._direction = DIR.RIGHT;
    this._nextDirection = DIR.RIGHT;
    this._score = 0;
    this._level = 1;
    this._food = null;
    this._generateFood();

    this.setData({
      score: 0,
      level: 1,
      gameState: 'playing',
      isPaused: false,
      isNewBest: false
    });

    this._startTimer();
  },

  _startTimer: function () {
    this._stopGame();
    var self = this;
    var speed = this._getSpeed();
    this._gameTimer = setInterval(function () {
      if (!self.data.isPaused && self.data.gameState === 'playing') {
        self._tick();
      }
    }, speed);
  },

  _stopGame: function () {
    if (this._gameTimer) {
      clearInterval(this._gameTimer);
      this._gameTimer = null;
    }
  },

  _getSpeed: function () {
    // level 1: 250ms, 每升一级减少 15ms, 最快 80ms
    return Math.max(80, 250 - (this._level - 1) * 15);
  },

  _generateFood: function () {
    var occupied = {};
    for (var i = 0; i < this._snake.length; i++) {
      var s = this._snake[i];
      occupied[s.x + ',' + s.y] = true;
    }
    var free = [];
    for (var x = 0; x < COLS; x++) {
      for (var y = 0; y < ROWS; y++) {
        if (!occupied[x + ',' + y]) {
          free.push({ x: x, y: y });
        }
      }
    }
    if (free.length === 0) {
      // 蛇填满整个棋盘，互动胜利
      this._gameOver(true);
      return;
    }
    this._food = free[Math.floor(Math.random() * free.length)];
  },

  _tick: function () {
    var dir = this._nextDirection;
    this._direction = dir;
    var head = this._snake[0];
    var newHead = {
      x: head.x + dir.x,
      y: head.y + dir.y
    };

    // 撞墙检测
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      this._gameOver(false);
      return;
    }

    // 撞自身检测
    for (var i = 0; i < this._snake.length; i++) {
      if (this._snake[i].x === newHead.x && this._snake[i].y === newHead.y) {
        this._gameOver(false);
        return;
      }
    }

    this._snake.unshift(newHead);

    // 吃食物
    if (this._food && newHead.x === this._food.x && newHead.y === this._food.y) {
      this._score += 10;
      var newLevel = Math.floor(this._score / 50) + 1;
      if (newLevel > 10) newLevel = 10;

      this.setData({ score: this._score, level: newLevel });

      if (newLevel !== this._level) {
        this._level = newLevel;
        this._startTimer(); // 重新设定速度
      }

      this._generateFood();
    } else {
      this._snake.pop();
    }

    this._draw();
  },

  _gameOver: function (isWin) {
    this._stopGame();
    var isNewBest = false;
    if (this._score > this.data.bestScore) {
      isNewBest = true;
      wx.setStorageSync('toolbox_snake_best', this._score);
      this.setData({ bestScore: this._score });
    }
    this.setData({
      gameState: 'over',
      isNewBest: isNewBest
    });
    this._draw();

    // 震动反馈
    try {
      wx.vibrateShort({ type: 'heavy' });
    } catch (e) { }
  },

  togglePause: function () {
    if (this.data.gameState !== 'playing') return;
    this.setData({ isPaused: !this.data.isPaused });
  },

  changeSpeed: function () {
    // 切换速度等级：1-5循环
    var levels = [
      { name: '慢速', speed: 350 },
      { name: '普通', speed: 250 },
      { name: '快速', speed: 150 },
      { name: '极速', speed: 100 },
      { name: '地狱', speed: 60 }
    ];
    if (!this._speedIdx) this._speedIdx = 1;
    this._speedIdx = (this._speedIdx + 1) % levels.length;
    this._customSpeed = levels[this._speedIdx].speed;

    if (this.data.gameState === 'playing') {
      this._stopGame();
      var self = this;
      var speed = this._customSpeed || this._getSpeed();
      this._gameTimer = setInterval(function () {
        if (!self.data.isPaused && self.data.gameState === 'playing') {
          self._tick();
        }
      }, speed);
    }

    wx.showToast({ title: levels[this._speedIdx].name, icon: 'none', duration: 800 });
  },

  // ---------- 绘制 ----------
  _draw: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var w = this.data.canvasWidth;
    var h = this.data.canvasHeight;

    // 背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = '#1a2745';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= w; gx += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (var gy = 0; gy <= h; gy += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // 食物
    if (this._food) {
      var fx = this._food.x * GRID_SIZE + GRID_SIZE / 2;
      var fy = this._food.y * GRID_SIZE + GRID_SIZE / 2;
      ctx.fillStyle = '#e94560';
      ctx.shadowColor = '#e94560';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fx, fy, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 食物上的小圆点装饰
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.arc(fx - 3, fy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 蛇身
    for (var si = this._snake.length - 1; si >= 0; si--) {
      var seg = this._snake[si];
      var sx = seg.x * GRID_SIZE;
      var sy = seg.y * GRID_SIZE;
      var radius = 4;

      if (si === 0) {
        // 蛇头
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 8;
      } else {
        // 蛇身 - 渐变色
        var ratio = 1 - (si / this._snake.length) * 0.5;
        var g = Math.round(200 * ratio);
        ctx.fillStyle = 'rgb(30, ' + g + ', 80)';
        ctx.shadowBlur = 0;
      }

      // 圆角矩形
      this._roundRect(ctx, sx + 1, sy + 1, GRID_SIZE - 2, GRID_SIZE - 2, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 蛇头眼睛
      if (si === 0) {
        ctx.fillStyle = '#fff';
        var ex1, ey1, ex2, ey2;
        var dir = this._direction;
        var cx = sx + GRID_SIZE / 2;
        var cy = sy + GRID_SIZE / 2;
        if (dir === DIR.RIGHT) {
          ex1 = cx + 3; ey1 = cy - 4;
          ex2 = cx + 3; ey2 = cy + 4;
        } else if (dir === DIR.LEFT) {
          ex1 = cx - 3; ey1 = cy - 4;
          ex2 = cx - 3; ey2 = cy + 4;
        } else if (dir === DIR.UP) {
          ex1 = cx - 4; ey1 = cy - 3;
          ex2 = cx + 4; ey2 = cy - 3;
        } else {
          ex1 = cx - 4; ey1 = cy + 3;
          ex2 = cx + 4; ey2 = cy + 3;
        }
        ctx.beginPath();
        ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 瞳孔
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(ex1, ey1, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 暂停遮罩
    if (this.data.isPaused && this.data.gameState === 'playing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已暂停', w / 2, h / 2);
      ctx.textAlign = 'start';
    }

    // 互动结束遮罩
    if (this.data.gameState === 'over') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('互动结束', w / 2, h / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '22px sans-serif';
      ctx.fillText('得分: ' + this._score, w / 2, h / 2 + 15);
      ctx.textAlign = 'start';
    }
  },

  _roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // ---------- 触摸滑动控制 ----------
  onTouchStart: function (e) {
    if (this.data.gameState !== 'playing') return;
    var touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
  },

  onTouchMove: function (e) {
    // 阻止默认滚动
  },

  onTouchEnd: function (e) {
    if (this.data.gameState !== 'playing' || this.data.isPaused) return;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - this._touchStartX;
    var dy = touch.clientY - this._touchStartY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return; // 太短不算

    if (absDx > absDy) {
      // 水平滑动
      if (dx > 0 && this._direction !== DIR.LEFT) {
        this._nextDirection = DIR.RIGHT;
      } else if (dx < 0 && this._direction !== DIR.RIGHT) {
        this._nextDirection = DIR.LEFT;
      }
    } else {
      // 垂直滑动
      if (dy > 0 && this._direction !== DIR.UP) {
        this._nextDirection = DIR.DOWN;
      } else if (dy < 0 && this._direction !== DIR.DOWN) {
        this._nextDirection = DIR.UP;
      }
    }
  },

  // ---------- 虚拟按键控制 ----------
  onBtnUp: function () {
    if (this._direction !== DIR.DOWN) this._nextDirection = DIR.UP;
  },

  onBtnDown: function () {
    if (this._direction !== DIR.UP) this._nextDirection = DIR.DOWN;
  },

  onBtnLeft: function () {
    if (this._direction !== DIR.RIGHT) this._nextDirection = DIR.LEFT;
  },

  onBtnRight: function () {
    if (this._direction !== DIR.LEFT) this._nextDirection = DIR.RIGHT;
  },

  onShareAppMessage: function () {
    return {
      title: '贪吃蛇 - 经经典小互动',
      path: '/packages/toolsB/snake/index'
    };
  }
});
