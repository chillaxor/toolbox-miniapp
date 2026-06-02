/*
 * @Author: chillaxor chenxinbin@linghit.com
 * @Date: 2026-06-02 16:24:37
 * @LastEditors: chillaxor chenxinbin@linghit.com
 * @LastEditTime: 2026-06-02 16:25:01
 * @FilePath: \toolbox-miniapp\pages\tools\chatbubble\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var storage = require('../../../utils/storage.js');

var THEMES = [
  { name: '微信绿', bg: '#95EC69', text: '#000', self: '#FFFFFF' },
  { name: 'QQ蓝', bg: '#4A90D9', text: '#FFF', self: '#E8F0FE' },
  { name: '粉色少女', bg: '#FFB6C1', text: '#333', self: '#FFF0F5' },
  { name: '暗黑模式', bg: '#3A3A3C', text: '#FFF', self: '#1C1C1E' },
  { name: '清风蓝', bg: '#B0E0E6', text: '#333', self: '#F0F8FF' },
  { name: '暖橙', bg: '#FFD4A0', text: '#333', self: '#FFF8F0' }
];

Page({
  data: {
    leftName: '好友',
    rightName: '我',
    messages: [],
    inputName: 'right',
    inputText: '',
    themeIdx: 0,
    themes: THEMES,
    isFavorite: false
  },

  onLoad: function () {
    this.setData({
      messages: [
        { side: 'left', name: '好友', text: '你好呀！', time: '10:30' },
        { side: 'right', name: '我', text: '你好~最近怎么样？', time: '10:31' }
      ]
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('chatbubble') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('chatbubble');
    this.setData({ isFavorite: fav });
  },

  onLeftNameInput: function (e) {
    this.setData({ leftName: e.detail.value || '好友' });
  },

  onRightNameInput: function (e) {
    this.setData({ rightName: e.detail.value || '我' });
  },

  onTextInput: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  onSelectSide: function (e) {
    this.setData({ inputName: e.currentTarget.dataset.side });
  },

  onThemeChange: function (e) {
    this.setData({ themeIdx: parseInt(e.detail.value) });
  },

  onAddMessage: function () {
    var text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入消息内容', icon: 'none' });
      return;
    }
    var side = this.data.inputName;
    var name = side === 'left' ? this.data.leftName : this.data.rightName;
    var now = new Date();
    var time = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    var msg = { side: side, name: name, text: text, time: time };
    var messages = this.data.messages.concat([msg]);
    this.setData({ messages: messages, inputText: '' });
  },

  onDeleteMessage: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var messages = this.data.messages;
    messages.splice(idx, 1);
    this.setData({ messages: messages });
  },

  onClearAll: function () {
    this.setData({ messages: [] });
  },

  saveChatImage: function () {
    var self = this;
    if (this.data.messages.length === 0) {
      wx.showToast({ title: '没有消息可保存', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成截图...' });

    var theme = THEMES[this.data.themeIdx];
    var msgs = this.data.messages;
    var cw = 750;
    var lineH = 60;
    var padX = 40;
    var padY = 40;
    var ch = padY * 2 + msgs.length * lineH + 60;
    ch = Math.max(ch, 400);

    var ctx = wx.createCanvasContext('chatbubble-canvas', this);

    // 背景
    ctx.setFillStyle(theme.self);
    ctx.fillRect(0, 0, cw, ch);

    // 消息
    var y = padY;
    for (var i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var isLeft = msg.side === 'left';
      var bubbleW = Math.min(500, msg.text.length * 32 + 60);
      var bubbleH = lineH - 10;
      var bx = isLeft ? padX : cw - padX - bubbleW;

      // 气泡
      ctx.setFillStyle(isLeft ? theme.bg : '#FFFFFF');
      ctx.fillRect(bx, y, bubbleW, bubbleH);

      // 名字
      ctx.setFillStyle(theme.text);
      ctx.setFontSize(18);
      ctx.fillText(msg.name, bx + 16, y + 20);

      // 文字
      ctx.setFontSize(26);
      ctx.fillText(msg.text, bx + 16, y + 46);

      // 时间
      ctx.setFillStyle('rgba(0,0,0,0.3)');
      ctx.setFontSize(14);
      ctx.fillText(msg.time, bx + bubbleW - 60, y + 20);

      y += lineH;
    }

    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'chatbubble-canvas',
          quality: 1,
          success: function (res) {
            wx.hideLoading();
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function () {
                wx.showToast({ title: '保存失败，请授权', icon: 'none' });
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
      title: '聊天气泡生成器 - 工具箱',
      path: '/pages/tools/chatbubble/index'
    };
  }
});
