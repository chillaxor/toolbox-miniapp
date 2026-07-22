var storage = require('../../../utils/storage.js');

// 每格输出尺寸（像素），足够高清
var PIECE_PX = 300;

Page({
  data: {
    imagePath: '',
    gridPieces: [],   // [{path: '...'}] x9，按顺序填充
    isProcessing: false,
    progress: 0,      // 0-9
    isFavorite: false
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('gridcut') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('gridcut') }); },

  // ============ 选图 ============
  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: function (res) {
        var tempPath = res.tempFiles[0].tempFilePath;
        self.setData({ imagePath: tempPath, gridPieces: [], progress: 0 });
        self.cutToGrid(tempPath);
      }
    });
  },

  // ============ 核心切割逻辑 ============
  cutToGrid: function (imagePath) {
    var self = this;
    self.setData({ isProcessing: true, progress: 0 });
    wx.showLoading({ title: '切割中...' });

    wx.getImageInfo({
      src: imagePath,
      success: function (imgInfo) {
        var imgW = imgInfo.width;
        var imgH = imgInfo.height;

        // 取中心正方形的边长和偏移
        var size = Math.min(imgW, imgH);
        var sx = (imgW - size) / 2;  // 原图裁剪起点x
        var sy = (imgH - size) / 2;  // 原图裁剪起点y

        // 每格在原图上的尺寸
        var cellSize = size / 3;

        // 初始化9个占位格
        var emptyPieces = [];
        for (var n = 0; n < 9; n++) {
          emptyPieces.push({ path: '', ready: false });
        }
        self.setData({ gridPieces: emptyPieces });

        // 串行逐格切割（必须串行！同一个 canvas 不能并发）
        self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, 0, []);
      },
      fail: function () {
        wx.hideLoading();
        self.setData({ isProcessing: false });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  /**
   * 串行切割第 index 格（0-8）
   * 原理：
   *   每格在原图坐标：(sx + col*cellSize, sy + row*cellSize)，尺寸 cellSize × cellSize
   *   用5参数 drawImage：先把图以适当偏移画到 canvas，使目标格对齐到 (0,0)
   *   canvas 尺寸 PIECE_PX × PIECE_PX，输出该格图片
   */
  _cutPieceSerial: function (imagePath, imgW, imgH, sx, sy, cellSize, size, index, results) {
    var self = this;

    if (index >= 9) {
      // 全部完成
      wx.hideLoading();
      self.setData({ gridPieces: results, isProcessing: false, progress: 9 });
      storage.addHistory({
        toolId: 'gridcut',
        toolName: '九宫格切图',
        category: 'image',
        summary: '已切为3×3九宫格',
        timestamp: Date.now()
      });
      return;
    }

    var row = Math.floor(index / 3);
    var col = index % 3;

    // 该格左上角在原图中的坐标
    var cropX = sx + col * cellSize;
    var cropY = sy + row * cellSize;

    // 5参数 drawImage 的思路：
    //   canvas 尺寸 = PIECE_PX × PIECE_PX
    //   把整张图按比例缩放，使目标格 cellSize → PIECE_PX
    //   缩放系数 scale = PIECE_PX / cellSize
    //   然后把图原点 offset 到 (-cropX*scale, -cropY*scale) 处
    var scale = PIECE_PX / cellSize;
    var drawW = Math.round(imgW * scale);
    var drawH = Math.round(imgH * scale);
    var drawX = Math.round(-cropX * scale);
    var drawY = Math.round(-cropY * scale);

    var ctx = wx.createCanvasContext('gridcut-piece', self);
    // 先清底色（白色），避免上一格残影
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(0, 0, PIECE_PX, PIECE_PX);
    // 5参数：drawImage(src, dx, dy, dw, dh)
    ctx.drawImage(imagePath, drawX, drawY, drawW, drawH);
    ctx.draw(false, function () {
      // 等 draw 真正完成再导出（加一点延时保证渲染完毕）
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'gridcut-piece',
          x: 0, y: 0,
          width: PIECE_PX, height: PIECE_PX,
          destWidth: PIECE_PX, destHeight: PIECE_PX,
          success: function (tmpRes) {
            results[index] = { path: tmpRes.tempFilePath, ready: true };

            // 更新进度
            var progressPieces = self.data.gridPieces.slice();
            progressPieces[index] = results[index];
            self.setData({ gridPieces: progressPieces, progress: index + 1 });

            wx.showLoading({ title: '切割中 ' + (index + 1) + '/9...' });

            // 切下一格
            self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, index + 1, results);
          },
          fail: function (err) {
            console.error('第' + (index + 1) + '格导出失败', err);
            results[index] = { path: '', ready: false };
            // 出错也继续切下一格
            self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, index + 1, results);
          }
        }, self);
      }, 80);  // 80ms 足够让 canvas 完成渲染
    });
  },

  // ============ 保存单格 ============
  onSavePiece: function (e) {
    var index = e.currentTarget.dataset.index;
    var piece = this.data.gridPieces[index];
    if (!piece || !piece.path) {
      wx.showToast({ title: '第' + (index + 1) + '格尚未就绪', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: piece.path,
      success: function () {
        wx.showToast({ title: '第' + (index + 1) + '格已保存', icon: 'success' });
      },
      fail: function (err) {
        if (err && err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许小程序保存图片到相册',
            confirmText: '去设置',
            success: function (r) { if (r.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  // ============ 批量保存 ============
  onSaveAll: function () {
    var pieces = this.data.gridPieces;
    if (!pieces || pieces.length === 0) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }
    if (this.data.isProcessing) {
      wx.showToast({ title: '切割中，请稍候', icon: 'none' });
      return;
    }
    var readyCount = 0;
    for (var i = 0; i < pieces.length; i++) {
      if (pieces[i] && pieces[i].path) readyCount++;
    }
    if (readyCount === 0) {
      wx.showToast({ title: '暂无可保存的切片', icon: 'none' });
      return;
    }
    var self = this;
    wx.showModal({
      title: '批量保存',
      content: '将保存 ' + readyCount + ' 张切图到相册',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '保存中...' });
          self._saveAllSerial(0, 0);
        }
      }
    });
  },

  _saveAllSerial: function (index, saved) {
    var self = this;
    if (index >= 9) {
      wx.hideLoading();
      wx.showToast({ title: '已保存 ' + saved + ' 张', icon: 'success' });
      return;
    }
    var piece = this.data.gridPieces[index];
    if (!piece || !piece.path) {
      self._saveAllSerial(index + 1, saved);
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: piece.path,
      success: function () { self._saveAllSerial(index + 1, saved + 1); },
      fail: function () { self._saveAllSerial(index + 1, saved); }
    });
  },

  onShareAppMessage: function () {
    return { title: '九宫格切图 - 工具箱', path: '/packages/imgTools/gridcut/index' };
  }
});
