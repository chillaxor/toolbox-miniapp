var storage = require('../../utils/storage.js');
var lingqianData = require('./lingqian_data.js');

// 给每条签加上levelClass（用于颜色区分）
var LINGQIAN_LIST = lingqianData.LINGQIAN_DATA.map(function (item) {
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

var BLESSINGS = [
  '一炷清香，心诚则灵',
  '香烟袅袅，福报绵绵',
  '静心一炷香，烦恼皆消散',
  '虔诚供奉，阖家平安',
  '香云供养，十方三世',
  '一炷清香达天庭，所求皆如愿',
  '心香一炷，功德无量',
  '焚香祈福，诸事顺遂',
  '清香一炷，寄托哀思',
  '香烟升腾，好运降临'
];

var LEVELS = [
  { name: '初结善缘', min: 0 },
  { name: '诚心向佛', min: 50 },
  { name: '虔诚供奉', min: 200 },
  { name: '香火不断', min: 500 },
  { name: '功德深厚', min: 1000 },
  { name: '香音王菩萨', min: 5000 },
  { name: '万缘归一', min: 10000 }
];

var INCENSE_IMAGES = [
  '../../assets/blessing/incense_1.png',
  '../../assets/blessing/incense_2.png',
  '../../assets/blessing/incense_3.png',
  '../../assets/blessing/incense_4.png',
  '../../assets/blessing/incense_5.png',
  '../../assets/blessing/incense_6.png'
  // '../../assets/blessing/incense_7.png',
  // '../../assets/blessing/incense_8.png',
  // '../../assets/blessing/incense_9.png',
  // '../../assets/blessing/incense_10.png',
  // '../../assets/blessing/incense_11.png',
  // '../../assets/blessing/incense_12.png',
  // '../../assets/blessing/incense_13.png',
  // '../../assets/blessing/incense_14.png',
  // '../../assets/blessing/incense_15.png',
  // '../../assets/blessing/incense_16.png',
  // '../../assets/blessing/incense_17.png',
  // '../../assets/blessing/incense_18.png',
  // '../../assets/blessing/incense_19.png',
  // '../../assets/blessing/incense_20.png',
  // '../../assets/blessing/incense_21.png',
  // '../../assets/blessing/incense_22.png',
  // '../../assets/blessing/incense_23.png',
  // '../../assets/blessing/incense_24.png'
];

var INCENSE_NAMES = [
  '道香', '德香', '经香', '清香',
  '檀香', '沉香'
  //  '龙香', '凤香',
  // '菩提香', '莲花香', '甘露香', '紫金香',
  // '琉璃香', '琥珀香', '翡翠香', '珊瑚香',
  // '灵芝香', '仙草香', '松香', '柏香',
  // '桂香', '梅香', '竹香', '菊香'
];

var BURN_DURATION = 7200000; // 2小时燃烧时间（毫秒）
var BURN_KEY = 'blessing_burn_start_time';

Page({
  data: {
    totalCount: 0,
    todayCount: 0,
    incenseImages: INCENSE_IMAGES,
    incenseNames: INCENSE_NAMES,
    // 当前香状态
    currentIncense: null,  // { id, imageIndex, startTime } or null
    isBurning: false,      // 香是否在燃烧
    burnRemainText: '',    // 燃烧剩余时间显示 "XX:XX:XX"
    selectedType: 0,       // 当前选中的香型索引
    showTypePicker: false, // 是否显示香型选择器
    // 佛祖签
    showLingqian: false,       // 是否显示签列表
    lingqianList: LINGQIAN_LIST, // 签列表数据
    showLingqianDetail: false, // 是否显示签详情
    selectedLingqian: {},      // 当前选中的签
    blessing: '',
    showBlessing: false,
    levelName: '初结善缘',
    levelProgress: 0,
    nextLevelRemain: 50
  },

  burnTimer: null,
  nextIncenseId: 1,

  onLoad: function () {
    var total = storage.getSync('blessing_incense_total', 0);
    var todayKey = 'blessing_incense_today_' + this._getTodayStr();
    var today = storage.getSync(todayKey, 0);
    this.setData({
      totalCount: total,
      todayCount: today
    });
    this._updateLevel(total);
    this._checkBurn();
  },

  onShow: function () {
    this._checkBurn();
    if (this.data.isBurning && !this.burnTimer) {
      this._startBurnTimer();
    }
  },

  onUnload: function () {
    this._stopBurnTimer();
  },

  onHide: function () {
    this._stopBurnTimer();
  },

  _getTodayStr: function () {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },

  // 检查燃烧状态（页面加载/显示时恢复）
  _checkBurn: function () {
    var burnStart = storage.getSync(BURN_KEY, 0);
    var savedImageIndex = storage.getSync('blessing_current_image_index', 0);
    if (burnStart === 0) {
      // 从未插香或已烧完
      this.setData({
        isBurning: false,
        currentIncense: null,
        burnRemainText: ''
      });
      return;
    }
    var now = Date.now();
    var elapsed = now - burnStart;
    if (elapsed >= BURN_DURATION) {
      // 香已烧完，清除状态
      storage.setSync(BURN_KEY, 0);
      this.setData({
        isBurning: false,
        currentIncense: null,
        burnRemainText: ''
      });
    } else {
      // 还在燃烧，恢复状态
      var remainSec = Math.ceil((BURN_DURATION - elapsed) / 1000);
      var incense = {
        id: this.nextIncenseId,
        imageIndex: savedImageIndex,
        startTime: burnStart
      };
      this.setData({
        isBurning: true,
        currentIncense: incense,
        selectedType: savedImageIndex,
        burnRemainText: this._formatTime(remainSec)
      });
      this._startBurnTimer();
    }
  },

  // 格式化时间
  _formatTime: function (sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var hStr = h < 10 ? '0' + h : '' + h;
    var mStr = m < 10 ? '0' + m : '' + m;
    var sStr = s < 10 ? '0' + s : '' + s;
    return hStr + ':' + mStr + ':' + sStr;
  },

  // 显示香型选择器
  onShowTypePicker: function () {
    if (this.data.isBurning) return;
    this.setData({ showTypePicker: true });
  },

  // 关闭香型选择器
  onHideTypePicker: function () {
    this.setData({ showTypePicker: false });
  },

  // 显示签列表
  onShowLingqian: function () {
    this.setData({ showLingqian: true });
  },

  // 关闭签列表
  onHideLingqian: function () {
    this.setData({ showLingqian: false });
  },

  // 选择签，显示详情
  onSelectLingqian: function (e) {
    var id = e.currentTarget.dataset.id;
    var item = null;
    for (var i = 0; i < LINGQIAN_LIST.length; i++) {
      if (LINGQIAN_LIST[i].id === id) {
        item = LINGQIAN_LIST[i];
        break;
      }
    }
    if (!item) return;
    this.setData({
      showLingqian: false,
      showLingqianDetail: true,
      selectedLingqian: item
    });
  },

  // 关闭签详情
  onHideLingqianDetail: function () {
    this.setData({ showLingqianDetail: false });
  },

  // 选择香型
  onSelectType: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({
      selectedType: idx,
      showTypePicker: false
    });
    // 选择后直接插香
    this._doInsertIncense(idx);
  },

  // 插香按钮点击
  onInsertIncense: function () {
    if (this.data.isBurning) return;
    // 显示香型选择器
    this.setData({ showTypePicker: true });
  },

  // 实际插香逻辑
  _doInsertIncense: function (imageIndex) {
    var self = this;

    var startTime = Date.now();
    var newIncense = {
      id: this.nextIncenseId++,
      imageIndex: imageIndex,
      startTime: startTime
    };

    var newTotal = this.data.totalCount + 1;
    var newToday = this.data.todayCount + 1;
    var todayKey = 'blessing_incense_today_' + this._getTodayStr();

    storage.setSync('blessing_incense_total', newTotal);
    storage.setSync(todayKey, newToday);
    // 记录燃烧起始时间和香型（用于页面恢复）
    storage.setSync(BURN_KEY, startTime);
    storage.setSync('blessing_current_image_index', imageIndex);

    this._randomBlessing();

    var burnRemainSec = Math.ceil(BURN_DURATION / 1000);
    this.setData({
      currentIncense: newIncense,
      isBurning: true,
      selectedType: imageIndex,
      totalCount: newTotal,
      todayCount: newToday,
      showBlessing: true,
      burnRemainText: this._formatTime(burnRemainSec)
    });

    try { wx.vibrateShort({ type: 'light' }); } catch (e) {}

    this._startBurnTimer();

    setTimeout(function () {
      if (self.data.showBlessing) {
        self.setData({ showBlessing: false });
      }
    }, 4000);

    this._updateLevel(newTotal);
  },

  // 燃烧定时器（每秒更新倒计时）
  _startBurnTimer: function () {
    var self = this;
    this._stopBurnTimer();
    this.burnTimer = setInterval(function () {
      self._tickBurn();
    }, 1000);
  },

  _stopBurnTimer: function () {
    if (this.burnTimer) {
      clearInterval(this.burnTimer);
      this.burnTimer = null;
    }
  },

  _tickBurn: function () {
    var incense = this.data.currentIncense;
    if (!incense) {
      this._stopBurnTimer();
      return;
    }

    var now = Date.now();
    var elapsed = now - incense.startTime;
    var remainSec = Math.ceil((BURN_DURATION - elapsed) / 1000);

    if (remainSec <= 0) {
      // 香烧完了，消失
      this._stopBurnTimer();
      storage.setSync(BURN_KEY, 0);
      this.setData({
        currentIncense: null,
        isBurning: false,
        burnRemainText: ''
      });
    } else {
      // 更新倒计时
      this.setData({
        burnRemainText: this._formatTime(remainSec)
      });
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

  onShareAppMessage: function () {
    return {
      title: '我已焚香祈福' + this.data.totalCount + '次，快来禅香祈福吧！',
      path: '/pages/blessing/index'
    };
  },

  onShareTimeline: function () {
    return {
      title: '禅香 - 一炷清香，心诚则灵'
    };
  }
});
