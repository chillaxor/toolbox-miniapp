Page({
  data: {
    position: 'back',
    segments: 6,
    segmentList: [4, 6, 8, 12],
    rotating: false,
    fullscreen: false,
    // build clip-path + transform for each segment at runtime
    segmentStyles: [],
    // keep camera alive flag
    cameraReady: false,
    rotationDeg: 0
  },

  cameraCtx: null,
  _timer: null,
  _rafId: null,

  onLoad: function () {
    this.cameraCtx = wx.createCameraContext();
    this._buildSegments(this.data.segments);
  },

  onShow: function () {
    this.setData({ cameraReady: true });
    if (this.data.rotating) {
      this._startRotation();
    }
  },

  onHide: function () {
    this._stopRotation();
  },

  onUnload: function () {
    this._stopRotation();
  },

  /* ------------------------------------------------------------------ */
  /*  Segment geometry                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Build the CSS styles for each kaleidoscope segment.
   *
   * Each segment is a camera view clipped to a triangle (pie slice) and
   * rotated into position around the circle.  Alternate segments are
   * mirror-flipped so the edges match, producing the classic kaleidoscope
   * reflection symmetry.
   *
   *   clip-path: polygon(50% 50%, 50% 0%, <outer-right-point>)
   *   transform: rotate(N * sliceAngle)
   *
   * The outer point is calculated so the triangle covers the slice.
   */
  _buildSegments: function (n) {
    var sliceAngle = 360 / n;
    // half-slice in radians – used to compute the outer edge of the triangle
    var halfRad = (sliceAngle / 2) * Math.PI / 180;
    // We want the two outer points of the triangle to lie on the circle edge.
    // With a 50% radius clip centred at (50%,50%), the outer-right point at
    // angle = sliceAngle sits at:
    //   x = 50 + 50 * sin(sliceAngle_rad)   (percentage of container width)
    //   y = 50 - 50 * cos(sliceAngle_rad)
    var fullRad = sliceAngle * Math.PI / 180;
    var outerX = 50 + 100 * Math.sin(fullRad);
    var outerY = 50 - 100 * Math.cos(fullRad);

    var clipPolygon = 'polygon(50% 50%, 50% 0%, ' + outerX.toFixed(2) + '% ' + outerY.toFixed(2) + '%)';

    var styles = [];
    for (var i = 0; i < n; i++) {
      // Alternate segments are mirrored so adjacent slices share an edge
      var flip = (i % 2 === 0) ? 1 : -1;
      var rotate = i * sliceAngle;
      // Build inline style string
      var style = '';
      style += 'position:absolute;top:0;left:0;width:100%;height:100%;';
      style += 'clip-path:' + clipPolygon + ';';
      style += '-webkit-clip-path:' + clipPolygon + ';';
      style += 'transform: rotate(' + rotate + 'deg) scaleX(' + flip + ');';
      style += 'transform-origin:50% 50%;';
      // For flipped segments we need to counter-rotate the inner camera view
      // so the image doesn't appear upside-down.  We handle that in the camera
      // sub-view inside each segment (see wxml).
      styles.push(style);
    }
    this.setData({ segmentStyles: styles });
  },

  /* ------------------------------------------------------------------ */
  /*  Rotation animation                                                 */
  /* ------------------------------------------------------------------ */

  _startRotation: function () {
    var that = this;
    var speed = 0.4; // degrees per frame (~24 deg/s at 60 fps)
    function tick() {
      var next = (that.data.rotationDeg + speed) % 360;
      that.setData({ rotationDeg: next });
      that._rafId = setTimeout(function () {
        // request next frame via setTimeout (no requestAnimationFrame in mini-program pages)
        tick();
      }, 16);
    }
    tick();
  },

  _stopRotation: function () {
    if (this._rafId) {
      clearTimeout(this._rafId);
      this._rafId = null;
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Event handlers                                                     */
  /* ------------------------------------------------------------------ */

  onSegmentChange: function (e) {
    var seg = parseInt(e.currentTarget.dataset.seg, 10);
    this.setData({ segments: seg });
    this._buildSegments(seg);
  },

  onToggleRotation: function () {
    var next = !this.data.rotating;
    this.setData({ rotating: next });
    if (next) {
      this._startRotation();
    } else {
      this._stopRotation();
      this.setData({ rotationDeg: 0 });
    }
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
    // Use canvas to capture the kaleidoscope viewport.
    // We draw a screenshot via CameraContext.takePhoto, then render into canvas.
    this.cameraCtx.takePhoto({
      quality: 'high',
      success: function (res) {
        var ctx = wx.createCanvasContext('kaleidoscope-canvas', that);
        var imgPath = res.tempImagePath;
        ctx.drawImage(imgPath, 0, 0, 600, 600);
        ctx.draw(false, function () {
          wx.canvasToTempFilePath({
            canvasId: 'kaleidoscope-canvas',
            quality: 1,
            success: function (tmpRes) {
              wx.saveImageToPhotosAlbum({
                filePath: tmpRes.tempFilePath,
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
                        if (mRes.confirm) {
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
            fail: function () {
              wx.showToast({ title: '生成截图失败', icon: 'none' });
            }
          });
        });
      },
      fail: function () {
        wx.showToast({ title: '拍照失败', icon: 'none' });
      }
    });
  },

  onCameraError: function (e) {
    console.error('camera error:', e.detail);
    wx.showToast({ title: '相机启动失败', icon: 'none' });
  },

  /* ------------------------------------------------------------------ */
  /*  Share                                                              */
  /* ------------------------------------------------------------------ */

  onShareAppMessage: function () {
    return {
      title: '万花筒 - 用手机相机看万花筒效果',
      path: '/pages/tools/kaleidoscope/index'
    };
  }
});
