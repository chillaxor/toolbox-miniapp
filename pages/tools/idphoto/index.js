var storage = require('../../../utils/storage.js');

var SIZES = [
  { name: '一寸', w: 295, h: 413, label: '25x35mm' },
  { name: '二寸', w: 413, h: 579, label: '35x49mm' },
  { name: '小一寸', w: 260, h: 378, label: '22x32mm' },
  { name: '小二寸', w: 413, h: 531, label: '35x45mm' },
  { name: '大一寸', w: 390, h: 567, label: '33x48mm' },
  { name: '大二寸', w: 413, h: 626, label: '35x53mm' },
  { name: '签证照', w: 600, h: 600, label: '51x51mm' },
  { name: '护照', w: 390, h: 567, label: '33x48mm' }
];

var BG_COLORS = [
  { name: '白色', color: '#FFFFFF' },
  { name: '蓝色', color: '#438EDB' },
  { name: '红色', color: '#D03C2F' },
  { name: '渐变蓝', color: '#6BA4E0' }
];

Page({
  data: {
    photoPath: '',
    sizeIdx: 0,
    sizes: SIZES,
    bgIdx: 0,
    bgColors: BG_COLORS,
    isFavorite: false,
    imgWidth: 0,
    imgHeight: 0
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('idphoto') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('idphoto');
    this.setData({ isFavorite: fav });
  },

  onChoosePhoto: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var path = res.tempFilePaths[0];
        that.setData({ photoPath: path });
        wx.getImageInfo({
          src: path,
          success: function (info) {
            that.setData({ imgWidth: info.width, imgHeight: info.height });
          }
        });
      }
    });
  },

  onSizeChange: function (e) {
    this.setData({ sizeIdx: parseInt(e.detail.value) });
  },

  onBgChange: function (e) {
    this.setData({ bgIdx: parseInt(e.currentTarget.dataset.idx !== undefined ? e.currentTarget.dataset.idx : e.detail.value) });
  },

  savePhoto: function () {
    var self = this;
    if (!this.data.photoPath) {
      wx.showToast({ title: '请先选择照片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var size = SIZES[this.data.sizeIdx];
    var bgColor = BG_COLORS[this.data.bgIdx].color;
    var imgW = this.data.imgWidth || size.w;
    var imgH = this.data.imgHeight || size.h;

    // 画布尺寸用证件照像素
    var cw = size.w;
    var ch = size.h;

    var ctx = wx.createCanvasContext('idphoto-canvas', this);

    // 背景色
    ctx.setFillStyle(bgColor);
    ctx.fillRect(0, 0, cw, ch);

    // 计算裁剪：取中心正方形区域（人像通常在中心）
    var srcRatio = imgW / imgH;
    var dstRatio = cw / ch;
    var sx, sy, sw, sh;

    if (srcRatio > dstRatio) {
      // 源图更宽，裁左右
      sh = imgH;
      sw = imgH * dstRatio;
      sx = (imgW - sw) / 2;
      sy = 0;
    } else {
      // 源图更高，裁上下（优先裁底部保留头部）
      sw = imgW;
      sh = imgW / dstRatio;
      sx = 0;
      sy = 0;
    }

    // 绘制照片
    ctx.drawImage(self.data.photoPath, sx, sy, sw, sh, 0, 0, cw, ch);

    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-canvas',
          quality: 1,
          success: function (res) {
            wx.hideLoading();
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function () {
                wx.showToast({ title: '保存失败，请授权相册', icon: 'none' });
              }
            });
          },
          fail: function () {
            wx.hideLoading();
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        }, self);
      }, 300);
    });
  },

  onShareAppMessage: function () {
    return {
      title: '证件照生成器 - 工具箱',
      path: '/pages/tools/idphoto/index'
    };
  }
});