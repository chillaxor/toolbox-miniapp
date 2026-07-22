var textUtil = require('../../../utils/text.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { text: '', result: '', isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('caseconvert') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('caseconvert') }); },

  onTextInput: function (e) { this.setData({ text: e.detail.value }); },

  onConvert: function (e) {
    if (!this.data.text) { wx.showToast({ title: '请输入文本', icon: 'none' }); return; }
    var mode = e.currentTarget.dataset.mode;
    var result = textUtil.convertCase(this.data.text, mode);
    this.setData({ result: result });
  },

  onCopyResult: function () {
    if (!this.data.result) return;
    wx.setClipboardData({ data: this.data.result, success: function () { wx.showToast({ title: '已复制', icon: 'success' }); } });
  },

  onClear: function () { this.setData({ text: '', result: '' }); },

  onShareAppMessage: function () { return { title: '大小写转换 - 工具箱', path: '/packages/toolsB/caseconvert/index' }; }
});
