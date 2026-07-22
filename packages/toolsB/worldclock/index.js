var clockUtil = require('../../../utils/worldclock.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    watchedCities: [],
    allCities: [],
    searchKeyword: '',
    searchResult: [],
    showAddPanel: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.loadWatchedCities();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onReady: function () {
    var self = this;
    this._timer = setInterval(function () {
      self.refreshTimes();
    }, 1000);
  },

  onUnload: function () {
    if (this._timer) clearInterval(this._timer);
  },

  onHide: function () {
    if (this._timer) clearInterval(this._timer);
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('worldclock') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('worldclock');
    this.setData({ isFavorite: fav });
  },

  loadWatchedCities: function () {
    var watched = [];
    try {
      watched = wx.getStorageSync('toolbox_worldclock_cities') || [];
    } catch (e) {}
    if (watched.length === 0) {
      watched = clockUtil.DEFAULT_WATCHED.slice();
    }
    this._watchedIds = watched;
    this.refreshTimes();
  },

  refreshTimes: function () {
    var times = clockUtil.getWatchedTimes(this._watchedIds);
    this.setData({ watchedCities: times });
  },

  onAddCity: function () {
    var allCities = clockUtil.getAllCities();
    this.setData({
      showAddPanel: true,
      allCities: allCities,
      searchResult: allCities,
      searchKeyword: ''
    });
  },

  onCloseAdd: function () {
    this.setData({ showAddPanel: false });
  },

  onSearchInput: function (e) {
    var keyword = e.detail.value;
    var result = clockUtil.searchCity(keyword);
    this.setData({
      searchKeyword: keyword,
      searchResult: result
    });
  },

  onSelectCity: function (e) {
    var cityId = e.currentTarget.dataset.id;
    if (this._watchedIds.indexOf(cityId) >= 0) {
      wx.showToast({ title: '已添加该城市', icon: 'none' });
      return;
    }
    this._watchedIds.push(cityId);
    wx.setStorageSync('toolbox_worldclock_cities', this._watchedIds);
    this.refreshTimes();
    this.setData({ showAddPanel: false });

    storage.addHistory({
      toolId: 'worldclock',
      toolName: '世界时钟',
      category: 'date',
      summary: '查看' + this._watchedIds.length + '个城市时间',
      timestamp: Date.now()
    });
  },

  onRemoveCity: function (e) {
    var cityId = e.currentTarget.dataset.id;
    var idx = this._watchedIds.indexOf(cityId);
    if (idx >= 0) {
      this._watchedIds.splice(idx, 1);
      wx.setStorageSync('toolbox_worldclock_cities', this._watchedIds);
      this.refreshTimes();
    }
  },

  onShareAppMessage: function () {
    return {
      title: '世界时钟 - 工具箱',
      path: '/packages/toolsB/worldclock/index'
    };
  }
});
