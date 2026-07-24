var mediaCheck = require('../../../utils/mediaCheck.js');
var storage = require('../../../utils/storage.js');

var THEMES = [
  { name: '微信绿', bg: '#95EC69', text: '#000', self: '#FFFFFF' },
  { name: 'QQ蓝', bg: '#4A90D9', text: '#FFF', self: '#E8F0FE' },
  { name: '粉色少女', bg: '#FFB6C1', text: '#333', self: '#FFF0F5' },
  { name: '暗黑模式', bg: '#3A3A3C', text: '#FFF', self: '#1C1C1E' },
  { name: '清风蓝', bg: '#B0E0E6', text: '#333', self: '#F0F8FF' },
  { name: '暖橙', bg: '#FFD4A0', text: '#333', self: '#FFF8F0' }
];

// 导出 canvas 固定 600x600px（正方形）或跟随图片比例，最大边 800
var EXPORT_MAX = 800;

Page({
  data: {
    isFavorite: false,

    // 底图
    bgType: '',        // 'image' | 'color' | ''
    bgImage: '',
    bgColor: '#FFFFFF',
    previewW: 300,
    previewH: 300,
    exportW: 600,
    exportH: 600,

    // 文字输入
    textInput: '',
    fontSize: 24,
    fontSizeOptions: [16, 20, 24, 32, 40],
    textColor: '#FFFFFF',
    textColors: ['#FFFFFF', '#333333', '#E74C3C', '#FF6B35', '#F39C12', '#2ECC71', '#3498DB', '#9B59B6', '#FF69B4'],
    textPos: 'bottom',
    posOptions: [
      { id: 'top', name: '顶部', icon: '⬆️' },
      { id: 'center', name: '居中', icon: '⏺️' },
      { id: 'bottom', name: '底部', icon: '⬇️' }
    ],

    // 表情输入
    selectedEmoji: '',
    emojiList: [
      '😂', '🤣', '😭', '😅', '😍', '🥺', '😱', '🤔',
      '😤', '😏', '🥲', '😎', '🤡', '💀', '👻', '🗿',
      '🔥', '💯', '❤️', '💔', '👍', '✌️', '💪', '🙏',
      '🎉', '😈', '👀', '🐶', '🐱', '🐷', '🐸', '💩'
    ],
    emojiSize: 40,
    emojiSizeOptions: [24, 32, 40, 56, 72],
    emojiPos: 'bottom-right',
    emojiPosOptions: [
      { id: 'top-left', name: '左上', icon: '↖️' },
      { id: 'top-right', name: '右上', icon: '↗️' },
      { id: 'center', name: '居中', icon: '⏺️' },
      { id: 'bottom-left', name: '左下', icon: '↙️' },
      { id: 'bottom-right', name: '右下', icon: '↘️' }
    ],

    // 纯色
    pureBgColors: ['#FFFFFF', '#000000', '#FFE5D9', '#D8F5F3', '#D9F0DC', '#EFD9F7', '#FDE8E8', '#FFF3CD', '#E8DAEF', '#1A1A2E'],

    // 叠加层（预览用）
    textLayers: [],
    emojiLayers: [],

    // 历史 undo
    history: []
  },

  _idCounter: 0,

  onLoad: function () {
    this.checkFavorite();
    var sysInfo = wx.getSystemInfoSync();
    var screenW = sysInfo.windowWidth;
    var previewW = Math.min(screenW - 48, 340);
    this.setData({ previewW: previewW, previewH: previewW, exportW: previewW * 2, exportH: previewW * 2 });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('sticker') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('sticker');
    this.setData({ isFavorite: fav });
  },

  _nextId: function () {
    this._idCounter++;
    return this._idCounter;
  },

  _pushHistory: function () {
    var snap = {
      textLayers: JSON.parse(JSON.stringify(this.data.textLayers)),
      emojiLayers: JSON.parse(JSON.stringify(this.data.emojiLayers))
    };
    var h = this.data.history.slice();
    h.push(snap);
    if (h.length > 10) h = h.slice(h.length - 10);
    this.setData({ history: h });
  },

  // ========== 底图 ==========

  onChooseImage: function () {
    var self = this;
    mediaCheck.chooseImageWithCheck({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: function (res) {
        self._loadBgImage(res.tempFilePaths[0]);
      }
    });
  },

  onCameraCapture: function () {
    var self = this;
    mediaCheck.chooseImageWithCheck({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: function (res) {
        self._loadBgImage(res.tempFilePaths[0]);
      }
    });
  },

  _loadBgImage: function (filePath) {
    var self = this;
    wx.getImageInfo({
      src: filePath,
      success: function (info) {
        var previewW = self.data.previewW;
        var ratio = info.height / info.width;
        var h = Math.round(previewW * ratio);
        var maxH = 450;
        if (h > maxH) {
          h = maxH;
          previewW = Math.round(h / ratio);
        }
        // 导出尺寸：按比例放大，最大边 EXPORT_MAX
        var expW, expH;
        if (info.width >= info.height) {
          expW = Math.min(info.width, EXPORT_MAX);
          expH = Math.round(expW * (info.height / info.width));
        } else {
          expH = Math.min(info.height, EXPORT_MAX);
          expW = Math.round(expH * (info.width / info.height));
        }
        self.setData({
          bgType: 'image',
          bgImage: filePath,
          previewW: previewW,
          previewH: h,
          exportW: expW,
          exportH: expH,
          textLayers: [],
          emojiLayers: [],
          history: []
        });
      },
      fail: function () {
        wx.showToast({ title: '读取图片失败', icon: 'none' });
      }
    });
  },

  onPureBgSelect: function (e) {
    var color = e.currentTarget.dataset.color;
    var previewW = this.data.previewW;
    this.setData({
      bgType: 'color',
      bgColor: color,
      previewH: previewW,
      exportW: previewW * 2,
      exportH: previewW * 2,
      textLayers: [],
      emojiLayers: [],
      history: []
    });
  },

  // ========== 文字 ==========

  onTextInput: function (e) {
    this.setData({ textInput: e.detail.value });
  },

  onFontSizeSelect: function (e) {
    this.setData({ fontSize: Number(e.currentTarget.dataset.val) });
  },

  onTextColorSelect: function (e) {
    this.setData({ textColor: e.currentTarget.dataset.val });
  },

  onTextPosSelect: function (e) {
    this.setData({ textPos: e.currentTarget.dataset.val });
  },

  onAddText: function () {
    var text = this.data.textInput.trim();
    if (!text) {
      wx.showToast({ title: '请先输入文字', icon: 'none' });
      return;
    }
    this._pushHistory();
    var color = this.data.textColor;
    var isLight = (color === '#FFFFFF' || color === '#F39C12' || color === '#2ECC71');
    var strokeColor = isLight ? '#333333' : '#FFFFFF';
    var shadowColor = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';
    var layers = this.data.textLayers.slice();
    layers.push({
      id: this._nextId(),
      content: text,
      size: this.data.fontSize,
      color: color,
      strokeColor: strokeColor,
      shadowColor: shadowColor,
      pos: this.data.textPos
    });
    this.setData({ textLayers: layers });
    wx.showToast({ title: '文字已添加', icon: 'success' });
  },

  // ========== 表情 ==========

  onEmojiTap: function (e) {
    this.setData({ selectedEmoji: e.currentTarget.dataset.emoji });
  },

  onEmojiSizeSelect: function (e) {
    this.setData({ emojiSize: Number(e.currentTarget.dataset.val) });
  },

  onEmojiPosSelect: function (e) {
    this.setData({ emojiPos: e.currentTarget.dataset.val });
  },

  onAddEmoji: function () {
    if (!this.data.selectedEmoji) {
      wx.showToast({ title: '请先选择一个表情', icon: 'none' });
      return;
    }
    this._pushHistory();
    var layers = this.data.emojiLayers.slice();
    layers.push({
      id: this._nextId(),
      content: this.data.selectedEmoji,
      size: this.data.emojiSize,
      pos: this.data.emojiPos
    });
    this.setData({ emojiLayers: layers });
    wx.showToast({ title: '表情已添加', icon: 'success' });
  },

  // ========== 撤销 / 清空 ==========

  onUndo: function () {
    var h = this.data.history;
    if (!h.length) {
      wx.showToast({ title: '没有可撤销的操作', icon: 'none' });
      return;
    }
    var snap = h[h.length - 1];
    var newH = h.slice(0, h.length - 1);
    this.setData({
      textLayers: snap.textLayers,
      emojiLayers: snap.emojiLayers,
      history: newH
    });
  },

  onClearAll: function () {
    var self = this;
    wx.showModal({
      title: '确认清空',
      content: '清空所有文字和表情？',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (res.confirm) {
          self._pushHistory();
          self.setData({ textLayers: [], emojiLayers: [] });
        }
      }
    });
  },

  // ========== 保存（核心修复） ==========

  onSave: function () {
    var self = this;
    if (!this.data.bgType) {
      wx.showToast({ title: '请先选择底图', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '合成中...' });

    var ctx = wx.createCanvasContext('exportCanvas', self);
    var w = self.data.exportW;
    var h = self.data.exportH;

    // Step 1：先画底图，draw() 后再叠加文字/表情
    if (self.data.bgType === 'color') {
      ctx.setFillStyle(self.data.bgColor);
      ctx.fillRect(0, 0, w, h);
      // 纯色不需要等图片加载，直接 draw 后叠加
      ctx.draw(false, function () {
        self._drawTextAndEmoji(ctx, w, h, function () {
          ctx.draw(true, function () {         // true = 追加绘制，不清空底图
            setTimeout(function () {
              self._exportCanvas(w, h);
            }, 200);
          });
        });
      });
    } else {
      // 图片底图：drawImage 后 draw，确保图片渲染完再叠加
      ctx.drawImage(self.data.bgImage, 0, 0, w, h);
      ctx.draw(false, function () {
        self._drawTextAndEmoji(ctx, w, h, function () {
          ctx.draw(true, function () {
            setTimeout(function () {
              self._exportCanvas(w, h);
            }, 200);
          });
        });
      });
    }
  },

  // 绘制文字和表情（同步绘制指令，最后调 callback）
  _drawTextAndEmoji: function (ctx, w, h, callback) {
    var self = this;
    var scale = w / self.data.previewW;

    // 文字层
    var textLayers = self.data.textLayers;
    for (var i = 0; i < textLayers.length; i++) {
      var tl = textLayers[i];
      var fontSize = Math.round(tl.size * scale);
      ctx.setFontSize(fontSize);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');

      var x = w / 2;
      var y;
      if (tl.pos === 'top') {
        y = fontSize + Math.round(16 * scale);
      } else if (tl.pos === 'center') {
        y = h / 2;
      } else {
        y = h - fontSize - Math.round(16 * scale);
      }

      // 描边（让文字更清晰）
      ctx.setStrokeStyle(tl.strokeColor);
      ctx.setLineWidth(Math.max(2, Math.round(2 * scale)));
      ctx.strokeText(tl.content, x, y);

      // 填色
      ctx.setFillStyle(tl.color);
      ctx.fillText(tl.content, x, y);
    }

    // 表情层
    var emojiLayers = self.data.emojiLayers;
    for (var j = 0; j < emojiLayers.length; j++) {
      var el = emojiLayers[j];
      var eSize = Math.round(el.size * scale);
      ctx.setFontSize(eSize);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');

      var ex, ey;
      var margin = eSize / 2 + Math.round(12 * scale);
      var pos = el.pos;
      if (pos === 'top-left') {
        ex = margin; ey = margin;
      } else if (pos === 'top-right') {
        ex = w - margin; ey = margin;
      } else if (pos === 'bottom-left') {
        ex = margin; ey = h - margin;
      } else if (pos === 'bottom-right') {
        ex = w - margin; ey = h - margin;
      } else {
        ex = w / 2; ey = h / 2;
      }

      ctx.setFillStyle('#000');  // emoji 不需要颜色，但 setFillStyle 要有值
      ctx.fillText(el.content, ex, ey);
    }

    if (callback) callback();
  },

  // 导出并保存
  _exportCanvas: function (w, h) {
    var self = this;
    wx.canvasToTempFilePath({
      canvasId: 'exportCanvas',
      x: 0,
      y: 0,
      width: w,
      height: h,
      destWidth: w,
      destHeight: h,
      fileType: 'png',
      quality: 1,
      success: function (res) {
        wx.hideLoading();
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({ title: '已保存到相册 🎉', icon: 'success', duration: 2000 });
            storage.addHistory({
              toolId: 'sticker',
              toolName: '表情包制作',
              category: 'image',
              summary: '制作了一个表情包',
              timestamp: Date.now()
            });
          },
          fail: function () {
            wx.hideLoading();
            wx.showModal({
              title: '保存失败',
              content: '请在设置中授权访问相册',
              showCancel: false
            });
          }
        });
      },
      fail: function (err) {
        wx.hideLoading();
        wx.showToast({ title: '导出失败: ' + (err.errMsg || ''), icon: 'none' });
      }
    }, self);
  },

  onShareAppMessage: function () {
    return {
      title: '表情包制作 - 工具箱',
      path: '/packages/imgTools/sticker/index'
    };
  }
});
