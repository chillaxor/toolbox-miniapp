var geoData = require('../../../utils/geo-data.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    started: false,
    finished: false,
    index: 0,
    total: 10,
    score: 0,
    correct: 0,
    questions: [],
    selected: '',
    showResult: false,
    isCorrect: false,
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('geo-quiz') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('geo-quiz');
    this.setData({ isFavorite: fav });
  },

  startQuiz: function () {
    var questions = geoData.GEO_QUESTIONS.slice();
    this.shuffleArray(questions);
    var selected = questions.slice(0, 10);
    this.setData({
      started: true,
      finished: false,
      index: 0,
      score: 0,
      correct: 0,
      questions: selected,
      selected: '',
      showResult: false,
      isCorrect: false
    });
  },

  selectOption: function (e) {
    if (this.data.showResult) return;
    var option = e.currentTarget.dataset.option;
    var q = this.data.questions[this.data.index];
    var isCorrect = option === q.answer;
    var correct = this.data.correct + (isCorrect ? 1 : 0);
    var score = Math.round(correct / this.data.total * 100);
    wx.vibrateShort({ type: isCorrect ? 'light' : 'heavy' });
    this.setData({
      selected: option,
      showResult: true,
      isCorrect: isCorrect,
      correct: correct,
      score: score
    });
  },

  nextQuestion: function () {
    var next = this.data.index + 1;
    if (next >= this.data.total) {
      this.setData({
        finished: true,
        score: Math.round(this.data.correct / this.data.total * 100)
      });
      return;
    }
    this.setData({
      index: next,
      selected: '',
      showResult: false,
      isCorrect: false
    });
  },

  retry: function () {
    this.startQuiz();
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
      title: '🌍 地理知识问答',
      path: '/pages/tools/geo-quiz/index'
    };
  }
});
