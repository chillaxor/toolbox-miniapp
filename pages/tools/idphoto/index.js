var storage = require('../../../utils/storage.js');

var SIZES = [
  { name: '一寸', w: 295, h: 413, label: '25x35mm' },
  { name: '二寸', w: 413, h: 579, label: '35x49mm' },
  { name: '小一寸', w: 260, h: 378, label: '22x32mm' },
  { name: '小二寸', w: 413, h: 531, label: '35x45mm' },
  { name: '大一寸', w: 390, h: 567, label: '33x48mm' },
  { name: '大二寸', w: 413, h: 626, label: '35x53mm' },
  { name: '签证照', w: 600, h: 600, label: '51x51mm' },
  { name: '护照', w: 390, h: 567, label: '33x48mm' }
];

var BG_COLORS = [
  { name: '白色', color: '#FFFFFF', rgb: [255, 255, 255] },
  { name: '蓝色', color: '#438EDB', rgb: [67, 142, 219] },
  { name: '红色', color: '#D03C2F', rgb: [208, 60, 47] },
  { name: '渐变蓝', color: '#6BA4E0', rgb: [107, 164, 224] }
];

var LAYOUTS = [
  { name: '单张', cols: 1, rows: 1 },
  { name: '4 张拼图', cols: 2, rows: 2 },
  { name: '6 张拼图', cols: 2, rows: 3 }
];

// 颜色距离阈值
var COLOR_THRESHOLD = 80;

// 像素处理的最大尺寸（避免内存溢出）
var MAX_PROCESS_SIZE = 800;

function colorDist(r1, g1, b1, r2, g2, b2) {
  var dr = r1 - r2;
  var dg = g1 - g2;
  var db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

Page({
  data: {
    photoPath: '',
    sizeIdx: 0,
    sizes: SIZES,
    layoutIdx: 0,
    layouts: LAYOUTS,
    bgIdx: 0,
    bgColors: BG_COLORS,
    isFavorite: false,
    imgWidth: 0,
    imgHeight: 0,
    canvasW: 295,
    canvasH: 413,
    resultPath: '',
    generating: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('idphoto') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('idphoto');
    this.setData({ isFavorite: fav });
  },

  onChoosePhoto: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var path = res.tempFilePaths[0];
        that.setData({ photoPath: path, resultPath: '' });
        wx.getImageInfo({
          src: path,
          success: function (info) {
            that.setData({ imgWidth: info.width, imgHeight: info.height });
          }
        });
      }
    });
  },

  onSizeChange: function (e) {
    var idx = parseInt(e.detail.value);
    var size = SIZES[idx];
    this.setData({
      sizeIdx: idx,
      canvasW: size.w,
      canvasH: size.h,
      resultPath: ''
    });
  },

  onLayoutChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({
      layoutIdx: idx,
      resultPath: ''
    });
  },

  onBgChange: function (e) {
    var idx = e.currentTarget.dataset.idx !== undefined ? parseInt(e.currentTarget.dataset.idx) : parseInt(e.detail.value);
    this.setData({ bgIdx: idx, resultPath: '' });
  },

  // 检测背景色：取四角像素的平均色
  detectBgColor: function (imgData, w, h) {
    var data = imgData.data;
    var sampleSize = 5;
    var positions = [
      { x: 0, y: 0 },
      { x: w - sampleSize, y: 0 },
      { x: 0, y: h - sampleSize },
      { x: w - sampleSize, y: h - sampleSize }
    ];

    var rAvg = 0, gAvg = 0, bAvg = 0;
    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p];
      var rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (var dy = 0; dy < sampleSize; dy++) {
        for (var dx = 0; dx < sampleSize; dx++) {
          var idx = ((pos.y + dy) * w + (pos.x + dx)) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
      rAvg += rSum / count;
      gAvg += gSum / count;
      bAvg += bSum / count;
    }
    var n = positions.length;
    return { r: Math.round(rAvg / n), g: Math.round(gAvg / n), b: Math.round(bAvg / n) };
  },

  // 核心：生成证件照
  generatePhoto: function () {
    var self = this;
    if (!this.data.photoPath) {
      wx.showToast({ title: '请先选择照片', icon: 'none' });
      return;
    }

    this.setData({ generating: true });
    wx.showLoading({ title: '处理中...' });

    var size = SIZES[this.data.sizeIdx];
    var layout = LAYOUTS[this.data.layoutIdx];
    var targetBg = BG_COLORS[this.data.bgIdx];
    var cw = size.w;
    var ch = size.h;
    var imgW = this.data.imgWidth;
    var imgH = this.data.imgHeight;
    var outputCols = layout.cols;
    var outputRows = layout.rows;
    var outputW = cw * outputCols;
    var outputH = ch * outputRows;

    if (!imgW || !imgH) {
      wx.getImageInfo({
        src: this.data.photoPath,
        success: function (info) {
          self.setData({ imgWidth: info.width, imgHeight: info.height }, function () {
            self.generatePhoto();
          });
        },
        fail: function () {
          wx.hideLoading();
          self.setData({ generating: false });
          wx.showToast({ title: '无法读取图片', icon: 'none' });
        }
      });
      return;
    }

    // 计算处理尺寸：限制最大边不超过 MAX_PROCESS_SIZE
    var scale = 1;
    if (imgW > MAX_PROCESS_SIZE || imgH > MAX_PROCESS_SIZE) {
      scale = Math.min(MAX_PROCESS_SIZE / imgW, MAX_PROCESS_SIZE / imgH);
    }
    var procW = Math.round(imgW * scale);
    var procH = Math.round(imgH * scale);

    // Step 1: 把原图缩放画到处理canvas
    var srcCtx = wx.createCanvasContext('idphoto-src', this);
    srcCtx.drawImage(self.data.photoPath, 0, 0, procW, procH);
    srcCtx.draw(false, function () {
      setTimeout(function () {
        // Step 2: 获取像素数据
        wx.canvasGetImageData({
          canvasId: 'idphoto-src',
          x: 0,
          y: 0,
          width: procW,
          height: procH,
          success: function (res) {
            // Step 3: 检测原背景色
            var detectedBg = self.detectBgColor(res, procW, procH);

            // Step 4: 替换背景色像素
            var targetRgb = targetBg.rgb;
            var data = res.data;
            var threshold = COLOR_THRESHOLD;
            var dR = detectedBg.r;
            var dG = detectedBg.g;
            var dB = detectedBg.b;

            for (var i = 0; i < data.length; i += 4) {
              var r = data[i];
              var g = data[i + 1];
              var b = data[i + 2];

              var dist = colorDist(r, g, b, dR, dG, dB);
              if (dist < threshold) {
                data[i] = targetRgb[0];
                data[i + 1] = targetRgb[1];
                data[i + 2] = targetRgb[2];
              } else if (dist < threshold * 1.8) {
                // 边缘过渡混合
                var blend = (dist - threshold) / (threshold * 0.8);
                blend = Math.min(1, Math.max(0, blend));
                data[i] = Math.round(targetRgb[0] * (1 - blend) + r * blend);
                data[i + 1] = Math.round(targetRgb[1] * (1 - blend) + g * blend);
                data[i + 2] = Math.round(targetRgb[2] * (1 - blend) + b * blend);
              }
            }

            // Step 5: 把处理后的像素放回canvas
            wx.canvasPutImageData({
              canvasId: 'idphoto-src',
              data: data,
              x: 0,
              y: 0,
              width: procW,
              height: procH,
              success: function () {
                // Step 6: 从src canvas导出临时文件
                wx.canvasToTempFilePath({
                  canvasId: 'idphoto-src',
                  quality: 1,
                  success: function (tmpRes) {
                    // Step 7: 把处理后的图画到最终裁剪canvas
                    var outCtx = wx.createCanvasContext('idphoto-canvas', self);

                    // 背景色兜底，填满整张排版图
                    outCtx.setFillStyle(targetBg.color);
                    outCtx.fillRect(0, 0, outputW, outputH);

                    // cover模式裁剪（保留顶部=头部）
                    var srcRatio = procW / procH;
                    var dstRatio = cw / ch;
                    var drawW, drawH, offX, offY;

                    if (srcRatio > dstRatio) {
                      drawH = ch;
                      drawW = procW * (ch / procH);
                      offX = -(drawW - cw) / 2;
                      offY = 0;
                    } else {
                      drawW = cw;
                      drawH = procH * (cw / procW);
                      offX = 0;
                      offY = 0;
                    }

                    for (var row = 0; row < outputRows; row++) {
                      for (var col = 0; col < outputCols; col++) {
                        var cellX = col * cw;
                        var cellY = row * ch;
                        outCtx.drawImage(tmpRes.tempFilePath, offX + cellX, offY + cellY, drawW, drawH);
                      }
                    }
                    outCtx.draw(false, function () {
                      setTimeout(function () {
                        // Step 8: 导出最终图片
                        wx.canvasToTempFilePath({
                          canvasId: 'idphoto-canvas',
                          destWidth: outputW * 2,
                          destHeight: outputH * 2,
                          quality: 1,
                          success: function (finalRes) {
                            wx.hideLoading();
                            self.setData({
                              resultPath: finalRes.tempFilePath,
                              generating: false
                            });
                            wx.saveImageToPhotosAlbum({
                              filePath: finalRes.tempFilePath,
                              success: function () {
                                wx.showToast({ title: '已保存到相册', icon: 'success' });
                              },
                              fail: function () {
                                wx.showToast({ title: '请授权相册访问', icon: 'none' });
                              }
                            });
                          },
                          fail: function (err) {
                            wx.hideLoading();
                            self.setData({ generating: false });
                            console.error('export fail', err);
                            wx.showToast({ title: '导出失败', icon: 'none' });
                          }
                        }, self);
                      }, 500);
                    });
                  },
                  fail: function () {
                    wx.hideLoading();
                    self.setData({ generating: false });
                    wx.showToast({ title: '处理失败', icon: 'none' });
                  }
                }, self);
              },
              fail: function () {
                wx.hideLoading();
                self.setData({ generating: false });
                wx.showToast({ title: '像素处理失败', icon: 'none' });
              }
            }, self);
          },
          fail: function () {
            wx.hideLoading();
            self.setData({ generating: false });
            wx.showToast({ title: '读取像素失败', icon: 'none' });
          }
        }, self);
      }, 500);
    });
  },

  // 保存已有结果
  saveResult: function () {
    if (!this.data.resultPath) {
      this.generatePhoto();
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '请授权相册访问', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '证件照生成器 - 工具箱',
      path: '/pages/tools/idphoto/index'
    };
  }
});