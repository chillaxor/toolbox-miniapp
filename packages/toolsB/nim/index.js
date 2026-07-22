// Nim 游戏（多堆石子博弈）——同屏双人，支持多种变体
// 变体 variant：standard(单堆拿1~全部) / limitK(单堆最多拿K) / multiM(最多M堆各拿1)
// 拿最后：lastWin=true 赢 / false 输(misère)
// 辅助：Nim和显示、最佳走法提示、悔棋(每局1次)、历史、随机事件、计时

var PRESETS = [
  { id: 'entry',  name: '⭐ 入门',    heapCount: 2, maxHeap: 5,  variant: 'standard', lastWin: true,  randomOn: false, hintLevel: 'full', kVal: 3, mVal: 2 },
  { id: 'easy',   name: '⭐⭐ 简单',  heapCount: 3, maxHeap: 7,  variant: 'standard', lastWin: true,  randomOn: false, hintLevel: 'nim',  kVal: 3, mVal: 2 },
  { id: 'medium', name: '⭐⭐⭐ 中等', heapCount: 3, maxHeap: 10, variant: 'standard', lastWin: false, randomOn: false, hintLevel: 'move', kVal: 3, mVal: 2 },
  { id: 'hard',   name: '⭐⭐⭐⭐ 困难', heapCount: 4, maxHeap: 15, variant: 'limitK',  lastWin: true,  randomOn: false, hintLevel: 'none', kVal: 3, mVal: 2 },
  { id: 'master', name: '⭐⭐⭐⭐⭐ 大师', heapCount: 5, maxHeap: 20, variant: 'standard', lastWin: true,  randomOn: true,  hintLevel: 'none', kVal: 5, mVal: 3 },
  { id: 'custom', name: '🛠 自定义',  heapCount: 3, maxHeap: 8,  variant: 'standard', lastWin: true,  randomOn: false, hintLevel: 'nim',  kVal: 3, mVal: 2 }
];

function presetOf(id) {
  for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
  return PRESETS[5];
}

// Nim-sum（异或）
function nimSum(counts) {
  var s = 0;
  for (var i = 0; i < counts.length; i++) s ^= counts[i];
  return s;
}

// 最佳走法：返回 { win:true, heaps:[{idx, take}] } 或 null（劣势/无必胜提示）
// 支持 standard / limitK 的必胜提示；multiM 与 misère 全1劣势特殊处理
function bestMove(counts, lastWin, variant, kVal) {
  if (variant === 'multiM') return null;
  var n = counts.length;
  if (variant === 'limitK') {
    var g = counts.map(function (c) { return c % (kVal + 1); });
    var gx = 0;
    for (var i = 0; i < n; i++) gx ^= g[i];
    if (gx === 0) return null;
    for (var h = 0; h < n; h++) {
      if (counts[h] === 0) continue;
      var target = g[h] ^ gx;
      if (target >= g[h]) continue;
      var dec = (g[h] - target) % (kVal + 1);
      if (dec <= 0) dec += (kVal + 1);
      if (counts[h] - dec < 0) continue;
      return { win: true, heaps: [{ idx: h, take: dec }] };
    }
    return null;
  }
  // standard（含 misère 修正，采用 Bouton 定理）
  if (lastWin === false) {
    var big = 0, ones = 0;
    for (var b = 0; b < n; b++) { if (counts[b] > 1) big++; if (counts[b] === 1) ones++; }
    if (big <= 1) {
      if (big === 1) {
        var bi = -1;
        for (var i2 = 0; i2 < n; i2++) if (counts[i2] > 1) { bi = i2; break; }
        if (ones % 2 === 0) return { win: true, heaps: [{ idx: bi, take: counts[bi] - 1 }] };
        return { win: true, heaps: [{ idx: bi, take: counts[bi] }] };
      }
      if (ones % 2 === 1) return null;
      var fi = -1;
      for (var i3 = 0; i3 < n; i3++) if (counts[i3] > 0) { fi = i3; break; }
      return { win: true, heaps: [{ idx: fi, take: 1 }] };
    }
    var ns2 = nimSum(counts);
    if (ns2 !== 0) {
      for (var h2 = 0; h2 < n; h2++) {
        if (counts[h2] === 0) continue;
        var w = counts[h2] ^ ns2;
        if (w >= counts[h2]) continue;
        return { win: true, heaps: [{ idx: h2, take: counts[h2] - w }] };
      }
    }
    return null;
  }
  // 正常版（拿最后赢）
  var ns = nimSum(counts);
  if (ns !== 0) {
    for (var h3 = 0; h3 < n; h3++) {
      if (counts[h3] === 0) continue;
      var want = counts[h3] ^ ns;
      if (want >= counts[h3]) continue;
      return { win: true, heaps: [{ idx: h3, take: counts[h3] - want }] };
    }
  }
  return null;
}

Page({
  data: {
    phase: 'setup',
    presets: [],
    selectedPreset: 'easy',
    // 配置（setup 可调）
    heapCount: 3, maxHeap: 8, variant: 'standard', lastWin: true,
    randomOn: false, hintLevel: 'nim', kVal: 3, mVal: 2,
    manual: false, manualCounts: [3, 5, 7],
    // 游戏中
    heaps: [], remaining: 0, current: 'A', status: '',
    selectedHeap: -1, selectedHeaps: [], selectedHeapsLen: 0,
    takeBtns: [], nimSumVal: 0, showNim: false,
    hintLevelEffective: 'nim', hintText: '', hintWin: false,
    history: [], undoLeft: 1, undoSnap: null,
    showHistory: false, showHintPanel: false,
    timing: false, elapsed: 0, elapsedText: '', busy: false,
    // 结果
    winnerText: '', summary: '', modeText: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.nim === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var self = this;
    this._animTimer = null;
    this._randTimer = null;
    this._tickTimer = null;
    this.setData({
      presets: PRESETS.map(function (p) { return { id: p.id, name: p.name }; }),
      selectedPreset: 'easy'
    });
    this._applyPreset('easy');
  },

  onHide: function () {
    this._clearTimers();
  },
  onUnload: function () {
    this._clearTimers();
  },
  _clearTimers: function () {
    if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = null; }
    if (this._randTimer) { clearTimeout(this._randTimer); this._randTimer = null; }
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
  },

  // ---------- 设置 ----------
  _applyPreset: function (id) {
    var p = presetOf(id);
    var patch = {
      heapCount: p.heapCount, maxHeap: p.maxHeap, variant: p.variant,
      lastWin: p.lastWin, randomOn: p.randomOn, hintLevel: p.hintLevel,
      kVal: p.kVal, mVal: p.mVal
    };
    if (id === 'custom') {
      // 自定义：保留用户可能已调的值，仅补齐 manualCounts 长度
      patch.manualCounts = this._syncManual(this.data.manualCounts, p.heapCount);
    } else {
      patch.manual = false;
    }
    this.setData(patch);
  },

  _syncManual: function (arr, len) {
    var a = (arr || []).slice();
    while (a.length < len) a.push(3);
    if (a.length > len) a = a.slice(0, len);
    for (var i = 0; i < a.length; i++) {
      if (typeof a[i] !== 'number' || a[i] < 1) a[i] = 1;
      if (a[i] > 30) a[i] = 30;
    }
    return a;
  },

  selectPreset: function (e) {
    var id = e.currentTarget.dataset.p;
    this.setData({ selectedPreset: id });
    this._applyPreset(id);
  },

  decHeap: function () { this._setHeap(Math.max(2, this.data.heapCount - 1)); },
  incHeap: function () { this._setHeap(Math.min(5, this.data.heapCount + 1)); },
  _setHeap: function (v) {
    this.setData({ heapCount: v, manualCounts: this._syncManual(this.data.manualCounts, v) });
  },
  decMax: function () { this.setData({ maxHeap: Math.max(3, this.data.maxHeap - 1) }); },
  incMax: function () { this.setData({ maxHeap: Math.min(30, this.data.maxHeap + 1) }); },
  decK: function () { this.setData({ kVal: Math.max(2, this.data.kVal - 1) }); },
  incK: function () { this.setData({ kVal: Math.min(10, this.data.kVal + 1) }); },
  decM: function () { this.setData({ mVal: Math.max(2, this.data.mVal - 1) }); },
  incM: function () { this.setData({ mVal: Math.min(5, this.data.mVal + 1) }); },

  selectVariant: function (e) {
    this.setData({ variant: e.currentTarget.dataset.v });
  },
  toggleLastWin: function () { this.setData({ lastWin: !this.data.lastWin }); },
  toggleRandom: function () { this.setData({ randomOn: !this.data.randomOn }); },
  selectHint: function (e) { this.setData({ hintLevel: e.currentTarget.dataset.h }); },
  toggleManual: function () {
    var on = !this.data.manual;
    this.setData({ manual: on, manualCounts: this._syncManual(this.data.manualCounts, this.data.heapCount) });
  },
  adjustManual: function (e) {
    var i = Number(e.currentTarget.dataset.i);
    var d = Number(e.currentTarget.dataset.d);
    var arr = this.data.manualCounts.slice();
    var v = (arr[i] || 1) + d;
    if (v < 1) v = 1;
    if (v > 30) v = 30;
    arr[i] = v;
    this.setData({ manualCounts: arr });
  },

  onStart: function () {
    var cfg = {
      heapCount: this.data.heapCount, maxHeap: this.data.maxHeap,
      variant: this.data.variant, lastWin: this.data.lastWin,
      randomOn: this.data.randomOn, hintLevel: this.data.hintLevel,
      kVal: this.data.kVal, mVal: this.data.mVal
    };
    var counts;
    if (this.data.selectedPreset === 'custom' && this.data.manual) {
      counts = this._syncManual(this.data.manualCounts, cfg.heapCount);
    } else {
      counts = [];
      for (var i = 0; i < cfg.heapCount; i++) {
        counts.push(1 + Math.floor(Math.random() * cfg.maxHeap));
      }
    }
    var timing = (this.data.selectedPreset === 'master');
    this._clearTimers();
    this.setData({
      phase: 'playing',
      heaps: this._buildHeaps(counts),
      remaining: counts.reduce(function (a, b) { return a + b; }, 0),
      current: 'A',
      status: '玩家A 先手',
      selectedHeap: -1,
      selectedHeaps: [],
      selectedHeapsLen: 0,
      history: [],
      undoLeft: 1,
      undoSnap: null,
      showHistory: false,
      showHintPanel: false,
      busy: false,
      timing: timing,
      elapsed: 0,
      elapsedText: '',
      variant: cfg.variant,
      lastWin: cfg.lastWin,
      randomOn: cfg.randomOn,
      hintLevelEffective: cfg.hintLevel,
      kVal: cfg.kVal,
      mVal: cfg.mVal,
      heapCount: cfg.heapCount
    });
    if (timing) {
      var self = this;
      this._tickTimer = setInterval(function () {
        var s = self.data.elapsed + 1;
        var mm = Math.floor(s / 60);
        var ss = s % 60;
        var txt = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
        self.setData({ elapsed: s, elapsedText: txt });
      }, 1000);
    }
    this._recalc();
  },

  _buildHeaps: function (counts) {
    var a = [];
    for (var i = 0; i < counts.length; i++) {
      var stones = [];
      for (var j = 0; j < counts[i]; j++) stones.push({ taken: false, removing: false });
      a.push({ id: i, count: counts[i], stones: stones, selected: false });
    }
    return a;
  },

  // ---------- 游戏 ----------
  _recalc: function () {
    var heaps = this.data.heaps;
    var counts = heaps.map(function (h) { return h.count; });
    var rem = counts.reduce(function (a, b) { return a + b; }, 0);
    var ns = nimSum(counts);
    var showNim = (this.data.hintLevelEffective === 'nim' || this.data.hintLevelEffective === 'full');

    // 数量选择器（standard / limitK）
    var takeBtns = [];
    var sh = this.data.selectedHeap;
    if (this.data.variant !== 'multiM' && sh >= 0 && heaps[sh] && heaps[sh].count > 0) {
      var maxTake = (this.data.variant === 'limitK') ? Math.min(this.data.kVal, heaps[sh].count) : heaps[sh].count;
      for (var i = 1; i <= maxTake; i++) takeBtns.push({ n: i });
    }

    // 提示
    var hintText = '';
    var hintWin = false;
    if (this.data.hintLevelEffective !== 'none') {
      if (this.data.variant === 'multiM') {
        hintText = '多堆限制模式无必胜提示，凭感觉拿~';
      } else {
        var bm = bestMove(counts, this.data.lastWin, this.data.variant, this.data.kVal);
        if (bm === null) {
          hintText = '当前是劣势局，没有必胜走法，随便拿吧';
        } else {
          var parts = bm.heaps.map(function (m) { return '堆' + (m.idx + 1) + '拿' + m.take + '颗'; });
          hintText = '建议：' + parts.join('、');
          hintWin = true;
        }
      }
    }

    this.setData({
      remaining: rem,
      nimSumVal: ns,
      showNim: showNim,
      takeBtns: takeBtns,
      hintText: hintText,
      hintWin: hintWin
    });
  },

  onHeapTap: function (e) {
    if (this.data.phase !== 'playing' || this.data.busy) return;
    var i = Number(e.currentTarget.dataset.i);
    if (this.data.heaps[i].count <= 0) return;

    if (this.data.variant === 'multiM') {
      var sel = this.data.selectedHeaps.slice();
      var pos = sel.indexOf(i);
      if (pos >= 0) sel.splice(pos, 1);
      else {
        if (sel.length >= this.data.mVal) return; // 已达上限
        sel.push(i);
      }
      this._setHeapSelected(sel);
      this.setData({ selectedHeaps: sel, selectedHeapsLen: sel.length });
    } else {
      var newSel = (this.data.selectedHeap === i) ? -1 : i;
      this._setHeapSelected(newSel >= 0 ? [newSel] : []);
      this.setData({ selectedHeap: newSel });
      this._recalc();
    }
  },

  _setHeapSelected: function (selArr) {
    var heaps = this.data.heaps.map(function (h) { return h; });
    for (var i = 0; i < heaps.length; i++) heaps[i] = { id: heaps[i].id, count: heaps[i].count, stones: heaps[i].stones, selected: selArr.indexOf(i) >= 0 };
    this.setData({ heaps: heaps });
  },

  take: function (e) {
    if (this.data.busy || this.data.variant === 'multiM') return;
    var n = Number(e.currentTarget.dataset.n);
    var h = this.data.selectedHeap;
    if (h < 0 || !this.data.heaps[h] || n < 1 || n > this.data.heaps[h].count) return;
    if (this.data.variant === 'limitK' && n > this.data.kVal) return;
    this._performTake([{ idx: h, take: n }]);
  },

  confirmMulti: function () {
    if (this.data.busy || this.data.variant !== 'multiM') return;
    var sel = this.data.selectedHeaps;
    if (sel.length < 1 || sel.length > this.data.mVal) return;
    for (var i = 0; i < sel.length; i++) if (this.data.heaps[sel[i]].count <= 0) return;
    var moves = sel.map(function (idx) { return { idx: idx, take: 1 }; });
    this._performTake(moves);
  },

  _performTake: function (moves) {
    var mover = this.data.current;
    // 保存悔棋快照（操作前完整状态）
    var snap = {
      heaps: this._cloneHeaps(this.data.heaps),
      current: this.data.current,
      remaining: this.data.remaining,
      history: this.data.history.slice(),
      status: this.data.status,
      selectedHeap: this.data.selectedHeap,
      selectedHeaps: this.data.selectedHeaps.slice()
    };

    var heaps = this._cloneHeaps(this.data.heaps);
    for (var k = 0; k < moves.length; k++) {
      var mv = moves[k];
      var st = heaps[mv.idx].stones;
      for (var j = 0; j < mv.take; j++) st[st.length - 1 - j].removing = true;
    }
    var desc = this._moveDesc(mover, moves);
    this.setData({ heaps: heaps, status: desc, busy: true, undoSnap: snap });
    try { wx.vibrateShort({ type: 'light' }); } catch (err) {}

    var self = this;
    this._animTimer = setTimeout(function () {
      var h2 = self._cloneHeaps(self.data.heaps);
      var totalTake = 0;
      for (var k = 0; k < moves.length; k++) {
        var mv = moves[k];
        var st = h2[mv.idx].stones;
        var cnt = h2[mv.idx].count;
        for (var j = 0; j < mv.take; j++) {
          var sidx = st.length - 1 - j;
          if (st[sidx]) { st[sidx].removing = false; st[sidx].taken = true; }
        }
        h2[mv.idx].count = cnt - mv.take;
        totalTake += mv.take;
      }
      var rem = self.data.remaining - totalTake;
      var history = self.data.history.concat([{ who: mover, text: desc }]);
      self.setData({ heaps: h2, remaining: rem, history: history, selectedHeap: -1, selectedHeaps: [], selectedHeapsLen: 0 });
      self._setHeapSelected([]);

      // 随机事件
      if (self.data.randomOn && rem > 0 && Math.random() < 0.2) {
        self._triggerRandom(function () { self._afterMove(mover, rem); });
      } else {
        self._afterMove(mover, rem);
      }
    }, 260);
  },

  _triggerRandom: function (cb) {
    var heaps = this._cloneHeaps(this.data.heaps);
    var counts = heaps.map(function (h) { return h.count; });
    var nonZero = [];
    for (var i = 0; i < heaps.length; i++) if (heaps[i].count > 0) nonZero.push(i);
    if (nonZero.length === 0) { cb(); return; }

    var r = Math.floor(Math.random() * 4);
    var msg = '';
    if (r === 0) {
      // 大风：最大堆 -1
      var maxIdx = nonZero[0];
      for (var a = 1; a < nonZero.length; a++) if (heaps[nonZero[a]].count > heaps[maxIdx].count) maxIdx = nonZero[a];
      if (heaps[maxIdx].count > 0) {
        heaps[maxIdx].count -= 1;
        var st = heaps[maxIdx].stones;
        for (var s = st.length - 1; s >= 0; s--) { if (!st[s].taken) { st[s].taken = true; break; } }
        msg = '🌪️ 大风：最大堆 -1';
      }
    } else if (r === 1) {
      // 地震：最小堆消失
      var minIdx = nonZero[0];
      for (var b = 1; b < nonZero.length; b++) if (heaps[nonZero[b]].count < heaps[minIdx].count) minIdx = nonZero[b];
      var st2 = heaps[minIdx].stones;
      for (var t = 0; t < st2.length; t++) st2[t].taken = true;
      heaps[minIdx].count = 0;
      msg = '🌋 地震：最小堆消失';
    } else if (r === 2) {
      // 宝藏：随机一堆 +2
      var bi = nonZero[Math.floor(Math.random() * nonZero.length)];
      heaps[bi].count += 2;
      heaps[bi].stones = heaps[bi].stones.concat([{ taken: false, removing: false }, { taken: false, removing: false }]);
      msg = '💎 宝藏：某堆 +2';
    } else {
      // 交换：两堆数量互换
      if (nonZero.length >= 2) {
        var i1 = nonZero[Math.floor(Math.random() * nonZero.length)];
        var i2 = nonZero[Math.floor(Math.random() * nonZero.length)];
        var guard = 0;
        while (i2 === i1 && guard < 20) { i2 = nonZero[Math.floor(Math.random() * nonZero.length)]; guard++; }
        if (i1 !== i2) {
          var tmp = heaps[i1].count; heaps[i1].count = heaps[i2].count; heaps[i2].count = tmp;
          var ts = heaps[i1].stones; heaps[i1].stones = heaps[i2].stones; heaps[i2].stones = ts;
          msg = '🔄 交换：两堆互换';
        }
      }
    }
    if (!msg) { cb(); return; }
    var rem = heaps.reduce(function (acc, h) { return acc + h.count; }, 0);
    var self = this;
    this.setData({ heaps: heaps, status: msg, remaining: rem });
    this._randTimer = setTimeout(function () {
      self._setHeapSelected([]);
      cb();
    }, 500);
  },

  _afterMove: function (mover, rem) {
    if (rem === 0) {
      this._endGame(mover);
      return;
    }
    var next = (mover === 'A') ? 'B' : 'A';
    this.setData({ current: next, status: '玩家' + next + ' 回合', busy: false });
    this._recalc();
  },

  _endGame: function (mover) {
    var win;
    if (this.data.lastWin) win = mover;
    else win = (mover === 'A') ? 'B' : 'A';
    var sum = this.data.lastWin
      ? ('玩家' + mover + ' 拿走最后一颗，获胜！')
      : ('玩家' + mover + ' 拿走了最后一颗（拿最后输），玩家' + win + ' 获胜！');
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    try { wx.vibrateLong(); } catch (err) {}
    var mode = (this.data.heapCount + '堆 · ' + (this.data.variant === 'limitK' ? '每堆最多' + this.data.kVal : this.data.variant === 'multiM' ? '最多' + this.data.mVal + '堆各拿1' : '单堆自由拿') + ' · ' + (this.data.lastWin ? '拿最后赢' : '拿最后输(misère)'));
    if (this.data.randomOn) mode += ' · 随机事件';
    this.setData({
      phase: 'result',
      winnerText: '玩家' + win + ' 获胜 🏆',
      summary: sum,
      modeText: mode
    });
  },

  _moveDesc: function (mover, moves) {
    if (moves.length === 1) {
      return '玩家' + mover + ' 从堆' + (moves[0].idx + 1) + ' 拿走 ' + moves[0].take + ' 颗';
    }
    var parts = moves.map(function (m) { return '堆' + (m.idx + 1); });
    return '玩家' + mover + ' 从 ' + parts.join('、') + ' 各拿 1 颗';
  },

  _cloneHeaps: function (heaps) {
    return heaps.map(function (h) {
      return {
        id: h.id, count: h.count, selected: h.selected,
        stones: h.stones.map(function (s) { return { taken: s.taken, removing: s.removing }; })
      };
    });
  },

  // ---------- 辅助 ----------
  undo: function () {
    if (this.data.busy || this.data.undoLeft <= 0 || !this.data.undoSnap) return;
    var snap = this.data.undoSnap;
    this._clearTimers();
    this.setData({
      heaps: this._cloneHeaps(snap.heaps),
      current: snap.current,
      remaining: snap.remaining,
      history: snap.history.slice(),
      status: snap.status,
      selectedHeap: snap.selectedHeap,
      selectedHeaps: snap.selectedHeaps.slice(),
      selectedHeapsLen: snap.selectedHeaps.length,
      undoLeft: this.data.undoLeft - 1,
      undoSnap: null,
      busy: false,
      phase: 'playing'
    });
    this._setHeapSelected(snap.selectedHeaps);
    this._recalc();
  },

  toggleHintPanel: function () { this.setData({ showHintPanel: !this.data.showHintPanel }); },
  toggleHistory: function () { this.setData({ showHistory: !this.data.showHistory }); },

  backSetup: function () {
    this._clearTimers();
    this.setData({ phase: 'setup', heaps: [], busy: false, showHistory: false, showHintPanel: false });
  },

  replay: function () {
    this.onStart();
  }
});
