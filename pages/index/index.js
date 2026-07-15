var toolsData = require('../../data/tools.js');
var storage = require('../../utils/storage.js');

Page({
  data: {
    searchText: '',
    searchResults: [],
    categoryList: [],
    activeCategoryIndex: 0,
    currentTools: []
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
  },

  /**
   * 初始化分类列表数据
   */
  initCategoryList: function () {
    var categories = toolsData.getCategoryList();
    var categoryList = categories.map(function (cat) {
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        bgColor: cat.bgColor,
        icon: cat.icon || ''
      };
    });
    
    // 设置分类图标映射
    var categoryIcons = {
      'life': '🏠',
      'date': '📅',
      'text': '📝',
      'image': '🖼️',
      'fun': '🎮'
    };
    
    categoryList.forEach(function(cat) {
      cat.icon = categoryIcons[cat.id] || '📦';
    });

    var currentTools = this.getVisibleTools(categoryList[0].id);

    this.setData({ 
      categoryList: categoryList,
      currentTools: currentTools
    });
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
   * 切换分类标签
   */
  onCategoryTap: function (e) {
    var index = e.currentTarget.dataset.index;
    var category = this.data.categoryList[index];
    var currentTools = this.getVisibleTools(category.id);

    this.setData({
      activeCategoryIndex: index,
      currentTools: currentTools
    });
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
   * 工具点击
   */
  onToolTap: function (e) {
    var toolId = e.currentTarget.dataset.id;
    var tool = toolsData.getToolById(toolId);
    if (tool) {
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
