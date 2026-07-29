const storage = require('../../../utils/storage.js');
const engine = require('./engine.js');

var TOTAL_OPTIONS = [5, 8, 10];
var DEFAULT_TOTAL = 8;

var LEVELS = [
  { id: 1, name: '入门', desc: '整元付钱' },
  { id: 2, name: '进阶', desc: '元角混合' },
  { id: 3, name: '挑战', desc: '大钱找零' }
];

// 介绍页认币图鉴（含「分」的知识补充放文案里，付钱环节不用分）
function galleryMoneys() {
  var ids = ['j1', 'j5', 'y1c', 'y1', 'y5', 'y10', 'y20', 'y50', 'y100'];
  return ids.map(function (id) {
    var m = engine.moneyById(id);
    return { label: m.label, cls: m.cls, kind: m.kind, tag: m.kind === 'coin' ? '硬币' : '纸币' };
  });
}

function fmtDate(ts) {
  var d = new Date(ts);
  var p = function (x) { return x < 10 ? '0' + x : '' + x; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function pickText(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

Page({
  data: {
    state: 'intro',            // intro | play | result
    levels: LEVELS,
    level: 1,
    totalOptions: TOTAL_OPTIONS,
    total: DEFAULT_TOTAL,
    gallery: [],
    historyList: [],

    // 进行中
    qIndex: 0,
    progress: 0,
    score: 0,
    starCount: 0,              // 最少张数星
    q: null,                   // 当前题（engine 生成的对象）
    // A 题
    options: [],
    findCells: [],
    aAnswered: false,
    // B / C-pick 托盘
    srcGroups: [],             // 钱包或零钱盒分组（含 leftCount）
    tray: [],                  // [{uid,label,cls,kind,value}]
    trayTotal: 0,
    trayTotalText: '0角',
    trayCls: 'tray',           // tray | tray tray-over | tray tray-done
    trayHint: '',
    trayLocked: false,
    targetText: '',            // 托盘目标金额文案
    // C-fill
    fillYuan: '',
    fillJiao: '',
    fillWrong: 0,
    fillHint: '',
    canSubmit: false,
    // 通用反馈
    feedbackText: '',
    feedbackOk: false,
    showNext: false,
    isLast: false,
    // 结算
    stars: 0,
    starList: [1, 2, 3],
    statA: null,
    statB: null,
    statC: null
  },

  onLoad: function () {
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.moneyPay !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.setData({
      gallery: galleryMoneys(),
      historyList: storage.getSync('moneyPay_history', [])
    });
  },

  onUnload: function () {
    this._clearTimer();
  },

  _clearTimer: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  },

  onSelectLevel: function (e) {
    this.setData({ level: Number(e.currentTarget.dataset.level) });
  },

  onSelectCount: function (e) {
    this.setData({ total: Number(e.currentTarget.dataset.count) });
  },

  startGame: function () {
    this._clearTimer();
    this._stats = { A: { ok: 0, total: 0 }, B: { ok: 0, total: 0 }, C: { ok: 0, total: 0 } };
    this._uid = 0;
    this.setData({ state: 'play', qIndex: 0, score: 0, starCount: 0 });
    this._genRound();
  },

  _genRound: function () {
    this._clearTimer();
    var q = engine.genQuestion(this.data.level);
    var idx = this.data.qIndex;
    var patch = {
      q: q,
      progress: Math.round(idx / this.data.total * 100),
      isLast: idx === this.data.total - 1,
      feedbackText: '',
      feedbackOk: false,
      showNext: false,
      aAnswered: false,
      options: [],
      findCells: [],
      srcGroups: [],
      tray: [],
      trayTotal: 0,
      trayTotalText: '0角',
      trayCls: 'tray',
      trayHint: '',
      trayLocked: false,
      targetText: '',
      fillYuan: '',
      fillJiao: '',
      fillWrong: 0,
      fillHint: '',
      canSubmit: false
    };

    if (q.type === 'A') {
      if (q.mode === 'find') {
        patch.findCells = q.cells;
      } else {
        patch.options = q.options;
      }
    } else if (q.type === 'B') {
      patch.srcGroups = q.wallet.map(function (g) {
        return { id: g.id, kind: g.kind, value: g.value, label: g.label, cls: g.cls, count: g.count, left: g.count };
      });
      patch.targetText = q.priceText;
    } else if (q.type === 'C' && q.mode === 'pick') {
      patch.srcGroups = q.box.map(function (g) {
        return { id: g.id, kind: g.kind, value: g.value, label: g.label, cls: g.cls, count: g.count, left: g.count };
      });
      patch.targetText = q.changeText;
    }
    this.setData(patch);
  },

  // ============ 题型 A ============
  onOptionTap: function (e) {
    if (this.data.aAnswered) return;
    var idx = Number(e.currentTarget.dataset.index);
    var q = this.data.q;
    var correct = idx === q.correctIndex;
    var opts = this.data.options.map(function (o, i) {
      var cls = 'opt';
      if (i === q.correctIndex) cls = 'opt opt-correct';
      else if (i === idx) cls = 'opt opt-wrong';
      return { text: o.text, cls: cls };
    });
    this._recordAnswer('A', correct);
    this.setData({
      options: opts,
      aAnswered: true,
      feedbackOk: correct,
      feedbackText: correct
        ? pickText(['答对啦 🎉', '好眼力！', '真棒 👍'])
        : '正确答案是 ' + q.answerText + '，记住它哦～'
    });
    this._autoNext(correct ? 1000 : 1600);
  },

  onFindTap: function (e) {
    if (this.data.aAnswered) return;
    var idx = Number(e.currentTarget.dataset.index);
    var q = this.data.q;
    var cell = this.data.findCells[idx];
    var correct = cell.value === q.correctValue;
    var cells = this.data.findCells.map(function (c, i) {
      var cls = 'find-cell';
      if (c.value === q.correctValue) cls = 'find-cell find-correct';
      else if (i === idx) cls = 'find-cell find-wrong';
      return { label: c.label, cls: c.cls, kind: c.kind, value: c.value, cellCls: cls };
    });
    this._recordAnswer('A', correct);
    this.setData({
      findCells: cells,
      aAnswered: true,
      feedbackOk: correct,
      feedbackText: correct
        ? pickText(['找对啦 🎉', '火眼金睛！', '真棒 👍'])
        : '这张才是 ' + q.answerText + ' 哦～'
    });
    this._autoNext(correct ? 1000 : 1600);
  },

  // ============ 托盘交互（B 付钱 / C-pick 拿零钱共用） ============
  onSourceTap: function (e) {
    if (this.data.trayLocked) return;
    var gi = Number(e.currentTarget.dataset.gindex);
    var groups = this.data.srcGroups.slice();
    var g = groups[gi];
    if (!g || g.left === 0) return;
    groups[gi] = { id: g.id, kind: g.kind, value: g.value, label: g.label, cls: g.cls, count: g.count, left: g.left - 1 };
    this._uid++;
    var tray = this.data.tray.concat([{ uid: this._uid, gi: gi, label: g.label, cls: g.cls, kind: g.kind, value: g.value }]);
    this.setData({ srcGroups: groups, tray: tray });
    this._judgeTray();
  },

  onTrayTap: function (e) {
    if (this.data.trayLocked) return;
    var ti = Number(e.currentTarget.dataset.tindex);
    var tray = this.data.tray.slice();
    var piece = tray[ti];
    if (!piece) return;
    tray.splice(ti, 1);
    var groups = this.data.srcGroups.slice();
    var g = groups[piece.gi];
    groups[piece.gi] = { id: g.id, kind: g.kind, value: g.value, label: g.label, cls: g.cls, count: g.count, left: g.left + 1 };
    this.setData({ srcGroups: groups, tray: tray });
    this._judgeTray();
  },

  _judgeTray: function () {
    var q = this.data.q;
    var target = q.type === 'B' ? q.priceJiao : q.changeJiao;
    var total = 0;
    for (var i = 0; i < this.data.tray.length; i++) total += this.data.tray[i].value;
    var patch = { trayTotal: total, trayTotalText: engine.formatJiao(total) };
    if (total === 0) {
      patch.trayCls = 'tray';
      patch.trayHint = '';
      this.setData(patch);
      return;
    }
    if (total === target) {
      // 成功
      patch.trayCls = 'tray tray-done';
      patch.trayLocked = true;
      var gotStar = false;
      if (q.type === 'B' && this.data.tray.length === q.minPieces) {
        gotStar = true;
        patch.starCount = this.data.starCount + 1;
      }
      this._recordAnswer(q.type, true);
      patch.feedbackOk = true;
      if (q.type === 'B') {
        patch.feedbackText = gotStar
          ? '付得真准！还用了最少的张数 ⭐'
          : pickText(['付得刚刚好 🎉', '太会付钱了！', '正正好好 👍']);
      } else {
        patch.feedbackText = q.paidLabel + ' − ' + q.priceText + ' = 找回 ' + q.changeText + ' ✔';
      }
      this.setData(patch);
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
      this._autoNext(1400);
    } else if (total > target) {
      patch.trayCls = 'tray tray-over';
      patch.trayHint = '多了哦，点托盘里的钱退回去一些～';
      this.setData(patch);
    } else {
      patch.trayCls = 'tray';
      patch.trayHint = '还差 ' + engine.formatJiao(target - total);
      this.setData(patch);
    }
  },

  // ============ C-fill 找零填数 ============
  onYuanInput: function (e) {
    this.setData({ fillYuan: e.detail.value });
    this._checkCanSubmit();
  },

  onJiaoInput: function (e) {
    this.setData({ fillJiao: e.detail.value });
    this._checkCanSubmit();
  },

  _checkCanSubmit: function () {
    var y = this.data.fillYuan, j = this.data.fillJiao;
    var has = (y !== '' && y !== null) || (j !== '' && j !== null);
    this.setData({ canSubmit: has && !this.data.showNext });
  },

  onSubmitChange: function () {
    if (!this.data.canSubmit || this.data.showNext) return;
    var q = this.data.q;
    var y = parseInt(this.data.fillYuan, 10);
    var j = parseInt(this.data.fillJiao, 10);
    if (isNaN(y)) y = 0;
    if (isNaN(j)) j = 0;
    if (j > 9) {
      this.setData({ fillHint: '角最多填到 9 哦（10角 = 1元）' });
      return;
    }
    var val = y * 10 + j;
    if (val === q.changeJiao) {
      this._recordAnswer('C', this.data.fillWrong === 0);
      this.setData({
        feedbackOk: true,
        feedbackText: q.paidLabel + ' − ' + q.priceText + ' = 找回 ' + q.changeText + ' 🎉',
        fillHint: '',
        canSubmit: false
      });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
      this._autoNext(1400);
      return;
    }
    // 分层提示
    var wrong = this.data.fillWrong + 1;
    var hint;
    if (wrong === 1) {
      hint = '先想想：你付了多少钱？东西多少钱？';
    } else if (wrong === 2) {
      hint = '算式是：' + q.paidLabel + ' − ' + q.priceText + ' = ？';
    } else {
      this._recordAnswer('C', false);
      this.setData({
        fillWrong: wrong,
        fillHint: '',
        feedbackOk: false,
        feedbackText: '答案是 ' + q.changeText + '：' + q.paidLabel + ' − ' + q.priceText + ' = ' + q.changeText,
        canSubmit: false
      });
      this._autoNext(2000);
      return;
    }
    this.setData({ fillWrong: wrong, fillHint: hint });
  },

  // ============ 流程 ============
  _recordAnswer: function (type, correct) {
    var s = this._stats[type];
    s.total++;
    if (correct) s.ok++;
    if (correct) this.setData({ score: this.data.score + 1 });
  },

  _autoNext: function (delay) {
    var self = this;
    this.setData({ showNext: true });
    this._clearTimer();
    this._timer = setTimeout(function () {
      self._timer = null;
      self.next();
    }, delay);
  },

  next: function () {
    this._clearTimer();
    if (!this.data.showNext) return;
    if (this.data.isLast) {
      this._finish();
    } else {
      this.setData({ qIndex: this.data.qIndex + 1 });
      this._genRound();
    }
  },

  _finish: function () {
    var total = this.data.total;
    var score = this.data.score;
    var stars = score >= total - 1 ? 3 : (score >= Math.ceil(total / 2) ? 2 : 1);
    var st = this._stats;
    var mk = function (s, label) {
      return s.total > 0 ? { label: label, ok: s.ok, total: s.total } : null;
    };
    var rec = {
      score: score, total: total, level: this.data.level,
      starCount: this.data.starCount, ts: Date.now(), dt: fmtDate(Date.now())
    };
    var hist = storage.getSync('moneyPay_history', []);
    hist.unshift(rec);
    if (hist.length > 10) hist = hist.slice(0, 10);
    storage.setSync('moneyPay_history', hist);
    storage.addHistory({
      toolId: 'moneyPay',
      toolName: '人民币购物练习',
      category: 'study',
      summary: '得分 ' + score + '/' + total,
      timestamp: Date.now()
    });
    this.setData({
      state: 'result',
      stars: stars,
      statA: mk(st.A, '认一认'),
      statB: mk(st.B, '付钱'),
      statC: mk(st.C, '算找零'),
      historyList: hist
    });
  },

  restart: function () {
    this.startGame();
  },

  goIntro: function () {
    this._clearTimer();
    this.setData({ state: 'intro', historyList: storage.getSync('moneyPay_history', []) });
  },

  onShareAppMessage: function () {
    return { title: '人民币购物练习：动手付钱算找零', path: '/packages/toolsB/moneyPay/index' };
  }
});
