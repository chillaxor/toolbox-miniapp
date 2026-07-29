/**
 * 找规律填数 - 题目生成器（纯函数模块，可在 node 离线批量校验）
 * 原则：
 * 1. 正向生成：先定规律再造数列，绝不反向凑题
 * 2. 歧义检测：穷举空位所有可能取值，套所有规律判定器，多解即弃题重生成
 * 3. answer 统一存「用户应填入的数」
 */

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pickOne(arr) { return arr[randInt(0, arr.length - 1)]; }

/* ================= 规律判定器（作用于完整数列） ================= */

function isArith(s) {
  var d = s[1] - s[0];
  for (var i = 2; i < s.length; i++) { if (s[i] - s[i - 1] !== d) return false; }
  return true;
}

function isGeo(s) {
  var i;
  for (i = 0; i < s.length; i++) { if (s[i] <= 0) return false; }
  for (i = 2; i < s.length; i++) {
    if (s[i] * s[i - 2] !== s[i - 1] * s[i - 1]) return false;
  }
  return s[1] !== s[0]; // 公比 1 = 常数列，归等差管
}

function isQuad(s) { // 二阶差相等（含等差退化情形，答案一致无碍）
  var d2 = (s[2] - s[1]) - (s[1] - s[0]);
  for (var i = 3; i < s.length; i++) {
    if ((s[i] - s[i - 1]) - (s[i - 1] - s[i - 2]) !== d2) return false;
  }
  return true;
}

function isFib(s) {
  for (var i = 2; i < s.length; i++) { if (s[i] !== s[i - 1] + s[i - 2]) return false; }
  return true;
}

function isInterleave(s) {
  var a = [], b = [], i;
  for (i = 0; i < s.length; i++) { (i % 2 === 0 ? a : b).push(s[i]); }
  if (a.length < 3 || b.length < 3) return false; // 子列不足 3 项不可判定
  return isArith(a) && isArith(b);
}

function isCycle(s) {
  for (var p = 2; p <= 4; p++) {
    if (s.length < 2 * p) continue;
    var ok = true, i;
    for (i = p; i < s.length; i++) { if (s[i] !== s[i - p]) { ok = false; break; } }
    if (!ok) continue;
    var allSame = true;
    for (i = 1; i < p; i++) { if (s[i] !== s[0]) allSame = false; }
    if (!allSame) return true; // 常数列不算循环
  }
  return false;
}

function fitsAnyRule(s) {
  return isArith(s) || isGeo(s) || isQuad(s) || isFib(s) || isInterleave(s) || isCycle(s);
}

/* ================= 歧义检测：穷举空位取值 ================= */

function findAllAnswers(seq, blankIndex) {
  var maxV = 0, i;
  for (i = 0; i < seq.length; i++) { if (i !== blankIndex && seq[i] > maxV) maxV = seq[i]; }
  var upper = Math.min(maxV * 3 + 30, 1500);
  var found = [];
  var s = seq.slice();
  for (var v = 0; v <= upper; v++) {
    s[blankIndex] = v;
    if (fitsAnyRule(s)) {
      found.push(v);
      if (found.length > 2) break; // 已确定多解，提前结束
    }
  }
  return found;
}

/* ================= 各类型正向生成 ================= */
/* 返回 { seq, meta:{...}, hint1, ruleText, marks, grpMode } */

function genAdd(level) {
  var d = level === 1 ? randInt(1, 5) : randInt(2, 9);
  var a0 = level === 1 ? randInt(1, 10) : randInt(1, 40);
  var len = level === 1 ? 5 : pickOne([5, 6]);
  var seq = [], marks = [];
  for (var i = 0; i < len; i++) { seq.push(a0 + i * d); }
  for (i = 0; i < len - 1; i++) { marks.push('+' + d); }
  return {
    seq: seq, marks: marks, grpMode: false,
    hint1: '算一算相邻两个数相差多少？',
    ruleText: '规律：每次 +' + d
  };
}

function genSub(level) {
  var d = level === 1 ? randInt(1, 5) : randInt(2, 9);
  var len = level === 1 ? 5 : pickOne([5, 6]);
  var a0 = (len - 1) * d + randInt(0, level === 1 ? 10 : 30);
  var seq = [], marks = [];
  for (var i = 0; i < len; i++) { seq.push(a0 - i * d); }
  for (i = 0; i < len - 1; i++) { marks.push('-' + d); }
  return {
    seq: seq, marks: marks, grpMode: false,
    hint1: '数在变小，算一算每次少了多少？',
    ruleText: '规律：每次 -' + d
  };
}

function genGeo() {
  var r = pickOne([2, 3]);
  var a0 = r === 2 ? randInt(1, 6) : randInt(1, 3);
  var len = 5;
  var seq = [], marks = [];
  var v = a0;
  for (var i = 0; i < len; i++) { seq.push(v); v = v * r; }
  for (i = 0; i < len - 1; i++) { marks.push('×' + r); }
  return {
    seq: seq, marks: marks, grpMode: false,
    hint1: '试试乘法：后一个数是前一个数的几倍？',
    ruleText: '规律：每次 ×' + r
  };
}

function genInterleave() {
  var len = pickOne([6, 7]);
  var a0 = randInt(1, 9), dA = randInt(1, 5);
  var b0 = randInt(1, 9), dB = randInt(0, 5);
  if (a0 === b0 && dA === dB) { b0 = a0 + randInt(3, 9); }
  var seq = [];
  for (var i = 0; i < len; i++) {
    var k = Math.floor(i / 2);
    seq.push(i % 2 === 0 ? a0 + k * dA : b0 + k * dB);
  }
  var ruleB = dB === 0 ? '一直是 ' + b0 : '每次 +' + dB;
  return {
    seq: seq, marks: [], grpMode: true,
    hint1: '隔一个看一看——其实是两串数在排队哦',
    ruleText: '规律：蓝色一串每次 +' + dA + '，橙色一串' + ruleB
  };
}

function genDiff2() {
  var a0 = randInt(1, 9), d1 = randInt(1, 3), inc = randInt(1, 2);
  var len = pickOne([5, 6]);
  var seq = [a0], marks = [];
  for (var i = 1; i < len; i++) {
    var d = d1 + (i - 1) * inc;
    seq.push(seq[i - 1] + d);
    marks.push('+' + d);
  }
  return {
    seq: seq, marks: marks, grpMode: false,
    hint1: '相邻的差也藏着规律哦，把差都写出来看看？',
    ruleText: '规律：相差依次是 ' + marks.join('、').replace(/\+/g, '') + '（每次多 ' + inc + '）'
  };
}

function genFib() {
  var a = randInt(1, 4), b = randInt(a, 6);
  var len = 6;
  var seq = [a, b];
  for (var i = 2; i < len; i++) { seq.push(seq[i - 1] + seq[i - 2]); }
  return {
    seq: seq, marks: [], grpMode: false,
    hint1: '把前两个数加起来看看？',
    ruleText: '规律：每个数 = 前两个数之和'
  };
}

function genSquare() {
  var variant = pickOne(['sq', 'tri']);
  var seq = [], i;
  if (variant === 'sq') {
    var n0 = randInt(1, 4);
    for (i = 0; i < 5; i++) { var n = n0 + i; seq.push(n * n); }
    return {
      seq: seq, marks: [], grpMode: false,
      hint1: '这些数都是「某个数 × 它自己」哦',
      ruleText: '规律：' + n0 + '×' + n0 + ', ' + (n0 + 1) + '×' + (n0 + 1) + ', ' + (n0 + 2) + '×' + (n0 + 2) + ' … 平方数'
    };
  }
  var m0 = randInt(1, 4);
  for (i = 0; i < 5; i++) { var m = m0 + i; seq.push(m * (m + 1) / 2); }
  return {
    seq: seq, marks: [], grpMode: false,
    hint1: '相邻的差在一个一个变大哦',
    ruleText: '规律：1、1+2、1+2+3 … 这样累加出来的三角数'
  };
}

function genCycle() {
  var p = pickOne([3, 4]);
  var unit = [], i;
  for (i = 0; i < p; i++) {
    var v = randInt(1, 9);
    while (unit.indexOf(v) > -1) { v = randInt(1, 9); }
    unit.push(v);
  }
  var len = p === 3 ? 7 : 8;
  var seq = [];
  for (i = 0; i < len; i++) { seq.push(unit[i % p]); }
  return {
    seq: seq, marks: [], grpMode: false,
    hint1: '有没有发现它在重复？',
    ruleText: '规律：「' + unit.join('、') + '」每 ' + p + ' 个一循环'
  };
}

var GENERATORS = {
  add: genAdd, sub: genSub, geo: genGeo, interleave: genInterleave,
  diff2: genDiff2, fib: genFib, square: genSquare, cycle: genCycle
};

var TYPE_LABELS = {
  add: '等差(变大)', sub: '等差(变小)', geo: '等比', interleave: '双数列',
  diff2: '差递增', fib: '斐波那契', square: '平方·三角数', cycle: '循环'
};

// 难度 → 类型池
var TYPE_POOLS = {
  1: ['add', 'sub'],
  2: ['add', 'sub', 'geo', 'interleave', 'diff2'],
  3: ['geo', 'interleave', 'diff2', 'fib', 'square', 'cycle']
};

/* ================= 挖空 + 干扰项 ================= */

function pickBlankIndex(seq, level) {
  if (level === 1) return seq.length - 1; // 入门只挖末尾
  return randInt(2, seq.length - 1);      // 进阶起不挖前两项
}

function makeOptions(seq, blankIndex, answer) {
  var cand = [];
  var d = Math.abs(seq[1] - seq[0]) || 1;
  cand.push(answer + d);
  cand.push(answer - d);
  if (blankIndex > 0) cand.push(seq[blankIndex - 1]);                    // 直接抄邻居
  if (blankIndex < seq.length - 1) cand.push(seq[blankIndex + 1]);
  if (blankIndex >= 2) cand.push(seq[blankIndex - 1] + (seq[blankIndex - 1] - seq[blankIndex - 2])); // 错规律推算
  cand.push(answer + 1); cand.push(answer - 1);
  cand.push(answer + 2); cand.push(answer + 10);

  var opts = [], i;
  for (i = 0; i < cand.length && opts.length < 3; i++) {
    var c = cand[i];
    if (c >= 0 && c !== answer && opts.indexOf(c) === -1) opts.push(c);
  }
  var guard = 0;
  while (opts.length < 3 && guard < 50) {
    guard++;
    var f = answer + randInt(2, 15);
    if (f !== answer && opts.indexOf(f) === -1) opts.push(f);
  }
  opts.push(answer);
  // 洗牌
  for (i = opts.length - 1; i > 0; i--) {
    var j = randInt(0, i);
    var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
  }
  return { options: opts, correctIndex: opts.indexOf(answer) };
}

/* ================= 出题主入口 ================= */

/**
 * 生成一道经过歧义校验的题
 * @param {string} type - 规律类型
 * @param {number} level - 难度 1/2/3
 * @returns {object|null} 题目对象（约 60 次重试仍失败返回 null）
 */
function createQuestion(type, level) {
  var gen = GENERATORS[type];
  if (!gen) return null;
  for (var attempt = 0; attempt < 60; attempt++) {
    var g = gen(level);
    var seq = g.seq;
    var blankIndex = pickBlankIndex(seq, level);
    var answer = seq[blankIndex];
    // 数值上限保护（卡片显示 3 位数以内）
    var tooBig = false;
    for (var i = 0; i < seq.length; i++) { if (seq[i] > 999 || seq[i] < 0) tooBig = true; }
    if (tooBig) continue;
    // 歧义检测：空位必须有且仅有一个自洽解，且就是预期答案
    var all = findAllAnswers(seq, blankIndex);
    if (all.length !== 1 || all[0] !== answer) continue;

    var oc = makeOptions(seq, blankIndex, answer);
    return {
      type: type,
      typeLabel: TYPE_LABELS[type],
      seq: seq,
      blankIndex: blankIndex,
      answer: answer,
      marks: g.marks,
      hasMarks: g.marks.length > 0,
      grpMode: g.grpMode,
      hint1: g.hint1,
      ruleText: g.ruleText,
      options: oc.options,
      correctIndex: oc.correctIndex
    };
  }
  return null;
}

module.exports = {
  createQuestion: createQuestion,
  TYPE_POOLS: TYPE_POOLS,
  TYPE_LABELS: TYPE_LABELS,
  _internal: {
    isArith: isArith, isGeo: isGeo, isQuad: isQuad, isFib: isFib,
    isInterleave: isInterleave, isCycle: isCycle,
    findAllAnswers: findAllAnswers, GENERATORS: GENERATORS
  }
};
