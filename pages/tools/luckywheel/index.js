var storage = require('../../../utils/storage.js');
var wheelUtil = require('../../../utils/luckywheel.js');

Page({
  data: {
    isFavorite: false,
    options: ['火锅', '烧烤', '面条', '米饭', '汉堡', '沙拉'],
    newOption: '',
    isSpinning: false,
    result: '',
    showResult: false,
    presets: [],
    showPresets: false
  },

  onLoad: function () {
    this.checkFavorite();
    var savedOptions = wx.getStorageSync('toolbox_wheel_options');
    if (savedOptions && savedOptions.length > 0) {
      this.setData({ options: savedOptions });
    }
    var presets = wheelUtil.getPresets();
    this.setData({ presets: presets });
  },

  onReady: function () {
    this._canvasReady = false;
    this._ctx = null;
    this._canvasSize = 0;
    this._currentRotation = 0;
    this.initCanvas();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('luckywheel') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('luckywheel');
    this.setData({ isFavorite: fav });
  },

  initCanvas: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#wheelCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0]) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio;
      var size = res[0].width;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      self._canvas = canvas;
      self._ctx = ctx;
      self._canvasSize = size;
      self._canvasReady = true;

      self.drawWheel(0);
    });
  },

  drawWheel: function (rotation) {
    if (!this._canvasReady) return;
    this._currentRotation = rotation || 0;
    var ctx = this._ctx;
    var size = this._canvasSize;
    var options = this.data.options;
    var count = options.length;
    var centerX = size / 2;
    var centerY = size / 2;
    var radius = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    // 外圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#E74C3C';
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    var sliceAngle = (2 * Math.PI) / count;

    for (var i = 0; i < count; i++) {
      var startAngle = i * sliceAngle - Math.PI / 2;
      var endAngle = startAngle + sliceAngle;

      // 扇区
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = wheelUtil.getSliceColor(i);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 文字
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var textRadius = radius * 0.6;
      var text = options[i];
      if (text.length > 4) text = text.substring(0, 4) + '..';
      ctx.fillText(text, textRadius, 0);
      ctx.restore();
    }

    ctx.restore();

    // 中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#E74C3C';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 中心文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GO', centerX, centerY);
  },

  onNewOptionInput: function (e) {
    this.setData({ newOption: e.detail.value });
  },

  onAddOption: function () {
    var opt = this.data.newOption.trim();
    if (!opt) return;
    if (this.data.options.length >= 12) {
      wx.showToast({ title: '最多12个选项', icon: 'none' });
      return;
    }
    var options = this.data.options.slice();
    options.push(opt);
    this.setData({ options: options, newOption: '' });
    this.saveOptions();
    this.drawWheel(this._currentRotation);
  },

  onRemoveOption: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var options = this.data.options.slice();
    if (options.length <= 2) {
      wx.showToast({ title: '至少保留2个选项', icon: 'none' });
      return;
    }
    options.splice(idx, 1);
    this.setData({ options: options });
    this.saveOptions();
    this.drawWheel(this._currentRotation);
  },

  saveOptions: function () {
    wx.setStorageSync('toolbox_wheel_options', this.data.options);
  },

  onSpin: function () {
    if (this.data.isSpinning) return;
    if (!this._canvasReady) return;
    if (this.data.options.length < 2) {
      wx.showToast({ title: '至少需要2个选项', icon: 'none' });
      return;
    }

    var self = this;
    var options = this.data.options;
    var targetIndex = Math.floor(Math.random() * options.length);
    var spins = 3 + Math.floor(Math.random() * 4);
    var totalRotation = spins * 360 + Math.random() * 360;
    var duration = 3000 + spins * 300;
    var startTime = Date.now();
    var startRotation = this._currentRotation;
    var canvas = this._canvas;

    this.setData({ isSpinning: true, result: '' });

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var currentRotation = startRotation + totalRotation * eased;

      self.drawWheel(currentRotation);

      if (progress < 1) {
        canvas.requestAnimationFrame(animate);
      } else {
        // 计算结果：指针在顶部（-90度位置），所以看哪个扇区对准顶部
        var normalizedAngle = (360 - (currentRotation % 360)) % 360;
        var sliceAngle = 360 / options.length;
        var resultIndex = Math.floor(normalizedAngle / sliceAngle) % options.length;

        self.setData({
          isSpinning: false,
          result: options[resultIndex],
          showResult: true
        });

        storage.addHistory({
          toolId: 'luckywheel',
          toolName: '抽签助手',
          category: 'fun',
          summary: '抽中: ' + options[resultIndex],
          timestamp: Date.now()
        });
      }
    }

    canvas.requestAnimationFrame(animate);
  },

  onShowPresets: function () {
    this.setData({ showPresets: true });
  },

  onClosePresets: function () {
    this.setData({ showPresets: false });
  },

  onApplyPreset: function (e) {
    var id = e.currentTarget.dataset.id;
    var preset = null;
    var presets = this.data.presets;
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === id) {
        preset = presets[i];
        break;
      }
    }
    if (preset) {
      this.setData({ options: preset.options.slice(), showPresets: false });
      this.saveOptions();
      this.drawWheel(0);
    }
  },

  onCloseResult: function () {
    this.setData({ showResult: false });
  },

  onShareAppMessage: function () {
    return {
      title: '抽签助手 - 大转盘',
      path: '/pages/tools/luckywheel/index'
    };
  }
});