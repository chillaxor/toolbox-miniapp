var storage = require('../../../utils/storage.js');
var quotesUtil = require('../../../utils/quotes.js');

Page({
  data: {
    isFavorite: false,
    categories: [],
    currentCategory: '',
    todayQuote: {},
    quote: {},
    isFavQuote: false,
    favList: [],
    showFavList: false,
    totalCount: 0
  },

  onLoad: function () {
    this.checkFavorite();
    var categories = quotesUtil.getCategories();
    var todayQuote = quotesUtil.getTodayQuote();
    var totalCount = quotesUtil.getTotalCount();
    this.setData({
      categories: categories,
      currentCategory: '',
      todayQuote: todayQuote,
      totalCount: totalCount
    });
    this.randomQuote();
  },

  onShow: function () {
    this.checkFavorite();
    this.loadFavList();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('dailyquote') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('dailyquote');
    this.setData({ isFavorite: fav });
  },

  randomQuote: function () {
    var result = quotesUtil.getRandomQuote(this.data.currentCategory);
    this.setData({ quote: result });
    this.checkQuoteFav();
  },

  onCategoryTap: function (e) {
    var cat = e.currentTarget.dataset.cat;
    this.setData({ currentCategory: cat });
    this.randomQuote();
  },

  onNextQuote: function () {
    this.randomQuote();
  },

  onCopyQuote: function () {
    var q = this.data.quote;
    var text = '"' + q.content + '" —— ' + q.author;
    wx.setClipboardData({
      data: text,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  onFavQuote: function () {
    var favorites = wx.getStorageSync('toolbox_quotes_favorites') || [];
    var q = this.data.quote;
    var key = q.content + '|' + q.author;
    var exists = false;
    var idx = -1;
    for (var i = 0; i < favorites.length; i++) {
      var k = favorites[i].content + '|' + favorites[i].author;
      if (k === key) {
        exists = true;
        idx = i;
        break;
      }
    }

    if (exists) {
      favorites.splice(idx, 1);
    } else {
      favorites.unshift({ content: q.content, author: q.author, category: q.category });
    }

    wx.setStorageSync('toolbox_quotes_favorites', favorites);
    this.setData({
      isFavQuote: !exists,
      favList: favorites
    });
  },

  checkQuoteFav: function () {
    var favorites = wx.getStorageSync('toolbox_quotes_favorites') || [];
    var q = this.data.quote;
    if (!q || !q.content) return;
    var key = q.content + '|' + q.author;
    var exists = false;
    for (var i = 0; i < favorites.length; i++) {
      var k = favorites[i].content + '|' + favorites[i].author;
      if (k === key) {
        exists = true;
        break;
      }
    }
    this.setData({ isFavQuote: exists });
  },

  loadFavList: function () {
    var favorites = wx.getStorageSync('toolbox_quotes_favorites') || [];
    this.setData({ favList: favorites });
  },

  toggleFavList: function () {
    this.setData({ showFavList: !this.data.showFavList });
  },

  onRemoveFav: function (e) {
    var idx = e.currentTarget.dataset.index;
    var favorites = wx.getStorageSync('toolbox_quotes_favorites') || [];
    favorites.splice(idx, 1);
    wx.setStorageSync('toolbox_quotes_favorites', favorites);
    this.setData({ favList: favorites });
    this.checkQuoteFav();
  },

  onShareQuote: function () {
    var q = this.data.quote;
    wx.showShareMenu({ withShareTicket: true });
  },

  onShareAppMessage: function () {
    var q = this.data.quote;
    return {
      title: '「' + q.content + '」—— ' + q.author,
      path: '/pages/tools/dailyquote/index'
    };
  }
});
