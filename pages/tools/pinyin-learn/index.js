var pinyinData = require('../../../utils/pinyin-data.js');

Page({
  data: {
    currentTab: 'initials',
    // 声母相关
    initialGroups: [],
    // 韵母相关
    finalGroups: [],
    // 整体认读
    wholeSyllables: [],
    // 声调
    tones: [],
    toneExamples: ['mā 妈', 'má 麻', 'mǎ 马', 'mà 骂', 'ma 吗'],
    // 选中的拼音
    selectedPinyin: '',
    selectedType: '',
    selectedExample: {},
    // 练习相关
    practiceStarted: false,
    practiceFinished: false,
    practiceMode: '',
    currentQuestion: 0,
    totalQuestions: 10,
    score: 0,
    correctCount: 0,
    questionData: {},
    showResult: false,
    isCorrect: false,
    correctAnswer: '',
    selectedOption: '',
    // 连线模式
    matchPinyins: [],
    matchWords: [],
    selectedMatchPinyin: -1,
    selectedMatchWord: -1,
    matchCount: 0
  },

  onLoad: function () {
    this.setData({
      initialGroups: pinyinData.INITIAL_GROUPS,
      finalGroups: pinyinData.FINAL_GROUPS,
      wholeSyllables: pinyinData.WHOLE_SYLLABLES,
      tones: pinyinData.TONES
    });
  },

  // 切换标签
  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab,
      selectedPinyin: '',
      selectedType: '',
      selectedExample: {}
    });
    if (tab !== 'practice') {
      this.closePractice();
    }
  },

  // 选中拼音
  selectPinyin: function (e) {
    var pinyin = e.currentTarget.dataset.pinyin;
    var type = e.currentTarget.dataset.type;
    var example = {};

    if (type === 'initial') {
      example = pinyinData.INITIALS_EXAMPLES[pinyin] || {};
    } else if (type === 'final') {
      example = pinyinData.FINALS_EXAMPLES[pinyin] || {};
    } else if (type === 'whole') {
      example = pinyinData.WHOLE_SYLLABLES_EXAMPLES[pinyin] || {};
    }

    this.setData({
      selectedPinyin: pinyin,
      selectedType: type,
      selectedExample: example
    });

    // 发音
    this.speakText(pinyin);
  },

  // 播放声调
  playTone: function (e) {
    var tone = e.currentTarget.dataset.tone;
    var words = ['mā', 'má', 'mǎ', 'mà', 'ma'];
    this.speakText(words[tone]);
  },

  // 发音
  speakPinyin: function (e) {
    var text = e.currentTarget.dataset.text;
    this.speakText(text);
  },

  speakText: function (text) {
    try {
      var plugin = requirePlugin('WechatSI');
      if (plugin && plugin.textToSpeech) {
        plugin.textToSpeech({
          lang: 'zh_CN',
          tts: true,
          content: text,
          success: function (res) {
            if (res && res.filename) {
              var audio = wx.createInnerAudioContext();
              audio.src = res.filename;
              audio.play();
            }
          },
          fail: function (err) {
            console.error('TTS失败:', err);
            wx.showToast({ title: text, icon: 'none', duration: 1500 });
          }
        });
      } else {
        wx.showToast({ title: text, icon: 'none', duration: 1500 });
      }
    } catch (err) {
      console.error('插件加载失败:', err);
      wx.showToast({ title: text, icon: 'none', duration: 1500 });
    }
  },

  // ============ 练习模式 ============

  // 开始练习
  startPractice: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({
      practiceStarted: true,
      practiceFinished: false,
      practiceMode: mode,
      currentQuestion: 0,
      score: 0,
      correctCount: 0,
      showResult: false,
      isCorrect: false,
      selectedOption: ''
    });
    this.generateQuestion();
  },

  // 生成题目
  generateQuestion: function () {
    var mode = this.data.practiceMode;
    if (mode === 'identify') {
      this.generateIdentifyQuestion();
    } else if (mode === 'listen') {
      this.generateListenQuestion();
    } else if (mode === 'tone') {
      this.generateToneQuestion();
    } else if (mode === 'match') {
      this.generateMatchQuestion();
    }
  },

  // 看拼音选汉字
  generateIdentifyQuestion: function () {
    var allExamples = [];
    var keys = Object.keys(pinyinData.INITIALS_EXAMPLES);
    keys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.INITIALS_EXAMPLES[k].pinyin,
        word: pinyinData.INITIALS_EXAMPLES[k].word
      });
    });
    var fkeys = Object.keys(pinyinData.FINALS_EXAMPLES);
    fkeys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.FINALS_EXAMPLES[k].pinyin,
        word: pinyinData.FINALS_EXAMPLES[k].word
      });
    });

    var idx = Math.floor(Math.random() * allExamples.length);
    var correct = allExamples[idx];

    // 生成干扰项
    var options = [correct.word];
    var pool = allExamples.filter(function (item) { return item.word !== correct.word; });
    this.shuffleArray(pool);
    for (var i = 0; i < 3 && i < pool.length; i++) {
      options.push(pool[i].word);
    }
    this.shuffleArray(options);

    this.setData({
      questionData: {
        pinyin: correct.pinyin,
        answer: correct.word,
        options: options
      },
      showResult: false,
      selectedOption: '',
      isCorrect: false,
      correctAnswer: correct.word
    });
  },

  // 听音选拼音
  generateListenQuestion: function () {
    var allExamples = [];
    var keys = Object.keys(pinyinData.INITIALS_EXAMPLES);
    keys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.INITIALS_EXAMPLES[k].pinyin,
        word: pinyinData.INITIALS_EXAMPLES[k].word
      });
    });
    var fkeys = Object.keys(pinyinData.FINALS_EXAMPLES);
    fkeys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.FINALS_EXAMPLES[k].pinyin,
        word: pinyinData.FINALS_EXAMPLES[k].word
      });
    });

    var idx = Math.floor(Math.random() * allExamples.length);
    var correct = allExamples[idx];

    var options = [correct.pinyin];
    var pool = allExamples.filter(function (item) { return item.pinyin !== correct.pinyin; });
    this.shuffleArray(pool);
    for (var i = 0; i < 3 && i < pool.length; i++) {
      options.push(pool[i].pinyin);
    }
    this.shuffleArray(options);

    this.setData({
      questionData: {
        pinyin: correct.pinyin,
        word: correct.word,
        answer: correct.pinyin,
        options: options
      },
      showResult: false,
      selectedOption: '',
      isCorrect: false,
      correctAnswer: correct.pinyin
    });
  },

  // 声调标注
  generateToneQuestion: function () {
    var toneExamples = [
      { base: 'ma', answer: 'mā', word: '妈' },
      { base: 'ma', answer: 'má', word: '麻' },
      { base: 'ma', answer: 'mǎ', word: '马' },
      { base: 'ma', answer: 'mà', word: '骂' },
      { base: 'ba', answer: 'bā', word: '八' },
      { base: 'ba', answer: 'bá', word: '拔' },
      { base: 'ba', answer: 'bǎ', word: '把' },
      { base: 'ba', answer: 'bà', word: '爸' },
      { base: 'hua', answer: 'huā', word: '花' },
      { base: 'hua', answer: 'huà', word: '画' },
      { base: 'liu', answer: 'liú', word: '流' },
      { base: 'liu', answer: 'liù', word: '六' },
      { base: 'tian', answer: 'tiān', word: '天' },
      { base: 'tian', answer: 'tián', word: '甜' },
      { base: 'shu', answer: 'shū', word: '书' },
      { base: 'shu', answer: 'shù', word: '树' }
    ];

    var idx = Math.floor(Math.random() * toneExamples.length);
    var correct = toneExamples[idx];

    this.setData({
      questionData: {
        base: correct.base + ' → ' + correct.word,
        answer: correct.answer,
        options: pinyinData.TONES
      },
      showResult: false,
      selectedOption: '',
      isCorrect: false,
      correctAnswer: correct.answer
    });
  },

  // 连线模式
  generateMatchQuestion: function () {
    var allExamples = [];
    var keys = Object.keys(pinyinData.INITIALS_EXAMPLES);
    keys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.INITIALS_EXAMPLES[k].pinyin,
        word: pinyinData.INITIALS_EXAMPLES[k].word
      });
    });
    var fkeys = Object.keys(pinyinData.FINALS_EXAMPLES);
    fkeys.forEach(function (k) {
      allExamples.push({
        pinyin: pinyinData.FINALS_EXAMPLES[k].pinyin,
        word: pinyinData.FINALS_EXAMPLES[k].word
      });
    });

    this.shuffleArray(allExamples);
    var selected = allExamples.slice(0, 5);

    var matchPinyins = selected.map(function (item) {
      return { text: item.pinyin, answer: item.word, selected: false, matched: false };
    });
    var matchWords = selected.map(function (item) {
      return { text: item.word, answer: item.pinyin, selected: false, matched: false };
    });

    this.shuffleArray(matchWords);

    this.setData({
      matchPinyins: matchPinyins,
      matchWords: matchWords,
      selectedMatchPinyin: -1,
      selectedMatchWord: -1,
      matchCount: 0,
      showResult: false,
      questionData: { totalPairs: selected.length }
    });
  },

  // 选择连线
  selectMatch: function (e) {
    var type = e.currentTarget.dataset.type;
    var index = parseInt(e.currentTarget.dataset.index);

    if (type === 'pinyin') {
      var pinyins = this.data.matchPinyins;
      if (pinyins[index].matched) return;
      // 取消之前的选中
      pinyins.forEach(function (p, i) {
        if (!p.matched) pinyins[i].selected = (i === index);
      });
      this.setData({ matchPinyins: pinyins, selectedMatchPinyin: index });
    } else {
      var words = this.data.matchWords;
      if (words[index].matched) return;
      words.forEach(function (w, i) {
        if (!w.matched) words[i].selected = (i === index);
      });
      this.setData({ matchWords: words, selectedMatchWord: index });
    }

    // 检查是否匹配
    if (this.data.selectedMatchPinyin >= 0 && this.data.selectedMatchWord >= 0) {
      this.checkMatch();
    }
  },

  checkMatch: function () {
    var pi = this.data.selectedMatchPinyin;
    var wi = this.data.selectedMatchWord;
    var pinyins = this.data.matchPinyins;
    var words = this.data.matchWords;

    var pinyinItem = pinyins[pi];
    var wordItem = words[wi];

    if (pinyinItem.answer === wordItem.text && wordItem.answer === pinyinItem.text) {
      // 匹配成功
      pinyins[pi].matched = true;
      pinyins[pi].selected = false;
      words[wi].matched = true;
      words[wi].selected = false;
      var newCount = this.data.matchCount + 1;

      this.setData({
        matchPinyins: pinyins,
        matchWords: words,
        selectedMatchPinyin: -1,
        selectedMatchWord: -1,
        matchCount: newCount
      });

      // 检查是否全部完成
      if (newCount >= pinyins.length) {
        this.setData({
          showResult: true,
          isCorrect: true,
          correctCount: pinyins.length,
          score: 100
        });
      }
    } else {
      // 匹配失败，短暂高亮后重置
      var self = this;
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(function () {
        pinyins[pi].selected = false;
        words[wi].selected = false;
        self.setData({
          matchPinyins: pinyins,
          matchWords: words,
          selectedMatchPinyin: -1,
          selectedMatchWord: -1
        });
      }, 500);
    }
  },

  // 选择选项
  selectOption: function (e) {
    if (this.data.showResult) return;
    var option = e.currentTarget.dataset.option;
    var isCorrect = false;
    var correctAnswer = this.data.correctAnswer;

    if (this.data.practiceMode === 'tone') {
      isCorrect = (option === correctAnswer);
    } else {
      isCorrect = (option === correctAnswer);
    }

    var newCorrectCount = this.data.correctCount;
    if (isCorrect) {
      newCorrectCount++;
      wx.vibrateShort({ type: 'light' });
    } else {
      wx.vibrateShort({ type: 'heavy' });
    }

    this.setData({
      selectedOption: option,
      showResult: true,
      isCorrect: isCorrect,
      correctCount: newCorrectCount,
      score: Math.round(newCorrectCount / this.data.totalQuestions * 100)
    });
  },

  // 下一题
  nextQuestion: function () {
    var next = this.data.currentQuestion + 1;
    if (next >= this.data.totalQuestions) {
      // 练习结束
      var sc = Math.round(this.data.correctCount / this.data.totalQuestions * 100);
      this.setData({
        practiceFinished: true,
        score: sc,
        showResult: false
      });
    } else {
      this.setData({
        currentQuestion: next,
        showResult: false,
        selectedOption: ''
      });
      this.generateQuestion();
    }
  },

  // 重试练习
  retryPractice: function () {
    this.setData({
      practiceFinished: false,
      currentQuestion: 0,
      score: 0,
      correctCount: 0,
      showResult: false,
      selectedOption: ''
    });
    this.generateQuestion();
  },

  // 关闭练习
  closePractice: function () {
    this.setData({
      practiceStarted: false,
      practiceFinished: false,
      currentQuestion: 0,
      score: 0,
      correctCount: 0,
      showResult: false,
      selectedOption: ''
    });
  },

  // 数组洗牌
  shuffleArray: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
});
