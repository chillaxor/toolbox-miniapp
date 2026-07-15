Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#333333',
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '/assets/tabbar/home.png', selectedIcon: '/assets/tabbar/home_active.png' },
      { pagePath: '/pages/tanxiang/index', text: '檀香', icon: '/assets/tabbar/blessing.png', selectedIcon: '/assets/tabbar/blessing_active.png', flagKey: 'tanxiang' },
      { pagePath: '/pages/favorites/index', text: '收藏', icon: '/assets/tabbar/star.png', selectedIcon: '/assets/tabbar/star_active.png' },
      { pagePath: '/pages/mine/index', text: '我的', icon: '/assets/tabbar/person.png', selectedIcon: '/assets/tabbar/person_active.png' }
    ],
    flags: { tanxiang: false }
  },

  lifetimes: {
    attached: function () {
      this.refreshFlags();
    }
  },

  pageLifetimes: {
    show: function () {
      this.refreshFlags();
    }
  },

  methods: {
    refreshFlags: function (flags) {
      var f = flags
        || (getApp() && getApp().globalData && getApp().globalData.featureFlags)
        || wx.getStorageSync('feature_flags')
        || { tanxiang: false };
      this.setData({ flags: f });
    },

    switchTab: function (e) {
      var url = e.currentTarget.dataset.path;
      wx.switchTab({ url: url });
    }
  }
});
