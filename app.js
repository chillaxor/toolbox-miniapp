App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('[App] onLaunch');
    // 初始化云开发环境（仅其他云函数需要；远程开关已改用 wx.request，不再依赖云）
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d9gm1qla9bebafa31',
        traceUser: true
      });
    }
    this.loadFeatureFlags();
    // 全局音频选项：尊重手机静音键（静音时木鱼/木槌等音效不发声，符合预期）
    // 必须在最早（onLaunch）设置，对全局 InnerAudioContext 生效
    if (wx.setInnerAudioOption) {
      wx.setInnerAudioOption({
        obeyMuteSwitch: true,  // 核心：遵循 iOS 物理静音键，静音即静音
        mixWithOther: true,    // 不打断后台音乐
        speakerOn: true        // 走扬声器外放
      });
    }
  },

  onShow: function () {
    console.log('[App] onShow');
    this.checkCertExpiry();
  },

  onHide: function () {
    console.log('[App] onHide');
  },


  loadFeatureFlags: function () {
    var self = this;
    // 主源：gitee raw（会 302 跳 CDN）；镜像：jsDelivr 直出，作为回退
    var PRIMARY = 'https://gitee.com/b64882/qian_data/raw/master/feature-flags.json';
    var MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/feature-flags.json';

    // 上次成功的缓存，网络全失败时兜底，避免开关整体熄灭
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

  /**
   * 检查证件有效期，到期/过期弹窗提醒
   * 每天最多提醒一次
   */
  checkCertExpiry: function () {
    try {
      var list = wx.getStorageSync('cert_expiry_list');
      if (!list || !list.length) return;

      // 获取提醒设置，默认30天
      var remindDays = wx.getStorageSync('cert_remind_days') || 30;
      // 检查今天是否已提醒过
      var lastRemindDate = wx.getStorageSync('cert_last_remind_date') || '';
      var today = new Date();
      var todayStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      if (lastRemindDate === todayStr) return;

      today.setHours(0, 0, 0, 0);
      var expired = [];
      var warning = [];

      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item.expireDate) continue;
        var expireDate = new Date(item.expireDate);
        expireDate.setHours(0, 0, 0, 0);
        var diffDays = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        var typeName = item.customType || this.getTypeName(item.type);
        var display = (typeName + (item.name ? '（' + item.name + '）' : ''));

        if (diffDays < 0) {
          expired.push(display + ' 已过期' + Math.abs(diffDays) + '天');
        } else if (diffDays <= remindDays) {
          warning.push(display + (diffDays === 0 ? ' 今天到期' : ' 还剩' + diffDays + '天'));
        }
      }

      if (expired.length === 0 && warning.length === 0) return;

      // 记录今天已提醒
      wx.setStorageSync('cert_last_remind_date', todayStr);

      var lines = [];
      if (expired.length > 0) {
        lines.push('🔴 已过期：');
        lines = lines.concat(expired);
      }
      if (warning.length > 0) {
        lines.push('');
        lines.push('⚠️ 即将过期：');
        lines = lines.concat(warning);
      }

      wx.showModal({
        title: '🪪 证件到期提醒',
        content: lines.join('\n'),
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#667eea'
      });
    } catch (e) {
      console.error('[App] checkCertExpiry error:', e);
    }
  },

  getTypeName: function (type) {
    var map = {
      id_card: '身份证', passport: '护照', driver: '驾驶证',
      residence: '居住证', vehicle: '行驶证', business: '营业执照',
      house: '房产证', custom: '自定义证件'
    };
    return map[type] || type;
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
      snakebattle: true,
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
      splitball: false
    }
  }
});
