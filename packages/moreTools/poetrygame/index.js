/**
 * 诗词飞花令 - 浏览与挑战模式
 * 诗词数据由云函数 getLingqianData 返回（POEMS_DATA 字段）
 */

// ==================== 诗词数据库 ====================
var poems = []; // 由云函数动态填充

// 通过云函数获取诗词数据（复用 getLingqianData 云函数，同签文数据一并返回）
function fetchPoemsData() {
  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'getLingqianData',
      success: function (res) {
        poems = (res.result && res.result.POEMS_DATA) || [];
        resolve(poems);
      },
      fail: function (err) {
        console.error('调用云函数获取诗词数据失败:', err);
        reject(err);
      }
    });
  });
}

// ==================== 飞花令字符集 ====================
var feihualing = ['月', '花', '风', '雨', '雪', '春', '秋', '山', '水', '云', '日', '夜', '人', '天', '酒', '梦', '心', '情', '红', '白'];

// ==================== 工具函数 ====================

/**
 * 将诗句文本按目标字拆分为段落
 * 返回 [{type:'normal',text:'xxx'}, {type:'hl',text:'月'}, ...]
 */
function splitLine(line, char) {
  var parts = [];
  var i = 0;
  var len = line.length;
  var buf = '';
  while (i < len) {
    if (line[i] === char) {
      if (buf) {
        parts.push({ type: 'normal', text: buf, partIdx: parts.length });
        buf = '';
      }
      parts.push({ type: 'hl', text: char, partIdx: parts.length });
    } else {
      buf += line[i];
    }
    i++;
  }
  if (buf) {
    parts.push({ type: 'normal', text: buf, partIdx: parts.length });
  }
  return parts;
}

/**
 * 查找诗词中包含指定字的所有诗句行，并做高亮拆分
 */
function findMatchingLines(poem, char) {
  var result = [];
  var i = 0;
  for (i = 0; i < poem.lines.length; i++) {
    if (poem.lines[i].indexOf(char) !== -1) {
      result.push({
        lineIdx: i,
        parts: splitLine(poem.lines[i], char)
      });
    }
  }
  return result;
}

/**
 * 筛选包含指定字的诗词列表
 */
function filterPoems(char) {
  var result = [];
  var i = 0;
  for (i = 0; i < poems.length; i++) {
    var matchingLines = findMatchingLines(poems[i], char);
    if (matchingLines.length > 0) {
      result.push({
        idx: i,
        title: poems[i].title,
        author: poems[i].author,
        dynasty: poems[i].dynasty,
        matchingLines: matchingLines
      });
    }
  }
  return result;
}

// ==================== 页面逻辑 ====================
Page({
  data: {
    // 基础数据
    characters: feihualing,
    // 浏览模式
    mode: 'browse',
    selectedChar: '',
    matchingPoems: [],
    // 挑战模式
    gameActive: false,
    gameOver: false,
    gameChar: '',
    timer: 30,
    score: 0,
    round: 1,
    totalRounds: 10,
    hintCount: 0,
    revealedHints: [],
    // 内部数据：当前挑战字对应的所有匹配诗词
    _gameMatches: [],
    _hintIndex: 0,
    // 诗词数据加载状态
    poemsLoading: true
  },

  _timerId: null,

  onLoad: function () {
    var that = this;
    // 先从云函数拉取诗词数据，加载完成后再做默认选字
    fetchPoemsData().then(function () {
      that.setData({ poemsLoading: false });
      // 默认选择第一个字
      that.onCharSelect({ currentTarget: { dataset: { char: '月' } } });
    }).catch(function () {
      that.setData({ poemsLoading: false });
      wx.showToast({ title: '诗词数据加载失败', icon: 'none' });
    });
  },

  onUnload: function () {
    this.clearTimer();
  },

  // ==================== 模式切换 ====================
  switchToBrowse: function () {
    this.clearTimer();
    this.setData({ mode: 'browse', gameActive: false, gameOver: false });
  },

  switchToGame: function () {
    this.setData({ mode: 'game', gameActive: false, gameOver: false });
  },

  // ==================== 字符选择 ====================
  onCharSelect: function (e) {
    var char = e.currentTarget.dataset.char;
    var matching = filterPoems(char);
    this.setData({
      selectedChar: char,
      matchingPoems: matching
    });
  },

  onRandomChar: function () {
    var idx = Math.floor(Math.random() * feihualing.length);
    var char = feihualing[idx];
    var matching = filterPoems(char);
    this.setData({
      selectedChar: char,
      matchingPoems: matching
    });
  },

  // ==================== 挑战模式 ====================
  startGame: function () {
    this.clearTimer();
    var charIdx = Math.floor(Math.random() * feihualing.length);
    var char = feihualing[charIdx];
    var matches = filterPoems(char);

    this.setData({
      gameActive: true,
      gameOver: false,
      gameChar: char,
      timer: 30,
      score: 0,
      round: 1,
      totalRounds: 10,
      hintCount: 0,
      revealedHints: [],
      _gameMatches: matches,
      _hintIndex: 0
    });

    this.startTimer();
  },

  startTimer: function () {
    var that = this;
    this.clearTimer();
    this._timerId = setInterval(function () {
      var t = that.data.timer - 1;
      if (t <= 0) {
        that.clearTimer();
        that.setData({ timer: 0 });
        // 超时自动进入下一轮
        that.nextRound();
      } else {
        that.setData({ timer: t });
      }
    }, 1000);
  },

  clearTimer: function () {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  },

  giveHint: function () {
    var matches = this.data._gameMatches;
    var hintIdx = this.data._hintIndex;
    var revealed = this.data.revealedHints;

    if (hintIdx >= matches.length) {
      wx.showToast({ title: '没有更多提示了', icon: 'none' });
      return;
    }

    // 取该诗词的所有匹配行
    var poem = matches[hintIdx];
    var i = 0;
    var newRevealed = revealed.slice();
    for (i = 0; i < poem.matchingLines.length; i++) {
      newRevealed.push({
        parts: poem.matchingLines[i].parts,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        idx: newRevealed.length
      });
    }

    this.setData({
      hintCount: this.data.hintCount + 1,
      revealedHints: newRevealed,
      _hintIndex: hintIdx + 1
    });
  },

  nextRound: function () {
    this.clearTimer();
    var curRound = this.data.round;
    var total = this.data.totalRounds;

    // 本轮得分：基础10分，每个提示扣2分
    var roundScore = 10 - this.data.revealedHints.length * 2;
    if (roundScore < 1) roundScore = 1;
    var newScore = this.data.score + roundScore;

    if (curRound >= total) {
      // 挑战结束
      this.setData({
        gameActive: false,
        gameOver: true,
        score: newScore
      });
      return;
    }

    // 下一轮：随机选一个新字（尽量不与上一轮重复）
    var newChar = this.pickNewChar(this.data.gameChar);
    var matches = filterPoems(newChar);

    this.setData({
      round: curRound + 1,
      gameChar: newChar,
      timer: 30,
      score: newScore,
      revealedHints: [],
      _gameMatches: matches,
      _hintIndex: 0
    });

    this.startTimer();
  },

  pickNewChar: function (excludeChar) {
    var pool = [];
    var i = 0;
    for (i = 0; i < feihualing.length; i++) {
      if (feihualing[i] !== excludeChar) {
        pool.push(feihualing[i]);
      }
    }
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }
});
