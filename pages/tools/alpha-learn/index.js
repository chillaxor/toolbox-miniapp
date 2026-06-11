var alphaData = require('../../../utils/alpha-data.js');
var app = getApp();

Page({
  data: {
    currentTab: 'cards',
    alphaList: [],
    currentLetter: null,
    currentIndex: 0,
    vowels: [],
    consonants: [],
    // 练习
    practiceStarted: false,
    practiceMode: '',
    practiceFinished: false,
    currentQ: 0,
    totalQ: 10,
    score: 0,
    correctCnt: 0,
    qData: null,
    showResult: false,
    isCorrect: false,
    selOpt: '',
    correctAns: '',
    matchUpper: [],
    matchLower: [],
    matchSelUpper: -1,
    matchSelLower: -1,
    matchDoneCnt: 0,
    allQuestions: []
  },

  onLoad: function () {
    this.initData();
  },

  initData: function () {
    var ALPHABET = alphaData.ALPHABET;
    var VOWELS = alphaData.VOWELS;
    var alphaList = ALPHABET.map(function (item, idx) {
      return {
        letter: item.letter,
        lower: item.lower,
        isVowel: VOWELS.indexOf(item.letter) >= 0,
        index: idx
      };
    });
    var vowels = [];
    var consonants = [];
    ALPHABET.forEach(function (item, idx) {
      var info = { letter: item.letter, phonetic: item.phonetic, index: idx };
      if (VOWELS.indexOf(item.letter) >= 0) {
        vowels.push(info);
      } else {
        consonants.push(info);
      }
    });
    this.setData({
      alphaList: alphaList,
      currentLetter: ALPHABET[0],
      currentIndex: 0,
      vowels: vowels,
      consonants: consonants
    });
  },

  switchTab: function (e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  prevLetter: function () {
    if (this.data.currentIndex <= 0) return;
    var idx = this.data.currentIndex - 1;
    this.setData({
      currentIndex: idx,
      currentLetter: alphaData.ALPHABET[idx]
    });
  },

  nextLetter: function () {
    if (this.data.currentIndex >= 25) return;
    var idx = this.data.currentIndex + 1;
    this.setData({
      currentIndex: idx,
      currentLetter: alphaData.ALPHABET[idx]
    });
  },

  jumpToLetter: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({
      currentIndex: idx,
      currentLetter: alphaData.ALPHABET[idx],
      currentTab: 'cards'
    });
  },

  speakLetter: function (e) {
    var text = e.currentTarget.dataset.text;
    this.speakText(text);
  },

  speakText: function (text) {
    try {
      if (typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
        speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onerror = function () {
          wx.showToast({ title: text, icon: 'none', duration: 1500 });
        };
        speechSynthesis.speak(utterance);
        return;
      }
    } catch (e) {
      console.warn('Web Speech API 不可用:', e);
    }
    wx.showToast({ title: text, icon: 'none', duration: 1500 });
  },

  // 练习相关
  startPractice: function (e) {
    var mode = e.currentTarget.dataset.mode;
    if (mode === 'match') {
      this.initMatch();
    } else {
      this.generateQuestions(mode);
    }
    this.setData({
      practiceStarted: true,
      practiceMode: mode,
      practiceFinished: false,
      currentQ: 0,
      score: 0,
      correctCnt: 0,
      showResult: false,
      selOpt: ''
    });
    if (mode !== 'match') {
      this.loadQuestion(0);
    }
  },

  generateQuestions: function (mode) {
    var ALPHABET = alphaData.ALPHABET;
    var WORDS = alphaData.SIMPLE_WORDS;
    var questions = [];
    var indices = this.shuffleArray([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);

    for (var i = 0; i < 10; i++) {
      var idx = indices[i];
      var item = ALPHABET[idx];
      var wrongIndices = [];
      while (wrongIndices.length < 3) {
        var r = Math.floor(Math.random() * 26);
        if (r !== idx && wrongIndices.indexOf(r) < 0) {
          wrongIndices.push(r);
        }
      }
      var options = [item.letter];
      wrongIndices.forEach(function (wi) {
        options.push(ALPHABET[wi].letter);
      });
      options = this.shuffleArray(options);

      if (mode === 'identify' || mode === 'word') {
        var wordObj = WORDS[idx % WORDS.length] || WORDS[0];
        questions.push({
          letter: item.letter,
          word: wordObj.word.charAt(0).toUpperCase() + wordObj.word.slice(1),
          chinese: wordObj.chinese,
          emoji: wordObj.emoji,
          answer: item.letter,
          options: options,
          rest: wordObj.word.slice(1)
        });
      } else if (mode === 'listen') {
        questions.push({
          letter: item.letter,
          answer: item.letter,
          options: options
        });
      }
    }
    this.setData({ allQuestions: questions, totalQ: questions.length });
  },

  initMatch: function () {
    var ALPHABET = alphaData.ALPHABET;
    var indices = this.shuffleArray([0,1,2,3,4,5,6,7,8,9]);
    var upper = [];
    var lower = [];
    indices.forEach(function (idx) {
      upper.push({ letter: ALPHABET[idx].letter, selected: false, matched: false, idx: idx });
      lower.push({ letter: ALPHABET[idx].lower, selected: false, matched: false, idx: idx });
    });
    lower = this.shuffleArray(lower);
    this.setData({
      matchUpper: upper,
      matchLower: lower,
      matchSelUpper: -1,
      matchSelLower: -1,
      matchDoneCnt: 0,
      totalQ: 10,
      score: 0,
      correctCnt: 0
    });
  },

  loadQuestion: function (idx) {
    var q = this.data.allQuestions[idx];
    this.setData({
      qData: q,
      showResult: false,
      isCorrect: false,
      selOpt: '',
      correctAns: q.answer
    });
  },

  selectOption: function (e) {
    if (this.data.showResult) return;
    var opt = e.currentTarget.dataset.opt;
    var q = this.data.qData;
    var correct = opt === q.answer;
    var correctCnt = this.data.correctCnt + (correct ? 1 : 0);
    var totalQ = this.data.totalQ;
    var score = Math.round(correctCnt / totalQ * 100);
    wx.vibrateShort({ type: correct ? 'light' : 'heavy' });
    this.setData({
      showResult: true,
      isCorrect: correct,
      selOpt: opt,
      correctCnt: correctCnt,
      score: score
    });
  },

  nextQ: function () {
    var next = this.data.currentQ + 1;
    if (next >= this.data.totalQ) {
      this.setData({
        practiceFinished: true,
        score: Math.round(this.data.correctCnt / this.data.totalQ * 100)
      });
      return;
    }
    this.setData({ currentQ: next });
    this.loadQuestion(next);
  },

  selMatch: function (e) {
    var type = e.currentTarget.dataset.type;
    var idx = e.currentTarget.dataset.idx;
    var upper = this.data.matchUpper;
    var lower = this.data.matchLower;

    if (type === 'upper') {
      if (upper[idx].matched) return;
      upper.forEach(function (item) { item.selected = false; });
      upper[idx].selected = true;
      this.setData({ matchUpper: upper, matchSelUpper: idx });
    } else {
      if (lower[idx].matched) return;
      lower.forEach(function (item) { item.selected = false; });
      lower[idx].selected = true;
      this.setData({ matchLower: lower, matchSelLower: idx });
    }

    // Check match
    var selU = this.data.matchSelUpper;
    var selL = this.data.matchLower;
    if (type === 'upper') selU = idx;
    else selL = idx;

    var su = this.data.matchUpper[selU >= 0 ? selU : -1];
    var sl = this.data.matchLower[type === 'lower' ? idx : this.data.matchSelLower];

    if (selU >= 0 && this.data.matchSelLower >= 0) {
      su = this.data.matchUpper[selU];
      sl = this.data.matchLower[this.data.matchSelLower];
      if (su.idx === sl.idx) {
        su.matched = true;
        sl.matched = true;
        su.selected = false;
        sl.selected = false;
        var doneCnt = this.data.matchDoneCnt + 1;
        var correctCnt = this.data.correctCnt + 1;
        wx.vibrateShort({ type: 'light' });
        this.setData({
          matchUpper: upper,
          matchLower: lower,
          matchSelUpper: -1,
          matchSelLower: -1,
          matchDoneCnt: doneCnt,
          correctCnt: correctCnt,
          score: Math.round(correctCnt / this.data.totalQ * 100)
        });
        if (doneCnt >= this.data.totalQ) {
          var self = this;
          setTimeout(function () {
            self.setData({ practiceFinished: true });
          }, 500);
        }
      } else {
        wx.vibrateShort({ type: 'heavy' });
        su.selected = false;
        sl.selected = false;
        this.setData({
          matchUpper: upper,
          matchLower: lower,
          matchSelUpper: -1,
          matchSelLower: -1
        });
      }
    }
  },

  retryPractice: function (e) {
    var mode = this.data.practiceMode;
    this.setData({
      practiceStarted: false,
      practiceFinished: false,
      currentQ: 0,
      score: 0,
      correctCnt: 0,
      showResult: false,
      selOpt: ''
    });
    var self = this;
    setTimeout(function () {
      self.startPractice({ currentTarget: { dataset: { mode: mode } } });
    }, 100);
  },

  closePractice: function () {
    this.setData({
      practiceStarted: false,
      practiceMode: '',
      practiceFinished: false,
      currentQ: 0,
      score: 0,
      correctCnt: 0,
      showResult: false
    });
  },

  shuffleArray: function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  },

  onShareAppMessage: function () {
    return {
      title: '🔤 英语字母卡 - 趣味学英语',
      path: '/pages/tools/alpha-learn/index'
    };
  }
});
