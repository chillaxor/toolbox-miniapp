var storage = require('../../../utils/storage.js');

// 内置古诗库（按年级分类）
var POETRY_BANK = {
  '1': { name: '一年级上', poems: [
    { title: '咏鹅', author: '骆宾王', dynasty: '唐', lines: ['鹅鹅鹅，','曲项向天歌。','白毛浮绿水，','红掌拨清波。'], keywords: ['鹅','歌','水','波'] },
    { title: '静夜思', author: '李白', dynasty: '唐', lines: ['床前明月光，','疑是地上霜。','举头望明月，','低头思故乡。'], keywords: ['月光','霜','明月','故乡'] },
    { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓，','处处闻啼鸟。','夜来风雨声，','花落知多少。'], keywords: ['春','鸟','风雨','花'] },
    { title: '画', author: '王维', dynasty: '唐', lines: ['远看山有色，','近听水无声。','春去花还在，','人来鸟不惊。'], keywords: ['山','水','花','鸟'] },
    { title: '悯农（其二）', author: '李绅', dynasty: '唐', lines: ['锄禾日当午，','汗滴禾下土。','谁知盘中餐，','粒粒皆辛苦。'], keywords: ['锄禾','汗','餐','辛苦'] }
  ]},
  '2': { name: '一年级下', poems: [
    { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓，','处处闻啼鸟。','夜来风雨声，','花落知多少。'], keywords: ['春','鸟','风雨','花'] },
    { title: '村居', author: '高鼎', dynasty: '清', lines: ['草长莺飞二月天，','拂堤杨柳醉春烟。','儿童散学归来早，','忙趁东风放纸鸢。'], keywords: ['草','莺','杨柳','纸鸢'] },
    { title: '所见', author: '袁枚', dynasty: '清', lines: ['牧童骑黄牛，','歌声振林樾。','意欲捕鸣蝉，','忽然闭口立。'], keywords: ['牧童','黄牛','蝉','立'] },
    { title: '小池', author: '杨万里', dynasty: '宋', lines: ['泉眼无声惜细流，','树阴照水爱晴柔。','小荷才露尖尖角，','早有蜻蜓立上头。'], keywords: ['泉','树阴','小荷','蜻蜓'] }
  ]},
  '3': { name: '二年级上', poems: [
    { title: '赠刘景文', author: '苏轼', dynasty: '宋', lines: ['荷尽已无擎雨盖，','菊残犹有傲霜枝。','一年好景君须记，','正是橙黄橘绿时。'], keywords: ['荷','菊','霜','橙黄橘绿'] },
    { title: '山行', author: '杜牧', dynasty: '唐', lines: ['远上寒山石径斜，','白云生处有人家。','停车坐爱枫林晚，','霜叶红于二月花。'], keywords: ['寒山','白云','枫林','霜叶'] },
    { title: '回乡偶书', author: '贺知章', dynasty: '唐', lines: ['少小离家老大回，','乡音无改鬓毛衰。','儿童相见不相识，','笑问客从何处来。'], keywords: ['离家','乡音','儿童','客'] },
    { title: '赠汪伦', author: '李白', dynasty: '唐', lines: ['李白乘舟将欲行，','忽闻岸上踏歌声。','桃花潭水深千尺，','不及汪伦送我情。'], keywords: ['舟','歌声','桃花潭','情'] }
  ]},
  '4': { name: '二年级下', poems: [
    { title: '草', author: '白居易', dynasty: '唐', lines: ['离离原上草，','一岁一枯荣。','野火烧不尽，','春风吹又生。'], keywords: ['草','枯荣','野火','春风'] },
    { title: '宿新市徐公店', author: '杨万里', dynasty: '宋', lines: ['篱落疏疏一径深，','树头新绿未成阴。','儿童急走追黄蝶，','飞入菜花无处寻。'], keywords: ['篱落','新绿','黄蝶','菜花'] },
    { title: '望庐山瀑布', author: '李白', dynasty: '唐', lines: ['日照香炉生紫烟，','遥看瀑布挂前川。','飞流直下三千尺，','疑是银河落九天。'], keywords: ['香炉','瀑布','飞流','银河'] },
    { title: '绝句', author: '杜甫', dynasty: '唐', lines: ['两个黄鹂鸣翠柳，','一行白鹭上青天。','窗含西岭千秋雪，','门泊东吴万里船。'], keywords: ['黄鹂','白鹭','雪','船'] }
  ]},
  '5': { name: '三年级上', poems: [
    { title: '夜书所见', author: '叶绍翁', dynasty: '宋', lines: ['萧萧梧叶送寒声，','江上秋风动客情。','知有儿童挑促织，','夜深篱落一灯明。'], keywords: ['梧叶','秋风','儿童','灯'] },
    { title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', lines: ['独在异乡为异客，','每逢佳节倍思亲。','遥知兄弟登高处，','遍插茱萸少一人。'], keywords: ['异乡','佳节','登高','茱萸'] },
    { title: '望天门山', author: '李白', dynasty: '唐', lines: ['天门中断楚江开，','碧水东流至此回。','两岸青山相对出，','孤帆一片日边来。'], keywords: ['天门山','楚江','青山','孤帆'] },
    { title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', lines: ['水光潋滟晴方好，','山色空蒙雨亦奇。','欲把西湖比西子，','淡妆浓抹总相宜。'], keywords: ['水光','山色','西湖','西子'] }
  ]},
  '6': { name: '三年级下', poems: [
    { title: '咏柳', author: '贺知章', dynasty: '唐', lines: ['碧玉妆成一树高，','万条垂下绿丝绦。','不知细叶谁裁出，','二月春风似剪刀。'], keywords: ['碧玉','丝绦','细叶','春风'] },
    { title: '春日', author: '朱熹', dynasty: '宋', lines: ['胜日寻芳泗水滨，','无边光景一时新。','等闲识得东风面，','万紫千红总是春。'], keywords: ['寻芳','光景','东风','万紫千红'] },
    { title: '乞巧', author: '林杰', dynasty: '唐', lines: ['七夕今宵看碧霄，','牵牛织女渡河桥。','家家乞巧望秋月，','穿尽红丝几万条。'], keywords: ['七夕','牵牛织女','乞巧','红丝'] },
    { title: '嫦娥', author: '李商隐', dynasty: '唐', lines: ['云母屏风烛影深，','长河渐落晓星沉。','嫦娥应悔偷灵药，','碧海青天夜夜心。'], keywords: ['屏风','长河','嫦娥','碧海'] }
  ]}
};

Page({
  data: {
    page: 'list',       // list | recite | fill | result
    gradeList: [],
    selectedGrade: '',
    poemList: [],
    currentPoem: null,
    currentIndex: 0,
    totalPoems: 0,
    mode: 'recite',     // recite | fill
    // 背诵模式
    hiddenLines: [],
    showAll: false,
    // 填空模式
    fillBlanks: [],
    userInputs: [],
    currentFillIndex: 0,
    // 结果
    correctNum: 0,
    wrongNum: 0,
    isFavorite: false,
    resultSummary: null
  },

  onLoad: function () {
    this.initGradeList();
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('poetry') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('poetry');
    this.setData({ isFavorite: fav });
  },

  initGradeList: function () {
    var list = [];
    var keys = Object.keys(POETRY_BANK);
    for (var i = 0; i < keys.length; i++) {
      list.push({ key: keys[i], name: POETRY_BANK[keys[i]].name, count: POETRY_BANK[keys[i]].poems.length });
    }
    this.setData({ gradeList: list });
  },

  onGradeSelect: function (e) {
    var grade = e.currentTarget.dataset.grade;
    var poems = POETRY_BANK[grade].poems;
    var shuffled = poems.slice().sort(function () { return Math.random() - 0.5; });
    this.setData({
      selectedGrade: grade,
      poemList: shuffled,
      page: 'list'
    });
  },

  onPoemTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var poem = this.data.poemList[idx];
    this.setData({
      currentPoem: poem,
      currentIndex: idx,
      page: 'recite',
      hiddenLines: [],
      showAll: false
    });
  },

  onStartRecite: function () {
    var poem = this.data.currentPoem;
    // 随机隐藏一半的行
    var hidden = [];
    for (var i = 0; i < poem.lines.length; i++) {
      hidden.push(i % 2 === 1);
    }
    // 再随机打乱一些
    if (Math.random() > 0.5) {
      hidden = hidden.map(function () { return Math.random() > 0.5; });
    }
    this.setData({ hiddenLines: hidden, showAll: false });
  },

  onShowAll: function () {
    this.setData({ showAll: true });
  },

  onToggleLine: function (e) {
    var idx = e.currentTarget.dataset.index;
    var hidden = this.data.hiddenLines.slice();
    hidden[idx] = !hidden[idx];
    this.setData({ hiddenLines: hidden });
  },

  onStartFill: function () {
    var poem = this.data.currentPoem;
    // 从每句中选取关键字挖空
    var blanks = [];
    for (var i = 0; i < poem.lines.length; i++) {
      var line = poem.lines[i];
      var keyword = poem.keywords[i] || '';
      if (line.indexOf(keyword) >= 0) {
        blanks.push({ line: line, keyword: keyword, blank: line.replace(keyword, '____') });
      } else {
        blanks.push({ line: line, keyword: '', blank: line });
      }
    }
    this.setData({
      page: 'fill',
      mode: 'fill',
      fillBlanks: blanks,
      userInputs: blanks.map(function () { return ''; }),
      currentFillIndex: 0,
      correctNum: 0,
      wrongNum: 0
    });
  },

  onFillInput: function (e) {
    var idx = e.currentTarget.dataset.index;
    var inputs = this.data.userInputs.slice();
    inputs[idx] = e.detail.value;
    this.setData({ userInputs: inputs });
  },

  onSubmitFill: function () {
    var correct = 0;
    var wrong = 0;
    for (var i = 0; i < this.data.fillBlanks.length; i++) {
      var blank = this.data.fillBlanks[i];
      if (blank.keyword) {
        var userAns = (this.data.userInputs[i] || '').trim();
        if (userAns === blank.keyword) {
          correct++;
        } else {
          wrong++;
        }
      }
    }
    this.setData({
      correctNum: correct,
      wrongNum: wrong,
      page: 'result',
      resultSummary: {
        title: this.data.currentPoem.title,
        author: this.data.currentPoem.author,
        dynasty: this.data.currentPoem.dynasty,
        total: this.data.fillBlanks.length,
        correct: correct,
        wrong: wrong,
        accuracy: Math.round(correct / this.data.fillBlanks.length * 100)
      }
    });
    this.recordHistory(correct, wrong);
  },

  onCheckRecite: function () {
    // 背诵模式直接标记完成
    this.setData({
      page: 'result',
      resultSummary: {
        title: this.data.currentPoem.title,
        author: this.data.currentPoem.author,
        dynasty: this.data.currentPoem.dynasty,
        total: this.data.currentPoem.lines.length,
        correct: this.data.currentPoem.lines.length,
        wrong: 0,
        accuracy: 100
      }
    });
    storage.addHistory({
      toolId: 'poetry',
      toolName: '古诗背诵卡',
      category: 'study',
      summary: '背诵《' + this.data.currentPoem.title + '》',
      timestamp: Date.now()
    });
  },

  recordHistory: function (correct, wrong) {
    var total = correct + wrong;
    storage.addHistory({
      toolId: 'poetry',
      toolName: '古诗背诵卡',
      category: 'study',
      summary: '默写《' + this.data.currentPoem.title + '》正确' + correct + '/' + total,
      timestamp: Date.now()
    });
  },

  onRetry: function () {
    if (this.data.mode === 'fill') {
      this.onStartFill();
    } else {
      this.onStartRecite();
    }
  },

  onNextPoem: function () {
    var nextIdx = (this.data.currentIndex + 1) % this.data.poemList.length;
    var poem = this.data.poemList[nextIdx];
    this.setData({
      currentPoem: poem,
      currentIndex: nextIdx,
      page: 'recite',
      hiddenLines: [],
      showAll: false
    });
  },

  onBackList: function () {
    this.setData({ page: 'list' });
  },

  onBackGrade: function () {
    this.setData({ page: 'list', selectedGrade: '', poemList: [] });
  },

  onShareAppMessage: function () {
    return {
      title: '古诗背诵卡 - 小学生必背古诗',
      path: '/packages/toolsB/poetry/index'
    };
  }
});
