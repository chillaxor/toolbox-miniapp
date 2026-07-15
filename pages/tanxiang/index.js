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

// 香型图片分两部分：
// 1) 1~3 写死，使用代码内置的本地图片（assets/blessing/incense_1~3.png），永远可用
// 2) 4~24 从 Gitee raw 仓库拉取（图片后续上传到 qian_data 仓库 master 分支）
//    运行时逐个校验可用性，拿到才合并进选择器，没拿到的不显示。
var LOCAL_INCENSE = [
  { id: 'local-1', name: '', desc: '道法自然，清静无为', image: '../../assets/blessing/incense_1.png' },
  { id: 'local-2', name: '', desc: '厚德载物，积善成德', image: '../../assets/blessing/incense_2.png' },
  { id: 'local-3', name: '', desc: '诵经祈福，智慧增长', image: '../../assets/blessing/incense_3.png' }
];

var INCENSE_IMG_BASE = 'https://gitee.com/b64882/qian_data/raw/master/';
var GITEE_INCENSE_FROM = 4;
var GITEE_INCENSE_TO = 24;

// 4~24 的 Gitee 候选（校验通过才合并进列表）
function buildGiteeIncense() {
  var arr = [];
  for (var n = GITEE_INCENSE_FROM; n <= GITEE_INCENSE_TO; n++) {
    arr.push({
      id: 'gitee-' + n,
      name: '',
      desc: '心香一瓣，虔诚供奉',
      image: INCENSE_IMG_BASE + 'incense_' + n + '.png'
    });
  }
  return arr;
}

// 全量主表（本地 + Gitee 候选），用于按 id 反查（燃烧态恢复用）
var ALL_INCENSE = LOCAL_INCENSE.concat(buildGiteeIncense());
var INCENSE_BY_ID = {};
ALL_INCENSE.forEach(function (it) { INCENSE_BY_ID[it.id] = it; });

// 背景图：默认本地 bg_tanxiang.jpg；另外 2 张来自 Gitee（xrds.jpg / yu.jpg）
// 与香型一致：Gitee 图运行时逐个校验，拿到才合并进选择器，没拿到不显示。
var BG_LOCAL = [
  { id: 'local', image: '../../assets/blessing/bg_tanxiang.jpg' }
];
var BG_GITEE = [
  { id: 'gitee-xrds', image: INCENSE_IMG_BASE + 'xrds.jpg' },
  { id: 'gitee-yu', image: INCENSE_IMG_BASE + 'yu.jpg' }
];
var BG_ALL = BG_LOCAL.concat(BG_GITEE);
var BG_BY_ID = {};
BG_ALL.forEach(function (it) { BG_BY_ID[it.id] = it; });

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
    burnerImage: LOCAL_INCENSE[0].image, // 空状态淡显的香炉图（本地内置，永远可用）
    isBurning: false,
    burningImage: '',
    burnRemainText: '',
    selectedType: 0,
    // 蜡烛图（默认用本地 PNG 兜底，加载云函数 fileID 后替换）
    candleLeftUrl: '../../assets/blessing/decor/left.png',
    candleRightUrl: '../../assets/blessing/decor/right.png',
    candleLeftLoaded: false, // 蜡烛图真正渲染完成后才点火苗，避免火苗悬空
    candleRightLoaded: false,
    // 莲花灯图（走云函数，同蜡烛；fileID 由 getCandle(type:'lotus') 提供，代码不打包本地图）
    lotusLampUrl: '',
    // 香型选择器
    showIncensePicker: false,
    incenseTypes: LOCAL_INCENSE,
    // 背景图选择器（默认本地，Gitee 图校验后合并）
    bgUrl: '../../assets/blessing/bg_tanxiang.jpg',
    bgList: BG_LOCAL,
    selectedBg: 0,
    showBgPicker: false,
    // 佛祖签
    showLingqian: false,
    lingqianList: LINGQIAN_LIST,
    selectedQian: null,
    // 莲花灯（左下悬浮，可点亮）
    lampLit: false
  },

  burnTimer: null,
  knockAudio: null,

  onLoad: function () {
    var flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags)
      || { tanxiang: false };
    if (!flags.tanxiang) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.restoreStats();
    this.restoreBurning();
    // 加载签文数据
    this.loadLingqianData();
    // 加载蜡烛图（云函数拉取，本地 PNG 兜底）
    this.loadCandleImages();
    // 加载莲花灯图（云函数拉取，本地不打包）
    this.loadLotusLamp();
    // 加载香型列表（本地 1~3 写死 + Gitee 4~24 校验后合并）
    this.loadIncenseTypes();
    // 背景图：恢复已选 + 加载 Gitee 候选（xrds.jpg / yu.jpg）
    this.restoreBg();
    this.loadBgList();
    // 初始化木鱼敲击音效
    this.initKnockAudio();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.restoreBurning();
  },

  onHide: function () {
    this.clearTimer();
  },

  onUnload: function () {
    this.clearTimer();
    if (this.knockAudio) {
      this.knockAudio.destroy();
      this.knockAudio = null;
    }
  },

  // ===== 木鱼音效 =====
  initKnockAudio: function () {
    if (this.knockAudio) return;
    try {
      // 尊重静音键：obeyMuteSwitch=true（默认即如此），手机静音时敲木鱼不出声。
      // 注意：这里【不能】开 useWebAudio —— 走 WebAudio 底层会强制遵循 iOS 静音键、
      // 虽然这次是想要的行为，但它会绕过本选项、行为不可控，故保持默认音频通道。
      if (wx.setInnerAudioOption) {
        wx.setInnerAudioOption({ obeyMuteSwitch: true, mixWithOther: true, speakerOn: true });
      }
      var ctx = wx.createInnerAudioContext();
      ctx.src = 'assets/sound/knock.mp3';
      ctx.obeyMuteSwitch = true;
      ctx.onError(function (e) { console.error('木鱼音效播放失败:', e); });
      this.knockAudio = ctx;
    } catch (e) {
      console.error('初始化木鱼音效失败:', e);
    }
  },

  playKnock: function () {
    var ctx = this.knockAudio;
    if (!ctx) return;
    try {
      ctx.stop();
      ctx.seek(0);
      ctx.play();
    } catch (e) { /* 忽略单次播放异常 */ }
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
    // 木槌敲打：播放敲击音效
    this.playKnock();
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
    var type = this.data.incenseTypes[idx];
    if (!type) return;
    var startTime = Date.now();
    var today = dateStr();

    var totalInsert = this.data.totalInsert + 1;
    var todayInsert = this.data.todayInsert + 1;
    storage.setSync('tanxiang_total_insert', totalInsert);
    storage.setSync('tanxiang_today_insert', todayInsert);
    storage.setSync('tanxiang_today_insert_date', today);
    storage.setSync('tanxiang_burn_start', startTime);
    storage.setSync('tanxiang_burn_id', type.id);

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
    var id = storage.getSync('tanxiang_burn_id', '');
    var type = INCENSE_BY_ID[id];
    var typeImage = (type && type.image) || LOCAL_INCENSE[0].image;
    if (!start) {
      this.setData({ isBurning: false, burningImage: '', burnerImage: typeImage });
      return;
    }
    var remain = BURN_DURATION - (Date.now() - start);
    if (remain <= 0) {
      storage.setSync('tanxiang_burn_start', 0);
      this.setData({ isBurning: false, burningImage: '', burnerImage: typeImage });
    } else {
      // 反查当前可用列表中的下标，保持 selectedType 与 incenseTypes 一致
      var selIdx = this.data.incenseTypes.indexOf(type);
      this.setData({
        isBurning: true,
        selectedType: selIdx >= 0 ? selIdx : 0,
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
      var id = storage.getSync('tanxiang_burn_id', '');
      var type = INCENSE_BY_ID[id];
      var typeImage = (type && type.image) || LOCAL_INCENSE[0].image;
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

  // ===== 莲花灯（左下悬浮）=====
  tapLotusLamp: function () {
    var lit = !this.data.lampLit;
    this.setData({ lampLit: lit });
    wx.showToast({
      title: lit ? '心灯已点亮' : '心灯已熄',
      icon: 'none',
      duration: 1200
    });
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

  // ===== 蜡烛图（云函数拉取，按 type 引入不同图片）=====
  loadCandleImages: function () {
    var that = this;
    var cachedLeft = storage.getSync('tanxiang_candle_left');
    var cachedRight = storage.getSync('tanxiang_candle_right');
    var pending = [];

    if (cachedLeft) {
      this.setData({ candleLeftUrl: cachedLeft, candleLeftLoaded: false });
    } else {
      pending.push('left');
    }
    if (cachedRight) {
      this.setData({ candleRightUrl: cachedRight, candleRightLoaded: false });
    } else {
      pending.push('right');
    }
    if (pending.length === 0) return;

    var calls = pending.map(function (t) {
      return new Promise(function (resolve) {
        wx.cloud.callFunction({
          name: 'getCandle',
          data: { type: t },
          success: function (res) {
            var fid = res.result && res.result.fileID;
            if (fid) {
              storage.setSync('tanxiang_candle_' + t, fid);
              var patch = {};
              if (t === 'left') {
                patch.candleLeftUrl = fid;
                patch.candleLeftLoaded = false;
              } else {
                patch.candleRightUrl = fid;
                patch.candleRightLoaded = false;
              }
              that.setData(patch);
            }
            resolve();
          },
          fail: function (err) {
            console.error('获取蜡烛图失败(' + t + '):', err);
            resolve(); // 失败则用本地 PNG 兜底，不阻断页面
          }
        });
      });
    });
    Promise.all(calls);
  },

  // 蜡烛图真正渲染完成后才点亮火苗（bindload 触发），避免图未出来火苗就悬空
  onCandleLeftLoad: function () {
    if (!this.data.candleLeftLoaded) this.setData({ candleLeftLoaded: true });
  },
  onCandleRightLoad: function () {
    if (!this.data.candleRightLoaded) this.setData({ candleRightLoaded: true });
  },

  // ===== 莲花灯图（同蜡烛：云函数拉取，本地不打包）=====
  loadLotusLamp: function () {
    var that = this;
    var cached = storage.getSync('tanxiang_lotus_lamp');
    if (cached) {
      this.setData({ lotusLampUrl: cached });
      return;
    }
    wx.cloud.callFunction({
      name: 'getCandle',
      data: { type: 'lotus_lamp' },
      success: function (res) {
        var fid = res.result && res.result.fileID;
        if (fid) {
          storage.setSync('tanxiang_lotus_lamp', fid);
          that.setData({ lotusLampUrl: fid });
        }
      },
      fail: function (err) {
        console.error('获取莲花灯图失败:', err);
      }
    });
  },

  // ===== 香型列表（本地 1~3 写死 + Gitee 4~24 校验后合并）=====
  // 本地三种永远在列表里；Gitee 候选逐个用 getImageInfo 校验，
  // 拿到（图片存在且可加载）才合并进 incenseTypes，没拿到不显示。
  loadIncenseTypes: function () {
    var that = this;
    var candidates = buildGiteeIncense();
    var idx = 0;
    var CONCURRENCY = 5; // 控制并发，避免触碰小程序请求数上限
    var next = function () {
      if (idx >= candidates.length) return;
      var batch = candidates.slice(idx, idx + CONCURRENCY);
      idx += CONCURRENCY;
      var done = 0;
      batch.forEach(function (item) {
        wx.getImageInfo({
          src: item.image,
          success: function () {
            // 拿到才合并进选择器（getImageInfo 已顺带缓存，渲染更快）
            that.setData({ incenseTypes: that.data.incenseTypes.concat([item]) });
          },
          fail: function () {
            // 没拿到（404/未加白名单等），不合并、不显示
          },
          complete: function () {
            done++;
            if (done === batch.length) next();
          }
        });
      });
    };
    next();
  },

  // ===== 背景图选择器 =====
  openBgPicker: function () {
    this.setData({ showBgPicker: true });
  },
  closeBgPicker: function () {
    this.setData({ showBgPicker: false });
  },
  // 恢复上次选中的背景（按 id 反查，列表动态变化后也不错位）
  restoreBg: function () {
    var id = storage.getSync('tanxiang_bg_id', 'local');
    var item = BG_BY_ID[id] || BG_LOCAL[0];
    var idx = -1;
    for (var i = 0; i < this.data.bgList.length; i++) {
      if (this.data.bgList[i].id === item.id) { idx = i; break; }
    }
    this.setData({
      bgUrl: item.image,
      selectedBg: idx >= 0 ? idx : 0
    });
  },
  selectBg: function (e) {
    var idx = e.currentTarget.dataset.index;
    var item = this.data.bgList[idx];
    if (!item) return;
    storage.setSync('tanxiang_bg_id', item.id);
    this.setData({
      bgUrl: item.image,
      selectedBg: idx,
      showBgPicker: false
    });
  },
  // 本地背景永远在；Gitee 背景逐个用 getImageInfo 校验，
  // 拿到（图片存在且可加载）才合并进 bgList，没拿到不显示。
  loadBgList: function () {
    var that = this;
    var candidates = BG_GITEE;
    var idx = 0;
    var CONCURRENCY = 3;
    var next = function () {
      if (idx >= candidates.length) {
        console.log('[背景] Gitee 背景校验完成：共', candidates.length, '个候选');
        // 列表已完整，重新套用已保存选中（若之前因列表未齐而回退到本地）
        that.restoreBg();
        return;
      }
      var batch = candidates.slice(idx, idx + CONCURRENCY);
      idx += CONCURRENCY;
      var done = 0;
      batch.forEach(function (item) {
        wx.getImageInfo({
          src: item.image,
          success: function () {
            that.setData({ bgList: that.data.bgList.concat([item]) });
            console.log('[背景] ✅ 获取到', item.id, '->', item.image);
          },
          fail: function (err) {
            console.warn('[背景] ❌ 未获取到', item.id, '->', item.image, '原因:', err && err.errMsg);
          },
          complete: function () {
            done++;
            if (done === batch.length) next();
          }
        });
      });
    };
    next();
  },

  // ===== 分享 =====
  onShareAppMessage: function () {
    return { title: '檀香一炷，心静自然凉', path: '/pages/tanxiang/index' };
  },
  onShareTimeline: function () {
    return { title: '檀香一炷，心静自然凉', query: '' };
  }
});