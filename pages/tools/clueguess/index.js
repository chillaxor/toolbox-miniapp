const storage = require('../../../utils/storage.js');
const BADGE_KEY = 'detective_badges';

// 案件库：运行时优先从 gitee 拉取（wx.request 直连，不走云函数），拉到就用远程；
// 拉不到则用本地 data/clueguess_cases.js（4 条）兜底。动脑玩法：线索需玩家自己判断排除谁。
// 每个案件：生活化、无暴力；线索 eliminate 并集恰好排除"除凶手外的所有人"。
const FALLBACK_CASES = require('../../../data/clueguess_cases.js');
const CASES_URL = 'https://gitee.com/b64882/qian_data/raw/master/clueguess_cases.json';
// gitee 的 raw 链接会 302 跳转到 raw.giteeusercontent.com，部分基础库不自动跟随跨域 302，
// 用 jsDelivr 镜像（同一份 gitee 文件，无 302）做自动回退，提升 wx.request 成功率。
const CASES_URL_MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/clueguess_cases.json';
const CASES_CACHE_KEY = 'detective_cases_cache';

// 计算每个嫌疑人的显示状态：out 已排除 / pick 指认中 / sel 推理选中 / in 在场
function statesOf(suspects, remaining, accusing, picked) {
  return suspects.map(function (_, i) {
    if (remaining.indexOf(i) === -1) return 'out';
    if (accusing) return 'pick';
    if (picked.indexOf(i) >= 0) return 'sel';
    return 'in';
  });
}

Page({
  data: {
    phase: 'intro',        // intro | investigate | win
    ci: 0,
    cases: FALLBACK_CASES,
    cur: null,
    foundCount: 0,
    totalClues: 0,
    remaining: [],
    states: [],
    accusing: false,
    pendingClue: -1,       // 正在推理哪条线索（-1 表示没有）
    picked: [],            // 推理时选中的嫌疑人
    wrongHint: '',
    badges: 0
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.clueguess) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var badges = 0;
    try { badges = Number(storage.get(BADGE_KEY) || 0); } catch (e) {}
    this.setData({ badges: badges });
    this.startCase();
    this.loadCases();   // 优先从 gitee 拉取最新 100 题，本地文件兜底
  },

  // 从 gitee 拉取案件库（wx.request 直连，不走云函数）；
  // 主用 gitee 链接，失败自动回退 jsDelivr 镜像；两者都失败则保持本地兜底，不影响游戏。
  loadCases: function () {
    var self = this;
    var cached = null;
    try { cached = wx.getStorageSync(CASES_CACHE_KEY); } catch (e) {}
    if (cached && Array.isArray(cached) && cached.length) {
      self.applyCases(cached);
      return;
    }
    var urls = [CASES_URL, CASES_URL_MIRROR];
    var tryIdx = 0;
    function tryNext() {
      if (tryIdx >= urls.length) return; // 全部失败，保持本地兜底案件
      var url = urls[tryIdx++];
      wx.request({
        url: url,
        method: 'GET',
        timeout: 8000,
        success: function (res) {
          if (res.statusCode !== 200) { tryNext(); return; }
          var data = res.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (err) { tryNext(); return; }
          }
          if (data && Array.isArray(data) && data.length) {
            try { wx.setStorageSync(CASES_CACHE_KEY, data); } catch (e) {}
            self.applyCases(data);
          } else {
            tryNext();
          }
        },
        fail: function () { tryNext(); }
      });
    }
    tryNext();
  },

  // 用新案件库替换；若还在开场介绍，立即以新数据重开当前案件
  applyCases: function (cases) {
    this.setData({ cases: cases });
    if (this.data.phase === 'intro') this.startCase();
  },

  startCase: function () {
    var c = this.data.cases[this.data.ci];
    var cur = {
      title: c.title,
      scene: c.scene,
      suspects: c.suspects,
      culprit: c.culprit,
      clues: c.clues.map(function (cl) {
        return { icon: cl.icon, text: cl.text, eliminate: cl.eliminate, found: false, resolved: false };
      })
    };
    var remaining = cur.suspects.map(function (_, i) { return i; });
    this.setData({
      cur: cur,
      phase: 'intro',
      foundCount: 0,
      totalClues: cur.clues.length,
      remaining: remaining,
      states: statesOf(cur.suspects, remaining, false, []),
      accusing: false,
      pendingClue: -1,
      picked: [],
      wrongHint: ''
    });
  },

  beginInvestigate: function () {
    this.setData({ phase: 'investigate' });
  },

  // 点线索：翻开看内容，并进入"推理排除谁"状态
  tapClue: function (e) {
    if (this.data.phase !== 'investigate') return;
    var idx = Number(e.currentTarget.dataset.idx);
    var cur = this.data.cur;
    var clue = cur.clues[idx];
    if (clue.resolved) return; // 已推理完成，不再处理
    // 若这条线索要排除的人已被其它线索排除了，直接标记完成，避免"选谁都不对的死局"
    var rem = this.data.remaining;
    var alreadyOut = clue.eliminate.every(function (i) { return rem.indexOf(i) === -1; });
    if (alreadyOut) {
      var clues = cur.clues.slice();
      clues[idx] = Object.assign({}, clues[idx], { found: true, resolved: true });
      var resolvedCount = clues.filter(function (c) { return c.resolved; }).length;
      this.setData({
        cur: Object.assign({}, cur, { clues: clues }),
        foundCount: resolvedCount,
        wrongHint: '🔍 这条线索的人已经被其它线索排除了！'
      });
      return;
    }
    var clues2 = cur.clues.slice();
    clues2[idx] = Object.assign({}, clues2[idx], { found: true });
    this.setData({
      cur: Object.assign({}, cur, { clues: clues2 }),
      pendingClue: idx,
      picked: [],
      wrongHint: ''
    });
  },

  // 点嫌疑人：推理选中 / 指认，二选一取决于当前模式
  tapSuspect: function (e) {
    // —— 指认模式 ——
    if (this.data.accusing) {
      var idx = Number(e.currentTarget.dataset.idx);
      if (this.data.remaining.indexOf(idx) === -1) return; // 已排除的不能指认
      var cur = this.data.cur;
      if (idx === cur.culprit) {
        var badges = this.data.badges + 1;
        try { storage.set(BADGE_KEY, badges); } catch (err) {}
        this.setData({ accusing: false, phase: 'win', badges: badges, picked: [], pendingClue: -1 });
      } else {
        var undone = cur.clues.filter(function (cl) { return !cl.resolved; }).length;
        var hint = undone > 0
          ? '再想想～还有 ' + undone + ' 条线索没推理完哦'
          : '再想想，对比一下每条线索吧';
        this.setData({
          accusing: false,
          wrongHint: hint,
          states: statesOf(cur.suspects, this.data.remaining, false, []),
          picked: []
        });
      }
      return;
    }
    // —— 推理模式：选中/取消要排除的嫌疑人 ——
    if (this.data.pendingClue < 0) return;
    var sidx = Number(e.currentTarget.dataset.idx);
    if (this.data.remaining.indexOf(sidx) === -1) return; // 已排除的不能选
    var picked = this.data.picked.slice();
    var p = picked.indexOf(sidx);
    if (p >= 0) picked.splice(p, 1); else picked.push(sidx);
    this.setData({
      picked: picked,
      wrongHint: '',
      states: statesOf(this.data.cur.suspects, this.data.remaining, false, picked)
    });
  },

  // 确认对某条线索的排除判断
  confirmEliminate: function () {
    var pc = this.data.pendingClue;
    if (pc < 0) return;
    var cur = this.data.cur;
    var clue = cur.clues[pc];
    var remaining = this.data.remaining;
    var target = clue.eliminate.filter(function (i) { return remaining.indexOf(i) >= 0; });
    var picked = this.data.picked.slice().sort(function (a, b) { return a - b; });
    var tgt = target.slice().sort(function (a, b) { return a - b; });
    var same = picked.length === tgt.length &&
      picked.every(function (v, i) { return v === tgt[i]; });
    if (same) {
      var newRemaining = remaining.filter(function (i) { return target.indexOf(i) === -1; });
      var clues = cur.clues.slice();
      clues[pc] = Object.assign({}, clues[pc], { resolved: true });
      var resolvedCount = clues.filter(function (c) { return c.resolved; }).length;
      var allDone = resolvedCount === clues.length;
      this.setData({
        cur: Object.assign({}, cur, { clues: clues }),
        remaining: newRemaining,
        states: statesOf(cur.suspects, newRemaining, false, []),
        pendingClue: -1,
        picked: [],
        foundCount: resolvedCount,
        wrongHint: allDone ? '🎉 线索都用完啦，剩下的就是真凶！点"指认凶手"' : '👍 推理正确！'
      });
    } else {
      var hint = this.data.picked.length === 0
        ? '点一点这条线索能排除的小伙伴吧～'
        : '再看看线索，还有谁符合呢？';
      this.setData({
        wrongHint: hint,
        picked: [],
        states: statesOf(cur.suspects, remaining, false, [])
      });
    }
  },

  // 暂时不想推理这条线索
  closeReasoning: function () {
    this.setData({
      pendingClue: -1,
      picked: [],
      wrongHint: '',
      states: statesOf(this.data.cur.suspects, this.data.remaining, false, [])
    });
  },

  accuse: function () {
    if (this.data.phase !== 'investigate') return;
    this.setData({
      accusing: true,
      pendingClue: -1,
      picked: [],
      wrongHint: '',
      states: statesOf(this.data.cur.suspects, this.data.remaining, true, [])
    });
  },

  closeAccuse: function () {
    this.setData({
      accusing: false,
      states: statesOf(this.data.cur.suspects, this.data.remaining, false, [])
    });
  },

  nextCase: function () {
    var ci = (this.data.ci + 1) % this.data.cases.length;
    this.setData({ ci: ci }, this.startCase);
  },

  resetCase: function () {
    this.startCase();
  }
});
