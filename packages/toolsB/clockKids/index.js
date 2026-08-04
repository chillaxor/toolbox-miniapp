var E = require('./engine.js');

var TABS = [
  { id: 'face', name: '认识钟表' },
  { id: 'read', name: '认时间' },
  { id: 'set', name: '拨时间' },
  { id: 'challenge', name: '闯关' }
];

var CHALLENGE_TOTAL = 10;

Page({
  data: {
    tab: 'face',
    tabs: TABS,
    clockNumbers: E.clockNumbers(),

    // ===== 认识钟表 =====
    faceClock: { hourAngle: E.hourAngle(3, 15), minuteAngle: E.minuteAngle(15) },
    faceDemoRun: false,
    faceCaption: '时针短粗、分针细长。分针走一大圈，时针才走 1 大格（1 小时）。',

    // ===== 认时间（read）=====
    readLevel: 'easy',
    readQuiz: null,
    readClock: null,
    readChipsHour: [],
    readChipsMin: [],
    readPickedHour: null,
    readPickedMin: null,
    readChecked: false,
    readCorrect: null,
    readSteps: [],
    readFeedback: '',

    // ===== 拨时间（set）=====
    setQuiz: null,
    setTargetClock: null,
    setMyClock: null,
    setChipsHour: [],
    setChipsMin: [],
    setHour: 12,
    setMinute: 0,
    setChecked: false,
    setCorrect: null,
    setSteps: [],
    setFeedback: '',

    // ===== 闯关（challenge）=====
    chTotalConst: 10,
    chScore: 0,
    chTotal: 0,
    chRound: 0,
    chDone: false,
    chQuiz: null,
    chClock: null,
    chChipsHour: [],
    chChipsMin: [],
    chPickedHour: null,
    chPickedMin: null,
    chChecked: false,
    chCorrect: null,
    chSteps: [],
    chFeedback: ''
  },

  onLoad: function () {
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.clockKids !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.newRead('easy');
    this.newSet();
  },

  onUnload: function () { this._stopDemo(); },
  onHide: function () { this._stopDemo(); },

  onShareAppMessage: function () {
    return { title: '钟表小能手：认整时半时·学几时几分·动手拨一拨', path: '/packages/toolsB/clockKids/index' };
  },

  // ============ 顶部切换 ============
  switchTab: function (e) {
    var t = e.currentTarget.dataset.tab;
    if (t !== 'face') this._stopDemo();
    if (t === 'challenge' && !this.data.chQuiz && !this.data.chDone) this.startChallenge();
    this.setData({ tab: t });
  },

  // ============ 认识钟表：分针走一圈演示 ============
  toggleDemo: function () {
    if (this.data.faceDemoRun) { this._stopDemo(); return; }
    this._demoMin = 0;
    this._demoHourBase = 3;
    this.setData({
      faceDemoRun: true,
      faceCaption: '看：分针转一大圈，时针才慢慢挪 1 大格 —— 这就是 1 小时。'
    });
    var self = this;
    this._demoTimer = setInterval(function () {
      self._demoMin += 6;
      if (self._demoMin >= 360) { self._demoMin = 0; self._demoHourBase = (self._demoHourBase % 12) + 1; }
      self.setData({
        faceClock: {
          hourAngle: self._demoHourBase * 30 + self._demoMin / 12,
          minuteAngle: self._demoMin
        }
      });
    }, 120);
  },
  _stopDemo: function () {
    if (this._demoTimer) { clearInterval(this._demoTimer); this._demoTimer = null; }
    if (this.data.faceDemoRun) this.setData({ faceDemoRun: false });
  },

  // ============ 通用：构造 chip 列表 ============
  _chips: function (hourSel, minSel) {
    var hours = [];
    for (var n = 1; n <= 12; n++) hours.push({ n: n, selected: (n === hourSel) });
    var mins = [];
    for (var i = 0; i < E.MINUTES_SET.length; i++) {
      var m = E.MINUTES_SET[i];
      mins.push({ m: m, selected: (m === minSel) });
    }
    return { hours: hours, mins: mins };
  },
  _makeClock: function (hour, minute) {
    return { hourAngle: E.hourAngle(hour, minute), minuteAngle: E.minuteAngle(minute) };
  },

  // ============ 认时间（read）============
  newRead: function (level) {
    var q = E.genQuiz(level);
    var chips = this._chips(null, null);
    this.setData({
      readQuiz: q,
      readClock: this._makeClock(q.hour, q.minute),
      readChipsHour: chips.hours,
      readChipsMin: chips.mins,
      readPickedHour: null,
      readPickedMin: null,
      readChecked: false,
      readCorrect: null,
      readSteps: [],
      readFeedback: ''
    });
  },
  onReadLevel: function (e) {
    var lv = e.currentTarget.dataset.level;
    this.setData({ readLevel: lv });
    this.newRead(lv);
  },
  onHourTap: function (e) {
    var scope = e.currentTarget.dataset.scope;
    if (scope === 'set') return this.onSetHourTap(e);
    if (this.data[scope + 'Checked']) return;
    var idx = Number(e.currentTarget.dataset.index);
    var key = scope + 'ChipsHour';
    var chips = this.data[key].map(function (c, i) { return { n: c.n, selected: i === idx }; });
    var d = {}; d[key] = chips; d[scope + 'PickedHour'] = chips[idx].n;
    this.setData(d);
  },
  onMinTap: function (e) {
    var scope = e.currentTarget.dataset.scope;
    if (scope === 'set') return this.onSetMinTap(e);
    if (this.data[scope + 'Checked']) return;
    var idx = Number(e.currentTarget.dataset.index);
    var key = scope + 'ChipsMin';
    var chips = this.data[key].map(function (c, i) { return { m: c.m, selected: i === idx }; });
    var d = {}; d[key] = chips; d[scope + 'PickedMin'] = chips[idx].m;
    this.setData(d);
  },
  onCheck: function (e) {
    var scope = e.currentTarget.dataset.scope;
    if (this.data[scope + 'Checked']) return;
    var quiz = this.data[scope + 'Quiz'];
    var ph = this.data[scope + 'PickedHour'];
    var pm = this.data[scope + 'PickedMin'];
    if (ph === null || pm === null) { wx.showToast({ title: '先选一选哦', icon: 'none' }); return; }
    var r = E.checkAnswer(ph, pm, quiz);
    var d = {};
    d[scope + 'Checked'] = true;
    d[scope + 'Correct'] = r.correct;
    d[scope + 'Steps'] = r.steps;
    d[scope + 'Feedback'] = r.correct ? '答对啦！👍' : ('正确答案：' + r.answerText + '，看下面的步骤想一想～');
    if (scope === 'challenge') {
      var score = this.data.chScore + (r.correct ? 1 : 0);
      var total = this.data.chTotal + 1;
      d.chScore = score; d.chTotal = total;
      if (total >= CHALLENGE_TOTAL) d.chDone = true;
    }
    this.setData(d);
  },
  onNext: function (e) {
    var scope = e.currentTarget.dataset.scope;
    if (scope === 'challenge') {
      if (this.data.chDone) this.startChallenge();
      else this.newChallengeRound();
      return;
    }
    this.newRead(this.data.readLevel);
  },

  // ============ 拨时间（set）============
  newSet: function () {
    var q = E.genQuiz('hard');
    var chips = this._chips(12, 0);
    this.setData({
      setQuiz: q,
      setTargetClock: this._makeClock(q.hour, q.minute),
      setHour: 12,
      setMinute: 0,
      setMyClock: this._makeClock(12, 0),
      setChipsHour: chips.hours,
      setChipsMin: chips.mins,
      setChecked: false,
      setCorrect: null,
      setSteps: [],
      setFeedback: ''
    });
  },
  onSetHourTap: function (e) {
    if (this.data.setChecked) return;
    var idx = Number(e.currentTarget.dataset.index);
    var chips = this.data.setChipsHour.map(function (c, i) { return { n: c.n, selected: i === idx }; });
    this.setData({ setChipsHour: chips, setHour: chips[idx].n, setMyClock: this._makeClock(chips[idx].n, this.data.setMinute) });
  },
  onSetMinTap: function (e) {
    if (this.data.setChecked) return;
    var idx = Number(e.currentTarget.dataset.index);
    var chips = this.data.setChipsMin.map(function (c, i) { return { m: c.m, selected: i === idx }; });
    this.setData({ setChipsMin: chips, setMinute: chips[idx].m, setMyClock: this._makeClock(this.data.setHour, chips[idx].m) });
  },
  onSetCheck: function () {
    if (this.data.setChecked) return;
    var q = this.data.setQuiz;
    var correct = (this.data.setHour === q.h12) && (this.data.setMinute === q.minute);
    var steps = E.explainTime(q.hour, q.minute);
    this.setData({
      setChecked: true,
      setCorrect: correct,
      setSteps: steps,
      setFeedback: correct ? '拨对啦！🎉' : ('再看看：目标是 ' + q.text + '，下面步骤帮你想想～')
    });
  },
  onSetNext: function () { this.newSet(); },

  // ============ 闯关（challenge）============
  startChallenge: function () {
    this.setData({ chScore: 0, chTotal: 0, chRound: 0, chDone: false });
    this.newChallengeRound();
  },
  newChallengeRound: function () {
    var q = E.genQuiz('hard');
    var chips = this._chips(null, null);
    this.setData({
      chRound: this.data.chRound + 1,
      chQuiz: q,
      chClock: this._makeClock(q.hour, q.minute),
      chChipsHour: chips.hours,
      chChipsMin: chips.mins,
      chPickedHour: null,
      chPickedMin: null,
      chChecked: false,
      chCorrect: null,
      chSteps: [],
      chFeedback: ''
    });
  }
});
