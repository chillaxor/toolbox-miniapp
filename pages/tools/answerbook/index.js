var storage = require('../../../utils/storage.js');

var answers = [
  { text: '去试试吧，结果不会让你失望', emoji: '✅', type: 'positive' },
  { text: '现在不是最佳时机，再等等', emoji: '⏳', type: 'neutral' },
  { text: '别犹豫了，勇敢去做', emoji: '💪', type: 'positive' },
  { text: '答案就在你心里', emoji: '❤️', type: 'neutral' },
  { text: '换个角度想想，会有新的发现', emoji: '🔄', type: 'neutral' },
  { text: '好运气正在路上', emoji: '🍀', type: 'positive' },
  { text: '这件事值得去做', emoji: '👍', type: 'positive' },
  { text: '放手吧，别执着了', emoji: '🕊️', type: 'negative' },
  { text: '保持现状就好', emoji: '🧘', type: 'neutral' },
  { text: '意想不到的好结果在等你', emoji: '🎁', type: 'positive' },
  { text: '听从内心的声音', emoji: '🎵', type: 'neutral' },
  { text: '现在还不是时候', emoji: '🌙', type: 'negative' },
  { text: '你会做出正确的选择', emoji: '⭐', type: 'positive' },
  { text: '别着急，好事多磨', emoji: '🌊', type: 'neutral' },
  { text: '大胆去追求吧', emoji: '🚀', type: 'positive' },
  { text: '有时候不说也是一种回答', emoji: '🤫', type: 'neutral' },
  { text: '相信直觉，它不会骗你', emoji: '👁️', type: 'positive' },
  { text: '先放一放，改天再想', emoji: '📅', type: 'neutral' },
  { text: '你已经有了答案', emoji: '📖', type: 'neutral' },
  { text: '这件事值得三思而后行', emoji: '🤔', type: 'neutral' },
  { text: '顺其自然吧', emoji: '🍃', type: 'neutral' },
  { text: '别问了，去做就对了', emoji: '⚡', type: 'positive' },
  { text: '会有贵人相助', emoji: '🤝', type: 'positive' },
  { text: '也许你该问问身边的人', emoji: '👥', type: 'neutral' },
  { text: '坚持下去，胜利在望', emoji: '🏆', type: 'positive' },
  { text: '这不是你真正想要的', emoji: '💔', type: 'negative' },
  { text: '前方有惊喜等着你', emoji: '🎉', type: 'positive' },
  { text: '时机已到，把握当下', emoji: '⏰', type: 'positive' },
  { text: '别害怕，有安全感的', emoji: '🛡️', type: 'positive' },
  { text: '水到渠成，不必强求', emoji: '💧', type: 'neutral' },
  { text: '想想最坏的结果，你能接受吗', emoji: '⚖️', type: 'neutral' },
  { text: '缘分未到，耐心等待', emoji: '🌸', type: 'neutral' },
  { text: '试试又不会怎样', emoji: '🎲', type: 'positive' },
  { text: '否极泰来', emoji: '☯️', type: 'positive' },
  { text: '远离为妙', emoji: '🚧', type: 'negative' },
  { text: '你值得更好的', emoji: '👑', type: 'positive' },
  { text: '当你问出这个问题，心里已经有答案了', emoji: '💡', type: 'neutral' },
  { text: '一切皆有可能', emoji: '🌈', type: 'positive' },
  { text: '随心所欲不逾矩', emoji: '🎋', type: 'neutral' },
  { text: '今天不适合做决定，明天再想', emoji: '😴', type: 'neutral' },
  { text: '放手去做，不要后悔', emoji: '🔥', type: 'positive' },
  { text: '冥冥之中自有天意', emoji: '✨', type: 'neutral' },
  { text: '结果可能超乎你想象', emoji: '🔮', type: 'positive' },
  { text: '珍惜眼前人', emoji: '💕', type: 'positive' },
  { text: '是时候做个了断了', emoji: '✂️', type: 'neutral' },
  { text: '这个选择会让你成长', emoji: '🌱', type: 'positive' },
  { text: '先照顾好自己', emoji: '🫶', type: 'neutral' },
  { text: '别让别人替你做决定', emoji: '🦁', type: 'neutral' },
  { text: '你已经足够好了', emoji: '🌟', type: 'positive' },
  { text: '生活会给你的答案', emoji: '🌻', type: 'neutral' }
];

var history = [];

Page({
  data: {
    isFavorite: false,
    question: '',
    currentAnswer: null,
    isFlipping: false,
    showResult: false,
    history: [],
    questionCount: 0
  },

  onLoad: function () {
    this.checkFavorite();
    var h = wx.getStorageSync('answerbook_history') || [];
    this.setData({
      history: h.slice(0, 20),
      questionCount: h.length
    });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('answerbook') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('answerbook');
    this.setData({ isFavorite: fav });
  },

  onQuestionInput: function (e) {
    this.setData({ question: e.detail.value });
  },

  onAsk: function () {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先写下你的问题', icon: 'none' });
      return;
    }
    if (this.data.isFlipping) return;

    var idx = Math.floor(Math.random() * answers.length);
    var answer = answers[idx];

    this.setData({
      isFlipping: true,
      showResult: false
    });

    var that = this;
    setTimeout(function () {
      var h = that.data.history || [];
      h.unshift({
        question: that.data.question,
        answer: answer.text,
        emoji: answer.emoji,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      });
      if (h.length > 20) h = h.slice(0, 20);
      wx.setStorageSync('answerbook_history', h);

      that.setData({
        currentAnswer: answer,
        isFlipping: false,
        showResult: true,
        history: h,
        questionCount: that.data.questionCount + 1
      });
    }, 1500);
  },

  onReset: function () {
    this.setData({
      question: '',
      currentAnswer: null,
      showResult: false
    });
  },

  onClearHistory: function () {
    wx.setStorageSync('answerbook_history', []);
    this.setData({ history: [], questionCount: 0 });
  },

  onShareAppMessage: function () {
    return {
      title: '答案之书 — 迷茫时帮你做决定',
      path: '/pages/tools/answerbook/index'
    };
  }
});
