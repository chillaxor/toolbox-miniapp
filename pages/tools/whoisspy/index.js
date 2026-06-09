var storage = require('../../../utils/storage.js');

// 词库：平民词 - 卧底词
var WORD_PAIRS = [
  ['西瓜', '冬瓜'], ['口红', '唇膏'], ['警察', '小偷'], ['牛奶', '豆浆'],
  ['蜘蛛侠', '蝙蝠侠'], ['蛋糕', '面包'], ['眼镜', '墨镜'], ['手机', '平板'],
  ['筷子', '叉子'], ['馒头', '包子'], ['空调', '电扇'], ['白菜', '生菜'],
  ['吉他', '钢琴'], ['雨伞', '雨衣'], ['枕头', '靠垫'], ['足球', '篮球'],
  ['火锅', '烧烤'], ['雪碧', '可乐'], ['出租车', '公交车'], ['医生', '护士'],
  ['老师', '教授'], ['番茄', '土豆'], ['苹果', '梨子'], ['橙子', '橘子'],
  ['裙子', '短裤'], ['跑步', '散步'], ['游泳', '潜水'], ['飞机', '火车'],
  ['电影', '电视'], ['邮票', '明信片'], ['蝴蝶', '蜻蜓'], ['企鹅', '海豹'],
  ['火锅', '麻辣烫'], ['耳机', '音箱'], ['橡皮', '涂改液'], ['铅笔', '钢笔'],
  ['红绿灯', '斑马线'], ['导游', '司机'], ['月饼', '粽子'], ['饺子', '馄饨'],
  ['春晚', '跨年晚会'], ['微信', 'QQ'], ['淘宝', '京东'], ['咖啡', '奶茶'],
  ['拍马屁', '戴高帽'], ['刘德华', '张学友'], ['奥运会', '世界杯'],
  ['哈利波特', '指环王'], ['柯南', '福尔摩斯'], ['海绵宝宝', '章鱼哥'],
  ['白娘子', '小青'], ['孙悟空', '猪八戒'], ['林黛玉', '薛宝钗']
];

Page({
  data: {
    isFavorite: false,
    // 状态: setup, viewing, playing, voting, result
    state: 'setup',
    playerCount: 6,
    spyCount: 1,
    players: [],
    currentPlayer: 0,
    viewingRevealed: false,
    civilianWord: '',
    spyWord: '',
    votes: {},
    votedPlayer: -1,
    round: 1
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
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
    this.setData({ playerCount: count, spyCount: spyCount });
  },

  onSpyCountChange: function (e) {
    var count = Number(e.currentTarget.dataset.count);
    this.setData({ spyCount: count });
  },

  startGame: function () {
    // 随机选词对
    var pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    var civilianWord = pair[0];
    var spyWord = pair[1];

    // 随机分配卧底
    var playerCount = this.data.playerCount;
    var spyCount = this.data.spyCount;
    var roles = [];
    for (var i = 0; i < playerCount; i++) {
      roles.push({ id: i + 1, name: '玩家' + (i + 1), isSpy: false, word: civilianWord });
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
    }

    this.setData({
      players: roles,
      civilianWord: civilianWord,
      spyWord: spyWord,
      currentPlayer: 0,
      viewingRevealed: false,
      state: 'viewing',
      votes: {},
      votedPlayer: -1,
      round: 1
    });
  },

  onReveal: function () {
    this.setData({ viewingRevealed: true });
  },

  onNextPlayer: function () {
    var next = this.data.currentPlayer + 1;
    if (next >= this.data.playerCount) {
      // 所有人已查看，进入讨论阶段
      this.setData({ state: 'playing', currentPlayer: 0, viewingRevealed: false });
    } else {
      this.setData({ currentPlayer: next, viewingRevealed: false });
    }
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
