var storage = require('../../../utils/storage.js');

function updatePct(options, totalVotes) {
  for (var i = 0; i < options.length; i++) {
    if (totalVotes > 0) {
      var p = options[i].votes / totalVotes * 100;
      options[i].pct = p;
      options[i].pctText = p.toFixed(1);
    } else {
      options[i].pct = 0;
      options[i].pctText = '0';
    }
  }
}

Page({
  data: {
    title: '',
    options: [
      { id: 1, text: '', votes: 0 },
      { id: 2, text: '', votes: 0 }
    ],
    isStarted: false,
    showResult: false,
    totalVotes: 0,
    winner: null,
    history: []
  },

  _nextId: 3,

  onLoad: function () {
    var history = storage.getSync('vote_history', []);
    this.setData({ history: history });
  },

  onTitleInput: function (e) {
    this.setData({ title: e.detail.value });
  },

  onOptionInput: function (e) {
    var id = e.currentTarget.dataset.id;
    var options = this.data.options;
    for (var i = 0; i < options.length; i++) {
      if (options[i].id === id) {
        options[i].text = e.detail.value;
        break;
      }
    }
    this.setData({ options: options });
  },

  onAddOption: function () {
    if (this.data.options.length >= 8) {
      wx.showToast({ title: '最多8个选项', icon: 'none' });
      return;
    }
    var options = this.data.options;
    options.push({ id: this._nextId++, text: '', votes: 0 });
    this.setData({ options: options });
  },

  onRemoveOption: function (e) {
    if (this.data.options.length <= 2) {
      wx.showToast({ title: '至少需要2个选项', icon: 'none' });
      return;
    }
    var id = e.currentTarget.dataset.id;
    var options = this.data.options.filter(function (o) { return o.id !== id; });
    this.setData({ options: options });
  },

  onStart: function () {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入投票标题', icon: 'none' });
      return;
    }
    var validOptions = this.data.options.filter(function (o) { return o.text.trim(); });
    if (validOptions.length < 2) {
      wx.showToast({ title: '至少需要2个有效选项', icon: 'none' });
      return;
    }
    var options = validOptions.map(function (o) {
      return { id: o.id, text: o.text, votes: 0, pct: 0, pctText: '0' };
    });
    this.setData({ options: options, isStarted: true, showResult: false, totalVotes: 0 });
  },

  onVote: function (e) {
    var id = e.currentTarget.dataset.id;
    var options = this.data.options;
    var totalVotes = this.data.totalVotes;
    for (var i = 0; i < options.length; i++) {
      if (options[i].id === id) {
        options[i].votes++;
        totalVotes++;
        break;
      }
    }
    updatePct(options, totalVotes);
    this.setData({ options: options, totalVotes: totalVotes });
  },

  onShowResult: function () {
    if (this.data.totalVotes === 0) {
      wx.showToast({ title: '还没有人投票', icon: 'none' });
      return;
    }
    var options = this.data.options;
    var maxVotes = 0;
    var winner = null;
    for (var i = 0; i < options.length; i++) {
      if (options[i].votes > maxVotes) {
        maxVotes = options[i].votes;
        winner = options[i];
      }
    }
    
    // 保存到历史
    var history = this.data.history.slice(0, 19);
    history.unshift({
      title: this.data.title,
      options: options.map(function (o) { return { text: o.text, votes: o.votes }; }),
      totalVotes: this.data.totalVotes,
      winner: winner.text,
      time: new Date().toLocaleString()
    });
    storage.setSync('vote_history', history);
    
    this.setData({ showResult: true, winner: winner, history: history });
  },

  onReset: function () {
    this._nextId = 3;
    this.setData({
      title: '',
      options: [
        { id: 1, text: '', votes: 0 },
        { id: 2, text: '', votes: 0 }
      ],
      isStarted: false,
      showResult: false,
      totalVotes: 0,
      winner: null
    });
  },

  onClearHistory: function () {
    this.setData({ history: [] });
    storage.setSync('vote_history', []);
  },

  onShareAppMessage: function () {
    return { title: '投票决策 - 快速发起投票', path: '/packages/toolsB/vote/index' };
  }
});
