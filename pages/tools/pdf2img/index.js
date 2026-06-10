var storage = require('../../../utils/storage.js');

Page({
  data: {
    filePath: '',
    fileName: '',
    fileSize: '',
    pageCount: '',
    selectedFormat: 'png',
    selectedQuality: 'high',
    isConverting: false,
    convertedImages: [],
    isFavorite: false,
    tips: [
      '选择PDF文件后，可预览文档内容',
      '在预览页面截图即可获得图片',
      '建议使用"高质量"获得更清晰的效果',
      'PNG适合文字截图，JPG适合图片内容'
    ]
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('pdf2img') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('pdf2img') }); },

  formatFileSize: function (bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
  },

  onChoosePDF: function () {
    var self = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        var file = res.tempFiles[0];
        self.setData({
          filePath: file.path,
          fileName: file.name,
          fileSize: self.formatFileSize(file.size),
          convertedImages: []
        });
        storage.addHistory({
          toolId: 'pdf2img', toolName: 'PDF转图片', category: 'image',
          summary: '选择了文件：' + file.name,
          timestamp: Date.now()
        });
      },
      fail: function () {
        // 用户取消选择
      }
    });
  },

  onFormatChange: function (e) {
    this.setData({ selectedFormat: e.currentTarget.dataset.format });
  },

  onQualityChange: function (e) {
    this.setData({ selectedQuality: e.currentTarget.dataset.quality });
  },

  onPreviewPDF: function () {
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    var self = this;
    wx.openDocument({
      filePath: this.data.filePath,
      showMenu: true,
      success: function () {
        wx.showModal({
          title: '截图提示',
          content: '请在预览页面截图保存需要的页面，截图将自动保存到相册。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: function () {
        wx.showToast({ title: '无法打开此PDF文件', icon: 'none' });
      }
    });
  },

  onShowTips: function () {
    wx.showModal({
      title: 'PDF转图片方法',
      content: '1. 点击"预览PDF"打开文档\n2. 长按页面截图保存\n3. 截图自动保存到相册\n\n提示：使用微信自带的文档预览，可直接截取每一页为图片。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onClear: function () {
    this.setData({
      filePath: '',
      fileName: '',
      fileSize: '',
      convertedImages: []
    });
  },

  onShareAppMessage: function () {
    return { title: 'PDF转图片 - 工具箱', path: '/pages/tools/pdf2img/index' };
  }
});
