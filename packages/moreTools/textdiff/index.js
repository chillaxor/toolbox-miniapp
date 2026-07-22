var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    textA: '',
    textB: '',
    showResult: false,
    diffLines: [],
    addCount: 0,
    delCount: 0,
    sameCount: 0
  },
  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('textdiff') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('textdiff') }); },
  onTextAInput: function (e) { this.setData({ textA: e.detail.value }); },
  onTextBInput: function (e) { this.setData({ textB: e.detail.value }); },
  onCompare: function () {
    var a = this.data.textA.split('\n');
    var b = this.data.textB.split('\n');
    var maxLen = Math.max(a.length, b.length);
    var diffLines = [];
    var addCount = 0, delCount = 0, sameCount = 0;
    for (var i = 0; i < maxLen; i++) {
      var lineA = i < a.length ? a[i] : undefined;
      var lineB = i < b.length ? b[i] : undefined;
      if (lineA === lineB) {
        diffLines.push({ type: 'same', num: i + 1, textA: lineA || '', textB: lineB || '' });
        sameCount++;
      } else {
        if (lineA !== undefined && lineB !== undefined) {
          diffLines.push({ type: 'diff', num: i + 1, textA: lineA, textB: lineB });
          addCount++;
          delCount++;
        } else if (lineA !== undefined) {
          diffLines.push({ type: 'del', num: i + 1, textA: lineA, textB: '' });
          delCount++;
        } else {
          diffLines.push({ type: 'add', num: i + 1, textA: '', textB: lineB });
          addCount++;
        }
      }
    }
    this.setData({ showResult: true, diffLines: diffLines, addCount: addCount, delCount: delCount, sameCount: sameCount });
    storage.addHistory({
      toolId: 'textdiff', toolName: '文本对比', category: 'text',
      summary: addCount + '处新增，' + delCount + '处删除', timestamp: Date.now()
    });
  },
  onClear: function () {
    this.setData({ textA: '', textB: '', showResult: false, diffLines: [] });
  },
  onShareAppMessage: function () { return { title: '文本对比 - 工具箱', path: '/packages/moreTools/textdiff/index' }; }
});
