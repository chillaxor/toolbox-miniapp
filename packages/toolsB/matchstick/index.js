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

// 谜题：init 为「错误」等式，sol 为「移动一根」的标准解法（from/to 同槽位）
// 所有题目均已校验：移动一根后等式成立，且仅用单根火柴的「拿起-放下」重定位
var PUZZLES = [
  { init: '6+2=9', sol: { slot: 2, from: 'e', to: 'c' } }, // 2→3
  { init: '9-6=2', sol: { slot: 4, from: 'e', to: 'c' } }, // 2→3
  { init: '8-6=3', sol: { slot: 4, from: 'c', to: 'e' } }, // 3→2
  { init: '8-4=3', sol: { slot: 4, from: 'a', to: 'f' } }, // 3→4
  { init: '7-3=3', sol: { slot: 4, from: 'a', to: 'f' } }, // 3→4
  { init: '3+4=4', sol: { slot: 4, from: 'f', to: 'a' } }, // 4→7
  { init: '9-2=4', sol: { slot: 4, from: 'f', to: 'a' } }, // 4→7
  { init: '6+2=4', sol: { slot: 4, from: 'f', to: 'a' } }, // 4→7
  { init: '5+4=6', sol: { slot: 4, from: 'e', to: 'b' } }, // 6→9
  { init: '4+5=6', sol: { slot: 4, from: 'e', to: 'b' } }, // 6→9
  { init: '2+4=8', sol: { slot: 4, from: 'b', to: 'e' } }, // 8→6
  { init: '1+5=8', sol: { slot: 4, from: 'b', to: 'e' } }, // 8→6
  { init: '5+4=8', sol: { slot: 4, from: 'e', to: 'b' } }, // 8→9
  { init: '4+5=8', sol: { slot: 4, from: 'e', to: 'b' } }, // 8→9
  { init: '7+1=9', sol: { slot: 4, from: 'f', to: 'e' } }, // 9→8
  { init: '2+6=9', sol: { slot: 4, from: 'f', to: 'e' } }, // 9→8
  { init: '5+3=9', sol: { slot: 4, from: 'f', to: 'e' } }, // 9→8
  { init: '8-2=9', sol: { slot: 4, from: 'b', to: 'e' } }, // 9→6
  { init: '3+6=8', sol: { slot: 4, from: 'e', to: 'b' } }  // 8→9
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
      segs.push({ key: 'g', on: true, cls: 'seg-on' });
      slots.push({ id: i, kind: 'op', segs: segs });
    } else if (ch === '=') {
      segs.push({ key: 'eq1', on: true, cls: 'seg-on' });
      segs.push({ key: 'eq2', on: true, cls: 'seg-on' });
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
      this.setData({ feedbackText: '还不是完整的数字哦，再调整一下~', feedbackOk: false });
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
