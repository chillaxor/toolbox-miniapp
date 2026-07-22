var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    namesText: '',
    groupCount: 2,
    groups: [],
    showResult: false,
    isProcessing: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('randomgroup') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('randomgroup');
    this.setData({ isFavorite: fav });
  },

  onNamesInput: function (e) {
    this.setData({ namesText: e.detail.value });
  },

  onGroupCountInput: function (e) {
    this.setData({ groupCount: Number(e.detail.value) || 2 });
  },

  onGroupCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    this.setData({ groupCount: count });
  },

  onShuffle: function () {
    var text = this.data.namesText.trim();
    if (!text) {
      wx.showToast({ title: '请输入名单', icon: 'none' });
      return;
    }

    var names = text.split(/[\n,，、;；]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
    var groupCount = this.data.groupCount;

    if (names.length < 2) {
      wx.showToast({ title: '至少需要2个人', icon: 'none' });
      return;
    }
    if (groupCount < 2) {
      wx.showToast({ title: '至少分2组', icon: 'none' });
      return;
    }
    if (groupCount > names.length) {
      wx.showToast({ title: '组数不能超过人数', icon: 'none' });
      return;
    }

    // Fisher-Yates 洗牌
    var shuffled = names.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var swap = Math.floor(Math.random() * (i + 1));
      var temp = shuffled[i];
      shuffled[i] = shuffled[swap];
      shuffled[swap] = temp;
    }

    // 分配到各组
    var groups = [];
    for (var g = 0; g < groupCount; g++) {
      groups.push({ name: '第' + (g + 1) + '组', members: [], color: this.getGroupColor(g) });
    }

    for (var j = 0; j < shuffled.length; j++) {
      groups[j % groupCount].members.push(shuffled[j]);
    }

    this.setData({
      groups: groups,
      showResult: true,
      isProcessing: false
    });

    var summary = names.length + '人分' + groupCount + '组';
    storage.addHistory({
      toolId: 'randomgroup',
      toolName: '随机分组',
      category: 'fun',
      summary: summary,
      timestamp: Date.now()
    });
  },

  getGroupColor: function (index) {
    var colors = ['#FF6B35', '#4ECDC4', '#45B058', '#9B59B6', '#E74C3C', '#F39C12', '#3498DB', '#1ABC9C'];
    return colors[index % colors.length];
  },

  onReset: function () {
    this.setData({ groups: [], showResult: false });
  },

  onShareAppMessage: function () {
    return {
      title: '随机分组 - 工具箱',
      path: '/packages/moreTools/randomgroup/index'
    };
  }
});
