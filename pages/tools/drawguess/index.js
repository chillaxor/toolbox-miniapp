var storage = require('../../../utils/storage.js');

// 词库远程加载：纯 word 字符串数组（无 emoji / 无 cat）
// 远程文件（上传到 gitee）：https://gitee.com/b64882/qian_data/raw/master/drawguess_words.json
// 本地兜底（小程序 require('.json') 部分基础库会失败，故用 .js）：data/drawguess_words.js
var LOCAL_WORDS = require('../../../data/drawguess_words.js');
var DATA_URL = 'https://gitee.com/b64882/qian_data/raw/master/drawguess_words.json';

var PLAYER_COLORS = ['#4A90D9', '#E85D5D', '#50C878', '#F5A623'];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 从词数组里抽 n 个：每张图卡只含 编号 + 词
function pickWords(wordList, n) {
  return shuffle(wordList).slice(0, n).map(function (w, i) {
    return { num: i + 1, word: w };
  });
}

Page({
  data: {
    phase: 'setup',            // setup | show | quiz | result
    count: 16,
    countOptions: [8, 12, 16],
    players: [],
    canAddPlayer: true,
    showAddPlayer: false,
    playerDraft: '',
    rounds: [],                // 生成题卡 {num,word}
    readIndex: -1,             // show 阶段当前高亮的编号
    reading: false,
    ttsAvailable: false,
    wordCount: LOCAL_WORDS.length, // 当前可用词数（远程/本地）
    remoteReady: false,        // 远程词库是否拉取成功
    // quiz
    quizState: 'pick',         // pick | answer
    currentNum: 0,
    revealed: false,
    awarded: false,            // 本题是否已结算（加过分），用于锁定再加分
    numCells: [],              // [{n, used}]
    answerWord: '',
    floatText: '',             // 浮动 +分（数字字符串）
    floatPlayer: -1,
    // result
    ranked: [],
    bestScore: 0,
    isFavorite: false
  },

  onLoad: function () {
    this._si = null;
    try {
      this._si = requirePlugin('WechatSI');
    } catch (e) {
      this._si = null;
    }
    this._words = LOCAL_WORDS.slice(); // 先用本地兜底，远程拉到再覆盖
    this.setData({
      ttsAvailable: !!this._si,
      isFavorite: storage.isFavorite('drawguess'),
      wordCount: this._words.length
    });
    this._comboPlayer = -1;
    this._comboCount = 0;
    this._audioCtx = null;
    this._loadRemoteWords();
  },

  // ---------- 远程词库加载（wx.request，失败回退本地） ----------
  _loadRemoteWords: function () {
    var self = this;
    wx.request({
      url: DATA_URL,
      method: 'GET',
      success: function (res) {
        var arr = res.data;
        if (typeof arr === 'string') {
          try { arr = JSON.parse(arr); } catch (e) { arr = null; }
        }
        // 兼容 {words:[...]} 或 {data:[...]} 形式
        if (arr && !Array.isArray(arr)) {
          if (Array.isArray(arr.words)) arr = arr.words;
          else if (Array.isArray(arr.data)) arr = arr.data;
        }
        if (Array.isArray(arr)) {
          var words = arr.filter(function (x) { return typeof x === 'string'; });
          if (words.length > 0) {
            self._words = words;
            self.setData({ wordCount: words.length, remoteReady: true });
            return;
          }
        }
        self.setData({ wordCount: self._words.length, remoteReady: false });
      },
      fail: function () {
        // 拉取失败：保持本地兜底，不报错
        self.setData({ wordCount: self._words.length, remoteReady: false });
      }
    });
  },

  onShow: function () {
    this.setData({ isFavorite: storage.isFavorite('drawguess') });
  },

  onUnload: function () {
    this._stopAudio();
  },

  toggleFavorite: function () {
    var f = storage.toggleFavorite('drawguess');
    this.setData({ isFavorite: f });
  },

  preventBubble: function () {},

  // ---------- setup ----------
  selectCount: function (e) {
    this.setData({ count: Number(e.currentTarget.dataset.c) });
  },

  openAddPlayer: function () {
    this.setData({ showAddPlayer: true, playerDraft: '' });
  },
  closeAddPlayer: function () {
    this.setData({ showAddPlayer: false });
  },
  onPlayerDraftInput: function (e) {
    this.setData({ playerDraft: e.detail.value });
  },
  confirmAddPlayer: function () {
    var players = this.data.players.slice();
    if (players.length >= 4) {
      wx.showToast({ title: '最多4名玩家', icon: 'none' });
      return;
    }
    var name = this.data.playerDraft.trim();
    if (!name) name = '玩家' + (players.length + 1);
    players.push({ name: name, score: 0, color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] });
    this.setData({
      players: players,
      canAddPlayer: players.length < 4,
      showAddPlayer: false,
      playerDraft: ''
    });
  },
  removePlayer: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var players = this.data.players.slice();
    players.splice(idx, 1);
    this.setData({ players: players, canAddPlayer: players.length < 4 });
  },

  onStart: function () {
    if (this.data.players.length < 1) {
      this.setData({ players: [{ name: '玩家1', score: 0, color: PLAYER_COLORS[0] }] });
    }
    var rounds = pickWords(this._words, this.data.count);
    var numCells = rounds.map(function (r) { return { n: r.num, used: false }; });
    this._comboPlayer = -1;
    this._comboCount = 0;
    this._stopAudio();
    this.setData({
      rounds: rounds,
      numCells: numCells,
      phase: 'show',
      readIndex: -1,
      reading: false,
      quizState: 'pick',
      currentNum: 0,
      revealed: false,
      awarded: false,
      answerWord: ''
    });
  },

  // ---------- show / 读题 ----------
  startRead: function () {
    if (this.data.reading) return;
    this._stopAudio();
    this.setData({ reading: true, readIndex: -1 });
    this._readNext(0);
  },
  _readNext: function (i) {
    var self = this;
    if (i >= self.data.rounds.length) {
      self.setData({ reading: false, readIndex: -1 });
      wx.showToast({ title: '读题完成，去抢答', icon: 'none' });
      return;
    }
    var item = self.data.rounds[i];
    self.setData({ readIndex: item.num });
    self._speak('第' + item.num + '号，' + item.word, function () {
      if (!self.data.reading) return;
      setTimeout(function () { self._readNext(i + 1); }, 250);
    });
  },
  goQuiz: function () {
    this._stopAudio();
    this.setData({ reading: false, readIndex: -1, phase: 'quiz', quizState: 'pick', currentNum: 0, revealed: false });
  },

  _stopAudio: function () {
    if (this._audioCtx) {
      try { this._audioCtx.stop(); } catch (e) {}
      this._audioCtx = null;
    }
    if (this.data.reading) this.setData({ reading: false });
  },

  // TTS：未配插件自动降级为定时高亮
  _speak: function (text, cb) {
    var self = this;
    if (!this._si || !this._si.textToSpeech) {
      setTimeout(function () { if (cb) cb(); }, 800);
      return;
    }
    try {
      this._si.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: function (res) {
          var ctx = wx.createInnerAudioContext();
          ctx.obeyMuteSwitch = false; // 无视静音键
          ctx.src = res.filename;
          ctx.onEnded(function () { if (cb) cb(); });
          ctx.onError(function () { if (cb) cb(); });
          self._audioCtx = ctx;
          ctx.play();
        },
        fail: function () {
          setTimeout(function () { if (cb) cb(); }, 800);
        }
      });
    } catch (e) {
      setTimeout(function () { if (cb) cb(); }, 800);
    }
  },

  // ---------- quiz ----------
  pickNumber: function (e) {
    if (this.data.quizState !== 'pick') return;
    var n = Number(e.currentTarget.dataset.n);
    var cell = this.data.numCells[n - 1];
    if (cell.used) return;
    var round = this.data.rounds[n - 1];
    this.setData({
      quizState: 'answer',
      currentNum: n,
      revealed: false,
      awarded: false,
      answerWord: round.word
    });
  },

  // 主持人点对应玩家 = 该玩家抢答（需核对答案后确认是否正确）
  tapPlayer: function (e) {
    if (this.data.quizState !== 'answer' || this.data.awarded) return;
    var idx = Number(e.currentTarget.dataset.idx);
    var self = this;
    var name = this.data.players[idx].name;
    // 弹确认框，框内直接显示正确答案，主持人核对后再决定是否加分
    wx.showModal({
      title: name + ' 答对了吗？',
      content: '正确答案：' + this.data.answerWord,
      confirmText: '答对 ✓',
      cancelText: '答错',
      success: function (res) {
        // 答错 / 取消：不加分，本题保持可继续（可换人或揭晓答案）
        if (!res.confirm) return;
        // 二次守卫：防止弹窗期间状态已变化
        if (self.data.quizState !== 'answer' || self.data.awarded) return;
        if (self._comboPlayer === idx) {
          self._comboCount += 1;
        } else {
          self._comboPlayer = idx;
          self._comboCount = 1;
        }
        var bonus = 100 * self._comboCount; // 连击：100/200/300...
        var players = self.data.players.slice();
        players[idx] = Object.assign({}, players[idx], { score: players[idx].score + bonus });
        var numCells = self.data.numCells.slice();
        numCells[self.data.currentNum - 1].used = true;
        self.setData({
          players: players,
          numCells: numCells,
          revealed: true,
          awarded: true,
          floatText: String(bonus),
          floatPlayer: idx
        });
        wx.vibrateShort({ type: 'light' });
        setTimeout(function () { self.setData({ floatText: '', floatPlayer: -1 }); }, 900);
      }
    });
  },

  noOne: function () {
    if (this.data.quizState !== 'answer' || this.data.awarded) return;
    this._comboPlayer = -1;
    this._comboCount = 0;
    var numCells = this.data.numCells.slice();
    numCells[this.data.currentNum - 1].used = true;
    this.setData({ numCells: numCells, revealed: true, awarded: true });
  },

  revealOnly: function () {
    if (this.data.quizState !== 'answer') return;
    this.setData({ revealed: true });
  },

  nextQuestion: function () {
    this.setData({ quizState: 'pick', currentNum: 0, revealed: false, awarded: false, answerWord: '' });
  },

  endGame: function () {
    var ranked = this.data.players.slice().sort(function (a, b) { return b.score - a.score; });
    var best = 0;
    for (var i = 0; i < ranked.length; i++) {
      if (ranked[i].score > best) best = ranked[i].score;
    }
    var prevBest = wx.getStorageSync('drawguess_best') || 0;
    if (best > prevBest) {
      wx.setStorageSync('drawguess_best', best);
      prevBest = best;
    }
    storage.addHistory({
      toolId: 'drawguess',
      toolName: '多图编号抢答画猜',
      category: 'fun',
      summary: '战绩 ' + (ranked[0] ? ranked[0].name + ' ' + ranked[0].score + '分' : ''),
      timestamp: Date.now()
    });
    this.setData({ phase: 'result', ranked: ranked, bestScore: prevBest });
  },

  // ---------- result ----------
  replay: function () {
    var players = this.data.players.map(function (p) {
      return { name: p.name, score: 0, color: p.color };
    });
    var rounds = pickWords(this._words, this.data.count);
    var numCells = rounds.map(function (r) { return { n: r.num, used: false }; });
    this._comboPlayer = -1;
    this._comboCount = 0;
    this.setData({
      players: players,
      rounds: rounds,
      numCells: numCells,
      phase: 'show',
      readIndex: -1,
      reading: false,
      quizState: 'pick',
      currentNum: 0,
      revealed: false,
      awarded: false,
      answerWord: ''
    });
  },
  backSetup: function () {
    this._stopAudio();
    this.setData({ phase: 'setup' });
  },

  onShareAppMessage: function () {
    var ranked = this.data.ranked;
    var title = '多图编号抢答画猜';
    if (ranked && ranked.length > 0) {
      title = ranked[0].name + ' 领先 ' + ranked[0].score + '分';
    }
    return { title: title, path: '/pages/tools/drawguess/index' };
  }
});
