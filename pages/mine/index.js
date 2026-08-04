var storage = require('../../utils/storage.js');

Page({
  data: {
    totalUsage: 0,
    favoriteCount: 0,
    cacheSize: '',
    homepageV2: true
  },

  onLoad: function () {
    var stored;
    try { stored = wx.getStorageSync('homepage_v2'); } catch (e) {}
    if (typeof stored === 'boolean') this.data.homepageV2 = stored;
    this.loadStats();
  },
  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    var stored;
    try { stored = wx.getStorageSync('homepage_v2'); } catch (e) {}
    if (typeof stored === 'boolean') this.setData({ homepageV2: stored });
    this.loadStats();
  },

  onToggleHomeV2: function (e) {
    var val = e.detail.value;
    try { wx.setStorageSync('homepage_v2', val); } catch (err) {}
    var app = getApp();
    if (app.globalData && app.globalData.featureFlags) {
      app.globalData.featureFlags.homepageV2 = val;
    }
    this.setData({ homepageV2: val });
    wx.showToast({ title: val ? '已切新版首页' : '已切旧版首页', icon: 'none' });
  },

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

  goHistory: function () {
    wx.navigateTo({ url: '/pages/history/index' });
  },

  goFavorites: function () {
    wx.switchTab({ url: '/pages/favorites/index' });
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
