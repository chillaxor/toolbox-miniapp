var storage = require('../../../utils/storage.js');
var jokesUtil = require('../../../utils/jokes.js');

Page({
  data: {
    isFavorite: false,
    categories: [],
    currentCategory: '',
    joke: '',
    jokeCategory: '',
    isFavJoke: false,
    favCount: 0
  },

  onLoad: function () {
    this.checkFavorite();
    var categories = jokesUtil.getCategories();
    this.setData({ categories: categories, currentCategory: '' });
    this.randomJoke();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('jokes') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('jokes');
    this.setData({ isFavorite: fav });
  },

  randomJoke: function () {
    var result = jokesUtil.getRandomJoke(this.data.currentCategory);
    this.setData({
      joke: result.content,
      jokeCategory: result.category
    });
    this.checkJokeFav();
  },

  onCategoryTap: function (e) {
    var cat = e.currentTarget.dataset.cat;
    if (this.data.currentCategory === cat) {
      this.setData({ currentCategory: '' });
    } else {
      this.setData({ currentCategory: cat });
    }
    this.randomJoke();
  },

  onNextJoke: function () {
    this.randomJoke();
  },

  onFavJoke: function () {
    var favorites = wx.getStorageSync('toolbox_jokes_favorites') || [];
    var joke = this.data.joke;

    var exists = false;
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i] === joke) {
        exists = true;
        break;
      }
    }

    if (exists) {
      // 取消收藏
      favorites = favorites.filter(function (j) { return j !== joke; });
    } else {
      favorites.unshift(joke);
    }

    wx.setStorageSync('toolbox_jokes_favorites', favorites);
    this.setData({
      isFavJoke: !exists,
      favCount: favorites.length
    });
  },

  checkJokeFav: function () {
    var favorites = wx.getStorageSync('toolbox_jokes_favorites') || [];
    var joke = this.data.joke;
    var exists = false;
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i] === joke) {
        exists = true;
        break;
      }
    }
    this.setData({
      isFavJoke: exists,
      favCount: favorites.length
    });
  },

  onShareAppMessage: function () {
    return {
      title: '解压文案 - 来一条笑话',
      path: '/packages/moreTools/jokes/index'
    };
  }
});