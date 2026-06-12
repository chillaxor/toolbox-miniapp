var storage = require('../../../utils/storage.js');

var COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
];

Page({
  data: {
    isFavorite: false,
    state: 'ready',
    layers: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    bestScore: 0,
    isNewRecord: false,
    showPerfect: false,
    perfectText: '',
    difficulty: 1,
    difficulties: [
      { label: '简单', value: 1 },
      { label: '中等', value: 0.7 },
      { label: '困难', value: 0.5 }
    ]
  },

  _canvas: null,
  _ctx: null,
  _canvasW: 0,
  _canvasH: 0,
  _baseW: 120,
  _baseH: 28,
  _placedBlocks: [],
  _currentBlock: null,
  _direction: 1,
  _speed: 1.5,
  _timer: null,
  _baseOffsetY: 0,

  onLoad: function () {
    this._loadBest();
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    this._stopLoop();
  },

  onHide: function () {
    this._stopLoop();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('stacking') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('stacking');
    this.setData({ isFavorite: fav });
  },

  onDifficultyChange: function (e) {
    var val = e.currentTarget.dataset.val;
    this.setData({ difficulty: val });
  },

  _loadBest: function () {
    try {
      var best = wx.getStorageSync('stacking_best');
      if (best) this.setData({ bestScore: best });
    } catch (ex) {}
  },

  _saveBest: function (score) {
    try {
      var best = wx.getStorageSync('stacking_best') || 0;
      if (score > best) {
        wx.setStorageSync('stacking_best', score);
        this.setData({ bestScore: score, isNewRecord: true });
      } else {
        this.setData({ isNewRecord: false });
      }
    } catch (ex) {}
  },

  startGame: function () {
    this.setData({
      state: 'playing',
      layers: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      isNewRecord: false,
      showPerfect: false,
      perfectText: ''
    });

    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#gameCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res[0]) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      self._canvas = canvas;
      self._ctx = ctx;
      self._canvasW = width;
      self._canvasH = height;
      self._baseOffsetY = height - 40;
      self._baseW = 120;
      self._baseH = 28;

      self._placedBlocks = [];
      self._direction = 1;
      self._speed = 1.5 * (1 / self.data.difficulty);

      var bx = (width - self._baseW) / 2;
      self._placedBlocks.push({
        x: bx,
        y: self._baseOffsetY - self._baseH,
        w: self._baseW,
        h: self._baseH,
        color: COLORS[0]
      });

      self._spawnBlock();
      self._startLoop();
    });
  },

  _spawnBlock: function () {
    var last = this._placedBlocks[this._placedBlocks.length - 1];
    var y = last.y - this._baseH - 2;
    if (y < 20) {
      this._endGame();
      return;
    }
    this._currentBlock = {
      x: -last.w,
      y: y,
      w: last.w,
      h: this._baseH,
      color: COLORS[this._placedBlocks.length % COLORS.length]
    };
    this._direction = 1;
  },

  _startLoop: function () {
    this._stopLoop();
    var self = this;
    var canvas = this._canvas;
    if (!canvas) return;
    var loop = function () {
      self._update();
      self._draw();
      self._timer = canvas.requestAnimationFrame(loop);
    };
    this._timer = canvas.requestAnimationFrame(loop);
  },

  _stopLoop: function () {
    if (this._timer) {
      try {
        this._canvas.cancelAnimationFrame(this._timer);
      } catch (e) {}
    }
    this._timer = null;
  },

  _update: function () {
    if (!this._currentBlock) return;
    var b = this._currentBlock;
    b.x += this._speed * this._direction;
    if (b.x + b.w >= this._canvasW) {
      b.x = this._canvasW - b.w;
      this._direction = -1;
    } else if (b.x <= 0) {
      b.x = 0;
      this._direction = 1;
    }
  },

  _draw: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var w = this._canvasW;
    var h = this._canvasH;

    ctx.clearRect(0, 0, w, h);

    // 背景渐变
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 网格线
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var gy = 0; gy < h; gy += 30) {
      ctx.fillRect(0, gy, w, 1);
    }

    // 绘制已放置的方块
    for (var i = 0; i < this._placedBlocks.length; i++) {
      this._drawBlock(ctx, this._placedBlocks[i], i);
    }

    // 绘制当前移动的方块
    if (this._currentBlock) {
      this._drawBlock(ctx, this._currentBlock, this._placedBlocks.length);
    }

    // 绘制底部地面
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, this._baseOffsetY, w, 40);
  },

  _drawBlock: function (ctx, block, index) {
    // 方块主体
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.w, block.h);

    // 高光效果（顶部）
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(block.x + 2, block.y + 2, block.w - 4, 6);

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(block.x, block.y, block.w, block.h);

    // 层数编号（跳过底座）
    if (index > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index), block.x + block.w / 2, block.y + block.h / 2);
    }
  },

  onTap: function () {
    if (this.data.state !== 'playing' || !this._currentBlock) return;

    var cur = this._currentBlock;
    var last = this._placedBlocks[this._placedBlocks.length - 1];
    var overlapX = Math.max(0, Math.min(cur.x + cur.w, last.x + last.w) - Math.max(cur.x, last.x));

    if (overlapX <= 0) {
      this._endGame();
      return;
    }

    var diff = Math.abs(cur.x - last.x);
    var isPerfect = diff < 5;
    var isGood = diff < 15;

    var newX, newW;
    if (isPerfect) {
      newX = last.x;
      newW = cur.w;
    } else {
      newX = Math.max(cur.x, last.x);
      newW = overlapX;
    }

    var newBlock = {
      x: newX,
      y: cur.y,
      w: newW,
      h: cur.h,
      color: cur.color
    };
    this._placedBlocks.push(newBlock);

    var addScore = 10;
    var combo = this.data.combo;
    var perfects = this.data.perfects;

    if (isPerfect) {
      combo += 1;
      perfects += 1;
      addScore += combo * 10;
      this.setData({ showPerfect: true, perfectText: combo >= 5 ? '🔥 完美x' + combo + '！' : combo >= 3 ? '✨ 完美x' + combo + '！' : '✨ 完美！' });
      this._hidePerfect();
    } else if (isGood) {
      combo += 1;
      addScore += 5;
    } else {
      combo = 0;
    }

    var layers = this.data.layers + 1;
    var score = this.data.score + addScore;
    var maxCombo = Math.max(this.data.maxCombo, combo);

    this.setData({
      layers: layers,
      score: score,
      combo: combo,
      maxCombo: maxCombo,
      perfects: perfects
    });

    if (newW < 8) {
      this._endGame();
      return;
    }

    var scrollThreshold = this._canvasH * 0.4;
    if (newBlock.y < scrollThreshold) {
      var offset = scrollThreshold - newBlock.y;
      this._baseOffsetY += offset;
      for (var i = 0; i < this._placedBlocks.length; i++) {
        this._placedBlocks[i].y += offset;
      }
    }

    this._baseW = newW;
    this._speed = Math.min(3.5, 1.5 + layers * 0.08) * (1 / this.data.difficulty);
    this._spawnBlock();
  },

  _hidePerfect: function () {
    var self = this;
    setTimeout(function () {
      self.setData({ showPerfect: false });
    }, 1200);
  },

  _endGame: function () {
    this._stopLoop();
    this._currentBlock = null;
    this._saveBest(this.data.score);

    storage.addHistory({
      toolId: 'stacking',
      toolName: '叠叠乐',
      category: 'fun',
      summary: '叠了' + this.data.layers + '层，得分' + this.data.score,
      timestamp: Date.now()
    });

    this.setData({ state: 'finished' });
  },

  onShareAppMessage: function () {
    return {
      title: '我叠了' + this.data.layers + '层，得分' + this.data.score + '！',
      path: '/pages/tools/stacking/index'
    };
  }
});
