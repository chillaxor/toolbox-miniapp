var storage = require('../../../utils/storage.js');

var TOOL_ID = 'stacking';

// 颜色方案 - 从底部到顶部渐变
var COLORS = [
  '#FF6B6B', '#FF8E53', '#FFA726', '#FFCC02', '#8BC34A',
  '#4CAF50', '#26C6DA', '#42A5F5', '#5C6BC0', '#AB47BC',
  '#EC407A', '#FF7043', '#FFCA28', '#66BB6A', '#29B6F6'
];

var PERFECT_THRESHOLD = 5; // 像素容差，视为完美对齐

Page({
  data: {
    state: 'ready', // ready | playing | finished
    difficulty: 'normal',
    difficulties: [
      { value: 'easy', label: '简单' },
      { value: 'normal', label: '普通' },
      { value: 'hard', label: '困难' }
    ],
    score: 0,
    layers: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    bestScore: 0,
    isNewRecord: false,
    showPerfect: false,
    perfectText: '',
    isFavorite: false
  },

  // 游戏内部状态
  _canvas: null,
  _ctx: null,
  _canvasW: 0,
  _canvasH: 0,
  _dpr: 1,
  _animTimer: null,
  _stack: [], // 已放置的方块 [{x, y, w, h, color}]
  _current: null, // 当前移动的方块 {x, y, w, h, color, dir}
  _speed: 3,
  _blockH: 0,
  _baseW: 0,

  onLoad: function () {
    var bestScore = storage.getSync('stacking_best_' + this.data.difficulty, 0);
    this.setData({
      bestScore: bestScore,
      isFavorite: storage.isFavorite(TOOL_ID)
    });
  },

  onUnload: function () {
    this._stopAnim();
  },

  onHide: function () {
    if (this.data.state === 'playing') {
      this._stopAnim();
    }
  },

  onShow: function () {
    if (this.data.state === 'playing' && !this._animTimer) {
      this._startLoop();
    }
  },

  toggleFavorite: function () {
    var result = storage.toggleFavorite(TOOL_ID);
    this.setData({ isFavorite: result });
  },

  onDifficultyChange: function (e) {
    var val = e.currentTarget.dataset.val;
    this.setData({ difficulty: val });
    var bestScore = storage.getSync('stacking_best_' + val, 0);
    this.setData({ bestScore: bestScore });
  },

  startGame: function () {
    var sysInfo = wx.getSystemInfoSync();
    var dpr = sysInfo.pixelRatio || 2;

    this.setData({
      state: 'playing',
      score: 0,
      layers: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      isNewRecord: false,
      showPerfect: false,
      perfectText: ''
    });

    var that = this;
    // 等待 canvas 渲染
    setTimeout(function () {
      that._initCanvas(dpr);
      that._initGame();
      that._startLoop();
    }, 100);
  },

  _initCanvas: function (dpr) {
    var query = wx.createSelectorQuery();
    query.select('.game-canvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
      });

    // 使用旧版 canvas API 兼容
    var ctx = wx.createCanvasContext('gameCanvas', this);

    // 获取canvas尺寸
    var sysInfo = wx.getSystemInfoSync();
    var canvasW = sysInfo.windowWidth - 24 * 2; // 减去padding rpx转px约24px
    var canvasH = 400; // 800rpx ≈ 400px

    this._ctx = ctx;
    this._canvasW = canvasW;
    this._canvasH = canvasH;
    this._dpr = dpr;
  },

  _initGame: function () {
    // 难度参数
    var speedMap = { easy: 2, normal: 3.5, hard: 5 };
    this._speed = speedMap[this.data.difficulty] || 3.5;

    this._blockH = 28;
    this._baseW = this._canvasW * 0.5;

    // 地基方块
    this._stack = [{
      x: (this._canvasW - this._baseW) / 2,
      y: this._canvasH - this._blockH,
      w: this._baseW,
      h: this._blockH,
      color: COLORS[0]
    }];

    this._spawnBlock();
  },

  _spawnBlock: function () {
    var top = this._stack[this._stack.length - 1];
    var w = top.w;
    var y = top.y - this._blockH;

    // 从左侧或右侧出发
    var dir = Math.random() > 0.5 ? 1 : -1;
    var x = dir === 1 ? -w : this._canvasW;

    this._current = {
      x: x,
      y: y,
      w: w,
      h: this._blockH,
      color: COLORS[this._stack.length % COLORS.length],
      dir: dir
    };
  },

  _startLoop: function () {
    this._stopAnim();
    var that = this;
    var fps = 60;
    var lastTime = Date.now();

    function loop() {
      var now = Date.now();
      var dt = (now - lastTime) / (1000 / 60); // 归一化到60fps
      lastTime = now;

      that._update(dt);
      that._render();

      that._animTimer = setTimeout(loop, 1000 / fps);
    }

    this._animTimer = setTimeout(loop, 1000 / fps);
  },

  _stopAnim: function () {
    if (this._animTimer) {
      clearTimeout(this._animTimer);
      this._animTimer = null;
    }
  },

  _update: function (dt) {
    if (!this._current) return;

    var cur = this._current;
    cur.x += this._speed * cur.dir * dt;

    // 边界反弹
    if (cur.x + cur.w > this._canvasW) {
      cur.x = this._canvasW - cur.w;
      cur.dir = -1;
    }
    if (cur.x < 0) {
      cur.x = 0;
      cur.dir = 1;
    }
  },

  onTap: function () {
    if (this.data.state !== 'playing' || !this._current) return;

    var cur = this._current;
    var top = this._stack[this._stack.length - 1];

    // 计算重叠区域
    var overlapLeft = Math.max(cur.x, top.x);
    var overlapRight = Math.min(cur.x + cur.w, top.x + top.w);
    var overlapW = overlapRight - overlapLeft;

    if (overlapW <= 0) {
      // 完全没对齐，游戏结束
      this._gameOver();
      return;
    }

    // 判断是否完美对齐
    var diff = Math.abs(cur.x - top.x);
    var isPerfect = diff <= PERFECT_THRESHOLD;

    if (isPerfect) {
      // 完美对齐，恢复宽度（最多恢复到初始宽度的80%）
      overlapW = top.w;
      overlapLeft = top.x;

      var combo = this.data.combo + 1;
      var maxCombo = Math.max(combo, this.data.maxCombo);
      var perfects = this.data.perfects + 1;
      var points = 10 + combo * 5;

      // 每10连击恢复一些宽度
      var restoreW = 0;
      if (combo % 10 === 0 && combo > 0) {
        restoreW = Math.min(this._baseW * 0.1, this._baseW * 0.8 - overlapW);
        if (restoreW > 0) {
          overlapW += restoreW;
          overlapLeft -= restoreW / 2;
        }
      }

      this.setData({
        combo: combo,
        maxCombo: maxCombo,
        perfects: perfects,
        score: this.data.score + points,
        showPerfect: true,
        perfectText: combo >= 10 ? '🔥 ' + combo + '连击完美！' + ' +' + points :
                     combo >= 5 ? '✨ ' + combo + '连击！' + ' +' + points :
                     '🎯 完美！' + ' +' + points
      });
    } else {
      var points2 = 5 + Math.floor(this.data.combo / 2);
      this.setData({
        combo: 0,
        score: this.data.score + points2,
        showPerfect: true,
        perfectText: overlapW >= top.w * 0.8 ? '👍 不错 +' + points2 : '+' + points2
      });
    }

    // 隐藏完美提示
    var that = this;
    setTimeout(function () {
      that.setData({ showPerfect: false });
    }, 800);

    // 裁剪掉多余部分
    var placedBlock = {
      x: overlapLeft,
      y: cur.y,
      w: overlapW,
      h: this._blockH,
      color: cur.color
    };

    this._stack.push(placedBlock);
    this.setData({ layers: this._stack.length - 1 });

    // 计算屏幕滚动偏移 - 方块堆高时整体下移
    if (this._stack.length > 8) {
      this._scrollOffset = (this._stack.length - 8) * this._blockH;
    }

    // 生成下一个方块
    this._spawnBlock();
  },

  _gameOver: function () {
    this._stopAnim();

    var score = this.data.score;
    var bestKey = 'stacking_best_' + this.data.difficulty;
    var bestScore = storage.getSync(bestKey, 0);
    var isNewRecord = score > bestScore;

    if (isNewRecord) {
      storage.setSync(bestKey, score);
      bestScore = score;
    }

    // 记录历史
    storage.addHistory({
      toolId: TOOL_ID,
      toolName: '叠叠乐',
      category: 'fun',
      summary: '叠了' + this.data.layers + '层，得分' + score
    });

    this.setData({
      state: 'finished',
      bestScore: bestScore,
      isNewRecord: isNewRecord
    });
  },

  _render: function () {
    var ctx = this._ctx;
    if (!ctx) return;

    var w = this._canvasW;
    var h = this._canvasH;

    // 清除画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景渐变
    var grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#1a1a2e');
    grd.addColorStop(1, '#16213e');
    ctx.setFillStyle(grd);
    ctx.fillRect(0, 0, w, h);

    // 计算偏移量 - 方块堆高时整体上移
    var offsetY = 0;
    if (this._stack.length > 10) {
      offsetY = (this._stack.length - 10) * this._blockH;
    }

    // 绘制已放置的方块
    for (var i = 0; i < this._stack.length; i++) {
      var block = this._stack[i];
      var drawY = block.y - offsetY;
      if (drawY > h || drawY + block.h < 0) continue;

      this._drawBlock(ctx, block.x, drawY, block.w, block.h, block.color, i);
    }

    // 绘制当前移动方块
    if (this._current) {
      var cur = this._current;
      var drawY2 = cur.y - offsetY;
      this._drawBlock(ctx, cur.x, drawY2, cur.w, cur.h, cur.color, this._stack.length);

      // 方块底部的下落指示线
      ctx.setStrokeStyle('rgba(255,255,255,0.15)');
      ctx.setLineWidth(1);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cur.x + cur.w / 2, drawY2 + cur.h);
      ctx.lineTo(cur.x + cur.w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 绘制地面
    var groundY = this._canvasH - offsetY;
    if (groundY <= h) {
      ctx.setFillStyle('rgba(255,255,255,0.05)');
      ctx.fillRect(0, Math.max(groundY, 0), w, 4);
    }

    ctx.draw();
  },

  _drawBlock: function (ctx, x, y, w, h, color, index) {
    // 主体
    ctx.setFillStyle(color);
    ctx.beginPath();
    // 圆角矩形
    var r = 4;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();

    // 高光效果
    var highlightGrd = ctx.createLinearGradient(x, y, x, y + h);
    highlightGrd.addColorStop(0, 'rgba(255,255,255,0.25)');
    highlightGrd.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    highlightGrd.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.setFillStyle(highlightGrd);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2);

    // 层数标签（每5层显示）
    if (index > 0 && index % 5 === 0) {
      ctx.setFillStyle('rgba(255,255,255,0.6)');
      ctx.setFontSize(10);
      ctx.setTextAlign('right');
      ctx.fillText(index + 'F', x - 6, y + h / 2 + 3);
    }
  }
});
