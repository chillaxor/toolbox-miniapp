var storage = require('../../../utils/storage.js');

// 所有可用的emoji卡牌
var ALL_EMOJIS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝',
  '🌺', '🌻', '🌹', '🌸', '🐶', '🐱', '🐰', '🦊',
  '🐻', '🐼', '🐨', '🐯', '🎸', '🎺', '🥁', '🎹',
  '⚽', '🏀', '🎾', '🏐', '🚀', '✈️', '🚂', '🛸',
  '🍕', '🍔', '🌮', '🍣', '🍩', '🍰', '🧁', '🍦'
];

// 难度配置
var DIFFICULTY_CONFIG = {
  easy: { cols: 4, rows: 3, pairs: 6 },
  normal: { cols: 4, rows: 4, pairs: 8 },
  hard: { cols: 6, rows: 4, pairs: 12 }
};

// 评级阈值（根据难度不同）
var STAR_THRESHOLDS = {
  easy: { three: 8, two: 12 },
  normal: { three: 12, two: 18 },
  hard: { three: 18, two: 28 }
};

Page({
  data: {
    isFavorite: false,
    state: 'setup', // setup, playing, complete
    difficulty: 'easy',
    bestRecord: null,
    // 互动数据
    cards: [],
    cols: 4,
    rows: 3,
    totalPairs: 6,
    matchedPairs: 0,
    steps: 0,
    timeDisplay: '00:00',
    stars: 0,
    isNewRecord: false
  },

  _timer: null,
  _seconds: 0,
  _flippedCards: [],
  _locked: false,

  onLoad: function () {
    this.checkFavorite();
    this.loadBestRecord();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    this.clearTimer();
  },

  onHide: function () {
    this.clearTimer();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('cardmatch') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('cardmatch');
    this.setData({ isFavorite: fav });
  },

  onDifficultyChange: function (e) {
    var diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff });
    this.loadBestRecord();
  },

  loadBestRecord: function () {
    var key = 'cardmatch_best_' + this.data.difficulty;
    var record = wx.getStorageSync(key);
    if (record) {
      this.setData({ bestRecord: record });
    } else {
      this.setData({ bestRecord: null });
    }
  },

  startGame: function () {
    var diff = this.data.difficulty;
    var config = DIFFICULTY_CONFIG[diff];
    var pairs = config.pairs;
    var cols = config.cols;
    var rows = config.rows;

    // 随机选择emoji
    var emojis = ALL_EMOJIS.slice();
    this.shuffleArray(emojis);
    var selected = emojis.slice(0, pairs);

    // 创建卡牌对
    var cardEmojis = [];
    for (var i = 0; i < pairs; i++) {
      cardEmojis.push(selected[i]);
      cardEmojis.push(selected[i]);
    }

    // 洗牌
    this.shuffleArray(cardEmojis);

    // 创建卡牌对象
    var cards = [];
    for (var j = 0; j < cardEmojis.length; j++) {
      cards.push({
        id: j,
        emoji: cardEmojis[j],
        flipped: false,
        matched: false
      });
    }

    this._flippedCards = [];
    this._locked = false;
    this._seconds = 0;

    this.setData({
      state: 'playing',
      cards: cards,
      cols: cols,
      rows: rows,
      totalPairs: pairs,
      matchedPairs: 0,
      steps: 0,
      timeDisplay: '00:00',
      stars: 0,
      isNewRecord: false
    });

    this.startTimer();
  },

  startTimer: function () {
    var that = this;
    this.clearTimer();
    this._timer = setInterval(function () {
      that._seconds++;
      var min = Math.floor(that._seconds / 60);
      var sec = that._seconds % 60;
      var display = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
      that.setData({ timeDisplay: display });
    }, 1000);
  },

  clearTimer: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  onCardTap: function (e) {
    if (this._locked) return;

    var id = Number(e.currentTarget.dataset.id);
    var cards = this.data.cards;
    var card = cards[id];

    // 已翻开或已配对的不能点
    if (card.flipped || card.matched) return;

    // 翻开卡牌
    cards[id].flipped = true;
    this.setData({ cards: cards });
    this._flippedCards.push(id);

    // 如果翻开了两张
    if (this._flippedCards.length === 2) {
      var that = this;
      this.setData({ steps: this.data.steps + 1 });
      this._locked = true;

      var first = this._flippedCards[0];
      var second = this._flippedCards[1];

      if (cards[first].emoji === cards[second].emoji) {
        // 配对成功
        setTimeout(function () {
          cards[first].matched = true;
          cards[second].matched = true;
          var matched = that.data.matchedPairs + 1;
          that.setData({ cards: cards, matchedPairs: matched });
          that._flippedCards = [];
          that._locked = false;

          // 检查是否全部配对完成
          if (matched >= that.data.totalPairs) {
            that.onGameComplete();
          }
        }, 400);
      } else {
        // 配对失败，翻回去
        setTimeout(function () {
          cards[first].flipped = false;
          cards[second].flipped = false;
          that.setData({ cards: cards });
          that._flippedCards = [];
          that._locked = false;
        }, 800);
      }
    }
  },

  onGameComplete: function () {
    this.clearTimer();

    var steps = this.data.steps;
    var difficulty = this.data.difficulty;
    var thresholds = STAR_THRESHOLDS[difficulty];
    var stars = 1;
    if (steps <= thresholds.three) {
      stars = 3;
    } else if (steps <= thresholds.two) {
      stars = 2;
    }

    // 检查是否新纪录
    var key = 'cardmatch_best_' + difficulty;
    var record = wx.getStorageSync(key);
    var isNew = false;

    if (!record || this._seconds < record.time || (this._seconds === record.time && steps < record.steps)) {
      var newRecord = { time: this._seconds, steps: steps };
      wx.setStorageSync(key, newRecord);
      isNew = true;
    }

    var min = Math.floor(this._seconds / 60);
    var sec = this._seconds % 60;
    var display = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;

    this.setData({
      state: 'complete',
      stars: stars,
      timeDisplay: display,
      isNewRecord: isNew
    });

    this.loadBestRecord();
  },

  onReplay: function () {
    this.startGame();
  },

  onBackToSetup: function () {
    this.setData({ state: 'setup' });
    this.loadBestRecord();
  },

  shuffleArray: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  },

  onShareAppMessage: function () {
    return {
      title: '翻牌配对 - 考验记忆力',
      path: '/packages/toolsB/cardmatch/index'
    };
  }
});
