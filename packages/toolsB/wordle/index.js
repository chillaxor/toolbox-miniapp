const app = getApp();
const E = require('./engine.js');
const { ANSWERS } = require('./words.js');

const WORD_LEN = 4;
const ROWS = 6;

function emptyGrid() {
  const g = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = [];
    for (let c = 0; c < WORD_LEN; c++) cells.push({ k: c, char: '', cls: '' });
    g.push({ k: r, cells: cells });
  }
  return g;
}
function clsOf(s) {
  return s === 'green' ? 'g' : s === 'yellow' ? 'y' : s === 'gray' ? 'r' : '';
}

Page({
  data: {
    WORD_LEN: WORD_LEN,
    ROWS: ROWS,
    grid: emptyGrid(),
    draft: '',
    answer: '',
    status: 'playing',
    mode: 'daily',
    dayIndex: 0,
    message: '',
    stats: { played: 0, wins: 0, streak: 0, dist: [0, 0, 0, 0, 0, 0, 0] },
    winRateText: '0%',
    showResult: false,
    reveal: '',
    shareText: ''
  },

  onLoad: function () {
    const flags = (app.globalData && app.globalData.featureFlags) || {};
    if (!flags.wordle) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.board = [];
    this.loadStats();
    this.startGame('daily');
  },

  loadStats: function () {
    let s = null;
    try { s = wx.getStorageSync('wordle_stats'); } catch (e) {}
    if (s && typeof s === 'object') {
      const stats = Object.assign({ played: 0, wins: 0, streak: 0, dist: [0, 0, 0, 0, 0, 0, 0] }, s);
      this.setData({ stats: stats, winRateText: this.rate(stats) });
    }
  },

  rate: function (stats) {
    if (!stats.played) return '0%';
    return Math.round((stats.wins * 100) / stats.played) + '%';
  },

  saveStats: function (s) {
    try { wx.setStorageSync('wordle_stats', s); } catch (e) {}
  },

  startGame: function (mode) {
    const dayIndex = E.dayIndexFromDate(new Date());
    const answer = mode === 'free'
      ? ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
      : E.pickWord('d' + dayIndex, ANSWERS);
    this.board = [];
    this.setData({
      mode: mode,
      dayIndex: dayIndex,
      answer: answer,
      status: 'playing',
      draft: '',
      message: '',
      showResult: false,
      reveal: '',
      shareText: '',
      grid: emptyGrid()
    });
  },

  renderGrid: function () {
    const grid = emptyGrid();
    for (let r = 0; r < this.board.length; r++) {
      const row = this.board[r];
      for (let c = 0; c < WORD_LEN; c++) {
        grid[r].cells[c] = { k: c, char: row.chars[c], cls: clsOf(row.states[c]) };
      }
    }
    const ar = this.board.length;
    if (ar < ROWS) {
      const d = this.data.draft || '';
      for (let c = 0; c < WORD_LEN; c++) {
        grid[ar].cells[c] = { k: c, char: d[c] || '', cls: '' };
      }
    }
    this.setData({ grid: grid });
  },

  onInput: function (e) {
    let v = (e.detail.value || '').replace(/[^一-龥]/g, '').slice(0, WORD_LEN);
    this.setData({ draft: v });
    this.renderGrid();
  },

  onSubmit: function () {
    const draft = this.data.draft || '';
    if (this.data.status !== 'playing') return;
    if (draft.length !== WORD_LEN) {
      this.setData({ message: '请输入 ' + WORD_LEN + ' 个汉字' });
      return;
    }
    if (!E.isValidWord(draft)) {
      this.setData({ message: '只能输入汉字' });
      return;
    }
    const res = E.evaluateGuess(draft, this.data.answer);
    const chars = res.map(function (x) { return x.char; });
    const states = res.map(function (x) { return x.state; });
    this.board.push({ chars: chars, states: states });
    const won = E.isWin(this.board);
    const lost = !won && this.board.length >= ROWS;
    if (won || lost) {
      this.finishGame(won);
    } else {
      this.setData({ draft: '', message: '' });
    }
    this.renderGrid();
  },

  finishGame: function (won) {
    const stats = Object.assign({}, this.data.stats);
    stats.played = (stats.played || 0) + 1;
    if (won) {
      stats.wins = (stats.wins || 0) + 1;
      stats.streak = (stats.streak || 0) + 1;
      const di = this.board.length - 1;
      stats.dist[di] = (stats.dist[di] || 0) + 1;
    } else {
      stats.streak = 0;
    }
    this.saveStats(stats);
    const share = E.buildShare(this.board, won ? 'won' : 'lost', this.data.dayIndex);
    this.setData({
      status: won ? 'won' : 'lost',
      stats: stats,
      winRateText: this.rate(stats),
      showResult: true,
      reveal: this.data.answer,
      draft: '',
      shareText: share
    });
  },

  onShare: function () {
    const self = this;
    wx.setClipboardData({
      data: this.data.shareText,
      success: function () { wx.showToast({ title: '已复制战绩', icon: 'none' }); }
    });
  },

  onRestart: function () {
    this.startGame('free');
  },

  onDaily: function () {
    this.startGame('daily');
  },

  closeResult: function () {
    this.setData({ showResult: false });
  }
});
