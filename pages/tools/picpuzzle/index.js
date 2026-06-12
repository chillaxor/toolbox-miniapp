var storage = require('../../../utils/storage.js');

var CUT_SIZE = 250; // 每块输出像素

Page({
  data: {
    imagePath: '',
    level: 3,          // 3=3x3, 4=4x4, 5=5x5
    levels: [3, 4, 5],
    pieces: [],        // [{path, correctIndex, currentIndex}]
    grid: [],          // 当前棋盘: grid[i] = pieceIndex at position i
    selected: -1,      // 上一次选中的位置
    moves: 0,
    seconds: 0,
    timerStr: '00:00',
    isProcessing: false,
    isComplete: false,
    timer: null,
    isFavorite: false
  },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  onUnload: function () { this._clearTimer(); },
  onHide: function () { this._clearTimer(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('picpuzzle') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('picpuzzle') }); },

  _clearTimer: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  onLevelChange: function (e) {
    var level = parseInt(e.currentTarget.dataset.level);
    if (level === this.data.level) return;
    this.setData({ level: level });
    if (this.data.imagePath) {
      this._startPuzzle(this.data.imagePath);
    }
  },

  // ============ 选图 ============
  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: function (res) {
        var tempPath = res.tempFiles[0].tempFilePath;
        self.setData({ imagePath: tempPath });
        self._startPuzzle(tempPath);
      }
    });
  },

  // ============ 开始拼图 ============
  _startPuzzle: function (imagePath) {
    var self = this;
    var level = self.data.level;
    var total = level * level;

    self._clearTimer();
    self.setData({
      isProcessing: true,
      isComplete: false,
      pieces: [],
      grid: [],
      selected: -1,
      moves: 0,
      seconds: 0,
      timerStr: '00:00'
    });

    wx.showLoading({ title: '生成拼图...' });

    wx.getImageInfo({
      src: imagePath,
      success: function (imgInfo) {
        var imgW = imgInfo.width;
        var imgH = imgInfo.height;

        // 取中心正方形
        var size = Math.min(imgW, imgH);
        var sx = (imgW - size) / 2;
        var sy = (imgH - size) / 2;
        var cellSize = size / level;

        // 串行切割
        self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, level, 0, []);
      },
      fail: function () {
        wx.hideLoading();
        self.setData({ isProcessing: false });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  _cutPieceSerial: function (imagePath, imgW, imgH, sx, sy, cellSize, size, level, index, results) {
    var self = this;
    var total = level * level;

    if (index >= total) {
      // 切割完成，打乱
      self._shuffleAndStart(results, level);
      return;
    }

    var row = Math.floor(index / level);
    var col = index % level;
    var cropX = sx + col * cellSize;
    var cropY = sy + row * cellSize;
    var scale = CUT_SIZE / cellSize;
    var drawW = Math.round(imgW * scale);
    var drawH = Math.round(imgH * scale);
    var drawX = Math.round(-cropX * scale);
    var drawY = Math.round(-cropY * scale);

    var ctx = wx.createCanvasContext('picpuzzle-piece', self);
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(0, 0, CUT_SIZE, CUT_SIZE);
    ctx.drawImage(imagePath, drawX, drawY, drawW, drawH);
    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'picpuzzle-piece',
          x: 0, y: 0,
          width: CUT_SIZE, height: CUT_SIZE,
          destWidth: CUT_SIZE, destHeight: CUT_SIZE,
          success: function (tmpRes) {
            results.push({ path: tmpRes.tempFilePath, correctIndex: index });
            wx.showLoading({ title: '生成中 ' + (index + 1) + '/' + total + '...' });
            self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, level, index + 1, results);
          },
          fail: function () {
            results.push({ path: '', correctIndex: index });
            self._cutPieceSerial(imagePath, imgW, imgH, sx, sy, cellSize, size, level, index + 1, results);
          }
        }, self);
      }, 80);
    });
  },

  _shuffleAndStart: function (pieces, level) {
    var self = this;
    var total = level * level;

    // 构建 grid: grid[position] = pieceIndex
    var grid = [];
    for (var i = 0; i < total; i++) {
      grid.push(i);
    }

    // Fisher-Yates 洗牌，确保不在正确位置
    var attempts = 0;
    do {
      for (var j = grid.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = grid[j];
        grid[j] = grid[k];
        grid[k] = tmp;
      }
      attempts++;
    } while (self._isSolved(grid) && attempts < 100);

    wx.hideLoading();
    self.setData({
      pieces: pieces,
      grid: grid,
      isProcessing: false,
      selected: -1,
      moves: 0,
      seconds: 0,
      timerStr: '00:00',
      isComplete: false
    });

    // 启动计时
    self._startTimer();

    storage.addHistory({
      toolId: 'picpuzzle',
      toolName: '照片拼图',
      category: 'fun',
      summary: level + 'x' + level + ' 拼图挑战',
      timestamp: Date.now()
    });
  },

  _isSolved: function (grid) {
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] !== i) return false;
    }
    return true;
  },

  _startTimer: function () {
    var self = this;
    var timer = setInterval(function () {
      if (self.data.isComplete) {
        self._clearTimer();
        return;
      }
      var s = self.data.seconds + 1;
      var min = Math.floor(s / 60);
      var sec = s % 60;
      var timerStr = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
      self.setData({ seconds: s, timerStr: timerStr });
    }, 1000);
    self.setData({ timer: timer });
  },

  // ============ 点击拼图块 ============
  onTapPiece: function (e) {
    var pos = parseInt(e.currentTarget.dataset.pos);
    var selected = this.data.selected;
    var grid = this.data.grid.slice();

    if (this.data.isComplete) return;

    if (selected === -1) {
      // 第一次选择
      this.setData({ selected: pos });
    } else if (selected === pos) {
      // 取消选择
      this.setData({ selected: -1 });
    } else {
      // 交换
      var tmp = grid[selected];
      grid[selected] = grid[pos];
      grid[pos] = tmp;

      var moves = this.data.moves + 1;
      var isComplete = this._isSolved(grid);

      this.setData({
        grid: grid,
        selected: -1,
        moves: moves,
        isComplete: isComplete
      });

      if (isComplete) {
        this._clearTimer();
        wx.showToast({ title: '🎉 拼图完成！', icon: 'success' });
      }
    }
  },

  // ============ 重置 ============
  onReset: function () {
    if (!this.data.pieces.length) return;
    var level = this.data.level;
    var total = level * level;
    var grid = [];
    for (var i = 0; i < total; i++) {
      grid.push(i);
    }
    // 洗牌
    for (var j = grid.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = grid[j];
      grid[j] = grid[k];
      grid[k] = tmp;
    }

    this._clearTimer();
    this.setData({
      grid: grid,
      selected: -1,
      moves: 0,
      seconds: 0,
      timerStr: '00:00',
      isComplete: false
    });
    this._startTimer();
  },

  // ============ 显示原图预览 ============
  onPreview: function () {
    if (this.data.imagePath) {
      wx.previewImage({ urls: [this.data.imagePath] });
    }
  },

  // ============ 保存完成图 ============
  onSaveResult: function () {
    if (!this.data.isComplete) {
      wx.showToast({ title: '请先完成拼图', icon: 'none' });
      return;
    }
    wx.showToast({ title: '长按图片可保存', icon: 'none' });
  },

  onShareAppMessage: function () {
    return { title: '照片拼图 - 工具箱', path: '/pages/tools/picpuzzle/index' };
  }
});
