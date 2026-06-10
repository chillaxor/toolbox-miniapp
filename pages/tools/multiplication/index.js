var storage = require('../../../utils/storage.js');

Page({
  data: {
    page: 'table',       // table | quiz | result
    mode: 'browse',      // browse | quiz | speed
    table: [],
    question: null,
    userAnswer: '',
    questionNum: 0,
    correctNum: 0,
    wrongNum: 0,
    timeLeft: 60,
    timer: null,
    isCorrect: null,
    wrongList: [],
    resultSummary: null,
    barColor: '#27AE60',
    detailBarStyle: '',
    isFavorite: false,
    highlightedRow: -1,
    highlightedCol: -1
  },

  onLoad: function () {
    this.buildTable();
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    this.clearTimer();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('multiplication') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('multiplication');
    this.setData({ isFavorite: fav });
  },

  buildTable: function () {
    var table = [];
    for (var i = 1; i <= 9; i++) {
      var row = [];
      for (var j = 1; j <= i; j++) {
        row.push({
          a: j,
          b: i,
          result: j * i,
          text: j + ' × ' + i + ' = ' + (j * i)
        });
      }
      table.push({ row: i, items: row });
    }
    this.setData({ table: table });
  },

  onSwitchMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.clearTimer();
    this.setData({ page: 'table', mode: mode });
    if (mode === 'quiz') {
      this.startQuiz();
    } else if (mode === 'speed') {
      this.startSpeed();
    }
  },

  onCellTap: function (e) {
    var row = parseInt(e.currentTarget.dataset.row);
    var col = parseInt(e.currentTarget.dataset.col);
    this.setData({ highlightedRow: row, highlightedCol: col });
    wx.showToast({
      title: col + ' × ' + row + ' = ' + (col * row),
      icon: 'none',
      duration: 1500
    });
  },

  startQuiz: function () {
    this.setData({
      page: 'quiz',
      questionNum: 0,
      correctNum: 0,
      wrongNum: 0,
      wrongList: [],
      userAnswer: '',
      isCorrect: null
    });
    this.nextQuestion();
  },

  startSpeed: function () {
    this.setData({
      page: 'quiz',
      mode: 'speed',
      questionNum: 0,
      correctNum: 0,
      wrongNum: 0,
      timeLeft: 60,
      wrongList: [],
      userAnswer: '',
      isCorrect: null
    });
    this.nextQuestion();
    this.startTimer();
  },

  startTimer: function () {
    var self = this;
    var timer = setInterval(function () {
      var left = self.data.timeLeft - 1;
      if (left <= 0) {
        self.clearTimer();
        self.finishPractice();
        return;
      }
      self.setData({ timeLeft: left });
    }, 1000);
    this.setData({ timer: timer });
  },

  clearTimer: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  generateQuestion: function () {
    var a = Math.floor(Math.random() * 9) + 1;
    var b = Math.floor(Math.random() * 9) + 1;
    return {
      a: a,
      b: b,
      answer: a * b,
      expression: a + ' × ' + b + ' = ?'
    };
  },

  nextQuestion: function () {
    var q = this.generateQuestion();
    this.setData({
      question: q,
      userAnswer: '',
      isCorrect: null,
      questionNum: this.data.questionNum + 1
    });
  },

  onAnswerInput: function (e) {
    this.setData({ userAnswer: e.detail.value });
  },

  onSubmit: function () {
    var userAnswer = this.data.userAnswer.trim();
    if (userAnswer === '') {
      wx.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    var numAnswer = parseInt(userAnswer);
    var correct = numAnswer === this.data.question.answer;

    if (correct) {
      this.setData({ correctNum: this.data.correctNum + 1, isCorrect: true });
    } else {
      this.setData({
        wrongNum: this.data.wrongNum + 1,
        isCorrect: false,
        wrongList: this.data.wrongList.concat([{
          expression: this.data.question.a + ' × ' + this.data.question.b,
          yourAnswer: userAnswer,
          correctAnswer: this.data.question.answer
        }])
      });
    }

    var self = this;
    setTimeout(function () {
      self.nextQuestion();
    }, 600);
  },

  onFinish: function () {
    this.clearTimer();
    this.finishPractice();
  },

  finishPractice: function () {
    var total = this.data.correctNum + this.data.wrongNum;
    var accuracy = total > 0 ? Math.round(this.data.correctNum / total * 100) : 0;

    var summary = {
      total: total,
      correct: this.data.correctNum,
      wrong: this.data.wrongNum,
      accuracy: accuracy,
      mode: this.data.mode === 'speed' ? '速度测试' : '抽查练习'
    };

    var color = accuracy >= 80 ? '#27AE60' : (accuracy >= 60 ? '#F39C12' : '#E74C3C');
    var barStyle = 'width: ' + accuracy + '%; background-color: ' + color + ';';
    this.setData({ page: 'result', resultSummary: summary, barColor: color, detailBarStyle: barStyle });
    this.recordHistory(summary);
  },

  recordHistory: function (summary) {
    storage.addHistory({
      toolId: 'multiplication',
      toolName: '乘法口诀表',
      category: 'study',
      summary: summary.mode + ' 做了' + summary.total + '题 正确率' + summary.accuracy + '%',
      timestamp: Date.now()
    });
  },

  onRetry: function () {
    if (this.data.mode === 'speed') {
      this.startSpeed();
    } else {
      this.startQuiz();
    }
  },

  onBackTable: function () {
    this.clearTimer();
    this.setData({ page: 'table', mode: 'browse' });
  },

  onShareAppMessage: function () {
    return {
      title: '乘法口诀表 - 背熟九九表，数学没烦恼',
      path: '/pages/tools/multiplication/index'
    };
  }
});
