var storage = require('../../../utils/storage.js');

var KEY = 'anniversary_list';

function loadList() {
  return wx.getStorageSync(KEY) || [];
}

function saveList(list) {
  wx.setStorageSync(KEY, list);
}

function daysBetween(dateStr) {
  var parts = dateStr.split('-');
  var target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target - now) / 86400000);
}

function daysSince(dateStr) {
  var parts = dateStr.split('-');
  var target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.floor((now - target) / 86400000);
}

Page({
  data: {
    isFavorite: false,
    list: [],
    showAdd: false,
    newName: '',
    newDate: '',
    newRepeat: true
  },
  onLoad: function () {
    this.checkFavorite();
    this.refreshList();
  },
  onShow: function () {
    this.checkFavorite();
    this.refreshList();
  },
  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('anniversary') });
  },
  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('anniversary') });
  },
  refreshList: function () {
    var raw = loadList();
    var list = [];
    for (var i = 0; i < raw.length; i++) {
      var item = raw[i];
      var days = daysBetween(item.date);
      var past = days < 0;
      var absDays = Math.abs(days);
      // 如果已过且设置了重复，计算下一个纪念日
      if (past && item.repeat) {
        var nextYear = new Date().getFullYear();
        var parts = item.date.split('-');
        var nextDate = new Date(nextYear, Number(parts[1]) - 1, Number(parts[2]));
        if (nextDate < new Date()) nextDate.setFullYear(nextDate.getFullYear() + 1);
        var dateStr = nextDate.getFullYear() + '-' + (nextDate.getMonth() + 1 < 10 ? '0' : '') + (nextDate.getMonth() + 1) + '-' + (nextDate.getDate() < 10 ? '0' : '') + nextDate.getDate();
        days = daysBetween(dateStr);
        absDays = Math.abs(days);
        past = days < 0;
      }
      list.push({
        id: item.id,
        name: item.name,
        date: item.date,
        repeat: item.repeat,
        days: days,
        absDays: absDays,
        isPast: past,
        isToday: days === 0,
        passedDays: daysSince(item.date)
      });
    }
    // 按距离排序，最近的在前
    list.sort(function (a, b) { return a.days - b.days; });
    this.setData({ list: list });
  },
  onShowAdd: function () {
    this.setData({ showAdd: true, newName: '', newDate: '', newRepeat: true });
  },
  onCancelAdd: function () {
    this.setData({ showAdd: false });
  },
  onNameInput: function (e) {
    this.setData({ newName: e.detail.value });
  },
  onDateChange: function (e) {
    this.setData({ newDate: e.detail.value });
  },
  onRepeatChange: function (e) {
    this.setData({ newRepeat: e.detail.value });
  },
  onConfirmAdd: function () {
    if (!this.data.newName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    if (!this.data.newDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    var raw = loadList();
    raw.push({
      id: Date.now().toString(),
      name: this.data.newName.trim(),
      date: this.data.newDate,
      repeat: this.data.newRepeat
    });
    saveList(raw);
    this.setData({ showAdd: false });
    this.refreshList();
    wx.showToast({ title: '添加成功', icon: 'success' });
  },
  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: function (res) {
        if (res.confirm) {
          var raw = loadList();
          var filtered = [];
          for (var i = 0; i < raw.length; i++) {
            if (raw[i].id !== id) filtered.push(raw[i]);
          }
          saveList(filtered);
          self.refreshList();
        }
      }
    });
  },
  onShareAppMessage: function () {
    return { title: '纪念日倒计时 - 工具箱', path: '/pages/tools/anniversary/index' };
  }
});
