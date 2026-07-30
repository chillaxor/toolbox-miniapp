// engine.js — 乘法口诀·教学式出题引擎（纯函数，页面与 node 共用）
// 设计目标：每题都带「教学脚手架」，而非只给算式+选项。
//  模块1 意义关：几个几 → 连加 → 写乘法 → 对口诀（四步）
//  模块2 交换律：同一堆点两种摆法并排，看出「交换位置得数不变」
//  模块3 编口诀：固定因数，让孩子自己接着数推出整条口诀
//  模块4 小测验：轻量快速回忆（家长 drill 用）

var CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function cn(n) { return CN_NUM[n]; }

// 九九口诀表（小九九：小数在前）
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

// 生成点阵布局：rows 行、cols 列，每行的 gi 相同（一行=一组）
function makeLayout(rows, cols) {
  var cells = [];
  for (var i = 0; i < rows * cols; i++) {
    cells.push({ gi: Math.floor(i / cols), idx: i });
  }
  return { rows: rows, cols: cols, cells: cells };
}

function addExpr(b, a) { // a 个 b 相加
  var parts = [];
  for (var i = 0; i < a; i++) parts.push('' + b);
  return parts.join('+');
}

// ===== 模块1：意义关（四步脚手架）=====
function genMeaning(pool) {
  var a = pick(pool); // 组数
  var b = pick(pool); // 每组个数
  if (a === 1) a = 2; // 至少 2 组才有「几个几」感
  var product = a * b;
  return {
    type: 'meaning',
    groups: a,
    per: b,
    product: product,
    layout: makeLayout(a, b),
    addExpr: addExpr(b, a),
    verse: verseOf(a, b),
    verseA: cn(a),
    verseB: cn(b),
    steps: [
      { kind: 'count', prompt: '点一点，把每一组圈出来，数数有几组、每组几个', groups: a, per: b },
      { kind: 'add', prompt: addExpr(b, a) + ' = ?', answer: product, addExpr: addExpr(b, a) },
      { kind: 'mult', prompt: a + ' × ' + b + ' = ?', answer: product, a: a, b: b },
      { kind: 'verse', prompt: '这道乘法用的口诀是？', answer: verseOf(a, b), a: a, b: b }
    ]
  };
}

// ===== 模块2：交换律可视化 =====
function genCommute(pool) {
  var a = pick(pool), b = pick(pool);
  while (a === b) b = pick(pool); // 两因数不同，摆法才有区别
  var product = a * b;
  return {
    type: 'commute',
    a: a,
    b: b,
    product: product,
    layout1: makeLayout(a, b),
    layout2: makeLayout(b, a),
    label1: a + '×' + b,
    label2: b + '×' + a,
    q: { prompt: b + ' × ' + a + ' = ?', answer: product }
  };
}

// ===== 模块3：编口诀（规律发现）=====
function genPattern(factor) {
  var rows = [];
  for (var n = 1; n <= 9; n++) {
    rows.push({ n: n, product: n * factor, verse: verseOf(n, factor), blank: false });
  }
  // 随机抽 4 个空让娃填（自己接着数推出）
  var pool = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  var ask = [];
  for (var k = 0; k < 4 && pool.length; k++) {
    var ri = Math.floor(Math.random() * pool.length);
    ask.push(pool.splice(ri, 1)[0]);
  }
  ask.forEach(function (i) { rows[i].blank = true; });
  return { type: 'pattern', factor: factor, rows: rows, ask: ask };
}

// ===== 模块4：小测验（快速回忆）=====
function genProduct(pool) {
  var a = pick(pool), b = pick(pool);
  return { type: 'quiz', a: a, b: b, product: a * b, prompt: a + ' × ' + b + ' = ?', answer: a * b, verse: verseOf(a, b) };
}

var ALL_VERSES = Object.keys(VERSE).map(function (k) { return VERSE[k]; });
function verseOptions(correct) {
  var opts = [correct];
  while (opts.length < 4) {
    var v = ALL_VERSES[Math.floor(Math.random() * ALL_VERSES.length)];
    if (opts.indexOf(v) < 0) opts.push(v);
  }
  // 洗牌，避免正确答案总在第一位
  for (var i = opts.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
  }
  return opts;
}

function genQuestion(module, opts) {
  opts = opts || {};
  if (module === 'meaning') return genMeaning(opts.pool || POOLS[1]);
  if (module === 'commute') return genCommute(opts.pool || POOLS[3]);
  if (module === 'pattern') return genPattern(opts.factor || pick(POOLS[3]));
  if (module === 'quiz') return genProduct(opts.pool || POOLS[3]);
  return genMeaning(opts.pool || POOLS[1]);
}

module.exports = {
  POOLS: POOLS,
  verseOf: verseOf,
  genMeaning: genMeaning,
  genCommute: genCommute,
  genPattern: genPattern,
  genProduct: genProduct,
  genQuestion: genQuestion,
  verseOptions: verseOptions,
  makeLayout: makeLayout,
  cn: cn
};
