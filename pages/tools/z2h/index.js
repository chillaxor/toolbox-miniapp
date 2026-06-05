var z2hUtil = require('../../../utils/z2h.js');
var GRID_TYPES = z2hUtil.GRID_TYPES;

// A4 画布实际像素（72dpi）
var A4_PX_W = z2hUtil.mm2px(z2hUtil.A4_WIDTH_MM, 72);
var A4_PX_H = z2hUtil.mm2px(z2hUtil.A4_HEIGHT_MM, 72);

Page({
  data: {
    currentType: 'hanzi',
    inputText: '',
    inputPlaceholder: '请输入要练习的汉字，如：天地人你我他',
    gridType: GRID_TYPES.TIAN,
    repeatCount: 5,
    cellSizeMM: 15,        // 格子尺寸 mm
    lineSpacingMM: 3,      // 行间距 mm
    showPinyin: false,
    traceColor: '#dddddd',
    gridColor: '#cccccc',
    hasGenerated: false,
    canvasWidth: 350,      // 屏幕显示宽度（会被缩放）
    canvasHeight: 483,     // 按 A4 比例 210:297 计算
    layoutInfo: '',        // 布局信息文字
    a4PxW: A4_PX_W,
    a4PxH: A4_PX_H
  },

  _paperRows: null,
  _layout: null,

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync();
    this._screenWidth = sysInfo.windowWidth;
  },

  // 切换字帖类型
  switchType: function (e) {
    var type = e.currentTarget.dataset.type;
    var placeholders = {
      hanzi: '请输入要练习的汉字，如：天地人你我他',
      pinyin: '请输入汉字，自动标注拼音',
      number: '请输入数字，如：1234567890',
      english: '请输入英文字母或单词，如：ABCDEFG',
      line: ''
    };
    this.setData({
      currentType: type,
      inputPlaceholder: placeholders[type] || '',
      hasGenerated: false
    });
  },

  // 切换格子类型
  switchGrid: function (e) {
    this.setData({ gridType: e.currentTarget.dataset.grid });
  },

  // 输入变化
  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  // 滑块变化
  onRepeatChange: function (e) {
    this.setData({ repeatCount: e.detail.value });
  },
  onCellSizeMMChange: function (e) {
    this.setData({ cellSizeMM: e.detail.value });
  },
  onLineSpacingMMChange: function (e) {
    this.setData({ lineSpacingMM: e.detail.value });
  },

  // 拼音开关
  onPinyinToggle: function (e) {
    this.setData({ showPinyin: e.detail.value });
  },

  // 颜色选择
  setTraceColor: function (e) {
    this.setData({ traceColor: e.currentTarget.dataset.color });
  },
  setGridColor: function (e) {
    this.setData({ gridColor: e.currentTarget.dataset.color });
  },

  // 使用模板
  useTemplate: function (e) {
    var text = e.currentTarget.dataset.text;
    var type = e.currentTarget.dataset.type;
    var placeholders = {
      hanzi: '请输入要练习的汉字，如：天地人你我他',
      pinyin: '请输入汉字，自动标注拼音',
      number: '请输入数字，如：1234567890',
      english: '请输入英文字母或单词，如：ABCDEFG'
    };
    this.setData({
      inputText: text,
      currentType: type,
      inputPlaceholder: placeholders[type] || ''
    });
  },

  // 生成字帖（A4 满页）
  onGenerate: function () {
    var that = this;
    var type = this.data.currentType;

    if (type !== 'line' && !this.data.inputText.trim()) {
      wx.showToast({ title: '请输入练习内容', icon: 'none' });
      return;
    }

    // 生成纸张数据（A4 尺寸 + 自动填满）
    var options = {
      type: type,
      text: this.data.inputText,
      cellSizeMM: this.data.cellSizeMM,
      showPinyin: this.data.showPinyin,
      repeatCount: this.data.repeatCount,
      lineSpacingMM: this.data.lineSpacingMM,
      marginMM: z2hUtil.PAGE_MARGIN_MM,
      gridType: this.data.gridType
    };

    var result = z2hUtil.generatePaperData(options);
    var rows = result.rows;
    var layout = result.layout;

    if (rows.length === 0) {
      wx.showToast({ title: '没有可生成的内容', icon: 'none' });
      return;
    }

    this._paperRows = rows;
    this._layout = layout;
    layout.type = type;

    // 屏幕显示：按宽度 350px 等比缩放 A4
    var displayW = Math.min(this._screenWidth - 40, 350);
    var displayH = Math.round(displayW * A4_PX_H / A4_PX_W);

    this.setData({
      hasGenerated: true,
      canvasWidth: displayW,
      canvasHeight: displayH,
      layoutInfo: layout.cols + '列 × ' + layout.rows + '行，格子' + this.data.cellSizeMM + 'mm'
    }, function () {
      that._renderCanvas();
    });
  },

  // 使用旧版 Canvas API 渲染（A4 尺寸）
  _renderCanvas: function () {
    var ctx = wx.createCanvasContext('paperCanvas', this);

    var colors = {
      gridColor: this.data.gridColor,
      traceColor: this.data.traceColor
    };

    z2hUtil.renderPaper(ctx, this._layout, this.data.gridType, this._paperRows, colors);
    ctx.draw();
    this._ctx = ctx;
  },

  // 保存图片
  onSaveImage: function () {
    var that = this;
    wx.showLoading({ title: '生成高清图片中...' });

    setTimeout(function () {
      // 导出 A4 原始尺寸的高清图
      wx.canvasToTempFilePath({
        canvasId: 'paperCanvas',
        x: 0,
        y: 0,
        width: A4_PX_W,
        height: A4_PX_H,
        destWidth: A4_PX_W * 2,
        destHeight: A4_PX_H * 2,
        success: function (res) {
          that._saveToAlbum(res.tempFilePath);
        },
        fail: function (err) {
          wx.hideLoading();
          console.error('canvasToTempFilePath fail:', err);
          wx.showToast({ title: '生成图片失败', icon: 'none' });
        }
      }, that);
    }, 500);
  },

  // 保存到相册
  _saveToAlbum: function (filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function () {
        wx.hideLoading();
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function (err) {
        wx.hideLoading();
        if (err.errMsg.indexOf('deny') !== -1 || err.errMsg.indexOf('denied') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去设置',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  // 分享
  onShare: function () {
    var that = this;
    wx.canvasToTempFilePath({
      canvasId: 'paperCanvas',
      success: function (res) {
        wx.showShareImageMenu({
          path: res.tempFilePath,
          fail: function () {
            wx.showToast({ title: '分享取消', icon: 'none' });
          }
        });
      }
    }, that);
  },

  // 转发分享
  onShareAppMessage: function () {
    return {
      title: '字帖生成器 - 自定义描红练习字帖',
      path: '/pages/tools/z2h/index'
    };
  }
});
