App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('[App] onLaunch');
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d9gm1qla9bebafa31',
        traceUser: true
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
        showCancel: true,
        cancelText: '知道了',
        confirmText: '去查看',
        confirmColor: '#667eea',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/tools/cert-expiry/index' });
          }
        }
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
    systemInfo: null
  }
});
