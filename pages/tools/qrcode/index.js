var qrcodeUtil = require('../../../utils/qrcode.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { text: '', qrGenerated: false, isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('qrcode') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('qrcode') }); },

  onTextInput: function (e) { this.setData({ text: e.detail.value }); },

  onGenerate: function () {
    if (!this.data.text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return; }

    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#qrCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0]) {
        wx.showToast({ title: 'Canvas初始化失败', icon: 'none' });
        return;
      }
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');

      qrcodeUtil.generateQRCode(ctx, self.data.text, {
        width: 200,
        colorDark: '#333333',
        colorLight: '#FFFFFF'
      }).then(function () {
        self.setData({ qrGenerated: true });
        storage.addHistory({
          toolId: 'qrcode', toolName: '二维码生成', category: 'image',
          summary: '生成二维码：' + (self.data.text.length > 20 ? self.data.text.substring(0, 20) + '...' : self.data.text),
          timestamp: Date.now()
        });
      }).catch(function () {
        wx.showToast({ title: '生成失败', icon: 'none' });
      });
    });
  },

  onSaveQRCode: function () {
    wx.canvasToTempFilePath({
      canvasId: 'qrCanvas',
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function () { wx.showToast({ title: '保存失败', icon: 'none' }); }
        });
      }
    });
  },

  onClear: function () { this.setData({ text: '', qrGenerated: false }); },

  onShareAppMessage: function () { return { title: '二维码生成 - 工具箱', path: '/pages/tools/qrcode/index' }; }
});
