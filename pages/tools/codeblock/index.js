const GRID = 6;
const MAP_SIZE = 640; // rpx
const CELL = MAP_SIZE / GRID;

const BLOCK_DEFS = [
  { type: 'forward', label: '前进', icon: '↑', color: '#378ADD' },
  { type: 'back', label: '后退', icon: '↓', color: '#888780' },
  { type: 'left', label: '左转', icon: '↺', color: '#1D9E75' },
  { type: 'right', label: '右转', icon: '↻', color: '#7F77DD' },
  { type: 'repeat', label: '重复', icon: '∞', color: '#BA7517' }
];

// 关卡定义：start = {row,col,dir}（dir: 0上 1右 2下 3左）；obstacles 为 [row,col] 数组
const LEVELS = [
  { name: '第1关 · 出发', start: { row: 5, col: 0, dir: 0 }, target: { row: 0, col: 5 }, obstacles: [] },
  { name: '第2关 · 拐个弯', start: { row: 5, col: 0, dir: 0 }, target: { row: 5, col: 5 }, obstacles: [] },
  { name: '第3关 · 绕柱子', start: { row: 5, col: 0, dir: 0 }, target: { row: 5, col: 5 }, obstacles: [[5, 2], [5, 3], [5, 4]] },
  { name: '第4关 · 重复秀', start: { row: 5, col: 0, dir: 0 }, target: { row: 0, col: 5 }, obstacles: [] },
  { name: '第5关 · 小迷宫', start: { row: 5, col: 0, dir: 0 }, target: { row: 5, col: 5 }, obstacles: [[3, 1], [3, 2], [3, 3], [3, 4]] },
  { name: '第6关 · 大挑战', start: { row: 5, col: 0, dir: 0 }, target: { row: 0, col: 5 }, obstacles: [[4, 0], [3, 0], [2, 0], [1, 0]] }
];

function blockDef(type) {
  for (var i = 0; i < BLOCK_DEFS.length; i++) {
    if (BLOCK_DEFS[i].type === type) return BLOCK_DEFS[i];
  }
  return BLOCK_DEFS[0];
}

Page({
  data: {
    GRID: GRID,
    mapSize: MAP_SIZE,
    cell: CELL,
    blocks: BLOCK_DEFS,
    totalLevels: LEVELS.length,
    level: 0,
    levelName: '',
    target: { row: 0, col: GRID - 1 },
    obstacles: [],
    charRow: GRID - 1,
    charCol: 0,
    charDir: 0, // 0上 1右 2下 3左
    program: [],
    running: false,
    dragging: false,
    drag: { x: 0, y: 0 },
    dragLabel: '',
    dragColor: '#378ADD',
    scrollIntoId: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.codeblock) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._id = 0;
    this._dragType = null;
    this.programRect = null;
    this.loadLevel(0, false);
  },

  onReady: function () {
    this.measureProgramZone();
  },

  onResize: function () {
    this.measureProgramZone();
  },

  measureProgramZone: function () {
    var self = this;
    wx.createSelectorQuery().select('#programZone').boundingClientRect(function (rect) {
      if (rect) {
        self.programRect = {
          left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom
        };
      }
    }).exec();
  },

  // ---------- 关卡 ----------
  loadLevel: function (idx, keepProgram) {
    if (idx < 0 || idx >= LEVELS.length) return;
    var lv = LEVELS[idx];
    var obs = (lv.obstacles || []).map(function (o) {
      return { row: o[0], col: o[1] };
    });
    var patch = {
      level: idx,
      levelName: lv.name,
      obstacles: obs,
      target: lv.target,
      charRow: lv.start.row,
      charCol: lv.start.col,
      charDir: lv.start.dir,
      running: false
    };
    if (!keepProgram) patch.program = [];
    this.setData(patch);
  },

  prevLevel: function () {
    if (this.data.running) return;
    if (this.data.level > 0) this.loadLevel(this.data.level - 1, false);
  },

  nextLevel: function () {
    if (this.data.running) return;
    if (this.data.level < LEVELS.length - 1) this.loadLevel(this.data.level + 1, false);
  },

  isBlocked: function (r, c) {
    for (var i = 0; i < this.data.obstacles.length; i++) {
      if (this.data.obstacles[i].row === r && this.data.obstacles[i].col === c) return true;
    }
    return false;
  },

  // ---------- 拖拽 ----------
  onBlockTouchStart: function (e) {
    if (this.data.running) return;
    var type = e.currentTarget.dataset.type;
    var def = blockDef(type);
    var t = e.touches[0];
    this._dragType = type;
    this.setData({
      dragging: true,
      drag: { x: t.clientX, y: t.clientY },
      dragLabel: def.label,
      dragColor: def.color
    });
  },

  onBlockTouchMove: function (e) {
    if (!this.data.dragging) return;
    var t = e.touches[0];
    this.setData({ drag: { x: t.clientX, y: t.clientY } });
  },

  onBlockTouchEnd: function (e) {
    if (!this.data.dragging) return;
    var t = e.changedTouches[0];
    var r = this.programRect;
    var type = this._dragType;
    this.setData({ dragging: false });
    if (r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
      this.addBlock(type);
    }
    this._dragType = null;
  },

  addBlock: function (type) {
    var def = blockDef(type);
    var program = this.data.program.slice();
    var block = { id: ++this._id, type: type, label: def.label, color: def.color };
    if (type === 'repeat') block.times = 3;
    program.push(block);
    this.setData({ program: program, scrollIntoId: 'pb' + block.id });
  },

  onRemoveBlock: function (e) {
    if (this.data.running) return;
    var idx = Number(e.currentTarget.dataset.index);
    var program = this.data.program.slice();
    program.splice(idx, 1);
    this.setData({ program: program });
  },

  onDecTimes: function (e) {
    if (this.data.running) return;
    var idx = Number(e.currentTarget.dataset.index);
    var program = this.data.program.slice();
    if (program[idx].times > 2) program[idx].times -= 1;
    this.setData({ program: program });
  },

  onIncTimes: function (e) {
    if (this.data.running) return;
    var idx = Number(e.currentTarget.dataset.index);
    var program = this.data.program.slice();
    if (program[idx].times < 9) program[idx].times += 1;
    this.setData({ program: program });
  },

  clearProgram: function () {
    if (this.data.running) return;
    this.setData({ program: [] });
  },

  resetChar: function () {
    if (this.data.running) return;
    // 角色归位到当前关起点，但保留已编好的程序
    this.loadLevel(this.data.level, true);
  },

  // ---------- 运行 ----------
  // 重复块只修饰它「紧前面那一条」指令：把它重复 times 次（含原本1次）
  expandProgram: function (program) {
    var out = [];
    for (var i = 0; i < program.length; i++) {
      var b = program[i];
      if (b.type === 'repeat') {
        var pi = out.length - 1;
        while (pi >= 0 && out[pi].type === 'repeat') pi--;
        if (pi >= 0) {
          var body = out[pi];
          for (var t = 2; t <= b.times; t++) out.push(body);
        }
      } else {
        out.push(b);
      }
    }
    return out;
  },

  run: function () {
    if (this.data.running) return;
    if (this.data.program.length === 0) {
      wx.showToast({ title: '先拖入指令块', icon: 'none' });
      return;
    }
    this.resetChar();
    var expanded = this.expandProgram(this.data.program);
    var self = this;
    var i = 0;
    this.setData({ running: true });
    function step() {
      if (i >= expanded.length) {
        self.setData({ running: false });
        wx.showToast({ title: '没到终点，再试试', icon: 'none' });
        return;
      }
      var b = expanded[i];
      self.applyBlock(b);
      i++;
      var row = self.data.charRow;
      var col = self.data.charCol;
      if (row === self.data.target.row && col === self.data.target.col) {
        self.setData({ running: false });
        var idx = self.data.level;
        var isLast = idx >= LEVELS.length - 1;
        wx.showModal({
          title: '过关啦 🎉',
          content: self.data.levelName + ' 完成！用了 ' + expanded.length + ' 步。',
          confirmText: isLast ? '再玩一遍' : '下一关 ›',
          cancelText: '重玩本关',
          success: function (r) {
            if (r.confirm) {
              self.loadLevel(isLast ? 0 : idx + 1, false);
            } else {
              self.loadLevel(idx, false);
            }
          }
        });
        return;
      }
      setTimeout(step, 450);
    }
    setTimeout(step, 300);
  },

  applyBlock: function (b) {
    var row = this.data.charRow;
    var col = this.data.charCol;
    var dir = this.data.charDir;
    if (b.type === 'forward') {
      var nr = row, nc = col;
      if (dir === 0 && row > 0) nr = row - 1;
      else if (dir === 1 && col < GRID - 1) nc = col + 1;
      else if (dir === 2 && row < GRID - 1) nr = row + 1;
      else if (dir === 3 && col > 0) nc = col - 1;
      if (!this.isBlocked(nr, nc)) { row = nr; col = nc; }
    } else if (b.type === 'back') {
      var br = row, bc = col;
      if (dir === 0 && row < GRID - 1) br = row + 1;
      else if (dir === 1 && col > 0) bc = col - 1;
      else if (dir === 2 && row > 0) br = row - 1;
      else if (dir === 3 && col < GRID - 1) bc = col + 1;
      if (!this.isBlocked(br, bc)) { row = br; col = bc; }
    } else if (b.type === 'left') {
      dir = (dir + 3) % 4;
    } else if (b.type === 'right') {
      dir = (dir + 1) % 4;
    }
    this.setData({ charRow: row, charCol: col, charDir: dir });
  }
});
