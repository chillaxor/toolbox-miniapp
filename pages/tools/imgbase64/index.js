var imgBase64Util = require('../../../utils/img-base64.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { imagePath: '', base64Str: '', fileSize: '', charCount: 0, isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('imgbase64') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('imgbase64') }); },

  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: function (res) {
        var tempPath = res.tempFiles[0].tempFilePath;
        var size = res.tempFiles[0].size;
        self.setData({ imagePath: tempPath, fileSize: imgBase64Util.formatFileSize(size), base64Str: '', charCount: 0 });
        self.doConvert(tempPath);
      }
    });
  },

  doConvert: function (filePath) {
    var self = this;
    imgBase64Util.imageToBase64(filePath).then(function (res) {
      self.setData({
        base64Str: res.rawBase64,
        charCount: res.rawBase64.length
      });
      storage.addHistory({
        toolId: 'imgbase64', toolName: '图转Base64', category: 'image',
        summary: self.data.fileSize + ' → ' + res.rawBase64.length + '字符',
        timestamp: Date.now()
      });
    }).catch(function () {
      wx.showToast({ title: '转换失败', icon: 'none' });
    });
  },

  onCopyResult: function () {
    wx.setClipboardData({ data: this.data.base64Str, success: function () { wx.showToast({ title: '已复制', icon: 'success' }); } });
  },

  onShareAppMessage: function () { return { title: '图转Base64 - 工具箱', path: '/pages/tools/imgbase64/index' }; }
});
