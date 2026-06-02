var storage = require('../../../utils/storage.js');

Page({
  data: {
    stars: [],
    showModal: false,
    wishText: '',
    selectedTag: '🏮 新年',
    tags: ['🏮 新年', '💰 财运', '💕 桃花', '💪 健康', '📚 学业', '🏢 事业', '🏠 家庭', '✨ 其他'],
    wishes: [],
    lanternFloat: false
  },

  _nextId: 1,

  onLoad: function () {
    // 生成星空
    var stars = [];
    for (var i = 0; i < 50; i++) {
      stars.push({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 60),
        delay: (Math.random() * 3).toFixed(1)
      });
    }
    var wishes = wx.getStorageSync('newyear_wishes') || [];
    var maxId = 0;
    for (var i = 0; i < wishes.length; i++) {
      if (wishes[i].id > maxId) maxId = wishes[i].id;
    }
    this._nextId = maxId + 1;
    this.setData({ stars: stars, wishes: wishes });
  },

  makeWish: function () {
    this.setData({ showModal: true, wishText: '', selectedTag: '🏮 新年' });
  },

  closeModal: function () {
    this.setData({ showModal: false });
  },

  onWishInput: function (e) {
    this.setData({ wishText: e.detail.value });
  },

  selectTag: function (e) {
    this.setData({ selectedTag: e.currentTarget.dataset.tag });
  },

  submitWish: function () {
    var text = this.data.wishText.trim();
    if (!text) {
      wx.showToast({ title: '请写下你的心愿', icon: 'none' });
      return;
    }

    var now = new Date();
    var timeStr = now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    var wish = {
      id: this._nextId++,
      text: text,
      tag: this.data.selectedTag,
      lights: 0,
      time: timeStr
    };

    var wishes = this.data.wishes;
    wishes.unshift(wish);
    wx.setStorageSync('newyear_wishes', wishes);

    this.setData({
      wishes: wishes,
      showModal: false,
      lanternFloat: true
    });

    var self = this;
    setTimeout(function () {
      self.setData({ lanternFloat: false });
      wx.showToast({ title: '心愿已放飞 🎆', icon: 'none' });
    }, 2000);
  },

  lightWish: function (e) {
    var id = e.currentTarget.dataset.id;
    var wishes = this.data.wishes;
    for (var i = 0; i < wishes.length; i++) {
      if (wishes[i].id === id) {
        wishes[i].lights++;
        break;
      }
    }
    wx.setStorageSync('newyear_wishes', wishes);
    this.setData({ wishes: wishes });
  },

  deleteWish: function (e) {
    var id = e.currentTarget.dataset.id;
    var wishes = this.data.wishes.filter(function (w) { return w.id !== id; });
    wx.setStorageSync('newyear_wishes', wishes);
    this.setData({ wishes: wishes });
  },

  onShareAppMessage: function () {
    return { title: '新年许愿 - 放飞你的心愿灯笼', path: '/pages/tools/newyearwish/index' };
  }
});