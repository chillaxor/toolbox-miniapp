const storage = require('../../utils/storage.js');

const BEST_KEY = 'clueguess_best';

Page({
  data: {
    phase: 'setup',          // setup | play | result
    rangeN: 50,
    roundsEach: 3,
    rangeSel: [20, 50, 100],
    roundsSel: [2, 3, 5],

    // 双人对战
    players: [
      { name: '玩家1', score: 0, details: [] },
      { name: '玩家2', score: 0, details: [] }
    ],
    curPlayerIdx: 0,
    roundSeq: 1,
    totalRounds: 6,
    roundLabel: '',

    // 当前关
    ans: 0,
    cells: [],               // [{ num, candidate }]
    clues: [],               // [{ text }]
    usedClues: 0,
    maxClues: 0,
    canNextClue: true,
    revealed: false,
    win: false,
    guessNum: 0,
    answerNum: 0,
    roundGain: 0,

    // 结果
    winnerText: '',
    draw: false,
    p0win: false,
    p1win: false,
    best: 0,

    isFavorite: false
  },

  onLoad: function () {
    this.setData({ isFavorite: storage.isFavorite('clueguess') });
  },

  // ---------- setup ----------
  selectRange: function (e) {
    this.setData({ rangeN: Number(e.currentTarget.dataset.v) });
  },
  selectRounds: function (e) {
    this.setData({ roundsEach: Number(e.currentTarget.dataset.v) });
  },

  onStart: function () {
    var roundsEach = this.data.roundsEach;
    this.setData({
      players: [
        { name: '玩家1', score: 0, details: [] },
        { name: '玩家2', score: 0, details: [] }
      ],
      curPlayerIdx: 0,
      roundSeq: 1,
      totalRounds: roundsEach * 2,
      phase: 'play'
    });
    this.startRound();
  },

  // ---------- 出题 + 线索生成 ----------
  startRound: function () {
    var N = this.data.rangeN;
    var ans = randInt(N);                 // 1..N 谜底
    var clues = buildClues(ans, N);       // 由粗到细的线索序列（含 test 函数）
    // 预计算每条线索后的候选快照，用于逐步缩圈
    var cur = [];
    for (var i = 1; i <= N; i++) cur.push(i);
    var snapshots = [];
    for (var c = 0; c < clues.length; c++) {
      var testFn = clues[c].test;
      cur = cur.filter(function (x) { return testFn(x); });
      snapshots.push(cur.slice());
    }
    // 初始全亮
    var cells = [];
    for (var k = 1; k <= N; k++) cells.push({ num: k, candidate: true });

    this._clues = clues;
    this._snapshots = snapshots;

    var idx = this.data.curPlayerIdx;
    var label = '第 ' + this.data.roundSeq + ' / ' + this.data.totalRounds + ' 关 · ' + (idx === 0 ? '玩家1' : '玩家2');
    this.setData({
      ans: ans,
      cells: cells,
      clues: [],
      usedClues: 0,
      maxClues: clues.length,
      canNextClue: clues.length > 0,
      revealed: false,
      win: false,
      guessNum: 0,
      answerNum: ans,
      roundGain: 0,
      roundLabel: label
    });
  },

  // ---------- 逐步解锁线索（缩圈） ----------
  nextClue: function () {
    if (this.data.revealed) return;
    if (this.data.usedClues >= this.data.maxClues) return;
    var idx = this.data.usedClues;
    var clue = this._clues[idx];
    var snap = this._snapshots[idx];
    var keep = {};
    for (var i = 0; i < snap.length; i++) keep[snap[i]] = true;
    var cells = this.data.cells.map(function (cell) {
      return { num: cell.num, candidate: !!keep[cell.num] };
    });
    var clues = this.data.clues.concat([{ text: (idx + 1) + '. ' + clue.text }]);
    var nextUsed = idx + 1;
    this.setData({
      cells: cells,
      clues: clues,
      usedClues: nextUsed,
      canNextClue: nextUsed < this.data.maxClues
    });
  },

  // ---------- 点亮的编号 = 提交猜测 ----------
  onCellTap: function (e) {
    if (this.data.revealed) return;
    var num = Number(e.currentTarget.dataset.num);
    var cell = this.data.cells[num - 1];
    if (!cell.candidate) return;          // 已灰的不能选
    var K = this.data.usedClues;
    var win = (num === this.data.ans);
    var gain = win ? Math.max(100, 1000 - K * 120) : 0;

    var players = this.data.players;
    var p = players[this.data.curPlayerIdx];
    p.details.push({ win: win, clues: K, gain: gain });
    p.score += gain;
    players[this.data.curPlayerIdx] = p;

    this.setData({
      players: players,
      revealed: true,
      canNextClue: false,
      win: win,
      guessNum: num,
      roundGain: gain
    });
    wx.vibrateShort({ type: win ? 'light' : 'heavy' });
  },

  // ---------- 下一关 / 结束 ----------
  nextRound: function () {
    var roundsEach = this.data.roundsEach;
    var curPlayerIdx = this.data.curPlayerIdx;
    var curDone = this.data.players[curPlayerIdx].details.length;
    if (curDone >= roundsEach) {
      curPlayerIdx = 1 - curPlayerIdx;    // 换人
    }
    var totalDone = this.data.players[0].details.length + this.data.players[1].details.length;
    if (totalDone >= roundsEach * 2) {
      // 结束
      var p0 = this.data.players[0].score;
      var p1 = this.data.players[1].score;
      var draw = (p0 === p1);
      var p0win = (p0 > p1);
      var winnerText = draw ? '🤝 平局！' : (p0win ? '🏆 玩家1 获胜！' : '🏆 玩家2 获胜！');
      var best = storage.getSync(BEST_KEY, 0);
      var top = Math.max(p0, p1);
      if (top > best) { storage.setSync(BEST_KEY, top); best = top; }
      storage.addHistory({ toolId: 'clueguess', toolName: '线索缩圈猜编号', category: 'fun', summary: '双人对战 ' + p0 + ':' + p1 });
      this.setData({ phase: 'result', draw: draw, p0win: p0win, winnerText: winnerText, best: best });
      return;
    }
    this.setData({ curPlayerIdx: curPlayerIdx, roundSeq: totalDone + 1, phase: 'play' });
    this.startRound();
  },

  // ---------- result ----------
  onBackSetup: function () {
    this.setData({ phase: 'setup' });
  },
  replay: function () {
    var first = this.data.curPlayerIdx === 0 ? 1 : 0;   // 交换先手
    this.setData({
      players: [
        { name: '玩家1', score: 0, details: [] },
        { name: '玩家2', score: 0, details: [] }
      ],
      curPlayerIdx: first,
      roundSeq: 1,
      totalRounds: this.data.roundsEach * 2,
      phase: 'play'
    });
    this.startRound();
  },
  toggleFavorite: function () {
    var f = storage.toggleFavorite('clueguess');
    this.setData({ isFavorite: f });
  },
  onShareAppMessage: function () {
    var p = this.data.players;
    return {
      title: '线索缩圈猜编号：' + p[0].name + ' ' + p[0].score + ' : ' + p[1].score + ' ' + p[1].name,
      path: '/pages/tools/clueguess/index'
    };
  }
});

// ============ 工具函数 ============
function randInt(n) { return Math.floor(Math.random() * n) + 1; }

// 由粗到细生成线索，保证 ans 始终在候选内，且大致层层减半
function buildClues(ans, N) {
  var candidates = [];
  for (var i = 1; i <= N; i++) candidates.push(i);
  var clues = [];
  var guard = 0;
  while (candidates.length > 3 && guard < 12) {
    guard++;
    var c = pickClue(candidates, ans);
    if (!c) break;
    clues.push(c);
    var testFn = c.test;
    candidates = candidates.filter(function (x) { return testFn(x); });
  }
  return clues;
}

function pickClue(cands, ans) {
  // 1) 二分切（约减半，且保留 ans 所在侧）
  if (cands.length >= 4) {
    var sorted = cands.slice().sort(function (a, b) { return a - b; });
    var mid = sorted[Math.floor(sorted.length / 2)];
    if (ans > mid) {
      return { text: '编号 > ' + mid, test: function (x) { return x > mid; } };
    }
    return { text: '编号 ≤ ' + mid, test: function (x) { return x <= mid; } };
  }
  // 2) 奇偶
  var odd = cands.filter(function (x) { return x % 2 === 1; });
  var even = cands.filter(function (x) { return x % 2 === 0; });
  if (odd.length > 0 && even.length > 0 && odd.length !== cands.length && even.length !== cands.length) {
    if (ans % 2 === 0) {
      return { text: '编号是偶数', test: function (x) { return x % 2 === 0; } };
    }
    return { text: '编号是奇数', test: function (x) { return x % 2 === 1; } };
  }
  // 3) 整除余数
  var ds = [3, 4, 5];
  for (var i = 0; i < ds.length; i++) {
    var d = ds[i];
    var r = ans % d;
    var side = cands.filter(function (x) { return x % d === r; });
    if (side.length > 0 && side.length < cands.length) {
      return {
        text: r === 0 ? ('编号能被 ' + d + ' 整除') : ('编号除以 ' + d + ' 余 ' + r),
        test: function (x) { return x % d === r; }
      };
    }
  }
  // 4) 位数
  var isSingle = ans < 10;
  var singleSide = cands.filter(function (x) { return x < 10; });
  if (singleSide.length > 0 && singleSide.length < cands.length) {
    return { text: isSingle ? '编号是个位数' : '编号是两位数', test: function (x) { return isSingle ? x < 10 : x >= 10; } };
  }
  // 5) 数字和
  var sum = digitSum(ans);
  var sumSide = cands.filter(function (x) { return digitSum(x) === sum; });
  if (sumSide.length > 0 && sumSide.length < cands.length) {
    return { text: '各位数字之和等于 ' + sum, test: function (x) { return digitSum(x) === sum; } };
  }
  // 6) 首位
  var head = firstDigit(ans);
  var headSide = cands.filter(function (x) { return firstDigit(x) === head; });
  if (headSide.length > 0 && headSide.length < cands.length) {
    return { text: '编号的首位是 ' + head, test: function (x) { return firstDigit(x) === head; } };
  }
  return null;
}

function digitSum(n) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; }
function firstDigit(n) { while (n >= 10) n = Math.floor(n / 10); return n; }
