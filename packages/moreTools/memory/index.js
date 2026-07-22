var storage = require('../../../utils/storage.js');

var GRID_SIZE = 9;

Page({
  data: {
    isFavorite: false,
    state: 'idle',
    cells: [],
    sequence: [],
    userSequence: [],
    level: 0,
    score: 0,
    bestScore: 0,
    activeCell: -1,
    message: ''
  },
  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('memory_best') || 0;
    this.setData({ bestScore: best });
  },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('memory') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('memory') }); },

  onStartGame: function () {
    var cells = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      cells.push({ id: i, active: false, userActive: false });
    }
    this.setData({
      state: 'showing', cells: cells, sequence: [], userSequence: [],
      level: 0, score: 0, message: ''
    });
    this.nextRound();
  },

  nextRound: function () {
    var seq = this.data.sequence.concat([Math.floor(Math.random() * GRID_SIZE)]);
    this.setData({ sequence: seq, userSequence: [], level: seq.length });
    this.showSequence(seq, 0);
  },

  showSequence: function (seq, idx) {
    var self = this;
    if (idx >= seq.length) {
      self.setData({ state: 'input', activeCell: -1, message: '轮到你了！' });
      return;
    }
    self.setData({ activeCell: seq[idx] });
    setTimeout(function () {
      self.setData({ activeCell: -1 });
      setTimeout(function () {
        self.showSequence(seq, idx + 1);
      }, 200);
    }, 600);
  },

  onCellTap: function (e) {
    if (this.data.state !== 'input') return;
    var idx = Number(e.currentTarget.dataset.idx);
    var userSeq = this.data.userSequence.concat([idx]);
    var seq = this.data.sequence;
    var pos = userSeq.length - 1;

    if (userSeq[pos] !== seq[pos]) {
      // 错误
      var score = this.data.score;
      var best = this.data.bestScore;
      if (score > best) {
        best = score;
        wx.setStorageSync('memory_best', best);
      }
      this.setData({
        state: 'gameover', score: score, bestScore: best, activeCell: -1,
        message: '挑战结束！得分: ' + score
      });
      storage.addHistory({
        toolId: 'memory', toolName: '记忆力训练', category: 'fun',
        summary: '得分: ' + score + ', 最高: ' + best, timestamp: Date.now()
      });
      return;
    }

    // 闪一下
    this.setData({ activeCell: idx });
    var self = this;
    setTimeout(function () { self.setData({ activeCell: -1 }); }, 200);

    if (userSeq.length === seq.length) {
      // 本轮成功
      var newScore = this.data.score + 1;
      this.setData({ score: newScore, userSequence: userSeq, state: 'showing', message: '正确！' });
      var self2 = this;
      setTimeout(function () { self2.nextRound(); }, 800);
    } else {
      this.setData({ userSequence: userSeq });
    }
  },

  onShareAppMessage: function () {
    return { title: '记忆力训练 - 我得了' + this.data.score + '分', path: '/packages/moreTools/memory/index' };
  }
});
