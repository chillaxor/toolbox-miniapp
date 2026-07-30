// engine.js — 除法启蒙·教学式出题引擎（纯函数，页面与 node 共用）
// 设计目标：每题都带「教学脚手架」，而非只给算式+选项。
//  模块1 意义关：圈组平均分 → 连减 → 写除法 → 用乘法口诀求商（四步）
//  模块2 分法对比：同一堆点，等分除与包含除两种读法，看出「都用同一句口诀」
//  模块3 编商：固定除数，让孩子自己用连减/口诀推出整条
//  模块4 小测验：轻量快速回忆（家长 drill 用）

var CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function cn(n) { return CN_NUM[n]; }

// 九九口诀表（小九九：小数在前）——除法求商也用同一张表
var VERSE = {};
function setVerse(a, b, v) { VERSE[a * 10 + b] = v; }
setVerse(1, 1, '一一得一');
setVerse(1, 2, '一二得二'); setVerse(2, 2, '二二得四');
setVerse(1, 3, '一三得三'); setVerse(2, 3, '二三得六'); setVerse(3, 3, '三三得九');
setVerse(1, 4, '一四得四'); setVerse(2, 4, '二四得八'); setVerse(3, 4, '三四十二'); setVerse(4, 4, '四四十六');
setVerse(1, 5, '一五得五'); setVerse(2, 5, '二五一十'); setVerse(3, 5, '三五十五'); setVerse(4, 5, '四五二十'); setVerse(5, 5, '五五二十五');
setVerse(1, 6, '一六得六'); setVerse(2, 6, '二六十二'); setVerse(3, 6, '三六十八'); setVerse(4, 6, '四六二十四'); setVerse(5, 6, '五六三十'); setVerse(6, 6, '六六三十六');
setVerse(1, 7, '一七得七'); setVerse(2, 7, '二七十四'); setVerse(3, 7, '三七二十一'); setVerse(4, 7, '四七二十八'); setVerse(5, 7, '五七三十五'); setVerse(6, 7, '六七四十二'); setVerse(7, 7, '七七四十九');
setVerse(1, 8, '一八得八'); setVerse(2, 8, '二八十六'); setVerse(3, 8, '三八二十四'); setVerse(4, 8, '四八三十二'); setVerse(5, 8, '五八四十'); setVerse(6, 8, '六八四十八'); setVerse(7, 8, '七八五十六'); setVerse(8, 8, '八八六十四');
setVerse(1, 9, '一九得九'); setVerse(2, 9, '二九十八'); setVerse(3, 9, '三九二十七'); setVerse(4, 9, '四九三十六'); setVerse(5, 9, '五九四十五'); setVerse(6, 9, '六九五十四'); setVerse(7, 9, '七九六十三'); setVerse(8, 9, '八九七十二'); setVerse(9, 9, '九九八十一');

function verseOf(a, b) {
  var lo = Math.min(a, b), hi = Math.max(a, b);
  return VERSE[lo * 10 + hi];
}

var POOLS = {
  1: [2, 3, 4, 5],
  2: [6, 7, 8, 9],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9]
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 点阵布局：rows 行、cols 列，每行的 gi 相同（一行=一份）
function makeLayout(rows, cols) {
  var cells = [];
  for (var i = 0; i < rows * cols; i++) {
    cells.push({ gi: Math.floor(i / cols), idx: i });
  }
  return { rows: rows, cols: cols, cells: cells };
}

// 连减式：dividend 每次减 quotient，共 divisor 次得 0
function subExpr(dividend, quotient, divisor) {
  var parts = [];
  for (var i = 0; i < divisor; i++) parts.push('' + quotient);
  return dividend + ' − ' + parts.join(' − ') + ' = 0';
}

// ===== 模块1：意义关（四步脚手架，等分除）=====
function genMeaning(pool) {
  var divisor = pick(pool);  // 份数（除数）
  var quotient = pick(pool); // 每份个数（商）
  if (divisor === 1) divisor = 2;
  if (quotient === 1) quotient = 2;
  var dividend = divisor * quotient;
  return {
    type: 'meaning',
    divisor: divisor,
    quotient: quotient,
    dividend: dividend,
    groups: divisor,
    per: quotient,
    layout: makeLayout(divisor, quotient),
    subExpr: subExpr(dividend, quotient, divisor),
    verse: verseOf(divisor, quotient),
    steps: [
      { kind: 'count', prompt: '把 ' + dividend + ' 个平均分成 ' + divisor + ' 份，每份几个？点一点把每一份圈出来', groups: divisor, per: quotient },
      { kind: 'sub', prompt: subExpr(dividend, quotient, divisor) + '，一共减了几次？', answer: divisor, dividend: dividend, quotient: quotient, divisor: divisor },
      { kind: 'div', prompt: dividend + ' ÷ ' + divisor + ' = ?', answer: quotient, dividend: dividend, divisor: divisor },
      { kind: 'verse', prompt: '用哪句乘法口诀算出商？', answer: verseOf(divisor, quotient), dividend: dividend, divisor: divisor, quotient: quotient }
    ]
  };
}

// ===== 模块2：分法对比（等分除 vs 包含除，同一堆点）=====
function genCompare(pool) {
  var divisor = pick(pool), quotient = pick(pool);
  while (divisor === quotient) quotient = pick(pool);
  var dividend = divisor * quotient;
  // 同一堆点：3 组每组 4（等分：12÷3=4）；也读作每 4 个一份共 3 份（包含：12÷4=3）
  var layout = makeLayout(divisor, quotient);
  return {
    type: 'compare',
    divisor: divisor,
    quotient: quotient,
    dividend: dividend,
    layout: layout,
    label1: dividend + ' ÷ ' + divisor + ' = ' + quotient,   // 等分除（参考，已给答案）
    label2: dividend + ' ÷ ' + quotient + ' = ?',            // 包含除（要填：份数=divisor）
    q: { prompt: dividend + ' ÷ ' + quotient + ' = ?', answer: divisor },
    verse: verseOf(divisor, quotient)
  };
}

// ===== 模块3：编商（规律发现，固定除数）=====
function genPattern(divisor) {
  var rows = [];
  for (var n = 1; n <= 9; n++) {
    var dividend = n * divisor;
    rows.push({ n: n, dividend: dividend, quotient: n, verse: verseOf(divisor, n), blank: false });
  }
  var poolIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  var ask = [];
  for (var k = 0; k < 4 && poolIdx.length; k++) {
    var ri = Math.floor(Math.random() * poolIdx.length);
    ask.push(poolIdx.splice(ri, 1)[0]);
  }
  ask.forEach(function (i) { rows[i].blank = true; });
  return { type: 'pattern', divisor: divisor, rows: rows, ask: ask };
}

// ===== 模块4：小测验（快速回忆）=====
function genQuiz(pool) {
  var divisor = pick(pool), quotient = pick(pool);
  var dividend = divisor * quotient;
  return { type: 'quiz', dividend: dividend, divisor: divisor, quotient: quotient, prompt: dividend + ' ÷ ' + divisor + ' = ?', answer: quotient, verse: verseOf(divisor, quotient) };
}

var ALL_VERSES = Object.keys(VERSE).map(function (k) { return VERSE[k]; });
function verseOptions(correct) {
  var opts = [correct];
  while (opts.length < 4) {
    var v = ALL_VERSES[Math.floor(Math.random() * ALL_VERSES.length)];
    if (opts.indexOf(v) < 0) opts.push(v);
  }
  for (var i = opts.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
  }
  return opts;
}

function genQuestion(module, opts) {
  opts = opts || {};
  if (module === 'meaning') return genMeaning(opts.pool || POOLS[1]);
  if (module === 'compare') return genCompare(opts.pool || POOLS[3]);
  if (module === 'pattern') return genPattern(opts.divisor || pick(POOLS[3]));
  if (module === 'quiz') return genQuiz(opts.pool || POOLS[3]);
  return genMeaning(opts.pool || POOLS[1]);
}

module.exports = {
  POOLS: POOLS,
  verseOf: verseOf,
  genMeaning: genMeaning,
  genCompare: genCompare,
  genPattern: genPattern,
  genQuiz: genQuiz,
  genQuestion: genQuestion,
  verseOptions: verseOptions,
  makeLayout: makeLayout,
  cn: cn
};
