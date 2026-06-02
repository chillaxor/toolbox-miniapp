var storage = require('../../../utils/storage.js');

Page({
  data: {
    photoPath: '',
    showDate: true,
    showTime: true,
    showLocation: true,
    showCustom: false,
    customText: '',
    watermarkPosition: 'bottom-left',
    watermarkDate: '',
    watermarkTime: '',
    locationText: '',
    imgWidth: 0,
    imgHeight: 0
  },

  onLoad: function () {
    this._updateDateTime();
  },

  _updateDateTime: function () {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var h = now.getHours();
    var min = now.getMinutes();
    this.setData({
      watermarkDate: y + '年' + (m < 10 ? '0' : '') + m + '月' + (d < 10 ? '0' : '') + d + '日',
      watermarkTime: (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min
    });
  },

  choosePhoto: function () {
    var self = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var path = res.tempFilePaths[0];
        self.setData({ photoPath: path });
        self._updateDateTime();
        self._getLocation();
        // 获取图片尺寸
        wx.getImageInfo({
          src: path,
          success: function (info) {
            self.setData({ imgWidth: info.width, imgHeight: info.height });
          }
        });
      }
    });
  },

  _getLocation: function () {
    var self = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        self.setData({ locationText: res.latitude.toFixed(4) + '°N, ' + res.longitude.toFixed(4) + '°E' });
      },
      fail: function () {
        self.setData({ locationText: '' });
      }
    });
  },

  toggleSetting: function (e) {
    var key = e.currentTarget.dataset.key;
    var obj = {};
    obj[key] = e.detail.value;
    this.setData(obj);
  },

  onCustomInput: function (e) {
    this.setData({ customText: e.detail.value });
  },

  setPosition: function (e) {
    this.setData({ watermarkPosition: e.currentTarget.dataset.pos });
  },

  rechoose: function () {
    this.setData({ photoPath: '', locationText: '' });
  },

  savePhoto: function () {
    var self = this;
    if (!this.data.photoPath) return;

    wx.showLoading({ title: '生成中...' });

    var imgW = this.data.imgWidth || 750;
    var imgH = this.data.imgHeight || 1334;
    // 限制canvas尺寸
    var maxW = 750;
    var scale = maxW / imgW;
    var cw = Math.floor(imgW * scale);
    var ch = Math.floor(imgH * scale);

    var ctx = wx.createCanvasContext('watermark-canvas', this);

    // 绘制底图
    ctx.drawImage(self.data.photoPath, 0, 0, cw, ch);

    // 绘制水印
    var lines = [];
    if (self.data.showDate) lines.push(self.data.watermarkDate);
    if (self.data.showTime) lines.push(self.data.watermarkTime);
    if (self.data.showLocation && self.data.locationText) lines.push('📍 ' + self.data.locationText);
    if (self.data.showCustom && self.data.customText) lines.push(self.data.customText);

    if (lines.length > 0) {
      var fontSize = Math.max(20, Math.floor(cw / 30));
      var pad = Math.floor(fontSize * 0.8);
      var lineH = Math.floor(fontSize * 1.5);
      var blockH = lineH * lines.length + pad * 2;
      var blockW = 0;

      // 估算文字宽度
      ctx.setFontSize(fontSize);
      for (var i = 0; i < lines.length; i++) {
        var w = lines[i].length * fontSize;
        if (w > blockW) blockW = w;
      }
      blockW += pad * 2;

      // 计算位置
      var bx, by;
      var pos = self.data.watermarkPosition;
      var margin = Math.floor(fontSize);
      if (pos === 'bottom-left') { bx = margin; by = ch - blockH - margin; }
      else if (pos === 'bottom-right') { bx = cw - blockW - margin; by = ch - blockH - margin; }
      else if (pos === 'top-left') { bx = margin; by = margin; }
      else { bx = cw - blockW - margin; by = margin; }

      // 半透明背景
      ctx.setFillStyle('rgba(0,0,0,0.4)');
      ctx.fillRect(bx, by, blockW, blockH);

      // 文字
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(fontSize);
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], bx + pad, by + pad + (i + 1) * lineH - fontSize * 0.3);
      }
    }

    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'watermark-canvas',
          quality: 0.9,
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
    return { title: '水印相机 - 为照片添加时间地点水印', path: '/pages/tools/watermark/index' };
  }
});