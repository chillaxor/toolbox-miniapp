var storage = require('../../../utils/storage.js');

var THEMES = [
  { name: 'pink', color: '#ff6ec7', label: '粉霓虹' },
  { name: 'blue', color: '#00d4ff', label: '蓝霓虹' },
  { name: 'green', color: '#39ff14', label: '绿霓虹' },
  { name: 'purple', color: '#bf00ff', label: '紫霓虹' },
  { name: 'orange', color: '#ff6600', label: '橙霓虹' },
  { name: 'white', color: '#ffffff', label: '白霓虹' }
];

var ANIMATIONS = [
  { name: 'flicker', label: '闪烁' },
  { name: 'pulse', label: '呼吸' },
  { name: 'rainbow', label: '彩虹' },
  { name: 'wave', label: '波浪' }
];

Page({
  data: {
    isFavorite: false,
    inputText: 'Hello Neon',
    selectedTheme: 0,
    selectedAnimation: 0,
    fontSize: 48,
    isFullscreen: false,
    chars: [],
    themes: THEMES,
    animations: ANIMATIONS,
    currentColor: THEMES[0].color
  },

  onLoad: function () {
    this.checkFavorite();
    this._buildChars();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('neontext') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('neontext') });
  },

  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value });
    this._buildChars();
  },

  onThemeSelect: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({
      selectedTheme: idx,
      currentColor: THEMES[idx].color
    });
  },

  onAnimationSelect: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({ selectedAnimation: idx });
  },

  onFontSizeChange: function (e) {
    this.setData({ fontSize: e.detail.value });
  },

  enterFullscreen: function () {
    if (!this.data.inputText.trim()) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    this.setData({ isFullscreen: true });
  },

  exitFullscreen: function () {
    this.setData({ isFullscreen: false });
  },

  _buildChars: function () {
    var text = this.data.inputText || '';
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      chars.push({
        char: text[i],
        delay: (i * 0.08).toFixed(2)
      });
    }
    this.setData({ chars: chars });
  },

  saveImage: function () {
    var self = this;
    var text = this.data.inputText;
    if (!text.trim()) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var query = wx.createSelectorQuery();
    query.select('#neonCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          wx.hideLoading();
          wx.showToast({ title: '画布初始化失败', icon: 'none' });
          return;
        }

        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio || 2;
        var width = 750;
        var height = 500;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Black background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        var color = self.data.currentColor;
        var fontSize = self.data.fontSize * 1.5;
        ctx.font = 'bold ' + fontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Multiple shadow layers for realistic neon glow
        var layers = [
          { blur: 82, alpha: 0.3 },
          { blur: 42, alpha: 0.5 },
          { blur: 21, alpha: 0.7 },
          { blur: 10, alpha: 0.9 },
          { blur: 7, alpha: 1 }
        ];

        for (var i = 0; i < layers.length; i++) {
          ctx.shadowColor = color;
          ctx.shadowBlur = layers[i].blur;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = 'rgba(255,255,255,' + layers[i].alpha + ')';
          ctx.fillText(text, width / 2, height / 2);
        }

        // Final bright pass
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, width / 2, height / 2);

        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
          width: width * dpr,
          height: height * dpr,
          destWidth: width * 2,
          destHeight: height * 2,
          fileType: 'png',
          success: function (tmpRes) {
            wx.saveImageToPhotosAlbum({
              filePath: tmpRes.tempFilePath,
              success: function () {
                wx.hideLoading();
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function () {
                wx.hideLoading();
                wx.showToast({ title: '保存失败', icon: 'none' });
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
      title: '流光文字 - 炫酷霓虹灯效果',
      path: '/packages/toolsB/neontext/index'
    };
  }
});
