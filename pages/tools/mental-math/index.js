var storage = require('../../../utils/storage.js');

var GRADE_CONFIG = {
  1: { name: '一年级', maxNum: 20, ops: ['+', '-'], timeLimit: [60, 0] },
  2: { name: '二年级', maxNum: 100, ops: ['+', '-'], timeLimit: [60, 0] },
  3: { name: '三年级', maxNum: 1000, ops: ['+', '-', '*'], timeLimit: [60, 0] },
  4: { name: '四年级', maxNum: 10000, ops: ['+', '-', '*', '/'], timeLimit: [60, 0] },
  5: { name: '五年级', maxNum: 100000, ops: ['+', '-', '*', '/'], timeLimit: [60, 0] },
  6: { name: '六年级', maxNum: 1000000, ops: ['+', '-', '*', '/'], timeLimit: [60, 0] }
};

var OP_LABELS = {
  '+': '加法',
  '-': '减法',
  '*': '乘法',
  '/': '除法',
  'mix': '混合'
};

Page({
  data: {
    page: 'setup',       // setup | playing | result
    grade: 1,
    opType: 'mix',
    timeMode: 60,
    grades: [],
    opTypes: [],
    timeModes: [
      { value: 60, label: '60秒' },
      { value: 120, label: '120秒' },
      { value: 0, label: '不限时' }
    ],
    question: null,
    userAnswer: '',
    questionNum: 0,
    correctNum: 0,
    wrongNum: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: 0,
    timeUsed: 0,
    timer: null,
    isCorrect: null,
    wrongList: [],
    resultSummary: null,
    isFavorite: false
  },

  onLoad: function () {
    var grades = [];
    for (var i = 1; i <= 6; i++) {
      grades.push({ value: i, label: GRADE_CONFIG[i].name });
    }
    var opTypes = [];
    for (var key in OP_LABELS) {
      opTypes.push({ value: key, label: OP_LABELS[key] });
    }
    this.setData({ grades: grades, opTypes: opTypes });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    this.clearTimer();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('mental-math') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('mental-math');
    this.setData({ isFavorite: fav });
  },

  onGradeSelect: function (e) {
    this.setData({ grade: parseInt(e.currentTarget.dataset.value) });
  },

  onOpSelect: function (e) {
    this.setData({ opType: e.currentTarget.dataset.value });
  },

  onTimeSelect: function (e) {
    this.setData({ timeMode: parseInt(e.currentTarget.dataset.value) });
  },

  onStart: function () {
    this.setData({
      page: 'playing',
      questionNum: 0,
      correctNum: 0,
      wrongNum: 0,
      streak: 0,
      bestStreak: 0,
      timeLeft: this.data.timeMode,
      timeUsed: 0,
      wrongList: [],
      userAnswer: '',
      isCorrect: null
    });
    this.nextQuestion();
    if (this.data.timeMode > 0) {
      this.startTimer();
    }
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
      self.setData({ timeLeft: left, timeUsed: self.data.timeUsed + 1 });
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
    var grade = this.data.grade;
    var opType = this.data.opType;
    var config = GRADE_CONFIG[grade];
    var maxNum = config.maxNum;
    var ops = opType === 'mix' ? config.ops : [opType];

    var op = ops[Math.floor(Math.random() * ops.length)];
    var a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      // ensure a > b for positive result
      if (a < b) { var t = a; a = b; b = t; answer = a - b; }
    } else if (op === '*') {
      var maxMul = grade <= 3 ? 9 : 99;
      a = Math.floor(Math.random() * maxMul) + 1;
      b = Math.floor(Math.random() * maxMul) + 1;
      answer = a * b;
    } else if (op === '/') {
      var maxDiv = grade <= 4 ? 9 : 99;
      b = Math.floor(Math.random() * maxDiv) + 1;
      answer = Math.floor(Math.random() * maxDiv) + 1;
      a = b * answer;
    }

    return {
      a: a,
      b: b,
      op: op,
      opLabel: OP_LABELS[op],
      answer: answer,
      expression: a + ' ' + op + ' ' + b + ' = ?'
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

    var numAnswer = parseFloat(userAnswer);
    var correct = numAnswer === this.data.question.answer;

    if (correct) {
      var newStreak = this.data.streak + 1;
      this.setData({
        correctNum: this.data.correctNum + 1,
        streak: newStreak,
        bestStreak: Math.max(newStreak, this.data.bestStreak),
        isCorrect: true
      });
    } else {
      this.setData({
        wrongNum: this.data.wrongNum + 1,
        streak: 0,
        isCorrect: false,
        wrongList: this.data.wrongList.concat([{
          expression: this.data.question.a + ' ' + this.data.question.op + ' ' + this.data.question.b,
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
    var timeUsed = this.data.timeMode > 0 ? this.data.timeMode - this.data.timeLeft : this.data.questionNum * 3;

    var summary = {
      total: total,
      correct: this.data.correctNum,
      wrong: this.data.wrongNum,
      accuracy: accuracy,
      bestStreak: this.data.bestStreak,
      timeUsed: timeUsed,
      grade: GRADE_CONFIG[this.data.grade].name
    };

    this.setData({
      page: 'result',
      resultSummary: summary
    });

    this.recordHistory(summary);
  },

  recordHistory: function (summary) {
    storage.addHistory({
      toolId: 'mental-math',
      toolName: '口算练习机',
      category: 'study',
      summary: summary.grade + ' 做了' + summary.total + '题 正确率' + summary.accuracy + '%',
      timestamp: Date.now()
    });
  },

  onRetry: function () {
    this.onStart();
  },

  onBackSetup: function () {
    this.setData({ page: 'setup' });
  },

  onReviewWrong: function () {
    if (this.data.wrongList.length === 0) return;
    // restart with wrong questions only
    wx.showModal({
      title: '错题重练',
      content: '共有 ' + this.data.wrongList.length + ' 道错题，开始重练？',
      success: function (res) {
        if (res.confirm) {
          wx.showToast({ title: '错题重练功能开发中', icon: 'none' });
        }
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '口算练习机 - 每天练一练，数学更简单',
      path: '/pages/tools/mental-math/index'
    };
  }
});
