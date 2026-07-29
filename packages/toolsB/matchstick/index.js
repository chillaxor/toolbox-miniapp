var storage = require('../../../utils/storage.js');

// 七段数码管：每段点亮的数字组合（按 a-g 顺序的字符串）
var DIGIT_ON = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg'
};

// 反向映射：点亮段组合 -> 数字字符
var REVERSE_DIGIT = {};
Object.keys(DIGIT_ON).forEach(function (d) {
  REVERSE_DIGIT[DIGIT_ON[d]] = d;
});

var SEG_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

var TOTAL_OPTIONS = [5, 8, 10, 15];
var DEFAULT_TOTAL = 8;

// 谜题：init 为「错误」等式，sol 为「移动一根」的标准解法。
// sol 格式：{ slot, from, toSlot, to } —— 拿起 slot 槽位的 from 段，放到 toSlot 槽位的 to 段（支持跨槽位）。
// 全部经脚本校验：按 sol 移动一根后等式成立，且 init 本身为错误等式。
// 解法覆盖：slot 0 = 第一个数、slot 1 = 加减号、slot 2 = 第二个数、slot 4 = 结果。
var PUZZLES = [
  // —— 结果位（右边）解法 ——
  { init: '1+1=3', sol: { slot: 4, from: 'c', toSlot: 4, to: 'e' } }, // 3→2
  { init: '2+1=2', sol: { slot: 4, from: 'e', toSlot: 4, to: 'c' } }, // 2→3
  { init: '3+6=6', sol: { slot: 4, from: 'e', toSlot: 4, to: 'b' } }, // 6→9
  { init: '4-1=5', sol: { slot: 4, from: 'f', toSlot: 4, to: 'b' } }, // 5→3
  { init: '5-3=3', sol: { slot: 4, from: 'c', toSlot: 4, to: 'e' } }, // 3→2
  { init: '6-6=6', sol: { slot: 4, from: 'g', toSlot: 4, to: 'b' } }, // 6→0
  { init: '7-7=6', sol: { slot: 4, from: 'g', toSlot: 4, to: 'b' } }, // 6→0
  // —— 第二个数（左边）解法 ——
  { init: '1+6=1', sol: { slot: 2, from: 'g', toSlot: 2, to: 'b' } }, // 6→0
  { init: '2+9=2', sol: { slot: 2, from: 'g', toSlot: 2, to: 'e' } }, // 9→0
  { init: '3+3=5', sol: { slot: 2, from: 'c', toSlot: 2, to: 'e' } }, // 5→2
  { init: '4+5=7', sol: { slot: 2, from: 'f', toSlot: 2, to: 'b' } }, // 7→3
  { init: '5+2=8', sol: { slot: 2, from: 'e', toSlot: 2, to: 'c' } }, // 8→3
  { init: '6-3=1', sol: { slot: 2, from: 'b', toSlot: 2, to: 'f' } }, // 1→5
  // —— 第一个数（左边）解法 ——
  { init: '2+1=4', sol: { slot: 0, from: 'e', toSlot: 0, to: 'c' } }, // 2→3
  { init: '3+1=6', sol: { slot: 0, from: 'b', toSlot: 0, to: 'f' } }, // 3→5
  { init: '5+1=4', sol: { slot: 0, from: 'f', toSlot: 0, to: 'b' } }, // 4→3
  { init: '6-1=8', sol: { slot: 0, from: 'e', toSlot: 0, to: 'b' } }, // 8→9
  { init: '9+1=7', sol: { slot: 0, from: 'b', toSlot: 0, to: 'e' } }, // 9→6
  { init: '2+2=5', sol: { slot: 0, from: 'e', toSlot: 0, to: 'c' } }, // 2→3
  // —— 运算符解法：+ 变 -（把加号的竖杠移到数字上）——
  { init: '5+1=5', sol: { slot: 1, from: 'v', toSlot: 0, to: 'e' } }, // → 6-1=5
  { init: '7+1=5', sol: { slot: 1, from: 'v', toSlot: 4, to: 'e' } }, // → 7-1=6
  { init: '6+2=6', sol: { slot: 1, from: 'v', toSlot: 0, to: 'b' } }, // → 8-2=6
  // —— 运算符解法：- 变 +（从数字拿一根搭到减号上）——
  { init: '7-1=2', sol: { slot: 0, from: 'a', toSlot: 1, to: 'v' } }, // → 1+1=2
  { init: '1-9=4', sol: { slot: 2, from: 'f', toSlot: 1, to: 'v' } }, // → 1+3=4
  { init: '1-4=9', sol: { slot: 4, from: 'b', toSlot: 1, to: 'v' } }, // → 1+4=5
  // —— 扩充批次 2：同槽位数字解法 ——
  { init: '2-1=2', sol: { slot: 0, from: 'e', toSlot: 0, to: 'c' } }, // 2→3 → 3-1=2
  { init: '3+1=3', sol: { slot: 0, from: 'c', toSlot: 0, to: 'e' } }, // 3→2 → 2+1=3
  { init: '5-1=2', sol: { slot: 0, from: 'f', toSlot: 0, to: 'b' } }, // 5→3 → 3-1=2
  { init: '1+3=3', sol: { slot: 2, from: 'c', toSlot: 2, to: 'e' } }, // 3→2 → 1+2=3
  { init: '2+3=4', sol: { slot: 2, from: 'c', toSlot: 2, to: 'e' } }, // 3→2 → 2+2=4
  { init: '3-3=1', sol: { slot: 2, from: 'c', toSlot: 2, to: 'e' } }, // 3→2 → 3-2=1
  { init: '1-1=6', sol: { slot: 4, from: 'g', toSlot: 4, to: 'b' } }, // 6→0 → 1-1=0
  { init: '2+1=5', sol: { slot: 4, from: 'f', toSlot: 4, to: 'b' } }, // 5→3 → 2+1=3
  { init: '3-1=3', sol: { slot: 4, from: 'c', toSlot: 4, to: 'e' } }, // 3→2 → 3-1=2
  // —— 扩充批次 2：跨数字搬火柴（从一个数字拿一根搭到另一个数字）——
  { init: '1-1=8', sol: { slot: 4, from: 'b', toSlot: 0, to: 'a' } }, // 8→6,1→7 → 7-1=6
  { init: '7+5=5', sol: { slot: 0, from: 'a', toSlot: 4, to: 'e' } }, // 7→1,5→6 → 1+5=6
  { init: '2+8=9', sol: { slot: 2, from: 'b', toSlot: 4, to: 'e' } }, // 8→6,9→8 → 2+6=8
  { init: '1+6=5', sol: { slot: 2, from: 'e', toSlot: 4, to: 'e' } }, // 6→5,5→6 → 1+5=6
  { init: '7+5=7', sol: { slot: 0, from: 'a', toSlot: 2, to: 'e' } }, // 7→1,5→6 → 1+6=7
  { init: '7+6=1', sol: { slot: 0, from: 'a', toSlot: 4, to: 'a' } }, // 7→1,1→7 → 1+6=7
  // —— 扩充批次 2：+ 变 -（拿走加号竖杠搭到数字上）——
  { init: '1+1=6', sol: { slot: 1, from: 'v', toSlot: 0, to: 'a' } }, // → 7-1=6
  { init: '5+1=8', sol: { slot: 1, from: 'v', toSlot: 0, to: 'b' } }, // → 9-1=8
  { init: '3+1=8', sol: { slot: 1, from: 'v', toSlot: 0, to: 'f' } }, // → 9-1=8
  { init: '9+2=6', sol: { slot: 1, from: 'v', toSlot: 0, to: 'e' } }, // → 8-2=6
  // —— 扩充批次 2：- 变 +（从数字拿一根搭到减号上）——
  { init: '1-7=2', sol: { slot: 2, from: 'a', toSlot: 1, to: 'v' } }, // → 1+1=2
  { init: '7-2=3', sol: { slot: 0, from: 'a', toSlot: 1, to: 'v' } }, // → 1+2=3
  { init: '2-3=6', sol: { slot: 4, from: 'e', toSlot: 1, to: 'v' } }, // → 2+3=5
  { init: '3-8=9', sol: { slot: 2, from: 'b', toSlot: 1, to: 'v' } }  // → 3+6=9
];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 把等式字符串解码成 slot 数组（每个字符一个 slot，slot 内为段数组）
function buildSlots(str) {
  var slots = [];
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    var segs = [];
    if (DIGIT_ON[ch] !== undefined) {
      for (var k = 0; k < SEG_KEYS.length; k++) {
        var key = SEG_KEYS[k];
        var on = DIGIT_ON[ch].indexOf(key) !== -1;
        segs.push({ key: key, on: on, cls: on ? 'seg-on' : 'seg-off' });
      }
      slots.push({ id: i, kind: 'digit', segs: segs });
    } else if (ch === '+') {
      segs.push({ key: 'g', on: true, cls: 'seg-on' });
      segs.push({ key: 'v', on: true, cls: 'seg-on' });
      slots.push({ id: i, kind: 'op', segs: segs });
    } else if (ch === '-') {
      // 竖段以熄灭态渲染，允许玩家把火柴放上来变成 +
      segs.push({ key: 'g', on: true, cls: 'seg-on' });
      segs.push({ key: 'v', on: false, cls: 'seg-off' });
      slots.push({ id: i, kind: 'op', segs: segs });
    } else if (ch === '=') {
      // 等号不参与移动（locked）
      segs.push({ key: 'eq1', on: true, cls: 'seg-on', locked: true });
      segs.push({ key: 'eq2', on: true, cls: 'seg-on', locked: true });
      slots.push({ id: i, kind: 'op', segs: segs });
    }
  }
  return slots;
}

// 把一个 slot 解码成字符；无法识别返回 '?'
function decodeSlot(slot) {
  if (slot.kind === 'digit') {
    var onKeys = [];
    for (var i = 0; i < slot.segs.length; i++) {
      if (slot.segs[i].on) onKeys.push(slot.segs[i].key);
    }
    onKeys.sort(function (x, y) { return SEG_KEYS.indexOf(x) - SEG_KEYS.indexOf(y); });
    return REVERSE_DIGIT[onKeys.join('')] || '?';
  }
  // 运算符
  var g = false, v = false, eq1 = false, eq2 = false;
  for (var j = 0; j < slot.segs.length; j++) {
    var s = slot.segs[j];
    if (s.key === 'g' && s.on) g = true;
    if (s.key === 'v' && s.on) v = true;
    if (s.key === 'eq1' && s.on) eq1 = true;
    if (s.key === 'eq2' && s.on) eq2 = true;
  }
  if (eq1 && eq2) return '=';
  if (g && v) return '+';
  if (g && !v) return '-';
  return '?';
}

function buildEquation(slots) {
  var str = '';
  for (var i = 0; i < slots.length; i++) str += decodeSlot(slots[i]);
  return str;
}

// 校验当前等式是否成立
function checkSolved(slots) {
  var str = buildEquation(slots);
  if (str.indexOf('?') !== -1) return { ok: false, reason: 'incomplete' };
  var eqIdx = str.indexOf('=');
  if (eqIdx <= 0 || eqIdx >= str.length - 1) return { ok: false, reason: 'bad' };
  var a = parseInt(str[0], 10);
  var op = str[1];
  var b = parseInt(str[2], 10);
  var c = parseInt(str[4], 10);
  if (isNaN(a) || isNaN(b) || isNaN(c)) return { ok: false, reason: 'incomplete' };
  var left = op === '-' ? a - b : a + b;
  return { ok: left === c, reason: left === c ? 'ok' : 'unequal' };
}

function findSeg(slots, slotIdx, segKey) {
  var segs = slots[slotIdx].segs;
  for (var i = 0; i < segs.length; i++) {
    if (segs[i].key === segKey) return segs[i];
  }
  return null;
}

Page({
  data: {
    state: 'intro',
    totalOptions: TOTAL_OPTIONS,
    total: DEFAULT_TOTAL,
    index: 0,
    score: 0,
    progress: 0,
    slots: [],
    carrying: null,   // { slot, seg } 手里的火柴（已拿起未放下）
    moved: false,     // 本題是否已做过一次「放下」
    solved: false,
    feedbackText: '',
    feedbackOk: false,
    showHint: false,
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
    if (f.matchstick !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var list = storage.getSync('matchstick_history', []) || [];
    this.setData({ historyList: list });
  },

  onUnload: function () {
    if (this._timer) clearTimeout(this._timer);
  },

  onSelectCount: function (e) {
    this.setData({ total: Number(e.currentTarget.dataset.count) });
  },

  startGame: function () {
    this._order = shuffle(PUZZLES.map(function (_, i) { return i; }));
    this.setData({ state: 'play', score: 0, index: 0, total: this.data.total });
    this.loadPuzzle(0);
  },

  loadPuzzle: function (idx) {
    if (this._timer) clearTimeout(this._timer);
    var p = PUZZLES[this._order[idx % this._order.length]];
    this._currentInit = p.init;
    var slots = buildSlots(p.init);
    this.setData({
      slots: slots,
      carrying: null,
      moved: false,
      solved: false,
      feedbackText: '',
      feedbackOk: false,
      showHint: false,
      index: idx,
      progress: Math.round(idx / this.data.total * 100),
      isLast: idx === this.data.total - 1
    });
  },

  // 点击一根火柴段
  onSegTap: function (e) {
    if (this.data.solved) return;
    var si = parseInt(e.currentTarget.dataset.slot, 10);
    var segKey = e.currentTarget.dataset.seg;
    var slots = this.data.slots;
    var segObj = findSeg(slots, si, segKey);
    if (!segObj) return;
    if (segObj.locked) {
      wx.showToast({ title: '等号不能动哦', icon: 'none' });
      return;
    }

    // 手是空的
    if (this.data.carrying === null) {
      if (segObj.on) {
        // 拿起一根亮着的火柴
        if (this.data.moved) {
          wx.showToast({ title: '用「撤销」再试一次哦', icon: 'none' });
          return;
        }
        segObj.on = false;
        segObj.cls = 'seg-carry';
        this.setData({ slots: slots, carrying: { slot: si, seg: segKey } });
      }
      // 点到空位：忽略
      return;
    }

    // 手里有火柴
    var carry = this.data.carrying;
    if (carry.slot === si && carry.seg === segKey) {
      // 放回原处
      segObj.on = true;
      segObj.cls = 'seg-on';
      this.setData({ slots: slots, carrying: null });
      return;
    }
    if (segObj.on) {
      // 不能放到已亮的位置
      wx.showToast({ title: '这里已经有火柴啦', icon: 'none' });
      return;
    }
    // 放到空位：完成一次移动
    segObj.on = true;
    segObj.cls = 'seg-on';
    var srcSeg = findSeg(slots, carry.slot, carry.seg);
    if (srcSeg) srcSeg.cls = 'seg-off';
    this.setData({ slots: slots, carrying: null, moved: true });
    this.afterMove();
  },

  afterMove: function () {
    var res = checkSolved(this.data.slots);
    if (res.ok) {
      var sc = this.data.score + 1;
      this.setData({ solved: true, score: sc, feedbackText: '太棒了！你解开啦 🔥', feedbackOk: true });
      var self = this;
      this._timer = setTimeout(function () { self.next(); }, 1100);
    } else if (res.reason === 'incomplete') {
      this.setData({ feedbackText: '还不是完整的算式哦，再调整一下~', feedbackOk: false });
    } else {
      this.setData({ feedbackText: '再想想～等号两边还不相等', feedbackOk: false });
    }
  },

  onHint: function () {
    var p = PUZZLES[this._order[this.data.index % this._order.length]];
    var sol = p.sol;
    var slots = this.data.slots;
    var s = findSeg(slots, sol.slot, sol.from);
    if (s) s.cls = 'seg-hint';
    this.setData({ slots: slots, showHint: true });
  },

  onUndo: function () {
    if (this._timer) clearTimeout(this._timer);
    var slots = buildSlots(this._currentInit);
    this.setData({
      slots: slots,
      carrying: null,
      moved: false,
      solved: false,
      feedbackText: '',
      feedbackOk: false,
      showHint: false
    });
  },

  next: function () {
    if (!this.data.solved) return;
    var idx = this.data.index + 1;
    if (idx >= this.data.total) {
      this._finish();
    } else {
      this.loadPuzzle(idx);
    }
  },

  _finish: function () {
    if (this._timer) clearTimeout(this._timer);
    var total = this.data.total;
    var sc = this.data.score;
    var stars = sc === total ? 3 : (sc >= Math.ceil(total / 2) ? 2 : 1);
    this.setData({ state: 'result', stars: stars, progress: 100 });

    // 存本地成绩
    var dateText = this._dateText();
    var list = storage.getSync('matchstick_history', []) || [];
    list.unshift({ summary: '解开 ' + sc + '/' + total + ' 题', ts: Date.now(), dateText: dateText });
    if (list.length > 10) list = list.slice(0, 10);
    storage.setSync('matchstick_history', list);
    storage.addHistory({
      toolId: 'matchstick',
      toolName: '火柴棒算式',
      category: 'study',
      summary: '解开 ' + sc + '/' + total + ' 题',
      timestamp: Date.now()
    });
    this.setData({ historyList: list });
  },

  _dateText: function () {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  },

  restart: function () {
    this.startGame();
  },

  goIntro: function () {
    var list = storage.getSync('matchstick_history', []) || [];
    this.setData({ state: 'intro', historyList: list, score: 0, index: 0, progress: 0 });
  },

  onShareAppMessage: function () {
    return { title: '火柴棒算式：移动一根让等式成立', path: '/packages/toolsB/matchstick/index' };
  }
});
