var storage = require('../../../utils/storage.js');

var DIFFICULTIES = {
  easy: { min: 1, max: 50, label: '简单(1-50)' },
  normal: { min: 1, max: 100, label: '普通(1-100)' },
  hard: { min: 1, max: 1000, label: '困难(1-1000)' }
};

Page({
  data: {
    isFavorite: false,
    difficulty: 'normal',
    min: 1,
    max: 100,
    target: 0,
    guess: '',
    attempts: 0,
    history: [],
    hint: '',
    gameOver: false,
    bestScores: {}
  },

  onLoad: function () {
    this.checkFavorite();
    this.loadBestScores();
    this.startGame();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('guessnumber') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('guessnumber');
    this.setData({ isFavorite: fav });
  },

  loadBestScores: function () {
    var scores = wx.getStorageSync('guessnumber_best') || {};
    this.setData({ bestScores: scores });
  },

  saveBestScore: function (key, score) {
    var scores = this.data.bestScores;
    if (!scores[key] || score < scores[key]) {
      scores[key] = score;
      this.setData({ bestScores: scores });
      wx.setStorageSync('guessnumber_best', scores);
    }
  },

  onDifficultyChange: function (e) {
    var diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff });
    this.startGame();
  },

  startGame: function () {
    var diff = DIFFICULTIES[this.data.difficulty];
    var target = Math.floor(Math.random() * (diff.max - diff.min + 1)) + diff.min;
    this.setData({
      min: diff.min,
      max: diff.max,
      target: target,
      guess: '',
      attempts: 0,
      history: [],
      hint: '请猜一个 ' + diff.min + ' ~ ' + diff.max + ' 的数字',
      gameOver: false
    });
  },

  onInput: function (e) {
    this.setData({ guess: e.detail.value });
  },

  onGuess: function () {
    var val = parseInt(this.data.guess);
    if (isNaN(val) || val < this.data.min || val > this.data.max) {
      wx.showToast({ title: '请输入有效数字', icon: 'none' });
      return;
    }

    var attempts = this.data.attempts + 1;
    var target = this.data.target;
    var hint = '';
    var gameOver = false;

    if (val < target) {
      hint = '📈 小了！再大一点';
    } else if (val > target) {
      hint = '📉 大了！再小一点';
    } else {
      hint = '🎉 恭喜你猜对了！答案就是 ' + target;
      gameOver = true;
      this.saveBestScore(this.data.difficulty, attempts);
      storage.addHistory({
        toolId: 'guessnumber',
        toolName: '猜数字',
        category: 'fun',
        summary: this.data.difficulty + '模式 ' + attempts + '次猜中',
        timestamp: Date.now()
      });
    }

    var history = this.data.history.slice();
    history.unshift({
      value: val,
      result: val < target ? '小了' : (val > target ? '大了' : '✅ 正确'),
      timestamp: Date.now()
    });

    this.setData({
      attempts: attempts,
      hint: hint,
      history: history,
      gameOver: gameOver,
      guess: ''
    });
  },

  onShareAppMessage: function () {
    return {
      title: '猜数字 - 我' + this.data.attempts + '次猜中，你来试试！',
      path: '/pages/tools/guessnumber/index'
    };
  }
});
