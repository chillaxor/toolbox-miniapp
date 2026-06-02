var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    inputText: '',
    resultText: '',
    resultLines: 0,
    emptyLine: 'keep'
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('textdedup') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('textdedup');
    this.setData({ isFavorite: fav });
  },

  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  onEmptyLineChange: function (e) {
    this.setData({ emptyLine: e.currentTarget.dataset.mode });
  },

  onDedup: function () {
    var lines = this.data.inputText.split('\n');
    if (this.data.emptyLine === 'remove') {
      lines = lines.filter(function (l) { return l.trim() !== ''; });
    }
    var seen = {};
    var result = [];
    for (var i = 0; i < lines.length; i++) {
      var key = lines[i];
      if (!seen[key]) {
        seen[key] = true;
        result.push(lines[i]);
      }
    }
    var removed = lines.length - result.length;
    this.setData({ resultText: result.join('\n'), resultLines: result.length });
    storage.addHistory({
      toolId: 'textdedup', toolName: '文本去重排序', category: 'text',
      summary: '去重移除' + removed + '行', timestamp: Date.now()
    });
  },

  onSort: function () {
    var lines = this.data.inputText.split('\n');
    if (this.data.emptyLine === 'remove') {
      lines = lines.filter(function (l) { return l.trim() !== ''; });
    }
    lines.sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); });
    this.setData({ resultText: lines.join('\n'), resultLines: lines.length });
    storage.addHistory({
      toolId: 'textdedup', toolName: '文本去重排序', category: 'text',
      summary: '排序' + lines.length + '行', timestamp: Date.now()
    });
  },

  onDedupSort: function () {
    var lines = this.data.inputText.split('\n');
    if (this.data.emptyLine === 'remove') {
      lines = lines.filter(function (l) { return l.trim() !== ''; });
    }
    var seen = {};
    var unique = [];
    for (var i = 0; i < lines.length; i++) {
      if (!seen[lines[i]]) {
        seen[lines[i]] = true;
        unique.push(lines[i]);
      }
    }
    unique.sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); });
    this.setData({ resultText: unique.join('\n'), resultLines: unique.length });
  },

  onCopy: function () {
    if (!this.data.resultText) return;
    wx.setClipboardData({ data: this.data.resultText });
  },

  onShareAppMessage: function () {
    return { title: '文本去重排序 - 工具箱', path: '/pages/tools/textdedup/index' };
  }
});
