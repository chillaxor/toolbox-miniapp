var DEFAULT_DATA = require('./links.js');

var GITEE_RAW = 'https://gitee.com/b64882/qian_data/raw/master/links.json';
var JSDELIVR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/links.json';
var CACHE_KEY = 'linknav_data';

Page({
  data: {
    categories: [],
    activeCategory: '',
    keyword: '',
    displayLinks: [],
    isEmpty: true,
    loading: true,
    popup: { show: false, name: '', url: '' }
  },

  onLoad: function () {
    var flags = (getApp().globalData && getApp().globalData.featureFlags) || {};
    if (flags.linknav === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var cached = null;
    try { cached = wx.getStorageSync(CACHE_KEY); } catch (e) {}
    var src = (cached && cached.categories && cached.categories.length) ? cached : DEFAULT_DATA;
    this.applyData(src);
    this.loadRemote();
  },

  applyData: function (data) {
    var cats = (data && data.categories) || [];
    var active = cats.length ? cats[0].name : '';
    this.setData({ categories: cats, activeCategory: active, loading: false });
    this.recompute();
  },

  loadRemote: function () {
    var self = this;
    function tryLoad(url, isMirror) {
      wx.request({
        url: url,
        method: 'GET',
        timeout: 8000,
        success: function (res) {
          if (res && res.statusCode === 200 && res.data) {
            var d = res.data;
            if (typeof d === 'string') {
              try { d = JSON.parse(d); } catch (e) { d = null; }
            }
            if (d && d.categories && d.categories.length) {
              try { wx.setStorageSync(CACHE_KEY, d); } catch (e) {}
              self.applyData(d);
              return;
            }
          }
          if (!isMirror) tryLoad(JSDELIVR, true);
        },
        fail: function () {
          if (!isMirror) tryLoad(JSDELIVR, true);
        }
      });
    }
    tryLoad(GITEE_RAW, false);
  },

  recompute: function () {
    var cats = this.data.categories;
    var kw = (this.data.keyword || '').trim();
    var active = this.data.activeCategory;
    var list = [];
    if (kw) {
      cats.forEach(function (c) {
        (c.links || []).forEach(function (l) {
          if (l.name.indexOf(kw) >= 0 || l.url.indexOf(kw) >= 0) list.push(l);
        });
      });
    } else {
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].name === active) { list = cats[i].links || []; break; }
      }
    }
    this.setData({ displayLinks: list, isEmpty: list.length === 0 });
  },

  switchCategory: function (e) {
    var name = e.currentTarget.dataset.name;
    if (name === this.data.activeCategory) return;
    this.setData({ activeCategory: name });
    this.recompute();
  },

  onSearch: function (e) {
    this.setData({ keyword: e.detail.value });
    this.recompute();
  },

  tapLink: function (e) {
    var ds = e.currentTarget.dataset;
    this.setData({ popup: { show: true, name: ds.name, url: ds.url } });
  },

  copyLink: function () {
    var url = this.data.popup.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success: function () { wx.showToast({ title: '已复制网址', icon: 'success' }); }
    });
  },

  closePopup: function () {
    this.setData({ popup: { show: false, name: '', url: '' } });
  },

  // 阻止弹窗内点击冒泡到遮罩关闭
  stopTap: function () {}
});
