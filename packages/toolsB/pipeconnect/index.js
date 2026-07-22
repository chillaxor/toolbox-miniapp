// 水管连接 · 旋转管道让水从进水口流到出水口，考验空间想象力

function randInt(n) { return Math.floor(Math.random() * n); }
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 顺时针旋转一格管道的开孔：N->E->S->W->N
function rotateCell(cell) {
  var n = cell.w, e = cell.n, s = cell.e, w = cell.s;
  cell.n = n; cell.e = e; cell.s = s; cell.w = w;
}

// 基础管道形态（N=1,E=2,S=4,W=8），不含十字以避免天然连通
var DECOY_BASES = [5, 3, 7]; // 直(NS) / 弯(NE) / 三通(NES)

function maskToCell(m) {
  return { n: !!(m & 1), e: !!(m & 2), s: !!(m & 4), w: !!(m & 8), isSource: false, isOutlet: false, watered: false };
}
function rotMask(m) {
  return ((m << 1) | (m >> 3)) & 15;
}
function randomDecoy() {
  var base = DECOY_BASES[randInt(DECOY_BASES.length)];
  var rot = randInt(4);
  for (var k = 0; k < rot; k++) base = rotMask(base);
  return maskToCell(base);
}

// 在 N×N 网格上随机找一条从 (sr,sc) 到 (tr,tc) 的简单路径（随机 DFS）
function findPath(N, sr, sc, tr, tc) {
  var visited = {};
  var parent = {};
  var stack = [[sr, sc]];
  visited[sr * N + sc] = true;
  var dirsAll = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  while (stack.length) {
    var cur = stack[stack.length - 1];
    var r = cur[0], c = cur[1];
    if (r === tr && c === tc) {
      var path = [];
      var key = r * N + c;
      while (key !== undefined) {
        path.push([Math.floor(key / N), key % N]);
        key = parent[key];
      }
      path.reverse();
      return path;
    }
    var dirs = shuffle(dirsAll);
    var advanced = false;
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
      var nk = nr * N + nc;
      if (visited[nk]) continue;
      visited[nk] = true;
      parent[nk] = r * N + c;
      stack.push([nr, nc]);
      advanced = true;
      break;
    }
    if (!advanced) stack.pop();
  }
  return null;
}

// 在路径上相邻两格打通开孔
function connect(cells, N, a, b) {
  var ai = a[0] * N + a[1], bi = b[0] * N + b[1];
  if (b[1] === a[1] + 1) { cells[ai].e = true; cells[bi].w = true; }
  else if (b[1] === a[1] - 1) { cells[ai].w = true; cells[bi].e = true; }
  else if (b[0] === a[0] + 1) { cells[ai].s = true; cells[bi].n = true; }
  else if (b[0] === a[0] - 1) { cells[ai].n = true; cells[bi].s = true; }
}

// 生成一关（保证有解）
function genPuzzle(N) {
  var sr = randInt(N), orr = randInt(N);
  var sourceIdx = sr * N + 0;
  var outIdx = orr * N + (N - 1);
  var cells = [];
  for (var i = 0; i < N * N; i++) {
    cells.push({ n: false, e: false, s: false, w: false, isSource: false, isOutlet: false, watered: false });
  }

  var path = findPath(N, sr, 0, orr, N - 1);
  for (var p = 0; p < path.length - 1; p++) connect(cells, N, path[p], path[p + 1]);
  var onPath = {};
  for (var q = 0; q < path.length; q++) onPath[path[q][0] * N + path[q][1]] = true;
  for (var idx = 0; idx < cells.length; idx++) {
    if (!onPath[idx]) {
      var d = randomDecoy();
      cells[idx].n = d.n; cells[idx].e = d.e; cells[idx].s = d.s; cells[idx].w = d.w;
    }
  }
  cells[sourceIdx].isSource = true;
  cells[outIdx].isOutlet = true;

  // 整体随机旋转打乱；旋转可逆，原解仍在，玩家必可转回
  function scramble() {
    for (var i = 0; i < cells.length; i++) {
      var r = randInt(4);
      for (var k = 0; k < r; k++) rotateCell(cells[i]);
    }
  }
  scramble();
  // 若打乱后已连通（出口直接出水），重新打乱，保证有挑战
  var tries = 0;
  while (computeWatered(cells, sourceIdx, outIdx, N).solved && tries < 30) {
    scramble();
    tries++;
  }
  return { cells: cells, sourceIdx: sourceIdx, outIdx: outIdx };
}

// 从进水口 BFS 计算哪些格子有水，并判断是否接到出水口
function computeWatered(cells, sourceIdx, outIdx, N) {
  var watered = cells.map(function () { return false; });
  watered[sourceIdx] = true;
  var queue = [sourceIdx];
  while (queue.length) {
    var idx = queue.shift();
    var r = Math.floor(idx / N), c = idx % N;
    var cell = cells[idx];
    if (cell.n && r > 0) {
      var nb = (r - 1) * N + c;
      if (cells[nb].s && !watered[nb]) { watered[nb] = true; queue.push(nb); }
    }
    if (cell.e && c < N - 1) {
      var nb = r * N + (c + 1);
      if (cells[nb].w && !watered[nb]) { watered[nb] = true; queue.push(nb); }
    }
    if (cell.s && r < N - 1) {
      var nb = (r + 1) * N + c;
      if (cells[nb].n && !watered[nb]) { watered[nb] = true; queue.push(nb); }
    }
    if (cell.w && c > 0) {
      var nb = r * N + (c - 1);
      if (cells[nb].e && !watered[nb]) { watered[nb] = true; queue.push(nb); }
    }
  }
  return { watered: watered, solved: watered[outIdx] };
}

function cloneCells(cells) {
  return cells.map(function (c) {
    return { n: c.n, e: c.e, s: c.s, w: c.w, isSource: c.isSource, isOutlet: c.isOutlet, watered: false };
  });
}
function applyWatered(cells, watered) {
  for (var i = 0; i < cells.length; i++) cells[i].watered = watered[i];
}

Page({
  data: {
    phase: 'setup',          // setup | play | win
    size: 5,
    sizeOptions: [4, 5, 6],
    cells: [],
    initCells: [],           // 初始打乱状态，用于「重玩本关」
    sourceIdx: 0,
    outIdx: 0,
    moves: 0,
    won: false,
    cell: 0,
    boardPx: 0,
    // 管道臂/节点统一样式（按格子尺寸计算）
    st_n: '', st_e: '', st_s: '', st_w: '', st_node: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.pipeconnect) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.computeStyles(this.data.size);
  },

  // 依据网格大小计算格子与管道臂尺寸
  computeStyles: function (N) {
    var board = 600;
    var cell = Math.floor(board / N);
    var boardPx = cell * N;
    var thick = Math.round(cell * 0.30);
    var off = Math.round((cell - thick) / 2);
    var half = Math.round(cell / 2);
    this.setData({
      cell: cell,
      boardPx: boardPx,
      st_n: 'left:' + off + 'rpx;top:0;width:' + thick + 'rpx;height:' + half + 'rpx;',
      st_s: 'left:' + off + 'rpx;bottom:0;width:' + thick + 'rpx;height:' + half + 'rpx;',
      st_e: 'right:0;top:' + off + 'rpx;height:' + thick + 'rpx;width:' + half + 'rpx;',
      st_w: 'left:0;top:' + off + 'rpx;height:' + thick + 'rpx;width:' + half + 'rpx;',
      st_node: 'left:' + off + 'rpx;top:' + off + 'rpx;width:' + thick + 'rpx;height:' + thick + 'rpx;'
    });
  },

  selectSize: function (e) {
    var n = Number(e.currentTarget.dataset.n);
    this.computeStyles(n);
    this.setData({ size: n });
  },

  startGame: function () {
    var N = this.data.size;
    var puz = genPuzzle(N);
    var init = cloneCells(puz.cells);
    var res = computeWatered(puz.cells, puz.sourceIdx, puz.outIdx, N);
    applyWatered(puz.cells, res.watered);
    this.setData({
      phase: 'play',
      cells: puz.cells,
      initCells: init,
      sourceIdx: puz.sourceIdx,
      outIdx: puz.outIdx,
      moves: 0,
      won: false
    });
  },

  rotateCell: function (e) {
    if (this.data.phase !== 'play') return;
    var idx = Number(e.currentTarget.dataset.idx);
    var cells = cloneCells(this.data.cells);
    rotateCell(cells[idx]);
    var res = computeWatered(cells, this.data.sourceIdx, this.data.outIdx, this.data.size);
    applyWatered(cells, res.watered);
    var moves = this.data.moves + 1;
    var patch = { cells: cells, moves: moves };
    if (res.solved) {
      patch.won = true;
      patch.phase = 'win';
      try { wx.vibrateShort({ type: 'heavy' }); } catch (err) {}
    }
    this.setData(patch);
  },

  // 重玩本关（恢复到初始打乱状态）
  retry: function () {
    var cells = cloneCells(this.data.initCells);
    var res = computeWatered(cells, this.data.sourceIdx, this.data.outIdx, this.data.size);
    applyWatered(cells, res.watered);
    this.setData({ cells: cells, moves: 0, won: false, phase: 'play' });
  },

  nextLevel: function () {
    this.startGame();
  },

  backSetup: function () {
    this.setData({ phase: 'setup' });
  },

  onShareAppMessage: function () {
    return { title: '水管连接 - 转管道让水流出来', path: '/packages/toolsB/pipeconnect/index' };
  }
});
