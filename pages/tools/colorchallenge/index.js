var storage = require('../../../utils/storage.js');
var colorUtil = require('../../../utils/colorchallenge.js');

Page({
  data: {
    isFavorite: false,
    round: 1,
    gridSize: 2,
    baseColor: '',
    diffColor: '',
    diffIndex: 0,
    cells: [],
    score: 0,
    bestScore: 0,
    isPlaying: true,
    showResult: false,
    rating: null,
    wrongIndex: -1
  },

  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('toolbox_color_best') || 0;
    this.setData({ bestScore: best });
    this.nextRound();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('colorchallenge') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('colorchallenge');
    this.setData({ isFavorite: fav });
  },

  nextRound: function () {
    var data = colorUtil.generateRound(this.data.round);
    var cells = [];
    for (var i = 0; i < data.gridSize * data.gridSize; i++) {
      cells.push({
        color: i === data.diffIndex ? data.diffColor : data.baseColor,
        isDiff: i === data.diffIndex
      });
    }
    this.setData({
      gridSize: data.gridSize,
      baseColor: data.baseColor,
      diffColor: data.diffColor,
      diffIndex: data.diffIndex,
      cells: cells,
      wrongIndex: -1
    });
  },

  onCellTap: function (e) {
    if (!this.data.isPlaying) return;
    var idx = e.currentTarget.dataset.idx;
    if (this.data.cells[idx].isDiff) {
      // 答对了
      var newScore = this.data.round;
      this.setData({
        round: this.data.round + 1,
        score: newScore,
        wrongIndex: -1
      });
      if (newScore > this.data.bestScore) {
        this.setData({ bestScore: newScore });
        wx.setStorageSync('toolbox_color_best', newScore);
      }
      this.nextRound();
    } else {
      // 答错了
      this.setData({ wrongIndex: idx });
      var self = this;
      setTimeout(function () {
        self.gameOver();
      }, 500);
    }
  },

  gameOver: function () {
    var rating = colorUtil.getRating(this.data.score);
    this.setData({
      isPlaying: false,
      showResult: true,
      rating: rating
    });

    storage.addHistory({
      toolId: 'colorchallenge',
      toolName: '色感测试',
      category: 'fun',
      summary: '通过' + this.data.score + '轮 - ' + rating.level,
      timestamp: Date.now()
    });
  },

  restart: function () {
    this.setData({
      round: 1,
      score: 0,
      isPlaying: true,
      showResult: false,
      rating: null,
      wrongIndex: -1
    });
    this.nextRound();
  },

  onCloseResult: function () {
    this.setData({ showResult: false });
  },

  onShareAppMessage: function () {
    return {
      title: '色感测试 - 你能过几轮？',
      path: '/pages/tools/colorchallenge/index'
    };
  }
});