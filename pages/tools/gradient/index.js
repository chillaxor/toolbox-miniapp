var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    // 当前选中的三个颜色
    color1: '#FF6B6B',
    color2: '#4ECDC4',
    color3: '#556270',
    // 当前正在编辑的颜色槽位 1/2/3
    activeSlot: 1,
    // 调色板颜色列表
    palette: [
      '#FF6B6B', '#FF8E53', '#FFC857', '#F9ED69', '#F38181',
      '#E84393', '#A29BFE', '#6C5CE7', '#74B9FF', '#0984E3',
      '#00CEC9', '#4ECDC4', '#00B894', '#55EFC4', '#FFEAA7',
      '#FDCB6E', '#E17055', '#D63031', '#636E72', '#2D3436',
      '#FD79A8', '#B2BEC3', '#DFE6E9', '#556270', '#C44569'
    ],
    // 渐变方向: top-bottom, left-right, diagonal, radial
    direction: 'diagonal',
    directions: [
      { key: 'top-bottom', label: '↓' },
      { key: 'left-right', label: '→' },
      { key: 'diagonal', label: '↘' },
      { key: 'radial', label: '◎' }
    ],
    // 预设渐变组合
    presets: [
      { name: '日落', colors: ['#FF6B6B', '#FFC857', '#FF8E53'] },
      { name: '海洋', colors: ['#0984E3', '#00CEC9', '#74B9FF'] },
      { name: '薰衣草', colors: ['#A29BFE', '#E84393', '#FD79A8'] },
      { name: '森林', colors: ['#00B894', '#55EFC4', '#00CEC9'] },
      { name: '极光', colors: ['#6C5CE7', '#0984E3', '#00CEC9'] },
      { name: '蜜桃', colors: ['#FDCB6E', '#E17055', '#D63031'] },
      { name: '星空', colors: ['#2D3436', '#636E72', '#A29BFE'] },
      { name: '樱花', colors: ['#FD79A8', '#FFEAA7', '#F9ED69'] }
    ],
    // 用于预览的 CSS 渐变字符串
    previewGradient: '',
    // 是否正在生成
    generating: false,
    // 是否显示调色板
    showPalette: true
  },

  onLoad: function () {
    this.checkFavorite();
    this.updatePreview();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('gradient') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('gradient');
    this.setData({ isFavorite: fav });
  },

  // 切换正在编辑的颜色槽位
  selectSlot: function (e) {
    var slot = e.currentTarget.dataset.slot;
    this.setData({ activeSlot: slot, showPalette: true });
  },

  // 从调色板选择颜色
  pickColor: function (e) {
    var color = e.currentTarget.dataset.color;
    var slot = this.data.activeSlot;
    var key = 'color' + slot;
    var update = {};
    update[key] = color;
    update['palette_' + slot] = color;
    this.setData(update);
    this.updatePreview();
  },

  // 切换渐变方向
  selectDirection: function (e) {
    var dir = e.currentTarget.dataset.dir;
    this.setData({ direction: dir });
    this.updatePreview();
  },

  // 应用预设渐变
  applyPreset: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var preset = this.data.presets[idx];
    this.setData({
      color1: preset.colors[0],
      color2: preset.colors[1],
      color3: preset.colors[2]
    });
    this.updatePreview();
  },

  // 更新预览渐变 CSS
  updatePreview: function () {
    var c1 = this.data.color1;
    var c2 = this.data.color2;
    var c3 = this.data.color3;
    var dir = this.data.direction;
    var gradient = '';

    if (dir === 'top-bottom') {
      gradient = 'linear-gradient(to bottom, ' + c1 + ', ' + c2 + ', ' + c3 + ')';
    } else if (dir === 'left-right') {
      gradient = 'linear-gradient(to right, ' + c1 + ', ' + c2 + ', ' + c3 + ')';
    } else if (dir === 'diagonal') {
      gradient = 'linear-gradient(to bottom right, ' + c1 + ', ' + c2 + ', ' + c3 + ')';
    } else if (dir === 'radial') {
      gradient = 'radial-gradient(circle, ' + c1 + ', ' + c2 + ', ' + c3 + ')';
    }

    this.setData({ previewGradient: gradient });
  },

  // 解析十六进制颜色为 RGB
  hexToRgb: function (hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r: r, g: g, b: b };
  },

  // 在两个颜色之间线性插值
  lerpColor: function (c1, c2, t) {
    var rgb1 = this.hexToRgb(c1);
    var rgb2 = this.hexToRgb(c2);
    var r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    var g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    var b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  },

  // 生成壁纸
  generateWallpaper: function () {
    if (this.data.generating) return;
    var that = this;
    this.setData({ generating: true });

    wx.showLoading({ title: '生成中...', mask: true });

    var query = wx.createSelectorQuery().in(this);
    query.select('#gradientCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          // 回退到旧版 Canvas API
          that.generateWithOldCanvas();
          return;
        }

        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');

        // 设置高分辨率
        var dpr = wx.getSystemInfoSync().pixelRatio || 2;
        canvas.width = 750;
        canvas.height = 1334;

        var width = 750;
        var height = 1334;
        var c1 = that.data.color1;
        var c2 = that.data.color2;
        var c3 = that.data.color3;
        var dir = that.data.direction;
        var gradient;

        if (dir === 'top-bottom') {
          gradient = ctx.createLinearGradient(0, 0, 0, height);
        } else if (dir === 'left-right') {
          gradient = ctx.createLinearGradient(0, 0, width, 0);
        } else if (dir === 'diagonal') {
          gradient = ctx.createLinearGradient(0, 0, width, height);
        } else {
          // radial
          var cx = width / 2;
          var cy = height / 2;
          var radius = Math.sqrt(cx * cx + cy * cy);
          gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        }

        gradient.addColorStop(0, c1);
        gradient.addColorStop(0.5, c2);
        gradient.addColorStop(1, c3);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        setTimeout(function () {
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: width,
            height: height,
            destWidth: width,
            destHeight: height,
            fileType: 'png',
            success: function (tmpRes) {
              that.saveToAlbum(tmpRes.tempFilePath);
            },
            fail: function (err) {
              console.error('canvasToTempFilePath fail:', err);
              wx.hideLoading();
              that.setData({ generating: false });
              wx.showToast({ title: '生成失败', icon: 'none' });
            }
          }, that);
        }, 100);
      });
  },

  // 旧版 Canvas API 回退
  generateWithOldCanvas: function () {
    var that = this;
    var ctx = wx.createCanvasContext('gradientCanvas', this);
    var width = 750;
    var height = 1334;
    var c1 = that.data.color1;
    var c2 = that.data.color2;
    var c3 = that.data.color3;
    var dir = that.data.direction;

    // 旧版 API 用手动像素绘制渐变
    // 逐行/逐列绘制插值色
    var steps = height;
    var i, t, color;

    if (dir === 'radial') {
      // 径向渐变：从中心向外逐环绘制
      var cx = width / 2;
      var cy = height / 2;
      var maxRadius = Math.sqrt(cx * cx + cy * cy);
      var ringStep = 2;
      for (i = 0; i < maxRadius; i += ringStep) {
        t = i / maxRadius;
        if (t <= 0.5) {
          color = this.lerpColor(c1, c2, t * 2);
        } else {
          color = this.lerpColor(c2, c3, (t - 0.5) * 2);
        }
        ctx.setFillStyle(color);
        ctx.beginPath();
        ctx.arc(cx, cy, i, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      // 线性渐变：逐行/逐列绘制
      for (i = 0; i < steps; i++) {
        t = i / steps;
        if (t <= 0.5) {
          color = this.lerpColor(c1, c2, t * 2);
        } else {
          color = this.lerpColor(c2, c3, (t - 0.5) * 2);
        }
        ctx.setFillStyle(color);
        if (dir === 'top-bottom') {
          ctx.fillRect(0, i, width, 1);
        } else if (dir === 'left-right') {
          ctx.fillRect(i * (width / steps), 0, Math.ceil(width / steps), height);
        } else {
          // diagonal - 旋转45度的渐变用斜线填充
          ctx.fillRect(0, i, width, 1);
        }
      }

      // 对角线需要额外处理 - 重新用对角线方式绘制
      if (dir === 'diagonal') {
        var diagSteps = width + height;
        for (i = 0; i < diagSteps; i++) {
          t = i / diagSteps;
          if (t <= 0.5) {
            color = this.lerpColor(c1, c2, t * 2);
          } else {
            color = this.lerpColor(c2, c3, (t - 0.5) * 2);
          }
          ctx.setStrokeStyle(color);
          ctx.setLineWidth(2);
          ctx.beginPath();
          if (i <= height) {
            ctx.moveTo(0, i);
            var endX = Math.min(i, width);
            var endY = i - endX;
            ctx.lineTo(endX, endY);
          } else {
            var startX = i - height;
            ctx.moveTo(startX, height);
            var endX2 = Math.min(i, width);
            var endY2 = i - endX2;
            ctx.lineTo(endX2, endY2);
          }
          ctx.stroke();
        }
      }
    }

    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'gradientCanvas',
          x: 0,
          y: 0,
          width: width,
          height: height,
          destWidth: width,
          destHeight: height,
          fileType: 'png',
          success: function (tmpRes) {
            that.saveToAlbum(tmpRes.tempFilePath);
          },
          fail: function (err) {
            console.error('canvasToTempFilePath fail:', err);
            wx.hideLoading();
            that.setData({ generating: false });
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        }, that);
      }, 300);
    });
  },

  // 保存到相册
  saveToAlbum: function (filePath) {
    var that = this;
    wx.getSetting({
      success: function (res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function () {
              that.doSave(filePath);
            },
            fail: function () {
              wx.hideLoading();
              that.setData({ generating: false });
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: function (modalRes) {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          that.doSave(filePath);
        }
      }
    });
  },

  doSave: function (filePath) {
    var that = this;
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function () {
        wx.hideLoading();
        that.setData({ generating: false });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function (err) {
        wx.hideLoading();
        that.setData({ generating: false });
        console.error('saveImageToPhotosAlbum fail:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '渐变色壁纸生成器 - 自定义专属手机壁纸',
      path: '/pages/tools/gradient/index'
    };
  }
});
