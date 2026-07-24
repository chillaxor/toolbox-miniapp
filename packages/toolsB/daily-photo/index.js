var mediaCheck = require('../../../utils/mediaCheck.js');
var storageKey = 'daily-photo-data';

Page({
  data: {
    totalPhotos: 0,
    totalDays: 0,
    streakDays: 0,
    todayStr: '',
    todayPhoto: null,
    viewMode: 'timeline',
    timelineData: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calYear: 0,
    calMonth: 0,
    calDays: [],
    showNote: false,
    noteText: '',
    pendingPhoto: null,
    showPreview: false,
    previewPhotos: [],
    previewIndex: 0
  },

  onLoad: function () {
    var now = new Date();
    this.setData({
      todayStr: this.formatDate(now),
      calYear: now.getFullYear(),
      calMonth: now.getMonth() + 1
    });
    this.loadPhotos();
  },

  onShow: function () {
    this.loadPhotos();
  },

  formatNum: function (n) {
    return n < 10 ? '0' + n : '' + n;
  },

  formatDate: function (d) {
    return d.getFullYear() + '-' + this.formatNum(d.getMonth() + 1) + '-' + this.formatNum(d.getDate());
  },

  formatTime: function (d) {
    return this.formatNum(d.getHours()) + ':' + this.formatNum(d.getMinutes()) + ':' + this.formatNum(d.getSeconds());
  },

  loadPhotos: function () {
    var data = wx.getStorageSync(storageKey) || {};
    var allPhotos = [];
    var dateKeys = Object.keys(data).sort().reverse();
    var photoMap = data;
    var today = this.formatDate(new Date());

    // 收集所有照片
    for (var i = 0; i < dateKeys.length; i++) {
      var dk = dateKeys[i];
      var photos = photoMap[dk] || [];
      for (var j = 0; j < photos.length; j++) {
        var p = photos[j];
        p.dateStr = dk;
        p.timeStr = this.formatTime(new Date(p.timestamp));
        allPhotos.push(p);
      }
    }

    // 时光轴数据
    var timelineData = [];
    for (var k = 0; k < dateKeys.length; k++) {
      var dateKey = dateKeys[k];
      var dPhotos = (photoMap[dateKey] || []).map(function (p) {
        p.dateStr = dateKey;
        p.timeStr = new Date(p.timestamp).toTimeString().slice(0, 8);
        return p;
      });
      if (dPhotos.length > 0) {
        timelineData.push({ date: dateKey, dateStr: this.getDisplayDate(dateKey), photos: dPhotos });
      }
    }

    // 今日照片
    var todayPhoto = photoMap[today] && photoMap[today].length > 0 ? photoMap[today][0] : null;

    // 连续打卡天数
    var streakDays = 0;
    var checkDate = new Date();
    while (true) {
      var ds = this.formatDate(checkDate);
      if (photoMap[ds] && photoMap[ds].length > 0) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.setData({
      totalPhotos: allPhotos.length,
      totalDays: dateKeys.length,
      streakDays: streakDays,
      todayPhoto: todayPhoto,
      timelineData: timelineData
    });

    this.buildCalendar();
  },

  getDisplayDate: function (dateStr) {
    var today = this.formatDate(new Date());
    var yesterday = this.formatDate(new Date(Date.now() - 86400000));
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    var parts = dateStr.split('-');
    return parts[0] + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
  },

  onTakePhoto: function () {
    var that = this;
    mediaCheck.chooseMediaWithCheck({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      success: function (res) {
        var tempFile = res.tempFiles[0].tempFilePath;
        that.setData({
          pendingPhoto: {
            tempFilePath: tempFile,
            timestamp: Date.now()
          },
          showNote: true,
          noteText: ''
        });
      }
    });
  },

  onNoteInput: function (e) {
    this.setData({ noteText: e.detail.value });
  },

  onCloseNote: function () {
    if (this.data.pendingPhoto) {
      this.savePhoto('');
    }
    this.setData({ showNote: false, pendingPhoto: null });
  },

  onSaveNote: function () {
    this.savePhoto(this.data.noteText);
    this.setData({ showNote: false, pendingPhoto: null });
  },

  savePhoto: function (note) {
    var photo = this.data.pendingPhoto;
    if (!photo) return;

    var today = this.formatDate(new Date());
    var data = wx.getStorageSync(storageKey) || {};
    if (!data[today]) data[today] = [];

    // 保存图片到本地
    var fs = wx.getFileSystemManager();
    var ext = photo.tempFilePath.split('.').pop() || 'jpg';
    var fileName = 'dp_' + Date.now() + '.' + ext;
    var savedPath = wx.env.USER_DATA_PATH + '/daily-photo/' + fileName;

    try {
      fs.mkdirSync(wx.env.USER_DATA_PATH + '/daily-photo', true);
    } catch (e) {}

    try {
      fs.copyFileSync(photo.tempFilePath, savedPath);
    } catch (e) {
      savedPath = photo.tempFilePath;
    }

    data[today].push({
      path: savedPath,
      timestamp: photo.timestamp,
      note: note
    });

    wx.setStorageSync(storageKey, data);
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.loadPhotos();
  },

  onSwitchView: function (e) {
    this.setData({ viewMode: e.currentTarget.dataset.mode });
  },

  // 日历相关
  buildCalendar: function () {
    var year = this.data.calYear;
    var month = this.data.calMonth;
    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();
    var daysInPrev = new Date(year, month - 1, 0).getDate();
    var today = this.formatDate(new Date());
    var data = wx.getStorageSync(storageKey) || {};
    var calDays = [];

    // 上月补齐
    for (var i = firstDay - 1; i >= 0; i--) {
      var d = daysInPrev - i;
      var ds = this.formatDate(new Date(year, month - 2, d));
      calDays.push({ day: d, dateStr: ds, inMonth: false, isToday: false, photo: null });
    }

    // 本月
    for (var j = 1; j <= daysInMonth; j++) {
      var dateStr = year + '-' + this.formatNum(month) + '-' + this.formatNum(j);
      var dayPhotos = data[dateStr] || [];
      var photo = dayPhotos.length > 0 ? (dayPhotos[0].tempFilePath || dayPhotos[0].path) : null;
      calDays.push({
        day: j,
        dateStr: dateStr,
        inMonth: true,
        isToday: dateStr === today,
        photo: photo
      });
    }

    // 下月补齐
    var remaining = 42 - calDays.length;
    for (var k = 1; k <= remaining; k++) {
      var ds2 = this.formatDate(new Date(year, month, k));
      calDays.push({ day: k, dateStr: ds2, inMonth: false, isToday: false, photo: null });
    }

    this.setData({ calDays: calDays });
  },

  onPrevMonth: function () {
    var m = this.data.calMonth - 1;
    var y = this.data.calYear;
    if (m < 1) { m = 12; y--; }
    this.setData({ calYear: y, calMonth: m });
    this.buildCalendar();
  },

  onNextMonth: function () {
    var m = this.data.calMonth + 1;
    var y = this.data.calYear;
    if (m > 12) { m = 1; y++; }
    this.setData({ calYear: y, calMonth: m });
    this.buildCalendar();
  },

  onCalDayTap: function (e) {
    var dateStr = e.currentTarget.dataset.date;
    var data = wx.getStorageSync(storageKey) || {};
    var photos = data[dateStr];
    if (!photos || photos.length === 0) return;

    var that = this;
    wx.showActionSheet({
      itemList: ['查看当日照片(' + photos.length + '张)', '拍照记录这一天'],
      success: function (res) {
        if (res.tapIndex === 0) {
          var previewPhotos = photos.map(function (p) {
            p.dateStr = dateStr;
            p.timeStr = that.formatTime(new Date(p.timestamp));
            return p;
          });
          that.setData({
            showPreview: true,
            previewPhotos: previewPhotos,
            previewIndex: 0
          });
        } else if (res.tapIndex === 1) {
          that.setData({
            calSelectedDate: dateStr
          });
          mediaCheck.chooseMediaWithCheck({
            count: 1,
            mediaType: ['image'],
            sourceType: ['camera', 'album'],
            camera: 'back',
            success: function (res2) {
              var tempFile = res2.tempFiles[0].tempFilePath;
              that.setData({
                pendingPhoto: { tempFilePath: tempFile, timestamp: Date.now() },
                showNote: true,
                noteText: ''
              });
            }
          });
        }
      }
    });
  },

  // 预览
  onPreview: function (e) {
    var photos = e.currentTarget.dataset.photos;
    var index = e.currentTarget.dataset.index;
    this.setData({
      showPreview: true,
      previewPhotos: photos,
      previewIndex: index
    });
  },

  onPreviewChange: function (e) {
    this.setData({ previewIndex: e.detail.current });
  },

  onClosePreview: function () {
    this.setData({ showPreview: false });
  },

  onDeletePhoto: function () {
    var that = this;
    var photo = this.data.previewPhotos[this.data.previewIndex];
    if (!photo) return;

    wx.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: function (res) {
        if (!res.confirm) return;
        var dateStr = photo.dateStr || that.formatDate(new Date(photo.timestamp));
        var data = wx.getStorageSync(storageKey) || {};
        if (data[dateStr]) {
          data[dateStr] = data[dateStr].filter(function (p) {
            return p.timestamp !== photo.timestamp;
          });
          if (data[dateStr].length === 0) delete data[dateStr];
          wx.setStorageSync(storageKey, data);
        }
        wx.showToast({ title: '已删除', icon: 'success' });
        that.setData({ showPreview: false });
        that.loadPhotos();
      }
    });
  }
});
