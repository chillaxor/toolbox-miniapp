var storage = require('../../../utils/storage.js');
var poetryData = require('../../../utils/tang-poetry-data.js');

Page({
  data: {
    page: 'home',        // home | list | detail | recite | fill | appreciation | result
    categories: [],
    selectedCategory: '全部',
    poemList: [],
    currentPoem: null,
    currentIndex: 0,
    totalPoems: 0,
    isFavorite: false,
    // 背诵模式
    hiddenLines: [],
    showAll: false,
    // 填空模式
    fillBlanks: [],
    userInputs: [],
    // 赏析模式
    showAppreciation: false,
    // 结果
    correctNum: 0,
    wrongNum: 0,
    resultSummary: null,
    // 统计
    totalRead: 0,
    totalRecite: 0
  },

  onLoad: function () {
    var cats = poetryData.getCategories();
    this.setData({
      categories: ['全部'].concat(cats),
      totalRead: storage.getHistory().filter(function (h) { return h.toolId === 'tang-poetry'; }).length || 0
    });
    this.checkFavorite();
    this.loadPoems('全部');
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('tang-poetry') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('tang-poetry');
    this.setData({ isFavorite: fav });
  },

  loadPoems: function (category) {
    var poems = poetryData.getPoemsByCategory(category);
    var shuffled = poems.slice().sort(function () { return Math.random() - 0.5; });
    this.setData({
      selectedCategory: category,
      poemList: shuffled,
      totalPoems: shuffled.length
    });
  },

  onCategorySelect: function (e) {
    var cat = e.currentTarget.dataset.category;
    this.loadPoems(cat);
    this.setData({ page: 'list' });
  },

  onBrowseAll: function () {
    this.loadPoems('全部');
    this.setData({ page: 'list' });
  },

  onRandomPoem: function () {
    var poems = poetryData.POEMS;
    var idx = Math.floor(Math.random() * poems.length);
    var poem = poems[idx];
    this.setData({
      currentPoem: poem,
      currentIndex: idx,
      page: 'detail',
      hiddenLines: [],
      showAll: false,
      showAppreciation: false
    });
  },

  onPoemTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var poem = this.data.poemList[idx];
    this.setData({
      currentPoem: poem,
      currentIndex: idx,
      page: 'detail',
      hiddenLines: [],
      showAll: false,
      showAppreciation: false
    });
  },

  onStartRecite: function () {
    var poem = this.data.currentPoem;
    var hidden = [];
    for (var i = 0; i < poem.lines.length; i++) {
      hidden.push(i % 2 === 1);
    }
    if (Math.random() > 0.5) {
      hidden = hidden.map(function () { return Math.random() > 0.5; });
    }
    this.setData({
      page: 'recite',
      hiddenLines: hidden,
      showAll: false
    });
  },

  onShowAll: function () {
    this.setData({ showAll: true });
  },

  onToggleLine: function (e) {
    var idx = e.currentTarget.dataset.index;
    var hidden = this.data.hiddenLines.slice();
    hidden[idx] = !hidden[idx];
    this.setData({ hiddenLines: hidden });
  },

  onStartFill: function () {
    var poem = this.data.currentPoem;
    var blanks = [];
    for (var i = 0; i < poem.lines.length; i++) {
      var line = poem.lines[i];
      var keyword = poem.keywords[i] || '';
      if (keyword && line.indexOf(keyword) >= 0) {
        blanks.push({ line: line, keyword: keyword, blank: line.replace(keyword, '____') });
      } else {
        blanks.push({ line: line, keyword: '', blank: line });
      }
    }
    this.setData({
      page: 'fill',
      fillBlanks: blanks,
      userInputs: blanks.map(function () { return ''; }),
      correctNum: 0,
      wrongNum: 0
    });
  },

  onFillInput: function (e) {
    var idx = e.currentTarget.dataset.index;
    var inputs = this.data.userInputs.slice();
    inputs[idx] = e.detail.value;
    this.setData({ userInputs: inputs });
  },

  onSubmitFill: function () {
    var correct = 0;
    var wrong = 0;
    for (var i = 0; i < this.data.fillBlanks.length; i++) {
      var blank = this.data.fillBlanks[i];
      if (blank.keyword) {
        var userAns = (this.data.userInputs[i] || '').trim();
        if (userAns === blank.keyword) {
          correct++;
        } else {
          wrong++;
        }
      }
    }
    var total = correct + wrong;
    this.setData({
      correctNum: correct,
      wrongNum: wrong,
      page: 'result',
      resultSummary: {
        title: this.data.currentPoem.title,
        author: this.data.currentPoem.author,
        dynasty: this.data.currentPoem.dynasty,
        total: total,
        correct: correct,
        wrong: wrong,
        accuracy: total > 0 ? Math.round(correct / total * 100) : 0
      }
    });
    storage.addHistory({
      toolId: 'tang-poetry',
      toolName: '唐诗三百首',
      category: 'study',
      summary: '默写《' + this.data.currentPoem.title + '》正确' + correct + '/' + total,
      timestamp: Date.now()
    });
  },

  onCheckRecite: function () {
    this.setData({
      page: 'result',
      resultSummary: {
        title: this.data.currentPoem.title,
        author: this.data.currentPoem.author,
        dynasty: this.data.currentPoem.dynasty,
        total: this.data.currentPoem.lines.length,
        correct: this.data.currentPoem.lines.length,
        wrong: 0,
        accuracy: 100
      }
    });
    storage.addHistory({
      toolId: 'tang-poetry',
      toolName: '唐诗三百首',
      category: 'study',
      summary: '背诵《' + this.data.currentPoem.title + '》',
      timestamp: Date.now()
    });
  },

  onShowAppreciation: function () {
    this.setData({
      page: 'appreciation',
      showAppreciation: true
    });
  },

  onRetry: function () {
    if (this.data.page === 'result' && this.data.resultSummary.wrong > 0) {
      this.onStartFill();
    } else {
      this.setData({ page: 'detail', hiddenLines: [], showAll: false });
    }
  },

  onNextPoem: function () {
    var list = this.data.poemList;
    var nextIdx = (this.data.currentIndex + 1) % list.length;
    var poem = list[nextIdx];
    this.setData({
      currentPoem: poem,
      currentIndex: nextIdx,
      page: 'detail',
      hiddenLines: [],
      showAll: false,
      showAppreciation: false
    });
  },

  onBackHome: function () {
    this.setData({ page: 'home' });
  },

  onBackList: function () {
    this.setData({ page: 'list' });
  },

  onBackDetail: function () {
    this.setData({ page: 'detail' });
  },

  onShareAppMessage: function () {
    return {
      title: '唐诗三百首 - 背诵·填空·赏析',
      path: '/packages/moreTools/tang-poetry/index'
    };
  }
});
