var storage = require('../../utils/storage.js');

Page({
  data: {
    totalUsage: 0,
    favoriteCount: 0,
    cacheSize: ''
  },

  onLoad: function () { this.loadStats(); },
  onShow: function () { this.loadStats(); },

  loadStats: function () {
    var history = storage.getHistory();
    var favorites = storage.getFavorites();

    // 估算缓存大小
    var cacheSize = '0 KB';
    try {
      var res = wx.getStorageInfoSync();
      if (res.currentSize < 1024) {
        cacheSize = res.currentSize + ' KB';
      } else {
        cacheSize = (res.currentSize / 1024).toFixed(1) + ' MB';
      }
    } catch (e) {}

    this.setData({
      totalUsage: history.length,
      favoriteCount: favorites.length,
      cacheSize: cacheSize
    });
  },

  onClearCache: function () {
    var self = this;
    wx.showModal({
      title: '清除缓存',
      content: '将清除收藏、历史记录等所有本地数据，确定继续吗？',
      success: function (res) {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({ title: '缓存已清除', icon: 'success' });
            self.loadStats();
          } catch (e) {
            wx.showToast({ title: '清除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onShareAppMessage: function () { return { title: '工具箱小程序', path: '/pages/index/index' }; }
});
