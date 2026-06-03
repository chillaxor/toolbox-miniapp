var PHONES = require('../../../data/phones.js');

/**
 * 匹配设备物理尺寸
 */
function matchDevice(model) {
  if (!model) return null;
  // 精确匹配
  if (PHONES[model] && model !== '_default') return PHONES[model];
  // 模糊匹配
  var keys = Object.keys(PHONES);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k === '_default') continue;
    if (model.indexOf(k) >= 0 || k.indexOf(model) >= 0) {
      return PHONES[k];
    }
  }
  // 品牌默认值
  var defaults = PHONES['_default'] || {};
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
    marks: [],
    pxPerMm: 0,
    maxDisplay: 0,
    deviceInfo: '',
    isLandscape: false,
    showCtrl: false,
    statusBarHeight: 0,
    rulerSize: 80
  },

  onLoad: function () {
    var sys = wx.getSystemInfoSync();
    this._sys = sys;
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    this._refresh();
  },

  onResize: function () {
    this._sys = wx.getSystemInfoSync();
    this._refresh();
  },

  _refresh: function () {
    this._detectOrientation();
    this._calibrate();
    this._buildMarks();
  },

  /**
   * 检测横竖屏
   */
  _detectOrientation: function () {
    var sys = this._sys || wx.getSystemInfoSync();
    this.setData({ isLandscape: sys.windowWidth > sys.windowHeight });
  },

  /**
   * 校准：计算每毫米对应的CSS像素数
   * 核心公式：pxPerMm = 屏幕CSS像素 / 物理毫米
   *   竖屏：尺子沿屏幕高度方向 → pxPerMm = windowHeight / physH
   *   横屏：尺子沿屏幕宽度方向 → pxPerMm = windowWidth / physH
   *   （横屏时屏幕宽度 = 竖屏时的高度，都对应手机的长边物理尺寸）
   */
  _calibrate: function () {
    var sys = this._sys || wx.getSystemInfoSync();
    var model = sys.model || '';
    var device = matchDevice(model);
    var isLandscape = this.data.isLandscape;

    var wW = sys.windowWidth;
    var wH = sys.windowHeight;
    var physW, physH; // 物理尺寸 mm

    if (device) {
      physW = device.w;
      physH = device.h;
      this.setData({
        deviceInfo: model + ' (' + physW + '×' + physH + 'mm)'
      });
    } else {
      // 无匹配设备时，根据DPI估算
      var dpr = sys.pixelRatio || 3;
      var sW = sys.screenWidth;
      var sH = sys.screenHeight;
      var physPxW = sW * dpr;
      // 多数手机PPI在400-480之间，取420作为估算值
      var ppi = 420;
      physW = (physPxW / ppi) * 25.4;
      physH = physW * (sH / sW);
      this.setData({
        deviceInfo: '估算 (' + Math.round(physW) + '×' + Math.round(physH) + 'mm)'
      });
    }

    // 计算 px/mm
    var rulerLength = isLandscape ? wW : wH;
    var pxPerMm = rulerLength / physH;

    // 应用用户微调偏移
    var offset = wx.getStorageSync('ruler_offset') || 0;
    pxPerMm += offset;

    this.setData({
      pxPerMm: Math.round(pxPerMm * 100) / 100,
      rulerSize: isLandscape ? 50 : 80
    });
  },

  /**
   * 生成刻度数据（所有尺寸单位均为 px）
   * cm模式：每毫米一条刻度，5mm中刻度，10mm(1cm)大刻度
   * inch模式：每1/8英寸一条刻度，1/4中刻度，1/2中大刻度，1英寸大刻度
   */
  _buildMarks: function () {
    var pxPerMm = this.data.pxPerMm;
    if (pxPerMm <= 0) {
      this.setData({ marks: [], maxDisplay: 0 });
      return;
    }

    var isCm = this.data.unit === 'cm';
    var isLandscape = this.data.isLandscape;
    var sys = this._sys || wx.getSystemInfoSync();

    // 每单位（cm或inch）对应的px数
    var pxPerUnit = isCm ? pxPerMm * 10 : pxPerMm * 25.4;

    // 每单位的细分数
    var subDiv = isCm ? 10 : 8;

    // 尺子可用总长度（px）
    var totalPx = (isLandscape ? sys.windowWidth : sys.windowHeight) - 2;

    var maxUnits = Math.floor(totalPx / pxPerUnit);
    var totalSubs = maxUnits * subDiv;

    var marks = [];
    for (var i = 0; i <= totalSubs; i++) {
      var pos = i * pxPerUnit / subDiv;
      if (pos > totalPx) break;

      var isMajor = (i % subDiv === 0);
      var len;
      var label = '';

      if (isCm) {
        var isHalf = (i % 5 === 0) && !isMajor;
        len = isMajor ? 24 : (isHalf ? 16 : 8);
        if (isMajor) label = String(i / subDiv);
      } else {
        var isHalfInch = (i % 4 === 0) && !isMajor;
        var isQuarter = (i % 2 === 0) && !isMajor && !isHalfInch;
        len = isMajor ? 24 : (isHalfInch ? 18 : (isQuarter ? 12 : 6));
        if (isMajor) label = String(i / subDiv);
      }

      marks.push({
        pos: Math.round(pos * 10) / 10,
        len: len,
        label: label,
        major: isMajor
      });
    }

    this.setData({
      marks: marks,
      maxDisplay: isCm ? maxUnits : maxUnits
    });
  },

  /**
   * 切换厘米/英寸
   */
  switchUnit: function () {
    this.setData({ unit: this.data.unit === 'cm' ? 'inch' : 'cm' });
    this._buildMarks();
  },

  /**
   * 微调校准滑块
   * 范围 0-4000，默认2000(无偏移)
   * 偏移范围：±0.6 px/mm
   */
  onCalibrate: function (e) {
    var val = e.detail.value;
    var offset = (val - 2000) * 0.0003;
    offset = Math.round(offset * 10000) / 10000;
    wx.setStorageSync('ruler_offset', offset);
    this._calibrate();
    this._buildMarks();
  },

  toggleCtrl: function () {
    this.setData({ showCtrl: !this.data.showCtrl });
  },

  onShareAppMessage: function () {
    return {
      title: '虚拟尺子 - 工具箱',
      path: '/pages/tools/ruler/index'
    };
  }
});
