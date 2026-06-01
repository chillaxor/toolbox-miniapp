var base64Util = require('../../../utils/base64.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { text: '', result: '', errorMsg: '', isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('base64') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('base64') }); },

  onTextInput: function (e) { this.setData({ text: e.detail.value, errorMsg: '' }); },

  onEncode: function () {
    if (!this.data.text) { wx.showToast({ title: '请输入文本', icon: 'none' }); return; }
    var result = base64Util.encodeBase64(this.data.text);
    this.setData({ result: result, errorMsg: '' });
    storage.addHistory({ toolId: 'base64', toolName: 'Base64编解码', category: 'text', summary: '编码成功', timestamp: Date.now() });
  },

  onDecode: function () {
    if (!this.data.text) { wx.showToast({ title: '请输入Base64字符串', icon: 'none' }); return; }
    var res = base64Util.decodeBase64(this.data.text);
    if (res.success) {
      this.setData({ result: res.result, errorMsg: '' });
      storage.addHistory({ toolId: 'base64', toolName: 'Base64编解码', category: 'text', summary: '解码成功', timestamp: Date.now() });
    } else {
      this.setData({ errorMsg: res.error });
    }
  },

  onCopyResult: function () {
    wx.setClipboardData({ data: this.data.result, success: function () { wx.showToast({ title: '已复制', icon: 'success' }); } });
  },

  onClear: function () { this.setData({ text: '', result: '', errorMsg: '' }); },

  onShareAppMessage: function () { return { title: 'Base64编解码 - 工具箱', path: '/pages/tools/base64/index' }; }
});
