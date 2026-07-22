var storage = require('../../../utils/storage.js');

Page({
  data: {
    photoPath: '',
    showDate: true,
    showTime: true,
    showCustom: false,
    customText: '',
    watermarkPosition: 'bottom-left',
    watermarkDate: '',
    watermarkTime: '',
    imgWidth: 0,
    imgHeight: 0,
    canvasW: 750,
    canvasH: 1334,
    resultPath: '',
    generating: false
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
        self._updateDateTime();
        wx.getImageInfo({
          src: path,
          success: function (info) {
            // 限制最大宽度 750px，保持比例
            var maxW = 750;
            var scale = info.width > maxW ? maxW / info.width : 1;
            var cw = Math.round(info.width * scale);
            var ch = Math.round(info.height * scale);
            self.setData({
              photoPath: path,
              imgWidth: info.width,
              imgHeight: info.height,
              canvasW: cw,
              canvasH: ch,
              resultPath: ''
            });
          },
          fail: function () {
            self.setData({ photoPath: path, canvasW: 750, canvasH: 1334, resultPath: '' });
          }
        });
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
    this.setData({ photoPath: '', resultPath: '' });
  },

  savePhoto: function () {
    var self = this;
    if (!this.data.photoPath) return;
    if (this.data.generating) return;

    this.setData({ generating: true });
    wx.showLoading({ title: '生成中...' });

    var cw = this.data.canvasW;
    var ch = this.data.canvasH;

    var ctx = wx.createCanvasContext('watermark-canvas', this);

    // Step1: 画底图
    ctx.drawImage(self.data.photoPath, 0, 0, cw, ch);

    // 构建水印文字行
    var lines = [];
    if (self.data.showDate) lines.push(self.data.watermarkDate);
    if (self.data.showTime) lines.push(self.data.watermarkTime);
    if (self.data.showCustom && self.data.customText) lines.push(self.data.customText);

    if (lines.length > 0) {
      var fontSize = Math.max(18, Math.floor(cw / 28));
      var pad = Math.floor(fontSize * 0.9);
      var lineH = Math.floor(fontSize * 1.6);
      var blockH = lineH * lines.length + pad * 2;

      // 估算文字最大宽度（中文约 fontSize px/字，英文约 fontSize*0.6 px/字）
      var blockW = 0;
      for (var i = 0; i < lines.length; i++) {
        // 简单估算：每个字符约 fontSize * 0.9
        var w = lines[i].length * fontSize * 0.9;
        if (w > blockW) blockW = w;
      }
      blockW += pad * 2;
      if (blockW > cw - pad * 2) blockW = cw - pad * 2;

      // 计算位置
      var bx, by;
      var pos = self.data.watermarkPosition;
      var margin = Math.floor(fontSize * 0.8);
      if (pos === 'bottom-left')  { bx = margin;            by = ch - blockH - margin; }
      else if (pos === 'bottom-right') { bx = cw - blockW - margin; by = ch - blockH - margin; }
      else if (pos === 'top-left')    { bx = margin;            by = margin; }
      else                             { bx = cw - blockW - margin; by = margin; }

      // 半透明黑色背景
      ctx.setFillStyle('rgba(0,0,0,0.45)');
      // 圆角矩形模拟（用多个 fillRect 拼不了圆角，直接 fillRect 即可）
      ctx.fillRect(bx, by, blockW, blockH);

      // 白色文字
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(fontSize);
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], bx + pad, by + pad + j * lineH + fontSize);
      }
    }

    // Step2: draw 提交，然后导出
    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'watermark-canvas',
          x: 0,
          y: 0,
          width: cw,
          height: ch,
          destWidth: cw,
          destHeight: ch,
          quality: 0.92,
          success: function (res) {
            wx.hideLoading();
            self.setData({ generating: false, resultPath: res.tempFilePath });
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function () {
                wx.showModal({
                  title: '保存失败',
                  content: '请在设置中允许访问相册',
                  showCancel: false
                });
              }
            });
          },
          fail: function (err) {
            wx.hideLoading();
            self.setData({ generating: false });
            wx.showToast({ title: '生成失败: ' + (err.errMsg || ''), icon: 'none' });
          }
        }, self);
      }, 300);
    });
  },

  onShareAppMessage: function () {
    return { title: '水印相机 - 为照片添加时间水印', path: '/packages/imgTools/watermark/index' };
  }
});
