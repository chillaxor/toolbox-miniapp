var toolsData = require('../../data/tools.js');
var storage = require('../../utils/storage.js');

var RECENT_KEY = 'toolbox_recent';
var RECENT_MAX = 8;

var CATEGORY_ICONS = {
  'life': '🏠',
  'date': '📅',
  'text': '📝',
  'image': '🖼️',
  'fun': '🎮',
  'study': '📚'
};

Page({
  data: {
    catId: '',
    catName: '',
    color: '#FF6B35',
    bgColor: '#FFE5D9',
    icon: '📦',
    keywords: '',
    filter: 'all',     // 'all' | 'hot'
    allTools: [],
    displayTools: [],
    totalCount: 0
  },

  onLoad: function (options) {
    var app = getApp();
    this._flags = (app.globalData && app.globalData.featureFlags) || wx.getStorageSync('feature_flags') || {};
    var id = (options && options.id) ? options.id : 'fun';
    this.loadCategory(id);
  },

  onShow: function () {
    // 分类页为 navigateTo 子页，无自定义 tabBar，无需 setData selected
  },

  loadCategory: function (catId) {
    var self = this;
    var cat = toolsData.getCategoryById(catId) || toolsData.getCategoryList()[0];
    var raw = toolsData.getToolsByCategory(cat.id);
    var list = [];

    for (var i = 0; i < raw.length; i++) {
      var t = raw[i];
      if (self._flags[t.id] === false) continue;
      var badge = toolsData.getBadgeInfo(t);
      list.push({
        id: t.id,
        name: t.name,
        icon: t.icon,
        path: t.path,
        description: t.description,
        color: cat.color,
        bgColor: cat.bgColor,
        badgeType: badge.type,
        badgeText: badge.text,
        badgeEmoji: badge.emoji
      });
    }

    wx.setNavigationBarTitle({ title: cat.name });

    this.setData({
      catId: cat.id,
      catName: cat.name,
      color: cat.color,
      bgColor: cat.bgColor,
      icon: CATEGORY_ICONS[cat.id] || '📦',
      allTools: list,
      totalCount: list.length
    });

    this.applyFilter();
  },

  applyFilter: function () {
    var kw = (this.data.keywords || '').trim().toLowerCase();
    var filter = this.data.filter;
    var all = this.data.allTools;
    var out = [];

    for (var i = 0; i < all.length; i++) {
      var t = all[i];
      if (filter === 'hot' && !t.badgeType) continue;
      if (kw) {
        if (t.name.toLowerCase().indexOf(kw) === -1 &&
            t.description.toLowerCase().indexOf(kw) === -1) continue;
      }
      out.push(t);
    }

    this.setData({ displayTools: out });
  },

  onSearchInput: function (e) {
    this.setData({ keywords: e.detail.value });
    this.applyFilter();
  },

  onFilterTap: function (e) {
    var f = e.currentTarget.dataset.f;
    if (f === this.data.filter) return;
    this.setData({ filter: f });
    this.applyFilter();
  },

  onToolTap: function (e) {
    var toolId = e.currentTarget.dataset.id;
    var tool = null;
    var list = this.data.allTools;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === toolId) { tool = list[i]; break; }
    }
    if (!tool) return;
    this._addRecent(toolId);
    wx.navigateTo({ url: tool.path });
  },

  _addRecent: function (toolId) {
    var ids = storage.getSync(RECENT_KEY, []);
    ids = ids.filter(function (x) { return x !== toolId; });
    ids.unshift(toolId);
    if (ids.length > RECENT_MAX) ids = ids.slice(0, RECENT_MAX);
    storage.setSync(RECENT_KEY, ids);
  },

  onShareAppMessage: function () {
    return {
      title: '工具箱 - ' + this.data.catName,
      path: '/pages/category/category?id=' + this.data.catId
    };
  }
});
