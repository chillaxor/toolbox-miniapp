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
    imgHeight: 0,
    canvasW: 295,
    canvasH: 413
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
    var idx = parseInt(e.detail.value);
    var size = SIZES[idx];
    this.setData({
      sizeIdx: idx,
      canvasW: size.w,
      canvasH: size.h
    });
  },

  onBgChange: function (e) {
    var idx = e.currentTarget.dataset.idx !== undefined ? e.currentTarget.dataset.idx : parseInt(e.detail.value);
    this.setData({ bgIdx: idx });
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
    var cw = size.w;
    var ch = size.h;

    // 计算目标绘制区域：等比缩放后居中裁剪
    // 旧版 canvas drawImage 只支持5参数: drawImage(img, dx, dy, dw, dh)
    // 需要先用 canvas 画一个"等比缩放+居中裁剪"的版本
    // 思路：分两步 — 先把原图缩放画到一个中间canvas，再从中间canvas取裁剪区域

    var srcRatio = imgW / imgH;
    var dstRatio = cw / ch;

    // 计算缩放后的尺寸（cover模式：至少一边填满目标）
    var scaleW, scaleH, offsetX, offsetY;
    if (srcRatio > dstRatio) {
      // 源图更宽，高度先填满，左右裁
      scaleH = ch;
      scaleW = imgW * (ch / imgH);
      offsetX = -(scaleW - cw) / 2;
      offsetY = 0;
    } else {
      // 源图更高，宽度先填满，上下裁（保留顶部即头部）
      scaleW = cw;
      scaleH = imgH * (cw / imgW);
      offsetX = 0;
      offsetY = 0; // 从顶部开始，保留头部
    }

    var ctx = wx.createCanvasContext('idphoto-canvas', this);

    // 背景色
    ctx.setFillStyle(bgColor);
    ctx.fillRect(0, 0, cw, ch);

    // 绘制照片（cover模式：等比缩放后偏移居中/顶对齐）
    ctx.drawImage(self.data.photoPath, offsetX, offsetY, scaleW, scaleH);

    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-canvas',
          destWidth: cw * 2,
          destHeight: ch * 2,
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
          fail: function (err) {
            wx.hideLoading();
            console.error('canvasToTempFilePath fail', err);
            wx.showToast({ title: '生成失败，请重试', icon: 'none' });
          }
        }, self);
      }, 500);
    });
  },

  onShareAppMessage: function () {
    return {
      title: '证件照生成器 - 工具箱',
      path: '/pages/tools/idphoto/index'
    };
  }
});