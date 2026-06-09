var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    state: 'ready', // ready, playing, finished
    grid: [0,0,0,0,0,0,0,0,0], // 0=空 1=地鼠 2=炸弹
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 30,
    duration: 30,
    bestScore: 0,
    hitAnim: -1,
    missCount: 0
  },

  _timer: null,
  _moleTimer: null,
  _interval: 800,

  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('whackmole_best') || 0;
    this.setData({ bestScore: best });
  },

  onShow: function () {
    this.checkFavorite();
    this.clearTimers();
  },

  onHide: function () {
    if (this.data.state === 'playing') {
      this.endGame();
    }
  },

  onUnload: function () {
    this.clearTimers();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('whackmole') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('whackmole');
    this.setData({ isFavorite: fav });
  },

  onDurationChange: function (e) {
    var dur = Number(e.currentTarget.dataset.dur);
    this.setData({ duration: dur });
  },

  clearTimers: function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._moleTimer) { clearInterval(this._moleTimer); this._moleTimer = null; }
  },

  startGame: function () {
    var self = this;
    this.setData({
      state: 'playing',
      score: 0,
      combo: 0,
      maxCombo: 0,
      timeLeft: this.data.duration,
      grid: [0,0,0,0,0,0,0,0,0],
      hitAnim: -1,
      missCount: 0
    });
    this._interval = 800;

    // 倒计时
    this._timer = setInterval(function () {
      var t = self.data.timeLeft - 1;
      self.setData({ timeLeft: t });
      if (t <= 0) {
        self.endGame();
      }
      // 难度递增
      if (t > 0 && t % 10 === 0 && self._interval > 400) {
        self._interval -= 100;
        self.restartMoleTimer();
      }
    }, 1000);

    // 地鼠出现
    this.spawnMole();
    this.restartMoleTimer();
  },

  restartMoleTimer: function () {
    var self = this;
    if (this._moleTimer) { clearInterval(this._moleTimer); }
    this._moleTimer = setInterval(function () {
      self.spawnMole();
    }, this._interval);
  },

  spawnMole: function () {
    var grid = this.data.grid.slice();
    // 清除之前的地鼠（未被点击的算漏掉）
    var missed = 0;
    for (var i = 0; i < 9; i++) {
      if (grid[i] === 1) missed++;
    }
    if (missed > 0) {
      this.setData({ combo: 0, missCount: this.data.missCount + missed });
    }

    // 清空网格
    for (var j = 0; j < 9; j++) { grid[j] = 0; }

    // 随机1-2个地鼠
    var count = Math.random() > 0.7 ? 2 : 1;
    var positions = [];
    while (positions.length < count) {
      var pos = Math.floor(Math.random() * 9);
      if (positions.indexOf(pos) === -1) {
        positions.push(pos);
        grid[pos] = 1;
      }
    }

    // 10%概率出现炸弹
    if (Math.random() < 0.1) {
      var bombPos = Math.floor(Math.random() * 9);
      while (grid[bombPos] !== 0) {
        bombPos = Math.floor(Math.random() * 9);
      }
      grid[bombPos] = 2;
    }

    this.setData({ grid: grid });
  },

  onWhack: function (e) {
    if (this.data.state !== 'playing') return;
    var idx = Number(e.currentTarget.dataset.idx);
    var grid = this.data.grid.slice();

    if (grid[idx] === 1) {
      // 打中地鼠
      grid[idx] = 0;
      var combo = this.data.combo + 1;
      var maxCombo = Math.max(combo, this.data.maxCombo);
      var bonus = combo >= 5 ? 3 : (combo >= 3 ? 2 : 1);
      this.setData({
        grid: grid,
        score: this.data.score + bonus,
        combo: combo,
        maxCombo: maxCombo,
        hitAnim: idx
      });
      // 震动反馈
      wx.vibrateShort({ type: 'light' });
      var self = this;
      setTimeout(function () { self.setData({ hitAnim: -1 }); }, 300);
    } else if (grid[idx] === 2) {
      // 打中炸弹
      grid[idx] = 0;
      this.setData({
        grid: grid,
        score: Math.max(0, this.data.score - 5),
        combo: 0
      });
      wx.vibrateShort({ type: 'heavy' });
    } else {
      // 打空
      this.setData({ combo: 0 });
    }
  },

  endGame: function () {
    this.clearTimers();
    var score = this.data.score;
    var best = this.data.bestScore;
    if (score > best) {
      best = score;
      this.setData({ bestScore: best });
      wx.setStorageSync('whackmole_best', best);
    }
    this.setData({ state: 'finished', grid: [0,0,0,0,0,0,0,0,0] });

    storage.addHistory({
      toolId: 'whackmole',
      toolName: '打地鼠',
      category: 'fun',
      summary: score + '分·最大连击' + this.data.maxCombo,
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: '打地鼠 - 我打了' + this.data.score + '分！',
      path: '/pages/tools/whackmole/index'
    };
  }
});
