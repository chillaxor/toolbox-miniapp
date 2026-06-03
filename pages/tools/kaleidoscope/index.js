/**
 * 万花筒 - 基于Canvas的实时万花筒效果
 * 通过单摄像头取帧 + Canvas绘制反射对称图案
 */

var _cameraCtx = null;
var _canvasCtx = null;
var _timer = null;
var _rotationAngle = 0;
var _frameCount = 0;
var _canvasW = 600;
var _canvasH = 600;
var _imageData = null;
var _imgPath = '';

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
    // 等待canvas就绪
    setTimeout(function () {
      _canvasCtx = wx.createCanvasContext('kaleido-canvas', that);
      _canvasW = 600;
      _canvasH = 600;
      that._startCapture();
    }, 300);
  },

  onShow: function () {
    if (_cameraCtx && !_timer) {
      this._startCapture();
    }
  },

  onHide: function () {
    this._stopCapture();
  },

  onUnload: function () {
    this._stopCapture();
  },

  /* ------------------------------------------------------------------ */
  /*  帧捕获与渲染                                                       */
  /* ------------------------------------------------------------------ */

  _startCapture: function () {
    var that = this;
    this._stopCapture();

    var fpsTimer = null;
    var frameCnt = 0;
    var lastTime = Date.now();

    // 使用interval定时器模拟帧率
    _timer = setInterval(function () {
      that._captureAndRender();
      frameCnt++;
      var now = Date.now();
      if (now - lastTime >= 1000) {
        that.setData({ fps: frameCnt });
        frameCnt = 0;
        lastTime = now;
      }
    }, 66); // ~15fps for stability
  },

  _stopCapture: function () {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  },

  _captureAndRender: function () {
    var that = this;
    if (!_cameraCtx) return;

    _cameraCtx.takePhoto({
      quality: 'low',
      success: function (res) {
        _imgPath = res.tempImagePath;
        that._drawKaleidoscope(res.tempImagePath);
      },
      fail: function () {
        // 静默失败，等下一帧
      }
    });
  },

  _drawKaleidoscope: function (imgPath) {
    var that = this;
    var ctx = _canvasCtx;
    if (!ctx) return;

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

    // 清除画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景渐变
    var bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    bgGrad.addColorStop(0, 'rgba(20,10,40,0.3)');
    bgGrad.addColorStop(1, 'rgba(10,5,20,0.8)');
    ctx.setFillStyle(bgGrad);
    ctx.fillRect(0, 0, w, h);

    // 绘制每个扇区
    for (var i = 0; i < segments; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationRad + i * angleStep);

      // 裁剪三角形扇区
      ctx.beginPath();
      ctx.moveTo(0, 0);
      var outerR = Math.max(w, h);
      ctx.lineTo(outerR * Math.sin(angleStep / 2), -outerR * Math.cos(angleStep / 2));
      ctx.lineTo(0, -outerR);
      ctx.closePath();
      ctx.clip();

      // 镜像偶数扇区
      if (i % 2 === 1) {
        ctx.scale(-1, 1);
      }

      // 应用颜色模式变换的绘制
      this._drawSegmentImage(ctx, imgPath, w, h, i);

      ctx.restore();
    }

    // 绘制中心装饰
    this._drawCenterDecor(ctx, cx, cy);

    // 绘制边框
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, 2 * Math.PI);
    ctx.setStrokeStyle('rgba(167,139,250,0.3)');
    ctx.setLineWidth(3);
    ctx.stroke();

    // 内边框光晕
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 8, 0, 2 * Math.PI);
    ctx.setStrokeStyle('rgba(167,139,250,0.15)');
    ctx.setLineWidth(6);
    ctx.stroke();

    ctx.draw(false);
  },

  _drawSegmentImage: function (ctx, imgPath, w, h, segIndex) {
    var colorMode = this.data.colorMode;
    var mirrorMode = this.data.mirrorMode;
    var scale = 1.2 + (segIndex % 3) * 0.1;

    // 根据镜像模式调整绘制
    if (mirrorMode === 1) {
      // 花朵模式 - 额外旋转偏移
      ctx.rotate(segIndex * 0.05);
    } else if (mirrorMode === 2) {
      // 星芒模式 - 更大的偏移
      ctx.rotate(segIndex * 0.12);
      scale *= 1.1;
    }

    ctx.drawImage(imgPath, -w * scale / 2, -h * scale / 2, w * scale, h * scale);

    // 颜色叠加效果
    if (colorMode === 1) {
      // 暖色
      ctx.setFillStyle('rgba(255,100,50,0.12)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    } else if (colorMode === 2) {
      // 冷色
      ctx.setFillStyle('rgba(50,100,255,0.12)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    } else if (colorMode === 3) {
      // 幻彩 - 根据扇区和时间变化
      var hue = (segIndex * 360 / this.data.segments + _rotationAngle) % 360;
      ctx.setFillStyle('hsla(' + hue + ',70%,60%,0.15)');
      ctx.fillRect(-w, -h, w * 2, h * 2);
    }
  },

  _drawCenterDecor: function (ctx, cx, cy) {
    var time = _rotationAngle;

    // 外圈光晕
    var gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    gradient.addColorStop(0, 'rgba(167,139,250,0.6)');
    gradient.addColorStop(0.5, 'rgba(167,139,250,0.2)');
    gradient.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.setFillStyle(gradient);
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, 2 * Math.PI);
    ctx.fill();

    // 中心圆
    ctx.setFillStyle('rgba(167,139,250,0.8)');
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fill();

    // 旋转的装饰线条
    var petals = this.data.segments;
    var petalAngle = (2 * Math.PI) / petals;
    for (var i = 0; i < petals; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * Math.PI / 180 + i * petalAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(28, 0);
      ctx.setStrokeStyle('rgba(255,255,255,0.4)');
      ctx.setLineWidth(1.5);
      ctx.stroke();

      // 小装饰点
      ctx.setFillStyle('rgba(255,255,255,0.6)');
      ctx.beginPath();
      ctx.arc(22, 0, 2.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
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
    wx.canvasToTempFilePath({
      canvasId: 'kaleido-canvas',
      quality: 1,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail: function (err) {
            if (err.errMsg && err.errMsg.indexOf('auth') !== -1) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存相册权限',
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
        wx.showToast({ title: '截图失败', icon: 'none' });
      }
    });
  },

  onCameraError: function (e) {
    console.error('camera error:', e.detail);
    wx.showToast({ title: '相机启动失败', icon: 'none' });
  },

  onShareAppMessage: function () {
    return {
      title: '万花筒 - 实时相机万花筒效果超美',
      path: '/pages/tools/kaleidoscope/index'
    };
  }
});
