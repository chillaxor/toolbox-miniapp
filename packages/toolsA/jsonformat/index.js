var jsonUtil = require('../../../utils/json-format.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { text: '', result: '', errorMsg: '', isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('jsonformat') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('jsonformat') }); },

  onTextInput: function (e) { this.setData({ text: e.detail.value, errorMsg: '' }); },

  onFormat: function () {
    var res = jsonUtil.formatJSON(this.data.text, 2);
    if (res.success) {
      this.setData({ result: res.result, errorMsg: '' });
      storage.addHistory({ toolId: 'jsonformat', toolName: 'JSON格式化', category: 'text', summary: '格式化JSON成功', timestamp: Date.now() });
    } else {
      this.setData({ errorMsg: res.error });
    }
  },

  onMinify: function () {
    var res = jsonUtil.minifyJSON(this.data.text);
    if (res.success) {
      this.setData({ result: res.result, errorMsg: '' });
      storage.addHistory({ toolId: 'jsonformat', toolName: 'JSON格式化', category: 'text', summary: '压缩JSON成功', timestamp: Date.now() });
    } else {
      this.setData({ errorMsg: res.error });
    }
  },

  onCopyResult: function () {
    wx.setClipboardData({ data: this.data.result, success: function () { wx.showToast({ title: '已复制', icon: 'success' }); } });
  },

  onClear: function () { this.setData({ text: '', result: '', errorMsg: '' }); },

  onShareAppMessage: function () { return { title: 'JSON格式化 - 工具箱', path: '/packages/toolsA/jsonformat/index' }; }
});
