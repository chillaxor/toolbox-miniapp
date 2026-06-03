var storage = require('../../../utils/storage.js');

var BLESSINGS = [
  '功德+1，平安喜乐',
  '敲一下木鱼，烦恼远离',
  '今日功德，明日福报',
  '心诚则灵，功德无量',
  '善念一动，福泽绵长',
  '木鱼声声，诸事顺遂',
  '一心向善，万事如意',
  '功德圆满，心想事成',
  '慈悲为怀，福慧双修',
  '日行一善，积少成多',
  '心存善念，好运自来',
  '虔诚祈福，阖家平安',
  '静心敲击，烦恼皆消',
  '广种福田，功德无量',
  '修心养性，岁月静好'
];

var LEVELS = [
  { name: '初入佛门', min: 0 },
  { name: '虔诚弟子', min: 100 },
  { name: '修行居士', min: 500 },
  { name: '慈悲菩萨', min: 1000 },
  { name: '得道高僧', min: 5000 },
  { name: '功德圆满', min: 10000 },
  { name: '佛陀再世', min: 50000 },
  { name: '功德无量', min: 100000 }
];

Page({
  data: {
    meritCount: 0,
    todayCount: 0,
    isTapping: false,
    showText: false,
    textLeft: 0,
    textTop: 0,
    comboCount: 0,
    isAutoTapping: false,
    blessing: BLESSINGS[0],
    levelName: '初入佛门',
    levelProgress: 0,
    nextLevelRemain: 100,
    isFavorite: false
  },

  comboTimer: null,
  lastTapTime: 0,
  autoTimer: null,

  onLoad: function () {
    var total = storage.get('woodfish_total', 0);
    var todayKey = 'woodfish_today_' + this._getTodayStr();
    var today = storage.get(todayKey, 0);
    this.setData({
      meritCount: total,
      todayCount: today,
      isFavorite: storage.get('fav_woodfish', false)
    });
    this._updateLevel(total);
    this._randomBlessing();
  },

  onUnload: function () {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
    }
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
  },

  _getTodayStr: function () {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },

  onTap: function () {
    var now = Date.now();
    var newTotal = this.data.meritCount + 1;
    var newToday = this.data.todayCount + 1;

    // combo
    if (now - this.lastTapTime < 800) {
      this.setData({ comboCount: this.data.comboCount + 1 });
    } else {
      this.setData({ comboCount: 1 });
    }
    this.lastTapTime = now;

    // reset combo timer
    if (this.comboTimer) clearTimeout(this.comboTimer);
    var self = this;
    this.comboTimer = setTimeout(function () {
      self.setData({ comboCount: 0 });
    }, 1000);

    // random position for +1 text
    var left = Math.floor(Math.random() * 200 - 100);
    var top = Math.floor(Math.random() * 100 - 150);

    this.setData({
      meritCount: newTotal,
      todayCount: newToday,
      isTapping: true,
      showText: true,
      textLeft: left,
      textTop: top
    });

    // vibrate
    try { wx.vibrateShort({ type: 'light' }); } catch (e) {}

    // sound effect placeholder (using system sound)

    var self2 = this;
    setTimeout(function () {
      self2.setData({ isTapping: false, showText: false });
    }, 200);

    // save
    storage.set('woodfish_total', newTotal);
    storage.set('woodfish_today_' + this._getTodayStr(), newToday);

    this._updateLevel(newTotal);
    if (newTotal % 10 === 0) {
      this._randomBlessing();
    }
  },

  _randomBlessing: function () {
    var idx = Math.floor(Math.random() * BLESSINGS.length);
    this.setData({ blessing: BLESSINGS[idx] });
  },

  _updateLevel: function (total) {
    var currentLevel = LEVELS[0];
    var nextLevel = LEVELS[1];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (total >= LEVELS[i].min) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }
    var progress = 0;
    var remain = 0;
    if (nextLevel) {
      var range = nextLevel.min - currentLevel.min;
      var passed = total - currentLevel.min;
      progress = Math.floor((passed / range) * 100);
      remain = nextLevel.min - total;
    } else {
      progress = 100;
      remain = 0;
    }
    this.setData({
      levelName: currentLevel.name,
      levelProgress: progress,
      nextLevelRemain: remain
    });
  },

  onReset: function () {
    var self = this;
    wx.showModal({
      title: '重置功德',
      content: '确定要重置所有功德吗？此操作不可撤销。',
      success: function (res) {
        if (res.confirm) {
          self.setData({ meritCount: 0, todayCount: 0, comboCount: 0 });
          storage.set('woodfish_total', 0);
          storage.set('woodfish_today_' + self._getTodayStr(), 0);
          self._updateLevel(0);
          wx.showToast({ title: '功德已重置', icon: 'none' });
        }
      }
    });
  },

  onAutoTap: function () {
    if (this.data.isAutoTapping) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
      this.setData({ isAutoTapping: false });
    } else {
      var self = this;
      this.setData({ isAutoTapping: true });
      this.autoTimer = setInterval(function () {
        self.onTap();
      }, 600);
    }
  },

  onShare: function () {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  },

  onShareAppMessage: function () {
    return {
      title: '我已积累' + this.data.meritCount + '功德，快来敲木鱼积功德吧！',
      path: '/pages/tools/woodfish/index'
    };
  },

  onShareTimeline: function () {
    return {
      title: '电子木鱼 - 敲一敲，功德+1，烦恼-1'
    };
  },

  toggleFavorite: function () {
    var newVal = !this.data.isFavorite;
    this.setData({ isFavorite: newVal });
    storage.set('fav_woodfish', newVal);
    wx.showToast({ title: newVal ? '已收藏' : '已取消收藏', icon: 'none' });
  }
});
