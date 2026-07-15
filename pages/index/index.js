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
    this.initCategoryList();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 每次显示时刷新（收藏状态可能变化）
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

    var currentTools = toolsData.getToolsByCategory(categoryList[0].id);
    var category = categoryList[0];
    currentTools.forEach(function(tool) {
      tool.color = category.color;
      tool.bgColor = category.bgColor;
    });

    this.setData({ 
      categoryList: categoryList,
      currentTools: currentTools
    });
  },

  /**
   * 切换分类标签
   */
  onCategoryTap: function (e) {
    var index = e.currentTarget.dataset.index;
    var category = this.data.categoryList[index];
    var currentTools = toolsData.getToolsByCategory(category.id);
    
    currentTools.forEach(function(tool) {
      tool.color = category.color;
      tool.bgColor = category.bgColor;
    });

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
    var allTools = toolsData.TOOLS;
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
