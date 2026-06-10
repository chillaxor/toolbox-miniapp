var storage = require('../../../utils/storage.js');
var math27 = require('../../../utils/math27.js');

Page({
  data: {
    isFavorite: false,
    numbers: [],
    cardFaces: [],
    usedCardIdx: {},
    expression: '',
    exprTokens: [],
    exprState: '',
    resultTip: '',
    hint: '',
    showHint: false,
    showSuccess: false,
    timer: 0,
    timerRunning: false,
    bestTime: null,
    solvedCount: 0,
    timerText: '0s',
    bestTimeText: '--'
  },

  _timerInterval: null,

  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('toolbox_math27_best');
    var solved = wx.getStorageSync('toolbox_math27_solved') || 0;
    this.setData({
      bestTime: best || null,
      solvedCount: solved,
      bestTimeText: best ? this.formatTime(best) : '--'
    });
    this.newPuzzle();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    if (this._timerInterval) clearInterval(this._timerInterval);
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('math27') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('math27');
    this.setData({ isFavorite: fav });
  },

  // ---------- 挑战逻辑 ----------

  newPuzzle: function () {
    var nums = math27.generateNumbers();
    var faces = [];
    for (var i = 0; i < nums.length; i++) {
      faces.push(math27.toCardFace(nums[i]));
    }
    this.setData({
      numbers: nums,
      cardFaces: faces,
      usedCardIdx: {},
      expression: '',
      exprTokens: [],
      exprState: '',
      resultTip: '',
      hint: '',
      showHint: false,
      showSuccess: false
    });
    this.startTimer();
  },

  startTimer: function () {
    var self = this;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this.setData({ timer: 0, timerRunning: true, timerText: '0s' });
    this._timerInterval = setInterval(function () {
      if (self.data.timerRunning) {
        var t = self.data.timer + 1;
        self.setData({ timer: t, timerText: self.formatTime(t) });
      }
    }, 1000);
  },

  stopTimer: function () {
    this.setData({ timerRunning: false });
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  formatTime: function (seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    if (m > 0) {
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
    return s + 's';
  },

  // ---------- 输入处理 ----------

  onCardTap: function (e) {
    var idx = parseInt(e.currentTarget.dataset.idx);
    var used = this.data.usedCardIdx;
    if (used[idx]) return;

    var token = {
      type: 'num',
      value: String(this.data.numbers[idx]),
      display: this.data.cardFaces[idx],
      cardIdx: idx
    };
    this._appendToken(token);
  },

  onOpTap: function (e) {
    var op = e.currentTarget.dataset.op;
    var token = { type: 'op', value: op, display: op };
    this._appendToken(token);
  },

  onBracketLeft: function () {
    this._appendToken({ type: 'bracket', value: '(', display: '(' });
  },

  onBracketRight: function () {
    this._appendToken({ type: 'bracket', value: ')', display: ')' });
  },

  _appendToken: function (token) {
    var tokens = this.data.exprTokens.slice();
    tokens.push(token);

    var usedOld = this.data.usedCardIdx;
    var used = {};
    for (var k in usedOld) { if (usedOld.hasOwnProperty(k)) used[k] = usedOld[k]; }
    if (token.type === 'num' && token.cardIdx !== undefined) {
      used[token.cardIdx] = true;
    }

    this.setData({
      exprTokens: tokens,
      usedCardIdx: used,
      expression: this._buildExpr(tokens),
      exprState: '',
      resultTip: ''
    });
  },

  onBackspace: function () {
    var tokens = this.data.exprTokens.slice();
    if (tokens.length === 0) return;

    var last = tokens.pop();
    var usedOld2 = this.data.usedCardIdx;
    var used = {};
    for (var k2 in usedOld2) { if (usedOld2.hasOwnProperty(k2)) used[k2] = usedOld2[k2]; }
    if (last.type === 'num' && last.cardIdx !== undefined) {
      delete used[last.cardIdx];
    }

    this.setData({
      exprTokens: tokens,
      usedCardIdx: used,
      expression: this._buildExpr(tokens),
      exprState: '',
      resultTip: ''
    });
  },

  onClear: function () {
    this.setData({
      exprTokens: [],
      usedCardIdx: {},
      expression: '',
      exprState: '',
      resultTip: ''
    });
  },

  _buildExpr: function (tokens) {
    var parts = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'num') {
        parts.push(t.display);
      } else if (t.type === 'op') {
        parts.push(' ' + t.value + ' ');
      } else {
        parts.push(t.value);
      }
    }
    return parts.join('');
  },

  _buildCalcExpr: function (tokens) {
    var parts = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'num') {
        parts.push(t.value);
      } else if (t.type === 'op') {
        var op = t.value;
        if (op === '×') op = '*';
        if (op === '÷') op = '/';
        parts.push(op);
      } else {
        parts.push(t.value);
      }
    }
    return parts.join('');
  },

  // ---------- 表达式解析器 ----------

  _evalExpr: function (expr) {
    var pos = 0;

    function skipSpaces() {
      while (pos < expr.length && expr[pos] === ' ') pos++;
    }

    function parsePrimary() {
      skipSpaces();
      if (pos >= expr.length) return null;

      if (expr[pos] === '(') {
        pos++;
        var val = parseAddSub();
        skipSpaces();
        if (pos < expr.length && expr[pos] === ')') pos++;
        return val;
      }

      var sign = 1;
      if (expr[pos] === '-') {
        sign = -1;
        pos++;
      }

      skipSpaces();
      var start = pos;
      while (pos < expr.length && (
        (expr[pos] >= '0' && expr[pos] <= '9') || expr[pos] === '.'
      )) {
        pos++;
      }
      if (pos === start) return null;
      return sign * parseFloat(expr.slice(start, pos));
    }

    function parseMulDiv() {
      var left = parsePrimary();
      if (left === null) return null;
      while (true) {
        skipSpaces();
        if (pos >= expr.length) break;
        var op = expr[pos];
        if (op !== '*' && op !== '/') break;
        pos++;
        var right = parsePrimary();
        if (right === null) return null;
        if (op === '*') {
          left = left * right;
        } else {
          if (Math.abs(right) < 1e-9) return null;
          left = left / right;
        }
      }
      return left;
    }

    function parseAddSub() {
      var left = parseMulDiv();
      if (left === null) return null;
      while (true) {
        skipSpaces();
        if (pos >= expr.length) break;
        var op = expr[pos];
        if (op !== '+' && op !== '-') break;
        pos++;
        var right = parseMulDiv();
        if (right === null) return null;
        if (op === '+') {
          left = left + right;
        } else {
          left = left - right;
        }
      }
      return left;
    }

    try {
      var result = parseAddSub();
      skipSpaces();
      if (pos < expr.length) return null;
      return result;
    } catch (e) {
      return null;
    }
  },

  // ---------- 验证 ----------

  onEqual: function () {
    var tokens = this.data.exprTokens;

    var usedCount = Object.keys(this.data.usedCardIdx).length;
    if (usedCount < 4) {
      this.setData({ resultTip: '⚠️ 需要用上全部4张牌', exprState: 'expr-wrong' });
      return;
    }

    var depth = 0;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].value === '(') depth++;
      if (tokens[i].value === ')') depth--;
      if (depth < 0) {
        this.setData({ resultTip: '⚠️ 括号不匹配', exprState: 'expr-wrong' });
        return;
      }
    }
    if (depth !== 0) {
      this.setData({ resultTip: '⚠️ 括号不匹配', exprState: 'expr-wrong' });
      return;
    }

    var calcExpr = this._buildCalcExpr(tokens);
    var result = this._evalExpr(calcExpr);

    if (result === null || isNaN(result) || !isFinite(result)) {
      this.setData({ resultTip: '⚠️ 表达式有误', exprState: 'expr-wrong' });
      return;
    }

    if (Math.abs(result - 27) < 1e-9) {
      this.stopTimer();
      var t = this.data.timer;
      var solved = this.data.solvedCount + 1;
      wx.setStorageSync('toolbox_math27_solved', solved);

      var best = this.data.bestTime;
      if (!best || t < best) {
        best = t;
        wx.setStorageSync('toolbox_math27_best', best);
      }

      this.setData({
        exprState: 'expr-correct',
        solvedCount: solved,
        bestTime: best,
        bestTimeText: this.formatTime(best),
        showSuccess: true
      });
    } else {
      this.setData({
        resultTip: '= ' + (Math.round(result * 1000) / 1000) + '，不是27，再想想',
        exprState: 'expr-wrong'
      });
      var self = this;
      setTimeout(function () {
        self.setData({ exprState: '', resultTip: '' });
      }, 1500);
    }
  },

  // ---------- 提示 ----------

  onHint: function () {
    var solution = math27.solve(this.data.numbers);
    this.setData({
      hint: solution || '此题暂无解，换一题吧',
      showHint: true
    });
    this.stopTimer();
  },

  onCloseHint: function () {
    this.setData({ showHint: false });
  },

  onCloseSuccess: function () {
    this.setData({ showSuccess: false });
    this.newPuzzle();
  },

  onNewPuzzle: function () {
    this.newPuzzle();
  },

  onShareAppMessage: function () {
    return {
      title: '算27点 - 数学运算训练',
      path: '/pages/tools/math27/index'
    };
  }
});
