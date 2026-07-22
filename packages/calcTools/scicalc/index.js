var storage = require('../../../utils/storage.js');

// 阶乘
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  var result = 1;
  for (var i = 2; i <= n; i++) result *= i;
  return result;
}

// 安全求值（不用 eval / new Function）
function safeEval(expr) {
  // 替换显示符号为JS运算符
  var e = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  // 处理科学函数
  e = e.replace(/sin\(([^)]+)\)/g, function (m, x) { return 'Math.sin(parseFloat(' + x + '))'; });
  e = e.replace(/cos\(([^)]+)\)/g, function (m, x) { return 'Math.cos(parseFloat(' + x + '))'; });
  e = e.replace(/tan\(([^)]+)\)/g, function (m, x) { return 'Math.tan(parseFloat(' + x + '))'; });
  e = e.replace(/log\(([^)]+)\)/g, function (m, x) { return 'Math.log10(parseFloat(' + x + '))'; });
  e = e.replace(/ln\(([^)]+)\)/g, function (m, x) { return 'Math.log(parseFloat(' + x + '))'; });
  e = e.replace(/sqrt\(([^)]+)\)/g, function (m, x) { return 'Math.sqrt(parseFloat(' + x + '))'; });
  e = e.replace(/abs\(([^)]+)\)/g, function (m, x) { return 'Math.abs(parseFloat(' + x + '))'; });
  // 常量
  e = e.replace(/π/g, '(' + Math.PI + ')');
  e = e.replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, '(' + Math.E + ')');
  // 处理 x² → pow
  e = e.replace(/(\d+(?:\.\d+)?)²/g, 'Math.pow($1,2)');

  // 递归下降解析器
  try {
    return _parseExpr(e.replace(/\s/g, ''));
  } catch (err) {
    return 'Error';
  }
}

var _pos, _str;
function _parseExpr(s) {
  _pos = 0; _str = s;
  var r = _addSub();
  if (_pos < _str.length) throw 'unexpected';
  return r;
}
function _addSub() {
  var v = _mulDiv();
  while (_pos < _str.length && (_str[_pos] === '+' || _str[_pos] === '-')) {
    var op = _str[_pos++];
    var r = _mulDiv();
    v = op === '+' ? v + r : v - r;
  }
  return v;
}
function _mulDiv() {
  var v = _unary();
  while (_pos < _str.length && (_str[_pos] === '*' || _str[_pos] === '/' || _str[_pos] === '%')) {
    var op = _str[_pos++];
    var r = _unary();
    if (op === '*') v *= r;
    else if (op === '/') v /= r;
    else v %= r;
  }
  return v;
}
function _unary() {
  if (_pos < _str.length && _str[_pos] === '-') {
    _pos++;
    return -_unary();
  }
  return _primary();
}
function _primary() {
  // 处理 Math.xxx(...)
  if (_str.substr(_pos, 5) === 'Math.') {
    _pos += 5;
    var fn = '';
    while (_pos < _str.length && _str[_pos] !== '(') { fn += _str[_pos++]; }
    _pos++; // skip (
    var arg = _addSub();
    _pos++; // skip )
    if (fn === 'sin') return Math.sin(arg);
    if (fn === 'cos') return Math.cos(arg);
    if (fn === 'tan') return Math.tan(arg);
    if (fn === 'log10') return Math.log10(arg);
    if (fn === 'log') return Math.log(arg);
    if (fn === 'sqrt') return Math.sqrt(arg);
    if (fn === 'abs') return Math.abs(arg);
    if (fn === 'pow') return Math.pow(arg, 2);
    return NaN;
  }
  // 括号
  if (_pos < _str.length && _str[_pos] === '(') {
    _pos++;
    var v = _addSub();
    _pos++; // skip )
    return v;
  }
  // 数字
  var num = '';
  while (_pos < _str.length && ((_str[_pos] >= '0' && _str[_pos] <= '9') || _str[_pos] === '.')) {
    num += _str[_pos++];
  }
  return parseFloat(num);
}

Page({
  data: {
    expression: '',
    result: '',
    mode: 'deg',
    showHistory: false,
    history: []
  },

  onLoad: function () {
    var h = wx.getStorageSync('scicalc_history') || [];
    this.setData({ history: h });
  },

  setMode: function (e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  inputNum: function (e) {
    var num = e.currentTarget.dataset.num;
    var expr = this.data.expression;
    // 防止多个小数点
    if (num === '.') {
      var parts = expr.split(/[+\-×÷%()]/);
      var lastPart = parts[parts.length - 1];
      if (lastPart.indexOf('.') !== -1) return;
    }
    this.setData({ expression: expr + num });
  },

  inputOp: function (e) {
    var op = e.currentTarget.dataset.op;
    var expr = this.data.expression;
    this.setData({ expression: expr + op, result: '' });
  },

  inputFunc: function (e) {
    var fn = e.currentTarget.dataset.fn;
    var expr = this.data.expression;
    if (fn === 'pi') {
      this.setData({ expression: expr + 'π' });
    } else if (fn === 'e') {
      this.setData({ expression: expr + 'e' });
    } else if (fn === 'pow') {
      this.setData({ expression: expr + '²' });
    } else if (fn === 'fact') {
      // 计算阶乘
      var val = parseFloat(expr.replace(/[^0-9.]/g, ''));
      if (!isNaN(val) && val === Math.floor(val)) {
        var f = factorial(val);
        this.setData({ expression: expr + '!', result: String(f) });
      }
    } else if (fn === 'inv') {
      this.setData({ expression: '1÷(' + expr + ')' });
    } else if (fn === 'abs') {
      this.setData({ expression: 'abs(' + expr + ')' });
    } else {
      this.setData({ expression: expr + fn + '(' });
    }
  },

  toggleSign: function () {
    var expr = this.data.expression;
    if (expr.charAt(0) === '-') {
      this.setData({ expression: expr.substring(1) });
    } else {
      this.setData({ expression: '-' + expr });
    }
  },

  backspace: function () {
    var expr = this.data.expression;
    if (expr.length > 0) {
      this.setData({ expression: expr.substring(0, expr.length - 1), result: '' });
    }
  },

  clear: function () {
    this.setData({ expression: '', result: '' });
  },

  clearEntry: function () {
    this.setData({ result: '' });
  },

  calculate: function () {
    var expr = this.data.expression;
    if (!expr) return;

    // 角度模式处理
    var evalExpr = expr;
    if (this.data.mode === 'deg') {
      // 将 sin/cos/tan 的参数从度转弧度
      evalExpr = evalExpr.replace(/(sin|cos|tan)\(([^)]+)\)/g, function (m, fn, arg) {
        return fn + '((' + arg + ')×π÷180)';
      });
    }

    var result = safeEval(evalExpr);
    if (result === 'Error' || isNaN(result)) {
      this.setData({ result: '错误' });
      return;
    }

    // 格式化结果
    var displayResult;
    if (Math.abs(result) > 1e15 || (Math.abs(result) < 1e-10 && result !== 0)) {
      displayResult = result.toExponential(8);
    } else {
      displayResult = parseFloat(result.toPrecision(12)).toString();
    }

    this.setData({ result: displayResult });

    // 保存历史
    var history = this.data.history;
    history.unshift({ expr: expr, result: displayResult });
    if (history.length > 50) history = history.slice(0, 50);
    wx.setStorageSync('scicalc_history', history);
    this.setData({ history: history });
  },

  toggleHistory: function () {
    this.setData({ showHistory: !this.data.showHistory });
  },

  clearHistory: function () {
    this.setData({ history: [] });
    wx.setStorageSync('scicalc_history', []);
  },

  onShareAppMessage: function () {
    return { title: '科学计算器 - 支持三角函数/对数等', path: '/packages/calcTools/scicalc/index' };
  }
});