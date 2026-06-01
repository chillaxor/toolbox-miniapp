var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    colorIndex: 0,
    lineWidth: 3,
    colors: ['#333333', '#E74C3C', '#FF6B35', '#F39C12', '#45B058', '#4ECDC4', '#3498DB', '#9B59B6', '#FFFFFF'],
    lineOptions: [2, 3, 5, 8],
    isEraser: false,
    hasDrawn: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('sketch') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('sketch');
    this.setData({ isFavorite: fav });
  },

  onReady: function () {
    this.ctx = wx.createCanvasContext('sketchCanvas', this);
    this.ctx.setFillStyle('#FFFFFF');
    this.ctx.fillRect(0, 0, 10000, 10000);
    this.ctx.draw();
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
  },

  onTouchStart: function (e) {
    if (!e.touches || e.touches.length === 0) return;
    this.isDrawing = true;
    this.lastX = e.touches[0].x;
    this.lastY = e.touches[0].y;

    if (!this.data.hasDrawn) {
      this.setData({ hasDrawn: true });
    }
  },

  onTouchMove: function (e) {
    if (!this.isDrawing || !e.touches || e.touches.length === 0) return;
    var x = e.touches[0].x;
    var y = e.touches[0].y;

    var color = this.data.isEraser ? '#FFFFFF' : this.data.colors[this.data.colorIndex];
    var width = this.data.isEraser ? this.data.lineWidth * 4 : this.data.lineWidth;

    this.ctx.beginPath();
    this.ctx.setStrokeStyle(color);
    this.ctx.setLineWidth(width);
    this.ctx.setLineCap('round');
    this.ctx.setLineJoin('round');
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.draw(true);

    this.lastX = x;
    this.lastY = y;
  },

  onTouchEnd: function () {
    this.isDrawing = false;
  },

  onColorSelect: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    this.setData({ colorIndex: index, isEraser: false });
  },

  onLineWidthSelect: function (e) {
    var width = Number(e.currentTarget.dataset.width);
    this.setData({ lineWidth: width });
  },

  onEraser: function () {
    this.setData({ isEraser: !this.data.isEraser });
  },

  onClear: function () {
    var self = this;
    wx.showModal({
      title: '确认清空',
      content: '确定清空画布吗？不可恢复',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (res.confirm) {
          self.ctx.setFillStyle('#FFFFFF');
          self.ctx.fillRect(0, 0, 10000, 10000);
          self.ctx.draw();
          self.setData({ hasDrawn: false });
        }
      }
    });
  },

  onSave: function () {
    var self = this;
    wx.canvasToTempFilePath({
      canvasId: 'sketchCanvas',
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({ title: '已保存到相册', icon: 'success' });

            storage.addHistory({
              toolId: 'sketch',
              toolName: '简易画板',
              category: 'image',
              summary: '保存了一幅画',
              timestamp: Date.now()
            });
          },
          fail: function () {
            wx.showToast({ title: '保存失败，请授权', icon: 'none' });
          }
        });
      },
      fail: function () {
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    }, self);
  },

  onShareAppMessage: function () {
    return {
      title: '简易画板 - 工具箱',
      path: '/pages/tools/sketch/index'
    };
  }
});
