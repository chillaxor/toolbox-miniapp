var PHONES = require('../../../data/phones.js');

function matchDevice(model) {
  if (!model) return null;
  var defaults = PHONES['_default'] || {};
  if (PHONES[model] && model !== '_default') return PHONES[model];
  var keys = Object.keys(PHONES);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] === '_default') continue;
    if (model.indexOf(keys[i]) >= 0 || keys[i].indexOf(model) >= 0) {
      return PHONES[keys[i]];
    }
  }
  var m = model.toLowerCase();
  var dKeys = Object.keys(defaults);
  for (var j = 0; j < dKeys.length; j++) {
    if (m.indexOf(dKeys[j]) >= 0) return defaults[dKeys[j]];
  }
  return null;
}

Page({
  data: {
    unit: 'cm',
    rulerMarks: [],
    pixelsPerCm: 0,
    maxDisplay: 0,
    deviceInfo: '',
    isLandscape: false,
    showCtrl: true,
    statusBarHeight: 0
  },

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.detectOrientation();
    this.autoCalibrate();
    this.initRuler();
  },

  onResize: function () {
    this.detectOrientation();
    this.autoCalibrate();
    this.initRuler();
  },

  detectOrientation: function () {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({ isLandscape: sysInfo.windowWidth > sysInfo.windowHeight });
  },

  toggleCtrl: function () {
    this.setData({ showCtrl: !this.data.showCtrl });
  },

  autoCalibrate: function () {
    var sysInfo = wx.getSystemInfoSync();
    var model = sysInfo.model || '';
    var device = matchDevice(model);
    var isLandscape = this.data.isLandscape;

    // windowHeight/windowWidth = 小程序实际可用CSS像素（不含状态栏/导航栏）
    var winW = sysInfo.windowWidth;
    var winH = sysInfo.windowHeight;
    // screen 是完整物理屏幕对应的CSS像素
    var scrW = sysInfo.screenWidth;
    var scrH = sysInfo.screenHeight;

    var physWmm, physHmm;

    if (device) {
      physWmm = device.w;
      physHmm = device.h;a
      this.setData({ deviceInfo: model + ' ' + physWmm + '×' + physHmm + 'mm' });
    } else {
      var dpr = sysInfo.pixelRatio || 3;
      var physPxW = scrW * dpr;
      var ppi = 420;
      physWmm = (physPxW / ppi) * 25.4;
      physHmm = physWmm * (scrH / scrW);
      this.setData({ deviceInfo: '估算 ' + Math.round(physWmm) + '×' + Math.round(physHmm) + 'mm' });
    }

    // 核心：CSS px 和 物理 mm 的映射
    // 竖屏：尺子沿 windowHeight(CSS px) ↔ physHmm(物理高度)
    // 横屏：尺子沿 windowWidth(CSS px) ↔ physHmm(物理高度横过来了)
    var pxPerCm;
    if (isLandscape) {
      // 横屏时 windowWidth 对应物理高度（长边横过来了）
      pxPerCm = winW / (physHmm / 10);
    } else {
      // 竖屏时 windowHeight 对应物理高度
      pxPerCm = winH / (physHmm / 10);
    }

    var offset = wx.getStorageSync('ruler_pxPerCm_offset') || 0;
    pxPerCm = pxPerCm + offset;
    this.setData({ pixelsPerCm: Math.round(pxPerCm * 100) / 100 });
  },

  initRuler: function () {
    var sysInfo = wx.getSystemInfoSync();
    var pixelsPerCm = this.data.pixelsPerCm;
    var isCmUnit = this.data.unit === 'cm';
    var pixelsPerUnit = isCmUnit ? pixelsPerCm : pixelsPerCm * 2.54;
    var subdivisions = isCmUnit ? 10 : 16;
    var isLandscape = this.data.isLandscape;

    // 尺子刻度使用 window 尺寸（实际渲染区域）
    var pixelLength = isLandscape ? sysInfo.windowWidth : sysInfo.windowHeight;
    // 只留极小边距给零点线
    var availablePx = pixelLength - 4;

    var maxUnits = Math.floor(availablePx / pixelsPerUnit);
    var maxDisplayCm = isCmUnit ? maxUnits : Math.round(maxUnits * 2.54 * 10) / 10;

    var marks = [];
    var maxSub = maxUnits * subdivisions;

    for (var i = 0; i <= maxSub; i++) {
      var posPx = i * pixelsPerUnit / subdivisions;
      if (posPx > availablePx) break;

      var isMajor = i % subdivisions === 0;
      var markSize, label = '';

      if (isCmUnit) {
        var isHalf = i % 5 === 0;
        markSize = isMajor ? 140 : (isHalf ? 85 : 42);
        label = isMajor ? String(i / subdivisions) : '';
      } else {
        var isQuarter = i % 4 === 0;
        var isEighth = i % 2 === 0;
        markSize = isMajor ? 140 : (isQuarter ? 100 : (isEighth ? 68 : 40));
        label = isMajor ? String(i / subdivisions) : '';
      }

      marks.push({
        position: posPx,
        size: markSize,
        label: label,
        isMajor: isMajor
      });
    }

    this.setData({ rulerMarks: marks, maxDisplay: maxDisplayCm });
  },

  switchUnit: function () {
    var newUnit = this.data.unit === 'cm' ? 'inch' : 'cm';
    this.setData({ unit: newUnit });
    this.initRuler();
  },

  onCalibrate: function (e) {
    var val = e.detail.value;
    var offset = (val - 2000) * 0.0005;
    offset = Math.round(offset * 10000) / 10000;
    wx.setStorageSync('ruler_pxPerCm_offset', offset);
    this.autoCalibrate();
    this.initRuler();
  },

  onShareAppMessage: function () {
    return {
      title: '虚拟尺子 - 工具箱',
      path: '/pages/tools/ruler/index'
    };
  }
});
