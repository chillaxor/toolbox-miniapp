var mediaCheck = require('../../../utils/mediaCheck.js');
var storage = require('../../../utils/storage.js');

var CLOUD_ENV = 'cloud1-d9gm1qla9bebafa31';

Page({
  data: {
    imageSrc: '',
    resultSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    isFavorite: false,
    isLoading: false,
    loadingText: '',
    selectMode: false,
    editMode: false,
    showResult: false,
    cloudReady: false,
    dailyUsed: 0,
    dailyRemaining: 2,
    dailyLimit: 2,
    monthlyUsed: 0,
    monthlyRemaining: 50,
    monthlyLimit: 50,
    drawMode: 'brush',
    brushSize: 20,
    rectCount: 0,
    tips: [
      '先在图片上框选水印区域，再点击AI去水印',
      'AI处理后仍可手动涂抹修补残留痕迹',
      '涂抹时自动采样周围颜色，修复效果自然'
    ]
  },

  ctx: null,
  canvas: null,
  dpr: 1,
  imgObj: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  rectStart: null,
  baseImageData: null,
  historyStack: [],
  canvasOffsetX: 0,
  canvasOffsetY: 0,
  canvasWidthVal: 0,
  canvasHeightVal: 0,
  maxCanvasHeight: 500,

  // 框选相关
  selectCanvas: null,
  selectCtx: null,
  selectImgObj: null,
  selectRects: [],       // 画布坐标的矩形列表
  selectBaseImage: null, // 框选canvas的底图ImageData
  isSelecting: false,
  selectStartPos: null,
  selectOffsetX: 0,
  selectOffsetY: 0,

  onLoad: function () {
    this.checkFavorite();
    this.checkCloudReady();
    var sysInfo = wx.getWindowInfo();
    var rpxToPx = sysInfo.windowWidth / 750;
    // edit-area padding 16rpx 两侧 = 32rpx，canvas-wrapper border 2rpx 两侧 = 4rpx
    this.maxCanvasWidth = Math.floor(sysInfo.windowWidth - (32 + 4) * rpxToPx);
    var maxCanvasH = sysInfo.windowHeight - 44 - 40 - 180 - 30;
    if (maxCanvasH < 200) maxCanvasH = 200;
    this.maxCanvasHeight = maxCanvasH;
  },

  onShow: function () {
    this.checkFavorite();
  },

  onPageScroll: function () {
    // clientY 和 boundingRect().top 都是视口坐标，相减自动抵消滚动，无需刷新偏移
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('watermarkremove') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('watermarkremove') });
  },

  checkCloudReady: function () {
    var self = this;
    if (!wx.cloud) {
      self.setData({ cloudReady: false });
      return;
    }
    wx.cloud.callFunction({
      name: 'watermarkremove',
      data: { action: 'quota' },
      env: CLOUD_ENV,
      success: function (res) {
        self.setData({ cloudReady: true });
        if (res.result && res.result.success) {
          self.setData({
            dailyUsed: res.result.dailyUsed,
            dailyRemaining: res.result.dailyRemaining,
            dailyLimit: res.result.dailyLimit,
            monthlyUsed: res.result.monthlyUsed,
            monthlyRemaining: res.result.monthlyRemaining,
            monthlyLimit: res.result.monthlyLimit
          });
        }
      },
      fail: function () {
        self.setData({ cloudReady: false });
      }
    });
  },

  onChooseImage: function () {
    var self = this;
    mediaCheck.chooseMediaWithCheck({
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
          editMode: false,
          selectMode: false
        }, function () {
          self.enterSelectMode(file.tempFilePath);
        });
      }
    });
  },

  /* ====== 框选水印区域 ====== */

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
          editMode: false,
          showResult: false,
          imageWidth: info.width,
          imageHeight: info.height,
          canvasWidth: cw,
          canvasHeight: ch,
          rectCount: 0
        }, function () {
          self.initSelectCanvas(path, cw, ch);
        });
      }
    });
  },

  onExitSelect: function () {
    this.setData({ selectMode: false, imageSrc: '' });
    this.selectRects = [];
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
          self.selectRects = [];
          self.selectBaseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // 优先立即测量 Canvas 相对页面的偏移，避免快速触碰时出现错位
          self._refreshSelectOffset(0);
          setTimeout(function () {
            self._refreshSelectOffset(0);
          }, 500);
        };
        img.src = path;
      });
  },

  _refreshSelectOffset: function (retryCount) {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#selectCanvas').boundingClientRect(function (rect) {
      if (rect && rect.left !== undefined) {
        self.selectOffsetX = rect.left;
        self.selectOffsetY = rect.top;
        console.log('[watermarkremove] selectOffset:', rect.left, rect.top);
      } else if (retryCount < 3) {
        // 测量失败，300ms后重试
        setTimeout(function () {
          self._refreshSelectOffset(retryCount + 1);
        }, 300);
      }
    }).exec();
  },

  _getSelectTouchPos: function (touch) {
    // 微信小程序 Canvas 2D 组件中，touch.x/y 是相对于 Canvas 元素的 CSS 像素坐标，直接使用即可
    var cw = this.data.canvasWidth || 0;
    var ch = this.data.canvasHeight || 0;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    if (typeof touch.x === 'number' && typeof touch.y === 'number') {
      // touch.x/y 已经是相对 Canvas 的 CSS 像素坐标，不需要除以 DPR，也不需要减 offset
      var x = clamp(touch.x, 0, cw);
      var y = clamp(touch.y, 0, ch);
      console.log('[watermarkremove] _getSelectTouchPos touch.x/y =', touch.x, touch.y, '-> clamped=', x, y);
      return { x: x, y: y };
    }

    // 回退：用 clientX/Y 减去 Canvas 在页面中的偏移
    var px = (touch.clientX || 0) - (this.selectOffsetX || 0);
    var py = (touch.clientY || 0) - (this.selectOffsetY || 0);
    px = clamp(px, 0, cw);
    py = clamp(py, 0, ch);
    console.log('[watermarkremove] _getSelectTouchPos fallback client, client=(', touch.clientX, touch.clientY, '), offset=(', this.selectOffsetX, this.selectOffsetY, '), pos=(', px, py, ')');
    return { x: px, y: py };
  },

  onSelectStart: function (e) {
    var touch = e.touches[0];
    console.log('[watermarkremove] onSelectStart event touches[0]=', touch, 'selectOffset=', this.selectOffsetX, this.selectOffsetY, 'canvas=', this.data.canvasWidth, this.data.canvasHeight);
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

    // 画已有的矩形
    this._drawExistingRects();

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
      return;
    }

    var rect = {
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: rw,
      h: rh
    };
    this.selectRects.push(rect);
    this.setData({ rectCount: this.selectRects.length });

    // 重新绘制所有矩形
    this._redrawSelect();
  },

  _drawExistingRects: function () {
    var ctx = this.selectCtx;
    var rects = this.selectRects;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      ctx.save();
      ctx.strokeStyle = '#E67E22';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(230, 126, 34, 0.2)';
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // 编号标签
      ctx.fillStyle = '#E67E22';
      ctx.font = '12px sans-serif';
      ctx.fillText(String(i + 1), r.x + 4, r.y + 14);
      ctx.restore();
    }
  },

  _redrawSelect: function () {
    if (!this.selectCtx || !this.selectBaseImage) return;
    this.selectCtx.putImageData(this.selectBaseImage, 0, 0);
    this._drawExistingRects();
  },

  onClearRects: function () {
    this.selectRects = [];
    this.setData({ rectCount: 0 });
    this._redrawSelect();
  },

  /* ====== AI 去水印 ====== */

  onStartAI: function () {
    if (this.selectRects.length === 0) {
      wx.showToast({ title: '请先框选水印区域', icon: 'none' });
      return;
    }
    if (this.data.dailyRemaining <= 0) {
      wx.showModal({ title: '今日次数已用完', content: '明天再来吧', showCancel: false });
      return;
    }
    if (this.data.monthlyRemaining <= 0) {
      wx.showModal({ title: '总额度已用完', content: '本月全局总额度已用完，下月自动恢复', showCancel: false });
      return;
    }

    var self = this;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var iw = this.data.imageWidth;
    var ih = this.data.imageHeight;

    // 将画布坐标转换为原图坐标
    var rectangles = [];
    for (var i = 0; i < this.selectRects.length; i++) {
      var r = this.selectRects[i];
      rectangles.push({
        left: Math.round(r.x / cw * iw),
        top: Math.round(r.y / ch * ih),
        width: Math.round(r.w / cw * iw),
        height: Math.round(r.h / ch * ih)
      });
    }

    this.setData({ isLoading: true, loadingText: '正在读取图片...' });

    wx.getFileSystemManager().readFile({
      filePath: self.data.imageSrc,
      encoding: 'base64',
      success: function (readRes) {
        self.setData({ loadingText: 'AI正在去除水印...' });

        wx.cloud.callFunction({
          name: 'watermarkremove',
          data: {
            action: 'remove',
            imageBase64: readRes.data,
            rectangle: rectangles
          },
          env: CLOUD_ENV,
          success: function (callRes) {
            self.setData({ isLoading: false, loadingText: '' });
            if (!callRes.result) {
              wx.showToast({ title: '处理失败', icon: 'none' });
              return;
            }
            var result = callRes.result;
            if (!result.success) {
              if (result.errorCode === 'QUOTA_EXCEEDED') {
                self.setData({ monthlyRemaining: 0 });
                wx.showModal({ title: '总额度已用完', content: '本月全局总额度已用完，下月自动恢复', showCancel: false });
              } else if (result.errorCode === 'DAILY_LIMIT') {
                self.setData({ dailyRemaining: 0 });
                wx.showModal({ title: '今日次数已用完', content: '明天再来吧', showCancel: false });
              } else {
                wx.showModal({ title: '处理失败', content: result.errorMsg || '未知错误', showCancel: false });
              }
              return;
            }

            var base64Data = result.imageProcessed;
            var filePath = wx.env.USER_DATA_PATH + '/watermarkremove_' + Date.now() + '.png';
            wx.getFileSystemManager().writeFile({
              filePath: filePath,
              data: base64Data,
              encoding: 'base64',
              success: function () {
                self.setData({
                  resultSrc: filePath,
                  showResult: true,
                  selectMode: false,
                  dailyUsed: result.dailyUsed,
                  dailyRemaining: result.dailyRemaining,
                  monthlyUsed: result.monthlyUsed,
                  monthlyRemaining: result.monthlyRemaining
                });
                wx.showToast({ title: '去水印完成', icon: 'success' });
                storage.addHistory({
                  toolId: 'watermarkremove', toolName: '去水印', category: 'image',
                  summary: 'AI去水印处理完成',
                  timestamp: Date.now()
                });
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
              else if (err.errMsg.indexOf('not found') !== -1) errMsg = '云函数未部署';
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

  /* ====== 保存 AI 结果 ====== */

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

  /* ====== 手动涂抹模式 ====== */

  onEnterManual: function () {
    if (!this.data.imageSrc) return;
    var self = this;

    // 没有框选区域，直接进入手动涂抹
    if (this.selectRects.length === 0) {
      self._enterManualEditMode(self.data.imageSrc);
      return;
    }

    // 有框选区域，先调用 watermark3 云函数预处理，再进入手动涂抹
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var iw = this.data.imageWidth;
    var ih = this.data.imageHeight;

    var rects = [];
    for (var i = 0; i < this.selectRects.length; i++) {
      var r = this.selectRects[i];
      rects.push({
        x1: Math.round(r.x / cw * iw),
        y1: Math.round(r.y / ch * ih),
        x2: Math.round((r.x + r.w) / cw * iw),
        y2: Math.round((r.y + r.h) / ch * ih)
      });
    }

    this.setData({ isLoading: true, loadingText: '正在读取图片...' });

    wx.getFileSystemManager().readFile({
      filePath: self.data.imageSrc,
      encoding: 'base64',
      success: function (readRes) {
        self._processWatermark3Chain(readRes.data, rects, 0, function (finalBase64) {
          var filePath = wx.env.USER_DATA_PATH + '/watermark3_' + Date.now() + '.png';
          wx.getFileSystemManager().writeFile({
            filePath: filePath,
            data: finalBase64,
            encoding: 'base64',
            success: function () {
              self.setData({ isLoading: false, loadingText: '' });
              self._enterManualEditMode(filePath);
            },
            fail: function () {
              self.setData({ isLoading: false, loadingText: '' });
              wx.showToast({ title: '预处理结果保存失败', icon: 'none' });
            }
          });
        }, function (errMsg) {
          self.setData({ isLoading: false, loadingText: '' });
          wx.showModal({
            title: '预处理失败',
            content: errMsg + '，将直接进入手动涂抹',
            showCancel: false,
            success: function () {
              self._enterManualEditMode(self.data.imageSrc);
            }
          });
        });
      },
      fail: function () {
        self.setData({ isLoading: false, loadingText: '' });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  // 串行调用 watermark3 云函数处理多个矩形
  _processWatermark3Chain: function (imgBase64, rects, index, onSuccess, onFail) {
    var self = this;
    if (index >= rects.length) {
      onSuccess(imgBase64);
      return;
    }
    var r = rects[index];
    self.setData({ loadingText: '正在预处理第 ' + (index + 1) + '/' + rects.length + ' 个区域...' });

    wx.cloud.callFunction({
      name: 'watermark3',
      data: {
        img_base64: imgBase64,
        x1: r.x1,
        y1: r.y1,
        x2: r.x2,
        y2: r.y2,
        inpaint_radius: 5,
        feather: 8,
        sharpen: true
      },
      env: CLOUD_ENV,
      success: function (callRes) {
        if (!callRes.result || callRes.result.code !== 0) {
          var msg = (callRes.result && callRes.result.msg) || '云函数返回异常';
          onFail(msg);
          return;
        }
        self._processWatermark3Chain(callRes.result.new_img_base64, rects, index + 1, onSuccess, onFail);
      },
      fail: function (err) {
        var errMsg = '云函数调用失败';
        if (err.errMsg) {
          if (err.errMsg.indexOf('timeout') !== -1) errMsg = '请求超时，请稍后重试';
          else if (err.errMsg.indexOf('not found') !== -1) errMsg = '云函数 watermark3 未部署';
          else if (err.errMsg.indexOf('network') !== -1) errMsg = '网络连接失败';
        }
        onFail(errMsg);
      }
    });
  },

  // 进入手动涂抹编辑模式（计算尺寸并初始化 canvas）
  _enterManualEditMode: function (src) {
    var self = this;
    wx.getImageInfo({
      src: src,
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
          editMode: true,
          selectMode: false,
          imageWidth: info.width,
          imageHeight: info.height,
          canvasWidth: cw,
          canvasHeight: ch,
          showResult: false
        }, function () {
          self.initCanvas(src, cw, ch);
        });
      }
    });
  },

  onEnterManualEdit: function () {
    var src = this.data.resultSrc || this.data.imageSrc;
    if (!src) return;
    var self = this;
    wx.getImageInfo({
      src: src,
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
          editMode: true,
          selectMode: false,
          imageWidth: info.width,
          imageHeight: info.height,
          canvasWidth: cw,
          canvasHeight: ch,
          showResult: false
        }, function () {
          self.initCanvas(src, cw, ch);
        });
      }
    });
  },

  onExitEdit: function () {
    if (this.data.resultSrc) {
      this.setData({ editMode: false, showResult: true });
    } else {
      this.setData({ editMode: false });
    }
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
          self.canvas = canvas;
          self.dpr = dpr;
          self.canvasWidthVal = cw;
          self.canvasHeightVal = ch;
          self.baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          self.historyStack = [];
          setTimeout(function () {
            self._refreshCanvasOffset(0);
          }, 500);
        };
        img.src = path;
      });
  },

  _refreshCanvasOffset: function (retryCount) {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#drawCanvas').boundingClientRect(function (rect) {
      if (rect && rect.left !== undefined) {
        self.canvasOffsetX = rect.left;
        self.canvasOffsetY = rect.top;
        console.log('[watermarkremove] canvasOffset:', rect.left, rect.top);
      } else if (retryCount < 3) {
        setTimeout(function () {
          self._refreshCanvasOffset(retryCount + 1);
        }, 300);
      }
    }).exec();
  },

  _getTouchPos: function (touch) {
    return {
      x: touch.clientX - (this.canvasOffsetX || 0),
      y: touch.clientY - (this.canvasOffsetY || 0)
    };
  },

  _sampleSurroundingColor: function (x, y, radius) {
    if (!this.baseImageData) return '#FFFFFF';
    var imgData = this.baseImageData;
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = imgData.data;
    var px = Math.round(x * this.dpr);
    var py = Math.round(y * this.dpr);
    var r = Math.round(radius * this.dpr);
    var totalR = 0, totalG = 0, totalB = 0, count = 0;
    var step = Math.max(1, Math.round(r / 8));

    for (var dy = -r; dy <= r; dy += step) {
      for (var dx = -r; dx <= r; dx += step) {
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r || dist < r * 0.4) continue;
        var sx = px + dx;
        var sy = py + dy;
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        var idx = (sy * w + sx) * 4;
        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
        count++;
      }
    }

    if (count === 0) return '#FFFFFF';
    var avgR = Math.round(totalR / count);
    var avgG = Math.round(totalG / count);
    var avgB = Math.round(totalB / count);
    return 'rgb(' + avgR + ',' + avgG + ',' + avgB + ')';
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
      this.drawSmartBrush(pos.x, pos.y, pos.x, pos.y);
    }
  },

  onDrawMove: function (e) {
    if (!this.isDrawing || !this.ctx) return;
    var touch = e.touches[0];
    var pos = this._getTouchPos(touch);
    if (this.data.drawMode === 'brush') {
      this.drawSmartBrush(this.lastX, this.lastY, pos.x, pos.y);
      this.lastX = pos.x;
      this.lastY = pos.y;
    }
  },

  onDrawEnd: function (e) {
    if (!this.isDrawing || !this.ctx) return;
    if (this.data.drawMode === 'rect' && this.rectStart && e.changedTouches && e.changedTouches[0]) {
      var touch = e.changedTouches[0];
      var pos = this._getTouchPos(touch);
      this.drawSmartRect(this.rectStart.x, this.rectStart.y, pos.x, pos.y);
      this.rectStart = null;
    }
    this.saveHistory();
    this.isDrawing = false;
  },

  drawSmartBrush: function (x1, y1, x2, y2) {
    var ctx = this.ctx;
    var size = this.data.brushSize;
    var midX = (x1 + x2) / 2;
    var midY = (y1 + y2) / 2;
    var color = this._sampleSurroundingColor(midX, midY, size);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  },

  drawSmartRect: function (x1, y1, x2, y2) {
    var ctx = this.ctx;
    var rx = Math.min(x1, x2);
    var ry = Math.min(y1, y2);
    var rw = Math.abs(x2 - x1);
    var rh = Math.abs(y2 - y1);
    var color = this._sampleSurroundingColor(rx + rw / 2, ry + rh / 2, Math.max(rw, rh) / 2);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  },

  saveHistory: function () {
    if (!this.canvas) return;
    var data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (this.historyStack.length >= 20) this.historyStack.shift();
    this.historyStack.push(data);
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
              toolId: 'watermarkremove', toolName: '去水印', category: 'image',
              summary: '手动涂抹去水印并保存',
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

  onReset: function () {
    this.setData({
      imageSrc: '',
      resultSrc: '',
      showResult: false,
      editMode: false,
      selectMode: false
    });
    this.ctx = null;
    this.canvas = null;
    this.selectCanvas = null;
    this.selectCtx = null;
    this.selectRects = [];
    this.historyStack = [];
  },

  onShareAppMessage: function () {
    return { title: '去水印 - AI智能去除图片水印', path: '/packages/imgTools/watermarkremove/index' };
  }
});
