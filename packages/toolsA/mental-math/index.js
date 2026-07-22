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
    selectedOps: ['+', '-'],  // 改为数组支持多选
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
    var initialOps = this.data.selectedOps;
    for (var key in OP_LABELS) {
      if (key !== 'mix') {  // 移除混合选项，改为多选
        opTypes.push({
          value: key,
          label: OP_LABELS[key],
          selected: initialOps.indexOf(key) > -1
        });
      }
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
    var idx = parseInt(e.currentTarget.dataset.index);
    var opTypes = this.data.opTypes.slice();
    var selectedCount = opTypes.filter(function (o) { return o.selected; }).length;

    // 至少保留一个运算类型
    if (opTypes[idx].selected && selectedCount <= 1) {
      wx.showToast({ title: '至少选择一种运算', icon: 'none' });
      return;
    }

    opTypes[idx].selected = !opTypes[idx].selected;
    this.setData({ opTypes: opTypes });
  },

  onTimeSelect: function (e) {
    this.setData({ timeMode: parseInt(e.currentTarget.dataset.value) });
  },

  onStart: function () {
    // 从 opTypes 派生选中的运算类型数组
    var selectedOps = this.data.opTypes
      .filter(function (o) { return o.selected; })
      .map(function (o) { return o.value; });

    this.setData({
      selectedOps: selectedOps,
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
    var selectedOps = this.data.selectedOps;
    var config = GRADE_CONFIG[grade];
    var maxNum = config.maxNum;
    
    // 随机选择运算类型
    var op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
    var a, b, c, answer, expression, missingPos;
    
    // 70%概率生成普通题型，30%概率生成填括号题型
    var isBracketQuestion = Math.random() > 0.7;
    
    // 20%概率生成混合运算题
    var isMixedOperation = Math.random() > 0.8;
    
    if (isMixedOperation && (op === '+' || op === '-')) {
      // 生成混合运算题，如: 10 + (?) - 5 = 15
      a = Math.floor(Math.random() * maxNum) + 1;
      c = Math.floor(Math.random() * maxNum) + 1;
      answer = Math.floor(Math.random() * maxNum) + 1;
      
      if (op === '+') {
        // a + (?) - c = answer → (?) = answer + c - a
        var result = answer + c - a;
        if (result > 0) {
          expression = a + ' + (?) - ' + c + ' = ' + answer;
          answer = result;
        } else {
          // 如果结果为负数，生成普通题
          isMixedOperation = false;
        }
      } else {
        // a - (?) + c = answer → (?) = a + c - answer
        var result = a + c - answer;
        if (result > 0) {
          expression = a + ' - (?) + ' + c + ' = ' + answer;
          answer = result;
        } else {
          // 如果结果为负数，生成普通题
          isMixedOperation = false;
        }
      }
    }
    
    if (!isMixedOperation) {
      if (op === '+') {
        if (isBracketQuestion) {
          // answer 统一存 (?) 的值（用户应填的数），右侧结果单独计算
          missingPos = Math.random() > 0.5 ? 'left' : 'right';
          if (missingPos === 'left') {
            answer = Math.floor(Math.random() * maxNum) + 1;     // (?) 值
            b = Math.floor(Math.random() * maxNum) + 1;
            expression = '(?) + ' + b + ' = ' + (answer + b);
          } else {
            a = Math.floor(Math.random() * maxNum) + 1;
            answer = Math.floor(Math.random() * maxNum) + 1;     // (?) 值
            expression = a + ' + (?) = ' + (a + answer);
          }
        } else {
          a = Math.floor(Math.random() * maxNum) + 1;
          b = Math.floor(Math.random() * maxNum) + 1;
          answer = a + b;
          expression = a + ' + ' + b + ' = ?';
        }
      } else if (op === '-') {
        if (isBracketQuestion) {
          missingPos = Math.random() > 0.5 ? 'middle' : 'left';
          if (missingPos === 'middle') {
            a = Math.floor(Math.random() * maxNum) + 1;
            answer = Math.floor(Math.random() * a);              // (?) 值，0..a-1
            expression = a + ' - (?) = ' + (a - answer);
          } else {
            b = Math.floor(Math.random() * maxNum) + 1;
            answer = b + Math.floor(Math.random() * maxNum) + 1; // (?) 值，>= b+1
            expression = '(?) - ' + b + ' = ' + (answer - b);
          }
        } else {
          a = Math.floor(Math.random() * maxNum) + 1;
          b = Math.floor(Math.random() * a) + 1;
          answer = a - b;
          expression = a + ' - ' + b + ' = ?';
        }
      } else if (op === '*') {
        var maxMul = grade <= 3 ? 9 : 99;
        if (isBracketQuestion) {
          missingPos = Math.random() > 0.5 ? 'left' : 'right';
          if (missingPos === 'left') {
            b = Math.floor(Math.random() * maxMul) + 1;
            answer = Math.floor(Math.random() * maxMul) + 1;     // (?) 值
            expression = '(?) × ' + b + ' = ' + (answer * b);
          } else {
            a = Math.floor(Math.random() * maxMul) + 1;
            answer = Math.floor(Math.random() * maxMul) + 1;     // (?) 值
            expression = a + ' × (?) = ' + (a * answer);
          }
        } else {
          a = Math.floor(Math.random() * maxMul) + 1;
          b = Math.floor(Math.random() * maxMul) + 1;
          answer = a * b;
          expression = a + ' × ' + b + ' = ?';
        }
      } else if (op === '/') {
        var maxDiv = grade <= 4 ? 9 : 99;
        if (isBracketQuestion) {
          missingPos = Math.random() > 0.5 ? 'left' : 'middle';
          if (missingPos === 'left') {
            // (?) ÷ b = 结果 → (?) = 结果 × b
            b = Math.floor(Math.random() * maxDiv) + 1;
            var rhsL = Math.floor(Math.random() * maxDiv) + 1;   // 右侧结果
            answer = rhsL * b;                                   // (?) 值
            expression = '(?) ÷ ' + b + ' = ' + rhsL;
          } else {
            // a ÷ (?) = 结果 → (?) = a / 结果，a 必为 结果 × (?)
            var rhsM = Math.floor(Math.random() * maxDiv) + 1;   // 右侧结果
            answer = Math.floor(Math.random() * maxDiv) + 1;     // (?) 值
            a = rhsM * answer;
            expression = a + ' ÷ (?) = ' + rhsM;
          }
        } else {
          b = Math.floor(Math.random() * maxDiv) + 1;
          answer = Math.floor(Math.random() * maxDiv) + 1;
          a = b * answer;
          expression = a + ' ÷ ' + b + ' = ?';
        }
      }
    }

    return {
      op: op,
      opLabel: OP_LABELS[op],
      answer: answer,
      expression: expression
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
    // 防止键盘 confirm 与按钮点击在 600ms 反馈期内重复提交
    if (this.data.isCorrect !== null) return;

    var userAnswer = this.data.userAnswer.trim();
    if (userAnswer === '') {
      wx.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    var numAnswer = Number(userAnswer);
    var correct = numAnswer === Number(this.data.question.answer);
    var questionExpr = this.data.question.expression.replace('(?)', userAnswer);

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
          expression: this.data.question.expression.replace('(?)', '___'),
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
      path: '/packages/toolsA/mental-math/index'
    };
  }
});