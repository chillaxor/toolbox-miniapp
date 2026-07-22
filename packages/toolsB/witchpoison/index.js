// 神秘陷阱 · 小程序工具
// 核心玩法：一人藏陷阱，另一人逐个试，点到陷阱就中招
// 单人 = 对战电脑守护者；双人 = 同设备热座（守护模式 / 对决模式）
// 支持：单主题 / 多主题混合；棋盘尺寸随数量自适应；点到陷阱弹窗提示

// 内容主题包：彩色圆圈 / 五角星 / 水果 / 零食
var THEMES = {
  gem: {
    name: '魔法宝石', kind: 'shape', shape: 'circle',
    colors: ['#FF6B6B', '#FFA94D', '#FFD43B', '#51CF66', '#4DABF7', '#9775FA', '#F783AC', '#22B8CF'],
    labels: ['红宝石', '橙宝石', '黄宝石', '绿宝石', '蓝宝石', '紫宝石', '粉宝石', '青宝石']
  },
  star: {
    name: '闪亮星星', kind: 'shape', shape: 'star',
    colors: ['#FFD43B', '#FF6B6B', '#4DABF7', '#51CF66', '#9775FA', '#FFA94D', '#F783AC', '#22B8CF'],
    labels: ['金星', '红星', '蓝星', '绿星', '紫星', '橙星', '粉星', '青星']
  },
  fruit: {
    name: '水果乐园', kind: 'emoji',
    emoji: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🥝'],
    labels: ['苹果', '香蕉', '葡萄', '草莓', '橘子', '西瓜', '桃子', '猕猴桃']
  },
  snack: {
    name: '零食派对', kind: 'emoji',
    emoji: ['🍪', '🍩', '🍫', '🍬', '🍭', '🧁', '🍿', '🥨'],
    labels: ['饼干', '甜甜圈', '巧克力', '糖果', '棒棒糖', '纸杯蛋糕', '爆米花', '薯条']
  }
};

function randInt(n) {
  return Math.floor(Math.random() * n);
}

// 根据数量计算棋盘尺寸（rpx），数量越大格子越小，60 个也能基本一屏内显示
function computeSizes(count) {
  var cell, gap;
  if (count <= 8) { cell = 186; gap = 26; }
  else if (count <= 15) { cell = 150; gap = 20; }
  else if (count <= 30) { cell = 112; gap = 14; }
  else { cell = 84; gap = 10; }
  var badge = Math.round(cell * 0.30);
  return {
    cellSize: cell,
    gap: gap,
    circleSize: Math.round(cell * 0.62),
    starSize: Math.round(cell * 0.66),
    emojiSize: Math.round(cell * 0.58),
    badgeSize: badge,
    badgeFont: Math.round(badge * 0.55),
    badgeOff: Math.round(badge * 0.22)
  };
}

Page({
  data: {
    phase: 'setup',          // setup | cover | hide | guess | result
    mode: 'single',          // single | double
    subMode: 'guardian',     // guardian | duel（仅 double）
    singleHider: 'computer', // computer 电脑随机 | friend 好友来藏（仅 single）
    themeIds: ['gem'],       // 选中的主题（可多个，混排）
    themeSel: { gem: true, star: false, fruit: false, snack: false },
    count: 6,
    // 棋盘尺寸（随数量自适应）
    cellSize: 186, gap: 26, circleSize: 116, starSize: 124, emojiSize: 108,
    badgeSize: 56, badgeFont: 31, badgeOff: 12,
    items: [],
    trapIndex: -1,           // 单人 / 守护模式：隐藏的陷阱
    trapA: -1,               // 对决模式：玩家1 的陷阱
    trapB: -1,               // 对决模式：玩家2 的陷阱
    guardian: 1,             // 守护模式：当前守护者（1 / 2）
    hider: 1,               // 对决模式：正在藏陷阱的玩家
    guessTurn: 'A',          // 对决模式：当前猜测方
    combo: 0,
    best: 0,
    score1: 0,
    score2: 0,
    round: 1,
    coverText: '',
    hint: '',
    resultTitle: '',
    resultSub: '',
    // 弹窗
    popup: { show: false, emoji: '', title: '', sub: '' }
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.witchpoison) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var best = 0;
    try { best = wx.getStorageSync('wp_best') || 0; } catch (e) {}
    this.setData({ best: best });
  },

  // ---------- Setup ----------
  selectMode: function (e) {
    var m = e.currentTarget.dataset.mode;
    this.setData({ mode: m });
    if (m === 'single') { this.setData({ subMode: 'guardian' }); }
  },
  selectSub: function (e) {
    this.setData({ subMode: e.currentTarget.dataset.sub });
  },
  // 单人模式：陷阱由谁设置（电脑随机 / 好友来藏）
  selectSingleHider: function (e) {
    this.setData({ singleHider: e.currentTarget.dataset.hider });
  },
  // 主题多选：点已选中的再点取消（至少保留 1 个），否则加入
  selectTheme: function (e) {
    var id = e.currentTarget.dataset.theme;
    var sel = {};
    for (var k in this.data.themeSel) { sel[k] = this.data.themeSel[k]; }
    if (sel[id]) {
      var cnt = 0;
      for (var k2 in sel) { if (sel[k2]) cnt++; }
      if (cnt <= 1) return; // 必须至少保留一个主题
      sel[id] = false;
    } else {
      sel[id] = true;
    }
    var ids = [];
    for (var k3 in sel) { if (sel[k3]) ids.push(k3); }
    this.setData({ themeSel: sel, themeIds: ids });
  },
  selectCount: function (e) {
    this.setData({ count: parseInt(e.currentTarget.dataset.count, 10) });
  },

  onStart: function () {
    if (this.data.mode === 'single') {
      if (this.data.singleHider === 'friend') this.startFriendHide();
      else this.startSingle();
    } else if (this.data.subMode === 'guardian') {
      this.startGuardianRound(1);
    } else {
      this.startDuel();
    }
  },

  // 根据选中的多个主题 + 数量生成棋盘（允许重复物品，跨主题混排）
  buildItems: function () {
    var ids = this.data.themeIds;
    var list = [];
    for (var i = 0; i < this.data.count; i++) {
      var t = THEMES[ids[randInt(ids.length)]];
      var itemCount = t.kind === 'emoji' ? t.emoji.length : t.colors.length;
      var idx = randInt(itemCount);
      if (t.kind === 'emoji') {
        list.push({ kind: 'emoji', emoji: t.emoji[idx], label: t.labels[idx], state: 'idle' });
      } else {
        list.push({ kind: 'shape', shape: t.shape, color: t.colors[idx], label: t.labels[idx], state: 'idle' });
      }
    }
    var sizes = computeSizes(this.data.count);
    this.setData({ items: list, cellSize: sizes.cellSize, gap: sizes.gap,
      circleSize: sizes.circleSize, starSize: sizes.starSize, emojiSize: sizes.emojiSize,
      badgeSize: sizes.badgeSize, badgeFont: sizes.badgeFont, badgeOff: sizes.badgeOff });
  },

  // ---------- 单人：电脑守护者藏陷阱 ----------
  startSingle: function () {
    this.buildItems();
    var trap = randInt(this.data.count);
    this.setData({
      trapIndex: trap,
      combo: 0,
      phase: 'guess',
      hint: '守护者布好陷阱啦～点一个物品试试'
    });
  },

  // ---------- 单人·好友藏陷阱（交给真人藏） ----------
  startFriendHide: function () {
    this.buildItems();
    this.setData({
      trapIndex: -1,
      combo: 0,
      phase: 'cover',
      coverText: '把手机交给好友，请 TA 偷偷选 1 个陷阱藏好'
    });
  },

  // ---------- 双人·守护模式 ----------
  startGuardianRound: function (guardian) {
    this.buildItems();
    this.setData({
      trapIndex: -1,
      guardian: guardian,
      phase: 'cover',
      coverText: guardian === 1
        ? '把手机交给玩家1（守护者），偷偷选 1 个陷阱藏好'
        : '把手机交给玩家2（守护者），偷偷选 1 个陷阱藏好'
    });
  },

  // ---------- 双人·对决模式 ----------
  startDuel: function () {
    this.buildItems();
    this.setData({
      trapA: -1,
      trapB: -1,
      hider: 1,
      guessTurn: 'A',
      phase: 'cover',
      coverText: '把手机交给玩家1，偷偷选 1 个「你的陷阱」'
    });
  },

  // ---------- 防偷看遮罩：继续 ----------
  onCoverContinue: function () {
    if (this.data.phase !== 'cover') return;
    if (this.data.subMode === 'guardian') {
      if (this.data.trapIndex < 0) {
        var hideHint = this.data.mode === 'single'
          ? '好友：点 1 个物品设为陷阱'
          : (this.data.guardian === 1 ? '玩家1' : '玩家2') + '：点 1 个物品设为陷阱';
        this.setData({ phase: 'hide', hint: hideHint });
      } else {
        this.setData({ phase: 'guess', hint: '轮到你猜啦，点一个试试' });
      }
    } else {
      if (this.data.hider === 1 && this.data.trapA < 0) {
        this.setData({ phase: 'hide', hint: '玩家1：点 1 个设为你的陷阱' });
      } else if (this.data.hider === 2 && this.data.trapB < 0) {
        this.setData({ phase: 'hide', hint: '玩家2：点 1 个设为你的陷阱' });
      }
    }
  },

  // ---------- 藏陷阱（双人 hide 阶段） ----------
  onHidePick: function (i) {
    if (this.data.subMode === 'guardian') {
      var coverTxt;
      if (this.data.mode === 'single') {
        coverTxt = '好了，把手机交还给你，准备开始猜～';
      } else {
        var guardian = this.data.guardian;
        coverTxt = guardian === 1
          ? '交给玩家2，准备好开始猜'
          : '交给玩家1，准备好开始猜';
      }
      this.setData({ trapIndex: i, phase: 'cover', coverText: coverTxt });
    } else {
      if (this.data.hider === 1) {
        this.setData({
          trapA: i, hider: 2, phase: 'cover',
          coverText: '把手机交给玩家2，偷偷选 1 个「你的陷阱」'
        });
      } else {
        this.setData({
          trapB: i, guessTurn: 'A', phase: 'guess',
          hint: '轮流选，点到对方的陷阱就输'
        });
      }
    }
  },

  // ---------- 统一点击入口 ----------
  onPick: function (e) {
    var i = e.currentTarget.dataset.index;
    var phase = this.data.phase;
    if (phase === 'hide') { this.onHidePick(i); return; }
    if (phase !== 'guess') return;
    if (this.data.mode === 'single') this.pickSingle(i);
    else if (this.data.subMode === 'guardian') this.pickGuardian(i);
    else this.pickDuel(i);
    try { wx.vibrateShort({ type: 'light' }); } catch (err) {}
  },

  // 统计：还剩几个「安全的空闲物品」（不含陷阱）
  idleSafeCount: function (items, trapIdx) {
    var c = 0;
    for (var k = 0; k < items.length; k++) {
      if (items[k].state === 'idle' && k !== trapIdx) c++;
    }
    return c;
  },
  idleCount: function (items) {
    var c = 0;
    for (var k = 0; k < items.length; k++) {
      if (items[k].state === 'idle') c++;
    }
    return c;
  },

  // 弹出结果弹窗（点陷阱 / 通关 / 胜负）
  openPopup: function (emoji, title, sub) {
    this.setData({ popup: { show: true, emoji: emoji, title: title, sub: sub } });
  },
  closePopup: function () {
    this.setData({ 'popup.show': false });
  },

  // ---------- 单人猜测 ----------
  pickSingle: function (i) {
    var items = this.data.items;
    if (items[i].state !== 'idle') return;
    var combo = this.data.combo;
    if (i === this.data.trapIndex) {
      items[i].state = 'trap';
      var best = this.data.best;
      if (combo > best) { best = combo; try { wx.setStorageSync('wp_best', best); } catch (e) {} }
      try { wx.vibrateShort({ type: 'heavy' }); } catch (err) {}
      this.setData({
        items: items, phase: 'result',
        resultTitle: '哎呀，中招了 💥',
        resultSub: '你安全试了 ' + combo + ' 步',
        combo: combo, best: best
      });
      this.openPopup('💥', '中招啦！', '你安全试了 ' + combo + ' 步，再接再厉～');
    } else {
      items[i].state = 'safe';
      combo++;
      if (this.idleSafeCount(items, this.data.trapIndex) === 0) {
        items[this.data.trapIndex].state = 'trap';
        var best2 = this.data.best;
        if (combo > best2) { best2 = combo; try { wx.setStorageSync('wp_best', best2); } catch (e) {} }
        this.setData({
          items: items, phase: 'result',
          resultTitle: '通关啦！全部安全 🎉',
          resultSub: '连击 ' + combo + '，完美避开陷阱！',
          combo: combo, best: best2
        });
        this.openPopup('🎉', '通关啦！', '连击 ' + combo + '，完美避开陷阱！');
      } else {
        this.setData({ items: items, combo: combo, hint: '安全！再选一个～ 连击 ' + combo });
      }
    }
  },

  // ---------- 双人·守护模式猜测 ----------
  pickGuardian: function (i) {
    var items = this.data.items;
    if (items[i].state !== 'idle') return;
    var guardian = this.data.guardian;
    var guesser = guardian === 1 ? 2 : 1;
    if (i === this.data.trapIndex) {
      items[i].state = 'trap';
      try { wx.vibrateShort({ type: 'heavy' }); } catch (err) {}
      this.endRound(guardian, guesser + ' 中招！玩家' + guardian + '（守护者）赢这局', i);
    } else {
      items[i].state = 'safe';
      if (this.idleSafeCount(items, this.data.trapIndex) === 0) {
        items[this.data.trapIndex].state = 'trap';
        this.endRound(guesser, '玩家' + guesser + ' 全身而退，赢这局！', this.data.trapIndex);
      } else {
        this.setData({ items: items, hint: '安全～ 继续选' });
      }
    }
  },

  // ---------- 双人·对决模式猜测 ----------
  pickDuel: function (i) {
    var items = this.data.items;
    if (items[i].state !== 'idle') return;
    var turn = this.data.guessTurn;
    var opp = turn === 'A' ? this.data.trapB : this.data.trapA;
    if (i === opp) {
      items[i].state = 'trap';
      var winner = turn === 'A' ? 2 : 1;
      try { wx.vibrateShort({ type: 'heavy' }); } catch (err) {}
      this.endDuel(winner, '玩家' + turn + ' 选到对方的陷阱，中招！玩家' + winner + ' 赢', i);
    } else {
      items[i].state = 'safe';
      if (this.idleCount(items) === 0) {
        this.endDuel(0, '棋盘清空，平局！', -1);
      } else {
        var next = turn === 'A' ? 'B' : 'A';
        this.setData({
          items: items, guessTurn: next,
          hint: '玩家' + next + ' 的回合，选一个'
        });
      }
    }
  },

  endRound: function (winner, text, revealIdx) {
    var s1 = this.data.score1, s2 = this.data.score2;
    if (winner === 1) s1++;
    else if (winner === 2) s2++;
    this.setData({
      items: this.data.items, phase: 'result',
      resultTitle: text,
      resultSub: '玩家1 胜 ' + s1 + ' · 玩家2 胜 ' + s2,
      score1: s1, score2: s2, round: this.data.round + 1
    });
    this.openPopup(winner === 0 ? '🤝' : '💥', text, '玩家1 胜 ' + s1 + ' · 玩家2 胜 ' + s2);
  },
  endDuel: function (winner, text, revealIdx) {
    var s1 = this.data.score1, s2 = this.data.score2;
    if (winner === 1) s1++;
    else if (winner === 2) s2++;
    this.setData({
      items: this.data.items, phase: 'result',
      resultTitle: text,
      resultSub: '玩家1 胜 ' + s1 + ' · 玩家2 胜 ' + s2,
      score1: s1, score2: s2, round: this.data.round + 1
    });
    this.openPopup(winner === 0 ? '🤝' : '💥', text, '玩家1 胜 ' + s1 + ' · 玩家2 胜 ' + s2);
  },

  // ---------- 结算后操作 ----------
  onNextRound: function () {
    if (this.data.mode === 'single') {
      this.startSingle();
    } else if (this.data.subMode === 'guardian') {
      this.startGuardianRound(this.data.guardian === 1 ? 2 : 1);
    } else {
      this.startDuel();
    }
  },
  onBackSetup: function () {
    this.setData({
      phase: 'setup', items: [], trapIndex: -1,
      trapA: -1, trapB: -1, score1: 0, score2: 0, round: 1, combo: 0,
      popup: { show: false, emoji: '', title: '', sub: '' }
    });
  },
  onExit: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () { wx.reLaunch({ url: '/pages/index/index' }); }
    });
  },

  onShareAppMessage: function () {
    return { title: '神秘陷阱·你能猜中哪颗是陷阱吗？', path: '/packages/toolsB/witchpoison/index' };
  }
});
