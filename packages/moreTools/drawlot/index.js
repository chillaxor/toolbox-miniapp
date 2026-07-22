var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    optionsText: '',
    options: [],
    drawCount: 1,
    result: null,
    isDrawing: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('drawlot') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('drawlot');
    this.setData({ isFavorite: fav });
  },

  onOptionsInput: function (e) {
    this.setData({ optionsText: e.detail.value });
  },

  onCountChange: function (e) {
    this.setData({ drawCount: Number(e.detail.value) });
  },

  onDraw: function () {
    var text = this.data.optionsText.trim();
    if (!text) {
      wx.showToast({ title: '请输入选项', icon: 'none' });
      return;
    }

    // 按换行或逗号分隔
    var options = text.split(/[\n,，、;；]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });

    if (options.length < 2) {
      wx.showToast({ title: '至少需要2个选项', icon: 'none' });
      return;
    }

    var count = Math.min(this.data.drawCount, options.length);
    this.setData({ options: options, isDrawing: true });

    var self = this;
    // 滚动动画效果
    var step = 0;
    var total = 10;
    var interval = setInterval(function () {
      // 随机显示
      var randomIdx = Math.floor(Math.random() * options.length);
      self.setData({ result: { items: [options[randomIdx]], count: count } });
      step++;
      if (step >= total) {
        clearInterval(interval);
        // 最终结果：Fisher-Yates 随机选取
        var shuffled = options.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
          var swap = Math.floor(Math.random() * (i + 1));
          var temp = shuffled[i];
          shuffled[i] = shuffled[swap];
          shuffled[swap] = temp;
        }
        var selected = shuffled.slice(0, count);
        self.setData({
          result: { items: selected, count: count },
          isDrawing: false
        });

        storage.addHistory({
          toolId: 'drawlot',
          toolName: '抽签抓阄',
          category: 'fun',
          summary: '从' + options.length + '项中抽' + count + '个：' + selected.join('、'),
          timestamp: Date.now()
        });
      }
    }, 80);
  },

  onReset: function () {
    this.setData({ result: null, isDrawing: false });
  },

  onShareAppMessage: function () {
    return {
      title: '抽签抓阄 - 工具箱',
      path: '/packages/moreTools/drawlot/index'
    };
  }
});
