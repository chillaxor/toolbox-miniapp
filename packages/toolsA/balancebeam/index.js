// 平衡木：左右倾斜手机，保持小球在木条上不掉落，坚持越久分越高
var CENTER = 375;   // 轨道中心 (rpx，屏宽 750)
var BALL = 64;      // 小球直径 (rpx)
var INVERT = -1;    // 倾斜方向：多数机型 portrait 下右倾时 res.x 为负，取反后「右倾=球向右」更直觉

// 各难度参数
var DIFFS = {
  easy:   { half0: 330, halfMin: 220, shrink: 5,  K: 720,  damp: 2.4, noise: 150, gustA: 380, gustEvery: 4.5, label: '轻松' },
  normal: { half0: 290, halfMin: 150, shrink: 8,  K: 860,  damp: 1.9, noise: 240, gustA: 520, gustEvery: 3.2, label: '标准' },
  hard:   { half0: 250, halfMin: 100, shrink: 12, K: 1000, damp: 1.5, noise: 340, gustA: 680, gustEvery: 2.2, label: '地狱' }
};

Page({
  data: {
    phase: 'setup',      // setup | ready | playing | result
    diff: 'normal',
    diffLabel: '标准',
    countdown: 3,
    time: '0.0',
    best: '0.0',
    ballLeft: CENTER - BALL / 2,   // rpx
    ballTop: 0,                    // 掉落动画偏移
    beamW: 580,                    // 木条宽度 rpx
    beamLeft: CENTER - 290,        // 木条左偏移 rpx
    tiltPct: 0,                    // 倾斜指示 -100..100
    gustDir: 0,                    // 阵风方向 -1/0/1（显示箭头）
    falling: false,
    fallDir: 1,
    // 结算
    resTime: '0.0',
    stars: 0,
    starsText: '',
    isNewBest: false,
    tipText: ''
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (__flags.balancebeam === false) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
  },

  onHide: function () {
    this._stopAll();
  },

  onUnload: function () {
    this._stopAll();
  },

  onShow: function () {
    // 后台切回：若仍在游戏中则恢复
    if (this.data.phase === 'playing' && !this._loop) {
      this._startSensor();
      this._lastTs = Date.now();
      this._loop = setInterval(this._tick.bind(this), 33);
    }
  },

  // ---- 设置 ----
  chooseDiff: function (e) {
    var d = e.currentTarget.dataset.d;
    if (!DIFFS[d]) return;
    var best = wx.getStorageSync('bb_best_' + d);
    this.setData({
      diff: d,
      diffLabel: DIFFS[d].label,
      best: best ? (Math.round(best * 10) / 10).toFixed(1) : '0.0'
    });
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  onStart: function () {
    var d = this.data.diff;
    var P = DIFFS[d];
    // 初始化物理量
    this._P = P;
    this._pos = 0;         // 相对中心偏移 rpx
    this._vel = 0;
    this._tilt = 0;
    this._elapsed = 0;     // 已坚持秒数
    this._gustT = P.gustEvery;
    this._gustLeft = 0;
    this._gustDir = 0;
    this._half = P.half0;

    var best = wx.getStorageSync('bb_best_' + d);
    this.setData({
      phase: 'ready',
      countdown: 3,
      time: '0.0',
      best: best ? (Math.round(best * 10) / 10).toFixed(1) : '0.0',
      ballLeft: CENTER - BALL / 2,
      ballTop: 0,
      beamW: P.half0 * 2,
      beamLeft: CENTER - P.half0,
      tiltPct: 0,
      gustDir: 0,
      falling: false
    });
    // 准备阶段就开始读传感器，让玩家先摆正手机
    this._startSensor();
    this._countdown();
  },

  _countdown: function () {
    var self = this;
    var n = 3;
    this.setData({ countdown: n });
    this._cdTimer = setInterval(function () {
      n -= 1;
      if (n <= 0) {
        clearInterval(self._cdTimer);
        self._cdTimer = null;
        self._beginPlay();
      } else {
        self.setData({ countdown: n });
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
      }
    }, 800);
  },

  _beginPlay: function () {
    this.setData({ phase: 'playing' });
    this._lastTs = Date.now();
    this._loop = setInterval(this._tick.bind(this), 33);
  },

  // ---- 传感器 ----
  _startSensor: function () {
    var self = this;
    try {
      wx.startAccelerometer && wx.startAccelerometer({ interval: 'game' });
    } catch (e) {}
    this._accCb = function (res) {
      // portrait：res.x 表征左右倾斜
      self._tilt = INVERT * res.x;
    };
    wx.onAccelerometerChange && wx.onAccelerometerChange(this._accCb);
  },

  _stopSensor: function () {
    try { wx.stopAccelerometer && wx.stopAccelerometer(); } catch (e) {}
    try { wx.offAccelerometerChange && wx.offAccelerometerChange(this._accCb); } catch (e) {}
    this._accCb = null;
  },

  _stopAll: function () {
    if (this._loop) { clearInterval(this._loop); this._loop = null; }
    if (this._cdTimer) { clearInterval(this._cdTimer); this._cdTimer = null; }
    this._stopSensor();
  },

  // ---- 物理主循环 ----
  _tick: function () {
    var now = Date.now();
    var dt = (now - this._lastTs) / 1000;
    this._lastTs = now;
    if (dt > 0.1) dt = 0.1;      // 卡顿保护
    var P = this._P;

    this._elapsed += dt;

    // 木条随时间收窄
    var half = P.half0 - this._elapsed * P.shrink;
    if (half < P.halfMin) half = P.halfMin;
    this._half = half;

    // 阵风：定期来一阵横向推力，带方向箭头提示
    this._gustT -= dt;
    if (this._gustLeft > 0) {
      this._gustLeft -= dt;
      if (this._gustLeft <= 0) { this._gustDir = 0; }
    }
    if (this._gustT <= 0) {
      this._gustDir = Math.random() < 0.5 ? -1 : 1;
      this._gustLeft = 0.55;
      this._gustT = P.gustEvery * (0.7 + Math.random() * 0.6);
    }

    // 加速度：倾斜 + 阵风
    var tilt = this._tilt;
    if (tilt > 1) tilt = 1; else if (tilt < -1) tilt = -1;
    var accel = tilt * P.K;
    if (this._gustLeft > 0) accel += this._gustDir * P.gustA;

    // 速度积分 + 随机抖动 + 阻尼
    this._vel += accel * dt;
    this._vel += (Math.random() - 0.5) * P.noise;
    this._vel -= this._vel * P.damp * dt;
    if (this._vel > 1400) this._vel = 1400;
    else if (this._vel < -1400) this._vel = -1400;

    this._pos += this._vel * dt;

    // 掉落判定
    if (this._pos > half || this._pos < -half) {
      this._fall(this._pos > 0 ? 1 : -1);
      return;
    }

    var tp = Math.round(tilt * 100);
    if (tp > 100) tp = 100; else if (tp < -100) tp = -100;

    this.setData({
      ballLeft: CENTER + this._pos - BALL / 2,
      beamW: half * 2,
      beamLeft: CENTER - half,
      tiltPct: tp,
      gustDir: this._gustLeft > 0 ? this._gustDir : 0,
      time: (Math.round(this._elapsed * 10) / 10).toFixed(1)
    });
  },

  // ---- 掉落 / 结算 ----
  _fall: function (dir) {
    if (this._loop) { clearInterval(this._loop); this._loop = null; }
    this._stopSensor();
    wx.vibrateLong && wx.vibrateLong();

    // 掉落动画：球滚出边缘并下坠
    var offEdge = CENTER + dir * (this._half + 120) - BALL / 2;
    this.setData({
      falling: true,
      fallDir: dir,
      ballLeft: offEdge,
      ballTop: 500
    });

    var self = this;
    setTimeout(function () { self._settle(); }, 650);
  },

  _settle: function () {
    var t = this._elapsed;
    var d = this.data.diff;
    var prev = wx.getStorageSync('bb_best_' + d) || 0;
    var isNew = t > prev;
    if (isNew) wx.setStorageSync('bb_best_' + d, t);

    // 星级
    var stars;
    if (t >= 60) stars = 5;
    else if (t >= 35) stars = 4;
    else if (t >= 20) stars = 3;
    else if (t >= 10) stars = 2;
    else stars = 1;
    var starsText = '';
    for (var i = 0; i < 5; i++) starsText += (i < stars ? '★' : '☆');

    var tips = [
      '刚站上去就掉了？再来！',
      '还行，手感在找了',
      '稳住！你已经有点平衡大师的样子',
      '厉害，手比水平仪还准',
      '封神！这平衡感是天生的吧'
    ];

    this.setData({
      phase: 'result',
      resTime: (Math.round(t * 10) / 10).toFixed(1),
      best: (Math.round((isNew ? t : prev) * 10) / 10).toFixed(1),
      stars: stars,
      starsText: starsText,
      isNewBest: isNew,
      tipText: tips[stars - 1]
    });
  },

  replay: function () {
    this.onStart();
  },

  backSetup: function () {
    this._stopAll();
    this.setData({ phase: 'setup', falling: false, ballTop: 0 });
  }
});
