var storage = require('../../../utils/storage.js');
var mathData = require('../../../utils/math-formulas-data.js');

Page({
  data: {
    page: 'home',        // home | list | detail
    levels: [],
    currentLevel: '小学',
    categories: [],
    currentCategory: '',
    formulaList: [],
    currentFormula: null,
    searchKey: '',
    searchResults: [],
    isSearching: false,
    isFavorite: false
  },

  onLoad: function () {
    var levels = mathData.getLevels();
    this.setData({ levels: levels });
    this.checkFavorite();
    this.selectLevel('小学');
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('math-formulas') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('math-formulas');
    this.setData({ isFavorite: fav });
  },

  selectLevel: function (level) {
    var cats = mathData.getCategoriesByLevel(level);
    this.setData({
      currentLevel: level,
      categories: cats,
      currentCategory: cats[0] || '',
      page: 'home'
    });
    this.loadFormulas(level, cats[0] || '');
  },

  onLevelTap: function (e) {
    var level = e.currentTarget.dataset.level;
    this.selectLevel(level);
  },

  onCategoryTap: function (e) {
    var cat = e.currentTarget.dataset.category;
    this.setData({ currentCategory: cat });
    this.loadFormulas(this.data.currentLevel, cat);
    this.setData({ page: 'list' });
  },

  loadFormulas: function (level, category) {
    var formulas = mathData.getFormulas(level, category);
    this.setData({
      formulaList: formulas
    });
  },

  onFormulaTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var formula = this.data.formulaList[idx];
    this.setData({
      currentFormula: formula,
      page: 'detail'
    });
    storage.addHistory({
      toolId: 'math-formulas',
      toolName: '数学公式大全',
      category: 'study',
      summary: '查看公式：' + formula.name,
      timestamp: Date.now()
    });
  },

  onSearchInput: function (e) {
    var key = e.detail.value;
    this.setData({ searchKey: key });
    if (key.trim()) {
      var results = mathData.searchFormulas(key.trim());
      this.setData({
        searchResults: results,
        isSearching: true
      });
    } else {
      this.setData({
        searchResults: [],
        isSearching: false
      });
    }
  },

  onSearchResultTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var formula = this.data.searchResults[idx];
    this.setData({
      currentFormula: formula,
      page: 'detail',
      isSearching: false,
      searchKey: ''
    });
  },

  onSearchClear: function () {
    this.setData({
      searchKey: '',
      searchResults: [],
      isSearching: false
    });
  },

  onBackHome: function () {
    this.setData({ page: 'home', isSearching: false, searchKey: '' });
  },

  onBackList: function () {
    this.setData({ page: 'list' });
  },

  onShareAppMessage: function () {
    return {
      title: '数学公式大全 - 小学到高中公式速查',
      path: '/pages/tools/math-formulas/index'
    };
  }
});
