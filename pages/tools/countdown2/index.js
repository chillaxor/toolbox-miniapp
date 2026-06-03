// pages/tools/countdown2/index.js
var app = getApp();

// 预设时间（分钟）
var PRESETS = [
  { label: '1分钟', minutes: 1 },
  { label: '3分钟', minutes: 3 },
  { label: '5分钟', minutes: 5 },
  { label: '10分钟', minutes: 10 },
  { label: '15分钟', minutes: 15 },
  { label: '25分钟', minutes: 25 },
  { label: '30分钟', minutes: 30 },
  { label: '60分钟', minutes: 60 }
];

Page({
  data: {
    // 编辑模式
    inputHours: '0',
    inputMinutes: '5',
    inputSeconds: '0',
    presets: PRESETS,
    activePreset: -1,

    // 倒计时模式
    isCounting: false,       // 是否处于倒计时界面
    isRunning: false,        // 是否正在运行
    isPaused: false,         // 是否暂停
    isTimeUp: false,         // 时间到

    // 时间相关
    totalSeconds: 0,         // 总秒数
    remainSeconds: 0,        // 剩余秒数
    displayTime: '00:00:00', // 显示时间
    isShortFormat: false,    // 是否用 MM:SS 短格式
    progress: 0,             // 进度 0~1

    // canvas
    canvasSize: 320,
    canvasWidth: 320,
    canvasHeight: 320,

    // 屏幕亮度
    originalBrightness: 0.5
  },

  // 定时器相关变量（不放在 data 中）
  _timer: null,
  _startTime: 0,       // 倒计时开始的时刻戳
  _pausedElapsed: 0,   // 暂停时已经过去的毫秒数
  _totalMs: 0,         // 总毫秒数

  onLoad: function () {
    // 获取屏幕亮度
    var that = this;
    wx.getScreenBrightness({
      success: function (res) {
        that._originalBrightness = res.value || 0.5;
      },
      fail: function () {
        that._originalBrightness = 0.5;
      }
    });
  },

  onUnload: function () {
    this._clearTimer();
    this._restoreBrightness();
  },

  onHide: function () {
    // 后台运行时保持定时器，但用时间戳差值保证准确
    // 不主动清除，onShow 时会重新校准
  },

  onShow: function () {
    // 如果正在运行，重新校准显示
    if (this.data.isRunning && !this.data.isPaused) {
      this._tick();
    }
  },

  onShareAppMessage: function () {
    return {
      title: '全屏倒计时 - 专注每一刻',
      path: '/pages/tools/countdown2/index'
    };
  },

  // ========== 输入处理 ==========

  onHoursInput: function (e) {
    var val = e.detail.value;
    if (parseInt(val) > 23) val = '23';
    if (parseInt(val) < 0) val = '0';
    this.setData({ inputHours: val, activePreset: -1 });
  },

  onMinutesInput: function (e) {
    var val = e.detail.value;
    if (parseInt(val) > 59) val = '59';
    if (parseInt(val) < 0) val = '0';
    this.setData({ inputMinutes: val, activePreset: -1 });
  },

  onSecondsInput: function (e) {
    var val = e.detail.value;
    if (parseInt(val) > 59) val = '59';
    if (parseInt(val) < 0) val = '0';
    this.setData({ inputSeconds: val, activePreset: -1 });
  },

  // ========== 预设按钮 ==========

  onPresetTap: function (e) {
    var index = e.currentTarget.dataset.index;
    var preset = PRESETS[index];
    var h = Math.floor(preset.minutes / 60);
    var m = preset.minutes % 60;
    this.setData({
      inputHours: String(h),
      inputMinutes: String(m),
      inputSeconds: '0',
      activePreset: index
    });
  },

  // ========== 控制按钮 ==========

  onStart: function () {
    var hours = parseInt(this.data.inputHours) || 0;
    var minutes = parseInt(this.data.inputMinutes) || 0;
    var seconds = parseInt(this.data.inputSeconds) || 0;
    var totalSec = hours * 3600 + minutes * 60 + seconds;

    if (totalSec <= 0) {
      wx.showToast({ title: '请设置时间', icon: 'none' });
      return;
    }

    // 计算 canvas 尺寸（屏幕宽度的 85%）
    var sysInfo = wx.getSystemInfoSync();
    var canvasPx = Math.floor(sysInfo.windowWidth * 0.85);
    var canvasRpx = canvasPx * 2;

    // 如果总时间不超过 59:59，用 MM:SS 短格式显示（字体更大）
    var useShort = (hours === 0);

    this.setData({
      isCounting: true,
      isRunning: true,
      isPaused: false,
      isTimeUp: false,
      totalSeconds: totalSec,
      remainSeconds: totalSec,
      isShortFormat: useShort,
      displayTime: useShort ? this._formatTimeShort(totalSec) : this._formatTime(totalSec),
      progress: 0,
      canvasSize: canvasRpx,
      canvasWidth: canvasPx,
      canvasHeight: canvasPx
    });

    this._totalMs = totalSec * 1000;
    this._pausedElapsed = 0;
    this._startTime = Date.now();

    // 保持屏幕常亮
    wx.setKeepScreenOn({ keepScreenOn: true });

    // 提高屏幕亮度
    wx.setScreenBrightness({ value: 1.0 });

    // 隐藏导航栏（全屏效果）
    wx.hideNavigationBar({
      fail: function () {
        // 某些环境不支持
      }
    });

    this._startTimer();
    this._drawProgressRing(0);
  },

  onPause: function () {
    if (this.data.isPaused) {
      // 恢复
      this._startTime = Date.now();
      this.setData({ isPaused: false });
      this._startTimer();
    } else {
      // 暂停
      this._clearTimer();
      var elapsed = Date.now() - this._startTime;
      this._pausedElapsed = this._pausedElapsed + elapsed;
      this.setData({ isPaused: true });
    }
  },

  onReset: function () {
    this._clearTimer();
    this._restoreBrightness();

    // 显示导航栏
    wx.showNavigationBar({
      fail: function () {}
    });

    this.setData({
      isCounting: false,
      isRunning: false,
      isPaused: false,
      isTimeUp: false,
      progress: 0,
      remainSeconds: 0,
      displayTime: '00:00:00'
    });

    wx.setKeepScreenOn({ keepScreenOn: false });
  },

  // ========== 定时器逻辑 ==========

  _startTimer: function () {
    var that = this;
    this._clearTimer();

    // 立即执行一次
    this._tick();

    this._timer = setInterval(function () {
      that._tick();
    }, 100); // 100ms 刷新，保证流畅
  },

  _tick: function () {
    if (!this.data.isRunning || this.data.isPaused) return;

    var now = Date.now();
    var elapsed = this._pausedElapsed + (now - this._startTime);
    var remainMs = this._totalMs - elapsed;

    if (remainMs <= 0) {
      // 时间到
      remainMs = 0;
      this._clearTimer();
      var timeUpText = this.data.isShortFormat ? '00:00' : '00:00:00';
      this.setData({
        remainSeconds: 0,
        displayTime: timeUpText,
        progress: 1,
        isRunning: false,
        isTimeUp: true
      });
      this._drawProgressRing(1);
      this._onTimeUp();
      return;
    }

    var remainSec = Math.ceil(remainMs / 1000);
    var progress = elapsed / this._totalMs;
    if (progress > 1) progress = 1;

    // 仅在秒数变化时更新 displayTime（减少 setData 次数）
    var displayTime = this.data.isShortFormat ? this._formatTimeShort(remainSec) : this._formatTime(remainSec);
    var needUpdate = (remainSec !== this.data.remainSeconds) ||
      (Math.abs(progress - this.data.progress) > 0.005);

    if (needUpdate) {
      this.setData({
        remainSeconds: remainSec,
        displayTime: displayTime,
        progress: progress
      });
      this._drawProgressRing(progress);
    }
  },

  _clearTimer: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _onTimeUp: function () {
    // 振动
    wx.vibrateShort({ type: 'heavy' });

    // 连续振动几次
    var count = 0;
    var vibrateTimer = setInterval(function () {
      count++;
      if (count >= 5) {
        clearInterval(vibrateTimer);
        return;
      }
      wx.vibrateShort({ type: 'heavy' });
    }, 500);

    // 弹窗提醒
    wx.showModal({
      title: '时间到！',
      content: '倒计时已结束',
      showCancel: false,
      confirmText: '好的'
    });
  },

  _restoreBrightness: function () {
    wx.setScreenBrightness({
      value: this._originalBrightness,
      fail: function () {}
    });
  },

  // ========== 工具函数 ==========

  _formatTime: function (totalSec) {
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return this._pad(h) + ':' + this._pad(m) + ':' + this._pad(s);
  },

  _formatTimeShort: function (totalSec) {
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return this._pad(m) + ':' + this._pad(s);
  },

  _pad: function (n) {
    return n < 10 ? '0' + n : '' + n;
  },

  // ========== Canvas 绘制圆环进度条 ==========

  _drawProgressRing: function (progress) {
    var canvasWidth = this.data.canvasWidth;
    var canvasHeight = this.data.canvasHeight;

    if (!canvasWidth || canvasWidth <= 0) return;

    var ctx = wx.createCanvasContext('progressCanvas', this);
    var centerX = canvasWidth / 2;
    var centerY = canvasHeight / 2;
    var lineWidth = Math.max(6, canvasWidth * 0.04);
    var radius = centerX - lineWidth;

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 背景圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.setStrokeStyle('rgba(255, 255, 255, 0.15)');
    ctx.setLineWidth(lineWidth);
    ctx.setLineCap('round');
    ctx.stroke();

    // 进度圆环
    if (progress > 0) {
      var startAngle = -Math.PI / 2;
      var endAngle = startAngle + 2 * Math.PI * progress;

      // 渐变色：根据进度从绿色到橙色到红色
      var color;
      if (progress < 0.6) {
        color = '#4ECDC4';
      } else if (progress < 0.85) {
        color = '#FF6B35';
      } else {
        color = '#E74C3C';
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(lineWidth);
      ctx.setLineCap('round');
      ctx.stroke();

      // 进度末端的小圆点发光效果
      var dotX = centerX + radius * Math.cos(endAngle);
      var dotY = centerY + radius * Math.sin(endAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, lineWidth * 0.8, 0, 2 * Math.PI);
      ctx.setFillStyle(color);
      ctx.setShadow(0, 0, 8, color);
      ctx.fill();
      ctx.setShadow(0, 0, 0, 'transparent');
    }

    ctx.draw();
  }
});
