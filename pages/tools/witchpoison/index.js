// 神秘陷阱 · 小程序工具
// 核心玩法：一人藏陷阱，另一人逐个试，点到陷阱就中招
// 单人 = 对战电脑守护者；双人 = 同设备热座（守护模式 / 对决模式）

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

Page({
  data: {
    phase: 'setup',          // setup | cover | hide | guess | result
    mode: 'single',          // single | double
    subMode: 'guardian',     // guardian | duel（仅 double）
    themeId: 'gem',
    count: 6,
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
    resultSub: ''
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
  selectTheme: function (e) {
    this.setData({ themeId: e.currentTarget.dataset.theme });
  },
  selectCount: function (e) {
    this.setData({ count: parseInt(e.currentTarget.dataset.count, 10) });
  },

  onStart: function () {
    if (this.data.mode === 'single') {
      this.startSingle();
    } else if (this.data.subMode === 'guardian') {
      this.startGuardianRound(1);
    } else {
      this.startDuel();
    }
  },

  // 根据主题 + 数量生成棋盘（允许重复物品）
  buildItems: function () {
    var t = THEMES[this.data.themeId];
    var list = [];
    var itemCount = t.kind === 'emoji' ? t.emoji.length : t.colors.length;
    for (var i = 0; i < this.data.count; i++) {
      var idx = randInt(itemCount);
      if (t.kind === 'emoji') {
        list.push({ kind: 'emoji', emoji: t.emoji[idx], label: t.labels[idx], state: 'idle' });
      } else {
        list.push({ kind: 'shape', shape: t.shape, color: t.colors[idx], label: t.labels[idx], state: 'idle' });
      }
    }
    this.setData({ items: list });
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
    if (this.data.mode === 'single') return;
    if (this.data.subMode === 'guardian') {
      if (this.data.trapIndex < 0) {
        this.setData({
          phase: 'hide',
          hint: (this.data.guardian === 1 ? '玩家1' : '玩家2') + '：点 1 个物品设为陷阱'
        });
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
      var guardian = this.data.guardian;
      this.setData({
        trapIndex: i,
        phase: 'cover',
        coverText: guardian === 1
          ? '交给玩家2，准备好开始猜'
          : '交给玩家1，准备好开始猜'
      });
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

  // ---------- 单人猜测 ----------
  pickSingle: function (i) {
    var items = this.data.items;
    if (items[i].state !== 'idle') return;
    var combo = this.data.combo;
    if (i === this.data.trapIndex) {
      items[i].state = 'trap';
      var best = this.data.best;
      if (combo > best) { best = combo; try { wx.setStorageSync('wp_best', best); } catch (e) {} }
      this.setData({
        items: items, phase: 'result',
        resultTitle: '哎呀，中招了 💥',
        resultSub: '你安全试了 ' + combo + ' 步',
        combo: combo, best: best
      });
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
  },

  // ---------- 结算后操作 ----------
  onNextRound: function () {
    if (this.data.mode === 'single') {
      this.startSingle();
    } else if (this.data.subMode === 'witch') {
      this.startWitchRound(this.data.witch === 1 ? 2 : 1);
    } else {
      this.startDuel();
    }
  },
  onBackSetup: function () {
    this.setData({
      phase: 'setup', items: [], poisonIndex: -1,
      poisonA: -1, poisonB: -1, score1: 0, score2: 0, round: 1, combo: 0
    });
  },
  onExit: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () { wx.reLaunch({ url: '/pages/index/index' }); }
    });
  },

  onShareAppMessage: function () {
    return { title: '神秘陷阱·你能猜中哪颗是陷阱吗？', path: '/pages/tools/witchpoison/index' };
  }
});