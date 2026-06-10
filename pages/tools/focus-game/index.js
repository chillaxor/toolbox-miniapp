// 专注力游戏 - 舒尔特方格 / 找不同 / 颜色干扰 / 记忆翻牌
var utils = require('../../../utils/storage.js');

// emoji配对组（找不同用）
var EMOJI_GROUPS = [
  ['🍎','🍎','🍎','🍎','🍎','🍎','🍎','🍎','🍏'],
  ['🐱','🐱','🐱','🐱','🐱','🐱','🐱','🐱','🐶'],
  ['⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','🌟'],
  ['🎈','🎈','🎈','🎈','🎈','🎈','🎈','🎈','🎀'],
  ['🌻','🌻','🌻','🌻','🌻','🌻','🌻','🌻','🌼'],
  ['🐟','🐟','🐟','🐟','🐟','🐟','🐟','🐟','🐠'],
  ['🔴','🔴','🔴','🔴','🔴','🔴','🔴','🔴','🟠'],
  ['🔵','🔵','🔵','🔵','🔵','🔵','🔵','🔵','🟣'],
  ['🐻','🐻','🐻','🐻','🐻','🐻','🐻','🐻','🐨'],
  ['🍰','🍰','🍰','🍰','🍰','🍰','🍰','🍰','🧁'],
  ['🧊','🧊','🧊','🧊','🧊','🧊','🧊','🧊','💎'],
  ['🎸','🎸','🎸','🎸','🎸','🎸','🎸','🎸','🎵']
];

// 记忆翻牌用emoji池
var MEMORY_EMOJIS = ['🍎','🍊','🍇','🍓','🍋','🍑','🥝','🍒','🫐','🍌','🍉','🍐'];

// 颜色干扰数据
var STROOP_COLORS = [
  { name: '红色', hex: '#E53935' },
  { name: '蓝色', hex: '#1E88E5' },
  { name: '绿色', hex: '#43A047' },
  { name: '黄色', hex: '#FDD835' }
];

Page({
  data: {
    modes: [
      { id: 'schulte', icon: '🔢', name: '舒尔特方格' },
      { id: 'spotdiff', icon: '👁️', name: '找不同' },
      { id: 'stroop', icon: '🎨', name: '颜色干扰' },
      { id: 'memory', icon: '🃏', name: '记忆翻牌' }
    ],
    currentMode: 'schulte',

    // 舒尔特方格
    schulteSize: 3,
    schulteGrid: [],
    schulteNext: 1,
    schulteTime: '0.0s',
    schulteStarted: false,

    // 找不同
    spotItems: [],
    spotRound: 1,
    spotTotal: 10,
    spotScore: 0,
    spotAnswer: -1,
    spotWaiting: false,

    // 颜色干扰
    stroopText: '',
    stroopColor: '',
    stroopOptions: [],
    stroopRound: 1,
    stroopTotal: 10,
    stroopScore: 0,
    stroopAnswer: -1,

    // 记忆翻牌
    memoryCards: [],
    memoryTotal: 12,
    memoryCols: 4,
    memoryPairs: 6,
    memoryMoves: 0,
    memoryMatched: 0,
    memoryFlipped: [],
    memoryStarted: false,
    memoryLock: false,

    // 结果弹窗
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultDetail: ''
  },

  // ========== 模式切换 ==========
  switchMode: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ currentMode: id, showResult: false });
    if (id === 'schulte' && !this.data.schulteStarted) this.initSchulte();
    if (id === 'spotdiff') this.initSpot();
    if (id === 'stroop') this.initStroop();
    if (id === 'memory' && !this.data.memoryStarted) this.initMemory();
  },

  onLoad: function () {
    this.initSchulte();
  },

  // ==================== 舒尔特方格 ====================
  setSchulteSize: function (e) {
    var s = parseInt(e.currentTarget.dataset.s);
    this.setData({ schulteSize: s });
    this.initSchulte();
  },

  initSchulte: function () {
    var size = this.data.schulteSize;
    var total = size * size;
    var nums = [];
    for (var i = 1; i <= total; i++) nums.push(i);
    // Fisher-Yates shuffle
    for (var j = nums.length - 1; j > 0; j--) {
      var r = Math.floor(Math.random() * (j + 1));
      var tmp = nums[j]; nums[j] = nums[r]; nums[r] = tmp;
    }
    var grid = nums.map(function (n) {
      return { val: n, done: false, wrong: false };
    });
    this._schulteTimer = null;
    this._schulteStart = 0;
    this.setData({
      schulteGrid: grid,
      schulteNext: 1,
      schulteTime: '0.0s',
      schulteStarted: false
    });
  },

  startSchulte: function () {
    this._schulteStart = Date.now();
    this._schulteTimer = setInterval(function () {
      var elapsed = ((Date.now() - this._schulteStart) / 1000).toFixed(1);
      this.setData({ schulteTime: elapsed + 's' });
    }.bind(this), 100);
    this.setData({ schulteStarted: true });
  },

  tapSchulte: function (e) {
    if (!this.data.schulteStarted) return;
    var idx = e.currentTarget.dataset.idx;
    var grid = this.data.schulteGrid.slice();
    var cell = grid[idx];
    if (cell.done) return;

    if (cell.val === this.data.schulteNext) {
      cell.done = true;
      var next = this.data.schulteNext + 1;
      this.setData({ schulteGrid: grid, schulteNext: next });

      // 全部完成
      if (next > this.data.schulteSize * this.data.schulteSize) {
        clearInterval(this._schulteTimer);
        var finalTime = ((Date.now() - this._schulteStart) / 1000).toFixed(1);
        var size = this.data.schulteSize;
        this.setData({
          showResult: true,
          resultEmoji: '🎉',
          resultTitle: '太棒了！',
          resultDetail: size + '×' + size + ' 舒尔特方格\n用时 ' + finalTime + ' 秒！'
        });
      }
    } else {
      // 错误抖动
      cell.wrong = true;
      this.setData({ schulteGrid: grid });
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(function () {
        var g = this.data.schulteGrid.slice();
        g[idx].wrong = false;
        this.setData({ schulteGrid: g });
      }.bind(this), 400);
    }
  },

  // ==================== 找不同 ====================
  initSpot: function () {
    this.setData({ spotRound: 1, spotScore: 0, spotWaiting: false });
    this.nextSpotRound();
  },

  nextSpotRound: function () {
    var round = this.data.spotRound;
    if (round > this.data.spotTotal) return;

    // 随机选一组emoji
    var gIdx = Math.floor(Math.random() * EMOJI_GROUPS.length);
    var group = EMOJI_GROUPS[gIdx].slice();
    // 确定不同的那个位置
    var diffIdx = Math.floor(Math.random() * 9);
    var diffEmoji = group[8]; // 最后一个是不同的
    var normalEmoji = group[0];

    var items = [];
    for (var i = 0; i < 9; i++) {
      items.push({
        emoji: i === diffIdx ? diffEmoji : normalEmoji,
        clicked: false,
        correct: false,
        wrong: false,
        isDiff: i === diffIdx
      });
    }
    this.setData({ spotItems: items, spotAnswer: diffIdx, spotWaiting: false });
  },

  tapSpot: function (e) {
    if (this.data.spotWaiting) return;
    var idx = e.currentTarget.dataset.idx;
    var items = this.data.spotItems.slice();

    if (items[idx].isDiff) {
      // 正确
      items[idx].correct = true;
      items[idx].clicked = true;
      this.setData({
        spotItems: items,
        spotScore: this.data.spotScore + 1,
        spotWaiting: true
      });
    } else {
      // 错误
      items[idx].wrong = true;
      items[idx].clicked = true;
      // 同时显示正确答案
      items[this.data.spotAnswer].correct = true;
      this.setData({ spotItems: items, spotWaiting: true });
      wx.vibrateShort({ type: 'heavy' });
    }

    var that = this;
    setTimeout(function () {
      var rd = that.data.spotRound + 1;
      that.setData({ spotRound: rd });
      if (rd > that.data.spotTotal) {
        that.setData({
          showResult: true,
          resultEmoji: that.data.spotScore >= 8 ? '🏆' : that.data.spotScore >= 5 ? '👍' : '💪',
          resultTitle: '找不同结束！',
          resultDetail: '10题答对 ' + that.data.spotScore + ' 题\n正确率 ' + (that.data.spotScore * 10) + '%'
        });
      } else {
        that.nextSpotRound();
      }
    }, 600);
  },

  startSpot: function () {
    this.initSpot();
  },

  // ==================== 颜色干扰（Stroop） ====================
  initStroop: function () {
    this.setData({ stroopRound: 1, stroopScore: 0 });
    this.nextStroopRound();
  },

  nextStroopRound: function () {
    var round = this.data.stroopRound;
    if (round > this.data.stroopTotal) return;

    // 随机选文字颜色
    var textIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    var colorIdx;
    do {
      colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    } while (colorIdx === textIdx);

    // 生成2个选项（包含正确答案+1个干扰）
    var correctIdx = Math.floor(Math.random() * 2);
    var wrongIdx;
    do {
      wrongIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    } while (wrongIdx === colorIdx);

    var options = [];
    for (var i = 0; i < 2; i++) {
      if (i === correctIdx) {
        options.push({ name: STROOP_COLORS[colorIdx].name, color: STROOP_COLORS[colorIdx].hex, isCorrect: true });
      } else {
        options.push({ name: STROOP_COLORS[wrongIdx].name, color: STROOP_COLORS[wrongIdx].hex, isCorrect: false });
      }
    }

    this.setData({
      stroopText: STROOP_COLORS[textIdx].name,
      stroopColor: STROOP_COLORS[colorIdx].hex,
      stroopOptions: options,
      stroopAnswer: correctIdx
    });
  },

  tapStroop: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var options = this.data.stroopOptions;
    var score = this.data.stroopScore;
    if (options[idx].isCorrect) {
      score++;
      this.setData({ stroopScore: score });
    } else {
      wx.vibrateShort({ type: 'heavy' });
    }

    var rd = this.data.stroopRound + 1;
    this.setData({ stroopRound: rd });

    var that = this;
    if (rd > this.data.stroopTotal) {
      setTimeout(function () {
        that.setData({
          showResult: true,
          resultEmoji: score >= 8 ? '🧠' : score >= 5 ? '👍' : '💪',
          resultTitle: '颜色干扰结束！',
          resultDetail: '10题答对 ' + score + ' 题\n专注力等级：' + (score >= 9 ? 'S' : score >= 7 ? 'A' : score >= 5 ? 'B' : 'C')
        });
      }, 300);
    } else {
      this.nextStroopRound();
    }
  },

  // ==================== 记忆翻牌 ====================
  setMemorySize: function (e) {
    var total = parseInt(e.currentTarget.dataset.total);
    var cols = total === 12 ? 4 : 4;
    this.setData({ memoryTotal: total, memoryCols: cols, memoryPairs: total / 2 });
    this.initMemory();
  },

  initMemory: function () {
    var total = this.data.memoryTotal;
    var pairs = total / 2;
    // 选emoji
    var pool = MEMORY_EMOJIS.slice(0, pairs);
    var cards = pool.concat(pool).map(function (em) {
      return { emoji: em, flipped: false, matched: false };
    });
    // shuffle
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
    }
    this.setData({
      memoryCards: cards,
      memoryMoves: 0,
      memoryMatched: 0,
      memoryFlipped: [],
      memoryStarted: false,
      memoryLock: false
    });
  },

  startMemory: function () {
    this.setData({ memoryStarted: true });
  },

  tapMemory: function (e) {
    if (!this.data.memoryStarted) return;
    if (this.data.memoryLock) return;

    var idx = e.currentTarget.dataset.idx;
    var cards = this.data.memoryCards.slice();
    var card = cards[idx];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    var flipped = this.data.memoryFlipped.concat([idx]);

    var updateData = { memoryCards: cards, memoryFlipped: flipped };

    if (flipped.length === 2) {
      updateData.memoryMoves = this.data.memoryMoves + 1;
      var first = cards[flipped[0]];
      var second = cards[flipped[1]];

      if (first.emoji === second.emoji) {
        // 匹配成功
        first.matched = true;
        second.matched = true;
        var matched = this.data.memoryMatched + 1;
        updateData.memoryMatched = matched;
        updateData.memoryFlipped = [];
        this.setData(updateData);

        // 全部完成
        if (matched >= this.data.memoryPairs) {
          var that = this;
          setTimeout(function () {
            that.setData({
              showResult: true,
              resultEmoji: '🎉',
              resultTitle: '全部配对！',
              resultDetail: '共翻了 ' + that.data.memoryMoves + ' 次\n配对 ' + that.data.memoryPairs + ' 组'
            });
          }, 400);
        }
      } else {
        // 不匹配，翻回去
        this.setData(updateData);
        this.setData({ memoryLock: true });
        var that = this;
        wx.vibrateShort({ type: 'heavy' });
        setTimeout(function () {
          var c = that.data.memoryCards.slice();
          c[flipped[0]].flipped = false;
          c[flipped[1]].flipped = false;
          that.setData({ memoryCards: c, memoryFlipped: [], memoryLock: false });
        }, 800);
      }
    } else {
      this.setData(updateData);
    }
  },

  // ========== 结果弹窗 ==========
  closeResult: function () {
    this.setData({ showResult: false });
  },

  playAgain: function () {
    this.setData({ showResult: false });
    var mode = this.data.currentMode;
    if (mode === 'schulte') this.initSchulte();
    if (mode === 'spotdiff') this.initSpot();
    if (mode === 'stroop') this.initStroop();
    if (mode === 'memory') this.initMemory();
  },

  onUnload: function () {
    if (this._schulteTimer) clearInterval(this._schulteTimer);
  }
});
