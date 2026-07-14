var storage = require('../../../utils/storage.js');

// 词库：平民词 - 卧底词（持续扩充中）
var WORD_PAIRS = [
  // —— 原有词库 ——
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
  ['白娘子', '小青'], ['孙悟空', '猪八戒'], ['林黛玉', '薛宝钗'],

  // —— 水果 / 零食 ——
  ['草莓', '樱桃'], ['香蕉', '芭蕉'], ['葡萄', '提子'], ['柠檬', '柚子'],
  ['芒果', '枇杷'], ['哈密瓜', '香瓜'], ['酸奶', '乳酸菌'], ['糖果', '巧克力'],
  ['冰淇淋', '雪糕'], ['薯条', '薯片'], ['爆米花', '瓜子'], ['汉堡', '三明治'],
  ['披萨', '馅饼'], ['寿司', '饭团'], ['米饭', '面条'], ['粥', '汤'],

  // —— 动物 ——
  ['猫', '老虎'], ['狗', '狼'], ['金鱼', '热带鱼'], ['鲸鱼', '鲨鱼'],
  ['海豚', '海狮'], ['狮子', '老虎'], ['大象', '河马'], ['长颈鹿', '骆驼'],
  ['熊猫', '考拉'], ['松鼠', '老鼠'], ['麻雀', '燕子'], ['乌鸦', '喜鹊'],
  ['兔子', '仓鼠'], ['公鸡', '鸭子'],

  // —— 植物 / 花草 ——
  ['玫瑰', '月季'], ['百合', '郁金香'], ['菊花', '向日葵'], ['仙人掌', '芦荟'],
  ['薄荷', '香菜'], ['辣椒', '花椒'], ['葱', '蒜'],

  // —— 调料 / 饮品 ——
  ['醋', '酱油'], ['糖', '盐'], ['啤酒', '白酒'], ['红酒', '黄酒'],
  ['绿茶', '红茶'], ['茉莉花茶', '菊花茶'], ['矿泉水', '纯净水'], ['果汁', '汽水'],

  // —— 衣物 / 配饰 ——
  ['围巾', '领带'], ['帽子', '头盔'], ['手套', '袖套'], ['袜子', '船袜'],
  ['皮鞋', '运动鞋'], ['拖鞋', '凉鞋'], ['高跟鞋', '平底鞋'], ['毛衣', '卫衣'],
  ['衬衫', 'T恤'], ['外套', '风衣'], ['羽绒服', '棉袄'], ['牛仔裤', '休闲裤'],
  ['钱包', '卡包'], ['背包', '挎包'], ['行李箱', '旅行袋'],

  // —— 数码 / 家电 ——
  ['手表', '手环'], ['闹钟', '计时器'], ['收音机', '录音机'], ['相机', '摄像机'],
  ['键盘', '鼠标'], ['U盘', '移动硬盘'], ['充电宝', '电池'], ['台灯', '落地灯'],
  ['风扇', '排风扇'], ['冰箱', '冷柜'], ['洗衣机', '烘干机'], ['微波炉', '烤箱'],
  ['燃气灶', '电磁炉'], ['刀', '剪刀'], ['碗', '盘子'], ['杯子', '保温杯'],
  ['牙刷', '牙线'], ['毛巾', '浴巾'], ['肥皂', '洗手液'], ['洗发水', '沐浴露'],
  ['牙膏', '漱口水'], ['镜子', '放大镜'], ['梳子', '发刷'],

  // —— 家居 / 空间 ——
  ['床', '沙发'], ['桌子', '茶几'], ['椅子', '凳子'], ['衣柜', '书架'],
  ['窗帘', '百叶窗'], ['地毯', '地垫'], ['阳台', '露台'], ['厨房', '卫生间'],
  ['电梯', '楼梯'],

  // —— 交通 / 地点 ——
  ['马路', '街道'], ['大桥', '高架'], ['地铁', '轻轨'], ['自行车', '电动车'],
  ['汽车', '卡车'], ['摩托车', '三轮车'], ['轮船', '游艇'], ['热气球', '飞艇'],
  ['风筝', '孔明灯'], ['公园', '游乐场'], ['超市', '便利店'], ['餐厅', '食堂'],
  ['酒店', '民宿'], ['学校', '补习班'], ['医院', '诊所'], ['银行', 'ATM'],
  ['警察局', '消防局'], ['图书馆', '书店'], ['电影院', '剧场'], ['演唱会', '音乐节'],

  // —— 运动 / 娱乐 ——
  ['篮球', '排球'], ['网球', '羽毛球'], ['乒乓球', '台球'], ['高尔夫', '保龄球'],
  ['滑板', '轮滑'], ['象棋', '围棋'], ['扑克', '麻将'], ['拼图', '积木'],
  ['画画', '书法'], ['唱歌', '说唱'], ['跳舞', '街舞'], ['小提琴', '大提琴'],
  ['鼓', '架子鼓'], ['粉底', 'BB霜'], ['眼影', '腮红'], ['香水', '花露水'],
  ['面膜', '眼膜'],

  // —— 节日 / 生活场景 ——
  ['春节', '元宵节'], ['端午节', '中秋节'], ['愚人节', '万圣节'], ['情人节', '七夕'],
  ['生日', '纪念日'], ['婚礼', '葬礼'], ['面试', '相亲'], ['上班', '上学'],
  ['加班', '熬夜'], ['旅游', '出差'], ['减肥', '健身'], ['失眠', '熬夜'],

  // —— 情绪 / 感受 ——
  ['开心', '兴奋'], ['难过', '伤心'], ['生气', '愤怒'], ['害怕', '紧张'],
  ['尴尬', '害羞']
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
    round: 1,
    // 词语来源：false=随机词库, true=自己输入
    useCustom: false,
    customCivilian: '',
    customSpy: ''
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
    var civilianWord, spyWord;
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
      civilianWord = pair[0];
      spyWord = pair[1];
    }

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
