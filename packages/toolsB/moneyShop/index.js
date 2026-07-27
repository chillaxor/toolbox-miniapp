const storage = require('../../../utils/storage.js');

// 商品目录（价格全部以「分」存储，避免浮点误差）
// 特意让约一半商品带「分」（末位非 0），这样练习里会出现元角分的完整换算
var ITEMS = [
  { emoji: '🍎', name: '苹果', cents: 205 },   // 2元5分
  { emoji: '🍌', name: '香蕉', cents: 150 },   // 1元5角
  { emoji: '🍊', name: '橘子', cents: 188 },   // 1元8角8分
  { emoji: '🍇', name: '葡萄', cents: 300 },   // 3元
  { emoji: '🍓', name: '草莓', cents: 358 },   // 3元5角8分
  { emoji: '🥛', name: '牛奶', cents: 350 },   // 3元5角
  { emoji: '🧃', name: '果汁', cents: 255 },   // 2元5角5分
  { emoji: '🍪', name: '饼干', cents: 405 },   // 4元5分
  { emoji: '🍫', name: '巧克力', cents: 333 }, // 3元3角3分
  { emoji: '🍬', name: '糖果', cents: 55 },    // 5角5分
  { emoji: '🍭', name: '棒棒糖', cents: 128 }, // 1元2角8分
  { emoji: '🍞', name: '面包', cents: 500 },   // 5元
  { emoji: '✏️', name: '铅笔', cents: 105 },   // 1元5分
  { emoji: '📒', name: '本子', cents: 250 },   // 2元5角
  { emoji: '🖍️', name: '蜡笔', cents: 408 },   // 4元8分
  { emoji: '📏', name: '尺子', cents: 199 },   // 1元9角9分
  { emoji: '🧸', name: '玩具熊', cents: 800 }, // 8元
  { emoji: '🚗', name: '小汽车', cents: 1200 },// 12元
  { emoji: '⚽', name: '皮球', cents: 666 },   // 6元6角6分
  { emoji: '🎈', name: '气球', cents: 150 }    // 1元5角
];

// 顾客（卡通角色）
var CUSTOMERS = [
  { emoji: '🐰', name: '小兔' },
  { emoji: '🐱', name: '小猫' },
  { emoji: '🐶', name: '小狗' },
  { emoji: '🐻', name: '小熊' },
  { emoji: '🐯', name: '小虎' },
  { emoji: '🐼', name: '熊猫' },
  { emoji: '🦁', name: '小狮' }
];

// 纸币面额（分）：5元 / 10元 / 20元 / 50元 / 100元
// 包含 100 元是为了覆盖「多件高价商品」组合，保证总能找出一张比总价大的纸币
var BILLS = [500, 1000, 2000, 5000, 10000];

var TOTAL_OPTIONS = [5, 8, 10, 15]; // 每局可选题数
var DEFAULT_TOTAL = 8;

// 介绍页「今日特价」迷你货架预览（纯展示，复用营业页商品卡样式）
// 故意放进带「分」的样例（苹果 2元5分、本子 2元5角5分、糖果 5角5分），让进门就看到「分」
var PREVIEW_GOODS = [
  { emoji: '🍎', name: '苹果', priceText: '2元5分', priceNum: '2.05' },
  { emoji: '🍌', name: '香蕉', priceText: '1元5角', priceNum: '1.50' },
  { emoji: '📒', name: '本子', priceText: '2元5角5分', priceNum: '2.55' },
  { emoji: '🍬', name: '糖果', priceText: '5角5分', priceNum: '0.55' },
  { emoji: '🧸', name: '玩具熊', priceText: '8元', priceNum: '8.00' },
  { emoji: '🚗', name: '小汽车', priceText: '12元', priceNum: '12.00' }
];

// 分 -> "X元Y角Z分" 人类可读
function formatMoney(c) {
  var yuan = Math.floor(c / 100);
  var jiao = Math.floor((c % 100) / 10);
  var fen = c % 10;
  if (yuan > 0 && jiao > 0 && fen > 0) return yuan + '元' + jiao + '角' + fen + '分';
  if (yuan > 0 && jiao > 0 && fen === 0) return yuan + '元' + jiao + '角';
  if (yuan > 0 && jiao === 0 && fen > 0) return yuan + '元' + fen + '分';
  if (yuan > 0 && jiao === 0 && fen === 0) return yuan + '元';
  if (yuan === 0 && jiao > 0 && fen > 0) return jiao + '角' + fen + '分';
  if (yuan === 0 && jiao > 0 && fen === 0) return jiao + '角';
  if (yuan === 0 && jiao === 0 && fen > 0) return fen + '分';
  return '0元';
}

function fmtDate(ts) {
  var d = new Date(ts);
  var p = function (x) { return x < 10 ? '0' + x : '' + x; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// 生成 4 个选项：正确答案 + 3 个干扰项，返回 { options:[{text,cls}], correctIndex }
// 注意：每个选项预置 cls 字段，WXML 直接 class="{{item.cls}}"，避免长三元表达式编译风险
function genOptions(answer) {
  var opts = [answer];
  var deltas = [1, 5, 10, 50, 100, 150, 200]; // 1分 5分 1角 5角 1元 1.5元 2元
  var guard = 0;
  while (opts.length < 4 && guard < 300) {
    guard++;
    var d = deltas[Math.floor(Math.random() * deltas.length)];
    var sign = Math.random() < 0.5 ? 1 : -1;
    var v = answer + sign * d;
    if (v <= 0) continue;
    if (opts.indexOf(v) !== -1) continue;
    opts.push(v);
  }
  var extra = 1;
  while (opts.length < 4) {
    var v2 = answer + extra * 10;
    if (v2 > 0 && opts.indexOf(v2) === -1) opts.push(v2);
    extra++;
  }
  shuffle(opts);
  return {
    options: opts.map(function (c) { return { text: formatMoney(c), cls: 'opt' }; }),
    correctIndex: opts.indexOf(answer)
  };
}

Page({
  data: {
    state: 'intro',
    totalOptions: TOTAL_OPTIONS,
    total: DEFAULT_TOTAL,
    previewGoods: PREVIEW_GOODS,
    index: 0,
    score: 0,
    progress: 0,
    scene: '',
    items: [],
    showPaid: false,
    paidText: '',
    questionText: '',
    options: [],
    selectedIndex: -1,
    answered: false,
    isCorrect: false,
    correctIndex: -1,
    answerCents: 0,
    isLast: false,
    feedbackText: '',
    autoHint: '',
    stars: 0,
    starList: [1, 2, 3],
    historyList: []
  },

  onLoad: function () {
    
    var app = getApp();
    var flags = (app.globalData && app.globalData.featureFlags) || {};
    var stored = {};
    try { stored = wx.getStorageSync('feature_flags') || {}; } catch (e) {}
    var f = (flags && Object.keys(flags).length) ? flags : stored;
    if (f.moneyShop !== true) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    var hist = storage.getSync('moneyShop_history', []);
    this.setData({ historyList: hist });
  },

  onUnload: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  },

  // 选择每局题数（dataset 里是字符串，必须转 Number，否则后续比较/高亮失效）
  onSelectCount: function (e) {
    var c = e.currentTarget.dataset.count;
    this.setData({ total: Number(c) });
  },

  startGame: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.setData({
      state: 'shop',
      index: 0,
      score: 0,
      progress: 0,
      selectedIndex: -1,
      answered: false,
      isLast: false,
      feedbackText: '',
      autoHint: ''
    });
    this._genRound();
  },

  _genRound: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var total = this.data.total;
    // 随机选 1-3 件不重复商品
    var pool = ITEMS.slice();
    shuffle(pool);
    var n = randInt(1, 3);
    var chosen = pool.slice(0, n);
    var items = [];
    var totalCents = 0;
    for (var i = 0; i < chosen.length; i++) {
      var it = chosen[i];
      var qty = randInt(1, 3);
      totalCents += it.cents * qty;
      items.push({
        emoji: it.emoji,
        name: it.name,
        qty: qty,
        priceText: formatMoney(it.cents),
        priceNum: (it.cents / 100).toFixed(2),
        line: (qty > 1 ? (qty + '个 × ') : '1个 × ') + formatMoney(it.cents)
      });
    }
    var cust = pick(CUSTOMERS);
    var scene = cust.emoji + ' ' + cust.name + ' 来买东西啦！';

    // 随机题型：算总价 / 算找零
    var type = Math.random() < 0.5 ? 'total' : 'change';
    var answer, showPaid = false, paidText = '', questionText;
    if (type === 'total') {
      answer = totalCents;
      questionText = '这些商品一共要付多少钱？';
    } else {
      var candidates = BILLS.filter(function (b) { return b > totalCents; });
      var paid = candidates.length ? pick(candidates) : 10000;
      answer = paid - totalCents;
      showPaid = true;
      paidText = formatMoney(paid);
      questionText = '顾客给了你 ' + paidText + '，应该找回多少钱？';
    }

    var gen = genOptions(answer);
    var idx = this.data.index;
    this.setData({
      scene: scene,
      items: items,
      showPaid: showPaid,
      paidText: paidText,
      questionText: questionText,
      options: gen.options,
      correctIndex: gen.correctIndex,
      answerCents: answer,
      selectedIndex: -1,
      answered: false,
      isCorrect: false,
      feedbackText: '',
      autoHint: '',
      isLast: idx === total - 1,
      progress: Math.round(idx / total * 100)
    });
  },

  onSelect: function (e) {
    if (this.data.answered) return;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var idx = e.currentTarget.dataset.index;
    var correctIndex = this.data.correctIndex;
    var correct = idx === correctIndex;
    var score = this.data.score + (correct ? 1 : 0);
    var fb = correct
      ? pick(['真棒！算对啦 🎉', '太厉害了，小店主！', '完全正确 👍'])
      : '正确答案是 ' + formatMoney(this.data.answerCents) + '，再接再厉哦～';
    var isLast = this.data.isLast;
    // 预计算每项的 class，避免 WXML 长三元表达式（老编译器易白屏）
    var opts = this.data.options.map(function (o, i) {
      var cls = 'opt';
      if (i === correctIndex) cls = 'opt opt-correct';
      else if (i === idx) cls = 'opt opt-wrong';
      return { text: o.text, cls: cls };
    });
    this.setData({
      options: opts,
      selectedIndex: idx,
      answered: true,
      isCorrect: correct,
      score: score,
      feedbackText: fb,
      autoHint: isLast ? '即将看成绩…' : '即将进入下一单…'
    });
    // 答完自动进下一题（也保留按钮可即时跳过）
    var self = this;
    this._timer = setTimeout(function () {
      self._timer = null;
      self.next();
    }, 1100);
  },

  next: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (!this.data.answered) return;
    if (this.data.isLast) {
      this._finish();
    } else {
      var ni = this.data.index + 1;
      this.setData({ index: ni });
      this._genRound();
    }
  },

  _finish: function () {
    var total = this.data.total;
    var score = this.data.score;
    var stars = score >= total - 1 ? 3 : (score >= Math.ceil(total / 2) ? 2 : 1);
    var rec = { score: score, total: total, ts: Date.now(), dt: fmtDate(Date.now()) };
    var hist = storage.getSync('moneyShop_history', []);
    hist.unshift(rec);
    if (hist.length > 10) hist = hist.slice(0, 10);
    storage.setSync('moneyShop_history', hist);
    storage.addHistory({
      toolId: 'moneyShop',
      toolName: '我是小店主',
      category: 'study',
      summary: '得分 ' + score + '/' + total,
      timestamp: Date.now()
    });
    this.setData({ state: 'result', stars: stars, historyList: hist });
  },

  restart: function () {
    this.startGame();
  },

  goIntro: function () {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.setData({ state: 'intro', selectedIndex: -1, answered: false, feedbackText: '', autoHint: '' });
    var hist = storage.getSync('moneyShop_history', []);
    this.setData({ historyList: hist });
  },

  onShareAppMessage: function () {
    return { title: '我是小店主：练算钱找零', path: '/packages/toolsB/moneyShop/index' };
  }
});
