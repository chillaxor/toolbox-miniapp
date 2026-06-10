var GifEncoder = require('../../../utils/gif-encoder.js');
var fs = wx.getFileSystemManager();

Page({
  data: {
    frames: [],
    currentFrame: 0,
    delay: 300,
    fps: 3,
    outputWidth: 360,
    canvasW: 320,
    canvasH: 320,
    previewing: false,
    generating: false,
    progress: 0,
    sizeOptions: [
      { label: '240px', value: 240 },
      { label: '360px', value: 360 },
      { label: '480px', value: 480 },
      { label: '640px', value: 640 }
    ]
  },

  previewTimer: null,
  frameIndex: 0,
  imageCache: {},

  onLoad: function () {
    var sys = wx.getSystemInfoSync();
    var cw = Math.min(sys.windowWidth - 48, 360);
    this.setData({ canvasW: cw, canvasH: cw });
  },

  onUnload: function () {
    this.stopPreview();
  },

  chooseImages: function () {
    var that = this;
    var remaining = 30 - that.data.frames.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多30张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        var newFrames = res.tempFiles.map(function (f) {
          return { tempPath: f.tempFilePath, size: f.size };
        });
        var all = that.data.frames.concat(newFrames);
        that.setData({ frames: all });
        that.loadImageForPreview(0);
      }
    });
  },

  selectFrame: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({ currentFrame: idx });
    this.loadImageForPreview(idx);
    if (this.data.previewing) {
      this.stopPreview();
    }
  },

  deleteFrame: function (e) {
    var idx = e.currentTarget.dataset.index;
    var frames = this.data.frames;
    frames.splice(idx, 1);
    this.setData({
      frames: frames,
      currentFrame: Math.min(this.data.currentFrame, Math.max(0, frames.length - 1))
    });
    if (frames.length === 0) this.stopPreview();
  },

  onDelayChange: function (e) {
    var val = e.detail.value;
    this.setData({ delay: val, fps: Math.round(1000 / val) });
    if (this.data.previewing) {
      this.stopPreview();
      this.startPreview();
    }
  },

  selectSize: function (e) {
    this.setData({ outputWidth: e.currentTarget.dataset.value });
  },

  togglePreview: function () {
    if (this.data.previewing) {
      this.stopPreview();
    } else {
      this.startPreview();
    }
  },

  loadImageForPreview: function (idx) {
    var that = this;
    if (!that.data.frames[idx]) return;
    var path = that.data.frames[idx].tempPath;
    if (that.imageCache[path]) {
      that.drawImageToCanvas(that.imageCache[path]);
      return;
    }
    wx.getImageInfo({
      src: path,
      success: function (info) {
        var img = { path: path, width: info.width, height: info.height };
        that.imageCache[path] = img;
        that.drawImageToCanvas(img);
      }
    });
  },

  drawImageToCanvas: function (img) {
    var that = this;
    var ctx = wx.createCanvasContext('previewCanvas', that);
    var cw = that.data.canvasW, ch = that.data.canvasH;
    ctx.clearRect(0, 0, cw, ch);
    var scale = Math.min(cw / img.width, ch / img.height);
    var dw = img.width * scale, dh = img.height * scale;
    var ox = (cw - dw) / 2, oy = (ch - dh) / 2;
    ctx.drawImage(img.path, ox, oy, dw, dh);
    ctx.draw();
  },

  startPreview: function () {
    var that = this;
    if (that.data.frames.length < 2) return;
    that.setData({ previewing: true });
    that.frameIndex = 0;
    that.previewTick();
  },

  previewTick: function () {
    var that = this;
    if (!that.data.previewing) return;
    that.loadImageForPreview(that.frameIndex);
    that.frameIndex = (that.frameIndex + 1) % that.data.frames.length;
    that.previewTimer = setTimeout(function () {
      that.previewTick();
    }, that.data.delay);
  },

  stopPreview: function () {
    this.setData({ previewing: false });
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
  },

  exportGif: function () {
    var that = this;
    if (that.data.generating) return;
    if (that.data.frames.length < 2) {
      wx.showToast({ title: '至少需要2张图片', icon: 'none' });
      return;
    }

    that.stopPreview();
    that.setData({ generating: true, progress: 0 });

    var targetW = that.data.outputWidth;
    var total = that.data.frames.length;
    var encoder = null;
    var processedCount = 0;

    // 先获取第一帧尺寸确定输出高度
    wx.getImageInfo({
      src: that.data.frames[0].tempPath,
      success: function (firstInfo) {
        var ratio = firstInfo.height / firstInfo.width;
        var targetH = Math.round(targetW * ratio);
        // 确保高度为偶数
        if (targetH % 2 !== 0) targetH += 1;
        encoder = new GifEncoder(targetW, targetH);
        encoder.setDelay(that.data.delay);
        encoder.setRepeat(0);
        processFrame(0);
      },
      fail: function () {
        wx.showToast({ title: '读取图片失败', icon: 'none' });
        that.setData({ generating: false });
      }
    });

    function processFrame(idx) {
      if (idx >= total) {
        doEncode();
        return;
      }

      var frame = that.data.frames[idx];

      wx.getImageInfo({
        src: frame.tempPath,
        success: function (info) {
          var ratio = info.height / info.width;
          var targetH = Math.round(targetW * ratio);
          if (targetH % 2 !== 0) targetH += 1;

          var ctx = wx.createCanvasContext('exportCanvas', that);
          ctx.drawImage(frame.tempPath, 0, 0, targetW, targetH);
          ctx.draw(false, function () {
            setTimeout(function () {
              wx.canvasGetImageData({
                canvasId: 'exportCanvas',
                x: 0, y: 0,
                width: targetW,
                height: targetH,
                success: function (imgRes) {
                  encoder.addFrame(new Uint8ClampedArray(imgRes.data));
                  processedCount++;
                  that.setData({ progress: Math.round(processedCount / total * 80) });
                  processFrame(idx + 1);
                },
                fail: function (err) {
                  console.error('canvasGetImageData失败:', err);
                  var blank = new Uint8ClampedArray(targetW * targetH * 4);
                  for (var p = 0; p < targetW * targetH; p++) {
                    blank[p * 4] = 200; blank[p * 4 + 1] = 200;
                    blank[p * 4 + 2] = 200; blank[p * 4 + 3] = 255;
                  }
                  encoder.addFrame(blank);
                  processedCount++;
                  that.setData({ progress: Math.round(processedCount / total * 80) });
                  processFrame(idx + 1);
                }
              });
            }, 300);
          });
        },
        fail: function (err) {
          console.error('getImageInfo失败:', err);
          processFrame(idx + 1);
        }
      });
    }

    function doEncode() {
      that.setData({ progress: 90 });
      try {
        var gifBuffer = encoder.encode();
        that.setData({ progress: 95 });
        var filePath = wx.env.USER_DATA_PATH + '/gif_' + Date.now() + '.gif';
        fs.writeFile({
          filePath: filePath,
          data: gifBuffer,
          encoding: 'binary',
          success: function () {
            that.setData({ progress: 100 });
            wx.saveImageToPhotosAlbum({
              filePath: filePath,
              success: function () {
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function (err) {
                if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
                  wx.showModal({
                    title: '需要授权',
                    content: '请在设置中允许保存到相册',
                    confirmText: '去设置',
                    success: function (res) { if (res.confirm) wx.openSetting(); }
                  });
                } else {
                  wx.showToast({ title: '保存失败', icon: 'none' });
                }
              },
              complete: function () {
                that.setData({ generating: false });
              }
            });
          },
          fail: function () {
            wx.showToast({ title: '写入文件失败', icon: 'none' });
            that.setData({ generating: false });
          }
        });
      } catch (e) {
        console.error('GIF编码失败:', e);
        wx.showToast({ title: '编码失败', icon: 'none' });
        that.setData({ generating: false });
      }
    }
  }
});
