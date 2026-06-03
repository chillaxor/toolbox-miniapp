var STORAGE_KEY = 'scoreboard_data';

var defaultColors = ['#4A90D9', '#E85D5D', '#50C878', '#F5A623', '#9B59B6'];

function loadState() {
  try {
    var data = wx.getStorageSync(STORAGE_KEY);
    if (data && data.players) {
      return data;
    }
  } catch (e) {}
  return { players: [] };
}

function saveState(players) {
  try {
    wx.setStorageSync(STORAGE_KEY, { players: players });
  } catch (e) {}
}

function findLeader(players) {
  if (!players || players.length === 0) return -1;
  var maxScore = -Infinity;
  var leaderIdx = -1;
  var tie = false;
  for (var i = 0; i < players.length; i++) {
    if (players[i].score > maxScore) {
      maxScore = players[i].score;
      leaderIdx = i;
      tie = false;
    } else if (players[i].score === maxScore) {
      tie = true;
    }
  }
  return tie ? -1 : leaderIdx;
}

Page({
  data: {
    players: [],
    leaderIdx: -1,
    showAddModal: false,
    newPlayerName: '',
    showScorePopup: false,
    selectedPlayerIdx: -1,
    customScoreInput: '',
    editMode: false,
    editPlayerName: ''
  },

  onLoad: function () {
    var state = loadState();
    var players = state.players || [];
    this.setData({
      players: players,
      leaderIdx: findLeader(players)
    });
  },

  onUnload: function () {
    saveState(this.data.players);
  },

  onShareAppMessage: function () {
    var players = this.data.players;
    var title = '计分板';
    if (players.length > 0) {
      var leaderIdx = findLeader(players);
      if (leaderIdx >= 0) {
        title = players[leaderIdx].name + ' 领先！得分 ' + players[leaderIdx].score;
      }
    }
    return {
      title: title,
      path: '/pages/tools/scoreboard/index'
    };
  },

  openAddModal: function () {
    this.setData({
      showAddModal: true,
      newPlayerName: ''
    });
  },

  closeAddModal: function () {
    this.setData({ showAddModal: false });
  },

  onNewNameInput: function (e) {
    this.setData({ newPlayerName: e.detail.value });
  },

  confirmAddPlayer: function () {
    var name = this.data.newPlayerName.trim();
    if (!name) {
      name = '选手' + (this.data.players.length + 1);
    }
    if (this.data.players.length >= 8) {
      wx.showToast({ title: '最多8名选手', icon: 'none' });
      return;
    }
    var players = this.data.players.slice();
    var colorIdx = players.length % defaultColors.length;
    players.push({
      name: name,
      score: 0,
      color: defaultColors[colorIdx]
    });
    this.setData({
      players: players,
      leaderIdx: findLeader(players),
      showAddModal: false,
      newPlayerName: ''
    });
    saveState(players);
  },

  openScorePopup: function (e) {
    var idx = e.currentTarget.dataset.idx;
    this.setData({
      showScorePopup: true,
      selectedPlayerIdx: idx,
      customScoreInput: ''
    });
  },

  closeScorePopup: function () {
    this.setData({
      showScorePopup: false,
      selectedPlayerIdx: -1,
      customScoreInput: ''
    });
  },

  adjustScore: function (e) {
    var delta = parseInt(e.currentTarget.dataset.delta, 10);
    var dsIdx = e.currentTarget.dataset.idx;
    var idx = (dsIdx !== undefined && dsIdx !== null && dsIdx !== '') ? parseInt(dsIdx, 10) : this.data.selectedPlayerIdx;
    if (idx < 0) return;
    var players = this.data.players.slice();
    players[idx] = Object.assign({}, players[idx], {
      score: players[idx].score + delta
    });
    this.setData({
      players: players,
      leaderIdx: findLeader(players)
    });
    saveState(players);
  },

  onCustomScoreInput: function (e) {
    this.setData({ customScoreInput: e.detail.value });
  },

  applyCustomScore: function () {
    var val = parseInt(this.data.customScoreInput, 10);
    if (isNaN(val)) {
      wx.showToast({ title: '请输入数字', icon: 'none' });
      return;
    }
    var idx = this.data.selectedPlayerIdx;
    if (idx < 0) return;
    var players = this.data.players.slice();
    players[idx] = Object.assign({}, players[idx], {
      score: players[idx].score + val
    });
    this.setData({
      players: players,
      leaderIdx: findLeader(players),
      customScoreInput: ''
    });
    saveState(players);
  },

  onLongPressPlayer: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var self = this;
    this.setData({
      editMode: true,
      editPlayerName: this.data.players[idx].name,
      selectedPlayerIdx: idx,
      showScorePopup: false
    });
    wx.showModal({
      title: '编辑选手名',
      editable: true,
      placeholderText: '输入新名称',
      success: function (res) {
        if (res.confirm && res.content && res.content.trim()) {
          var players = self.data.players.slice();
          var i = self.data.selectedPlayerIdx;
          players[i] = Object.assign({}, players[i], {
            name: res.content.trim()
          });
          self.setData({
            players: players,
            editMode: false
          });
          saveState(players);
        } else {
          self.setData({ editMode: false });
        }
      }
    });
  },

  removePlayer: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var self = this;
    var name = this.data.players[idx].name;
    wx.showModal({
      title: '移除选手',
      content: '确定移除 ' + name + ' 吗？',
      success: function (res) {
        if (res.confirm) {
          var players = self.data.players.slice();
          players.splice(idx, 1);
          // Reassign colors
          for (var i = 0; i < players.length; i++) {
            players[i] = Object.assign({}, players[i], {
              color: defaultColors[i % defaultColors.length]
            });
          }
          self.setData({
            players: players,
            leaderIdx: findLeader(players)
          });
          saveState(players);
        }
      }
    });
  },

  resetScores: function () {
    var self = this;
    wx.showModal({
      title: '重置计分板',
      content: '确定将所有选手的分数归零吗？',
      success: function (res) {
        if (res.confirm) {
          var players = self.data.players.slice();
          for (var i = 0; i < players.length; i++) {
            players[i] = Object.assign({}, players[i], { score: 0 });
          }
          self.setData({
            players: players,
            leaderIdx: findLeader(players)
          });
          saveState(players);
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  preventBubble: function () {}
});
