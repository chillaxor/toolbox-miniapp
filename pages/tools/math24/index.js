var storage = require('../../../utils/storage.js');
var math24 = require('../../../utils/math24.js');

Page({
  data: {
    isFavorite: false,
    numbers: [],
    cardFaces: [],
    selectedNums: [],
    selectedOps: [],
    expression: '',
    hint: '',
    showHint: false,
    timer: 0,
    timerRunning: false,
    bestTime: null,
    solvedCount: 0,
    isAnimating: false
  },

  _timerInterval: null,

  onLoad: function () {
    this.checkFavorite();
    var best = wx.getStorageSync('toolbox_math24_best');
    var solved = wx.getStorageSync('toolbox_math24_solved') || 0;
    this.setData({ bestTime: best || null, solvedCount: solved });
    this.newPuzzle();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('math24') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('math24');
    this.setData({ isFavorite: fav });
  },

  newPuzzle: function () {
    var nums = math24.generateNumbers();
    var faces = [];
    for (var i = 0; i < nums.length; i++) {
      faces.push(math24.toCardFace(nums[i]));
    }
    this.setData({
      numbers: nums,
      cardFaces: faces,
      selectedNums: [],
      selectedOps: [],
      expression: '',
      hint: '',
      showHint: false,
      isAnimating: false
    });
    this.startTimer();
  },

  startTimer: function () {
    var self = this;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this.setData({ timer: 0, timerRunning: true });
    this._timerInterval = setInterval(function () {
      if (self.data.timerRunning) {
        self.setData({ timer: self.data.timer + 1 });
      }
    }, 1000);
  },

  stopTimer: function () {
    this.setData({ timerRunning: false });
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  onNumberTap: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var nums = this.data.selectedNums.slice();
    if (nums.indexOf(idx) !== -1) {
      // 取消选择
      nums = nums.filter(function (i) { return i !== idx; });
    } else {
      if (nums.length >= 2) return; // 最多选2个数
      nums.push(idx);
    }
    this.setData({ selectedNums: nums });
    this.updateExpression(nums, this.data.selectedOps);
  },

  onOpTap: function (e) {
    var op = e.currentTarget.dataset.op;
    var ops = this.data.selectedOps.slice();
    if (ops.length >= 3) return;
    ops.push(op);
    this.setData({ selectedOps: ops });
    this.updateExpression(this.data.selectedNums, ops);
  },

  updateExpression: function (nums, ops) {
    var expr = '';
    var numFaces = [];
    for (var i = 0; i < nums.length; i++) {
      numFaces.push(this.data.numbers[nums[i]]);
    }
    // 简单拼接表达式
    if (numFaces.length === 2 && ops.length === 1) {
      expr = numFaces[0] + ' ' + ops[0] + ' ' + numFaces[1];
    } else if (numFaces.length === 2 && ops.length >= 2) {
      expr = numFaces[0] + ' ' + ops[0] + ' ' + numFaces[1] + ' ' + ops[1] + ' ...';
    }
    this.setData({ expression: expr });
  },

  onClearExpr: function () {
    this.setData({ selectedNums: [], selectedOps: [], expression: '' });
  },

  onHint: function () {
    var solution = math24.solve24(this.data.numbers);
    if (solution) {
      this.setData({ hint: solution, showHint: true });
    } else {
      this.setData({ hint: '此题暂无解，换一题吧', showHint: true });
    }
    this.stopTimer();
  },

  onCloseHint: function () {
    this.setData({ showHint: false });
  },

  onNewPuzzle: function () {
    this.newPuzzle();
  },

  formatTime: function (seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m > 0 ? m + ':' : '') + (s < 10 && m > 0 ? '0' : '') + s + 's';
  },

  onShareAppMessage: function () {
    return {
      title: '数学训练 - 24点挑战',
      path: '/pages/tools/math24/index'
    };
  }
});