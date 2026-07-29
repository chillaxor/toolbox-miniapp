var storage = require('../../../utils/storage.js');
var calc = require('./calc.js');

var EMOJIS = ['🍪', '🥛', '🧻', '🍬', '🧃', '🍜', '🧴', '🍎'];
var NAMES = ['商品A', '商品B', '商品C'];

function blankItem(idx) {
  return {
    emoji: EMOJIS[idx % EMOJIS.length],
    emojiIdx: idx % EMOJIS.length,
    name: NAMES[idx],
    price: '',
    amount: '',
    unit: 'g',
    multi: '1',
    showMulti: false,
    cls: ''            // 结果态卡片样式（win / lose / shake）
  };
}

Page({
  data: {
    items: [blankItem(0), blankItem(1)],
    unitList: [
      { key: 'g', label: 'g' },
      { key: 'kg', label: 'kg' },
      { key: 'jin', label: '斤' },
      { key: 'ml', label: 'ml' },
      { key: 'L', label: 'L' },
      { key: 'ge', label: '个' }
    ],
    canCompare: false,
    hintText: '',        // 输入不全/跨组时的温柔提示
    comparing: false,    // 称重动画中
    result: null,        // calc.compare 的返回
    showWhy: false,
    isFavorite: false
  },

  onLoad: function () {
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.unitprice !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('unitprice') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('unitprice');
    this.setData({ isFavorite: fav });
  },

  /* ============ 输入 ============ */

  onEmojiTap: function (e) {
    var i = e.currentTarget.dataset.idx;
    var items = this.data.items;
    var next = (items[i].emojiIdx + 1) % EMOJIS.length;
    items[i].emojiIdx = next;
    items[i].emoji = EMOJIS[next];
    this.setData({ items: items });
  },

  onPriceInput: function (e) {
    this.updateField(e.currentTarget.dataset.idx, 'price', e.detail.value);
  },

  onAmountInput: function (e) {
    this.updateField(e.currentTarget.dataset.idx, 'amount', e.detail.value);
  },

  onMultiInput: function (e) {
    this.updateField(e.currentTarget.dataset.idx, 'multi', e.detail.value);
  },

  updateField: function (i, field, value) {
    var items = this.data.items;
    items[i][field] = value;
    this.setData({ items: items });
    this.refreshCanCompare();
  },

  onUnitTap: function (e) {
    var i = e.currentTarget.dataset.idx;
    var key = e.currentTarget.dataset.unit;
    var items = this.data.items;
    items[i].unit = key;
    // 切到「个」时收起乘法开关没必要，保留
    this.setData({ items: items });
    this.refreshCanCompare();
  },

  onMultiToggle: function (e) {
    var i = e.currentTarget.dataset.idx;
    var items = this.data.items;
    items[i].showMulti = !items[i].showMulti;
    if (!items[i].showMulti) items[i].multi = '1';
    this.setData({ items: items });
    this.refreshCanCompare();
  },

  onAddItem: function () {
    if (this.data.items.length >= 3) return;
    var items = this.data.items;
    items.push(blankItem(items.length));
    this.setData({ items: items });
    this.refreshCanCompare();
  },

  onRemoveItem: function (e) {
    var i = e.currentTarget.dataset.idx;
    var items = this.data.items;
    if (items.length <= 2) return;
    items.splice(i, 1);
    // 重排名字
    for (var k = 0; k < items.length; k++) items[k].name = NAMES[k];
    this.setData({ items: items });
    this.refreshCanCompare();
  },

  refreshCanCompare: function () {
    var items = this.data.items;
    var ok = true;
    for (var i = 0; i < items.length; i++) {
      var p = parseFloat(items[i].price);
      var a = parseFloat(items[i].amount);
      if (isNaN(p) || p <= 0 || isNaN(a) || a <= 0) { ok = false; break; }
      if (items[i].showMulti) {
        var m = parseInt(items[i].multi, 10);
        if (isNaN(m) || m < 1) { ok = false; break; }
      }
    }
    // 清掉旧结果，让用户改完数字重新比
    this.setData({ canCompare: ok, hintText: ok ? '' : this.data.hintText });
  },

  /* ============ 比一比 ============ */

  onCompare: function () {
    if (!this.data.canCompare || this.data.comparing) {
      if (!this.data.canCompare) this.setData({ hintText: '还差一个数字哦，把价格和分量都填好～' });
      return;
    }
    var payload = this.data.items.map(function (it) {
      return {
        price: it.price,
        amount: it.amount,
        unit: it.unit,
        multi: it.showMulti ? (parseInt(it.multi, 10) || 1) : 1,
        emoji: it.emoji,
        name: it.name
      };
    });
    var res = calc.compare(payload);
    if (!res.ok) {
      this.setData({ hintText: res.msg, result: null });
      return;
    }

    // 称重动画：卡片摇摆 0.6s 后出结果
    var items = this.data.items;
    items.forEach(function (it) { it.cls = 'shake'; });
    this.setData({ items: items, comparing: true, hintText: '', result: null, showWhy: false });

    var self = this;
    setTimeout(function () {
      var its = self.data.items;
      its.forEach(function (it, idx) {
        if (res.verdict === 'win') {
          it.cls = idx === res.winnerIdx ? 'win' : 'lose';
        } else {
          it.cls = 'tie';
        }
      });
      // 每张卡的单价角标
      for (var r = 0; r < res.rows.length; r++) {
        its[res.rows[r].idx].perBaseText = res.rows[r].perBaseText;
      }
      self.setData({ items: its, comparing: false, result: res });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
    }, 600);
  },

  onToggleWhy: function () {
    this.setData({ showWhy: !this.data.showWhy });
  },

  onReset: function () {
    this.setData({
      items: [blankItem(0), blankItem(1)],
      canCompare: false,
      hintText: '',
      comparing: false,
      result: null,
      showWhy: false
    });
  }
});
