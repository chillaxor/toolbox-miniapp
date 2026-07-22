var storage = require('../../../utils/storage.js');
var paperUtil = require('../../../utils/paper.js');

var renderTimer = null;

Page({
  data: {
    toolId: 'paper',
    isFavorite: false,
    configPanelOpen: true,
    currentPage: 1,
    activePreset: -1,
    canvasWidth: 330,
    canvasHeight: 460,
    config: {},
    presetTemplates: [],
    userTemplates: [],
    paperTypes: [],
    paperSizes: [],
    lineColors: [],
    bgColors: [],
    watermarkColors: ['#F0F0F0', '#E8E8E8', '#D0D0D0', '#FFEAA7', '#DDA0DD', '#98D8C8'],
    lineWidths: [0.5, 1, 1.5, 2]
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

    this.setData({
      config: paperUtil.getDefaultConfig(),
      presetTemplates: paperUtil.getPresetTemplates(),
      userTemplates: this.loadUserTemplates(),
      paperTypes: paperUtil.PAPER_TYPES,
      paperSizes: paperSizes,
      lineColors: paperUtil.LINE_COLORS,
      bgColors: paperUtil.BG_COLORS,
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
    this.setData({ isFavorite: storage.isFavorite('paper') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('paper');
    this.setData({ isFavorite: fav });
  },

  // ========== 配置面板 ==========
  toggleConfigPanel: function () {
    this.setData({ configPanelOpen: !this.data.configPanelOpen });
  },

  // ========== 纸张类型 ==========
  setPaperType: function (e) {
    var key = e.currentTarget.dataset.key;
    this.updateConfig({ paperType: key });
  },

  // ========== 纸张尺寸 ==========
  setPaperSize: function (e) {
    var key = e.currentTarget.dataset.key;
    var config = this.data.config;
    var sizes = paperUtil.PAPER_SIZES;
    var size = sizes[key];
    var newHeight = this.data.canvasWidth * (size.height / size.width);
    this.setData({ canvasHeight: Math.floor(newHeight) });
    this.updateConfig({ paperSize: key });
  },

  // ========== 线条颜色 ==========
  setLineColor: function (e) {
    var color = e.currentTarget.dataset.color;
    this.updateConfig({ lineColor: color });
  },

  // ========== 线条样式 ==========
  setLineStyle: function (e) {
    var style = e.currentTarget.dataset.style;
    this.updateConfig({ lineStyle: style });
  },

  // ========== 行距 ==========
  onLineSpacingChange: function (e) {
    this.updateConfig({ lineSpacing: e.detail.value });
  },

  // ========== 线条粗细 ==========
  setLineWidth: function (e) {
    var width = Number(e.currentTarget.dataset.width);
    this.updateConfig({ lineWidth: width });
  },

  // ========== 页面边距 ==========
  setMargin: function (e) {
    var dir = e.currentTarget.dataset.dir;
    var value = parseInt(e.detail.value) || 0;
    value = Math.max(0, Math.min(50, value));
    var update = {};
    update[dir] = value;
    this.updateConfig(update);
  },

  // ========== 背景色 ==========
  setBgColor: function (e) {
    var color = e.currentTarget.dataset.color;
    this.updateConfig({ bgColor: color });
  },

  // ========== 水印 ==========
  toggleWatermark: function (e) {
    this.updateConfig({ watermark: e.detail.value });
  },

  setWatermarkText: function (e) {
    this.updateConfig({ watermarkText: e.detail.value });
  },

  setWatermarkColor: function (e) {
    var color = e.currentTarget.dataset.color;
    this.updateConfig({ watermarkColor: color });
  },

  onWatermarkSizeChange: function (e) {
    this.updateConfig({ watermarkSize: e.detail.value });
  },

  // ========== 页数 ==========
  increasePageCount: function () {
    var count = this.data.config.pageCount;
    if (count < 50) {
      this.updateConfig({ pageCount: count + 1 });
    }
  },

  decreasePageCount: function () {
    var count = this.data.config.pageCount;
    if (count > 1) {
      this.updateConfig({ pageCount: count - 1 });
      if (this.data.currentPage >= count) {
        this.setData({ currentPage: count - 1 });
      }
    }
  },

  // ========== 翻页 ==========
  prevPage: function () {
    if (this.data.currentPage > 1) {
      this.setData({ currentPage: this.data.currentPage - 1 });
      this.renderPreview();
    }
  },

  nextPage: function () {
    if (this.data.currentPage < this.data.config.pageCount) {
      this.setData({ currentPage: this.data.currentPage + 1 });
      this.renderPreview();
    }
  },

  // ========== 预设模板 ==========
  applyPreset: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var preset = this.data.presetTemplates[index];
    if (preset) {
      var config = JSON.parse(JSON.stringify(preset.config));
      this.setData({
        config: config,
        activePreset: index,
        currentPage: 1
      });
      this.renderPreview();
    }
  },

  // ========== 用户模板 ==========
  loadUserTemplates: function () {
    try {
      var data = wx.getStorageSync('toolbox_paper_templates');
      return data || [];
    } catch (e) {
      return [];
    }
  },

  applyUserTemplate: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var tpl = this.data.userTemplates[index];
    if (tpl) {
      var config = JSON.parse(JSON.stringify(tpl.config));
      this.setData({
        config: config,
        activePreset: -1,
        currentPage: 1
      });
      this.renderPreview();
    }
  },

  deleteUserTemplate: function (e) {
    var self = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除模板',
      content: '确定删除该自定义模板吗？',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (res.confirm) {
          var templates = self.data.userTemplates.filter(function (t) {
            return t.id !== id;
          });
          wx.setStorageSync('toolbox_paper_templates', templates);
          self.setData({ userTemplates: templates });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // ========== 保存模板 ==========
  saveTemplate: function () {
    var self = this;
    wx.showModal({
      title: '保存模板',
      editable: true,
      placeholderText: '输入模板名称',
      confirmColor: '#333333',
      success: function (res) {
        if (res.confirm && res.content) {
          var name = res.content.trim();
          if (!name) {
            wx.showToast({ title: '请输入名称', icon: 'none' });
            return;
          }
          var templates = self.data.userTemplates;
          var newTpl = {
            id: 'tpl_' + Date.now(),
            name: name,
            category: 'custom',
            config: JSON.parse(JSON.stringify(self.data.config)),
            createdAt: Date.now()
          };
          templates.unshift(newTpl);
          wx.setStorageSync('toolbox_paper_templates', templates);
          self.setData({ userTemplates: templates });
          wx.showToast({ title: '模板已保存', icon: 'success' });
        }
      }
    });
  },

  // ========== 导出图片 ==========
  exportImage: function () {
    var self = this;
    var config = this.data.config;
    var pageCount = config.pageCount;

    wx.showLoading({ title: '生成中...' });

    // 使用高清导出尺寸
    var exportWidth = 794;  // A4 @96dpi ≈ 794px
    var exportHeight = Math.floor(exportWidth * self.getPaperRatio());

    self.exportPages(config, 1, pageCount, exportWidth, exportHeight);
  },

  getPaperRatio: function () {
    var sizes = paperUtil.PAPER_SIZES;
    var config = this.data.config;
    var size = sizes[config.paperSize];
    if (!size) {
      return config.customHeight / config.customWidth;
    }
    return size.height / size.width;
  },

  exportPages: function (config, pageNum, total, width, height) {
    var self = this;

    // 创建离屏 canvas
    var offscreenCanvas = wx.createCanvasContext('exportCanvas', self);
    var exportConfig = JSON.parse(JSON.stringify(config));

    paperUtil.renderPaper(offscreenCanvas, exportConfig, width, height);

    // 等待渲染完成
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
              if (pageNum < total) {
                wx.showLoading({ title: '第' + (pageNum + 1) + '/' + total + '页...' });
                self.exportPages(config, pageNum + 1, total, width, height);
              } else {
                wx.hideLoading();
                wx.showToast({ title: '已保存' + total + '页到相册', icon: 'success' });
                storage.addHistory({
                  toolId: 'paper',
                  toolName: '打印稿纸',
                  category: 'life',
                  summary: '导出' + total + '页' + self.getTypeName(config.paperType) + '稿纸',
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

  getTypeName: function (type) {
    var names = { lined: '横线', grid: '方格', tianzige: '田字格', blank: '空白', dotted: '点阵' };
    return names[type] || '';
  },

  // ========== 通用配置更新 ==========
  updateConfig: function (changes) {
    var config = this.data.config;
    var keys = Object.keys(changes);
    for (var i = 0; i < keys.length; i++) {
      config[keys[i]] = changes[keys[i]];
    }
    this.setData({ config: config, activePreset: -1 });
    this.scheduleRender();
  },

  scheduleRender: function () {
    if (renderTimer) {
      clearTimeout(renderTimer);
    }
    renderTimer = setTimeout(() => {
      this.renderPreview();
    }, 200);
  },

  // ========== 渲染预览 ==========
  renderPreview: function () {
    var ctx = wx.createCanvasContext('paperCanvas', this);
    var config = JSON.parse(JSON.stringify(this.data.config));
    var width = this.data.canvasWidth;
    var height = this.data.canvasHeight;
    paperUtil.renderPaper(ctx, config, width, height);
  },

  // ========== 分享 ==========
  onShare: function () {
    this.onShareAppMessage();
  },

  onShareAppMessage: function () {
    return {
      title: '自定义打印稿纸 - 工具箱',
      path: '/packages/toolsB/paper/index'
    };
  }
});
