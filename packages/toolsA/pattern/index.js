var storage = require('../../../utils/storage.js');
var gen = require('./generator.js');

var LEVEL_LABELS = { 1: '入门 ⭐', 2: '进阶 ⭐⭐', 3: '挑战 ⭐⭐⭐' };

Page({
  data: {
    page: 'setup', // setup | playing | result
    // 设置
    level: 1,
    mode: 'choice', // choice | input
    total: 10,
    levels: [
      { value: 1, label: '入门 ⭐', desc: '等差数列·挖末尾' },
      { value: 2, label: '进阶 ⭐⭐', desc: '等比·双数列·差递增' },
      { value: 3, label: '挑战 ⭐⭐⭐', desc: '斐波那契·平方数·循环' }
    ],
    modes: [
      { value: 'choice', label: '选择题' },
      { value: 'input', label: '填空题' }
    ],
    totals: [5, 10, 15],
    // 答题
    question: null,
    cards: [],           // 预计算的卡片 [{v, cls, mark, showMark}]
    optionItems: [],     // 选择模式 [{v, cls}]
    userAnswer: '',
    questionNum: 0,
    correctNum: 0,
    wrongNum: 0,
    streak: 0,
    bestStreak: 0,
    wrongTries: 0,       // 当前题已错次数
    decided: false,      // 当前题是否已计入对/错
    revealed: false,     // 是否已揭示（答对或三错）
    solvedByFail: false, // 三错揭示（显示手动下一题按钮）
    feedbackText: '',
    feedbackOk: null,
    hintText: '',
    wrongList: [],
    typeStats: [],
    resultSummary: null,
    isFavorite: false,
    autoTimer: null
  },

  onLoad: function () {
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.pattern !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    if (this.data.autoTimer) clearTimeout(this.data.autoTimer);
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('pattern') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('pattern');
    this.setData({ isFavorite: fav });
  },

  /* ============ 设置 ============ */

  onLevelSelect: function (e) {
    this.setData({ level: parseInt(e.currentTarget.dataset.value) });
  },

  onModeSelect: function (e) {
    this.setData({ mode: e.currentTarget.dataset.value });
  },

  onTotalSelect: function (e) {
    this.setData({ total: parseInt(e.currentTarget.dataset.value) });
  },

  onStart: function () {
    // 类型轮转队列：洗一份该难度的类型池
    this.typeQueue = this.shuffledPool();
    this.statMap = {};
    this.setData({
      page: 'playing',
      questionNum: 0,
      correctNum: 0,
      wrongNum: 0,
      streak: 0,
      bestStreak: 0,
      wrongList: [],
      typeStats: []
    });
    this.nextQuestion();
  },

  shuffledPool: function () {
    var pool = gen.TYPE_POOLS[this.data.level].slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool;
  },

  nextType: function () {
    if (!this.typeQueue || this.typeQueue.length === 0) {
      this.typeQueue = this.shuffledPool();
    }
    return this.typeQueue.shift();
  },

  /* ============ 出题 ============ */

  nextQuestion: function () {
    if (this.data.autoTimer) clearTimeout(this.data.autoTimer);

    if (this.data.questionNum >= this.data.total) {
      this.finishPractice();
      return;
    }

    var q = null, guard = 0;
    while (!q && guard < 5) {
      guard++;
      q = gen.createQuestion(this.nextType(), this.data.level);
    }
    if (!q) {
      // 理论上不会发生（生成器已压测），兜底给一道入门等差
      q = gen.createQuestion('add', 1);
    }

    this.setData({
      question: q,
      cards: this.buildCards(q, false, null),
      optionItems: q.options.map(function (v) { return { v: v, cls: 'opt' }; }),
      userAnswer: '',
      wrongTries: 0,
      decided: false,
      revealed: false,
      solvedByFail: false,
      feedbackText: '',
      feedbackOk: null,
      hintText: '',
      questionNum: this.data.questionNum + 1
    });
  },

  // 预计算卡片：revealed 后填入答案、显示差值标注/双数列配色
  buildCards: function (q, revealed, wrongValue) {
    var cards = [];
    var small = q.seq.length >= 7;
    for (var i = 0; i < q.seq.length; i++) {
      var isBlank = i === q.blankIndex;
      var cls = 'seq-card';
      if (small) cls += ' seq-card-sm';
      var v = '' + q.seq[i];
      if (isBlank) {
        if (revealed) {
          cls += ' seq-card-answer';
        } else {
          cls += ' seq-card-blank';
          v = wrongValue !== null && wrongValue !== undefined ? '' + wrongValue : '?';
          if (wrongValue !== null && wrongValue !== undefined) cls += ' seq-card-wrongv';
        }
      }
      if (revealed && q.grpMode) {
        cls += i % 2 === 0 ? ' seq-card-grpa' : ' seq-card-grpb';
      }
      cards.push({
        v: v,
        cls: cls,
        mark: revealed && q.hasMarks && i > 0 ? q.marks[i - 1] : '',
        showMark: revealed && q.hasMarks && i > 0
      });
    }
    return cards;
  },

  /* ============ 作答 ============ */

  onOptionTap: function (e) {
    if (this.data.revealed) return;
    var idx = parseInt(e.currentTarget.dataset.index);
    var q = this.data.question;
    var val = q.options[idx];
    var items = this.data.optionItems.slice();
    if (val === q.answer) {
      items[idx].cls = 'opt opt-right';
      this.setData({ optionItems: items });
      this.onCorrect();
    } else {
      items[idx].cls = 'opt opt-wrong';
      this.setData({ optionItems: items });
      this.onWrong(val);
    }
  },

  onAnswerInput: function (e) {
    this.setData({ userAnswer: e.detail.value });
  },

  onSubmit: function () {
    if (this.data.revealed) return;
    var raw = this.data.userAnswer.trim();
    if (raw === '') {
      wx.showToast({ title: '先填个数哦', icon: 'none' });
      return;
    }
    var num = Number(raw);
    if (num === this.data.question.answer) {
      this.onCorrect();
    } else {
      this.onWrong(num);
      this.setData({ userAnswer: '' });
    }
  },

  onCorrect: function () {
    var q = this.data.question;
    var firstTry = !this.data.decided;
    var patch = {
      revealed: true,
      cards: this.buildCards(q, true, null),
      feedbackText: '✅ 答对了！' + q.ruleText,
      feedbackOk: true,
      hintText: ''
    };
    if (firstTry) {
      var newStreak = this.data.streak + 1;
      patch.correctNum = this.data.correctNum + 1;
      patch.streak = newStreak;
      patch.bestStreak = Math.max(newStreak, this.data.bestStreak);
      patch.decided = true;
      this.addStat(q.typeLabel, true);
    }
    this.setData(patch);

    var self = this;
    var timer = setTimeout(function () { self.nextQuestion(); }, 1800);
    this.setData({ autoTimer: timer });
  },

  onWrong: function (wrongValue) {
    var q = this.data.question;
    var tries = this.data.wrongTries + 1;
    var patch = { wrongTries: tries, feedbackOk: false };

    // 首错才计分
    if (!this.data.decided) {
      patch.decided = true;
      patch.wrongNum = this.data.wrongNum + 1;
      patch.streak = 0;
      this.addStat(q.typeLabel, false);
      var disp = q.seq.map(function (v, i) { return i === q.blankIndex ? '__' : v; }).join(', ');
      patch.wrongList = this.data.wrongList.concat([{
        display: disp,
        correctAnswer: q.answer,
        typeLabel: q.typeLabel
      }]);
    }

    if (tries === 1) {
      patch.feedbackText = '再想想～';
      patch.hintText = '💡 ' + q.hint1;
      patch.cards = this.buildCards(q, false, wrongValue);
    } else if (tries === 2) {
      patch.feedbackText = '别灰心，看提示！';
      patch.hintText = '💡 ' + q.ruleText + '，再算一次？';
      patch.cards = this.buildCards(q, false, wrongValue);
    } else {
      // 第三次错：揭示答案
      patch.revealed = true;
      patch.solvedByFail = true;
      patch.cards = this.buildCards(q, true, null);
      patch.feedbackText = '答案是 ' + q.answer + '。' + q.ruleText;
      patch.hintText = '';
    }
    this.setData(patch);

    // 闪红后恢复选项可点态（未揭示时）
    if (tries < 3 && this.data.mode === 'choice') {
      var self = this;
      setTimeout(function () {
        if (self.data.revealed) return;
        var items = self.data.optionItems.map(function (it) {
          return { v: it.v, cls: it.cls === 'opt opt-wrong' ? 'opt opt-dim' : it.cls };
        });
        self.setData({ optionItems: items });
      }, 450);
    }
  },

  onManualNext: function () {
    this.nextQuestion();
  },

  addStat: function (label, ok) {
    if (!this.statMap[label]) this.statMap[label] = { label: label, correct: 0, wrong: 0 };
    if (ok) this.statMap[label].correct++;
    else this.statMap[label].wrong++;
  },

  /* ============ 结算 ============ */

  onFinish: function () {
    if (this.data.autoTimer) clearTimeout(this.data.autoTimer);
    this.finishPractice();
  },

  finishPractice: function () {
    var total = this.data.correctNum + this.data.wrongNum;
    var accuracy = total > 0 ? Math.round(this.data.correctNum / total * 100) : 0;
    var stats = [];
    for (var k in this.statMap) {
      var s = this.statMap[k];
      stats.push({ label: s.label, correct: s.correct, wrong: s.wrong, total: s.correct + s.wrong });
    }
    var summary = {
      total: total,
      correct: this.data.correctNum,
      wrong: this.data.wrongNum,
      accuracy: accuracy,
      bestStreak: this.data.bestStreak,
      levelLabel: LEVEL_LABELS[this.data.level]
    };
    this.setData({ page: 'result', resultSummary: summary, typeStats: stats });

    if (total > 0) {
      storage.addHistory({
        toolId: 'pattern',
        toolName: '找规律填数',
        category: 'study',
        summary: summary.levelLabel + ' 做了' + total + '题 正确率' + accuracy + '%',
        timestamp: Date.now()
      });
    }
  },

  onRetry: function () {
    this.onStart();
  },

  onBackSetup: function () {
    this.setData({ page: 'setup' });
  },

  onShareAppMessage: function () {
    return {
      title: '找规律填数 - 数列推理小挑战，你能全对吗？',
      path: '/packages/toolsA/pattern/index'
    };
  }
});
