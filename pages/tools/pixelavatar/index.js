var storage = require('../../../utils/storage.js');
var avatar = require('./avatar-data.js');

Page({
  data: {
    isFavorite: false,
    seed: '',
    selectedStyle: 'identicon',
    selectedPalette: 'retro',
    styles: avatar.STYLES,
    palettes: avatar.PALETTES,
    batchSeeds: [],
    currentBg: '#F1FAEE'
  },

  onLoad: function () {
    this.checkFavorite();
    var now = new Date();
    var defaultSeed = 'pixel' + now.getTime();
    this.setData({ seed: defaultSeed });
    this.drawPreview();
    this.generateBatch();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('pixelavatar') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('pixelavatar') });
  },

  onSeedInput: function (e) {
    this.setData({ seed: e.detail.value });
    this.drawPreview();
  },

  onRandomSeed: function () {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var seed = '';
    for (var i = 0; i < 8; i++) {
      seed += chars[Math.floor(Math.random() * chars.length)];
    }
    this.setData({ seed: seed });
    this.drawPreview();
    this.generateBatch();
  },

  onStyleSelect: function (e) {
    this.setData({ selectedStyle: e.currentTarget.dataset.id });
    this.drawPreview();
    this.generateBatch();
  },

  onPaletteSelect: function (e) {
    this.setData({ selectedPalette: e.currentTarget.dataset.id });
    this.drawPreview();
    this.generateBatch();
  },

  drawPreview: function () {
    var self = this;
    var seed = self.data.seed;
    if (!seed) return;

    var result = avatar.generate(seed, self.data.selectedStyle, self.data.selectedPalette);
    self.setData({ currentBg: result.bg });

    var query = wx.createSelectorQuery();
    query.select('#previewCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio || 2;
      var size = 300;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = result.bg;
      ctx.fillRect(0, 0, size, size);
      avatar.drawGrid(ctx, result.grid, 20, 20, size - 40);
    });
  },

  generateBatch: function () {
    var self = this;
    var seeds = [];
    for (var i = 0; i < 9; i++) {
      seeds.push(self.data.seed + '_batch_' + i);
    }
    self.setData({ batchSeeds: seeds });

    setTimeout(function () {
      for (var i = 0; i < 9; i++) {
        self.drawBatchItem(i, seeds[i]);
      }
    }, 100);
  },

  drawBatchItem: function (idx, seed) {
    var result = avatar.generate(seed, this.data.selectedStyle, this.data.selectedPalette);
    var query = wx.createSelectorQuery();
    query.select('#batchCanvas' + idx).fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio || 2;
      var size = 100;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = result.bg;
      ctx.fillRect(0, 0, size, size);
      avatar.drawGrid(ctx, result.grid, 5, 5, size - 10);
    });
  },

  onBatchSelect: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var seed = this.data.batchSeeds[idx];
    if (!seed) return;
    var realSeed = seed.replace('_batch_' + idx, '');
    this.setData({ seed: realSeed + '_' + idx });
    this.drawPreview();
  },

  saveImage: function () {
    var self = this;
    if (!self.data.seed) {
      wx.showToast({ title: '请输入种子', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var query = wx.createSelectorQuery();
    query.select('#exportCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        wx.showToast({ title: '画布初始化失败', icon: 'none' });
        return;
      }

      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio || 2;
      var size = 540;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      var result = avatar.generate(self.data.seed, self.data.selectedStyle, self.data.selectedPalette);
      ctx.fillStyle = result.bg;
      ctx.fillRect(0, 0, size, size);
      avatar.drawGrid(ctx, result.grid, 30, 30, size - 60);

      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0, y: 0,
        width: size * dpr,
        height: size * dpr,
        destWidth: size * 2,
        destHeight: size * 2,
        fileType: 'png',
        success: function (tmpRes) {
          wx.saveImageToPhotosAlbum({
            filePath: tmpRes.tempFilePath,
            success: function () {
              wx.hideLoading();
              wx.showToast({ title: '已保存到相册', icon: 'success' });
            },
            fail: function (err) {
              wx.hideLoading();
              if (err.errMsg && err.errMsg.indexOf('deny') !== -1) {
                wx.showModal({
                  title: '提示',
                  content: '需要授权保存到相册，请在设置中允许',
                  confirmText: '去设置',
                  success: function (modalRes) {
                    if (modalRes.confirm) wx.openSetting();
                  }
                });
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '生成图片失败', icon: 'none' });
        }
      });
    });
  },

  onShareAppMessage: function () {
    return {
      title: '像素头像 - 输入名字生成专属像素风头像',
      path: '/pages/tools/pixelavatar/index'
    };
  }
});
