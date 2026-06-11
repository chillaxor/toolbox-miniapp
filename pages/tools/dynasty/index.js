var dynastyData = require('../../../utils/dynasty-data.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    currentTab: 'timeline',
    dynasties: [],
    expandedIndex: -1,
    // 排序游戏
    sortStarted: false,
    sortFinished: false,
    sortItems: [],
    sortAnswer: [],
    sortResult: '',
    sortScore: 0,
    // 问答
    quizStarted: false,
    quizFinished: false,
    quizIndex: 0,
    quizTotal: 10,
    quizScore: 0,
    quizCorrect: 0,
    quizQuestions: [],
    quizSelected: '',
    quizShowResult: false,
    quizIsCorrect: false,
    isFavorite: false
  },

  onLoad: function () {
    this.setData({ dynasties: dynastyData.DYNASTIES });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('dynasty') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('dynasty');
    this.setData({ isFavorite: fav });
  },

  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  toggleExpand: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({ expandedIndex: this.data.expandedIndex === idx ? -1 : idx });
  },

  // ============ 排序游戏 ============
  startSort: function () {
    var all = dynastyData.DYNASTIES.slice();
    this.shuffleArray(all);
    var items = all.slice(0, 8).map(function (d) {
      return { name: d.name, period: d.period, selected: false };
    });
    var answer = items.map(function (item) { return item.name; });
    this.setData({
      sortStarted: true,
      sortFinished: false,
      sortItems: items,
      sortAnswer: answer,
      sortResult: '',
      sortScore: 0
    });
  },

  selectSortItem: function (e) {
    var idx = e.currentTarget.dataset.index;
    var items = this.data.sortItems;
    if (items[idx].selected) {
      items[idx].selected = false;
      this.setData({ sortItems: items });
      return;
    }
    items[idx].selected = true;
    this.setData({ sortItems: items });

    // 检查是否全部选中
    var allSelected = items.every(function (item) { return item.selected; });
    if (allSelected) {
      this.checkSortAnswer();
    }
  },

  checkSortAnswer: function () {
    var items = this.data.sortItems;
    var correct = true;
    for (var i = 0; i < items.length - 1; i++) {
      var idx1 = this.findDynastyIndex(items[i].name);
      var idx2 = this.findDynastyIndex(items[i + 1].name);
      if (idx1 > idx2) {
        correct = false;
        break;
      }
    }
    var score = correct ? 100 : 0;
    this.setData({
      sortFinished: true,
      sortResult: correct ? '排序正确！' : '排序有误，请重试',
      sortScore: score
    });
    if (correct) {
      wx.vibrateShort({ type: 'light' });
    } else {
      wx.vibrateShort({ type: 'heavy' });
    }
  },

  findDynastyIndex: function (name) {
    var dynasties = dynastyData.DYNASTIES;
    for (var i = 0; i < dynasties.length; i++) {
      if (dynasties[i].name === name) return i;
    }
    return -1;
  },

  retrySort: function () {
    this.startSort();
  },

  closeSort: function () {
    this.setData({ sortStarted: false, sortFinished: false });
  },

  // ============ 历史问答 ============
  startQuiz: function () {
    var questions = dynastyData.QUIZ_QUESTIONS.slice();
    this.shuffleArray(questions);
    var selected = questions.slice(0, 10);
    this.setData({
      quizStarted: true,
      quizFinished: false,
      quizIndex: 0,
      quizScore: 0,
      quizCorrect: 0,
      quizQuestions: selected,
      quizSelected: '',
      quizShowResult: false,
      quizIsCorrect: false
    });
  },

  selectQuizOption: function (e) {
    if (this.data.quizShowResult) return;
    var option = e.currentTarget.dataset.option;
    var q = this.data.quizQuestions[this.data.quizIndex];
    var isCorrect = option === q.answer;
    var correct = this.data.quizCorrect + (isCorrect ? 1 : 0);
    var score = Math.round(correct / this.data.quizTotal * 100);
    wx.vibrateShort({ type: isCorrect ? 'light' : 'heavy' });
    this.setData({
      quizSelected: option,
      quizShowResult: true,
      quizIsCorrect: isCorrect,
      quizCorrect: correct,
      quizScore: score
    });
  },

  nextQuiz: function () {
    var next = this.data.quizIndex + 1;
    if (next >= this.data.quizTotal) {
      this.setData({
        quizFinished: true,
        quizScore: Math.round(this.data.quizCorrect / this.data.quizTotal * 100)
      });
      return;
    }
    this.setData({
      quizIndex: next,
      quizSelected: '',
      quizShowResult: false,
      quizIsCorrect: false
    });
  },

  retryQuiz: function () {
    this.startQuiz();
  },

  closeQuiz: function () {
    this.setData({ quizStarted: false, quizFinished: false });
  },

  shuffleArray: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  },

  onShareAppMessage: function () {
    return {
      title: '📜 历史朝代表 - 中国历史时间轴',
      path: '/pages/tools/dynasty/index'
    };
  }
});
