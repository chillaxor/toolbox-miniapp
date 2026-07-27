var storage = require('../../../utils/storage.js');

var TOTAL = 10; // 每次练习题数

// ========== 出题工具 ==========
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// 生成一道题：返回 { text, answer }
function genOne() {
  var type = randInt(1, 6);
  var a, b, c, ans, text;
  if (type === 1) {            // a元 = ?角
    a = randInt(1, 9);
    ans = a * 10;
    text = a + ' 元 = ( ) 角';
  } else if (type === 2) {     // b角 = ?元
    a = randInt(1, 9) * 10;
    ans = a / 10;
    text = a + ' 角 = ( ) 元';
  } else if (type === 3) {     // a元b角 = ?角
    a = randInt(1, 9); b = randInt(1, 9);
    ans = a * 10 + b;
    text = a + ' 元 ' + b + ' 角 = ( ) 角';
  } else if (type === 4) {     // c角d分 = ?分
    a = randInt(1, 9); b = randInt(1, 9);
    ans = a * 10 + b;
    text = a + ' 角 ' + b + ' 分 = ( ) 分';
  } else if (type === 5) {     // e分 = ?角
    a = randInt(1, 9) * 10;
    ans = a / 10;
    text = a + ' 分 = ( ) 角';
  } else {                     // a元b角c分 = ?分
    a = randInt(1, 9); b = randInt(0, 9); c = randInt(1, 9);
    ans = a * 100 + b * 10 + c;
    text = a + ' 元 ' + b + ' 角 ' + c + ' 分 = ( ) 分';
  }
  return { text: text, answer: ans };
}

// 生成 4 个选项（含正确答案 + 3 个干扰项）
function genOptions(answer) {
  var set = {};
  set[answer] = true;
  var step = answer >= 20 ? 10 : 1; // 大数用 10 跳，小数用 1 跳
  var tries = 0;
  while (Object.keys(set).length < 4 && tries < 60) {
    tries++;
    var delta = (Math.random() < 0.5 ? -1 : 1) * (randInt(1, 3) * step);
    var v = answer + delta;
    if (v > 0) set[v] = true;
  }
  // 兜底补足（防止干扰项生成失败）
  var extra = answer + step;
  while (Object.keys(set).length < 4) {
    if (!set[extra]) set[extra] = true;
    extra += step;
  }
  return shuffle(Object.keys(set).map(Number));
}

function genQuestions() {
  var list = [];
  for (var i = 0; i < TOTAL; i++) {
    var q = genOne();
    var options = genOptions(q.answer);
    list.push({
      text: q.text,
      answer: q.answer,
      options: options,
      correctIndex: options.indexOf(q.answer)
    });
  }
  return list;
}

// 时间戳格式化为 MM-DD HH:mm
function fmtTime(ts) {
  var d = new Date(ts);
  var m = d.getMonth() + 1, day = d.getDate();
  var h = d.getHours(), min = d.getMinutes();
  return (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day + ' ' +
    (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
}

// ========== 页面 ==========
Page({
  data: {
    state: 'intro',        // intro / quiz / result
    total: TOTAL,
    index: 0,
    score: 0,
    progress: 0,
    questionText: '',
    options: [],
    selectedIndex: -1,
    answered: false,
    isCorrect: false,
    correctIndex: -1,
    isLast: false,
    feedbackText: '',
    stars: 0,
    historyList: []
  },

  onLoad: function () {
    
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.moneyExchange !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var history = wx.getStorageSync('moneyExchange_history') || [];
    this.setData({ historyList: history });
  },

  startGame: function () {
    this._questions = genQuestions();
    this.setData({ state: 'quiz', score: 0, index: 0 });
    this._showQuestion(0);
  },

  _showQuestion: function (idx) {
    var q = this._questions[idx];
    this.setData({
      index: idx,
      questionText: q.text,
      options: q.options,
      selectedIndex: -1,
      answered: false,
      isCorrect: false,
      correctIndex: q.correctIndex,
      progress: Math.round((idx / TOTAL) * 100),
      isLast: idx === TOTAL - 1,
      feedbackText: ''
    });
  },

  onSelect: function (e) {
    if (this.data.answered) return; // 已答则不可再选
    var idx = e.currentTarget.dataset.index;
    var q = this._questions[this.data.index];
    var correct = (idx === q.correctIndex);
    var score = this.data.score;
    if (correct) score++;
    var fb = correct ? '答对啦！👍' : ('再想想～ 正确答案是 ' + q.answer);
    this.setData({
      selectedIndex: idx,
      answered: true,
      isCorrect: correct,
      score: score,
      feedbackText: fb
    });
  },

  next: function () {
    if (!this.data.answered) return;
    if (this.data.isLast) {
      this._finish();
    } else {
      this._showQuestion(this.data.index + 1);
    }
  },

  _finish: function () {
    var score = this.data.score;
    var stars = 0;
    if (score === TOTAL) stars = 3;
    else if (score >= TOTAL * 0.6) stars = 2;
    else if (score > 0) stars = 1;

    this.setData({ state: 'result', progress: 100, stars: stars });

    var ts = Date.now();
    var record = { score: score, total: TOTAL, timestamp: ts, timeText: fmtTime(ts) };
    var history = wx.getStorageSync('moneyExchange_history') || [];
    history.unshift(record);
    if (history.length > 10) history = history.slice(0, 10);
    wx.setStorageSync('moneyExchange_history', history);
    this.setData({ historyList: history });

    storage.addHistory({
      toolId: 'moneyExchange',
      toolName: '钱币换算',
      category: 'study',
      summary: '答对 ' + score + ' / ' + TOTAL,
      timestamp: ts
    });
  },

  restart: function () {
    this.startGame();
  },

  goIntro: function () {
    this.setData({ state: 'intro' });
  },

  onShareAppMessage: function () {
    if (this.data.state === 'result') {
      return {
        title: '钱币换算我答对 ' + this.data.score + '/' + TOTAL + '，来挑战！',
        path: '/packages/toolsB/moneyExchange/index'
      };
    }
    return {
      title: '钱币换算 - 元角分练习',
      path: '/packages/toolsB/moneyExchange/index'
    };
  }
});
