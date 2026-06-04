/**
 * 万花筒 - 基于Canvas的实时万花筒效果
 * 通过摄像头 takePhoto 取帧 + Canvas绘制反射对称图案
 */

var _cameraCtx = null;
var _canvasCtx = null;
var _timer = null;
var _rotationAngle = 0;
var _canvasW = 310;
var _canvasH = 310;
var _capturing = false;
var _ctxReady = false; // canvas 是否已初始化

Page({
  data: {
    position: 'back',
    segments: 6,
    segmentList: [3, 4, 6, 8, 10, 12],
    rotating: true,
    fullscreen: false,
    speed: 2,
    speedList: [
      { label: '慢', value: 1 },
      { label: '中', value: 2 },
      { label: '快', value: 3 }
    ],
    colorMode: 0,
    colorList: [
      { label: '原色', value: 0 },
      { label: '暖色', value: 1 },
      { label: '冷色', value: 2 },
      { label: '幻彩', value: 3 }
    ],
    fps: 0,
    mirrorMode: 0,
    mirrorList: [
      { label: '标准', value: 0 },
      { label: '花朵', value: 1 },
      { label: '星芒', value: 2 }
    ]
  },

  onLoad: function () {
    _cameraCtx = wx.createCameraContext();
  },

  onReady: function () {
    var that = this;
    // 等 canvas 节点渲染完毕
    setTimeout(function () {
      _canvasCtx = wx.createCanvasContext('kaleido-canvas', that);
      wx.createSelectorQuery()
        .in(that)
        .select('#kaleido-canvas')
        .boundingClientRect(function (rect) {
          if (rect && rect.width > 0) {
            _canvasW = rect.width;
            _canvasH = rect.height;
          } else {
            // 回退：viewport 是 620rpx，换算成 px
            var sysInfo = wx.getSystemInfoSync();
            _canvasW = Math.floor(620 * sysInfo.windowWidth / 750);
            _canvasH = _canvasW;
          }
          _ctxReady = true;
          that._startCapture();
        })
        .exec();
    }, 600);
  },

  onShow: function () {
    // 只有 ctx 已就绪且没有在跑定时器时才重新启动
    if (_ctxReady && !_timer) {
      this._startCapture();
    }
  },

  onHide: function () {
    this._stopCapture();
  },

  onUnload: function () {
    this._stopCapture();
    _ctxReady = false;
    _canvasCtx = null;
    _cameraCtx = null;
  },

  /* ------------------------------------------------------------------ */
  /*  帧捕获与渲染                                                       */
  /* ------------------------------------------------------------------ */

  _startCapture: function () {
    var that = this;
    this._stopCapture();

    var frameCnt = 0;
    var lastTime = Date.now();

    _timer = setInterval(function () {
      that._captureAndRender();
      frameCnt++;
      var now = Date.now();
      if (now - lastTime >= 1000) {
        that.setData({ fps: frameCnt });
        frameCnt = 0;
        lastTime = now;
      }
    }, 300); // ~3fps，takePhoto 有延时，不能太快
  },

  _stopCapture: function () {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  },

  _captureAndRender: function () {
    var that = this;
    if (!_cameraCtx || !_ctxReady) return;
    if (_capturing) return; // 防止重叠调用

    _capturing = true;
    _cameraCtx.takePhoto({
      quality: 'low',
      success: function (res) {
        // takePhoto 完成后立即绘制，路径还有效
        that._drawKaleidoscope(res.tempImagePath);
      },
      fail: function () {
        // 静默失败，等下一帧
        _capturing = false;
      }
      // complete 不在这里重置，让 _drawKaleidoscope 回调里重置，
      // 避免还没画完就允许下一帧开始
    });
  },

  _drawKaleidoscope: function (imgPath) {
    var that = this;
    var ctx = _canvasCtx;
    if (!ctx) {
      _capturing = false;
      return;
    }

    var w = _canvasW;
    var h = _canvasH;
    var cx = w / 2;
    var cy = h / 2;
    var segments = this.data.segments;
    var angleStep = (2 * Math.PI) / segments;
    var speedVal = this.data.speed;
    var speedMap = { 1: 0.3, 2: 0.8, 3: 1.5 };
    var rotateSpeed = speedMap[speedVal] || 0.8;

    if (this.data.rotating) {
      _rotationAngle += rotateSpeed;
      if (_rotationAngle >= 360) _rotationAngle -= 360;
    }

    var rotationRad = _rotationAngle * Math.PI / 180;
    var outerR = Math.sqrt(cx * cx + cy * cy) + 4; // 足够覆盖整个画布

    // 清除画布
    ctx.clearRect(0, 0, w, h);
    ctx.setFillStyle('#0a0510');
    ctx.fillRect(0, 0, w, h);

    // 绘制每个扇区
    for (var i = 0; i < segments; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationRad + i * angleStep);

      // 计算当前扇区三角形的两个边界角
      var halfAngle = angleStep / 2;

      // 裁剪三角形扇区（从中心出发，包围整个扇区）
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        outerR * Math.sin(-halfAngle),
        -outerR * Math.cos(-halfAngle)
      );
      // 用多段线绕弧，确保完整覆盖扇区
      var steps = 6;
      for (var s = 0; s <= steps; s++) {
        var a = -halfAngle + (angleStep * s / steps);
        ctx.lineTo(outerR * Math.sin(a), -outerR * Math.cos(a));
      }
      ctx.closePath();
      ctx.clip();

      // 偶数扇区做水平镜像（相对于扇区中轴线）
      if (i % 2 === 1) {
        ctx.scale(-1, 1);
      }

      // 绘制图片
      this._drawSegmentImage(ctx, imgPath, w, h, i);

      ctx.restore();
    }

    // 绘制中心装饰
    this._drawCenterDecor(ctx, cx, cy);

    // 圆形边框
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, 2 * Math.PI);
    ctx.setStrokeStyle('rgba(167,139,250,0.3)');
    ctx.setLineWidth(3);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, cx - 8, 0, 2 * Math.PI);
    ctx.setStrokeStyle('rgba(167,139,250,0.1)');
    ctx.setLineWidth(10);
    ctx.stroke();

    // draw 完成后才允许下一帧
    ctx.draw(false, function () {
      _capturing = false;
    });
  },

  _drawSegmentImage: function (ctx, imgPath, w, h, segIndex) {
    var colorMode = this.data.colorMode;
    var mirrorMode = this.data.mirrorMode;
    var scale = 1.3;

    // 镜像模式附加旋转（在扇区坐标系内）
    if (mirrorMode === 1) {
      ctx.rotate(segIndex * 0.04);
    } else if (mirrorMode === 2) {
      ctx.rotate(segIndex * 0.1);
      scale = 1.5;
    }

    // 图片居中覆盖整个扇区
    ctx.drawImage(imgPath, -w * scale / 2, -h * scale / 2, w * scale, h * scale);

    // 颜色叠加
    if (colorMode === 1) {
      ctx.setFillStyle('rgba(255,120,30,0.15)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    } else if (colorMode === 2) {
      ctx.setFillStyle('rgba(30,100,255,0.15)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    } else if (colorMode === 3) {
      var hue = (segIndex * (360 / this.data.segments) + _rotationAngle * 2) % 360;
      ctx.setFillStyle('hsla(' + hue + ',80%,65%,0.18)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    }
  },

  _drawCenterDecor: function (ctx, cx, cy) {
    var time = _rotationAngle;
    var petals = this.data.segments;
    var petalAngle = (2 * Math.PI) / petals;

    // 外圈光晕
    var gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
    gradient.addColorStop(0, 'rgba(167,139,250,0.7)');
    gradient.addColorStop(0.5, 'rgba(167,139,250,0.25)');
    gradient.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.setFillStyle(gradient);
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
    ctx.fill();

    // 旋转装饰线
    for (var i = 0; i < petals; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * Math.PI / 180 + i * petalAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 0);
      ctx.setStrokeStyle('rgba(255,255,255,0.45)');
      ctx.setLineWidth(1.5);
      ctx.stroke();

      ctx.setFillStyle('rgba(255,255,255,0.65)');
      ctx.beginPath();
      ctx.arc(20, 0, 2.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // 中心实心圆
    ctx.setFillStyle('rgba(167,139,250,0.9)');
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
    ctx.fill();
  },

  /* ------------------------------------------------------------------ */
  /*  事件处理                                                            */
  /* ------------------------------------------------------------------ */

  onSegmentChange: function (e) {
    var seg = parseInt(e.currentTarget.dataset.seg, 10);
    this.setData({ segments: seg });
  },

  onSpeedChange: function (e) {
    var spd = parseInt(e.currentTarget.dataset.speed, 10);
    this.setData({ speed: spd });
  },

  onColorChange: function (e) {
    var mode = parseInt(e.currentTarget.dataset.color, 10);
    this.setData({ colorMode: mode });
  },

  onMirrorChange: function (e) {
    var mode = parseInt(e.currentTarget.dataset.mirror, 10);
    this.setData({ mirrorMode: mode });
  },

  onToggleRotation: function () {
    this.setData({ rotating: !this.data.rotating });
  },

  onSwitchCamera: function () {
    var next = this.data.position === 'front' ? 'back' : 'front';
    this.setData({ position: next });
  },

  onToggleFullscreen: function () {
    this.setData({ fullscreen: !this.data.fullscreen });
  },

  onSave: function () {
    var that = this;
    // 先暂停一帧，确保画面稳定再截图
    var wasCapturing = !!_timer;
    if (wasCapturing) this._stopCapture();

    wx.showLoading({ title: '生成中...' });

    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'kaleido-canvas',
        x: 0,
        y: 0,
        width: _canvasW,
        height: _canvasH,
        destWidth: _canvasW * 2,
        destHeight: _canvasH * 2,
        quality: 1,
        success: function (res) {
          wx.hideLoading();
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function () {
              wx.showToast({ title: '已保存到相册', icon: 'success' });
            },
            fail: function (err) {
              if (err.errMsg && err.errMsg.indexOf('auth') !== -1) {
                wx.showModal({
                  title: '需要授权',
                  content: '请允许访问相册以保存图片',
                  confirmText: '去设置',
                  success: function (mRes) {
                    if (mRes.confirm) wx.openSetting();
                  }
                });
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '截图失败', icon: 'none' });
        },
        complete: function () {
          // 恢复捕获
          if (wasCapturing) that._startCapture();
        }
      }, that);
    }, 100);
  },

  onCameraError: function (e) {
    console.error('camera error:', e.detail);
    wx.showToast({ title: '相机启动失败，请检查权限', icon: 'none' });
  },

  onShareAppMessage: function () {
    return {
      title: '万花筒 - 实时相机万花筒效果超美',
      path: '/pages/tools/kaleidoscope/index'
    };
  }
});
