var storage = require('../../../utils/storage.js');

Page({
  data: {
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    drawMode: 'brush',
    brushSize: 20,
    isFavorite: false,
    isReady: false,
    historyCount: 0,
    tips: [
      '从相册选择试卷照片',
      '用涂抹模式在答案区域上滑动遮挡',
      '用矩形模式画白色方块覆盖答案',
      '支持撤销误操作，导出后保存到相册'
    ]
  },

  ctx: null,
  imgObj: null,
  imgPath: '',
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  rectStart: null,
  baseImageData: null,
  canvasOffsetX: 0,
  canvasOffsetY: 0,
  historyStack: [],      // 存 ImageData 快照（内存中，不走 setData）
  canvasWidthVal: 0,
  canvasHeightVal: 0,

  onLoad: function () {
    this.checkFavorite();
    // 计算可用画布最大高度：屏幕高度 - 顶部导航(44px) - 页面标题栏 - 工具栏+导出按钮(~200px) - padding
    var sysInfo = wx.getWindowInfo();
    var windowHeight = sysInfo.windowHeight;
    var maxCanvasH = windowHeight - 44 - 40 - 160 - 30;
    if (maxCanvasH < 200) maxCanvasH = 200;
    this.maxCanvasHeight = maxCanvasH;
  },
  onShow: function () {
    this.checkFavorite();
  },
  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('answereraser') });
  },
  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('answereraser') });
  },

  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var file = res.tempFiles[0];
        self.loadImage(file.tempFilePath);
      }
    });
  },

  loadImage: function (path) {
    var self = this;
    wx.getImageInfo({
      src: path,
      success: function (info) {
        var maxW = 690;
        var maxH = self.maxCanvasHeight || 500;
        var ratio = info.width / info.height;
        var cw, ch;
        if (ratio > 1) {
          cw = maxW;
          ch = Math.round(maxW / ratio);
          if (ch > maxH) {
            ch = maxH;
            cw = Math.round(maxH * ratio);
          }
        } else {
          ch = maxH;
          cw = Math.round(maxH * ratio);
          if (cw > maxW) {
            cw = maxW;
            ch = Math.round(maxW / ratio);
          }
        }
        self.setData({
          imageSrc: path,
          imageWidth: info.width,
          imageHeight: info.height,
          canvasWidth: cw,
          canvasHeight: ch,
          isReady: false,
          historyCount: 0
        }, function () {
          self.initCanvas(path, cw, ch);
        });
      }
    });
  },

  initCanvas: function (path, cw, ch) {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#drawCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res[0]) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        ctx.scale(dpr, dpr);

        var img = canvas.createImage();
        img.onload = function () {
          ctx.drawImage(img, 0, 0, cw, ch);
          self.ctx = ctx;
          self.imgObj = img;
          self.imgPath = path;
          self.canvas = canvas;
          self.dpr = dpr;
          self.canvasWidthVal = cw;
          self.canvasHeightVal = ch;
          self.baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          self.historyStack = [];
          self.setData({ isReady: true });

          // 缓存 Canvas 在页面中的位置，后续触摸事件直接用，不再每帧查询
          self._refreshCanvasOffset();
        };
        img.src = path;
      });
  },

  /** 缓存 Canvas 偏移量（只在初始化和窗口变化时查询一次） */
  _refreshCanvasOffset: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#drawCanvas').boundingClientRect(function (rect) {
      self.canvasOffsetX = rect.left;
      self.canvasOffsetY = rect.top;
    }).exec();
  },

  /** 从触摸事件直接算坐标（同步，不查DOM） */
  _getTouchPos: function (touch) {
    return {
      x: touch.clientX - this.canvasOffsetX,
      y: touch.clientY - this.canvasOffsetY
    };
  },

  onDrawStart: function (e) {
    if (!this.ctx) return;
    var touch = e.touches[0];
    var pos = this._getTouchPos(touch);
    this.isDrawing = true;
    this.lastX = pos.x;
    this.lastY = pos.y;
    if (this.data.drawMode === 'rect') {
      this.rectStart = { x: pos.x, y: pos.y };
    } else {
      this.drawBrush(pos.x, pos.y, pos.x, pos.y);
    }
  },

  onDrawMove: function (e) {
    if (!this.isDrawing || !this.ctx) return;
    var touch = e.touches[0];
    var pos = this._getTouchPos(touch);
    if (this.data.drawMode === 'brush') {
      this.drawBrush(this.lastX, this.lastY, pos.x, pos.y);
      this.lastX = pos.x;
      this.lastY = pos.y;
    }
  },

  onDrawEnd: function (e) {
    if (!this.isDrawing || !this.ctx) return;
    if (this.data.drawMode === 'rect' && this.rectStart && e.changedTouches && e.changedTouches[0]) {
      var touch = e.changedTouches[0];
      var pos = this._getTouchPos(touch);
      this.drawRect(this.rectStart.x, this.rectStart.y, pos.x, pos.y);
      this.rectStart = null;
    }
    this.saveHistory();
    this.isDrawing = false;
  },

  drawBrush: function (x1, y1, x2, y2) {
    var ctx = this.ctx;
    var size = this.data.brushSize;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  },

  drawRect: function (x1, y1, x2, y2) {
    var ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#FFFFFF';
    var rx = Math.min(x1, x2);
    var ry = Math.min(y1, y2);
    var rw = Math.abs(x2 - x1);
    var rh = Math.abs(y2 - y1);
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  },

  saveHistory: function () {
    if (!this.canvas) return;
    var data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (this.historyStack.length >= 20) this.historyStack.shift();
    this.historyStack.push(data);
    // 只更新计数到 data（轻量），不传 ImageData 大对象
    this.setData({ historyCount: this.historyStack.length });
  },

  onUndo: function () {
    if (this.historyStack.length === 0) {
      wx.showToast({ title: '没有可撤销的操作', icon: 'none' });
      return;
    }
    this.historyStack.pop();
    if (this.historyStack.length > 0) {
      this.ctx.putImageData(this.historyStack[this.historyStack.length - 1], 0, 0);
    } else if (this.baseImageData) {
      this.ctx.putImageData(this.baseImageData, 0, 0);
    }
    this.setData({ historyCount: this.historyStack.length });
  },

  onReset: function () {
    if (this.baseImageData && this.ctx) {
      this.ctx.putImageData(this.baseImageData, 0, 0);
      this.historyStack = [];
      this.setData({ historyCount: 0 });
    }
  },

  onDrawModeChange: function (e) {
    this.setData({ drawMode: e.currentTarget.dataset.mode });
  },

  onBrushSizeChange: function (e) {
    this.setData({ brushSize: e.detail.value });
  },

  onExport: function () {
    if (!this.canvas) return;
    var self = this;
    wx.showLoading({ title: '正在生成图片...' });
    wx.canvasToTempFilePath({
      canvas: self.canvas,
      x: 0,
      y: 0,
      width: self.data.canvasWidth,
      height: self.data.canvasHeight,
      destWidth: self.data.imageWidth,
      destHeight: self.data.imageHeight,
      fileType: 'png',
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.hideLoading();
            wx.showToast({ title: '已保存到相册', icon: 'success' });
            storage.addHistory({
              toolId: 'answereraser', toolName: '答案遮挡器', category: 'image',
              summary: '导出了遮挡后的试卷图片',
              timestamp: Date.now()
            });
          },
          fail: function () {
            wx.hideLoading();
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return { title: '答案遮挡器 - 工具箱', path: '/pages/tools/answereraser/index' };
  }
});