var storage = require('../../../utils/storage.js');

var CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

Page({
  data: {
    isFavorite: false,
    length: 16,
    useUpper: true,
    useLower: true,
    useNumber: true,
    useSymbol: true,
    password: '',
    copied: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.generate();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('password') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('password');
    this.setData({ isFavorite: fav });
  },

  onLengthChange: function (e) {
    this.setData({ length: Number(e.detail.value) });
    this.generate();
  },

  onToggleOption: function (e) {
    var type = e.currentTarget.dataset.type;
    var key = 'use' + type.charAt(0).toUpperCase() + type.slice(1);
    var current = this.data[key];
    // 至少保留一个选项
    var trueCount = 0;
    if (this.data.useUpper) trueCount++;
    if (this.data.useLower) trueCount++;
    if (this.data.useNumber) trueCount++;
    if (this.data.useSymbol) trueCount++;
    if (current && trueCount <= 1) return;
    var obj = {};
    obj[key] = !current;
    this.setData(obj);
    this.generate();
  },

  generate: function () {
    var pool = '';
    if (this.data.useUpper) pool += CHARS.upper;
    if (this.data.useLower) pool += CHARS.lower;
    if (this.data.useNumber) pool += CHARS.number;
    if (this.data.useSymbol) pool += CHARS.symbol;
    if (!pool) return;

    var password = '';
    for (var i = 0; i < this.data.length; i++) {
      password += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    this.setData({ password: password, copied: false });
  },

  onGenerate: function () {
    this.generate();
  },

  onCopy: function () {
    var self = this;
    wx.setClipboardData({
      data: this.data.password,
      success: function () {
        self.setData({ copied: true });
        storage.addHistory({
          toolId: 'password',
          toolName: '密码生成器',
          category: 'text',
          summary: '生成' + self.data.length + '位密码',
          timestamp: Date.now()
        });
      }
    });
  },

  onShareAppMessage: function () {
    return { title: '密码生成器 - 工具箱', path: '/pages/tools/password/index' };
  }
});
