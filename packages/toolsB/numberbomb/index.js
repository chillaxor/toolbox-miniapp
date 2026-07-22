// 数字炸弹：轮流点数字，点中藏起来的"炸弹数字"就爆炸
// 点中安全数字会把安全区间收窄，越到后面越危险

var PLAYER_NAMES = ['玩家1', '玩家2', '玩家3', '玩家4'];
var PLAYER_COLORS = ['#FFD166', '#4be0c4', '#7CFC9B', '#FF8FA3'];

Page({
  data: {
    phase: 'setup',          // setup | playing | result
    players: 2,              // 玩家人数（2/3/4）
    rangeMax: 100,           // 数字范围上限（50/100/200）
    min: 1,
    lo: 1,
    hi: 100,
    current: 0,              // 当前轮到的玩家下标
    turnName: '玩家1',
    turnColor: '#FFD166',
    danger: false,           // 只剩 1 个数字（必中炸弹）
    cells: [],               // 数字格：{ n, disabled }
    explodeNum: 0,
    explodedName: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    // 用 === false：远程未配置该键（undefined）时也放行，保证本地可见；仅显式 false 才隐藏
    if (__flags.numberbomb === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
  },

  // ---------- 设置 ----------
  selectPlayers: function (e) {
    this.setData({ players: parseInt(e.currentTarget.dataset.n, 10) });
  },

  selectRange: function (e) {
    this.setData({ rangeMax: parseInt(e.currentTarget.dataset.max, 10) });
  },

  // 生成数字格：区间外的禁用（变灰）
  _buildCells: function (lo, hi, min, max) {
    var arr = [];
    for (var n = min; n <= max; n++) {
      arr.push({ n: n, disabled: (n < lo || n > hi) });
    }
    return arr;
  },

  // ---------- 开局 ----------
  onStart: function () {
    var min = 1, max = this.data.rangeMax;
    var bomb = min + Math.floor(Math.random() * (max - min + 1));
    this._bomb = bomb;
    this.setData({
      phase: 'playing',
      min: min,
      max: max,
      lo: min,
      hi: max,
      current: 0,
      danger: false,
      turnName: PLAYER_NAMES[0],
      turnColor: PLAYER_COLORS[0],
      cells: this._buildCells(min, max, min, max)
    });
  },

  // ---------- 游戏中：点数字 ----------
  tapCell: function (e) {
    if (this.data.phase !== 'playing') return;
    var n = parseInt(e.currentTarget.dataset.n, 10);
    if (n < this.data.lo || n > this.data.hi) return;   // 点禁用格忽略

    if (n === this._bomb) {                              // 踩雷！
      this._explode();
      return;
    }

    // 安全数字：收窄区间并把轮次交给下一位
    var lo = this.data.lo, hi = this.data.hi;
    if (n < this._bomb) lo = n + 1; else hi = n - 1;
    var cur = (this.data.current + 1) % this.data.players;

    this.setData({
      lo: lo,
      hi: hi,
      current: cur,
      danger: (lo === hi),
      turnName: PLAYER_NAMES[cur],
      turnColor: PLAYER_COLORS[cur],
      cells: this._buildCells(lo, hi, this.data.min, this.data.max)
    });
  },

  _explode: function () {
    var p = this.data.current;
    if (wx.vibrateLong) { try { wx.vibrateLong(); } catch (e) {} }   // 爆炸震动
    this.setData({
      phase: 'result',
      explodeNum: this._bomb,
      explodedName: PLAYER_NAMES[p]
    });
  },

  // ---------- 结果 ----------
  backSetup: function () {
    this.setData({ phase: 'setup', cells: [], danger: false });
  },

  replay: function () {
    this.onStart();
  },

  onShareAppMessage: function () {
    return {
      title: '数字炸弹·轮流点数字·谁点炸弹谁爆炸',
      path: '/packages/toolsB/numberbomb/index'
    };
  }
});
