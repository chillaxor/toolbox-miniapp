var storage = require('../../utils/storage.js');

Page({
  data: {
    historyList: [],
    groupedHistory: [],
    isEmpty: false
  },

  onLoad: function () { this.loadHistory(); },
  onShow: function () { this.loadHistory(); },

  loadHistory: function () {
    var history = storage.getHistory();
    if (history.length === 0) {
      this.setData({ isEmpty: true, groupedHistory: [] });
      return;
    }

    // 按日期分组
    var groups = {};
    for (var i = 0; i < history.length; i++) {
      var item = history[i];
      var date = new Date(item.timestamp);
      var dateStr = date.getFullYear() + '-' + (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' : '') + date.getDate();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      // 添加时间显示
      var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      item.timeStr = hours + ':' + minutes;
      groups[dateStr].push(item);
    }

    var grouped = [];
    var keys = Object.keys(groups).sort().reverse();
    for (var j = 0; j < keys.length; j++) {
      grouped.push({ date: keys[j], items: groups[keys[j]] });
    }

    this.setData({ isEmpty: false, groupedHistory: grouped });
  },

  onItemTap: function (e) {
    var toolId = e.currentTarget.dataset.toolid;
    var toolsData = require('../../data/tools.js');
    var tool = toolsData.getToolById(toolId);
    if (tool) {
      wx.navigateTo({ url: tool.path });
    }
  },

  onClearHistory: function () {
    var self = this;
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有使用记录吗？',
      success: function (res) {
        if (res.confirm) {
          storage.clearHistory();
          self.setData({ isEmpty: true, groupedHistory: [] });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  onShareAppMessage: function () { return { title: '使用历史 - 工具箱', path: '/pages/history/index' }; }
});
