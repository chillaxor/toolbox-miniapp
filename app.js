App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('[App] onLaunch');
  },

  onShow: function () {
    console.log('[App] onShow');
  },

  onHide: function () {
    console.log('[App] onHide');
  },

  globalData: {
    systemInfo: null
  }
});
