var storage = require('../../../utils/storage.js');

var COIN_HEAD = { emoji: '🪙', label: '正面', color: '#F39C12' };
var COIN_TAIL = { emoji: '🌑', label: '反面', color: '#7F8C8D' };

Page({
  data: {
    isFavorite: false,
    coinEmoji: '🪙',
    coinLabel: '点击硬币抛出',
    coinColor: '#F39C12',
    isFlipping: false,
    result: null,
    headCount: 0,
    tailCount: 0,
    totalCount: 0,
    headPct: '50.0',
    tailPct: '50.0',
    headBarWidth: 50,
    history: [],
    // 多枚模式
    multiMode: false,
    multiCount: 3,
    multiCountText: '抛出 3 枚',
    multiResults: []
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('coincoin') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('coincoin');
    this.setData({ isFavorite: fav });
  },

  onModeChange: function (e) {
    var val = e.currentTarget.dataset.multi;
    // dataset 传过来是字符串，转布尔
    var multi = (val === true || val === 'true');
    this.setData({ multiMode: multi });
  },

  onMultiCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    this.setData({
      multiCount: count,
      multiCountText: '抛出 ' + count + ' 枚'
    });
  },

  onFlip: function () {
    if (this.data.isFlipping) return;
    if (this.data.multiMode) {
      this._flipMulti();
    } else {
      this._flipSingle();
    }
  },

  _flipSingle: function () {
    var self = this;
    this.setData({ isFlipping: true, coinLabel: '飞~' });

    var flipCount = 0;
    var totalFlips = 10;

    var interval = setInterval(function () {
      var isHead = Math.random() < 0.5;
      self.setData({
        coinEmoji: isHead ? COIN_HEAD.emoji : COIN_TAIL.emoji,
        coinColor: isHead ? COIN_HEAD.color : COIN_TAIL.color
      });
      flipCount++;

      if (flipCount >= totalFlips) {
        clearInterval(interval);
        var finalIsHead = Math.random() < 0.5;
        var info = finalIsHead ? COIN_HEAD : COIN_TAIL;
        var face = finalIsHead ? 'head' : 'tail';

        var headCount = self.data.headCount + (finalIsHead ? 1 : 0);
        var tailCount = self.data.tailCount + (finalIsHead ? 0 : 1);
        var totalCount = self.data.totalCount + 1;

        var history = self.data.history.slice();
        history.unshift({ face: face, emoji: info.emoji, label: info.label, timestamp: Date.now() });
        if (history.length > 30) history = history.slice(0, 30);

        self.setData({
          isFlipping: false,
          result: face,
          coinEmoji: info.emoji,
          coinLabel: info.label,
          coinColor: info.color,
          headCount: headCount,
          tailCount: tailCount,
          totalCount: totalCount,
          headPct: (headCount / totalCount * 100).toFixed(1),
          tailPct: (tailCount / totalCount * 100).toFixed(1),
          headBarWidth: Math.round(headCount / totalCount * 100),
          history: history
        });

        storage.addHistory({
          toolId: 'coincoin',
          toolName: '抛硬币',
          category: 'fun',
          summary: '结果：' + info.label,
          timestamp: Date.now()
        });
      }
    }, 80);
  },

  _flipMulti: function () {
    var self = this;
    var n = this.data.multiCount;
    this.setData({ isFlipping: true });

    setTimeout(function () {
      var results = [];
      var headThisRound = 0, tailThisRound = 0;

      for (var i = 0; i < n; i++) {
        var isHead = Math.random() < 0.5;
        var info = isHead ? COIN_HEAD : COIN_TAIL;
        results.push({ face: isHead ? 'head' : 'tail', emoji: info.emoji, label: info.label });
        if (isHead) headThisRound++; else tailThisRound++;
      }

      var headCount = self.data.headCount + headThisRound;
      var tailCount = self.data.tailCount + tailThisRound;
      var totalCount = self.data.totalCount + n;
      var summary = '正面×' + headThisRound + ' 反面×' + tailThisRound;

      var history = self.data.history.slice();
      history.unshift({ face: 'multi', emoji: COIN_HEAD.emoji, label: summary, timestamp: Date.now() });
      if (history.length > 30) history = history.slice(0, 30);

      self.setData({
        isFlipping: false,
        multiResults: results,
        headCount: headCount,
        tailCount: tailCount,
        totalCount: totalCount,
        headPct: (headCount / totalCount * 100).toFixed(1),
        tailPct: (tailCount / totalCount * 100).toFixed(1),
        headBarWidth: Math.round(headCount / totalCount * 100),
        history: history
      });

      storage.addHistory({
        toolId: 'coincoin',
        toolName: '抛硬币',
        category: 'fun',
        summary: n + '枚：' + summary,
        timestamp: Date.now()
      });
    }, 600);
  },

  onReset: function () {
    this.setData({
      headCount: 0,
      tailCount: 0,
      totalCount: 0,
      headPct: '50.0',
      tailPct: '50.0',
      headBarWidth: 50,
      result: null,
      coinEmoji: '🪙',
      coinLabel: '点击硬币抛出',
      coinColor: '#F39C12',
      history: [],
      multiResults: []
    });
  },

  onShareAppMessage: function () {
    return {
      title: '抛硬币 - 工具箱',
      path: '/pages/tools/coincoin/index'
    };
  }
});
