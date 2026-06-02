var storage = require('../../../utils/storage.js');

Page({
  data: {
    imagePath: '',
    gridPieces: [],
    isProcessing: false,
    isFavorite: false
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('gridcut') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('gridcut') }); },

  /**
   * 选择图片
   */
  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: function (res) {
        var tempPath = res.tempFiles[0].tempFilePath;
        self.setData({
          imagePath: tempPath,
          gridPieces: []
        });
        // 自动开始切割
        self.cutToGrid(tempPath);
      }
    });
  },

  /**
   * 切割成九宫格
   * 原理：将图片绘制到 canvas 上，按 3×3 分割导出每格图片
   */
  cutToGrid: function (imagePath) {
    var self = this;
    this.setData({ isProcessing: true });

    // 先获取图片原始尺寸
    wx.getImageInfo({
      src: imagePath,
      success: function (imgInfo) {
        var imgW = imgInfo.width;
        var imgH = imgInfo.height;

        // 裁剪为正方形（取中心区域）
        var size = Math.min(imgW, imgH);
        var sx = (imgW - size) / 2;
        var sy = (imgH - size) / 2;
        var pieceSize = size / 3;

        // 使用离屏 canvas
        var canvasId = 'gridcut-canvas';
        var ctx = wx.createCanvasContext(canvasId, self);

        // 设置 canvas 为正方形
        var canvasSize = 300;
        var drawSize = canvasSize / 3;

        // 先画整张图到 canvas（裁剪到正方形）
        ctx.drawImage(imagePath, sx, sy, size, size, 0, 0, canvasSize, canvasSize);
        ctx.draw(false, function () {
          // 逐格导出
          var pieces = [];
          var completed = 0;
          var total = 9;

          for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
              (function (r, c) {
                // 先清空再画单格
                var pieceCtx = wx.createCanvasContext('gridcut-piece', self);
                pieceCtx.drawImage(
                  imagePath,
                  sx + c * pieceSize, sy + r * pieceSize, pieceSize, pieceSize,
                  0, 0, 200, 200
                );
                pieceCtx.draw(false, function () {
                  // 导出该格图片
                  wx.canvasToTempFilePath({
                    canvasId: 'gridcut-piece',
                    x: 0, y: 0, width: 200, height: 200,
                    destWidth: pieceSize, destHeight: pieceSize,
                    success: function (tmpRes) {
                      pieces[r * 3 + c] = { path: tmpRes.tempFilePath };
                      completed++;
                      if (completed >= total) {
                        self.setData({
                          gridPieces: pieces,
                          isProcessing: false
                        });
                        storage.addHistory({
                          toolId: 'gridcut',
                          toolName: '九宫格切图',
                          category: 'image',
                          summary: '已切为3×3九宫格',
                          timestamp: Date.now()
                        });
                      }
                    },
                    fail: function () {
                      completed++;
                      pieces[r * 3 + c] = { path: '' };
                      if (completed >= total) {
                        self.setData({
                          gridPieces: pieces,
                          isProcessing: false
                        });
                      }
                    }
                  }, self);
                });
              })(row, col);
            }
          }
        });
      },
      fail: function () {
        self.setData({ isProcessing: false });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  /**
   * 保存单格图片
   */
  onSavePiece: function (e) {
    var index = e.currentTarget.dataset.index;
    var piece = this.data.gridPieces[index];
    if (!piece || !piece.path) {
      wx.showToast({ title: '图片尚未就绪', icon: 'none' });
      return;
    }

    var self = this;
    wx.saveImageToPhotosAlbum({
      filePath: piece.path,
      success: function () {
        wx.showToast({ title: '第' + (index + 1) + '格已保存', icon: 'success' });
      },
      fail: function (err) {
        if (err.errMsg.indexOf('auth deny') > -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许小程序保存图片到相册',
            confirmText: '去设置',
            success: function (modalRes) {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 批量保存全部九宫格
   */
  onSaveAll: function () {
    var pieces = this.data.gridPieces;
    if (!pieces || pieces.length === 0) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    // 检查是否全部就绪
    for (var i = 0; i < pieces.length; i++) {
      if (!pieces[i] || !pieces[i].path) {
        wx.showToast({ title: '图片尚未就绪', icon: 'none' });
        return;
      }
    }

    var self = this;
    wx.showModal({
      title: '批量保存',
      content: '将依次保存9张切图到相册',
      success: function (res) {
        if (res.confirm) {
          self.saveAllPieces(0);
        }
      }
    });
  },

  saveAllPieces: function (index) {
    if (index >= 9) {
      wx.showToast({ title: '全部保存完成', icon: 'success' });
      return;
    }

    var self = this;
    var piece = this.data.gridPieces[index];
    if (!piece || !piece.path) {
      self.saveAllPieces(index + 1);
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: piece.path,
      success: function () {
        self.saveAllPieces(index + 1);
      },
      fail: function () {
        // 继续保存下一张，不因单张失败而中断
        self.saveAllPieces(index + 1);
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '九宫格切图 - 工具箱',
      path: '/pages/tools/gridcut/index'
    };
  }
});
