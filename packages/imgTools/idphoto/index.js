var mediaCheck = require('../../../utils/mediaCheck.js');
var storage = require('../../../utils/storage.js');

// ============ 证件照规格 ============
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

// 排版选项（含6寸排版）
var LAYOUTS = [
  { name: '单张', cols: 1, rows: 1 },
  { name: '4 张拼图', cols: 2, rows: 2 },
  { name: '6 张拼图', cols: 2, rows: 3 },
  { name: '6寸排版(一寸12张)', layout6: true, sizeName: '一寸' },
  { name: '6寸排版(二寸6张)', layout6: true, sizeName: '二寸' },
  { name: '6寸排版(小一寸16张)', layout6: true, sizeName: '小一寸' },
  { name: '6寸排版(签证照6张)', layout6: true, sizeName: '签证照' }
];

// 6寸照片纸排版配置
var LAYOUT6_CONFIGS = {
  '一寸': { cols: 3, rows: 4, gap: 4 },
  '二寸': { cols: 2, rows: 3, gap: 4 },
  '小一寸': { cols: 4, rows: 4, gap: 3 },
  '签证照': { cols: 2, rows: 3, gap: 4 }
};
var LAYOUT6_W = 1200;
var LAYOUT6_H = 1800;

// ============ AI 本地模型配置（降级备用） ============
var MODEL_CONFIG = {
  url: 'https://your-cdn.com/modnet.onnx', // TODO: 替换实际CDN地址
  localPath: wx.env.USER_DATA_PATH + '/modnet.onnx'
};
var INFERENCE_SIZE = 512;
var INFERENCE_TIMEOUT = 10000;

// ============ 降级模式常量 ============
var COLOR_THRESHOLD = 80;
var MAX_PROCESS_SIZE = 800;

// ============ 模式优先级 ============
// cloud → localAI → basic
// cloud:  百度智能云人像分割（云函数中转），效果最佳
// localAI: 本地 ONNX 推理（需下载模型），次之
// basic:  颜色替换（纯色背景），兜底

// ============ 工具函数 ============
function colorDist(r1, g1, b1, r2, g2, b2) {
  var dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** 将图片压缩并转 base64，用于云函数上传 */
function imageToBase64(filePath, maxSize, callback) {
  // 先压缩图片到最大边 maxSize
  wx.compressImage({
    src: filePath,
    quality: 85,
    success: function (res) {
      var fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: res.tempFilePath,
        encoding: 'base64',
        success: function (fileRes) {
          callback(null, fileRes.data);
        },
        fail: function (err) {
          callback(err);
        }
      });
    },
    fail: function () {
      // 压缩失败直接读原图
      var fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: function (fileRes) {
          callback(null, fileRes.data);
        },
        fail: function (err) {
          callback(err);
        }
      });
    }
  });
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
    generating: false,

    // ── 云端 AI 模式（百度）──
    cloudMode: true,            // 是否启用云端AI
    cloudQuota: null,           // { remaining, limit, dailyUserRemaining, dailyUserLimit }
    cloudQuotaLoaded: false,

    // ── 本地 AI 模式（ONNX）──
    aiAvailable: false,
    modelStatus: 'unloaded',    // unloaded | downloading | loading | ready | error | unavailable
    modelProgress: 0,
    aiMode: true,
    maskReady: false,

    // 当前显示的模式标签
    // 'cloud' | 'localai' | 'basic'
    activeMode: 'cloud'
  },

  // 本地 AI 推理 session
  _session: null,
  // 缓存的 mask 数据（Float32Array）
  _cachedMask: null,
  _procW: 0,
  _procH: 0,

  onLoad: function () {
    this.checkFavorite();
    this._checkAiCapability();
    this._loadCloudQuota();
  },

  onShow: function () {
    this.checkFavorite();
  },

  onUnload: function () {
    if (this._session) {
      try { this._session.destroy(); } catch (e) { /* ignore */ }
      this._session = null;
    }
  },

  // ============ 收藏/分享 ============
  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('idphoto') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('idphoto');
    this.setData({ isFavorite: fav });
  },

  // ============ 云端额度查询 ============
  _loadCloudQuota: function () {
    var self = this;
    wx.cloud.callFunction({
      name: 'idphoto',
      data: { action: 'quota' },
      success: function (res) {
        var r = res.result || {};
        if (r.success) {
          self.setData({
            cloudQuota: {
              remaining: r.remaining,
              limit: r.limit,
              dailyUserRemaining: r.dailyUserRemaining,
              dailyUserLimit: r.dailyUserLimit
            },
            cloudQuotaLoaded: true,
            // 若额度耗尽自动切换到本地AI
            cloudMode: r.remaining > 0 && r.dailyUserRemaining > 0
          });
          self._updateActiveMode();
        }
      },
      fail: function () {
        // 云函数不可用，降级
        self.setData({ cloudMode: false, cloudQuotaLoaded: true });
        self._updateActiveMode();
      }
    });
  },

  _updateActiveMode: function () {
    var d = this.data;
    var mode = 'basic';
    if (d.cloudMode && d.cloudQuotaLoaded) {
      mode = 'cloud';
    } else if (d.aiAvailable && d.aiMode) {
      mode = 'localai';
    }
    this.setData({ activeMode: mode });
  },

  // ============ 本地 AI 初始化 ============
  _checkAiCapability: function () {
    if (typeof wx.createInferenceSession !== 'function') {
      this.setData({ aiAvailable: false, modelStatus: 'unavailable', aiMode: false });
      this._updateActiveMode();
      return;
    }
    this.setData({ aiAvailable: true });
    var self = this;
    wx.getFileInfo({
      filePath: MODEL_CONFIG.localPath,
      success: function () { self._loadModel(); },
      fail: function () { self.setData({ modelStatus: 'unloaded' }); }
    });
  },

  _downloadModel: function (callback) {
    var self = this;
    if (self.data.modelStatus === 'downloading') return;
    self.setData({ modelStatus: 'downloading', modelProgress: 0 });

    var task = wx.downloadFile({
      url: MODEL_CONFIG.url,
      filePath: MODEL_CONFIG.localPath,
      success: function (res) {
        if (res.statusCode === 200) {
          self.setData({ modelProgress: 100 });
          if (callback) callback(true);
        } else {
          self._onModelFail('模型下载失败(' + res.statusCode + ')');
          if (callback) callback(false);
        }
      },
      fail: function () {
        self._onModelFail('模型下载失败，请检查网络');
        if (callback) callback(false);
      }
    });
    task.onProgressUpdate(function (res) {
      self.setData({ modelProgress: res.progress });
    });
  },

  _loadModel: function (callback) {
    var self = this;
    if (self._session) {
      self.setData({ modelStatus: 'ready' });
      if (callback) callback(true);
      return;
    }
    self.setData({ modelStatus: 'loading' });
    try {
      var session = wx.createInferenceSession({
        model: MODEL_CONFIG.localPath,
        precisionLevel: 4
      });
      session.onLoad(function () {
        self._session = session;
        self.setData({ modelStatus: 'ready' });
        if (callback) callback(true);
      });
      session.onError(function (err) {
        console.error('模型加载失败', err);
        self._session = null;
        self.setData({ modelStatus: 'error', aiMode: false });
        self._updateActiveMode();
        if (callback) callback(false);
      });
    } catch (e) {
      console.error('创建InferenceSession失败', e);
      self.setData({ modelStatus: 'error', aiMode: false });
      self._updateActiveMode();
      if (callback) callback(false);
    }
  },

  _ensureModel: function (callback) {
    var self = this;
    if (self.data.modelStatus === 'ready' && self._session) { callback(true); return; }
    if (self.data.modelStatus === 'unavailable' || self.data.modelStatus === 'error') { callback(false); return; }
    wx.getFileInfo({
      filePath: MODEL_CONFIG.localPath,
      success: function () { self._loadModel(callback); },
      fail: function () {
        self._downloadModel(function (ok) {
          if (ok) { self._loadModel(callback); } else { callback(false); }
        });
      }
    });
  },

  _onModelFail: function (msg) {
    this.setData({ modelStatus: 'error', aiMode: false });
    this._updateActiveMode();
    wx.showToast({ title: msg || '本地AI不可用，切换模式', icon: 'none', duration: 2000 });
  },

  // ============ 照片选择 ============
  onChoosePhoto: function () {
    var that = this;
    mediaCheck.chooseImageWithCheck({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var path = res.tempFilePaths[0];
        that.setData({ photoPath: path, resultPath: '', maskReady: false });
        that._cachedMask = null;
        wx.getImageInfo({
          src: path,
          success: function (info) {
            that.setData({ imgWidth: info.width, imgHeight: info.height });
          }
        });
      }
    });
  },

  // ============ 参数选择 ============
  onSizeChange: function (e) {
    var idx = parseInt(e.detail.value);
    var size = SIZES[idx];
    this.setData({ sizeIdx: idx, canvasW: size.w, canvasH: size.h, resultPath: '', maskReady: false });
    this._cachedMask = null;
  },

  onLayoutChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({ layoutIdx: idx, resultPath: '' });
  },

  onBgChange: function (e) {
    var idx = e.currentTarget.dataset.idx !== undefined
      ? parseInt(e.currentTarget.dataset.idx)
      : parseInt(e.detail.value);
    this.setData({ bgIdx: idx, resultPath: '' });
  },

  // ============ 核心：生成证件照 ============
  generatePhoto: function () {
    var self = this;
    if (!this.data.photoPath) {
      wx.showToast({ title: '请先选择照片', icon: 'none' });
      return;
    }
    this.setData({ generating: true });
    wx.showLoading({ title: '处理中...' });

    var imgW = this.data.imgWidth;
    var imgH = this.data.imgHeight;
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

    // 路由：云端AI → 本地AI → 基础模式
    var d = this.data;
    if (d.cloudMode && d.cloudQuotaLoaded) {
      this._generateCloud();
    } else if (d.aiMode && d.aiAvailable) {
      this._generateAI();
    } else {
      this._generateBasic();
    }
  },

  // ============ 云端 AI 模式（百度人像分割） ============
  _generateCloud: function () {
    var self = this;
    wx.showLoading({ title: '☁️ 云端AI处理中...' });

    imageToBase64(self.data.photoPath, 1200, function (err, base64) {
      if (err) {
        wx.hideLoading();
        self.setData({ generating: false });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
        return;
      }

      wx.cloud.callFunction({
        name: 'idphoto',
        data: { action: 'segment', imageBase64: base64 },
        success: function (res) {
          var r = res.result || {};
          if (!r.success) {
            // 额度超限 → 降级
            if (r.errorCode === 'QUOTA_EXCEEDED' || r.errorCode === 'USER_DAILY_QUOTA_EXCEEDED') {
              wx.showToast({ title: r.errorMsg, icon: 'none', duration: 3000 });
              self.setData({ cloudMode: false });
              self._updateActiveMode();
              // 降级到本地AI或基础模式
              if (self.data.aiAvailable && self.data.aiMode) {
                self._generateAI();
              } else {
                self._generateBasic();
              }
            } else {
              wx.hideLoading();
              self.setData({ generating: false });
              wx.showToast({ title: r.errorMsg || '云端处理失败', icon: 'none' });
            }
            return;
          }

          // 更新额度显示
          self.setData({
            cloudQuota: {
              remaining: r.remaining,
              limit: self.data.cloudQuota ? self.data.cloudQuota.limit : 500,
              dailyUserRemaining: r.dailyUserRemaining,
              dailyUserLimit: self.data.cloudQuota ? self.data.cloudQuota.dailyUserLimit : 10
            }
          });

          // r.foreground: 背景透明的 PNG base64（RGBA）
          // 将 base64 写入临时文件，然后用 canvas 合成背景色
          var fs = wx.getFileSystemManager();
          var tmpPath = wx.env.USER_DATA_PATH + '/idphoto_fg_' + Date.now() + '.png';
          fs.writeFile({
            filePath: tmpPath,
            data: r.foreground,
            encoding: 'base64',
            success: function () {
              // 用原图尺寸比例合成
              var imgW = self.data.imgWidth;
              var imgH = self.data.imgHeight;
              var scale = 1;
              if (imgW > MAX_PROCESS_SIZE || imgH > MAX_PROCESS_SIZE) {
                scale = Math.min(MAX_PROCESS_SIZE / imgW, MAX_PROCESS_SIZE / imgH);
              }
              var procW = Math.round(imgW * scale);
              var procH = Math.round(imgH * scale);
              self._procW = procW;
              self._procH = procH;
              // 合成背景色并排版
              self._composeForeground(tmpPath, procW, procH);
            },
            fail: function () {
              wx.hideLoading();
              self.setData({ generating: false });
              wx.showToast({ title: '写入临时文件失败', icon: 'none' });
            }
          });
        },
        fail: function (err) {
          wx.hideLoading();
          self.setData({ generating: false, cloudMode: false });
          self._updateActiveMode();
          wx.showToast({ title: '云函数调用失败', icon: 'none' });
        }
      });
    });
  },

  /**
   * 将前景图（透明 PNG）叠加目标背景色后合成
   * 利用 idphoto-src canvas 完成
   */
  _composeForeground: function (fgPath, procW, procH) {
    var self = this;
    var targetBg = BG_COLORS[this.data.bgIdx];
    var srcCtx = wx.createCanvasContext('idphoto-src', self);

    // 先填充背景色
    srcCtx.setFillStyle(targetBg.color);
    srcCtx.fillRect(0, 0, procW, procH);
    // 再叠加前景（透明 PNG，alpha 自动混合）
    srcCtx.drawImage(fgPath, 0, 0, procW, procH);
    srcCtx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-src',
          quality: 1,
          success: function (tmpRes) {
            self._composeResult(tmpRes.tempFilePath, procW, procH);
          },
          fail: function () {
            wx.hideLoading();
            self.setData({ generating: false });
            wx.showToast({ title: '合成失败', icon: 'none' });
          }
        }, self);
      }, 300);
    });
  },

  // ============ 本地 AI 模式（ONNX MODNet） ============
  _generateAI: function () {
    var self = this;
    wx.showLoading({ title: '🤖 本地AI处理中...' });

    this._ensureModel(function (modelOk) {
      if (!modelOk || !self._session) {
        self.setData({ aiMode: false });
        self._updateActiveMode();
        self._generateBasic();
        return;
      }

      var imgW = self.data.imgWidth;
      var imgH = self.data.imgHeight;
      var scale = 1;
      if (imgW > MAX_PROCESS_SIZE || imgH > MAX_PROCESS_SIZE) {
        scale = Math.min(MAX_PROCESS_SIZE / imgW, MAX_PROCESS_SIZE / imgH);
      }
      var procW = Math.round(imgW * scale);
      var procH = Math.round(imgH * scale);
      self._procW = procW;
      self._procH = procH;

      var srcCtx = wx.createCanvasContext('idphoto-src', self);
      srcCtx.drawImage(self.data.photoPath, 0, 0, procW, procH);
      srcCtx.draw(false, function () {
        setTimeout(function () {
          wx.canvasGetImageData({
            canvasId: 'idphoto-src',
            x: 0, y: 0, width: procW, height: procH,
            success: function (origRes) {
              var maskCtx = wx.createCanvasContext('idphoto-mask', self);
              maskCtx.drawImage(self.data.photoPath, 0, 0, INFERENCE_SIZE, INFERENCE_SIZE);
              maskCtx.draw(false, function () {
                setTimeout(function () {
                  wx.canvasGetImageData({
                    canvasId: 'idphoto-mask',
                    x: 0, y: 0, width: INFERENCE_SIZE, height: INFERENCE_SIZE,
                    success: function (res512) {
                      var pixelCount = INFERENCE_SIZE * INFERENCE_SIZE;
                      var float32Data = new Float32Array(3 * pixelCount);
                      var srcData = res512.data;
                      for (var i = 0; i < pixelCount; i++) {
                        var srcIdx = i * 4;
                        float32Data[i] = srcData[srcIdx] / 255.0;
                        float32Data[pixelCount + i] = srcData[srcIdx + 1] / 255.0;
                        float32Data[2 * pixelCount + i] = srcData[srcIdx + 2] / 255.0;
                      }
                      self._runInference(float32Data, function (mask512) {
                        if (!mask512) {
                          self.setData({ aiMode: false });
                          self._updateActiveMode();
                          self._generateBasic();
                          return;
                        }
                        self._scaleMask(mask512, procW, procH, function (scaledMask) {
                          if (!scaledMask) {
                            self.setData({ aiMode: false });
                            self._updateActiveMode();
                            self._generateBasic();
                            return;
                          }
                          self._cachedMask = scaledMask;
                          self.setData({ maskReady: true });
                          var targetBg = BG_COLORS[self.data.bgIdx];
                          var bgR = targetBg.rgb[0], bgG = targetBg.rgb[1], bgB = targetBg.rgb[2];
                          var data = origRes.data;
                          var cnt = procW * procH;
                          for (var i = 0; i < cnt; i++) {
                            var alpha = scaledMask[i];
                            var idx = i * 4;
                            data[idx]     = Math.round(data[idx] * alpha + bgR * (1 - alpha));
                            data[idx + 1] = Math.round(data[idx + 1] * alpha + bgG * (1 - alpha));
                            data[idx + 2] = Math.round(data[idx + 2] * alpha + bgB * (1 - alpha));
                            data[idx + 3] = 255;
                          }
                          wx.canvasPutImageData({
                            canvasId: 'idphoto-src',
                            data: data, x: 0, y: 0, width: procW, height: procH,
                            success: function () {
                              wx.canvasToTempFilePath({
                                canvasId: 'idphoto-src', quality: 1,
                                success: function (tmpRes) {
                                  self._composeResult(tmpRes.tempFilePath, procW, procH);
                                },
                                fail: function () {
                                  wx.hideLoading(); self.setData({ generating: false });
                                  wx.showToast({ title: '处理失败', icon: 'none' });
                                }
                              }, self);
                            },
                            fail: function () {
                              wx.hideLoading(); self.setData({ generating: false });
                              wx.showToast({ title: '像素写入失败', icon: 'none' });
                            }
                          }, self);
                        });
                      });
                    },
                    fail: function () {
                      wx.hideLoading(); self.setData({ generating: false });
                      wx.showToast({ title: '预处理失败', icon: 'none' });
                    }
                  }, self);
                }, 300);
              });
            },
            fail: function () {
              wx.hideLoading(); self.setData({ generating: false });
              wx.showToast({ title: '读取像素失败', icon: 'none' });
            }
          }, self);
        }, 500);
      });
    });
  },

  _runInference: function (inputBuffer, callback) {
    var self = this;
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      wx.hideLoading(); self.setData({ generating: false });
      wx.showToast({ title: 'AI推理超时', icon: 'none' });
      callback(null);
    }, INFERENCE_TIMEOUT);
    try {
      self._session.run({
        'input': { shape: [1, 3, INFERENCE_SIZE, INFERENCE_SIZE], data: inputBuffer.buffer, type: 'float32' }
      }).then(function (res) {
        if (timedOut) return;
        clearTimeout(timer);
        var keys = Object.keys(res);
        if (!keys.length) { callback(null); return; }
        var outputData = res[keys[0]];
        if (!outputData || !outputData.data) { callback(null); return; }
        var maskData = new Float32Array(outputData.data);
        var minVal = 1, maxVal = 0;
        for (var i = 0; i < maskData.length; i++) {
          if (maskData[i] < minVal) minVal = maskData[i];
          if (maskData[i] > maxVal) maxVal = maskData[i];
        }
        var range = maxVal - minVal;
        if (range < 0.001) range = 1;
        for (var j = 0; j < maskData.length; j++) {
          maskData[j] = (maskData[j] - minVal) / range;
        }
        callback(maskData);
      }).catch(function (err) {
        if (timedOut) return;
        clearTimeout(timer);
        console.error('推理失败', err);
        callback(null);
      });
    } catch (e) {
      clearTimeout(timer);
      console.error('推理异常', e);
      callback(null);
    }
  },

  _scaleMask: function (mask512, procW, procH, callback) {
    var self = this;
    var pixelCount = INFERENCE_SIZE * INFERENCE_SIZE;
    var maskPixels = new Uint8ClampedArray(pixelCount * 4);
    for (var i = 0; i < pixelCount; i++) {
      var val = Math.round(Math.min(1, Math.max(0, mask512[i])) * 255);
      maskPixels[i * 4] = val; maskPixels[i * 4 + 1] = val;
      maskPixels[i * 4 + 2] = val; maskPixels[i * 4 + 3] = 255;
    }
    wx.canvasPutImageData({
      canvasId: 'idphoto-mask', data: maskPixels,
      x: 0, y: 0, width: INFERENCE_SIZE, height: INFERENCE_SIZE,
      success: function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-mask', quality: 1,
          success: function (tmpRes) {
            var srcCtx = wx.createCanvasContext('idphoto-src', self);
            srcCtx.drawImage(tmpRes.tempFilePath, 0, 0, procW, procH);
            srcCtx.draw(false, function () {
              setTimeout(function () {
                wx.canvasGetImageData({
                  canvasId: 'idphoto-src',
                  x: 0, y: 0, width: procW, height: procH,
                  success: function (scaledRes) {
                    var scaledMask = new Float32Array(procW * procH);
                    for (var k = 0; k < procW * procH; k++) {
                      scaledMask[k] = scaledRes.data[k * 4] / 255.0;
                    }
                    callback(scaledMask);
                  },
                  fail: function () { callback(null); }
                }, self);
              }, 300);
            });
          },
          fail: function () { callback(null); }
        }, self);
      },
      fail: function () { callback(null); }
    }, self);
  },

  // ============ 基础模式（颜色替换，兜底） ============
  _generateBasic: function () {
    var self = this;
    var layout = LAYOUTS[this.data.layoutIdx];
    if (layout.layout6) { this._generateBasicThen6Inch(layout); return; }

    var imgW = this.data.imgWidth, imgH = this.data.imgHeight;
    var scale = 1;
    if (imgW > MAX_PROCESS_SIZE || imgH > MAX_PROCESS_SIZE) {
      scale = Math.min(MAX_PROCESS_SIZE / imgW, MAX_PROCESS_SIZE / imgH);
    }
    var procW = Math.round(imgW * scale);
    var procH = Math.round(imgH * scale);
    var targetBg = BG_COLORS[this.data.bgIdx];

    wx.showLoading({ title: '📝 基础处理中...' });

    var srcCtx = wx.createCanvasContext('idphoto-src', this);
    srcCtx.drawImage(self.data.photoPath, 0, 0, procW, procH);
    srcCtx.draw(false, function () {
      setTimeout(function () {
        wx.canvasGetImageData({
          canvasId: 'idphoto-src', x: 0, y: 0, width: procW, height: procH,
          success: function (res) {
            var detectedBg = self._detectBgColor(res, procW, procH);
            var targetRgb = targetBg.rgb;
            var data = res.data;
            var threshold = COLOR_THRESHOLD;
            for (var i = 0; i < data.length; i += 4) {
              var dist = colorDist(data[i], data[i + 1], data[i + 2], detectedBg.r, detectedBg.g, detectedBg.b);
              if (dist < threshold) {
                data[i] = targetRgb[0]; data[i + 1] = targetRgb[1]; data[i + 2] = targetRgb[2];
              } else if (dist < threshold * 1.8) {
                var blend = Math.min(1, Math.max(0, (dist - threshold) / (threshold * 0.8)));
                data[i]     = Math.round(targetRgb[0] * (1 - blend) + data[i] * blend);
                data[i + 1] = Math.round(targetRgb[1] * (1 - blend) + data[i + 1] * blend);
                data[i + 2] = Math.round(targetRgb[2] * (1 - blend) + data[i + 2] * blend);
              }
            }
            wx.canvasPutImageData({
              canvasId: 'idphoto-src', data: data, x: 0, y: 0, width: procW, height: procH,
              success: function () {
                wx.canvasToTempFilePath({
                  canvasId: 'idphoto-src', quality: 1,
                  success: function (tmpRes) { self._composeResult(tmpRes.tempFilePath, procW, procH); },
                  fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '导出失败', icon: 'none' }); }
                }, self);
              },
              fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '像素处理失败', icon: 'none' }); }
            }, self);
          },
          fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '读取像素失败', icon: 'none' }); }
        }, self);
      }, 500);
    });
  },

  _generateBasicThen6Inch: function (layout) {
    var self = this;
    var targetBg = BG_COLORS[this.data.bgIdx];
    var imgW = this.data.imgWidth, imgH = this.data.imgHeight;
    var scale = 1;
    if (imgW > MAX_PROCESS_SIZE || imgH > MAX_PROCESS_SIZE) {
      scale = Math.min(MAX_PROCESS_SIZE / imgW, MAX_PROCESS_SIZE / imgH);
    }
    var procW = Math.round(imgW * scale);
    var procH = Math.round(imgH * scale);
    var srcCtx = wx.createCanvasContext('idphoto-src', this);
    srcCtx.drawImage(self.data.photoPath, 0, 0, procW, procH);
    srcCtx.draw(false, function () {
      setTimeout(function () {
        wx.canvasGetImageData({
          canvasId: 'idphoto-src', x: 0, y: 0, width: procW, height: procH,
          success: function (res) {
            var detectedBg = self._detectBgColor(res, procW, procH);
            var targetRgb = targetBg.rgb;
            var data = res.data;
            var threshold = COLOR_THRESHOLD;
            for (var i = 0; i < data.length; i += 4) {
              var dist = colorDist(data[i], data[i + 1], data[i + 2], detectedBg.r, detectedBg.g, detectedBg.b);
              if (dist < threshold) {
                data[i] = targetRgb[0]; data[i + 1] = targetRgb[1]; data[i + 2] = targetRgb[2];
              } else if (dist < threshold * 1.8) {
                var blend = Math.min(1, Math.max(0, (dist - threshold) / (threshold * 0.8)));
                data[i]     = Math.round(targetRgb[0] * (1 - blend) + data[i] * blend);
                data[i + 1] = Math.round(targetRgb[1] * (1 - blend) + data[i + 1] * blend);
                data[i + 2] = Math.round(targetRgb[2] * (1 - blend) + data[i + 2] * blend);
              }
            }
            wx.canvasPutImageData({
              canvasId: 'idphoto-src', data: data, x: 0, y: 0, width: procW, height: procH,
              success: function () {
                wx.canvasToTempFilePath({
                  canvasId: 'idphoto-src', quality: 1,
                  success: function (tmpRes) { self._compose6Inch(tmpRes.tempFilePath, procW, procH, layout); },
                  fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '导出失败', icon: 'none' }); }
                }, self);
              },
              fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '像素处理失败', icon: 'none' }); }
            }, self);
          },
          fail: function () { wx.hideLoading(); self.setData({ generating: false }); wx.showToast({ title: '读取像素失败', icon: 'none' }); }
        }, self);
      }, 500);
    });
  },

  _detectBgColor: function (imgData, w, h) {
    var data = imgData.data;
    var sampleSize = 5;
    var positions = [
      { x: 0, y: 0 }, { x: w - sampleSize, y: 0 },
      { x: 0, y: h - sampleSize }, { x: w - sampleSize, y: h - sampleSize }
    ];
    var rAvg = 0, gAvg = 0, bAvg = 0;
    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p];
      var rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (var dy = 0; dy < sampleSize; dy++) {
        for (var dx = 0; dx < sampleSize; dx++) {
          var idx = ((pos.y + dy) * w + (pos.x + dx)) * 4;
          rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2]; count++;
        }
      }
      rAvg += rSum / count; gAvg += gSum / count; bAvg += bSum / count;
    }
    var n = positions.length;
    return { r: Math.round(rAvg / n), g: Math.round(gAvg / n), b: Math.round(bAvg / n) };
  },

  // ============ 裁剪 + 排版 ============
  _composeResult: function (imgPath, procW, procH) {
    var self = this;
    var layout = LAYOUTS[this.data.layoutIdx];
    if (layout.layout6) { this._compose6Inch(imgPath, procW, procH, layout); return; }

    var size = SIZES[this.data.sizeIdx];
    var targetBg = BG_COLORS[this.data.bgIdx];
    var cw = size.w, ch = size.h;
    var outputCols = layout.cols, outputRows = layout.rows;
    var outputW = cw * outputCols, outputH = ch * outputRows;

    var outCtx = wx.createCanvasContext('idphoto-canvas', self);
    outCtx.setFillStyle(targetBg.color);
    outCtx.fillRect(0, 0, outputW, outputH);
    var srcRatio = procW / procH, dstRatio = cw / ch;
    var drawW, drawH, offX, offY;
    if (srcRatio > dstRatio) {
      drawH = ch; drawW = procW * (ch / procH); offX = -(drawW - cw) / 2; offY = 0;
    } else {
      drawW = cw; drawH = procH * (cw / procW); offX = 0; offY = 0;
    }
    for (var row = 0; row < outputRows; row++) {
      for (var col = 0; col < outputCols; col++) {
        outCtx.drawImage(imgPath, offX + col * cw, offY + row * ch, drawW, drawH);
      }
    }
    outCtx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-canvas',
          destWidth: outputW * 2, destHeight: outputH * 2, quality: 1,
          success: function (finalRes) {
            wx.hideLoading();
            self.setData({ resultPath: finalRes.tempFilePath, generating: false });
            wx.saveImageToPhotosAlbum({
              filePath: finalRes.tempFilePath,
              success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
              fail: function () { wx.showToast({ title: '请授权相册访问', icon: 'none' }); }
            });
          },
          fail: function () {
            wx.hideLoading(); self.setData({ generating: false });
            wx.showToast({ title: '导出失败', icon: 'none' });
          }
        }, self);
      }, 500);
    });
  },

  _compose6Inch: function (imgPath, procW, procH, layout) {
    var self = this;
    var sizeName = layout.sizeName;
    var size = null;
    for (var s = 0; s < SIZES.length; s++) {
      if (SIZES[s].name === sizeName) { size = SIZES[s]; break; }
    }
    if (!size) size = SIZES[0];
    var cw = size.w, ch = size.h;
    var config = LAYOUT6_CONFIGS[sizeName] || { cols: 3, rows: 4, gap: 4 };
    var cols = config.cols, rows = config.rows, gap = config.gap;

    var outCtx = wx.createCanvasContext('idphoto-layout', self);
    outCtx.setFillStyle('#FFFFFF');
    outCtx.fillRect(0, 0, LAYOUT6_W, LAYOUT6_H);
    var srcRatio = procW / procH, dstRatio = cw / ch;
    var drawW, drawH, cropOffX, cropOffY;
    if (srcRatio > dstRatio) {
      drawH = ch; drawW = procW * (ch / procH); cropOffX = -(drawW - cw) / 2; cropOffY = 0;
    } else {
      drawW = cw; drawH = procH * (cw / procW); cropOffX = 0; cropOffY = 0;
    }
    var totalW = cols * cw + (cols - 1) * gap;
    var totalH = rows * ch + (rows - 1) * gap;
    var startX = Math.round((LAYOUT6_W - totalW) / 2);
    var startY = Math.round((LAYOUT6_H - totalH) / 2);

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var cellX = startX + col * (cw + gap);
        var cellY = startY + row * (ch + gap);
        outCtx.save();
        outCtx.beginPath();
        outCtx.rect(cellX, cellY, cw, ch);
        outCtx.clip();
        outCtx.drawImage(imgPath, cellX + cropOffX, cellY + cropOffY, drawW, drawH);
        outCtx.restore();
      }
    }
    outCtx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'idphoto-layout',
          destWidth: LAYOUT6_W * 2, destHeight: LAYOUT6_H * 2, quality: 1,
          success: function (finalRes) {
            wx.hideLoading();
            self.setData({ resultPath: finalRes.tempFilePath, generating: false });
            wx.saveImageToPhotosAlbum({
              filePath: finalRes.tempFilePath,
              success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
              fail: function () { wx.showToast({ title: '请授权相册访问', icon: 'none' }); }
            });
          },
          fail: function () {
            wx.hideLoading(); self.setData({ generating: false });
            wx.showToast({ title: '排版导出失败', icon: 'none' });
          }
        }, self);
      }, 500);
    });
  },

  // ============ 保存 ============
  saveResult: function () {
    if (!this.data.resultPath) { this.generatePhoto(); return; }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: function () { wx.showToast({ title: '请授权相册访问', icon: 'none' }); }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '证件照生成器 - 云端AI精准抠图',
      path: '/packages/imgTools/idphoto/index'
    };
  }
});
