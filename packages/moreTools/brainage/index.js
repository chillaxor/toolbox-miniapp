var storage = require('../../../utils/storage.js');

// 生成随机整数 [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 逻辑推理题库
var LOGIC_QUESTIONS = [
  { q: '所有的猫都会飞，小明是猫，所以小明会飞。这个推理对吗？', options: ['对', '错', '不确定', '前提就有问题'], answer: '前提就有问题' },
  { q: '如果下雨就带伞，今天没带伞，说明今天没下雨。这个推理对吗？', options: ['对', '错', '不一定', '无法判断'], answer: '不一定' },
  { q: '1, 1, 2, 3, 5, 8, 下一个数是？', options: ['11', '12', '13', '15'], answer: '13' },
  { q: '甲比乙高，乙比丙高，丁比甲高。谁最矮？', options: ['甲', '乙', '丙', '丁'], answer: '丙' },
  { q: '时钟3点整敲3下用6秒，6点整敲6下用多少秒？', options: ['12秒', '15秒', '18秒', '10秒'], answer: '15秒' },
  { q: '一个房间有3盏灯，门外有3个开关。只能进房间一次，怎么确定每个开关对应哪盏灯？', options: ['不可能做到', '先开一个等一会儿再关', '同时开两个', '随机试'], answer: '先开一个等一会儿再关' },
  { q: '2, 6, 12, 20, 30, 下一个数是？', options: ['40', '42', '44', '36'], answer: '42' },
  { q: '小明说："我说的这句话是假的。"这句话是真还是假？', options: ['真', '假', '既是真又是假', '既不真也不假'], answer: '既不真也不假' }
];

Page({
  data: {
    state: 'idle', // idle, math, memory, reaction, logic, result
    score: 0,
    bestScore: 0,
    streak: 0,
    round: 0,
    totalRounds: 3,
    selectedAnswer: '',
    // math
    mathQuestion: '',
    mathOptions: [],
    mathAnswer: 0,
    timerPct: 100,
    // memory
    memoryGrid: [],
    memoryPhase: 'show', // show, input
    memorySequence: [],
    memoryInputIdx: 0,
    // reaction
    reactionReady: false,
    reactionGo: false,
    reactionMs: 0,
    _reactionTimer: null,
    _reactionStart: 0,
    // logic
    logicQuestion: '',
    logicOptions: [],
    logicAnswer: '',
    // rank
    rank: ''
  },

  _timerInterval: null,

  onLoad: function () {
    var best = wx.getStorageSync('brainage_best') || 0;
    this.setData({ bestScore: best });
  },

  onUnload: function () {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this.data._reactionTimer) clearTimeout(this.data._reactionTimer);
  },

  startGame: function () {
    this.setData({ score: 0, streak: 0, round: 0 });
    this._nextRound();
  },

  _nextRound: function () {
    var round = this.data.round + 1;
    if (round > this.data.totalRounds) {
      this._showResult();
      return;
    }
    this.setData({ round: round, selectedAnswer: '' });
    // 每轮随机一个关卡类型
    var types = ['math', 'memory', 'logic'];
    var type = types[randInt(0, types.length - 1)];
    if (type === 'math') this._startMath();
    else if (type === 'memory') this._startMemory();
    else this._startLogic();
  },

  // === 计算关卡 ===
  _startMath: function () {
    var a = randInt(1, 50);
    var b = randInt(1, 50);
    var ops = ['+', '-', '×'];
    var opIdx = randInt(0, 2);
    var op = ops[opIdx];
    var answer;
    if (opIdx === 0) answer = a + b;
    else if (opIdx === 1) { if (a < b) { var t = a; a = b; b = t; } answer = a - b; }
    else answer = a * b;

    var options = [answer];
    while (options.length < 4) {
      var fake = answer + randInt(-10, 10);
      if (fake !== answer && fake >= 0 && options.indexOf(fake) === -1) {
        options.push(fake);
      }
    }
    // 打乱
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }

    this.setData({
      state: 'math',
      mathQuestion: a + ' ' + op + ' ' + b + ' = ?',
      mathOptions: options,
      mathAnswer: answer,
      timerPct: 100,
      selectedAnswer: ''
    });
    this._startTimer(10);
  },

  answerMath: function (e) {
    if (this.data.selectedAnswer !== '') return;
    var val = e.currentTarget.dataset.val;
    this.setData({ selectedAnswer: val });
    clearInterval(this._timerInterval);
    var correct = val === this.data.mathAnswer;
    this._handleAnswer(correct);
  },

  _startTimer: function (seconds) {
    var self = this;
    var pct = 100;
    var step = 100 / (seconds * 10);
    this._timerInterval = setInterval(function () {
      pct -= step;
      if (pct <= 0) {
        pct = 0;
        clearInterval(self._timerInterval);
        self._handleAnswer(false);
      }
      self.setData({ timerPct: Math.max(0, pct) });
    }, 100);
  },

  // === 记忆关卡 ===
  _startMemory: function () {
    var seqLen = 3 + randInt(0, 3); // 3~5个
    var grid = [];
    for (var i = 0; i < 16; i++) grid.push({ highlight: false, clicked: false });
    var seq = [];
    while (seq.length < seqLen) {
      var idx = randInt(0, 15);
      if (seq.indexOf(idx) === -1) seq.push(idx);
    }

    this.setData({
      state: 'memory',
      memoryPhase: 'show',
      memoryGrid: grid,
      memorySequence: seq,
      memoryInputIdx: 0
    });

    // 依次高亮
    var self = this;
    var showIdx = 0;
    function showNext() {
      if (showIdx >= seq.length) {
        // 展示完毕，进入输入阶段
        setTimeout(function () {
          var g = self.data.memoryGrid.slice();
          for (var i = 0; i < g.length; i++) g[i].highlight = false;
          self.setData({ memoryGrid: g, memoryPhase: 'input' });
        }, 500);
        return;
      }
      var g = self.data.memoryGrid.slice();
      for (var i = 0; i < g.length; i++) g[i].highlight = false;
      g[seq[showIdx]].highlight = true;
      self.setData({ memoryGrid: g });
      showIdx++;
      setTimeout(showNext, 600);
    }
    setTimeout(showNext, 500);
  },

  clickMemoryCell: function (e) {
    if (this.data.memoryPhase !== 'input') return;
    var idx = e.currentTarget.dataset.idx;
    var seq = this.data.memorySequence;
    var inputIdx = this.data.memoryInputIdx;

    if (idx === seq[inputIdx]) {
      // 正确
      var g = this.data.memoryGrid.slice();
      g[idx].clicked = true;
      inputIdx++;
      this.setData({ memoryGrid: g, memoryInputIdx: inputIdx });
      if (inputIdx >= seq.length) {
        this._handleAnswer(true);
      }
    } else {
      // 错误
      this._handleAnswer(false);
    }
  },

  // === 反应关卡 ===
  _startReaction: function () {
    // 反应关卡直接由tapReaction驱动
  },

  tapReaction: function () {
    var self = this;
    if (!this.data.reactionReady && !this.data.reactionGo) {
      // 开始等待
      this.setData({ reactionReady: true, reactionGo: false, reactionMs: 0 });
      var delay = 1500 + Math.floor(Math.random() * 2500);
      var timer = setTimeout(function () {
        self.setData({ reactionReady: false, reactionGo: true, _reactionStart: Date.now() });
      }, delay);
      this.setData({ _reactionTimer: timer });
    } else if (this.data.reactionReady) {
      // 提前点了
      clearTimeout(this.data._reactionTimer);
      this.setData({ reactionReady: false, reactionGo: false });
      wx.showToast({ title: '太早了！', icon: 'none' });
      this._handleAnswer(false);
    } else if (this.data.reactionGo) {
      // 记录反应时间
      var ms = Date.now() - this.data._reactionStart;
      this.setData({ reactionGo: false, reactionMs: ms });
      this._handleAnswer(ms < 500);
    }
  },

  // === 逻辑关卡 ===
  _startLogic: function () {
    var q = LOGIC_QUESTIONS[randInt(0, LOGIC_QUESTIONS.length - 1)];
    var options = q.options.slice();
    // 打乱
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }
    this.setData({
      state: 'logic',
      logicQuestion: q.q,
      logicOptions: options,
      logicAnswer: q.answer,
      selectedAnswer: ''
    });
  },

  answerLogic: function (e) {
    if (this.data.selectedAnswer !== '') return;
    var val = e.currentTarget.dataset.val;
    this.setData({ selectedAnswer: val });
    var correct = val === this.data.logicAnswer;
    this._handleAnswer(correct);
  },

  // === 通用 ===
  _handleAnswer: function (correct) {
    clearInterval(this._timerInterval);
    var score = this.data.score;
    var streak = this.data.streak;
    if (correct) {
      score += 10 + this.data.streak * 2;
      streak++;
    } else {
      streak = 0;
    }
    this.setData({ score: score, streak: streak });

    var self = this;
    setTimeout(function () {
      self._nextRound();
    }, 800);
  },

  _showResult: function () {
    var score = this.data.score;
    var best = this.data.bestScore;
    if (score > best) {
      best = score;
      wx.setStorageSync('brainage_best', best);
    }
    var rank = '🧠 脑力新手';
    if (score >= 80) rank = '🧠 脑力王者';
    else if (score >= 60) rank = '🧠 脑力达人';
    else if (score >= 40) rank = '🧠 脑力进阶';

    this.setData({ state: 'result', score: score, bestScore: best, rank: rank });
    storage.addHistory({
      toolId: 'brainage', toolName: '脑力测试', category: 'fun',
      summary: '脑力指数: ' + score + '分', timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return { title: '脑力测试 - 我的脑力指数是' + this.data.score + '分', path: '/packages/moreTools/brainage/index' };
  }
});