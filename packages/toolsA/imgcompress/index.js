var mediaCheck = require('../../../utils/mediaCheck.js');
var imgCompressUtil = require('../../../utils/img-compress.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    imagePath: '',
    originalSize: '',
    compressedPath: '',
    compressedSize: '',
    compressRatio: '',
    quality: 'medium',
    isCompressing: false,
    isFavorite: false
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('imgcompress') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('imgcompress') }); },

  onQualityChange: function (e) {
    this.setData({ quality: e.currentTarget.dataset.quality });
  },

  onChooseImage: function () {
    var self = this;
    mediaCheck.chooseMediaWithCheck({
      count: 1,
      mediaType: ['image'],
      success: function (res) {
        var tempPath = res.tempFiles[0].tempFilePath;
        var size = res.tempFiles[0].size;
        self.setData({
          imagePath: tempPath,
          originalSize: imgCompressUtil.formatFileSize(size),
          compressedPath: '',
          compressedSize: '',
          compressRatio: ''
        });
      }
    });
  },

  onCompress: function () {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }
    if (this.data.isCompressing) return;

    var self = this;
    var qualityMap = { light: 0.8, medium: 0.5, heavy: 0.2 };
    var quality = qualityMap[this.data.quality] || 0.5;

    this.setData({ isCompressing: true });

    wx.compressImage({
      src: this.data.imagePath,
      quality: Math.round(quality * 100),
      success: function (res) {
        var compressedPath = res.tempFilePath;
        // 获取压缩后文件大小
        try {
          var fs = wx.getFileSystemManager();
          var stats = fs.statSync(compressedPath);
          var compressedSize = stats.size;
          self.setData({
            compressedPath: compressedPath,
            compressedSize: imgCompressUtil.formatFileSize(compressedSize),
            isCompressing: false
          });
        } catch (e) {
          self.setData({
            compressedPath: compressedPath,
            compressedSize: '计算中...',
            isCompressing: false
          });
        }
        storage.addHistory({
          toolId: 'imgcompress', toolName: '图片压缩', category: 'image',
          summary: self.data.originalSize + ' → ' + self.data.compressedSize,
          timestamp: Date.now()
        });
      },
      fail: function () {
        self.setData({ isCompressing: false });
        wx.showToast({ title: '压缩失败', icon: 'none' });
      }
    });
  },

  onSaveImage: function () {
    if (!this.data.compressedPath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedPath,
      success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: function () { wx.showToast({ title: '保存失败', icon: 'none' }); }
    });
  },

  onShareAppMessage: function () { return { title: '图片压缩 - 工具箱', path: '/packages/toolsA/imgcompress/index' }; }
});
