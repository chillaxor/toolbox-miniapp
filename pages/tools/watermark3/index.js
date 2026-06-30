var CLOUD_ENV = 'cloud1-d9gm1qla9bebafa31';

Page({
  data: {
    imageSrc: '',
    resultSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    isLoading: false,
    loadingText: '',
    selectMode: false,
    showResult: false,
    hasRect: false,
    inpaintRadius: 5,
    feather: 8,
    sharpen: true,
    debugInfo: ''
  },

  // 框选 canvas 相关
  selectCanvas: null,
  selectCtx: null,
  selectImgObj: null,
  selectDpr: 1,
  selectBaseImage: null,
  isSelecting: false,
  selectStartPos: null,
  currentRect: null, // {x, y, w, h} 画布坐标
  maxCanvasWidth: 0,
  maxCanvasHeight: 500,

  onLoad: function () {
    var sysInfo = wx.getWindowInfo();
    var rpxToPx = sysInfo.windowWidth / 750;
    this.maxCanvasWidth = Math.floor(sysInfo.windowWidth - (32 + 4) * rpxToPx);
    var maxCanvasH = sysInfo.windowHeight - 44 - 40 - 280;
    if (maxCanvasH < 200) maxCanvasH = 200;
    this.maxCanvasHeight = maxCanvasH;
  },

  onChooseImage: function () {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        var file = res.tempFiles[0];
        self.setData({
          imageSrc: file.tempFilePath,
          resultSrc: '',
          showResult: false,
          debugInfo: ''
        }, function () {
          self.enterSelectMode(file.tempFilePath);
        });
      }
    });
  },

  enterSelectMode: function (path) {
    var self = this;
    wx.getImageInfo({
      src: path,
      success: function (info) {
        var maxW = self.maxCanvasWidth || (wx.getWindowInfo().windowWidth - 32);
        var maxH = self.maxCanvasHeight || 500;
        var ratio = info.width / info.height;
        var cw, ch;
        if (ratio > 1) {
          cw = maxW; ch = Math.round(maxW / ratio);
          if (ch > maxH) { ch = maxH; cw = Math.round(maxH * ratio); }
        } else {
          ch = maxH; cw = Math.round(maxH * ratio);
          if (cw > maxW) { cw = maxW; ch = Math.round(maxW / ratio); }
        }
        self.setData({
          selectMode: true,
          showResult: false,
          imageWidth: info.width,
          imageHeight: info.height,
          canvasWidth: cw,
          canvasHeight: ch,
          hasRect: false
        }, function () {
          self.initSelectCanvas(path, cw, ch);
        });
      }
    });
  },

  onExitSelect: function () {
    this.setData({ selectMode: false, imageSrc: '' });
    this.currentRect = null;
  },

  initSelectCanvas: function (path, cw, ch) {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#selectCanvas')
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
          self.selectCanvas = canvas;
          self.selectCtx = ctx;
          self.selectImgObj = img;
          self.selectDpr = dpr;
          self.selectBaseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
          self.currentRect = null;
        };
        img.src = path;
      });
  },

  _getSelectTouchPos: function (touch) {
    var cw = this.data.canvasWidth || 0;
    var ch = this.data.canvasHeight || 0;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    if (typeof touch.x === 'number' && typeof touch.y === 'number') {
      return { x: clamp(touch.x, 0, cw), y: clamp(touch.y, 0, ch) };
    }
    // 回退方案：用 clientX/Y 减去 canvas 偏移
    var px = clamp((touch.clientX || 0) - (this._selectOffsetX || 0), 0, cw);
    var py = clamp((touch.clientY || 0) - (this._selectOffsetY || 0), 0, ch);
    return { x: px, y: py };
  },

  onSelectStart: function (e) {
    var touch = e.touches[0];
    var pos = this._getSelectTouchPos(touch);
    this.isSelecting = true;
    this.selectStartPos = pos;
  },

  onSelectMove: function (e) {
    if (!this.isSelecting || !this.selectCtx || !this.selectStartPos) return;
    var touch = e.touches[0];
    var pos = this._getSelectTouchPos(touch);
    var start = this.selectStartPos;

    // 恢复底图
    this.selectCtx.putImageData(this.selectBaseImage, 0, 0);

    // 画当前正在拖拽的矩形（虚线）
    var rx = Math.min(start.x, pos.x);
    var ry = Math.min(start.y, pos.y);
    var rw = Math.abs(pos.x - start.x);
    var rh = Math.abs(pos.y - start.y);

    var ctx = this.selectCtx;
    ctx.save();
    ctx.strokeStyle = '#E67E22';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillStyle = 'rgba(230, 126, 34, 0.15)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  },

  onSelectEnd: function (e) {
    if (!this.isSelecting || !this.selectStartPos) return;
    var touch = e.changedTouches[0];
    var pos = this._getSelectTouchPos(touch);
    var start = this.selectStartPos;
    this.isSelecting = false;

    var rw = Math.abs(pos.x - start.x);
    var rh = Math.abs(pos.y - start.y);

    // 太小的矩形忽略
    if (rw < 10 || rh < 10) {
      this._redrawSelect();
      this.currentRect = null;
      this.setData({ hasRect: false });
      return;
    }

    this.currentRect = {
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: rw,
      h: rh
    };
    this.setData({ hasRect: true });
    this._redrawSelect();
  },

  _redrawSelect: function () {
    if (!this.selectCtx || !this.selectBaseImage) return;
    this.selectCtx.putImageData(this.selectBaseImage, 0, 0);
    if (this.currentRect) {
      var ctx = this.selectCtx;
      var r = this.currentRect;
      ctx.save();
      ctx.strokeStyle = '#E67E22';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(230, 126, 34, 0.2)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }
  },

  onClearRect: function () {
    this.currentRect = null;
    this.setData({ hasRect: false });
    this._redrawSelect();
  },

  onRadiusChange: function (e) {
    this.setData({ inpaintRadius: e.detail.value });
  },

  onFeatherChange: function (e) {
    this.setData({ feather: e.detail.value });
  },

  onSharpenChange: function (e) {
    this.setData({ sharpen: e.detail.value });
  },

  /* ====== 调用 watermark3 云函数 ====== */
  onStartProcess: function () {
    if (!this.currentRect) {
      wx.showToast({ title: '请先框选水印区域', icon: 'none' });
      return;
    }

    var self = this;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var iw = this.data.imageWidth;
    var ih = this.data.imageHeight;
    var r = this.currentRect;

    // 画布坐标 → 原图坐标
    var x1 = Math.round(r.x / cw * iw);
    var y1 = Math.round(r.y / ch * ih);
    var x2 = Math.round((r.x + r.w) / cw * iw);
    var y2 = Math.round((r.y + r.h) / ch * ih);

    var debug = '画布: ' + cw + 'x' + ch + '\n' +
                '原图: ' + iw + 'x' + ih + '\n' +
                '框选(画布): x=' + Math.round(r.x) + ', y=' + Math.round(r.y) + ', w=' + Math.round(r.w) + ', h=' + Math.round(r.h) + '\n' +
                '框选(原图): x1=' + x1 + ', y1=' + y1 + ', x2=' + x2 + ', y2=' + y2 + '\n' +
                '参数: radius=' + this.data.inpaintRadius + ', feather=' + this.data.feather + ', sharpen=' + this.data.sharpen;

    this.setData({
      isLoading: true,
      loadingText: '正在读取图片...',
      debugInfo: debug
    });

    wx.getFileSystemManager().readFile({
      filePath: self.data.imageSrc,
      encoding: 'base64',
      success: function (readRes) {
        self.setData({ loadingText: '调用云函数 watermark3...' });

        wx.cloud.callFunction({
          name: 'watermark3',
          data: {
            img_base64: readRes.data,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            inpaint_radius: self.data.inpaintRadius,
            feather: self.data.feather,
            sharpen: self.data.sharpen
          },
          env: CLOUD_ENV,
          success: function (callRes) {
            self.setData({ isLoading: false, loadingText: '' });
            if (!callRes.result) {
              wx.showToast({ title: '处理失败', icon: 'none' });
              return;
            }
            var result = callRes.result;
            if (result.code !== 0) {
              wx.showModal({ title: '处理失败', content: result.msg || '未知错误', showCancel: false });
              return;
            }

            var base64Data = result.new_img_base64;
            var filePath = wx.env.USER_DATA_PATH + '/watermark3_' + Date.now() + '.png';
            wx.getFileSystemManager().writeFile({
              filePath: filePath,
              data: base64Data,
              encoding: 'base64',
              success: function () {
                self.setData({
                  resultSrc: filePath,
                  showResult: true,
                  selectMode: false
                });
                wx.showToast({ title: '去水印完成', icon: 'success' });
              },
              fail: function () {
                self.setData({ isLoading: false });
                wx.showToast({ title: '结果保存失败', icon: 'none' });
              }
            });
          },
          fail: function (err) {
            self.setData({ isLoading: false, loadingText: '' });
            var errMsg = '云函数调用失败';
            if (err.errMsg) {
              if (err.errMsg.indexOf('timeout') !== -1) errMsg = '请求超时，请稍后重试';
              else if (err.errMsg.indexOf('not found') !== -1) errMsg = '云函数 watermark3 未部署';
              else if (err.errMsg.indexOf('network') !== -1) errMsg = '网络连接失败';
            }
            wx.showModal({ title: '服务暂不可用', content: errMsg, showCancel: false });
          }
        });
      },
      fail: function () {
        self.setData({ isLoading: false, loadingText: '' });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  onSaveResult: function () {
    if (!this.data.resultSrc) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultSrc,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function (err) {
        if (err.errMsg.indexOf('auth') !== -1) {
          wx.showModal({
            title: '需要授权', content: '请授权保存图片到相册', confirmText: '去授权',
            success: function (res) { if (res.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  onReset: function () {
    this.setData({
      imageSrc: '',
      resultSrc: '',
      showResult: false,
      selectMode: false,
      hasRect: false,
      debugInfo: ''
    });
    this.currentRect = null;
    this.selectCanvas = null;
    this.selectCtx = null;
    this.selectBaseImage = null;
  },

  onReady: function () {
    // 测量 canvas 偏移以备回退使用
    var self = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.select('#selectCanvas').boundingClientRect(function (rect) {
        if (rect) {
          self._selectOffsetX = rect.left;
          self._selectOffsetY = rect.top;
        }
      }).exec();
    }, 500);
  }
});
