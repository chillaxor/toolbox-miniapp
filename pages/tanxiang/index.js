var storage = require('../../utils/storage.js');
var LINGQIAN_LIST = [];

// 通过云函数中转获取签文数据
function fetchLingqianData() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getLingqianData', // 云函数名称，需在云开发控制台创建对应云函数
      success: (res) => {
        // 给每条签加上 levelClass（用于颜色区分）
        LINGQIAN_LIST = res.result.LINGQIAN_DATA.map(function (item) {
          var cls = '';
          if (item.level === '上上签' || item.level === '大吉签') cls = 'level-great';
          else if (item.level === '上签' || item.level === '中上签') cls = 'level-good';
          else if (item.level === '中平签' || item.level === '中签') cls = 'level-mid';
          else if (item.level === '中下签' || item.level === '下签') cls = 'level-low';
          else if (item.level === '下下签') cls = 'level-bad';
          return {
            id: item.id,
            story: item.story,
            level: item.level,
            levelClass: cls,
            qianShi: item.qianShi,
            shiJie: item.shiJie,
            jieQian: item.jieQian,
            img: item.img
          };
        });
        resolve(LINGQIAN_LIST);
      },
      fail: (err) => {
        console.error('调用云函数获取签文数据失败:', err);
        reject(err);
      }
    });
  });
}

// 香型配置（3种，与实际素材对应；incense_1/2/3.png 本身是整张香炉图）
var INCENSE_TYPES = [
  { name: '道香', desc: '道法自然，清静无为', image: '../../assets/blessing/incense_1.png' },
  { name: '德香', desc: '厚德载物，积善成德', image: '../../assets/blessing/incense_2.png' },
  { name: '经香', desc: '诵经祈福，智慧增长', image: '../../assets/blessing/incense_3.png' }
];

// 插香后的随机祝福语
var BLESSINGS = [
  '一炷清香，心诚则灵',
  '香烟袅袅，福报绵绵',
  '心香一瓣，诸事顺遂',
  '檀烟绕梁，平安吉祥',
  '焚香祈愿，所愿皆成'
];

var BURN_DURATION = 2 * 60 * 60 * 1000; // 燃烧时长：2 小时

function dateStr(d) {
  d = d || new Date();
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

function formatRemain(ms) {
  var totalSec = Math.ceil(ms / 1000);
  var h = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  if (h > 0) return h + '时' + ('0' + m).slice(-2) + '分' + ('0' + s).slice(-2) + '秒';
  if (m > 0) return m + '分' + ('0' + s).slice(-2) + '秒';
  return s + '秒';
}

Page({
  data: {
    // 统计数据
    totalInsert: 0,
    todayInsert: 0,
    totalMerit: 0,
    todayMerit: 0,
    // 木鱼
    meritStrike: false,
    meritFloats: [],
    // 香炉（单柱模式，与 blessing 一致）
    burnerImage: INCENSE_TYPES[0].image, // 空状态淡显的香炉图
    isBurning: false,
    burningImage: '',
    burnRemainText: '',
    selectedType: 0,
    // 香型选择器
    showIncensePicker: false,
    incenseTypes: INCENSE_TYPES,
    // 佛祖签
    showLingqian: false,
    lingqianList: LINGQIAN_LIST,
    selectedQian: null
  },

  burnTimer: null,

  onLoad: function () {
    this.restoreStats();
    this.restoreBurning();
    // 加载签文数据
    this.loadLingqianData();
  },

  onShow: function () {
    this.restoreBurning();
  },

  onHide: function () {
    this.clearTimer();
  },

  onUnload: function () {
    this.clearTimer();
  },

  // ===== 统计数据 =====
  restoreStats: function () {
    var today = dateStr();
    var totalInsert = storage.getSync('tanxiang_total_insert') || 0;
    var todayInsertDate = storage.getSync('tanxiang_today_insert_date');
    var todayInsert = todayInsertDate === today ? (storage.getSync('tanxiang_today_insert') || 0) : 0;
    var totalMerit = storage.getSync('tanxiang_total_merit') || 0;
    var todayMeritDate = storage.getSync('tanxiang_today_merit_date');
    var todayMerit = todayMeritDate === today ? (storage.getSync('tanxiang_today_merit') || 0) : 0;
    this.setData({
      totalInsert: totalInsert,
      todayInsert: todayInsert,
      totalMerit: totalMerit,
      todayMerit: todayMerit
    });
  },

  // ===== 木鱼功德 =====
  tapWoodfish: function () {
    var today = dateStr();
    var totalMerit = this.data.totalMerit + 1;
    var todayMerit = this.data.todayMerit + 1;
    storage.setSync('tanxiang_total_merit', totalMerit);
    storage.setSync('tanxiang_today_merit', todayMerit);
    storage.setSync('tanxiang_today_merit_date', today);

    var that = this;
    this.setData({ meritStrike: true, totalMerit: totalMerit, todayMerit: todayMerit });
    setTimeout(function () { that.setData({ meritStrike: false }); }, 150);

    var fid = Date.now();
    var floatItem = { id: fid, left: 38 + Math.random() * 24 };
    this.setData({ meritFloats: this.data.meritFloats.concat([floatItem]) });
    setTimeout(function () {
      that.setData({ meritFloats: that.data.meritFloats.filter(function (f) { return f.id !== fid; }) });
    }, 1000);

    wx.vibrateShort({ type: 'light' });
  },

  // ===== 插香 =====
  openIncensePicker: function () {
    if (this.data.isBurning) return;
    this.setData({ showIncensePicker: true });
  },
  closeIncensePicker: function () {
    this.setData({ showIncensePicker: false });
  },
  noop: function () {},

  selectIncense: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.insertIncense(idx);
    this.setData({ showIncensePicker: false });
  },

  insertIncense: function (idx) {
    if (this.data.isBurning) return;
    var type = INCENSE_TYPES[idx];
    var startTime = Date.now();
    var today = dateStr();

    var totalInsert = this.data.totalInsert + 1;
    var todayInsert = this.data.todayInsert + 1;
    storage.setSync('tanxiang_total_insert', totalInsert);
    storage.setSync('tanxiang_today_insert', todayInsert);
    storage.setSync('tanxiang_today_insert_date', today);
    storage.setSync('tanxiang_burn_start', startTime);
    storage.setSync('tanxiang_burn_type', idx);

    this.setData({
      isBurning: true,
      selectedType: idx,
      burningImage: type.image,
      burnerImage: type.image,
      totalInsert: totalInsert,
      todayInsert: todayInsert,
      burnRemainText: formatRemain(BURN_DURATION)
    });
    this.startTimer();
    this.showBlessingToast();
  },

  showBlessingToast: function () {
    var msg = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
    wx.showToast({ title: msg, icon: 'none', duration: 1500 });
  },

  restoreBurning: function () {
    var start = storage.getSync('tanxiang_burn_start', 0);
    var idx = storage.getSync('tanxiang_burn_type', 0);
    var typeImage = (INCENSE_TYPES[idx] && INCENSE_TYPES[idx].image) || INCENSE_TYPES[0].image;
    if (!start) {
      this.setData({ isBurning: false, burningImage: '', burnerImage: typeImage });
      return;
    }
    var remain = BURN_DURATION - (Date.now() - start);
    if (remain <= 0) {
      storage.setSync('tanxiang_burn_start', 0);
      this.setData({ isBurning: false, burningImage: '', burnerImage: typeImage });
    } else {
      this.setData({
        isBurning: true,
        selectedType: idx,
        burningImage: typeImage,
        burnerImage: typeImage,
        burnRemainText: formatRemain(remain)
      });
      this.startTimer();
    }
  },

  startTimer: function () {
    this.clearTimer();
    var that = this;
    this.burnTimer = setInterval(function () {
      that.tickBurn();
    }, 1000);
  },

  tickBurn: function () {
    var start = storage.getSync('tanxiang_burn_start', 0);
    if (!start) { this.clearTimer(); return; }
    var remain = BURN_DURATION - (Date.now() - start);
    if (remain <= 0) {
      var idx = storage.getSync('tanxiang_burn_type', 0);
      var typeImage = (INCENSE_TYPES[idx] && INCENSE_TYPES[idx].image) || INCENSE_TYPES[0].image;
      storage.setSync('tanxiang_burn_start', 0);
      this.clearTimer();
      this.setData({ isBurning: false, burningImage: '', burnRemainText: '', burnerImage: typeImage });
    } else {
      this.setData({ burnRemainText: formatRemain(remain) });
    }
  },

  clearTimer: function () {
    if (this.burnTimer) {
      clearInterval(this.burnTimer);
      this.burnTimer = null;
    }
  },

  // ===== 佛祖签 =====
  openLingqian: function () {
    this.setData({ showLingqian: true });
  },
  closeLingqian: function () {
    this.setData({ showLingqian: false, selectedQian: null });
  },
  selectQian: function (e) {
    var id = e.currentTarget.dataset.id;
    var qian = null;
    for (var i = 0; i < LINGQIAN_LIST.length; i++) {
      if (LINGQIAN_LIST[i].id === id) { qian = LINGQIAN_LIST[i]; break; }
    }
    this.setData({ selectedQian: qian });
  },
  backToQianList: function () {
    this.setData({ selectedQian: null });
  },

  // ===== 签文数据加载 =====
  loadLingqianData: function () {
    var that = this;
    fetchLingqianData().then(function (list) {
      that.setData({ lingqianList: list });
    }).catch(function (err) {
      console.error('加载签文数据失败:', err);
      wx.showToast({ title: '加载签文失败', icon: 'none' });
    });
  },

  // ===== 分享 =====
  onShareAppMessage: function () {
    return { title: '檀香一炷，心静自然凉', path: '/pages/tanxiang/index' };
  },
  onShareTimeline: function () {
    return { title: '檀香一炷，心静自然凉', query: '' };
  }
});