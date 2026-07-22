var storage = require('../../../utils/storage.js');
var quotesData = require('./quotes-data.js');

var TEMPLATES = [
  { id: 'pink', name: '粉甜', bg1: '#ff9a9e', bg2: '#fecfef', text: '#fff' },
  { id: 'purple', name: '星夜', bg1: '#667eea', bg2: '#764ba2', text: '#fff' },
  { id: 'sunset', name: '日落', bg1: '#fa709a', bg2: '#fee140', text: '#fff' },
  { id: 'ocean', name: '海洋', bg1: '#4facfe', bg2: '#00f2fe', text: '#fff' },
  { id: 'forest', name: '森林', bg1: '#43e97b', bg2: '#38f9d7', text: '#fff' },
  { id: 'dark', name: '深邃', bg1: '#0f0c29', bg2: '#302b63', text: '#e0d6ff' },
  { id: 'warm', name: '暖阳', bg1: '#f6d365', bg2: '#fda085', text: '#5d3a00' },
  { id: 'paper', name: '信纸', bg1: '#faf8f3', bg2: '#f5f0e8', text: '#5d4037' }
];

Page({
  data: {
    isFavorite: false,
    currentQuote: '',
    currentCategory: '',
    customText: '',
    useCustom: false,
    selectedTemplate: 'pink',
    templates: TEMPLATES,
    categories: quotesData.CATEGORIES,
    selectedCategory: '',
    today: '',
    isCollecting: false,
    collectedQuotes: []
  },

  onLoad: function () {
    this.checkFavorite();
    this.loadCollected();
    var now = new Date();
    var y = now.getFullYear();
    var m = ('0' + (now.getMonth() + 1)).slice(-2);
    var d = ('0' + now.getDate()).slice(-2);
    var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    var w = weekdays[now.getDay()];
    this.setData({ today: y + '.' + m + '.' + d + ' 周' + w });
    this.loadDailyQuote();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('lovecard') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('lovecard') });
  },

  loadDailyQuote: function () {
    var day = quotesData.getDayOfYear();
    var q = quotesData.getQuoteByDayOfYear(day);
    this.setData({
      currentQuote: q.text,
      currentCategory: q.categoryName,
      useCustom: false,
      isCollecting: this.data.collectedQuotes.indexOf(q.text) !== -1
    });
  },

  onCategorySelect: function (e) {
    var id = e.currentTarget.dataset.id;
    if (this.data.selectedCategory === id) {
      this.setData({ selectedCategory: '' });
      this.loadDailyQuote();
      return;
    }
    var q = quotesData.getQuoteFromCategory(id);
    this.setData({
      selectedCategory: id,
      currentQuote: q.text,
      currentCategory: q.categoryName,
      useCustom: false,
      isCollecting: this.data.collectedQuotes.indexOf(q.text) !== -1
    });
  },

  onRandomQuote: function () {
    var q = quotesData.getRandomQuote();
    this.setData({
      currentQuote: q.text,
      currentCategory: q.categoryName,
      selectedCategory: '',
      useCustom: false,
      isCollecting: this.data.collectedQuotes.indexOf(q.text) !== -1
    });
  },

  onCustomInput: function (e) {
    this.setData({ customText: e.detail.value });
  },

  onUseCustom: function () {
    var text = this.data.customText.trim();
    if (!text) {
      wx.showToast({ title: '请先输入情话', icon: 'none' });
      return;
    }
    this.setData({
      currentQuote: text,
      currentCategory: '自定义',
      useCustom: true,
      isCollecting: this.data.collectedQuotes.indexOf(text) !== -1
    });
  },

  onToggleCustom: function () {
    if (this.data.useCustom) {
      this.loadDailyQuote();
      this.setData({ selectedCategory: '' });
    }
  },

  onTemplateSelect: function (e) {
    this.setData({ selectedTemplate: e.currentTarget.dataset.id });
  },

  onCollectQuote: function () {
    var collected = this.data.collectedQuotes;
    var text = this.data.currentQuote;
    var idx = collected.indexOf(text);
    if (idx !== -1) {
      collected.splice(idx, 1);
      this.setData({ collectedQuotes: collected, isCollecting: false });
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      collected.unshift(text);
      if (collected.length > 50) collected = collected.slice(0, 50);
      this.setData({ collectedQuotes: collected, isCollecting: true });
      wx.showToast({ title: '已收藏', icon: 'success' });
    }
    storage.setSync('lovecard_collected', collected);
  },

  loadCollected: function () {
    var collected = storage.getSync('lovecard_collected', []);
    this.setData({ collectedQuotes: collected });
  },

  checkCollect: function (text) {
    return this.data.collectedQuotes.indexOf(text) !== -1;
  },

  onCopyQuote: function () {
    wx.setClipboardData({
      data: this.data.currentQuote,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  getTemplateById: function (id) {
    for (var i = 0; i < TEMPLATES.length; i++) {
      if (TEMPLATES[i].id === id) return TEMPLATES[i];
    }
    return TEMPLATES[0];
  },

  saveImage: function () {
    var self = this;
    var quote = self.data.currentQuote;
    if (!quote) {
      wx.showToast({ title: '没有可保存的内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var query = wx.createSelectorQuery();
    query.select('#cardCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          wx.hideLoading();
          wx.showToast({ title: '画布初始化失败', icon: 'none' });
          return;
        }

        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio || 2;
        var W = 540;
        var H = 720;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        var tpl = self.getTemplateById(self.data.selectedTemplate);

        // ① 背景渐变
        var grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, tpl.bg1);
        grad.addColorStop(1, tpl.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ② 装饰元素
        self._drawDecor(ctx, W, H, tpl);

        // ③ 引号装饰
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = 'bold 140px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('\u201C', 40, 180);

        // ④ 情话文字
        var fontSize = self._calcFontSize(ctx, quote, W - 100);
        ctx.font = fontSize + 'px sans-serif';
        ctx.fillStyle = tpl.text;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 6;

        var lines = self._wrapText(ctx, quote, W - 100);
        var lineHeight = fontSize * 1.7;
        var totalH = lines.length * lineHeight;
        var startY = (H - totalH) / 2 - 20;

        for (var i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], W / 2, startY + i * lineHeight + fontSize);
        }
        ctx.shadowBlur = 0;

        // ⑤ 底部分隔线
        ctx.strokeStyle = tpl.text;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, H - 100);
        ctx.lineTo(W - 60, H - 100);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ⑥ 分类标签
        ctx.font = '18px sans-serif';
        ctx.fillStyle = tpl.text;
        ctx.globalAlpha = 0.5;
        ctx.textAlign = 'left';
        ctx.fillText(self.data.currentCategory, 60, H - 65);

        // ⑦ 日期
        ctx.textAlign = 'right';
        ctx.fillText(self.data.today, W - 60, H - 65);
        ctx.globalAlpha = 1;

        // 导出保存
        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0, y: 0,
          width: W * dpr,
          height: H * dpr,
          destWidth: W * 2,
          destHeight: H * 2,
          fileType: 'png',
          success: function (tmpRes) {
            wx.saveImageToPhotosAlbum({
              filePath: tmpRes.tempFilePath,
              success: function () {
                wx.hideLoading();
                wx.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: function (err) {
                wx.hideLoading();
                if (err.errMsg && err.errMsg.indexOf('deny') !== -1) {
                  wx.showModal({
                    title: '提示',
                    content: '需要授权保存到相册，请在设置中允许',
                    confirmText: '去设置',
                    success: function (modalRes) {
                      if (modalRes.confirm) wx.openSetting();
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
            wx.showToast({ title: '生成图片失败', icon: 'none' });
          }
        });
      });
  },

  _calcFontSize: function (ctx, text, maxW) {
    var sizes = [30, 28, 26, 24, 22, 20, 18];
    for (var i = 0; i < sizes.length; i++) {
      ctx.font = sizes[i] + 'px sans-serif';
      var lines = this._wrapText(ctx, text, maxW);
      if (lines.length * sizes[i] * 1.7 < 350) {
        return sizes[i];
      }
    }
    return 18;
  },

  _wrapText: function (ctx, text, maxW) {
    var paragraphs = text.split('\n');
    var lines = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var line = paragraphs[p];
      if (ctx.measureText(line).width <= maxW) {
        lines.push(line);
      } else {
        var cur = '';
        for (var j = 0; j < line.length; j++) {
          var test = cur + line[j];
          if (ctx.measureText(test).width > maxW) {
            lines.push(cur);
            cur = line[j];
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);
      }
    }
    return lines;
  },

  _drawDecor: function (ctx, W, H, tpl) {
    // 星星/圆点装饰
    ctx.fillStyle = tpl.text;
    ctx.globalAlpha = 0.06;
    var seed = tpl.bg1.charCodeAt(1) + tpl.bg2.charCodeAt(3);
    for (var i = 0; i < 30; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      var x = (seed / 233280) * W;
      seed = (seed * 9301 + 49297) % 233280;
      var y = (seed / 233280) * H;
      seed = (seed * 9301 + 49297) % 233280;
      var r = 2 + (seed / 233280) * 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 角落爱心
    ctx.globalAlpha = 0.08;
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2665', W - 60, 80);
    ctx.fillText('\u2665', 60, H - 130);
    ctx.globalAlpha = 1;
  },

  onShareAppMessage: function () {
    return {
      title: '情话卡片 - 每日一句甜蜜情话',
      path: '/packages/toolsA/lovecard/index'
    };
  }
});
