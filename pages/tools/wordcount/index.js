var textUtil = require('../../../utils/text.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    text: '',
    result: null,
    isFavorite: false
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('wordcount') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('wordcount') });
  },

  onTextInput: function (e) {
    this.setData({ text: e.detail.value });
    this.calculate();
  },

  calculate: function () {
    var result = textUtil.countText(this.data.text);
    this.setData({ result: result });
  },

  onClear: function () {
    this.setData({ text: '', result: null });
  },

  onShareAppMessage: function () {
    return { title: '字数统计 - 工具箱', path: '/pages/tools/wordcount/index' };
  }
});
