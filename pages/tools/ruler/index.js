Page({
  data: {
    unit: 'cm',
    pixelsPerCm: 0,
    rulerLength: 20,
    rulerMarks: [],
    calibrationOffset: 0
  },

  onLoad: function () {
    this.initRuler();
  },

  initRuler: function () {
    var sysInfo = wx.getSystemInfoSync();
    // DPI = screenWidthPx / screenWidthInch, 1inch = 2.54cm
    // pixelsPerCm = DPI / 2.54 = screenWidthPx / (screenWidthInch * 2.54)
    // screenWidthInch = screenWidthPx / DPI = screenWidthPx / pixelRatio / screenDiagonal ... 
    // 简化: pixelRatio 是 DPR, windowWidth 是 CSS px
    // 物理DPI ≈ screenWidthPx / (screenWidth_mm / 25.4)
    // 但小程序无法获取屏幕物理尺寸，用标准估算: 
    // 多数手机 ~400dpi, pixelRatio=3 → 基准 pixelsPerCm ≈ screenWidthPx * pixelRatio / (screenWidthPx / (400/2.54))
    // 实际上: 1 CSS px = 1/pixelRatio 物理px, 1cm = DPI/2.54 CSS px
    // 但我们无法获取DPI，所以用经验值+校准
    // 标准估算: screenWidthPx * pixelRatio / 2.54 ≈ 像素/厘米 (基于物理像素)
    // 用CSS px显示: pixelsPerCm = 物理DPI / 2.54 / pixelRatio
    // 假设 400 DPI: pixelsPerCm ≈ 400 / 2.54 / 3 ≈ 52.5 CSS px
    var basePixelsPerCm = sysInfo.screenWidth / 2.54 * sysInfo.pixelRatio / sysInfo.pixelRatio;
    // 实际就是 screenWidth / 2.54 ≈ 屏幕375/2.54 ≈ 147 ... 太大
    // 重新推导: 屏幕宽度约6cm, 375 CSS px / 6cm = 62.5 px/cm
    // 但屏幕物理宽度未知。用 windowWidth 估算：
    // 典型手机屏幕宽约6.2cm(6.1寸屏), 375px → 375/6.2 ≈ 60.5 px/cm
    // 通用做法：用 windowWidth / (对角线英寸 * 宽高比宽) 但太复杂
    // 实用方案：默认估算 + 用户校准滑块
    var estimatedScreenCmWidth = 6.5; // 典型手机约6.5cm宽
    var pixelsPerCm = sysInfo.screenWidth / estimatedScreenCmWidth;
    
    pixelsPerCm = pixelsPerCm + this.data.calibrationOffset;

    var marks = [];
    var length = this.data.unit === 'cm' ? 20 : 8;
    var totalMarks = length * 10;

    for (var i = 0; i <= totalMarks; i++) {
      var isCm = i % 10 === 0;
      var isHalf = i % 5 === 0;
      var height = isCm ? 60 : (isHalf ? 40 : 20);
      marks.push({
        position: i * pixelsPerCm / 10,
        height: height,
        label: isCm ? (i / 10) : '',
        isCm: isCm
      });
    }

    this.setData({
      pixelsPerCm: pixelsPerCm,
      rulerLength: length,
      rulerMarks: marks
    });
  },

  switchUnit: function () {
    var newUnit = this.data.unit === 'cm' ? 'inch' : 'cm';
    this.setData({ unit: newUnit });
    this.initRuler();
  },

  onSliderChange: function (e) {
    this.setData({ calibrationOffset: e.detail.value - 50 });
    this.initRuler();
  },

  onShareAppMessage: function () {
    return {
      title: '虚拟尺子 - 工具箱',
      path: '/pages/tools/ruler/index'
    };
  }
});
