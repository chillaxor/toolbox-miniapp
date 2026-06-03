var recorderManager = wx.getRecorderManager();
var audioContext = null;
var recordingTimer = null;

Page({
  data: {
    isRecording: false,
    recordingTime: 0,
    recordingTimeText: '00:00',
    recordings: [],
    playingId: null
  },

  onLoad: function () {
    this.loadRecordings();
    this.setupRecorder();
  },

  onUnload: function () {
    this.stopTimer();
    if (audioContext) {
      audioContext.stop();
      audioContext.destroy();
      audioContext = null;
    }
  },

  setupRecorder: function () {
    var that = this;

    recorderManager.onStart(function () {
      that.setData({ isRecording: true, recordingTime: 0, recordingTimeText: '00:00' });
      that.startTimer();
    });

    recorderManager.onStop(function (res) {
      that.stopTimer();
      that.setData({ isRecording: false });
      if (res.tempFilePath) {
        that.saveRecording(res.tempFilePath, res.duration);
      }
    });

    recorderManager.onError(function (err) {
      that.stopTimer();
      that.setData({ isRecording: false });
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
  },

  startTimer: function () {
    var that = this;
    recordingTimer = setInterval(function () {
      var t = that.data.recordingTime + 1;
      that.setData({
        recordingTime: t,
        recordingTimeText: that.formatTime(t)
      });
    }, 1000);
  },

  stopTimer: function () {
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  },

  formatTime: function (seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  },

  formatDate: function () {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    var h = d.getHours();
    var min = d.getMinutes();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day) + ' ' + (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min);
  },

  loadRecordings: function () {
    var list = wx.getStorageSync('voicenote_list') || [];
    var that = this;
    var formatted = list.map(function (item) {
      item.durationText = that.formatTime(item.duration);
      return item;
    });
    this.setData({ recordings: formatted });
  },

  saveRecordings: function (list) {
    wx.setStorageSync('voicenote_list', list);
  },

  saveRecording: function (tempFilePath, duration) {
    var that = this;
    var fs = wx.getFileSystemManager();
    var id = Date.now();
    var savedPath = wx.env.USER_DATA_PATH + '/voicenote_' + id + '.mp3';

    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: savedPath,
      success: function () {
        var recordings = that.data.recordings;
        var dur = Math.round(duration / 1000) || that.data.recordingTime;
        var item = {
          id: id,
          name: '录音 #' + (recordings.length + 1),
          duration: dur,
          durationText: that.formatTime(dur),
          filePath: savedPath,
          date: that.formatDate()
        };
        recordings.unshift(item);
        if (recordings.length > 50) {
          var removed = recordings.pop();
          that.deleteFile(removed.filePath);
        }
        that.setData({ recordings: recordings });
        that.saveRecordings(recordings);
        wx.showToast({ title: '录音已保存', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  toggleRecording: function () {
    if (this.data.isRecording) {
      recorderManager.stop();
    } else {
      wx.authorize({
        scope: 'scope.record',
        success: function () {
          recorderManager.start({ duration: 600000, format: 'mp3' });
        },
        fail: function () {
          wx.showToast({ title: '请授权录音权限', icon: 'none' });
        }
      });
    }
  },

  playRecording: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;

    if (this.data.playingId === id && audioContext) {
      audioContext.pause();
      this.setData({ playingId: null });
      return;
    }

    if (audioContext) {
      audioContext.stop();
      audioContext.destroy();
      audioContext = null;
    }

    var item = null;
    for (var i = 0; i < this.data.recordings.length; i++) {
      if (this.data.recordings[i].id === id) {
        item = this.data.recordings[i];
        break;
      }
    }
    if (!item) return;

    audioContext = wx.createInnerAudioContext();
    audioContext.src = item.filePath;

    audioContext.onPlay(function () {
      that.setData({ playingId: id });
    });

    audioContext.onEnded(function () {
      that.setData({ playingId: null });
      audioContext.destroy();
      audioContext = null;
    });

    audioContext.onPause(function () {
      that.setData({ playingId: null });
    });

    audioContext.onError(function () {
      that.setData({ playingId: null });
      wx.showToast({ title: '播放失败', icon: 'none' });
    });

    audioContext.play();
  },

  deleteRecording: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条录音吗？',
      success: function (res) {
        if (res.confirm) {
          var recordings = that.data.recordings;
          var item = null;
          var newList = [];
          for (var i = 0; i < recordings.length; i++) {
            if (recordings[i].id === id) {
              item = recordings[i];
            } else {
              newList.push(recordings[i]);
            }
          }
          if (item) {
            if (that.data.playingId === id && audioContext) {
              audioContext.stop();
              audioContext.destroy();
              audioContext = null;
            }
            that.deleteFile(item.filePath);
          }
          that.setData({ recordings: newList, playingId: null });
          that.saveRecordings(newList);
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  deleteFile: function (filePath) {
    var fs = wx.getFileSystemManager();
    fs.unlink({ filePath: filePath });
  },

  onShareAppMessage: function () {
    return {
      title: '语音备忘录 - 随时记录重要声音',
      path: '/pages/tools/voicenote/index'
    };
  }
});
