var storage = require('../../../utils/storage.js');

var TOTAL_OPTIONS = [5, 8, 10, 15];
var DEFAULT_TOTAL = 8;
var GRID = 5;

var TREASURES = ['💎', '📦', '⭐', '🍬', '🧸', '🗝️', '🏆', '💰'];

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// 建一个 GRID×GRID 的网格：每行 { head:行号, cells:[{x,y,key,cls,emoji}] }
function buildGrid() {
  var rows = [];
  for (var y = 1; y <= GRID; y++) {
    var cells = [];
    for (var x = 1; x <= GRID; x++) {
      cells.push({ x: x, y: y, key: x + ',' + y, cls: 'cell', emoji: '' });
    }
    rows.push({ head: y, cells: cells });
  }
  return rows;
}

function setCell(grid, x, y, cls, emoji) {
  var row = grid[y - 1];
  if (!row) return;
  for (var i = 0; i < row.cells.length; i++) {
    if (row.cells[i].x === x) {
      row.cells[i].cls = cls;
      if (emoji !== undefined) row.cells[i].emoji = emoji;
      return;
    }
  }
}

function cloneGrid(grid) {
  return grid.map(function (r) {
    return {
      head: r.head,
      cells: r.cells.map(function (c) {
        return { x: c.x, y: c.y, key: c.key, cls: c.cls, emoji: c.emoji };
      })
    };
  });
}

// 生成一题。type: A 按坐标挖宝 / B 宝物坐标是什么 / C 按线索走 / D 中文描述找格子
function genQuestion(type) {
  var tx = randInt(1, GRID), ty = randInt(1, GRID);
  var emoji = pick(TREASURES);

  if (type === 'A') {
    return { type: 'A', tx: tx, ty: ty, emoji: emoji,
      prompt: '宝物藏在 (' + tx + ', ' + ty + ')，在格子里点出来！' };
  }
  if (type === 'D') {
    return { type: 'D', tx: tx, ty: ty, emoji: emoji,
      prompt: '宝物在第 ' + tx + ' 列、第 ' + ty + ' 行，在格子里点出来！' };
  }
  if (type === 'B') {
    var opts = [{ x: tx, y: ty }];
    var guard = 0;
    while (opts.length < 4 && guard < 300) {
      guard++;
      var dx = randInt(1, GRID), dy = randInt(1, GRID);
      if (dx === tx && dy === ty) continue;
      var dup = false;
      for (var k = 0; k < opts.length; k++) {
        if (opts[k].x === dx && opts[k].y === dy) { dup = true; break; }
      }
      if (dup) continue;
      opts.push({ x: dx, y: dy });
    }
    shuffle(opts);
    var correctIndex = -1;
    for (var ci = 0; ci < opts.length; ci++) {
      if (opts[ci].x === tx && opts[ci].y === ty) { correctIndex = ci; break; }
    }
    var options = opts.map(function (o) { return { text: '(' + o.x + ', ' + o.y + ')', cls: 'opt' }; });
    return { type: 'B', tx: tx, ty: ty, emoji: emoji,
      prompt: '这个宝物在第几列、第几行？它的坐标是？',
      options: options, correctIndex: correctIndex };
  }

  // type C 走线索：起点在内部(2..4)，随机 1-2 步，保证落点在网格内
  var sx = randInt(2, 4), sy = randInt(2, 4);
  var dirs = [
    { name: '右', dx: 1, dy: 0 },
    { name: '左', dx: -1, dy: 0 },
    { name: '上', dx: 0, dy: -1 },
    { name: '下', dx: 0, dy: 1 }
  ];
  var nMoves = Math.random() < 0.5 ? 1 : 2;
  var cx = sx, cy = sy;
  var moves = [];
  var g2 = 0;
  while (moves.length < nMoves && g2 < 200) {
    g2++;
    var d = pick(dirs);
    var n = randInt(1, 2);
    var nx = cx + d.dx * n, ny = cy + d.dy * n;
    if (nx < 1 || nx > GRID || ny < 1 || ny > GRID) continue;
    cx = nx; cy = ny;
    moves.push({ name: d.name, n: n });
  }
  var clueText = '从 🧭 出发：' + moves.map(function (m) { return '向' + m.name + '走 ' + m.n + ' 格'; }).join('，再 ') + '，最后停在哪一格？';
  return { type: 'C', sx: sx, sy: sy, fx: cx, fy: cy, emoji: emoji,
    prompt: '跟着线索走到终点，点出最后一格！', clueText: clueText };
}

// 出题顺序：保证至少出现 A 与 B（读写都练），其余随机
function buildOrder(total) {
  var order = ['A', 'B'];
  var pool = ['A', 'B', 'C', 'D'];
  while (order.length < total) order.push(pick(pool));
  return shuffle(order);
}

Page({
  data: {
    state: 'intro',
    totalOptions: TOTAL_OPTIONS,
    total: DEFAULT_TOTAL,
    colNums: [1, 2, 3, 4, 5],
    index: 0,
    score: 0,
    progress: 0,
    gridRows: [],
    questionType: 'A',
    prompt: '',
    clueText: '',
    showStart: false,
    showOptions: false,
    options: [],
    correctIndex: -1,
    selectedIndex: -1,
    answered: false,
    solved: false,
    isCorrect: false,
    feedbackText: '',
    isLast: false,
    stars: 0,
    starList: [1, 2, 3],
    historyList: []
  },

  onLoad: function () {
    
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.coordinate !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.setData({ historyList: storage.getSync('coordinate_history', []) || [] });
  },

  onUnload: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  },

  onSelectCount: function (e) {
    this.setData({ total: Number(e.currentTarget.dataset.count) });
  },

  startGame: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._order = buildOrder(this.data.total);
    this.setData({ state: 'play', index: 0, score: 0, progress: 0,
      answered: false, solved: false, feedbackText: '', selectedIndex: -1 });
    this.loadQuestion(0);
  },

  loadQuestion: function (idx) {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var type = this._order[idx];
    var q = genQuestion(type);
    var grid = buildGrid();
    if (type === 'B') setCell(grid, q.tx, q.ty, 'cell cell-treasure', q.emoji);
    if (type === 'C') setCell(grid, q.sx, q.sy, 'cell cell-start', '🧭');
    var correct = (type === 'C') ? { x: q.fx, y: q.fy } : { x: q.tx, y: q.ty };
    this._correct = correct;
    this._q = q;
    this.setData({
      gridRows: grid,
      questionType: type,
      prompt: q.prompt,
      clueText: type === 'C' ? q.clueText : '',
      showStart: type === 'C',
      showOptions: type === 'B',
      options: type === 'B' ? q.options : [],
      correctIndex: type === 'B' ? q.correctIndex : -1,
      selectedIndex: -1,
      answered: false,
      solved: false,
      isCorrect: false,
      feedbackText: '',
      index: idx,
      progress: Math.round(idx / this.data.total * 100),
      isLast: idx === this.data.total - 1
    });
  },

  // 格子点击（题型 A / C / D；题型 B 用选项作答，禁用格子点击）
  onCellTap: function (e) {
    if (this.data.showOptions) return;
    if (this.data.answered) return;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var x = Number(e.currentTarget.dataset.x);
    var y = Number(e.currentTarget.dataset.y);
    var c = this._correct;
    if (x === c.x && y === c.y) {
      var grid = cloneGrid(this.data.gridRows);
      setCell(grid, x, y, 'cell cell-found', this._q.emoji);
      var sc = this.data.score + 1;
      this.setData({ gridRows: grid, answered: true, solved: true, score: sc,
        feedbackText: '找到啦 🎉 坐标 (' + x + ', ' + y + ')' });
      var self = this;
      this._timer = setTimeout(function () { self._timer = null; self.next(); }, 1100);
    } else {
      // 点错：闪烁提示，允许重试（不计错）
      var gwrong = cloneGrid(this.data.gridRows);
      setCell(gwrong, x, y, 'cell cell-wrong', '');
      this.setData({ gridRows: gwrong, feedbackText: this.data.questionType === 'C' ? '跟着线索数一数～' : '再看看坐标哦～' });
      var self2 = this;
      setTimeout(function () {
        var g3 = cloneGrid(self2.data.gridRows);
        setCell(g3, x, y, 'cell', '');
        self2.setData({ gridRows: g3 });
      }, 500);
    }
  },

  // 选项点击（题型 B）
  onOptionTap: function (e) {
    if (this.data.answered) return;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var idx = e.currentTarget.dataset.index;
    var correctIndex = this.data.correctIndex;
    var correct = idx === correctIndex;
    var sc = this.data.score + (correct ? 1 : 0);
    var opts = this.data.options.map(function (o, i) {
      var cls = 'opt';
      if (i === correctIndex) cls = 'opt opt-correct';
      else if (i === idx) cls = 'opt opt-wrong';
      return { text: o.text, cls: cls };
    });
    var q = this._q;
    this.setData({ options: opts, selectedIndex: idx, answered: true, isCorrect: correct, score: sc,
      feedbackText: correct ? '答对啦！坐标就是 (' + q.tx + ', ' + q.ty + ') 🎉'
        : '正确坐标是 (' + q.tx + ', ' + q.ty + ')，再接再厉～' });
    var self = this;
    this._timer = setTimeout(function () { self._timer = null; self.next(); }, 1100);
  },

  next: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (!this.data.answered) return;
    if (this.data.isLast) { this._finish(); }
    else { var ni = this.data.index + 1; this.loadQuestion(ni); }
  },

  _finish: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var total = this.data.total, score = this.data.score;
    var stars = score === total ? 3 : (score >= Math.ceil(total / 2) ? 2 : 1);
    var dateText = this._dateText();
    var list = storage.getSync('coordinate_history', []) || [];
    list.unshift({ score: score, total: total, ts: Date.now(), timeText: dateText });
    if (list.length > 10) list = list.slice(0, 10);
    storage.setSync('coordinate_history', list);
    storage.addHistory({
      toolId: 'coordinate',
      toolName: '坐标寻宝',
      category: 'study',
      summary: '找到 ' + score + '/' + total + ' 个宝物',
      timestamp: Date.now()
    });
    this.setData({ state: 'result', stars: stars, progress: 100, historyList: list });
  },

  _dateText: function () {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  },

  restart: function () { this.startGame(); },

  goIntro: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.setData({ state: 'intro', selectedIndex: -1, answered: false, solved: false, feedbackText: '',
      historyList: storage.getSync('coordinate_history', []) || [] });
  },

  onShareAppMessage: function () {
    return { title: '坐标寻宝：用 (x, y) 找出宝物', path: '/packages/toolsB/coordinate/index' };
  }
});
