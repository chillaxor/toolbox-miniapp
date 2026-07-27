var storage = require('../../../utils/storage.js');

var SLICES = [2, 3, 4, 8];
var TOTAL_OPTIONS = [5, 8, 10, 15];
var DEFAULT_TOTAL = 8;

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
// 从分数池生成 4 个不重复分数串，保证含 1/N
function fracOpts(N) {
  var pool = ['1/2', '1/3', '1/4', '1/8', '1/5', '1/6'];
  var arr = ['1/' + N];
  while (arr.length < 4) {
    var c = pool[randInt(0, pool.length - 1)];
    if (arr.indexOf(c) < 0) arr.push(c);
  }
  return shuffle(arr);
}
function numOpts(N) {
  var pool = [2, 3, 4, 5, 6, 8];
  var arr = [N];
  while (arr.length < 4) {
    var c = pool[randInt(0, pool.length - 1)];
    if (arr.indexOf(c) < 0) arr.push(c);
  }
  return shuffle(arr).map(String);
}
// 把答案串数组包装成 {text,cls} 并找出正确下标
function buildOpts(texts, correctText) {
  var arr = shuffle(texts.slice());
  var ci = arr.indexOf(correctText);
  return {
    options: arr.map(function (t) { return { text: t, cls: 'opt' }; }),
    correctIndex: ci
  };
}

// 题型生成器，返回配置片段
function genEqualChoice() {
  var N = SLICES[randInt(0, SLICES.length - 1)];
  var opts = buildOpts(fracOpts(N), '1/' + N);
  return {
    type: 'choice', slices: N, highlightIndex: -1, needCount: 0, targetLabel: '',
    questionText: '把这个披萨平均分成 ' + N + ' 份，其中的 1 份是几分之几？',
    options: opts.options, correctIndex: opts.correctIndex
  };
}
function genPickSlice() {
  var N = SLICES[randInt(0, SLICES.length - 1)];
  var hi = randInt(0, N - 1);
  var opts = buildOpts(fracOpts(N), '1/' + N);
  return {
    type: 'choice', slices: N, highlightIndex: hi, needCount: 0, targetLabel: '',
    questionText: '图中高亮的那一块，是整个披萨的几分之几？',
    options: opts.options, correctIndex: opts.correctIndex
  };
}
function genCombine() {
  var N = SLICES[randInt(0, SLICES.length - 1)];
  var opts = buildOpts(numOpts(N), String(N));
  return {
    type: 'choice', slices: N, highlightIndex: -1, needCount: 0, targetLabel: '',
    questionText: '几个 1/' + N + ' 能拼成一个完整的披萨？',
    options: opts.options, correctIndex: opts.correctIndex
  };
}
function genTapColor() {
  var N = SLICES[randInt(0, SLICES.length - 1)];
  var map = {
    2: [{ label: '1/2', need: 1 }],
    3: [{ label: '1/3', need: 1 }],
    4: [{ label: '1/4', need: 1 }, { label: '1/2', need: 2 }],
    8: [{ label: '1/8', need: 1 }, { label: '1/4', need: 2 }]
  };
  var targets = map[N];
  var t = targets[randInt(0, targets.length - 1)];
  return {
    type: 'tap', slices: N, highlightIndex: -1, needCount: t.need, targetLabel: t.label,
    questionText: '点出披萨的 ' + t.label + '（也就是点 ' + t.need + ' 块）',
    options: [], correctIndex: -1
  };
}
function genCountSlices() {
  var N = SLICES[randInt(0, SLICES.length - 1)];
  var opts = buildOpts(numOpts(N), String(N));
  return {
    type: 'choice', slices: N, highlightIndex: -1, needCount: 0, targetLabel: '',
    questionText: '这个披萨被平均分成了几份？',
    options: opts.options, correctIndex: opts.correctIndex
  };
}

var GEN = [genEqualChoice, genPickSlice, genCombine, genTapColor, genCountSlices];

Page({
  data: {
    state: 'intro',
    totalOptions: TOTAL_OPTIONS,
    total: DEFAULT_TOTAL,
    starList: [1, 2, 3],
    index: 0,
    score: 0,
    progress: 0,
    slices: 2,
    highlightIndex: -1,
    pickedSet: [],
    needCount: 0,
    targetLabel: '',
    type: 'choice',
    questionText: '',
    options: [],
    selectedIndex: -1,
    answered: false,
    isCorrect: false,
    correctIndex: -1,
    feedbackText: '',
    pizzaReady: false,
    historyList: []
  },

  onLoad: function () {
    
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.pizzaFraction !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var hist = storage.getSync('pizzaFraction_history', []) || [];
    this._hist = hist;
    this.setData({ historyList: hist });
  },

  onSelectCount: function (e) {
    var c = Number(e.currentTarget.dataset.count);
    this.setData({ total: c });
  },

  startGame: function () {
    var self = this;
    this.setData({
      state: 'play', index: 0, score: 0, progress: 0,
      answered: false, selectedIndex: -1, isCorrect: false, correctIndex: -1,
      pickedSet: [], highlightIndex: -1, targetLabel: '', feedbackText: '', pizzaReady: false
    }, function () {
      self.queryCanvas(function () { self._genRound(); });
    });
  },

  queryCanvas: function (cb) {
    var self = this;
    wx.createSelectorQuery().in(this).select('#pizza').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) { if (cb) cb(); return; }
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = 2;
      try { dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2; } catch (e) {}
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      self._canvas = canvas; self._ctx = ctx; self._cw = res[0].width; self._ch = res[0].height;
      if (cb) cb();
    });
  },

  _genRound: function () {
    var self = this;
    var g = GEN[randInt(0, GEN.length - 1)];
    var cfg = g();
    var d = this.data;
    var isLast = (d.index >= d.total - 1);
    this.setData({
      type: cfg.type, slices: cfg.slices, highlightIndex: cfg.highlightIndex,
      needCount: cfg.needCount, targetLabel: cfg.targetLabel,
      questionText: cfg.questionText, options: cfg.options, correctIndex: cfg.correctIndex,
      selectedIndex: -1, answered: false, isCorrect: false, pickedSet: [], feedbackText: '',
      pizzaReady: false,
      progress: Math.round(d.index / d.total * 100),
      isLast: isLast
    }, function () {
      self._drawCurrent(false);
    });
  },

  _drawCurrent: function (noAnim) {
    var self = this;
    var ctx = self._ctx;
    if (!ctx) return;
    if (noAnim) { self._paint(ctx, 1); self.setData({ pizzaReady: true }); return; }
    var start = Date.now();
    var dur = 420;
    function frame() {
      var t = Math.min(1, (Date.now() - start) / dur);
      var p = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      self._paint(ctx, p);
      if (t < 1) {
        if (self._canvas && self._canvas.requestAnimationFrame) self._canvas.requestAnimationFrame(frame);
        else setTimeout(frame, 16);
      } else {
        self.setData({ pizzaReady: true });
      }
    }
    frame();
  },

  _paint: function (ctx, p) {
    var self = this;
    var d = self.data;
    var W = self._cw, H = self._ch;
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 14;
    ctx.clearRect(0, 0, W, H);
    // 饼皮边
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = '#E8B873'; ctx.fill();
    // 番茄红底
    ctx.beginPath(); ctx.arc(cx, cy, R - 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#E8453C'; ctx.fill();
    var slicesN = d.slices;
    var step = 360 / slicesN;
    for (var i = 0; i < slicesN; i++) {
      var a0 = (i * step - 90) * Math.PI / 180;
      var a1 = ((i + 1) * step - 90) * Math.PI / 180;
      var mid = (a0 + a1) / 2;
      var isHi = (d.highlightIndex === i);
      var isPicked = (d.pickedSet.indexOf(i) >= 0);
      if (isPicked) {
        self._sliceFill(ctx, cx, cy, R - 7, a0, a1, '#F4C430');
      } else if (isHi) {
        self._sliceFill(ctx, cx, cy, R - 7, a0, a1, 'rgba(255,255,255,0.40)');
      }
      var px = cx + Math.cos(mid) * (R * 0.6);
      var py = cy + Math.sin(mid) * (R * 0.6);
      if (!isPicked) {
        ctx.beginPath(); ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#F4C430'; ctx.fill();
      }
    }
    // 分割线（动画展开）
    ctx.strokeStyle = '#B5302A'; ctx.lineWidth = 1.5;
    for (var j = 0; j < slicesN; j++) {
      var ang = (j * step - 90) * Math.PI / 180;
      var len = R * p;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();
    }
  },

  _sliceFill: function (ctx, cx, cy, r, a0, a1, color) {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  },

  onPizzaTap: function (e) {
    var d = this.data;
    if (d.type !== 'tap' || d.answered || !d.pizzaReady) return;
    var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!t) return;
    var x = t.x, y = t.y;
    var cx = this._cw / 2, cy = this._ch / 2, R = Math.min(this._cw, this._ch) / 2 - 14;
    var dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > R * R) return;
    var ang = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (ang < 0) ang += 360;
    var step = 360 / d.slices;
    var block = Math.floor(((ang + 90) % 360) / step);
    if (block < 0) block = 0;
    if (block >= d.slices) block = d.slices - 1;
    var set = d.pickedSet.slice();
    var idx = set.indexOf(block);
    if (idx >= 0) set.splice(idx, 1); else set.push(block);
    this.setData({ pickedSet: set });
    this._drawCurrent(true);
    if (set.length === d.needCount) {
      this.submitTap();
    }
  },

  submitTap: function () {
    var d = this.data;
    if (d.answered) return;
    var correct = (d.pickedSet.length === d.needCount);
    var score = d.score + (correct ? 1 : 0);
    var fb = correct ? ('太棒了！这就是 ' + d.targetLabel) : ('再看看，' + d.targetLabel + ' 要涂 ' + d.needCount + ' 块哦');
    this.setData({ answered: true, isCorrect: correct, score: score, feedbackText: fb });
    this._drawCurrent(true);
    var self = this;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(function () { self.next(); }, 1100);
  },

  onSelect: function (e) {
    var d = this.data;
    if (d.answered) return;
    var idx = e.currentTarget.dataset.index;
    var correct = (idx === d.correctIndex);
    var opts = d.options.map(function (o, i) {
      var cls = 'opt';
      if (i === d.correctIndex) cls += ' opt-correct';
      else if (i === idx) cls += ' opt-wrong';
      return { text: o.text, cls: cls };
    });
    var score = d.score + (correct ? 1 : 0);
    var fb = correct ? '答对啦！' : ('正确答案：' + d.options[d.correctIndex].text);
    this.setData({ answered: true, selectedIndex: idx, isCorrect: correct, score: score, options: opts, feedbackText: fb });
    var self = this;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(function () { self.next(); }, 1100);
  },

  next: function () {
    var d = this.data;
    if (!d.answered) return;
    if (d.index >= d.total - 1) { this._finish(); return; }
    var ni = d.index + 1;
    this.setData({
      index: ni, answered: false, selectedIndex: -1, isCorrect: false, correctIndex: -1,
      pickedSet: [], highlightIndex: -1, targetLabel: '', feedbackText: '',
      progress: Math.round(ni / d.total * 100)
    });
    this._genRound();
  },

  _finish: function () {
    var d = this.data;
    var stars = d.score >= d.total - 1 ? 3 : (d.score >= Math.ceil(d.total / 2) ? 2 : 1);
    var summary = '得分 ' + d.score + '/' + d.total;
    var hist = (this._hist || []).slice();
    hist.unshift({ summary: summary, ts: Date.now() });
    if (hist.length > 10) hist = hist.slice(0, 10);
    this._hist = hist;
    storage.setSync('pizzaFraction_history', hist);
    storage.addHistory({ toolId: 'pizzaFraction', toolName: '分披萨', category: 'study', summary: summary, timestamp: Date.now() });
    this.setData({ state: 'result', stars: stars, historyList: hist });
  },

  restart: function () {
    this.startGame();
  },

  goIntro: function () {
    this.setData({ state: 'intro' });
  },

  onUnload: function () {
    if (this._timer) clearTimeout(this._timer);
  },

  onShareAppMessage: function () {
    return { title: '分披萨：图形等分学分数', path: '/packages/toolsB/pizzaFraction/index' };
  }
});
