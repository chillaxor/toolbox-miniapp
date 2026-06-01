var storage = require('../../../utils/storage.js');

var DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

Page({
  data: {
    isFavorite: false,
    diceCount: 1,
    results: [],
    total: 0,
    isRolling: false,
    history: []
  },

  onLoad: function () {
    this.checkFavorite();
    this.setData({ results: [DICE_FACES[0]], total: 1 });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('dice') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('dice');
    this.setData({ isFavorite: fav });
  },

  onDiceCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    this.setData({ diceCount: count });
    // 初始化对应数量的骰子
    var results = [];
    for (var i = 0; i < count; i++) {
      results.push(DICE_FACES[0]);
    }
    this.setData({ results: results, total: 0 });
  },

  onRoll: function () {
    var self = this;
    this.setData({ isRolling: true });

    var count = this.data.diceCount;
    var step = 0;
    var total = 8;

    var interval = setInterval(function () {
      var results = [];
      var sum = 0;
      for (var i = 0; i < count; i++) {
        var val = Math.floor(Math.random() * 6) + 1;
        results.push(DICE_FACES[val - 1]);
        sum += val;
      }
      self.setData({ results: results, total: sum });
      step++;

      if (step >= total) {
        clearInterval(interval);
        // 最终结果
        var finalResults = [];
        var finalSum = 0;
        for (var j = 0; j < count; j++) {
          var v = Math.floor(Math.random() * 6) + 1;
          finalResults.push(DICE_FACES[v - 1]);
          finalSum += v;
        }
        self.setData({
          results: finalResults,
          total: finalSum,
          isRolling: false
        });

        // 保存历史
        var history = self.data.history.slice();
        history.unshift({
          results: finalResults.slice(),
          total: finalSum,
          count: count,
          timestamp: Date.now()
        });
        if (history.length > 20) history = history.slice(0, 20);
        self.setData({ history: history });

        storage.addHistory({
          toolId: 'dice',
          toolName: '摇骰子',
          category: 'fun',
          summary: count + '个骰子 → 总和' + finalSum,
          timestamp: Date.now()
        });
      }
    }, 80);
  },

  onClearHistory: function () {
    this.setData({ history: [] });
  },

  onShareAppMessage: function () {
    return {
      title: '摇骰子 - 工具箱',
      path: '/pages/tools/dice/index'
    };
  }
});
