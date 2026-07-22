var storage = require('../../../utils/storage.js');

// 内置生字库（按年级分类）
var WORD_BANK = {
  '1': { name: '一年级上', words: [
    { word: '一', pinyin: 'yī', stroke: '横' },
    { word: '二', pinyin: 'èr', stroke: '横横' },
    { word: '三', pinyin: 'sān', stroke: '横横横' },
    { word: '十', pinyin: 'shí', stroke: '横竖' },
    { word: '木', pinyin: 'mù', stroke: '横竖撇捺' },
    { word: '禾', pinyin: 'hé', stroke: '撇横竖撇捺' },
    { word: '上', pinyin: 'shàng', stroke: '竖横横' },
    { word: '下', pinyin: 'xià', stroke: '横竖点' },
    { word: '土', pinyin: 'tǔ', stroke: '横竖横' },
    { word: '个', pinyin: 'gè', stroke: '撇捺竖' },
    { word: '八', pinyin: 'bā', stroke: '撇捺' },
    { word: '入', pinyin: 'rù', stroke: '撇捺' },
    { word: '大', pinyin: 'dà', stroke: '横撇捺' },
    { word: '天', pinyin: 'tiān', stroke: '横横撇捺' },
    { word: '人', pinyin: 'rén', stroke: '撇捺' },
    { word: '火', pinyin: 'huǒ', stroke: '点撇撇捺' },
    { word: '文', pinyin: 'wén', stroke: '点横撇捺' },
    { word: '六', pinyin: 'liù', stroke: '点横撇点' },
    { word: '七', pinyin: 'qī', stroke: '横竖弯钩' },
    { word: '儿', pinyin: 'ér', stroke: '撇竖弯钩' }
  ]},
  '2': { name: '一年级下', words: [
    { word: '万', pinyin: 'wàn', stroke: '横横折钩撇' },
    { word: '丁', pinyin: 'dīng', stroke: '横竖钩' },
    { word: '冬', pinyin: 'dōng', stroke: '撇横撇捺点' },
    { word: '百', pinyin: 'bǎi', stroke: '横撇竖横折横' },
    { word: '齐', pinyin: 'qí', stroke: '点横撇捺撇竖' },
    { word: '说', pinyin: 'shuō', stroke: '点横折提点撇竖弯钩撇' },
    { word: '话', pinyin: 'huà', stroke: '点横折提撇横竖竖横' },
    { word: '朋', pinyin: 'péng', stroke: '撇横折钩横横撇横折钩横横' },
    { word: '友', pinyin: 'yǒu', stroke: '横撇竖撇捺' },
    { word: '春', pinyin: 'chūn', stroke: '横横横撇捺竖横折横横' },
    { word: '高', pinyin: 'gāo', stroke: '点横竖横折横竖横折横' },
    { word: '你', pinyin: 'nǐ', stroke: '撇竖撇横钩竖钩点' },
    { word: '们', pinyin: 'men', stroke: '撇竖点竖横折钩' },
    { word: '红', pinyin: 'hóng', stroke: '撇折撇折提横竖横' },
    { word: '绿', pinyin: 'lǜ', stroke: '撇折撇折提横竖钩点提撇捺' },
    { word: '花', pinyin: 'huā', stroke: '横竖竖撇竖撇竖弯钩' },
    { word: '草', pinyin: 'cǎo', stroke: '横竖竖竖横折横横竖' },
    { word: '爷', pinyin: 'yé', stroke: '撇点横撇竖横折钩竖' },
    { word: '节', pinyin: 'jié', stroke: '横竖竖横折钩竖' },
    { word: '岁', pinyin: 'suì', stroke: '竖竖横撇横钩撇点' }
  ]},
  '3': { name: '二年级上', words: [
    { word: '宜', pinyin: 'yí', stroke: '点点横撇点竖横折横横' },
    { word: '实', pinyin: 'shí', stroke: '点点横撇点横撇捺' },
    { word: '色', pinyin: 'sè', stroke: '撇横折竖横竖弯钩' },
    { word: '华', pinyin: 'huá', stroke: '撇竖横折横横竖' },
    { word: '谷', pinyin: 'gǔ', stroke: '撇点撇捺竖横折横' },
    { word: '金', pinyin: 'jīn', stroke: '撇点横横竖点撇横' },
    { word: '尽', pinyin: 'jìn', stroke: '横折横撇捺点' },
    { word: '层', pinyin: 'céng', stroke: '横折横撇竖横折横横' },
    { word: '丰', pinyin: 'fēng', stroke: '横横横竖' },
    { word: '壮', pinyin: 'zhuàng', stroke: '点横竖横横竖横' },
    { word: '波', pinyin: 'bō', stroke: '点点提横撇竖横钩点' },
    { word: '浪', pinyin: 'làng', stroke: '点点提点横折横横竖提撇捺' },
    { word: '灯', pinyin: 'dēng', stroke: '点撇撇点横竖钩' },
    { word: '作', pinyin: 'zuò', stroke: '撇竖撇横竖横横' },
    { word: '字', pinyin: 'zì', stroke: '点点横撇横钩横' },
    { word: '苹', pinyin: 'píng', stroke: '横竖竖横点撇横竖' },
    { word: '丽', pinyin: 'lì', stroke: '横竖横折钩点竖横折钩点' },
    { word: '劳', pinyin: 'láo', stroke: '横竖竖点横钩横撇' },
    { word: '尤', pinyin: 'yóu', stroke: '横撇竖弯钩点' },
    { word: '其', pinyin: 'qí', stroke: '横竖竖横横横撇点' }
  ]},
  '4': { name: '二年级下', words: [
    { word: '脱', pinyin: 'tuō', stroke: '撇横折钩横横点撇竖横折钩撇' },
    { word: '冻', pinyin: 'dòng', stroke: '点点提横撇竖钩点' },
    { word: '溪', pinyin: 'xī', stroke: '点点提撇点点撇点点横撇捺' },
    { word: '棉', pinyin: 'mián', stroke: '横竖撇点撇竖横折钩横横竖' },
    { word: '探', pinyin: 'tàn', stroke: '横竖钩提点横钩撇点横竖撇捺' },
    { word: '摇', pinyin: 'yáo', stroke: '横竖钩提撇点点撇横竖横折横' },
    { word: '野', pinyin: 'yě', stroke: '竖横折横横竖横横撇横钩点' },
    { word: '躲', pinyin: 'duǒ', stroke: '撇横折横横横撇点撇横折折折钩撇' },
    { word: '解', pinyin: 'jiě', stroke: '撇横折横横横撇点撇横折钩横横竖' },
    { word: '未', pinyin: 'wèi', stroke: '横横竖撇捺' },
    { word: '追', pinyin: 'zhuī', stroke: '撇竖横折横横横点横折折撇捺' },
    { word: '店', pinyin: 'diàn', stroke: '点横撇竖横折横横' },
    { word: '枯', pinyin: 'kū', stroke: '横竖撇点横竖竖横折横' },
    { word: '徐', pinyin: 'xú', stroke: '撇撇竖撇横横竖钩撇点' },
    { word: '烧', pinyin: 'shāo', stroke: '点撇撇点横斜钩撇横撇捺' },
    { word: '荣', pinyin: 'róng', stroke: '横竖竖点横钩横撇' },
    { word: '菜', pinyin: 'cài', stroke: '横竖竖撇点点撇点点横竖撇捺' },
    { word: '宿', pinyin: 'sù', stroke: '点点横撇竖横撇点横撇捺' },
    { word: '世', pinyin: 'shì', stroke: '横竖竖横折' },
    { word: '界', pinyin: 'jiè', stroke: '竖横折横横竖横撇竖' }
  ]},
  '5': { name: '三年级上', words: [
    { word: '坪', pinyin: 'píng', stroke: '横竖提横点撇横竖' },
    { word: '坝', pinyin: 'bà', stroke: '横竖提竖横折横竖' },
    { word: '戴', pinyin: 'dài', stroke: '横竖横竖横折横横撇横竖横斜钩点' },
    { word: '招', pinyin: 'zhāo', stroke: '横竖钩提横折钩撇竖横折横' },
    { word: '蝴', pinyin: 'hú', stroke: '竖横折横竖横点横撇横折钩横横竖' },
    { word: '蝶', pinyin: 'dié', stroke: '竖横折横竖横点横竖竖横横折横横' },
    { word: '孔', pinyin: 'kǒng', stroke: '横撇竖钩提竖弯钩' },
    { word: '雀', pinyin: 'què', stroke: '竖点撇竖点横横横竖横' },
    { word: '舞', pinyin: 'wǔ', stroke: '撇横横竖竖横横横横竖折撇点横折钩点横点' },
    { word: '铜', pinyin: 'tóng', stroke: '撇横横横竖提竖横折钩横竖横' },
    { word: '粗', pinyin: 'cū', stroke: '点点竖撇点竖横折横横横' },
    { word: '尾', pinyin: 'wěi', stroke: '横折横撇撇横横竖弯钩' },
    { word: '谁', pinyin: 'shuí', stroke: '点横折提撇竖点横横横竖横' },
    { word: '写', pinyin: 'xiě', stroke: '点横钩横竖横折横' },
    { word: '字', pinyin: 'zì', stroke: '点点横撇横钩横' },
    { word: '古', pinyin: 'gǔ', stroke: '横竖竖横折横' },
    { word: '诗', pinyin: 'shī', stroke: '点横折提横竖横横竖钩点' },
    { word: '首', pinyin: 'shǒu', stroke: '点撇横撇竖横折横横' },
    { word: '静', pinyin: 'jìng', stroke: '横横竖横竖横折钩横横撇横折钩竖钩' },
    { word: '思', pinyin: 'sī', stroke: '竖横折横竖横点卧钩点点' }
  ]},
  '6': { name: '三年级下', words: [
    { word: '燕', pinyin: 'yàn', stroke: '横竖竖横竖横折横横撇横折钩竖点点点点' },
    { word: '聚', pinyin: 'jù', stroke: '横竖竖横横提横撇点横撇竖撇撇捺' },
    { word: '增', pinyin: 'zēng', stroke: '横竖提点撇竖横折横竖横折横横' },
    { word: '掠', pinyin: 'lüè', stroke: '横竖钩提点横竖横折横竖横' },
    { word: '稻', pinyin: 'dào', stroke: '撇横竖撇点撇点点撇点点横竖横' },
    { word: '尖', pinyin: 'jiān', stroke: '竖点撇横撇捺' },
    { word: '偶', pinyin: 'ǒu', stroke: '撇竖竖横折横横竖横折钩点' },
    { word: '沾', pinyin: 'zhān', stroke: '点点提竖横折横竖横' },
    { word: '圈', pinyin: 'quān', stroke: '竖横折横撇横撇捺横横横' },
    { word: '漾', pinyin: 'yàng', stroke: '点点提点撇横横竖横点横折钩撇撇' },
    { word: '倦', pinyin: 'juàn', stroke: '撇竖点撇横横撇横钩竖弯钩' },
    { word: '符', pinyin: 'fú', stroke: '撇横点撇横点撇竖横竖钩' },
    { word: '演', pinyin: 'yǎn', stroke: '点点提点点横钩横竖横折横竖横折横' },
    { word: '赞', pinyin: 'zàn', stroke: '撇横竖横撇竖提撇横竖横撇竖提撇' },
    { word: '咏', pinyin: 'yǒng', stroke: '竖横折横点横折钩横撇捺' },
    { word: '碧', pinyin: 'bì', stroke: '横横竖提横横竖提横横竖横' },
    { word: '妆', pinyin: 'zhuāng', stroke: '点横竖横撇横撇' },
    { word: '绿', pinyin: 'lǜ', stroke: '撇折撇折提横竖钩点提撇捺' },
    { word: '裁', pinyin: 'cái', stroke: '横竖横横竖横横撇横斜钩点' },
    { word: '剪', pinyin: 'jiǎn', stroke: '点撇横横撇点横折钩横横竖钩' }
  ]}
};

Page({
  data: {
    page: 'select',     // select | practice | result
    gradeList: [],
    selectedGrade: '',
    wordList: [],
    currentWord: null,
    currentIndex: 0,
    totalWords: 0,
    showAnswer: false,
    pinyinHint: false,
    strokeHint: false,
    wrongList: [],
    correctNum: 0,
    wrongNum: 0,
    autoPlay: true,
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
    this.setData({ isFavorite: storage.isFavorite('dictation') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('dictation');
    this.setData({ isFavorite: fav });
  },

  initGradeList: function () {
    var list = [];
    var keys = Object.keys(WORD_BANK);
    for (var i = 0; i < keys.length; i++) {
      list.push({ key: keys[i], name: WORD_BANK[keys[i]].name, count: WORD_BANK[keys[i]].words.length });
    }
    this.setData({ gradeList: list });
  },

  onGradeSelect: function (e) {
    var grade = e.currentTarget.dataset.grade;
    var words = WORD_BANK[grade].words;
    // 随机打乱顺序
    var shuffled = words.slice().sort(function () { return Math.random() - 0.5; });
    this.setData({
      selectedGrade: grade,
      wordList: shuffled,
      page: 'practice',
      currentIndex: 0,
      totalWords: shuffled.length,
      currentWord: shuffled[0],
      showAnswer: false,
      pinyinHint: false,
      strokeHint: false,
      wrongList: [],
      correctNum: 0,
      wrongNum: 0
    });
    if (this.data.autoPlay) {
      this.speakWord(shuffled[0].word);
    }
  },

  speakWord: function (word) {
    try {
      if (typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
        speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onerror = function () {
          wx.vibrateShort({ type: 'medium' });
          wx.showToast({ title: '请家长读出: ' + word, icon: 'none', duration: 2500 });
        };
        speechSynthesis.speak(utterance);
        return;
      }
    } catch (e) {
      console.warn('Web Speech API 不可用:', e);
    }
    // 降级方案
    wx.vibrateShort({ type: 'medium' });
    wx.showToast({ title: '请家长读出: ' + word, icon: 'none', duration: 2500 });
  },

  onTogglePinyin: function () {
    this.setData({ pinyinHint: !this.data.pinyinHint });
  },

  onToggleStroke: function () {
    this.setData({ strokeHint: !this.data.strokeHint });
  },

  onShowAnswer: function () {
    this.setData({ showAnswer: true });
  },

  onKnow: function () {
    this.recordAnswer(true);
  },

  onDontKnow: function () {
    this.recordAnswer(false);
  },

  recordAnswer: function (known) {
    if (known) {
      this.setData({ correctNum: this.data.correctNum + 1 });
    } else {
      this.setData({
        wrongNum: this.data.wrongNum + 1,
        wrongList: this.data.wrongList.concat([this.data.currentWord])
      });
    }

    var nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.totalWords) {
      this.finishPractice();
      return;
    }

    this.setData({
      currentIndex: nextIndex,
      currentWord: this.data.wordList[nextIndex],
      showAnswer: false,
      pinyinHint: false,
      strokeHint: false
    });

    if (this.data.autoPlay) {
      this.speakWord(this.data.wordList[nextIndex].word);
    }
  },

  onReplay: function () {
    this.speakWord(this.data.currentWord.word);
  },

  onToggleAutoPlay: function () {
    this.setData({ autoPlay: !this.data.autoPlay });
    wx.showToast({
      title: this.data.autoPlay ? '已开启自动播放' : '已关闭自动播放',
      icon: 'none'
    });
  },

  finishPractice: function () {
    var total = this.data.correctNum + this.data.wrongNum;
    var accuracy = total > 0 ? Math.round(this.data.correctNum / total * 100) : 0;

    var summary = {
      total: total,
      correct: this.data.correctNum,
      wrong: this.data.wrongNum,
      accuracy: accuracy,
      grade: WORD_BANK[this.data.selectedGrade].name,
      wrongWords: this.data.wrongList
    };

    this.setData({ page: 'result', resultSummary: summary });
    this.recordHistory(summary);
  },

  recordHistory: function (summary) {
    storage.addHistory({
      toolId: 'dictation',
      toolName: '生字听写机',
      category: 'study',
      summary: summary.grade + ' 听写' + summary.total + '字 正确率' + summary.accuracy + '%',
      timestamp: Date.now()
    });
  },

  onRetryWrong: function () {
    if (this.data.wrongList.length === 0) {
      wx.showToast({ title: '没有错字哦', icon: 'none' });
      return;
    }
    var shuffled = this.data.wrongList.slice().sort(function () { return Math.random() - 0.5; });
    this.setData({
      page: 'practice',
      wordList: shuffled,
      currentIndex: 0,
      totalWords: shuffled.length,
      currentWord: shuffled[0],
      showAnswer: false,
      pinyinHint: false,
      strokeHint: false,
      wrongList: [],
      correctNum: 0,
      wrongNum: 0
    });
    if (this.data.autoPlay) {
      this.speakWord(shuffled[0].word);
    }
  },

  onRestart: function () {
    this.onGradeSelect({ currentTarget: { dataset: { grade: this.data.selectedGrade } } });
  },

  onBackSelect: function () {
    this.setData({ page: 'select' });
  },

  onShareAppMessage: function () {
    return {
      title: '生字听写机 - 小学生语文必备',
      path: '/packages/toolsB/dictation/index'
    };
  }
});
