var E = require('./engine.js');
var storage = require('../../../utils/storage.js');

var TYPE_TEXT = { big: '大月（31天）', small: '小月（30天）', feb: '特殊月（平年28天·闰年29天）' };
var KNUCKLE_TEXT = { up: '凸起（大月）', down: '凹下（小月）', special: '特殊（2月）' };

var RHYME_QUIZZES = [
  {
    prefix: '一三五七八十腊，',
    suffix: '一天永不差',
    choices: ['三十', '三十一', '二十八'],
    answer: '三十一',
    hint: '大月都有 31 天哦'
  },
  {
    prefix: '四六九冬三十',
    suffix: '，平年二月二十八，闰年二月把一加',
    choices: ['天', '日', '整'],
    answer: '日',
    hint: '小月都有 30 天哦'
  }
];

Page({
  data: {
    tab: 'sense',
    tabs: [
      { id: 'sense', name: '认识月份' },
      { id: 'rhyme', name: '口诀练习' },
      { id: 'leap', name: '闰年判断' },
      { id: 'calendar', name: '翻月历' }
    ],
    months: [],
    knuckles: [],
    selectedMonth: null,

    rhymeQuizzes: RHYME_QUIZZES,
    rhymeIdx: 0,
    rhymeView: [],
    rhymeResult: null,

    leapYear: '2024',
    leapView: [],
    leapDone: 0,
    leapResult: null,

    quizMonth: null,
    quizDays: null,

    today: null,
    calYear: 2026,
    calMonth: 7,
    calCells: [],
    calSelected: null
  },

  onLoad: function () {
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.calendarKids !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var now = new Date();
    var today = {
      y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(),
      weekdayName: E.weekdayName(E.weekdayOf(now.getFullYear(), now.getMonth() + 1, now.getDate()))
    };
    this.setData({
      months: E.buildMonths(),
      knuckles: E.knuckles(),
      today: today,
      calYear: today.y,
      calMonth: today.m,
      calCells: E.buildMonthCalendar(today.y, today.m, now).cells,
      rhymeView: this._buildRhymeView(0)
    });
    this.newMonthQuiz();
    this.newDaysQuiz();
  },

  onUnload: function () {
    if (this._leapTimer) { clearTimeout(this._leapTimer); this._leapTimer = null; }
  },

  onShareAppMessage: function () {
    return { title: '年月日历：认月份·学闰年·翻日历', path: '/packages/toolsB/calendarKids/index' };
  },

  // ============ 顶部切换 ============
  switchTab: function (e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  // ============ 模块A：认识月份 ============
  onMonthTap: function (e) {
    var m = Number(e.currentTarget.dataset.month);
    var list = this.data.months;
    var info = null;
    for (var i = 0; i < list.length; i++) { if (list[i].month === m) info = list[i]; }
    if (!info) return;
    this.setData({
      selectedMonth: {
        month: info.month, name: info.name, daysLabel: info.daysLabel,
        typeText: TYPE_TEXT[info.type], knuckleText: KNUCKLE_TEXT[info.knuckle],
        season: info.season
      }
    });
  },

  // ============ 模块B：口诀练习 ============
  _buildRhymeView: function (idx) {
    var q = RHYME_QUIZZES[idx];
    return q.choices.map(function (c) {
      return { text: c, selected: false, correct: false, wrong: false };
    });
  },
  onRhymeChoice: function (e) {
    if (this.data.rhymeResult) return;
    var ci = Number(e.currentTarget.dataset.index);
    var q = RHYME_QUIZZES[this.data.rhymeIdx];
    var view = this.data.rhymeView.map(function (c, i) {
      var cls = 'r-choice';
      if (i === ci) {
        if (c.text === q.answer) cls = 'r-choice r-correct';
        else cls = 'r-choice r-wrong';
      }
      return { text: c.text, selected: i === ci, correct: c.text === q.answer, wrong: i === ci && c.text !== q.answer };
    });
    this.setData({
      rhymeView: view,
      rhymeResult: { ok: view[ci].correct, hint: q.hint }
    });
  },
  nextRhyme: function () {
    var idx = (this.data.rhymeIdx + 1) % RHYME_QUIZZES.length;
    this.setData({ rhymeIdx: idx, rhymeView: this._buildRhymeView(idx), rhymeResult: null });
  },

  // ---- 月份→天数 ----
  newMonthQuiz: function () {
    var q = E.genQuizMonthDays();
    this.setData({ quizMonth: q });
  },
  onMonthOptTap: function (e) {
    var q = this.data.quizMonth;
    if (!q || q.answered) return;
    var vi = Number(e.currentTarget.dataset.index);
    var val = q.options[vi].value;
    var correct = (val === q.answer);
    var opts = q.options.map(function (o, i) {
      var cls = 'd-opt';
      if (o.value === q.answer) cls = 'd-opt d-correct';
      else if (i === vi) cls = 'd-opt d-wrong';
      return { value: o.value, cls: cls };
    });
    var fb;
    if (correct) fb = '答对啦！';
    else if (q.isFeb) fb = '想一想：平年二月28天，闰年二月才29天～';
    else fb = '正确答案是 ' + q.answer + ' 天';
    this.setData({ quizMonth: Object.assign({}, q, { options: opts, answered: true, feedback: fb }) });
  },
  nextMonthQuiz: function () { this.newMonthQuiz(); },

  // ---- 天数→月份 ----
  newDaysQuiz: function () {
    var q = E.genQuizDaysToMonths();
    this.setData({ quizDays: q, daysChecked: false });
  },
  onDaysChipTap: function (e) {
    var q = this.data.quizDays;
    if (!q || this.data.daysChecked) return;
    var mi = Number(e.currentTarget.dataset.index);
    var chips = q.chips.map(function (c, i) {
      var sel = i === mi ? !c.selected : c.selected;
      return { month: c.month, selected: sel, isAnswer: c.isAnswer, wrong: c.wrong, correct: c.correct, cls: sel ? 'm-sel' : '' };
    });
    this.setData({ quizDays: Object.assign({}, q, { chips: chips }) });
  },
  checkDaysQuiz: function () {
    var q = this.data.quizDays;
    if (!q || this.data.daysChecked) return;
    var selected = [];
    q.chips.forEach(function (c) { if (c.selected) selected.push(c.month); });
    selected.sort(function (a, b) { return a - b; });
    var ans = q.answerMonths.slice().sort(function (a, b) { return a - b; });
    var same = selected.length === ans.length && selected.every(function (v, i) { return v === ans[i]; });
    var chips = q.chips.map(function (c) {
      var cls = 'm-chip';
      if (c.isAnswer) cls = 'm-chip m-answer';
      else if (c.selected) cls = 'm-chip m-wrong';
      return { month: c.month, selected: c.selected, isAnswer: c.isAnswer, wrong: c.selected && !c.isAnswer, correct: c.isAnswer };
    });
    var fb = same ? '全对啦！' : '正确答案已用绿色标出，再记一记～';
    this.setData({ quizDays: Object.assign({}, q, { chips: chips }), daysChecked: true, daysFeedback: fb });
  },
  nextDaysQuiz: function () { this.newDaysQuiz(); },

  // ============ 模块C：闰年判断 ============
  onLeapInput: function (e) {
    if (this._leapTimer) { clearTimeout(this._leapTimer); this._leapTimer = null; }
    this.setData({ leapYear: e.detail.value, leapView: [], leapDone: 0, leapResult: null, leapRunning: false });
  },
  decLeap: function () {
    if (this._leapTimer) { clearTimeout(this._leapTimer); this._leapTimer = null; }
    var y = parseInt(this.data.leapYear, 10); if (isNaN(y)) y = 2024;
    y = y - 1;
    this.setData({ leapYear: '' + y, leapView: [], leapDone: 0, leapResult: null, leapRunning: false });
  },
  incLeap: function () {
    if (this._leapTimer) { clearTimeout(this._leapTimer); this._leapTimer = null; }
    var y = parseInt(this.data.leapYear, 10); if (isNaN(y)) y = 2024;
    y = y + 1;
    this.setData({ leapYear: '' + y, leapView: [], leapDone: 0, leapResult: null, leapRunning: false });
  },
  guessLeap: function (e) {
    if (this.data.leapRunning) return;
    var g = e.currentTarget.dataset.leap === '1';
    this._runLeap(g);
  },
  _runLeap: function (guess) {
    var self = this;
    var year = parseInt(this.data.leapYear, 10);
    if (isNaN(year)) { wx.showToast({ title: '请输入年份', icon: 'none' }); return; }
    var st = E.leapYearSteps(year);
    var view = st.steps.map(function (s) { return { label: s.label, detail: s.detail, result: s.result, cls: 'step' }; });
    this.setData({ leapView: view, leapDone: 0, leapResult: null, leapRunning: true });
    var i = 0;
    function tick() {
      if (i >= view.length) {
        var correct = (guess === null) ? null : (guess === st.isLeap);
        self.setData({
          leapRunning: false,
          leapResult: {
            isLeap: st.isLeap, febDays: st.febDays, guess: guess, correct: correct,
            expl: self._leapExpl(st, guess)
          }
        });
        return;
      }
      view[i].cls = 'step step-done';
      self.setData({ leapView: view.slice(), leapDone: i + 1 });
      i++;
      self._leapTimer = setTimeout(tick, 750);
    }
    this._leapTimer = setTimeout(tick, 300);
  },
  _leapExpl: function (st, guess) {
    if (guess === null) return st.isLeap ? (st.year + ' 是闰年，2月有29天') : (st.year + ' 是平年，2月有28天');
    if (guess === st.isLeap) return '你判断对啦！' + st.year + (st.isLeap ? ' 是闰年' : ' 是平年');
    if (st.isCentury) return '注意：整百年必须看能不能被 400 整除，' + st.year + '÷400 不整除，所以是平年。';
    if (st.isLeap) return '注意：' + st.year + ' 能被 4 整除，是闰年哦。';
    return '注意：' + st.year + ' 不能被 4 整除，是平年哦。';
  },
  resetLeap: function () {
    if (this._leapTimer) { clearTimeout(this._leapTimer); this._leapTimer = null; }
    this.setData({ leapView: [], leapDone: 0, leapResult: null, leapRunning: false });
  },

  // ============ 模块D：翻月历 ============
  prevMonth: function () {
    var y = this.data.calYear, m = this.data.calMonth - 1;
    if (m === 0) { m = 12; y--; }
    this._setCal(y, m);
  },
  nextMonth: function () {
    var y = this.data.calYear, m = this.data.calMonth + 1;
    if (m === 13) { m = 1; y++; }
    this._setCal(y, m);
  },
  prevYear: function () { this._setCal(this.data.calYear - 1, this.data.calMonth); },
  nextYear: function () { this._setCal(this.data.calYear + 1, this.data.calMonth); },
  _setCal: function (y, m) {
    var now = new Date();
    this.setData({ calYear: y, calMonth: m, calCells: E.buildMonthCalendar(y, m, now).cells, calSelected: null });
  },
  onCellTap: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var cell = this.data.calCells[idx];
    if (!cell || !cell.inMonth) { this.setData({ calSelected: null }); return; }
    var days = this._daysBetween(cell.year, cell.month, cell.day);
    var rel = days === 0 ? '就是今天' : (days > 0 ? ('距离今天还有 ' + days + ' 天') : ('已经是 ' + (-days) + ' 天前'));
    this.setData({
      calSelected: {
        date: cell.year + '年' + cell.month + '月' + cell.day + '日',
        weekdayName: cell.weekdayName,
        festival: cell.festivalName,
        rel: rel
      }
    });
  },
  _daysBetween: function (y, m, d) {
    var t = this.data.today;
    var a = Date.UTC(y, m - 1, d);
    var b = Date.UTC(t.y, t.m - 1, t.d);
    return Math.round((a - b) / 86400000);
  }
});
