var calendarUtil = require('../../../utils/calendar.js');
var lunarUtil = require('../../../utils/lunar.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    year: 2026,
    month: 5,
    grid: [],
    selectedDay: null,
    isFavorite: false
  },

  onLoad: function () {
    var now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.loadCalendar();
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('calendar') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('calendar');
    this.setData({ isFavorite: fav });
  },

  loadCalendar: function () {
    var grid = calendarUtil.getCalendarGrid(this.data.year, this.data.month);
    this.setData({ grid: grid });
  },

  onPrevMonth: function () {
    var year = this.data.year;
    var month = this.data.month - 1;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year: year, month: month, selectedDay: null });
    this.loadCalendar();
  },

  onNextMonth: function () {
    var year = this.data.year;
    var month = this.data.month + 1;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year: year, month: month, selectedDay: null });
    this.loadCalendar();
  },

  onBackToToday: function () {
    var now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDay: null
    });
    this.loadCalendar();
  },

  onDayTap: function (e) {
    var cell = e.detail.cell;
    this.setData({ selectedDay: cell });
  },

  onShareAppMessage: function () {
    return {
      title: '万年历 - 工具箱',
      path: '/packages/toolsA/calendar/index'
    };
  }
});
