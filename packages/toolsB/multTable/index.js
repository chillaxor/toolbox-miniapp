var engine = require('./engine.js');
var storage = require('../../../utils/storage.js');

var WRONG_KEY = 'multTable_wrong';

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
    factor: 2,
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
    // 编口诀
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
    if (f && f.multTable !== true) { wx.reLaunch({ url: '/pages/index/index' }); return; }
    var wb = [];
    try { var raw = storage.getSync(WRONG_KEY); wb = Array.isArray(raw) ? raw : []; } catch (e) { wb = []; }
    this.setData({ wrongBook: wb });
  },

  goIntro: function () { this.setData({ state: 'intro' }); },

  onSelectModule: function (e) {
    var m = e.currentTarget.dataset.module;
    var name = m === 'meaning' ? '意义关' : m === 'commute' ? '交换律' : m === 'pattern' ? '编口诀' : '小测验';
    this.setData({ selectedModule: m, moduleName: name });
  },
  onSelectLevel: function (e) { this.setData({ level: Number(e.currentTarget.dataset.level) }); },
  onSelectFactor: function (e) { this.setData({ factor: Number(e.currentTarget.dataset.factor) }); },

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
    } else if (m === 'commute') {
      q = engine.genCommute(pool);
      this.setData({ q: q, input: '', feedback: '', fbType: '', derivation: '' });
    } else if (m === 'pattern') {
      q = engine.genPattern(this.data.factor);
      this.setData({ q: q, solved: {}, patternInputs: {}, feedback: '', fbType: '', derivation: '' });
    } else {
      q = engine.genProduct(pool);
      this.setData({ q: q, input: '', feedback: '', fbType: '', derivation: '' });
    }
  },

  // ===== 意义关：圈组（教学第一步）=====
  onTapCell: function (e) {
    if (this.data.curStep.kind !== 'count') return;
    var gi = Number(e.currentTarget.dataset.gi);
    var cv = this.data.cellsView.map(function (c) { return c.gi === gi ? { gi: c.gi, on: true } : c; });
    var onGroups = {}; cv.forEach(function (c) { if (c.on) onGroups[c.gi] = 1; });
    var c = 0; for (var k in onGroups) c++;
    this.setData({ cellsView: cv, countedCount: c });
  },
  onCountNext: function () {
    if (this.data.countedCount < this.data.q.groups) return;
    var steps = this.data.q.steps;
    this.setData({ stepIdx: 1, curStep: steps[1], input: '', feedback: '', fbType: '', derivation: '' });
  },

  // ===== 意义关：连加 / 写乘法 填空校验 =====
  onStepInput: function (e) { this.setData({ input: e.detail.value }); },
  onStepCheck: function () {
    var step = this.data.curStep;
    if (step.kind !== 'add' && step.kind !== 'mult') return;
    var val = Number(this.data.input);
    if (val === step.answer) {
      if (step.kind === 'mult') {
        this.setData({
          fbType: 'ok', feedback: '答对啦！也可以写成 ' + step.b + '×' + step.a + ' = ' + step.answer + '，交换位置得数一样～',
          derivation: ''
        });
      } else {
        this.setData({ fbType: 'ok', feedback: '对！几个相同加数连加，就是乘法的来历。', derivation: '' });
      }
      var steps = this.data.q.steps;
      var next = this.data.stepIdx + 1;
      if (next < steps.length) {
        // 进入口诀步：准备选项
        if (steps[next].kind === 'verse') {
          this.setData({
            stepIdx: next, curStep: steps[next],
            verseOpts: shuffle(engine.verseOptions(steps[next].answer)),
            correctVerse: steps[next].answer, input: '', feedback: '', fbType: ''
          });
        } else {
          this.setData({ stepIdx: next, curStep: steps[next], input: '', feedback: '', fbType: '' });
        }
      }
    } else {
      var der = step.kind === 'add'
        ? step.addExpr + '，一个一个加：从 ' + step.answer + ' 倒着数也能验证，结果是 ' + step.answer
        : step.a + ' 个 ' + step.b + ' 就是 ' + step.a + '×' + step.b + ' = ' + step.answer + '（也可以 ' + step.b + '×' + step.a + '）';
      this._recordWeak(this.data.q.verse);
      this.setData({ fbType: 'wrong', feedback: '再想想～', derivation: der });
    }
  },

  // ===== 意义关：口诀选择 =====
  onVerseTap: function (e) {
    var v = e.currentTarget.dataset.v;
    if (v === this.data.correctVerse) {
      this.setData({
        fbType: 'ok', feedback: '口诀：' + v + ' ✅  ' + this.data.q.verseA + '×' + this.data.q.verseB + '=' + this.data.q.product + '，' + this.data.q.verseB + '×' + this.data.q.verseA + '=' + this.data.q.product,
        derivation: '', correctVerse: v
      });
      var that = this;
      setTimeout(function () { that._next(); }, 900);
    } else {
      this._recordWeak(this.data.correctVerse);
      this.setData({ fbType: 'wrong', feedback: '不是这一句哦', derivation: '正确口诀是『' + this.data.correctVerse + '』，记下来～' });
    }
  },

  // ===== 交换律校验 =====
  onCommuteInput: function (e) { this.setData({ input: e.detail.value }); },
  onCommuteCheck: function () {
    var q = this.data.q;
    var val = Number(this.data.input);
    if (val === q.q.answer) {
      this.setData({ fbType: 'ok', feedback: '一样多！' + q.label1 + '=' + q.product + '，' + q.label2 + '=' + q.product + '，交换位置得数不变 ✅', derivation: '' });
      var that = this; setTimeout(function () { that._next(); }, 1100);
    } else {
      this._recordWeak(engine.verseOf(q.a, q.b));
      this.setData({ fbType: 'wrong', feedback: '数数看，是不是一样多？', derivation: '两堆都是 ' + q.product + ' 个点，只是摆法不同，所以 ' + q.label2 + ' = ' + q.product });
    }
  },

  // ===== 编口诀校验 =====
  onPatternInput: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var pi = {}; pi[idx] = e.detail.value;
    this.setData({ patternInputs: Object.assign({}, this.data.patternInputs, pi) });
  },
  onPatternCheck: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var row = this.data.q.rows[idx];
    var val = Number(this.data.patternInputs[idx]);
    if (val === row.product) {
      var solved = {}; solved[idx] = true;
      this.setData({ solved: Object.assign({}, this.data.solved, solved), fbType: 'ok', feedback: '对！' + row.verse, derivation: '' });
      // 是否全部填空完成
      var allDone = true; var self = this;
      this.data.q.ask.forEach(function (i) { if (!self.data.solved[i] && i !== idx) allDone = false; });
      if (allDone) { setTimeout(function () { self._next(); }, 1000); }
    } else {
      this._recordWeak(row.verse);
      var prev = idx > 0 ? this.data.q.rows[idx - 1].product : 0;
      this.setData({ fbType: 'wrong', feedback: '再接着数数～', derivation: '上一个得数是 ' + prev + '，再加 ' + this.data.q.factor + '：' + prev + '+' + this.data.q.factor + '=' + row.product + '，所以 ' + row.n + '×' + this.data.q.factor + '=' + row.product });
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
      this.setData({ fbType: 'wrong', feedback: '再算算～', derivation: q.a + '×' + q.b + ' = ' + q.answer + '，口诀『' + q.verse + '』' });
    }
  },

  _recordWeak: function (verse) {
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
    // 合并错口诀本
    var wb = this.data.wrongBook.slice();
    this.data.weakVerses.forEach(function (v) { if (wb.indexOf(v) < 0) wb.push(v); });
    try { storage.setSync(WRONG_KEY, wb); } catch (e) {}
    this.setData({ state: 'result', starCount: stars, wrongBook: wb });
  },

  restart: function () { this.startGame(); }
});
