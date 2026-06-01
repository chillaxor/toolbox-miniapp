var storage = require('../../../utils/storage.js');
var klotskiUtil = require('../../../utils/klotski.js');

Page({
  data: {
    isFavorite: false,
    size: 3,
    tiles: [],
    moves: 0,
    timerText: '0s',
    bestRecord: null,
    showComplete: false,
    movableTiles: []   // 可移动格子的索引集合，用于高亮
  },

  _timerInterval: null,
  _timerSeconds: 0,

  onLoad: function () {
    this.checkFavorite();
    this.loadBestRecord(3);
    this.startGame();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    if (this._timerInterval) clearInterval(this._timerInterval);
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('klotski') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('klotski');
    this.setData({ isFavorite: fav });
  },

  loadBestRecord: function (size) {
    var best = wx.getStorageSync('toolbox_klotski_best_' + size + 'x' + size);
    this.setData({ bestRecord: best || null });
  },

  onSizeChange: function (e) {
    var size = Number(e.currentTarget.dataset.size);
    this.setData({ size: size });
    this.loadBestRecord(size);
    this.startGame();
  },

  startGame: function () {
    if (this._timerInterval) clearInterval(this._timerInterval);
    var size = this.data.size;
    var steps = klotskiUtil.getShuffleSteps(size);
    var tiles = klotskiUtil.shufflePuzzle(size, steps);
    this._timerSeconds = 0;
    this.setData({
      tiles: tiles,
      moves: 0,
      timerText: '0s',
      showComplete: false,
      movableTiles: this.getMovableTiles(tiles, size)
    });
    this.startTimer();
  },

  startTimer: function () {
    var self = this;
    this._timerSeconds = 0;
    this._timerInterval = setInterval(function () {
      self._timerSeconds++;
      var s = self._timerSeconds;
      var text = s < 60 ? s + 's' : Math.floor(s / 60) + 'm' + (s % 60) + 's';
      self.setData({ timerText: text });
    }, 1000);
  },

  stopTimer: function () {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  // 获取当前可移动的格子索引（与空格相邻的格子）
  getMovableTiles: function (tiles, size) {
    var emptyIndex = tiles.indexOf(0);
    return klotskiUtil.getNeighbors(emptyIndex, size);
  },

  onTileTap: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var size = this.data.size;
    var tiles = this.data.tiles;

    var newTiles = klotskiUtil.tryMove(tiles, idx, size);
    if (!newTiles) return;  // 点了不可移动的格子

    var moves = this.data.moves + 1;
    var movableTiles = this.getMovableTiles(newTiles, size);
    this.setData({ tiles: newTiles, moves: moves, movableTiles: movableTiles });

    if (klotskiUtil.isSolved(newTiles)) {
      this.stopTimer();
      var time = this._timerSeconds;
      var key = 'toolbox_klotski_best_' + size + 'x' + size;
      var best = wx.getStorageSync(key);
      if (!best || moves < best.moves || (moves === best.moves && time < best.time)) {
        var record = { moves: moves, time: time };
        wx.setStorageSync(key, record);
        this.setData({ bestRecord: record });
      }
      this.setData({ showComplete: true });
      storage.addHistory({
        toolId: 'klotski',
        toolName: '拼图益智',
        category: 'fun',
        summary: size + '×' + size + ' ' + moves + '步完成',
        timestamp: Date.now()
      });
    }
  },

  onCloseComplete: function () {
    this.setData({ showComplete: false });
  },

  onShareAppMessage: function () {
    return {
      title: '拼图益智 - 数字滑块',
      path: '/pages/tools/klotski/index'
    };
  }
});