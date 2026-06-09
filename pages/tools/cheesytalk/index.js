var storage = require('../../../utils/storage.js');

var LINES = [
  { line: '你知道你和星星的区别吗？星星点亮了黑夜，而你点亮了我的心。', tag: '甜蜜' },
  { line: '你猜我的心在哪边？左边？不对，在你那边。', tag: '套路' },
  { line: '你是我的今天，以及所有的明天。', tag: '深情' },
  { line: '我想在你那里买一块地。什么地？你的死心塌地。', tag: '套路' },
  { line: '你有打火机吗？没有啊，那你是怎么点燃我的心的？', tag: '套路' },
  { line: '我怀疑你的本质是一本书，不然为什么让我越看越想睡。', tag: '搞笑' },
  { line: '你闻到空气中有什么味道吗？没有？那是我爱你的气息啊。', tag: '甜蜜' },
  { line: '我最近有点忙。忙什么？忙着喜欢你。', tag: '甜蜜' },
  { line: '你知道我最大的缺点是什么吗？是缺点你。', tag: '套路' },
  { line: '我的手被划了一道口子。怎么划的？看到你的时候，我被你的美貌划伤了。', tag: '搞笑' },
  { line: '我想去取一下东西，你等我一下。取什么？娶你。', tag: '套路' },
  { line: '你猜我想喝什么？呵护你。', tag: '甜蜜' },
  { line: '你能帮我洗个东西吗？喜欢我。', tag: '套路' },
  { line: '你知道我和你之间有什么距离吗？什么？一不小心就亲了你的距离。', tag: '搞笑' },
  { line: '你知道你像什么吗？像我的下一杯奶茶，因为我想把你捧在手心。', tag: '甜蜜' },
  { line: '我觉得你这个人不适合谈恋爱。为什么？适合结婚。', tag: '套路' },
  { line: '我给你变个魔术。什么？我变得更喜欢你了。', tag: '甜蜜' },
  { line: '你知道我的心为什么这么暖吗？因为住进了一个你。', tag: '深情' },
  { line: '我生病了。什么病？对你没有抵抗力。', tag: '套路' },
  { line: '你知道我喜欢什么制服吗？被你制服。', tag: '套路' },
  { line: '你今天特别讨厌。讨人喜欢和百看不厌。', tag: '套路' },
  { line: '从认识你那天起我就瘦了。为什么？因为我的眼里只有你，把一切都放下了。', tag: '搞笑' },
  { line: '你的脸上有点东西。什么？有点漂亮。', tag: '套路' },
  { line: '我有超能力。什么？超级喜欢你。', tag: '甜蜜' },
  { line: '你猜我的心在左边还是右边？都不对，在你这边。', tag: '套路' },
  { line: '我见过最美的清晨，是你的嘴角上扬的时候。', tag: '深情' },
  { line: '你是碳酸钙吗？因为我对你产生了化学反应。', tag: '搞笑' },
  { line: '我对你的爱就像拖拉机上山，轰轰烈烈。', tag: '搞笑' },
  { line: '你知道为什么我比你重吗？因为心里多了一个你。', tag: '甜蜜' },
  { line: '如果我丢了你会怎么办？我会去找你，然后把你藏起来。', tag: '深情' },
  { line: '你累不累啊？不累啊。可是你都在我心里跑了一天了。', tag: '套路' },
  { line: '我想变成你的手机，被你天天揣兜里。', tag: '甜蜜' },
  { line: '你知道世界上最甜的地方在哪吗？在你心里。', tag: '甜蜜' },
  { line: '你知道你和仙女的区别吗？仙女在天上，你在我心上。', tag: '套路' },
  { line: '我可以称呼你为您吗？这样我就可以把你放在心上了。', tag: '套路' },
  { line: '我发现你有个缺点。什么缺点？缺点我。', tag: '套路' },
  { line: '你知道我为什么不上天吗？因为地上有你。', tag: '深情' },
  { line: '你是什么血型？你是我的理想型。', tag: '套路' },
  { line: '如果世界和你都掉进水里，我会先救你。因为世界不会哭。', tag: '深情' },
  { line: '你猜我什么星座？为你量身定做。', tag: '套路' },
  { line: '我的眼睛很好看，你知道为什么吗？因为里面都是你。', tag: '深情' },
  { line: '你以后走路能不能看着点啊？非要撞在我心上。', tag: '套路' },
  { line: '你要是风就好了，这样我每天都能感受到你。', tag: '深情' },
  { line: '想让你当我心里的常住户，不交房租那种。', tag: '搞笑' },
  { line: '你知道我最大的遗憾是什么吗？就是遇见你太晚了。', tag: '深情' },
  { line: '别再问我喜欢什么了，我只喜欢你。', tag: '甜蜜' },
  { line: '你知道一道菜怎么吃才好吃吗？你喂我。', tag: '套路' },
  { line: '你属什么的？属于我的。', tag: '套路' },
  { line: '你有地图吗？我在你的眼神里迷路了。', tag: '套路' },
  { line: '喜欢你是件很麻烦的事，但我偏喜欢找麻烦。', tag: '深情' }
];

var TAGS = ['全部', '甜蜜', '套路', '深情', '搞笑'];

Page({
  data: {
    currentLine: '',
    currentTag: '',
    currentIdx: 0,
    allLines: [],
    showLines: [],
    tags: TAGS,
    activeTag: '全部',
    favorites: [],
    showFavPanel: false,
    totalNum: 0
  },

  _allLines: [],

  onLoad: function () {
    var favs = wx.getStorageSync('cheesytalk_fav') || [];
    this._allLines = LINES.slice();
    this.setData({
      favorites: favs,
      totalNum: LINES.length
    });
    this._shuffle();
    this._showRandom();
  },

  _shuffle: function () {
    var arr = this._allLines.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    this._allLines = arr;
  },

  _showRandom: function () {
    var tag = this.data.activeTag;
    var pool = this._allLines;
    if (tag !== '全部') {
      pool = pool.filter(function (item) { return item.tag === tag; });
    }
    if (pool.length === 0) {
      pool = this._allLines;
    }
    var idx = Math.floor(Math.random() * pool.length);
    var item = pool[idx];
    this.setData({
      currentLine: item.line,
      currentTag: item.tag,
      currentIdx: idx,
      showLines: pool
    });
  },

  nextLine: function () {
    this._showRandom();
  },

  filterTag: function (e) {
    var tag = e.currentTarget.dataset.tag;
    this.setData({ activeTag: tag });
    this._showRandom();
  },

  copyLine: function () {
    wx.setClipboardData({
      data: this.data.currentLine,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  addFavorite: function () {
    var line = this.data.currentLine;
    var tag = this.data.currentTag;
    var favs = this.data.favorites.slice();
    var exists = false;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].line === line) { exists = true; break; }
    }
    if (exists) {
      wx.showToast({ title: '已收藏过了', icon: 'none' });
      return;
    }
    favs.unshift({ line: line, tag: tag, timestamp: Date.now() });
    if (favs.length > 50) favs = favs.slice(0, 50);
    wx.setStorageSync('cheesytalk_fav', favs);
    this.setData({ favorites: favs });
    wx.showToast({ title: '已收藏', icon: 'success' });

    storage.addHistory({
      toolId: 'cheesytalk',
      toolName: '土味情话',
      category: 'fun',
      summary: '收藏了一句' + tag + '情话',
      timestamp: Date.now()
    });
  },

  toggleFavPanel: function () {
    this.setData({ showFavPanel: !this.data.showFavPanel });
  },

  removeFav: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var favs = this.data.favorites.slice();
    favs.splice(idx, 1);
    wx.setStorageSync('cheesytalk_fav', favs);
    this.setData({ favorites: favs });
  },

  copyFavLine: function (e) {
    var line = e.currentTarget.dataset.line;
    wx.setClipboardData({
      data: line,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  shareLine: function () {
    // 使用按钮的 open-type="share"
  },

  onShareAppMessage: function () {
    return {
      title: this.data.currentLine,
      path: '/pages/tools/cheesytalk/index'
    };
  }
});
