var storage = require('../../../utils/storage.js');

var COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6B35','#C780FA','#FF9FF3','#00D2D3','#54A0FF','#5F27CD'];

Page({
  data: {
    isFavorite: false,
    showInput: true,
    inputText: '',
    fontSize: 28,
    danmakuList: []
  },
  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  onUnload: function () { if (this._timer) clearInterval(this._timer); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('danmaku') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('danmaku') }); },
  onInputChange: function (e) { this.setData({ inputText: e.detail.value }); },
  onFontSizeChange: function (e) { this.setData({ fontSize: e.detail.value }); },
  onSend: function () {
    var text = this.data.inputText.trim();
    if (!text) { wx.showToast({ title: '请输入弹幕内容', icon: 'none' }); return; }
    var color = COLORS[Math.floor(Math.random() * COLORS.length)];
    var top = Math.floor(Math.random() * 70) + 5;
    var fontSize = this.data.fontSize;
    var id = Date.now().toString() + Math.random();
    this.setData({
      showInput: false,
      danmakuList: this.data.danmakuList.concat([{
        id: id, text: text, color: color, top: top, fontSize: fontSize
      }]),
      inputText: ''
    });
    var self = this;
    // 8秒后移除弹幕
    setTimeout(function () {
      var list = self.data.danmakuList.filter(function (item) { return item.id !== id; });
      self.setData({ danmakuList: list });
    }, 8000);
    storage.addHistory({
      toolId: 'danmaku', toolName: '弹幕墙', category: 'fun',
      summary: text, timestamp: Date.now()
    });
  },
  onTapScreen: function () {
    if (!this.data.showInput) {
      this.setData({ showInput: true });
    }
  },
  onShareAppMessage: function () { return { title: '弹幕墙 - 工具箱', path: '/pages/tools/danmaku/index' }; }
});
