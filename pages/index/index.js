var toolsData = require('../../data/tools.js');
var storage = require('../../utils/storage.js');

Page({
  data: {
    searchText: '',
    searchResults: [],
    categoryList: []
  },

  onLoad: function () {
    this.initCategoryList();
  },

  onShow: function () {
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
        tools: toolsData.getToolsByCategory(cat.id)
      };
    });
    this.setData({ categoryList: categoryList });
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
