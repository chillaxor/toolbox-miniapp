var storage = require('../../../utils/storage.js');
var mazeUtil = require('../../../utils/maze.js');

Page({
  data: {
    isFavorite: false,
    level: 'small',
    levelLabel: '简单 8×8',
    rows: 8,
    cols: 8,
    grid: [],
    playerR: 0,
    playerC: 0,
    steps: 0,
    timer: 0,
    timerRunning: false,
    showComplete: false,
    bestRecord: null
  },

  _timerInterval: null,

  onLoad: function () {
    this.checkFavorite();
    this.loadBestRecord();
    this.generateNewMaze();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('maze') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('maze');
    this.setData({ isFavorite: fav });
  },

  loadBestRecord: function () {
    var best = wx.getStorageSync('toolbox_maze_best_' + this.data.level);
    this.setData({ bestRecord: best || null });
  },

  onLevelChange: function (e) {
    var level = e.currentTarget.dataset.level;
    var config = mazeUtil.getDifficultyConfig(level);
    this.setData({
      level: level,
      levelLabel: config.label,
      rows: config.rows,
      cols: config.cols
    });
    this.loadBestRecord();
    this.generateNewMaze();
  },

  generateNewMaze: function () {
    var config = mazeUtil.getDifficultyConfig(this.data.level);
    var grid = mazeUtil.generateMaze(config.rows, config.cols);
    this.setData({
      grid: grid,
      rows: config.rows,
      cols: config.cols,
      playerR: 0,
      playerC: 0,
      steps: 0,
      showComplete: false
    });
    this.startTimer();
    this.drawMaze();
  },

  startTimer: function () {
    var self = this;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this.setData({ timer: 0, timerRunning: true });
    this._timerInterval = setInterval(function () {
      if (self.data.timerRunning) {
        self.setData({ timer: self.data.timer + 1 });
      }
    }, 1000);
  },

  stopTimer: function () {
    this.setData({ timerRunning: false });
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  drawMaze: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#mazeCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res[0]) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      self._drawMazeContent(ctx, width, height);
    });
  },

  _drawMazeContent: function (ctx, width, height) {
    var grid = this.data.grid;
    var rows = this.data.rows;
    var cols = this.data.cols;
    var cellW = width / cols;
    var cellH = height / rows;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 画墙壁
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * cellW;
        var y = r * cellH;
        var cell = grid[r][c];

        if (cell.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellW, y);
          ctx.stroke();
        }
        if (cell.right) {
          ctx.beginPath();
          ctx.moveTo(x + cellW, y);
          ctx.lineTo(x + cellW, y + cellH);
          ctx.stroke();
        }
        if (cell.bottom) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellH);
          ctx.lineTo(x + cellW, y + cellH);
          ctx.stroke();
        }
        if (cell.left) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellH);
          ctx.stroke();
        }
      }
    }

    // 画终点
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect((cols - 1) * cellW + cellW * 0.2, (rows - 1) * cellH + cellH * 0.2, cellW * 0.6, cellH * 0.6);

    // 画玩家
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(this.data.playerC * cellW + cellW / 2, this.data.playerR * cellH + cellH / 2, Math.min(cellW, cellH) * 0.3, 0, 2 * Math.PI);
    ctx.fill();
  },

  onMove: function (e) {
    var dir = e.currentTarget.dataset.dir;
    var grid = this.data.grid;
    var r = this.data.playerR;
    var c = this.data.playerC;

    if (!mazeUtil.canMove(grid, r, c, dir)) return;

    var newR = r, newC = c;
    if (dir === 'up') newR = r - 1;
    if (dir === 'down') newR = r + 1;
    if (dir === 'left') newC = c - 1;
    if (dir === 'right') newC = c + 1;

    this.setData({
      playerR: newR,
      playerC: newC,
      steps: this.data.steps + 1
    });

    this.drawMaze();

    // 检查是否到达终点
    if (newR === this.data.rows - 1 && newC === this.data.cols - 1) {
      this.stopTimer();
      var time = this.data.timer;
      var steps = this.data.steps;
      var key = 'toolbox_maze_best_' + this.data.level;
      var best = wx.getStorageSync(key);
      if (!best || steps < best.steps) {
        var record = { steps: steps, time: time };
        wx.setStorageSync(key, record);
        this.setData({ bestRecord: record });
      }
      this.setData({ showComplete: true });

      storage.addHistory({
        toolId: 'maze',
        toolName: '专注力训练',
        category: 'fun',
        summary: this.data.levelLabel + ' ' + steps + '步完成',
        timestamp: Date.now()
      });
    }
  },

  formatTime: function (seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m > 0 ? m + ':' : '') + (s < 10 && m > 0 ? '0' : '') + s;
  },

  onCloseComplete: function () {
    this.setData({ showComplete: false });
  },

  onShareAppMessage: function () {
    return {
      title: '专注力训练 - 迷宫挑战',
      path: '/pages/tools/maze/index'
    };
  }
});