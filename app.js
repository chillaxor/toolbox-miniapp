App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('[App] onLaunch');
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d9gm1qla9bebafa31',
        traceUser: true
      });
    }
    this.loadFeatureFlags();
    if (wx.setInnerAudioOption) {
      wx.setInnerAudioOption({
        obeyMuteSwitch: true,  // 核心：遵循 iOS 物理静音键，静音即静音
        mixWithOther: true,    // 不打断后台音乐
        speakerOn: true        // 走扬声器外放
      });
    }
  },


  loadFeatureFlags: function () {
    var self = this;
    var PRIMARY = 'https://gitee.com/b64882/qian_data/raw/master/feature-flags.json';
    var MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/feature-flags.json';

    var cached = null;
    try { cached = wx.getStorageSync('feature_flags'); } catch (e) {}

    function applyFlags(flags) {
      if (typeof flags !== 'object' || !flags || Array.isArray(flags)) flags = {};
      try { wx.setStorageSync('feature_flags', flags); } catch (e) {}
      self.globalData.featureFlags = flags;
      try {
        var pages = getCurrentPages() || [];
        pages.forEach(function (p) {
          try {
            if (p.getTabBar && p.getTabBar && p.getTabBar()) {
              var tb = p.getTabBar();
              if (tb.refreshFlags) tb.refreshFlags(flags);
            }
            if (p.applyFeatureFlags) p.applyFeatureFlags(flags);
          } catch (e) {}
        });
      } catch (e) {}
    }

    function tryLoad(url, isMirror) {
      wx.request({
        url: url,
        method: 'GET',
        timeout: 8000,
        success: function (res) {
          if (res && res.statusCode === 200 && res.data) {
            var data = res.data;
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch (e) { data = null; }
            }
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              applyFlags(data);
              return;
            }
          }
          // 主源没拿到有效 JSON：还有镜像就试镜像，否则回落缓存
          if (!isMirror) tryLoad(MIRROR, true);
          else if (cached) applyFlags(cached);
        },
        fail: function () {
          if (!isMirror) tryLoad(MIRROR, true);
          else if (cached) applyFlags(cached);
        }
      });
    }

    tryLoad(PRIMARY, false);
  },

  globalData: {
    systemInfo: null,
    featureFlags: {
      tanxiang: false,
      game2048: false,
      whoisspy: false,
      witchpoison: false,
      stacking: false,
      snake: false,
      snakebattle: false,
      gomoku: false,
      whackmole: false,
      commandreaction: false,
      drawguess: false,
      guessword: false,
      clueguess: false,
      friendship: false,
      pipeconnect: false,
      codeblock: false,
      numberbomb: false,
      dontpress: false,
      reverse: false,
      balancebeam: false,
      grabcolor: false,
      subtract: false,
      nim: false,
      leftright: false,
      splitball: false,
      grabnumber: false,
      useRemoteFeatured: false,
      paintwar:false
    }
  }
});
