var storage = require('../../utils/storage.js');
var toolsData = require('../../data/tools.js');

Page({
  data: {
    favorites: [],
    categories: [],
    isEmpty: false
  },

  onLoad: function () {
    this.loadFavorites();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadFavorites();
  },

  loadFavorites: function () {
    var favIds = storage.getFavorites();
    var categories = toolsData.CATEGORIES;
    var categoryList = [];

    if (favIds.length === 0) {
      this.setData({ isEmpty: true, categories: [] });
      return;
    }

    this.setData({ isEmpty: false });

    // 按分类分组
    var catKeys = Object.keys(categories);
    for (var i = 0; i < catKeys.length; i++) {
      var cat = categories[catKeys[i]];
      var tools = [];
      for (var j = 0; j < favIds.length; j++) {
        var tool = toolsData.getToolById(favIds[j]);
        if (tool && tool.category === cat.id) {
          tools.push(tool);
        }
      }
      if (tools.length > 0) {
        categoryList.push({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          bgColor: cat.bgColor,
          tools: tools
        });
      }
    }

    this.setData({ categories: categoryList });
  },

  onToolTap: function (e) {
    var path = e.currentTarget.dataset.path;
    wx.navigateTo({ url: path });
  },

  onShareAppMessage: function () {
    return { title: '我的收藏 - 工具箱', path: '/pages/favorites/index' };
  }
});
