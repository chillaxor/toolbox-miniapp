var storage = require('../../../utils/storage.js');
var math24 = require('../../../utils/math24.js');

Page({
  data: {
    isFavorite: false,
    numbers: [],
    cardFaces: [],
    usedCardIdx: {},      // { 0: true, 2: true } 记录哪些牌已用
    expression: '',       // 显示用的表达式字符串
    exprTokens: [],       // token列表，用于退格和计算
    // exprTokens 每项格式：{ type: 'num'|'op'|'bracket', value: '3', cardIdx: 0 }
    exprState: '',        // '' | 'expr-correct' | 'expr-wrong'
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
    var best = wx.getStorageSync('toolbox_math24_best');
    var solved = wx.getStorageSync('toolbox_math24_solved') || 0;
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
    this.setData({ isFavorite: storage.isFavorite('math24') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('math24');
    this.setData({ isFavorite: fav });
  },

  // ---------- 挑战逻辑 ----------

  newPuzzle: function () {
    var nums = math24.generateNumbers();
    var faces = [];
    for (var i = 0; i < nums.length; i++) {
      faces.push(math24.toCardFace(nums[i]));
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

  // 点数字牌
  onCardTap: function (e) {
    var idx = parseInt(e.currentTarget.dataset.idx);
    var used = this.data.usedCardIdx;
    if (used[idx]) return; // 已用过

    var token = {
      type: 'num',
      value: String(this.data.numbers[idx]),
      display: this.data.cardFaces[idx],
      cardIdx: idx
    };
    this._appendToken(token);
  },

  // 点运算符
  onOpTap: function (e) {
    var op = e.currentTarget.dataset.op;
    var token = { type: 'op', value: op, display: op };
    this._appendToken(token);
  },

  // 左括号
  onBracketLeft: function () {
    this._appendToken({ type: 'bracket', value: '(', display: '(' });
  },

  // 右括号
  onBracketRight: function () {
    this._appendToken({ type: 'bracket', value: ')', display: ')' });
  },

  // 追加 token
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

  // 退格
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

  // 清空
  onClear: function () {
    this.setData({
      exprTokens: [],
      usedCardIdx: {},
      expression: '',
      exprState: '',
      resultTip: ''
    });
  },

  // 拼表达式字符串（显示用，数字显示牌面）
  _buildExpr: function (tokens) {
    var parts = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'num') {
        parts.push(t.display);
      } else if (t.type === 'op') {
        parts.push(' ' + t.value + ' ');
      } else {
        // 括号：左括号前不加空格，右括号后不加空格
        parts.push(t.value);
      }
    }
    return parts.join('');
  },

  // 拼计算用表达式（数字用真实值，× → * ÷ → /）
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

  // ---------- 表达式解析器（替代 eval/new Function，微信小程序不支持）----------

  /**
   * 递归下降解析四则运算表达式，返回数值或 null（出错时）
   * 支持：整数/小数、+ - * /、括号、空格
   */
  _evalExpr: function (expr) {
    var self = this;
    var pos = 0;

    function skipSpaces() {
      while (pos < expr.length && expr[pos] === ' ') pos++;
    }

    // 解析基本单元：数字 或 (子表达式)
    function parsePrimary() {
      skipSpaces();
      if (pos >= expr.length) return null;

      // 括号
      if (expr[pos] === '(') {
        pos++; // skip (
        var val = parseAddSub();
        skipSpaces();
        if (pos < expr.length && expr[pos] === ')') pos++; // skip )
        return val;
      }

      // 负号
      var sign = 1;
      if (expr[pos] === '-') {
        sign = -1;
        pos++;
      }

      // 数字
      skipSpaces();
      var start = pos;
      while (pos < expr.length && (
        (expr[pos] >= '0' && expr[pos] <= '9') || expr[pos] === '.'
      )) {
        pos++;
      }
      if (pos === start) return null; // 没读到数字
      return sign * parseFloat(expr.slice(start, pos));
    }

    // 解析乘除
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
          if (Math.abs(right) < 1e-9) return null; // 除以0
          left = left / right;
        }
      }
      return left;
    }

    // 解析加减
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
      if (pos < expr.length) return null; // 还有未消费的字符，表达式有问题
      return result;
    } catch (e) {
      return null;
    }
  },

  // ---------- 验证 ----------

  onEqual: function () {
    var tokens = this.data.exprTokens;

    // 检查是否用了全部4个数字
    var usedCount = Object.keys(this.data.usedCardIdx).length;
    if (usedCount < 4) {
      this.setData({ resultTip: '⚠️ 需要用上全部4张牌', exprState: 'expr-wrong' });
      return;
    }

    // 括号配对检查
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

    // 计算（用自定义解析器，微信小程序不支持 new Function/eval）
    var calcExpr = this._buildCalcExpr(tokens);
    var result = this._evalExpr(calcExpr);

    if (result === null || isNaN(result) || !isFinite(result)) {
      this.setData({ resultTip: '⚠️ 表达式有误', exprState: 'expr-wrong' });
      return;
    }

    if (Math.abs(result - 24) < 1e-9) {
      // 答对！
      this.stopTimer();
      var t = this.data.timer;
      var solved = this.data.solvedCount + 1;
      wx.setStorageSync('toolbox_math24_solved', solved);

      var best = this.data.bestTime;
      if (!best || t < best) {
        best = t;
        wx.setStorageSync('toolbox_math24_best', best);
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
        resultTip: '= ' + (Math.round(result * 1000) / 1000) + '，不是24，再想想',
        exprState: 'expr-wrong'
      });
      // 1.5秒后清除提示
      var self = this;
      setTimeout(function () {
        self.setData({ exprState: '', resultTip: '' });
      }, 1500);
    }
  },

  // ---------- 提示 ----------

  onHint: function () {
    var solution = math24.solve24(this.data.numbers);
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
      title: '数学训练 - 24点挑战',
      path: '/packages/moreTools/math24/index'
    };
  }
});
