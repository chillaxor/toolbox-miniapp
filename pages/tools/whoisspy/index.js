var storage = require('../../../utils/storage.js');

// 词库远程基址（gitee 仓库，可随时更新词库/拼音，无需发版）
// 远程文件：whoisspy-words.json  —— 结构 [{c:平民词, s:卧底词, cp:平民词拼音, sp:卧底词拼音}, ...]
var WORD_DATA_BASE = 'https://gitee.com/b64882/qian_data/raw/master/';
// 本地兜底词库（远程拉取失败时使用，结构与远程一致）
// 注意：必须用 .js 而非 .json —— 小程序 require .json 在部分基础库下会加载失败导致整页白屏
var LOCAL_WORD_PAIRS = require('../../../data/whoisspy-words.js');
// 随机局中，平民词与卧底词互换的概率（0~1）。0=永不互换，0.5=各一半，1=总是互换。
// 这样"谁是卧底词/谁是平民词"不固定，增加随机性。
var SWAP_PROBABILITY = 0.5;

// 运行时词库：优先远程，失败回退本地
var WORD_PAIRS = LOCAL_WORD_PAIRS;

Page({
  data: {
    isFavorite: false,
    // 状态: setup, viewing, playing, voting, result
    state: 'setup',
    // 可选玩家人数（避免在 WXML 中写数组字面量，个别基础库对 wx:for 字面量不友好）
    playerCountOptions: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    playerCount: 6,
    spyCount: 1,
    // 可选卧底人数（按玩家人数动态计算，避免 WXML 中无法使用 Math.floor）
    spyOptions: [1, 2],
    players: [],
    currentPlayer: 0,
    viewingRevealed: false,
    // 进度小圆点（每项为布尔，true=已查看）。在 JS 里算好，避免 WXML 出现比较运算符。
    playerDots: [],
    // 是否全部查看完毕（currentPlayer+1 >= playerCount）
    allViewed: false,
    civilianWord: '',
    spyWord: '',
    civilianPinyin: '',
    spyPinyin: '',
    votes: {},
    votedPlayer: -1,
    round: 1,
    // 词语来源：false=随机词库, true=自己输入
    useCustom: false,
    customCivilian: '',
    customSpy: ''
  },

  onLoad: function () {
    try {
      this.checkFavorite();
      this.loadWordPairs();
      this.updateSpyOptions();
      this.updateProgress();
    } catch (e) {
      console.error('[whoisspy] onLoad error:', e);
      wx.showToast({ title: '加载出错: ' + (e && e.message ? e.message : e), icon: 'none', duration: 5000 });
    }
  },

  onShow: function () {
    this.checkFavorite();
  },

  // 拉取远程词库（gitee），优先使用远程，失败保留本地兜底
  loadWordPairs: function () {
    var cacheKey = 'whoisspy_wordpairs';
    var cached = wx.getStorageSync(cacheKey);
    if (cached && cached.length) {
      WORD_PAIRS = cached;
    }
    wx.request({
      url: WORD_DATA_BASE + 'whoisspy-words.json',
      dataType: 'json',
      success: function (res) {
        if (res && res.data && res.data.length) {
          WORD_PAIRS = res.data;
          wx.setStorageSync(cacheKey, res.data);
        }
      },
      fail: function () {
        // 网络不通 / 域名未配置，保留本地兜底词库
      }
    });
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('whoisspy') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('whoisspy');
    this.setData({ isFavorite: fav });
  },

  onPlayerCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    var spyCount = this.data.spyCount;
    if (spyCount >= Math.floor(count / 2)) {
      spyCount = 1;
    }
    var maxSpy = Math.min(3, Math.floor(count / 2) - 1);
    var spyOptions = [];
    for (var i = 1; i <= maxSpy; i++) {
      spyOptions.push(i);
    }
    this.setData({ playerCount: count, spyCount: spyCount, spyOptions: spyOptions });
  },

  // 根据玩家人数计算可选的卧底人数（避免 WXML 中无法使用 Math.floor）
  updateSpyOptions: function () {
    var count = this.data.playerCount;
    var maxSpy = Math.min(3, Math.floor(count / 2) - 1);
    var spyOptions = [];
    for (var i = 1; i <= maxSpy; i++) {
      spyOptions.push(i);
    }
    this.setData({ spyOptions: spyOptions });
  },

  // 根据 currentPlayer / playerCount 预计算进度（布尔数组 + 是否全部查看完）
  // 这样 WXML 里就不需要写比较运算符（部分 wcc 版本对 > / < 敏感会编译失败白屏）
  updateProgress: function () {
    var total = this.data.playerCount;
    var cur = this.data.currentPlayer;
    var dots = [];
    for (var i = 0; i < total; i++) {
      dots.push(i <= cur);
    }
    this.setData({ playerDots: dots, allViewed: (cur + 1 >= total) });
  },

  onSpyCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    this.setData({ spyCount: count });
  },

  // 切换词语来源：0=随机词库，1=自己输入
  onToggleCustom: function (e) {
    var on = e.currentTarget.dataset.on === '1';
    this.setData({ useCustom: on });
  },

  // 自定义词语输入
  onCustomInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var val = e.detail.value;
    if (field === 'civilian') {
      this.setData({ customCivilian: val });
    } else {
      this.setData({ customSpy: val });
    }
  },

  startGame: function () {
    var civilianWord, spyWord, civilianPinyin = '', spyPinyin = '';
    if (this.data.useCustom) {
      // 使用玩家自己输入的词语
      var c = (this.data.customCivilian || '').trim();
      var s = (this.data.customSpy || '').trim();
      if (!c || !s) {
        wx.showToast({ title: '请输入两个词语', icon: 'none' });
        return;
      }
      if (c === s) {
        wx.showToast({ title: '两个词要不一样哦', icon: 'none' });
        return;
      }
      civilianWord = c;
      spyWord = s;
    } else {
      // 随机选词对
      var pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
      // 按概率互换：让"哪个词是卧底词"不固定
      var swap = Math.random() < SWAP_PROBABILITY;
      civilianWord = swap ? pair.s : pair.c;
      spyWord = swap ? pair.c : pair.s;
      civilianPinyin = swap ? (pair.sp || '') : (pair.cp || '');
      spyPinyin = swap ? (pair.cp || '') : (pair.sp || '');
    }

    // 随机分配卧底
    var playerCount = this.data.playerCount;
    var spyCount = this.data.spyCount;
    var roles = [];
    for (var i = 0; i < playerCount; i++) {
      roles.push({ id: i + 1, name: '玩家' + (i + 1), isSpy: false, word: civilianWord, pinyin: civilianPinyin, status: 'pending', revealed: false });
    }
    if (roles.length) {
      roles[0].status = 'current'; // 第一位玩家先查看
    }

    // 打乱顺序分配卧底
    var indices = [];
    for (var j = 0; j < playerCount; j++) {
      indices.push(j);
    }
    // Fisher-Yates 洗牌
    for (var k = indices.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var temp = indices[k];
      indices[k] = indices[r];
      indices[r] = temp;
    }
    for (var s = 0; s < spyCount; s++) {
      roles[indices[s]].isSpy = true;
      roles[indices[s]].word = spyWord;
      roles[indices[s]].pinyin = spyPinyin;
    }

    this.setData({
      players: roles,
      civilianWord: civilianWord,
      spyWord: spyWord,
      civilianPinyin: civilianPinyin,
      spyPinyin: spyPinyin,
      currentPlayer: 0,
      viewingRevealed: false,
      state: 'viewing',
      votes: {},
      votedPlayer: -1,
      round: 1
    });
    this.updateProgress();
  },

  onReveal: function () {
    var players = this.data.players;
    var cur = this.data.currentPlayer;
    players[cur].revealed = true;
    this.setData({ players: players, viewingRevealed: true });
  },

  onNextPlayer: function () {
    var players = this.data.players;
    var cur = this.data.currentPlayer;
    players[cur].status = 'done';
    var next = cur + 1;
    if (next >= this.data.playerCount) {
      // 所有人已查看，进入讨论阶段
      this.setData({ players: players, state: 'playing', currentPlayer: 0, viewingRevealed: false });
    } else {
      players[next].status = 'current';
      this.setData({ players: players, currentPlayer: next, viewingRevealed: false });
    }
    this.updateProgress();
  },

  onStartVoting: function () {
    var votes = {};
    for (var i = 1; i <= this.data.playerCount; i++) {
      votes[i] = 0;
    }
    this.setData({ state: 'voting', votes: votes, votedPlayer: -1 });
  },

  onVote: function (e) {
    var targetId = Number(e.currentTarget.dataset.id);
    var votes = this.data.votes;
    votes[targetId] = (votes[targetId] || 0) + 1;
    this.setData({ votes: votes });

    // 统计是否所有人已投票
    var totalVotes = 0;
    var keys = Object.keys(votes);
    for (var i = 0; i < keys.length; i++) {
      totalVotes += votes[keys[i]];
    }

    if (totalVotes >= this.data.playerCount) {
      // 找出得票最多的玩家
      var maxVotes = 0;
      var maxId = -1;
      for (var j = 0; j < keys.length; j++) {
        if (votes[keys[j]] > maxVotes) {
          maxVotes = votes[keys[j]];
          maxId = Number(keys[j]);
        }
      }
      this.setData({ votedPlayer: maxId, state: 'result' });
    }
  },

  onShowWords: function () {
    this.setData({ state: 'showwords' });
  },

  onNewRound: function () {
    this.setData({
      round: this.data.round + 1,
      state: 'playing',
      votes: {},
      votedPlayer: -1
    });
  },

  onRestart: function () {
    this.setData({ state: 'setup' });
  },

  onShareAppMessage: function () {
    return {
      title: '谁是卧底 - 聚会必备',
      path: '/pages/tools/whoisspy/index'
    };
  }
});
