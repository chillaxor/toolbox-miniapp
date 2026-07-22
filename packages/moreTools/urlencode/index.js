var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    mode: 'encode',
    inputText: '',
    resultText: ''
  },
  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('urlencode') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('urlencode') }); },
  onSwitchMode: function (e) { this.setData({ mode: e.currentTarget.dataset.mode, resultText: '' }); },
  onInputChange: function (e) { this.setData({ inputText: e.detail.value }); },
  onConvert: function () {
    var result = '';
    if (this.data.mode === 'encode') {
      result = encodeURIComponent(this.data.inputText);
    } else {
      try { result = decodeURIComponent(this.data.inputText); } catch (e) {
        wx.showToast({ title: '解码失败，请检查输入', icon: 'none' }); return;
      }
    }
    this.setData({ resultText: result });
    storage.addHistory({ toolId: 'urlencode', toolName: 'URL编解码', category: 'text', summary: (this.data.mode === 'encode' ? '编码' : '解码') + '成功', timestamp: Date.now() });
  },
  onCopy: function () { if (this.data.resultText) wx.setClipboardData({ data: this.data.resultText }); },
  onShareAppMessage: function () { return { title: 'URL编解码 - 工具箱', path: '/packages/moreTools/urlencode/index' }; }
});
