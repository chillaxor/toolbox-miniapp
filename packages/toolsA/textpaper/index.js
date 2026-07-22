var storage = require('../../../utils/storage.js');
var paperUtil = require('../../../utils/paper.js');
var textpaperUtil = require('../../../utils/textpaper.js');

var renderTimer = null;

var SAMPLE_TEXT = '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。\n\n白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。';

Page({
  data: {
    toolId: 'textpaper',
    isFavorite: false,
    canvasWidth: 330,
    canvasHeight: 460,
    currentPage: 1,
    totalPages: 1,
    paperConfigOpen: true,
    textConfigOpen: true,
    paperConfig: {},
    textConfig: {},
    paperTypes: [],
    paperSizes: [],
    lineColors: []
  },

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync();
    var canvasWidth = Math.floor(sysInfo.windowWidth - 48);
    var canvasHeight = Math.floor(canvasWidth * 1.414); // A4 比例

    var paperSizes = [];
    var sizes = paperUtil.PAPER_SIZES;
    var sizeKeys = Object.keys(sizes);
    for (var i = 0; i < sizeKeys.length; i++) {
      paperSizes.push({ key: sizeKeys[i], name: sizes[sizeKeys[i]].name });
    }

    // 文字填稿纸默认用方格纸
    var paperConfig = paperUtil.getDefaultConfig();
    paperConfig.paperType = 'grid';
    paperConfig.lineSpacing = 15;
    paperConfig.lineColor = '#CCCCCC';

    this.setData({
      paperConfig: paperConfig,
      textConfig: textpaperUtil.getTextDefaultConfig(),
      paperTypes: paperUtil.PAPER_TYPES,
      paperSizes: paperSizes,
      lineColors: paperUtil.LINE_COLORS,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight
    });

    this.checkFavorite();
  },

  onReady: function () {
    this.renderPreview();
  },

  onShow: function () {
    this.checkFavorite();
  },

  // ========== 收藏 ==========
  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('textpaper') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('textpaper');
    this.setData({ isFavorite: fav });
  },

  // ========== 配置面板折叠 ==========
  togglePaperConfig: function () {
    this.setData({ paperConfigOpen: !this.data.paperConfigOpen });
  },

  toggleTextConfig: function () {
    this.setData({ textConfigOpen: !this.data.textConfigOpen });
  },

  // ========== 稿纸配置 ==========
  setPaperType: function (e) {
    var key = e.currentTarget.dataset.key;
    this.updatePaperConfig({ paperType: key });
  },

  setPaperSize: function (e) {
    var key = e.currentTarget.dataset.key;
    var sizes = paperUtil.PAPER_SIZES;
    var size = sizes[key];
    var newHeight = this.data.canvasWidth * (size.height / size.width);
    this.setData({ canvasHeight: Math.floor(newHeight) });
    this.updatePaperConfig({ paperSize: key });
  },

  setLineColor: function (e) {
    var color = e.currentTarget.dataset.color;
    this.updatePaperConfig({ lineColor: color });
  },

  onLineSpacingChange: function (e) {
    this.updatePaperConfig({ lineSpacing: e.detail.value });
  },

  setMargin: function (e) {
    var dir = e.currentTarget.dataset.dir;
    var value = parseInt(e.detail.value) || 0;
    value = Math.max(0, Math.min(50, value));
    var update = {};
    update[dir] = value;
    this.updatePaperConfig(update);
  },

  // ========== 文字配置 ==========
  onTextInput: function (e) {
    var text = e.detail.value;
    this.updateTextConfig({ text: text });
  },

  setFontType: function (e) {
    var font = e.currentTarget.dataset.font;
    this.updateTextConfig({ fontType: font });
  },

  onFontSizeChange: function (e) {
    this.updateTextConfig({ fontSize: e.detail.value });
  },

  setCharsPerCell: function (e) {
    var value = Number(e.currentTarget.dataset.value);
    this.updateTextConfig({ charsPerCell: value });
  },

  setTextAlign: function (e) {
    var align = e.currentTarget.dataset.align;
    this.updateTextConfig({ textAlign: align });
  },

  onIndentChange: function (e) {
    this.updateTextConfig({ indent: e.detail.value });
  },

  onParagraphSpaceChange: function (e) {
    this.updateTextConfig({ paragraphSpace: e.detail.value });
  },

  // ========== 快捷操作 ==========
  clearText: function () {
    this.updateTextConfig({ text: '' });
    this.setData({ currentPage: 1 });
  },
  insertSample: function () {
    this.updateTextConfig({ text: SAMPLE_TEXT });
    this.setData({ currentPage: 1 });
  },

  // ========== 翻页 ==========
  prevPage: function () {
    if (this.data.currentPage > 1) {
      this.setData({ currentPage: this.data.currentPage - 1 });
      this.renderPreview();
    }
  },

  nextPage: function () {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({ currentPage: this.data.currentPage + 1 });
      this.renderPreview();
    }
  },

  // ========== 导出 ==========
  exportSinglePage: function () {
    var self = this;
    if (!self.data.textConfig.text) {
      wx.showToast({ title: '请先输入文字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var exportWidth = 794;
    var exportHeight = Math.floor(exportWidth * self.getPaperRatio());

    var offscreenCtx = wx.createCanvasContext('exportCanvas', self);
    var paperConfig = JSON.parse(JSON.stringify(self.data.paperConfig));
    var textConfig = JSON.parse(JSON.stringify(self.data.textConfig));

    var result = textpaperUtil.renderPreview(offscreenCtx, paperConfig, textConfig, self.data.currentPage, exportWidth, exportHeight);

    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'exportCanvas',
        x: 0,
        y: 0,
        width: exportWidth,
        height: exportHeight,
        destWidth: exportWidth * 2,
        destHeight: exportHeight * 2,
        success: function (res) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function () {
              wx.hideLoading();
              wx.showToast({ title: '已保存到相册', icon: 'success' });
              storage.addHistory({
                toolId: 'textpaper',
                toolName: '文字填稿纸',
                category: 'life',
                summary: '导出第' + self.data.currentPage + '页文字稿纸',
                timestamp: Date.now()
              });
            },
            fail: function () {
              wx.hideLoading();
              wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' });
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      }, self);
    }, 300);
  },

  exportAllPages: function () {
    var self = this;
    if (!self.data.textConfig.text) {
      wx.showToast({ title: '请先输入文字', icon: 'none' });
      return;
    }

    var totalPages = self.data.totalPages;
    wx.showLoading({ title: '第1/' + totalPages + '页...' });

    var exportWidth = 794;
    var exportHeight = Math.floor(exportWidth * self.getPaperRatio());

    self.exportPageRecursive(1, totalPages, exportWidth, exportHeight);
  },

  exportPageRecursive: function (pageNum, totalPages, width, height) {
    var self = this;

    var offscreenCtx = wx.createCanvasContext('exportCanvas', self);
    var paperConfig = JSON.parse(JSON.stringify(self.data.paperConfig));
    var textConfig = JSON.parse(JSON.stringify(self.data.textConfig));

    textpaperUtil.renderPreview(offscreenCtx, paperConfig, textConfig, pageNum, width, height);

    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'exportCanvas',
        x: 0,
        y: 0,
        width: width,
        height: height,
        destWidth: width * 2,
        destHeight: height * 2,
        success: function (res) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function () {
              if (pageNum < totalPages) {
                wx.showLoading({ title: '第' + (pageNum + 1) + '/' + totalPages + '页...' });
                self.exportPageRecursive(pageNum + 1, totalPages, width, height);
              } else {
                wx.hideLoading();
                wx.showToast({ title: '已保存' + totalPages + '页到相册', icon: 'success' });
                storage.addHistory({
                  toolId: 'textpaper',
                  toolName: '文字填稿纸',
                  category: 'life',
                  summary: '导出' + totalPages + '页文字稿纸',
                  timestamp: Date.now()
                });
              }
            },
            fail: function () {
              wx.hideLoading();
              wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' });
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      }, self);
    }, 300);
  },

  getPaperRatio: function () {
    var sizes = paperUtil.PAPER_SIZES;
    var config = this.data.paperConfig;
    var size = sizes[config.paperSize];
    if (!size) {
      return 297 / 210;
    }
    return size.height / size.width;
  },

  // ========== 通用配置更新 ==========
  updatePaperConfig: function (changes) {
    var config = this.data.paperConfig;
    var keys = Object.keys(changes);
    for (var i = 0; i < keys.length; i++) {
      config[keys[i]] = changes[keys[i]];
    }
    this.setData({ paperConfig: config });
    this.scheduleRender();
  },

  updateTextConfig: function (changes) {
    var config = this.data.textConfig;
    var keys = Object.keys(changes);
    for (var i = 0; i < keys.length; i++) {
      config[keys[i]] = changes[keys[i]];
    }
    this.setData({ textConfig: config });
    this.scheduleRender();
  },

  scheduleRender: function () {
    if (renderTimer) {
      clearTimeout(renderTimer);
    }
    renderTimer = setTimeout(function () {
      this.renderPreview();
    }.bind(this), 200);
  },

  // ========== 渲染预览 ==========
  renderPreview: function () {
    var ctx = wx.createCanvasContext('textPaperCanvas', this);
    var paperConfig = JSON.parse(JSON.stringify(this.data.paperConfig));
    var textConfig = JSON.parse(JSON.stringify(this.data.textConfig));
    var width = this.data.canvasWidth;
    var height = this.data.canvasHeight;

    var result = textpaperUtil.renderPreview(ctx, paperConfig, textConfig, this.data.currentPage, width, height);

    this.setData({
      totalPages: result.totalPages || 1
    });

    // 确保当前页不超出范围
    if (this.data.currentPage > result.totalPages) {
      this.setData({ currentPage: result.totalPages });
    }
  },

  // ========== 分享 ==========
  onShare: function () {
    this.onShareAppMessage();
  },

  onShareAppMessage: function () {
    return {
      title: '文字填稿纸 - 工具箱',
      path: '/packages/toolsA/textpaper/index'
    };
  }
});
