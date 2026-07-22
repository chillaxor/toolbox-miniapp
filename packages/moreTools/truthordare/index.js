var storage = require('../../../utils/storage.js');

// 真心话题库
var TRUTH_QUESTIONS = [
  '你最近一次说谎是什么时候？说的什么谎？',
  '你觉得在座谁最好看？',
  '你最想和谁交换人生？为什么？',
  '你手机里最不想被别人看到的APP是什么？',
  '你偷偷做过最丢人的事是什么？',
  '如果可以回到过去，你最想改变哪件事？',
  '你觉得自己的最大缺点是什么？',
  '你暗恋过几个人？最长的暗恋多久？',
  '你最后悔的一件事是什么？',
  '你做过最疯狂的事是什么？',
  '你现在最想对谁说一句话？说什么？',
  '你觉得自己最像哪个影视角色？',
  '你睡前最常想的一件事是什么？',
  '你最近一次哭是因为什么？',
  '你有没有偷偷关注前任的社交动态？',
  '你觉得友情和爱情哪个更重要？',
  '你最大的秘密是什么？（可以含糊说）',
  '你最害怕的事情是什么？',
  '你做过最尴尬的梦是什么？',
  '如果明天是世界末日，你今天最想做什么？',
  '你觉得在座谁最有可能成为你的男/女朋友？',
  '你小时候最想做但没敢做的事是什么？',
  '你最不能接受另一半的什么缺点？',
  '你有没有在考试中作过弊？',
  '你最近一次心动是什么时候？',
  '你觉得自己什么时候最有魅力？',
  '你有没有偷偷存过私房钱？多少？',
  '如果可以读心术一天，你最想读谁的心？',
  '你觉得自己的颜值打几分？满分10分',
  '你有没有在社交媒体上装过完美人设？'
];

// 大冒险题库
var DARE_QUESTIONS = [
  '给你最近联系的第3个人发一句"我想你了"',
  '模仿一个动物叫声并坚持10秒',
  '用最妖娆的姿势走一段猫步',
  '打电话给爸妈说一句"我爱你"',
  '把你的微信头像换成一张搞笑表情包并保持24小时',
  '让你左边的人在你脸上画一笔',
  '大声唱一首歌的副歌部分',
  '做一个最丑的表情自拍发朋友圈',
  '给你暗恋的人发一条匿名消息',
  '用方言说一句"我最帅/最美"',
  '学一段广场舞动作',
  '闭着眼睛让别人给你化妆（口红就行）',
  '跟在你右边的人深情对视30秒',
  '在群里发一个红包（至少1元）',
  '用屁股写自己的名字',
  '表演一段即兴才艺（至少15秒）',
  '让你对面的人给你取一个外号，叫一晚上',
  '模仿在座某个人的经典动作让大家猜',
  '说三句不带喘气的绕口令',
  '对着窗外大喊一句"我很棒！"',
  '用最可爱的语气说"人家才不稀罕呢"',
  '给你通讯录第5个人发一个鬼脸表情包',
  '即兴说一段Rap（至少4句）',
  '闭眼转3圈然后走直线',
  '做20个深蹲',
  '模仿一个网红的经典语录',
  '让你左边的人给你捏脸拍合照',
  '用脚趾夹住一支笔写自己名字',
  '在额头上写"我是笨蛋"并保持5分钟',
  '用最夸张的方式表达"我好饿"'
];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

Page({
  data: {
    activeTab: 'truth',
    currentQuestion: '',
    questionIndex: 0,
    flipping: false,
    usedCount: 0,
    totalCount: 30
  },

  _truthPool: [],
  _darePool: [],
  _truthIdx: 0,
  _dareIdx: 0,

  onLoad: function () {
    this._truthPool = shuffle(TRUTH_QUESTIONS);
    this._darePool = shuffle(DARE_QUESTIONS);
    this._truthIdx = 0;
    this._dareIdx = 0;
    this._showQuestion();
  },

  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({
      activeTab: tab,
      flipping: true
    });
    var self = this;
    setTimeout(function () {
      self._showQuestion();
      self.setData({ flipping: false });
    }, 200);
  },

  nextQuestion: function () {
    this.setData({ flipping: true });
    var self = this;
    setTimeout(function () {
      if (self.data.activeTab === 'truth') {
        self._truthIdx++;
        if (self._truthIdx >= self._truthPool.length) {
          self._truthPool = shuffle(TRUTH_QUESTIONS);
          self._truthIdx = 0;
        }
      } else {
        self._dareIdx++;
        if (self._dareIdx >= self._darePool.length) {
          self._darePool = shuffle(DARE_QUESTIONS);
          self._dareIdx = 0;
        }
      }
      self._showQuestion();
      self.setData({ flipping: false });
    }, 200);
  },

  _showQuestion: function () {
    if (this.data.activeTab === 'truth') {
      this.setData({
        currentQuestion: this._truthPool[this._truthIdx],
        questionIndex: this._truthIdx,
        usedCount: this._truthIdx + 1,
        totalCount: this._truthPool.length
      });
    } else {
      this.setData({
        currentQuestion: this._darePool[this._dareIdx],
        questionIndex: this._dareIdx,
        usedCount: this._dareIdx + 1,
        totalCount: this._darePool.length
      });
    }
  },

  shuffleAll: function () {
    this._truthPool = shuffle(TRUTH_QUESTIONS);
    this._darePool = shuffle(DARE_QUESTIONS);
    this._truthIdx = 0;
    this._dareIdx = 0;
    this._showQuestion();
    wx.showToast({ title: '已重新洗牌', icon: 'none' });
  },

  onShareAppMessage: function () {
    return { title: '真心话大冒险 - 敢不敢来挑战？', path: '/packages/moreTools/truthordare/index' };
  }
});