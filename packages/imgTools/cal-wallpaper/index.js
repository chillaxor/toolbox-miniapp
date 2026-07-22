var storage = require('../../../utils/storage.js');
var calendarUtil = require('../../../utils/calendar.js');

Page({
  data: {
    isFavorite: false,
    // 当前年月
    year: 2026,
    month: 1,
    // 日历网格
    grid: [],
    // 星期标题
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    // 月份名称
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    // 背景
    bgColor: '#2D3436',
    bgImage: '',
    overlayOpacity: 0.3,
    // 背景颜色选项
    bgColors: [
      '#2D3436', '#636E72', '#0984E3', '#6C5CE7', '#E84393',
      '#D63031', '#00B894', '#E17055', '#2C3E50', '#1A1A2E',
      '#16213E', '#0F3460', '#533483', '#2C003E', '#004D40'
    ],
    // 日历颜色
    calColor: '#FFFFFF',
    calColorOptions: [
      { color: '#FFFFFF', name: '白色' },
      { color: '#FFD700', name: '金色' },
      { color: '#FF6B6B', name: '红色' },
      { color: '#74B9FF', name: '蓝色' },
      { color: '#55EFC4', name: '绿色' },
      { color: '#FDCB6E', name: '橙色' }
    ],
    // 日历位置
    position: 'bottom',
    positionOptions: [
      { key: 'top', label: '顶部' },
      { key: 'center', label: '居中' },
      { key: 'bottom', label: '底部' }
    ],
    // 生成状态
    generating: false
  },

  onLoad: function () {
    this.checkFavorite();
    var now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
    this.buildGrid();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('cal-wallpaper') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('cal-wallpaper');
    this.setData({ isFavorite: fav });
  },

  // 构建日历网格
  buildGrid: function () {
    var grid = calendarUtil.getCalendarGrid(this.data.year, this.data.month);
    this.setData({ grid: grid });
  },

  // 上一月
  prevMonth: function () {
    var y = this.data.year;
    var m = this.data.month - 1;
    if (m < 1) { m = 12; y--; }
    this.setData({ year: y, month: m });
    this.buildGrid();
  },

  // 下一月
  nextMonth: function () {
    var y = this.data.year;
    var m = this.data.month + 1;
    if (m > 12) { m = 1; y++; }
    this.setData({ year: y, month: m });
    this.buildGrid();
  },

  // 选择纯色背景
  selectBgColor: function (e) {
    this.setData({ bgColor: e.currentTarget.dataset.color });
  },

  // 去掉背景图片（切回纯色模式）
  chooseNoImage: function () {
    this.setData({ bgImage: '' });
  },

  // 选择背景图片
  chooseImage: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        that.setData({ bgImage: res.tempFilePaths[0] });
      }
    });
  },

  // 遮罩浓度变化
  onOverlayChange: function (e) {
    this.setData({ overlayOpacity: e.detail.value / 100 });
  },

  // 选择日历颜色
  selectCalColor: function (e) {
    this.setData({ calColor: e.currentTarget.dataset.color });
  },

  // 选择日历位置
  selectPosition: function (e) {
    this.setData({ position: e.currentTarget.dataset.pos });
  },

  // ====== Canvas 生成壁纸 ======
  generateWallpaper: function () {
    if (this.data.generating) return;
    var that = this;
    this.setData({ generating: true });
    wx.showLoading({ title: '生成中...', mask: true });

    var query = wx.createSelectorQuery().in(this);
    query.select('#wallpaperCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          that.generateWithOldCanvas();
          return;
        }
        that.drawWithNewCanvas(res[0].node);
      });
  },

  // 新版 Canvas 2D 绘制
  drawWithNewCanvas: function (canvas) {
    var that = this;
    var ctx = canvas.getContext('2d');
    var W = 750, H = 1334;
    canvas.width = W;
    canvas.height = H;

    var drawCalendar = function () {
      that.drawCalendarContent(ctx, W, H);
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0, y: 0, width: W, height: H,
          destWidth: W, destHeight: H,
          fileType: 'png',
          success: function (r) { that.saveToAlbum(r.tempFilePath); },
          fail: function (err) {
            console.error(err);
            wx.hideLoading();
            that.setData({ generating: false });
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        }, that);
      }, 100);
    };

    if (this.data.bgImage) {
      var img = canvas.createImage();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, W, H);
        // 遮罩
        ctx.fillStyle = 'rgba(0,0,0,' + that.data.overlayOpacity + ')';
        ctx.fillRect(0, 0, W, H);
        drawCalendar();
      };
      img.onerror = function () {
        ctx.fillStyle = that.data.bgColor;
        ctx.fillRect(0, 0, W, H);
        drawCalendar();
      };
      img.src = this.data.bgImage;
    } else {
      ctx.fillStyle = this.data.bgColor;
      ctx.fillRect(0, 0, W, H);
      drawCalendar();
    }
  },

  // 旧版 Canvas 回退
  generateWithOldCanvas: function () {
    var that = this;
    var ctx = wx.createCanvasContext('wallpaperCanvas', this);
    var W = 750, H = 1334;

    var drawCal = function () {
      that.drawCalendarContentOld(ctx, W, H);
      ctx.draw(false, function () {
        setTimeout(function () {
          wx.canvasToTempFilePath({
            canvasId: 'wallpaperCanvas',
            x: 0, y: 0, width: W, height: H,
            destWidth: W, destHeight: H,
            fileType: 'png',
            success: function (r) { that.saveToAlbum(r.tempFilePath); },
            fail: function (err) {
              console.error(err);
              wx.hideLoading();
              that.setData({ generating: false });
              wx.showToast({ title: '生成失败', icon: 'none' });
            }
          }, that);
        }, 300);
      });
    };

    if (this.data.bgImage) {
      ctx.drawImage(this.data.bgImage, 0, 0, W, H);
      ctx.setFillStyle('rgba(0,0,0,' + this.data.overlayOpacity + ')');
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.setFillStyle(this.data.bgColor);
      ctx.fillRect(0, 0, W, H);
    }
    drawCal();
  },

  // 计算日历绘制参数
  getCalLayout: function (W, H) {
    var pos = this.data.position;
    var marginLeft = 50;
    var marginTop = 120;
    var calW = W - marginLeft * 2;
    var calH = 440;
    var startY;
    if (pos === 'top') {
      startY = 160;
    } else if (pos === 'center') {
      startY = (H - calH) / 2;
    } else {
      startY = H - calH - 100;
    }
    return { marginLeft: marginLeft, startY: startY, calW: calW, calH: calH };
  },

  // 新版 Canvas 绘制日历内容
  drawCalendarContent: function (ctx, W, H) {
    var layout = this.getCalLayout(W, H);
    var x0 = layout.marginLeft;
    var y = layout.startY;
    var calW = layout.calW;
    var color = this.data.calColor;
    var monthNames = this.data.monthNames;

    // 月份标题
    ctx.fillStyle = color;
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(monthNames[this.data.month - 1], x0, y + 48);
    y += 60;
    ctx.font = '24px sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = color;
    ctx.fillText(this.data.year + '', x0, y + 24);
    ctx.globalAlpha = 1;
    y += 50;

    // 星期标题
    var weekdays = this.data.weekdays;
    var cellW = calW / 7;
    ctx.font = '20px sans-serif';
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = color;
    for (var i = 0; i < 7; i++) {
      ctx.textAlign = 'center';
      ctx.fillText(weekdays[i], x0 + cellW * i + cellW / 2, y + 20);
    }
    ctx.globalAlpha = 1;
    y += 40;

    // 日期
    var grid = this.data.grid;
    ctx.font = '22px sans-serif';
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c];
        var cx = x0 + cellW * c + cellW / 2;
        var cy = y + r * 38 + 22;
        if (!cell.isCurrentMonth) {
          ctx.globalAlpha = 0.25;
        } else if (cell.isToday) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#FFD700';
        } else if (cell.isWeekend) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = color;
        } else {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = color;
        }
        ctx.textAlign = 'center';
        ctx.fillText('' + cell.date, cx, cy);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
  },

  // 旧版 Canvas 绘制日历内容
  drawCalendarContentOld: function (ctx, W, H) {
    var layout = this.getCalLayout(W, H);
    var x0 = layout.marginLeft;
    var y = layout.startY;
    var calW = layout.calW;
    var color = this.data.calColor;
    var monthNames = this.data.monthNames;

    ctx.setFillStyle(color);
    ctx.setFontSize(48);
    ctx.fillText(monthNames[this.data.month - 1], x0, y + 48);
    y += 60;
    ctx.setFontSize(24);
    ctx.setGlobalAlpha(0.7);
    ctx.setFillStyle(color);
    ctx.fillText(this.data.year + '', x0, y + 24);
    ctx.setGlobalAlpha(1);
    y += 50;

    var weekdays = this.data.weekdays;
    var cellW = calW / 7;
    ctx.setFontSize(20);
    ctx.setGlobalAlpha(0.6);
    ctx.setFillStyle(color);
    ctx.setTextAlign('center');
    for (var i = 0; i < 7; i++) {
      ctx.fillText(weekdays[i], x0 + cellW * i + cellW / 2, y + 20);
    }
    ctx.setGlobalAlpha(1);
    ctx.setTextAlign('left');
    y += 40;

    var grid = this.data.grid;
    ctx.setFontSize(22);
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c];
        var cx = x0 + cellW * c + cellW / 2;
        var cy = y + r * 38 + 22;
        if (!cell.isCurrentMonth) {
          ctx.setGlobalAlpha(0.25);
        } else if (cell.isToday) {
          ctx.setGlobalAlpha(1);
          ctx.setFillStyle('#FFD700');
        } else if (cell.isWeekend) {
          ctx.setGlobalAlpha(0.8);
          ctx.setFillStyle(color);
        } else {
          ctx.setGlobalAlpha(0.9);
          ctx.setFillStyle(color);
        }
        ctx.setTextAlign('center');
        ctx.fillText('' + cell.date, cx, cy);
      }
    }
    ctx.setGlobalAlpha(1);
    ctx.setFillStyle(color);
    ctx.setTextAlign('left');
  },

  // 保存到相册
  saveToAlbum: function (filePath) {
    var that = this;
    wx.getSetting({
      success: function (res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function () { that.doSave(filePath); },
            fail: function () {
              wx.hideLoading();
              that.setData({ generating: false });
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: function (mr) { if (mr.confirm) wx.openSetting(); }
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
        console.error(err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '日历壁纸生成器 - 选图+日历=专属壁纸',
      path: '/packages/imgTools/cal-wallpaper/index'
    };
  }
});
