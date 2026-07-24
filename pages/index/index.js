var toolsData = require('../../data/tools.js');
var storage = require('../../utils/storage.js');

var RECENT_KEY = 'toolbox_recent';
var RECENT_MAX = 8;

var CATEGORY_DEFAULT_COUNTS = {
  'life': '20',
  'date': '8',
  'text': '10',
  'image': '16',
  'fun': '35',
  'study': '15'
};

var FEATURED_PRIMARY = 'https://gitee.com/b64882/qian_data/raw/master/featured.json';
var FEATURED_MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/featured.json';

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
    searchText: '',
    searchResults: [],
    categoryList: [],
    activeCategoryIndex: 0,
    activeCategoryName: '',
    activeColor: '#FF6B35',
    currentTools: [],
    recentTools: [],
    featuredList: []
  },

  onLoad: function () {
    var app = getApp();
    this._flags = (app.globalData && app.globalData.featureFlags) || wx.getStorageSync('feature_flags') || {};
    this.initCategoryList();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    if (flags && Object.keys(flags).length) {
      this._flags = flags;
      this.applyFeatureFlags(flags);
    }
    this._loadRecent();
  },

  /**
   * 初始化分类列表、精选位、默认工具列表
   */
  initCategoryList: function () {
    var self = this;
    var categories = toolsData.getCategoryList();
    var categoryList = categories.map(function (cat) {
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        bgColor: cat.bgColor,
        icon: CATEGORY_ICONS[cat.id] || '📦',
        count: (CATEGORY_DEFAULT_COUNTS[cat.id] || '12') + '+',
        // 明亮多彩：浅色底 -> 主色 的渐变
        gradient: 'linear-gradient(135deg, ' + cat.bgColor + ' 0%, ' + cat.color + ' 100%)'
      };
    });

    var currentTools = this.getVisibleTools(categoryList[0].id);

    this.setData({
      categoryList: categoryList,
      featuredList: this._buildImageFallback(),
      currentTools: currentTools,
      activeCategoryIndex: 0,
      activeCategoryName: categoryList[0].name,
      activeColor: categoryList[0].color
    });

    this._maybeLoadFeatured();
    this._loadRecent();
  },

  _buildImageFallback: function () {
    var imgTools = toolsData.getToolsByCategory('image');
    var cat = toolsData.getCategoryById('image');
    var pool = imgTools.slice();
    var picked = [];
    var n = Math.min(2, pool.length);
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked.map(function (t) {
      return {
        id: t.id,
        title: t.name,
        subtitle: t.description,
        icon: t.icon,
        path: t.path,
        gradient: 'linear-gradient(120deg, ' + cat.color + ' 0%, ' + cat.bgColor + ' 100%)'
      };
    });
  },

  _maybeLoadFeatured: function () {
    var on = this._flags && this._flags.useRemoteFeatured === true;
    if (on === false) {
      if (this._featuredFromRemote !== false) {
        this._featuredFromRemote = false;
        this.setData({ featuredList: this._buildImageFallback() });
      }
      return;
    }
    if (this._featuredRequested) return; // 防重复请求（onShow / flags 回调会多次触发）
    this._featuredRequested = true;
    this._loadFeatured();
  },

  _loadFeatured: function () {
    var self = this;

    function toList(raw) {
      if (raw && typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = null; }
      }
      if (!raw) return null;
      return Array.isArray(raw) ? raw : raw.featured;
    }

    function applyRemote(raw) {
      var list = toList(raw);
      if (!Array.isArray(list) || !list.length) return false;
      var mapped = list.map(function (item) {
        var t = toolsData.getToolById(item.id);
        var cat = t ? toolsData.getCategoryById(t.category) : null;
        var fallbackGrad = cat
          ? 'linear-gradient(120deg, ' + cat.color + ' 0%, ' + cat.bgColor + ' 100%)'
          : 'linear-gradient(120deg, #FF6B35 0%, #FF9472 100%)';
        return {
          id: item.id,
          title: item.title || (t ? t.name : item.id),
          subtitle: item.subtitle || (t ? t.description : ''),
          icon: item.icon || (t ? t.icon : '📦'),
          path: item.path || (t ? t.path : ''),
          gradient: item.gradient || fallbackGrad
        };
      });
      self.setData({ featuredList: mapped });
      return true;
    }

    function tryLoad(url, isMirror) {
      wx.request({
        url: url,
        method: 'GET',
        timeout: 8000,
        success: function (res) {
          if (res && res.statusCode === 200 && applyRemote(res.data)) return;
          if (!isMirror) tryLoad(FEATURED_MIRROR, true); // 主源失败回落镜像
          // 镜像也失败：保留已设置的 image 随机默认
        },
        fail: function () {
          if (!isMirror) tryLoad(FEATURED_MIRROR, true);
        }
      });
    }

    tryLoad(FEATURED_PRIMARY, false);
  },

  /**
   * 读取「最近使用」并解析为工具对象
   */
  _loadRecent: function () {
    var ids = storage.getSync(RECENT_KEY, []);
    var list = [];
    var seen = {};
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var t = toolsData.getToolById(id);
      if (!t || seen[id] || this._flags[t.id] === false) continue;
      seen[id] = 1;
      var cat = toolsData.getCategoryById(t.category);
      list.push({
        id: t.id,
        name: t.name,
        icon: t.icon,
        path: t.path,
        bgColor: cat ? cat.bgColor : '#EEEEEE',
        color: cat ? cat.color : '#999999'
      });
    }
    this.setData({ recentTools: list });
  },

  /**
   * 记录最近使用（去重、置顶、限量）
   */
  _addRecent: function (toolId) {
    var ids = storage.getSync(RECENT_KEY, []);
    ids = ids.filter(function (x) { return x !== toolId; });
    ids.unshift(toolId);
    if (ids.length > RECENT_MAX) ids = ids.slice(0, RECENT_MAX);
    storage.setSync(RECENT_KEY, ids);
    this._loadRecent();
  },

  getVisibleTools: function (categoryId) {
    var app = getApp();
    var flags = this._flags || (app.globalData && app.globalData.featureFlags) || {};
    var raw = toolsData.getToolsByCategory(categoryId);
    var visible = raw.filter(function (t) { return flags[t.id] !== false; });
    var cat = toolsData.getCategoryById(categoryId);
    visible.forEach(function (t) {
      t.color = cat.color;
      t.bgColor = cat.bgColor;
    });
    return visible;
  },

  /**
   * 切换分类：更新列表并滚动定位到工具列表
   */
  onCategoryTap: function (e) {
    var index = e.currentTarget.dataset.index;
    var category = this.data.categoryList[index];
    var currentTools = this.getVisibleTools(category.id);

    this.setData({
      activeCategoryIndex: index,
      currentTools: currentTools,
      activeCategoryName: category.name,
      activeColor: category.color
    });

    try {
      wx.pageScrollTo({ selector: '#toolList', duration: 300 });
    } catch (err) {}
  },

  /**
   * 精选位点击：记录最近并打开
   */
  onFeaturedTap: function (e) {
    var id = e.currentTarget.dataset.id;
    var path = e.currentTarget.dataset.path;
    if (id) this._addRecent(id);
    if (path) wx.navigateTo({ url: path });
  },

  /**
   * 搜索输入
   */
  onSearchInput: function (e) {
    var searchText = e.detail.value.trim();
    this.setData({ searchText: searchText });

    if (!searchText) {
      this.setData({ searchResults: [] });
      return;
    }

    var keyword = searchText.toLowerCase();
    var app = getApp();
    var flags = this._flags || (app.globalData && app.globalData.featureFlags) || {};
    var allTools = toolsData.TOOLS.filter(function (t) { return flags[t.id] !== false; });
    var results = [];

    for (var i = 0; i < allTools.length; i++) {
      var tool = allTools[i];
      if (tool.name.toLowerCase().indexOf(keyword) !== -1 ||
          tool.description.toLowerCase().indexOf(keyword) !== -1) {
        var cat = toolsData.getCategoryById(tool.category);
        results.push({
          id: tool.id,
          name: tool.name,
          icon: tool.icon,
          description: tool.description,
          path: tool.path,
          categoryColor: cat ? cat.color : '#FF6B35',
          categoryBgColor: cat ? cat.bgColor : '#FFE5D9'
        });
      }
    }

    this.setData({ searchResults: results });
  },

  /**
   * 工具点击：记录最近并打开
   */
  onToolTap: function (e) {
    var toolId = e.currentTarget.dataset.id;
    var tool = toolsData.getToolById(toolId);
    if (tool) {
      this._addRecent(toolId);
      wx.navigateTo({ url: tool.path });
    }
  },

  /**
   * 清除搜索
   */
  clearSearch: function () {
    this.setData({ searchText: '', searchResults: [] });
  },

  applyFeatureFlags: function (flags) {
    if (!flags) return;
    this._flags = flags;
    var active = this.data.categoryList[this.data.activeCategoryIndex];
    if (!active) return;
    var currentTools = this.getVisibleTools(active.id);
    this.setData({ currentTools: currentTools });
    this._maybeLoadFeatured();
  },

  /**
   * 分享
   */
  onShareAppMessage: function () {
    return {
      title: '工具箱 - 实用小工具集合',
      path: '/pages/index/index'
    };
  }
});
