var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    bgImage: '',
    canvasW: 300,
    canvasH: 300,

    // 文字相关
    textInput: '',
    fontSize: 24,
    fontSizeOptions: [16, 20, 24, 32, 40],
    textColor: '#FFFFFF',
    textColors: ['#FFFFFF', '#333333', '#E74C3C', '#FF6B35', '#F39C12', '#45B058', '#3498DB', '#9B59B6', '#FF69B4'],
    textPos: 'bottom',
    posOptions: [
      { id: 'top', name: '顶部', icon: '⬆️' },
      { id: 'center', name: '居中', icon: '⏺️' },
      { id: 'bottom', name: '底部', icon: '⬇️' }
    ],

    // 表情相关
    selectedEmoji: '',
    emojiList: [
      '😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😤',
      '😱', '🥺', '😭', '🤡', '💀', '👻', '🎉', '🔥',
      '💯', '❤️', '💔', '👍', '👎', '✌️', '🤝', '💪',
      '🙏', '😈', '👀', '🗿', '🐶', '🐱', '🐷', '💩'
    ],
    emojiSize: 40,
    emojiSizeOptions: [24, 32, 40, 56, 72],
    emojiPos: 'center',
    emojiPosOptions: [
      { id: 'top-left', name: '左上', icon: '↖️' },
      { id: 'top-right', name: '右上', icon: '↗️' },
      { id: 'center', name: '居中', icon: '⏺️' },
      { id: 'bottom-left', name: '左下', icon: '↙️' },
      { id: 'bottom-right', name: '右下', icon: '↘️' }
    ],

    // 纯色底图
    pureBgColors: ['#FFFFFF', '#000000', '#FFE5D9', '#D8F5F3', '#D9F0DC', '#EFD9F7', '#FDE8E8', '#FFF3CD', '#E8DAEF', '#D5F5E3'],

    // 历史
    historyList: []
  },

  // 画布上已绘制的元素列表
  elements: [],

  onLoad: function () {
    this.checkFavorite();
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

  // ========== 底图选择 ==========

  onChooseImage: function () {
    var self = this;
    wx.chooseImage({
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
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: function (res) {
        self._loadBgImage(res.tempFilePaths[0]);
      }
    });
  },

  onPureBgSelect: function (e) {
    var color = e.currentTarget.dataset.color;
    this.setData({
      bgImage: color,
      canvasW: 300,
      canvasH: 300
    });
    this.elements = [];
    this._renderCanvas();
  },

  _loadBgImage: function (filePath) {
    var self = this;
    wx.getImageInfo({
      src: filePath,
      success: function (info) {
        // 计算画布尺寸，保持图片比例，最大宽300
        var maxW = 300;
        var ratio = info.height / info.width;
        var w = Math.min(maxW, info.width);
        var h = Math.round(w * ratio);
        if (h > 400) {
          h = 400;
          w = Math.round(h / ratio);
        }

        self.setData({
          bgImage: filePath,
          canvasW: w,
          canvasH: h
        });
        self.elements = [];

        // 延迟确保 canvas 已渲染
        setTimeout(function () {
          self._renderCanvas();
        }, 100);
      }
    });
  },

  // ========== 文字操作 ==========

  onTextInput: function (e) {
    this.setData({ textInput: e.detail.value });
  },

  onFontSizeSelect: function (e) {
    this.setData({ fontSize: Number(e.currentTarget.dataset.size) });
  },

  onTextColorSelect: function (e) {
    this.setData({ textColor: e.currentTarget.dataset.color });
  },

  onTextPosSelect: function (e) {
    this.setData({ textPos: e.currentTarget.dataset.pos });
  },

  onAddText: function () {
    var text = this.data.textInput.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字内容', icon: 'none' });
      return;
    }

    this.elements.push({
      type: 'text',
      content: text,
      fontSize: this.data.fontSize,
      color: this.data.textColor,
      position: this.data.textPos
    });

    this._renderCanvas();
    wx.showToast({ title: '文字已添加', icon: 'success' });
  },

  // ========== 表情操作 ==========

  onEmojiSelect: function (e) {
    this.setData({ selectedEmoji: e.currentTarget.dataset.emoji });
  },

  onEmojiSizeSelect: function (e) {
    this.setData({ emojiSize: Number(e.currentTarget.dataset.size) });
  },

  onEmojiPosSelect: function (e) {
    this.setData({ emojiPos: e.currentTarget.dataset.pos });
  },

  onAddEmoji: function () {
    if (!this.data.selectedEmoji) {
      wx.showToast({ title: '请先选择表情', icon: 'none' });
      return;
    }

    this.elements.push({
      type: 'emoji',
      content: this.data.selectedEmoji,
      size: this.data.emojiSize,
      position: this.data.emojiPos
    });

    this._renderCanvas();
    wx.showToast({ title: '表情已添加', icon: 'success' });
  },

  // ========== 画布渲染 ==========

  _renderCanvas: function () {
    var self = this;
    if (!this.data.bgImage) return;

    var ctx = wx.createCanvasContext('stickerCanvas', this);
    var w = this.data.canvasW;
    var h = this.data.canvasH;

    // 绘制底图
    var isColor = this.data.bgImage.charAt(0) === '#';
    if (isColor) {
      ctx.setFillStyle(this.data.bgImage);
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.drawImage(this.data.bgImage, 0, 0, w, h);
    }

    // 绘制已添加的元素
    var elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.type === 'text') {
        self._drawText(ctx, el, w, h);
      } else if (el.type === 'emoji') {
        self._drawEmoji(ctx, el, w, h);
      }
    }

    ctx.draw();
  },

  _drawText: function (ctx, el, w, h) {
    var scale = w / 300;
    var fontSize = el.fontSize * scale;
    ctx.setFontSize(fontSize);
    ctx.setFillStyle(el.color);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');

    // 添加文字描边，增强可读性
    ctx.setStrokeStyle(el.color === '#FFFFFF' ? '#333333' : '#FFFFFF');
    ctx.setLineWidth(2 * scale);

    var x = w / 2;
    var y;
    if (el.position === 'top') {
      y = fontSize + 10 * scale;
    } else if (el.position === 'center') {
      y = h / 2;
    } else {
      y = h - fontSize - 10 * scale;
    }

    ctx.strokeText(el.content, x, y);
    ctx.fillText(el.content, x, y);
  },

  _drawEmoji: function (ctx, el, w, h) {
    var scale = w / 300;
    var size = el.size * scale;
    ctx.setFontSize(size);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');

    var x, y;
    var margin = size / 2 + 8 * scale;
    switch (el.position) {
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = w - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = h - margin;
        break;
      case 'bottom-right':
        x = w - margin;
        y = h - margin;
        break;
      default:
        x = w / 2;
        y = h / 2;
    }

    ctx.fillText(el.content, x, y);
  },

  // ========== 操作 ==========

  onClearCanvas: function () {
    var self = this;
    wx.showModal({
      title: '确认清空',
      content: '确定清空画布吗？已添加的文字和表情将被移除',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (res.confirm) {
          self.elements = [];
          self._renderCanvas();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  onSaveSticker: function () {
    var self = this;
    wx.showLoading({ title: '生成中...' });

    wx.canvasToTempFilePath({
      canvasId: 'stickerCanvas',
      fileType: 'png',
      quality: 1,
      success: function (res) {
        wx.hideLoading();

        // 保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({ title: '已保存到相册', icon: 'success' });

            // 记录历史
            storage.addHistory({
              toolId: 'sticker',
              toolName: '表情包制作',
              category: 'image',
              summary: '制作了一个自定义表情包',
              timestamp: Date.now()
            });

            // 保存到本次会话历史
            var list = self.data.historyList.slice();
            list.unshift(res.tempFilePath);
            if (list.length > 9) list = list.slice(0, 9);
            self.setData({ historyList: list });
          },
          fail: function () {
            wx.showToast({ title: '保存失败，请授权相册', icon: 'none' });
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    }, self);
  },

  onShareAppMessage: function () {
    return {
      title: '表情包制作 - 工具箱',
      path: '/pages/tools/sticker/index'
    };
  }
});
