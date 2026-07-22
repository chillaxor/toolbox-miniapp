// 减法游戏（一堆石子·拿最后赢/输）——同屏双人尼姆博弈
// 必胜策略：让对手面对 (K+1) 的倍数（拿最后赢）；拿最后输时让对手面对 ≡1(mod K+1)

var PRESETS = [
  { id: 'entry', name: '入门', desc: '10颗 · 最多拿2 · 拿最后赢', init: 10, max: 2, lastWin: true },
  { id: 'easy', name: '简单', desc: '15颗 · 最多拿3 · 拿最后赢', init: 15, max: 3, lastWin: true },
  { id: 'advance', name: '进阶', desc: '20颗 · 最多拿3 · 拿最后输', init: 20, max: 3, lastWin: false },
  { id: 'challenge', name: '挑战', desc: '30颗 · 最多拿5 · 拿最后赢', init: 30, max: 5, lastWin: true },
  { id: 'custom', name: '自定义', desc: '自由设置数量与上限', init: 15, max: 3, lastWin: true }
];

function presetOf(id, customInit, customMax) {
  if (id === 'custom') return { init: customInit, max: customMax, lastWin: true };
  for (var i = 0; i < PRESETS.length; i++) {
    if (PRESETS[i].id === id) return { init: PRESETS[i].init, max: PRESETS[i].max, lastWin: PRESETS[i].lastWin };
  }
  return { init: 15, max: 3, lastWin: true };
}

// 计算当前局面下「当前玩家」的最优拿取数
function bestTake(rem, max, lastWin) {
  var K = max;
  var r = rem % (K + 1);
  if (lastWin) {
    if (r === 0) return { win: false, take: 1 }; // 劣势：无必胜，随便拿
    return { win: true, take: r };
  } else {
    // 拿最后输：目标让对手面对 ≡1 (mod K+1)
    if (r === 1) return { win: false, take: 1 };
    if (r === 0) return { win: true, take: K };
    return { win: true, take: r - 1 };
  }
}

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    presets: [],
    selectedPreset: 'easy',
    customInit: 15,
    customMax: 3,
    lastWin: true,            // 拿最后一粒：赢(true)/输(false)
    hintOn: true,             // 显示必胜提示
    hintOpen: false,          // 游戏内是否展开提示
    // 游戏中
    initCount: 15,
    maxTake: 3,
    remaining: 15,
    stones: [],
    current: 'A',
    status: '',
    takeBtns: [],
    hintTake: 1,
    hintWin: true,
    busy: false,
    // 结果
    winnerText: '',
    summary: '',
    modeText: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.subtract === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._sid = 0;
    this._animTimer = null;
    this.setData({
      presets: PRESETS.map(function (p) { return { id: p.id, name: p.name, desc: p.desc }; }),
      selectedPreset: 'easy',
      lastWin: true,
      hintOn: true,
      customInit: 15,
      customMax: 3
    });
  },

  onHide: function () {
    if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = null; }
  },

  // ---------- 设置 ----------
  selectPreset: function (e) {
    var p = e.currentTarget.dataset.p;
    var pre = presetOf(p, this.data.customInit, this.data.customMax);
    this.setData({
      selectedPreset: p,
      lastWin: (pre.lastWin !== undefined) ? pre.lastWin : this.data.lastWin,
      hintOn: true
    });
  },

  decInit: function () {
    var v = Math.max(5, this.data.customInit - 1);
    this.setData({ customInit: v });
  },
  incInit: function () {
    var v = Math.min(30, this.data.customInit + 1);
    this.setData({ customInit: v });
  },
  decMax: function () {
    var v = Math.max(2, this.data.customMax - 1);
    this.setData({ customMax: v });
  },
  incMax: function () {
    var v = Math.min(5, this.data.customMax + 1);
    this.setData({ customMax: v });
  },

  toggleLastWin: function () {
    this.setData({ lastWin: !this.data.lastWin });
  },
  toggleHint: function () {
    var on = !this.data.hintOn;
    this.setData({ hintOn: on, hintOpen: on ? this.data.hintOpen : false });
  },

  onStart: function () {
    var p = this.data.selectedPreset;
    var pre = presetOf(p, this.data.customInit, this.data.customMax);
    var init = pre.init, max = pre.max;
    this._sid = 0;
    this.setData({
      phase: 'playing',
      initCount: init,
      maxTake: max,
      remaining: init,
      stones: this._build(init),
      current: 'A',
      status: '玩家A 先手',
      lastWin: this.data.lastWin,
      hintOn: this.data.hintOn,
      hintOpen: false,
      busy: false
    });
    this._recalc();
  },

  // ---------- 游戏 ----------
  _build: function (n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push({ id: this._sid++, taken: false, removing: false });
    return a;
  },

  _recalc: function () {
    var max = this.data.maxTake;
    var rem = this.data.remaining;
    var btns = [];
    for (var i = 1; i <= max; i++) btns.push({ n: i, disabled: i > rem });
    var h = bestTake(rem, max, this.data.lastWin);
    this.setData({ takeBtns: btns, hintTake: h.take, hintWin: h.win });
  },

  take: function (e) {
    if (this.data.phase !== 'playing' || this.data.busy) return;
    var n = Number(e.currentTarget.dataset.n);
    var max = this.data.maxTake;
    var rem = this.data.remaining;
    if (!(n >= 1 && n <= max && n <= rem)) return;
    if (this.data.takeBtns[n - 1] && this.data.takeBtns[n - 1].disabled) return;

    var mover = this.data.current;
    var stones = this.data.stones.slice();
    for (var i = 0; i < n; i++) {
      var idx = rem - n + i;
      if (stones[idx]) stones[idx].removing = true;
    }
    this.setData({ stones: stones, status: '玩家' + mover + ' 拿了 ' + n + ' 颗', busy: true });
    try { wx.vibrateShort({ type: 'light' }); } catch (err) {}

    var self = this;
    this._animTimer = setTimeout(function () {
      var st = self.data.stones.slice();
      for (var i = 0; i < n; i++) {
        var idx = rem - n + i;
        if (st[idx]) { st[idx].removing = false; st[idx].taken = true; }
      }
      var nr = rem - n;
      var patch = { stones: st, remaining: nr, busy: false };
      if (nr === 0) {
        self.setData(patch);
        self._endGame(mover);
      } else {
        patch.current = (mover === 'A') ? 'B' : 'A';
        self.setData(patch);
        self._recalc();
      }
    }, 260);
  },

  _endGame: function (mover) {
    var win = this.data.lastWin ? mover : (mover === 'A' ? 'B' : 'A');
    var sum = this.data.lastWin
      ? ('玩家' + mover + ' 拿到最后一粒，获胜！')
      : ('玩家' + mover + ' 拿到了最后一粒（拿最后输），玩家' + win + ' 获胜！');
    try { wx.vibrateLong(); } catch (err) {}
    this.setData({
      phase: 'result',
      winnerText: '玩家' + win + ' 获胜 🏆',
      summary: sum,
      modeText: (this.data.initCount + '颗 · 最多拿' + this.data.maxTake + ' · ' + (this.data.lastWin ? '拿最后赢' : '拿最后输'))
    });
  },

  toggleHintOpen: function () {
    this.setData({ hintOpen: !this.data.hintOpen });
  },

  // ---------- 结果 / 返回 ----------
  backSetup: function () {
    if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = null; }
    this.setData({ phase: 'setup', stones: [], busy: false, hintOpen: false });
  },

  replay: function () {
    this.onStart();
  }
});
