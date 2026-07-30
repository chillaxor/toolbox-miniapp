var engine = require('./engine.js');
var storage = require('../../../utils/storage.js');

var WRONG_KEY = 'division_wrong';

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

Page({
  data: {
    state: 'intro',
    selectedModule: 'meaning',
    moduleName: '意义关',
    level: 1,
    divisor: 2,
    wrongBook: [],
    rounds: 8,
    idx: 0,
    q: null,
    // 意义关
    stepIdx: 0,
    curStep: null,
    cellsView: [],
    countedCount: 0,
    verseOpts: [],
    correctVerse: '',
    // 通用输入
    input: '',
    // 编商
    solved: {},
    patternInputs: {},
    // 反馈
    feedback: '',
    fbType: '',
    derivation: '',
    // 结果
    starCount: 0,
    totalWrong: 0,
    weakVerses: []
  },

  onLoad: function () {
    var f = (getApp().globalData && getApp().globalData.featureFlags) || wx.getStorageSync('feature_flags');
    if (f && f.division !== true) { wx.reLaunch({ url: '/pages/index/index' }); return; }
    var wb = [];
    try { var raw = storage.getSync(WRONG_KEY); wb = Array.isArray(raw) ? raw : []; } catch (e) { wb = []; }
    this.setData({ wrongBook: wb });
  },

  goIntro: function () { this.setData({ state: 'intro' }); },

  onSelectModule: function (e) {
    var m = e.currentTarget.dataset.module;
    var name = m === 'meaning' ? '意义关' : m === 'compare' ? '分法对比' : m === 'pattern' ? '编商' : '小测验';
    this.setData({ selectedModule: m, moduleName: name });
  },
  onSelectLevel: function (e) { this.setData({ level: Number(e.currentTarget.dataset.level) }); },
  onSelectDivisor: function (e) { this.setData({ divisor: Number(e.currentTarget.dataset.divisor) }); },

  startGame: function () {
    this.setData({
      state: 'play', idx: 0, totalWrong: 0, weakVerses: [],
      feedback: '', fbType: '', derivation: ''
    });
    this._genRound();
  },

  _genRound: function () {
    var m = this.data.selectedModule;
    var pool = engine.POOLS[this.data.level] || engine.POOLS[3];
    var q;
    if (m === 'meaning') {
      q = engine.genMeaning(pool);
      var palette = ['#FF8A65', '#4DB6AC', '#9575CD', '#F06292', '#7986CB', '#81C784', '#FFB74D', '#64B5F6', '#A1887F'];
      var cv = q.layout.cells.map(function (c) { return { gi: c.gi, on: false, color: palette[c.gi % palette.length] }; });
      this.setData({
        q: q, stepIdx: 0, curStep: q.steps[0], cellsView: cv, countedCount: 0,
        input: '', verseOpts: [], correctVerse: '', feedback: '', fbType: '', derivation: ''
      });
    } else if (m === 'compare') {
      q = engine.genCompare(pool);
      this.setData({ q: q, input: '', feedback: '', fbType: '', derivation: '' });
    } else if (m === 'pattern') {
      q = engine.genPattern(this.data.divisor);
      this.setData({ q: q, solved: {}, patternInputs: {}, feedback: '', fbType: '', derivation: '' });
    } else {
      q = engine.genQuiz(pool);
      this.setData({ q: q, input: '', feedback: '', fbType: '', derivation: '' });
    }
  },

  // ===== 意义关：圈组（教学第一步）=====
  onTapCell: function (e) {
    if (this.data.curStep.kind !== 'count') return;
    var gi = Number(e.currentTarget.dataset.gi);
    var cv = this.data.cellsView.map(function (c) { return c.gi === gi ? { gi: c.gi, on: true, color: c.color } : c; });
    var onGroups = {}; cv.forEach(function (c) { if (c.on) onGroups[c.gi] = 1; });
    var c = 0; for (var k in onGroups) c++;
    this.setData({ cellsView: cv, countedCount: c });
  },
  onCountNext: function () {
    if (this.data.countedCount < this.data.q.groups) return;
    var steps = this.data.q.steps;
    this.setData({ stepIdx: 1, curStep: steps[1], input: '', feedback: '', fbType: '', derivation: '' });
  },

  // ===== 意义关：连减 / 写除法 填空校验 =====
  onStepInput: function (e) { this.setData({ input: e.detail.value }); },
  onStepCheck: function () {
    var step = this.data.curStep;
    if (step.kind !== 'sub' && step.kind !== 'div') return;
    var val = Number(this.data.input);
    if (val === step.answer) {
      if (step.kind === 'div') {
        this.setData({ fbType: 'ok', feedback: '答对啦！把 ' + step.dividend + ' 平均分成 ' + step.divisor + ' 份，每份 ' + step.answer + ' 个。', derivation: '' });
      } else {
        this.setData({ fbType: 'ok', feedback: '对！每次拿出 ' + step.quotient + ' 个分给一份，拿 ' + step.answer + ' 次正好分完——这就是「÷' + step.divisor + '」的意思。', derivation: '' });
      }
      var steps = this.data.q.steps;
      var next = this.data.stepIdx + 1;
      var self = this;
      if (next < steps.length) {
        if (steps[next].kind === 'verse') {
          setTimeout(function () { self.setData({ stepIdx: next, curStep: steps[next], verseOpts: shuffle(engine.verseOptions(steps[next].answer)), correctVerse: steps[next].answer, input: '', feedback: '', fbType: '' }); }, 800);
        } else {
          setTimeout(function () { self.setData({ stepIdx: next, curStep: steps[next], input: '', feedback: '', fbType: '' }); }, 800);
        }
      }
    } else {
      var der;
      if (step.kind === 'sub') {
        der = '从 ' + step.dividend + ' 每次拿出 ' + step.quotient + ' 个分给一份，拿 ' + step.answer + ' 次正好分完，所以减了 ' + step.answer + ' 次';
      } else {
        der = '把 ' + step.dividend + ' 平均分成 ' + step.divisor + ' 份，每份 ' + step.answer + ' 个，用口诀『' + engine.verseOf(step.divisor, step.quotient) + '』（' + step.divisor + '×' + step.quotient + '=' + step.dividend + '）';
      }
      this._recordWeak(this.data.q.verse);
      this.setData({ fbType: 'wrong', feedback: '再想想～', derivation: der });
    }
  },

  // ===== 意义关：口诀选择 =====
  onVerseTap: function (e) {
    var v = e.currentTarget.dataset.v;
    if (v === this.data.correctVerse) {
      this.setData({
        fbType: 'ok', feedback: '口诀：' + v + ' ✅  ' + this.data.q.divisor + '×' + this.data.q.quotient + '=' + this.data.q.dividend + '，所以 ' + this.data.q.dividend + '÷' + this.data.q.divisor + '=' + this.data.q.quotient,
        derivation: '', correctVerse: v
      });
      var that = this;
      setTimeout(function () { that._next(); }, 900);
    } else {
      this._recordWeak(this.data.correctVerse);
      this.setData({ fbType: 'wrong', feedback: '不是这一句哦', derivation: '正确口诀是『' + this.data.correctVerse + '』，记下来～' });
    }
  },

  // ===== 分法对比校验 =====
  onCompareInput: function (e) { this.setData({ input: e.detail.value }); },
  onCompareCheck: function () {
    var q = this.data.q;
    var val = Number(this.data.input);
    if (val === q.q.answer) {
      this.setData({ fbType: 'ok', feedback: '对！同一堆 ' + q.dividend + ' 个点，按不同分法得到不同算式，但都用『' + q.verse + '』这句口诀 ✅', derivation: '' });
      var that = this; setTimeout(function () { that._next(); }, 1100);
    } else {
      this._recordWeak(engine.verseOf(q.divisor, q.quotient));
      this.setData({ fbType: 'wrong', feedback: '再数数看～', derivation: '每 ' + q.quotient + ' 个圈一份，能圈 ' + q.q.answer + ' 份，所以 ' + q.label2 + q.q.answer });
    }
  },

  // ===== 编商校验 =====
  onPatternInput: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var pi = {}; pi[idx] = e.detail.value;
    this.setData({ patternInputs: Object.assign({}, this.data.patternInputs, pi) });
  },
  onPatternCheck: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var row = this.data.q.rows[idx];
    var val = Number(this.data.patternInputs[idx]);
    if (val === row.quotient) {
      var solved = {}; solved[idx] = true;
      this.setData({ solved: Object.assign({}, this.data.solved, solved), fbType: 'ok', feedback: '对！' + row.verse, derivation: '' });
      var allDone = true; var self = this;
      this.data.q.ask.forEach(function (i) { if (!self.data.solved[i] && i !== idx) allDone = false; });
      if (allDone) { setTimeout(function () { self._next(); }, 1000); }
    } else {
      this._recordWeak(row.verse);
      var prevDividend = idx > 0 ? this.data.q.rows[idx - 1].dividend : 0;
      var prevQuotient = idx > 0 ? this.data.q.rows[idx - 1].quotient : 0;
      this.setData({ fbType: 'wrong', feedback: '再用口诀算算～', derivation: '上一个是 ' + prevDividend + ' ÷ ' + this.data.q.divisor + ' = ' + prevQuotient + '，再加 ' + this.data.q.divisor + ' 个：' + prevDividend + '+' + this.data.q.divisor + '=' + row.dividend + '，所以 ' + row.dividend + ' ÷ ' + this.data.q.divisor + ' = ' + row.quotient });
    }
  },

  // ===== 小测验校验 =====
  onQuizInput: function (e) { this.setData({ input: e.detail.value }); },
  onQuizCheck: function () {
    var q = this.data.q;
    var val = Number(this.data.input);
    if (val === q.answer) {
      this.setData({ fbType: 'ok', feedback: '对！口诀：' + q.verse, derivation: '' });
      var that = this; setTimeout(function () { that._next(); }, 900);
    } else {
      this._recordWeak(q.verse);
      this.setData({ fbType: 'wrong', feedback: '再算算～', derivation: q.dividend + ' ÷ ' + q.divisor + ' = ' + q.answer + '，口诀『' + q.verse + '』' });
    }
  },

  _recordWeak: function (verse) {
    if (!verse) return;
    var arr = this.data.weakVerses.slice();
    if (arr.indexOf(verse) < 0) arr.push(verse);
    this.setData({ weakVerses: arr, totalWrong: this.data.totalWrong + 1 });
  },

  _next: function () {
    var idx = this.data.idx + 1;
    if (idx >= this.data.rounds) { this._finish(); return; }
    this.setData({ idx: idx, feedback: '', fbType: '', derivation: '' });
    this._genRound();
  },

  _finish: function () {
    var stars = this.data.totalWrong === 0 ? 3 : (this.data.totalWrong <= 2 ? 2 : 1);
    var wb = this.data.wrongBook.slice();
    this.data.weakVerses.forEach(function (v) { if (wb.indexOf(v) < 0) wb.push(v); });
    try { storage.setSync(WRONG_KEY, wb); } catch (e) {}
    this.setData({ state: 'result', starCount: stars, wrongBook: wb });
  },

  restart: function () { this.startGame(); },

  goMultTable: function () { wx.navigateTo({ url: '/packages/toolsB/multTable/index' }); }
});
