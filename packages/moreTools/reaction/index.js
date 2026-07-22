var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    // waiting: 等待开始, ready: 等待变绿, go: 可以点击, result: 显示结果, tooearly: 提前点击
    state: 'waiting',
    resultMs: 0,
    bestMs: 0,
    timer: null,
    startTime: 0
  },
  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('reaction_best') || 0;
    this.setData({ bestMs: best });
  },
  onShow: function () { this.checkFavorite(); },
  onUnload: function () { if (this.data.timer) clearTimeout(this.data.timer); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('reaction') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('reaction') }); },

  onStart: function () {
    var self = this;
    this.setData({ state: 'ready' });
    // 随机 1.5~4 秒后变绿
    var delay = 1500 + Math.floor(Math.random() * 2500);
    var timer = setTimeout(function () {
      self.setData({ state: 'go', startTime: Date.now(), timer: null });
    }, delay);
    this.setData({ timer: timer });
  },

  onTap: function () {
    var state = this.data.state;
    if (state === 'ready') {
      // 提前点击
      if (this.data.timer) clearTimeout(this.data.timer);
      this.setData({ state: 'tooearly', timer: null });
    } else if (state === 'go') {
      var ms = Date.now() - this.data.startTime;
      var best = this.data.bestMs;
      if (!best || ms < best) {
        best = ms;
        wx.setStorageSync('reaction_best', best);
      }
      this.setData({ state: 'result', resultMs: ms, bestMs: best });
      storage.addHistory({
        toolId: 'reaction', toolName: '反应测试', category: 'fun',
        summary: '反应时间: ' + ms + 'ms', timestamp: Date.now()
      });
    } else if (state === 'result' || state === 'tooearly') {
      this.onStart();
    }
  },

  onShareAppMessage: function () { return { title: '反应测试 - 我的反应时间是' + this.data.resultMs + 'ms', path: '/packages/moreTools/reaction/index' }; }
});
