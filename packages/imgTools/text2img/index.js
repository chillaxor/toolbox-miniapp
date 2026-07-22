var storage = require('../../../utils/storage.js');

var TEMPLATES = [
  { id: 'minimal', name: '简约白', previewColor: '#333' },
  { id: 'card', name: '经典卡片', previewColor: '#e74c3c' },
  { id: 'chinese', name: '诗意古风', previewColor: '#8b4513' },
  { id: 'gradient', name: '渐变背景', previewColor: '#667eea' },
  { id: 'note', name: '便签纸', previewColor: '#f59e0b' },
  { id: 'dark', name: '深色高级', previewColor: '#c9d1d9' },
  { id: 'quote', name: '朋友圈金句', previewColor: '#f5576c' },
  { id: 'torn', name: '撕边纸', previewColor: '#8b7355' }
];

var TEXT_COLORS = [
  { color: '#333333' },
  { color: '#666666' },
  { color: '#1a1a2e' },
  { color: '#8b4513' },
  { color: '#2c3e50' },
  { color: '#c0392b' },
  { color: '#8e44ad' },
  { color: '#2980b9' },
  { color: '#27ae60' },
  { color: '#f39c12' },
  { color: '#e74c3c' },
  { color: '#16a085' },
  { color: '#ffffff' }
];

var BG_COLORS = [
  { color: '#ffffff' },
  { color: '#f5f5f5' },
  { color: '#faf6f0' },
  { color: '#fffde7' },
  { color: '#e8f5e9' },
  { color: '#e3f2fd' },
  { color: '#fce4ec' },
  { color: '#f3e5f5' },
  { color: '#1a1a2e' },
  { color: '#2d3436' }
];

var GRADIENTS = [
  { start: '#667eea', end: '#764ba2' },
  { start: '#f093fb', end: '#f5576c' },
  { start: '#4facfe', end: '#00f2fe' },
  { start: '#43e97b', end: '#38f9d7' },
  { start: '#fa709a', end: '#fee140' },
  { start: '#a18cd1', end: '#fbc2eb' },
  { start: '#fccb90', end: '#d57eeb' },
  { start: '#ff9a9e', end: '#fecfef' },
  { start: '#ffecd2', end: '#fcb69f' },
  { start: '#a1c4fd', end: '#c2e9fb' },
  { start: '#fdcbf1', end: '#e6dee9' },
  { start: '#89f7fe', end: '#66a6ff' }
];

Page({
  data: {
    isFavorite: false,
    inputText: '',
    author: '',
    selectedTemplate: 'minimal',
    fontSize: 36,
    textColor: '#333333',
    bgColor: '#ffffff',
    selectedGradient: 0,
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    gradientAngle: 135,
    currentDate: '',
    templates: TEMPLATES,
    textColors: TEXT_COLORS,
    bgColors: BG_COLORS,
    gradients: GRADIENTS
  },

  onLoad: function () {
    this.checkFavorite();
    var now = new Date();
    var dateStr = now.getFullYear() + '.' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '.' +
      ('0' + now.getDate()).slice(-2);
    this.setData({ currentDate: dateStr });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('text2img') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('text2img') });
  },

  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  onAuthorChange: function (e) {
    this.setData({ author: e.detail.value });
  },

  onTemplateSelect: function (e) {
    var id = e.currentTarget.dataset.id;
    var updates = { selectedTemplate: id };
    // Reset default colors per template
    if (id === 'chinese') {
      updates.textColor = '#8b4513';
      updates.bgColor = '#faf6f0';
    } else if (id === 'dark') {
      updates.textColor = '#c9d1d9';
    } else if (id === 'card') {
      updates.textColor = '#333333';
    } else if (id === 'note') {
      updates.textColor = '#5d4037';
      updates.bgColor = '#fffde7';
    } else if (id === 'gradient' || id === 'quote') {
      updates.textColor = '#ffffff';
    }
    this.setData(updates);
  },

  onFontSizeChange: function (e) {
    this.setData({ fontSize: e.detail.value });
  },

  onTextColorSelect: function (e) {
    this.setData({ textColor: e.currentTarget.dataset.color });
  },

  onBgColorSelect: function (e) {
    this.setData({ bgColor: e.currentTarget.dataset.color });
  },

  onGradientSelect: function (e) {
    var idx = e.currentTarget.dataset.index;
    var g = GRADIENTS[idx];
    this.setData({
      selectedGradient: idx,
      gradientStart: g.start,
      gradientEnd: g.end
    });
  },

  saveImage: function () {
    var self = this;
    if (!self.data.inputText.trim()) {
      wx.showToast({ title: '请输入文字内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    var query = wx.createSelectorQuery();
    query.select('#imgCanvas')
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
        var W = 750;
        var H = 1000;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        var tpl = self.data.selectedTemplate;
        var text = self.data.inputText;
        var author = self.data.author;
        var textColor = self.data.textColor;
        var bgColor = self.data.bgColor;
        var fontSize = self.data.fontSize * 2; // scale up for image
        var pad = 80;

        // Draw background
        self._drawBackground(ctx, W, H, tpl);

        // Draw text
        self._drawText(ctx, W, H, text, author, tpl, textColor, fontSize, pad);

        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
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
                    showCancel: false
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

  _drawBackground: function (ctx, W, H, tpl) {
    if (tpl === 'minimal' || tpl === 'note' || tpl === 'torn') {
      ctx.fillStyle = this.data.bgColor;
      ctx.fillRect(0, 0, W, H);
    } else if (tpl === 'card') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
    } else if (tpl === 'chinese') {
      ctx.fillStyle = '#faf6f0';
      ctx.fillRect(0, 0, W, H);
    } else if (tpl === 'dark') {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
    } else if (tpl === 'gradient' || tpl === 'quote') {
      var grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, this.data.gradientStart);
      grd.addColorStop(1, this.data.gradientEnd);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }
  },

  _drawText: function (ctx, W, H, text, author, tpl, textColor, fontSize, pad) {
    var self = this;
    var lines = [];
    var maxW = W - pad * 2;
    var y0 = 0;

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    // Calculate lines
    ctx.font = fontSize + 'px sans-serif';
    var words = text.split('\n');
    for (var i = 0; i < words.length; i++) {
      var line = words[i];
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

    var lineHeight = fontSize * 1.6;
    var totalTextH = lines.length * lineHeight;
    var authorH = author ? fontSize * 0.8 + 30 : 0;

    if (tpl === 'minimal') {
      // Decorative lines + centered text
      var centerY = H / 2 - (totalTextH + authorH) / 2;
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 30, centerY - 20);
      ctx.lineTo(W / 2 + 30, centerY - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W / 2 - 30, centerY + totalTextH + 20);
      ctx.lineTo(W / 2 + 30, centerY + totalTextH + 20);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, centerY + k * lineHeight + fontSize);
      }
      if (author) {
        ctx.font = Math.round(fontSize * 0.55) + 'px sans-serif';
        ctx.globalAlpha = 0.6;
        ctx.fillText('—— ' + author, W / 2, centerY + totalTextH + 50);
        ctx.globalAlpha = 1;
      }

    } else if (tpl === 'card') {
      // Big quote mark + italic style
      var centerY = H / 2 - (totalTextH + authorH + 80) / 2;
      ctx.font = 'bold 100px Georgia, serif';
      ctx.fillStyle = '#e74c3c';
      ctx.globalAlpha = 0.6;
      ctx.textAlign = 'left';
      ctx.fillText('"', pad + 10, centerY + 20);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';

      ctx.font = 'italic ' + fontSize + 'px Georgia, serif';
      ctx.fillStyle = textColor;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, centerY + 100 + k * lineHeight + fontSize);
      }
      if (author) {
        ctx.font = Math.round(fontSize * 0.55) + 'px sans-serif';
        ctx.globalAlpha = 0.6;
        ctx.fillText('—— ' + author, W / 2, centerY + 100 + totalTextH + 40);
        ctx.globalAlpha = 1;
      }

    } else if (tpl === 'chinese') {
      // Bordered box with corner marks + seal stamp
      var boxPad = 50;
      var boxW = W - pad * 2 - boxPad * 2;
      var boxH = totalTextH + 60;
      var boxX = pad + boxPad;
      var boxY = H / 2 - (boxH + authorH + 60) / 2;

      // Border
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Corner marks
      var markLen = 20;
      var corners = [
        [boxX, boxY],
        [boxX + boxW, boxY],
        [boxX, boxY + boxH],
        [boxX + boxW, boxY + boxH]
      ];
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      // Top-left
      ctx.beginPath(); ctx.moveTo(corners[0][0], corners[0][1] + markLen); ctx.lineTo(corners[0][0], corners[0][1]); ctx.lineTo(corners[0][0] + markLen, corners[0][1]); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(corners[1][0] - markLen, corners[1][1]); ctx.lineTo(corners[1][0], corners[1][1]); ctx.lineTo(corners[1][0], corners[1][1] + markLen); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(corners[2][0], corners[2][1] - markLen); ctx.lineTo(corners[2][0], corners[2][1]); ctx.lineTo(corners[2][0] + markLen, corners[2][1]); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(corners[3][0] - markLen, corners[3][1]); ctx.lineTo(corners[3][0], corners[3][1]); ctx.lineTo(corners[3][0], corners[3][1] - markLen); ctx.stroke();
      ctx.globalAlpha = 1;

      // Text
      ctx.font = fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, boxY + 30 + k * lineHeight + fontSize);
      }

      // Seal stamp
      if (author) {
        var sealW = ctx.measureText(author).width + 24;
        var sealH = Math.round(fontSize * 0.6) + 16;
        var sealX = W / 2 + 80;
        var sealY = boxY + boxH + 30;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(sealX - sealW / 2, sealY, sealW, sealH);
        ctx.globalAlpha = 0.7;
        ctx.font = Math.round(fontSize * 0.5) + 'px sans-serif';
        ctx.fillText(author, sealX, sealY + sealH - 8);
        ctx.globalAlpha = 1;
      }

    } else if (tpl === 'gradient' || tpl === 'quote') {
      ctx.font = 'bold ' + fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 10;

      if (tpl === 'quote') {
        // Content area with border bottom
        var centerY = H / 2 - (totalTextH + authorH + 40) / 2;
        for (var k = 0; k < lines.length; k++) {
          ctx.fillText(lines[k], W / 2, centerY + k * lineHeight + fontSize);
        }
        ctx.shadowBlur = 0;
        // Footer line
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(pad + 40, centerY + totalTextH + 20);
        ctx.lineTo(W - pad - 40, centerY + totalTextH + 20);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (author) {
          ctx.font = Math.round(fontSize * 0.5) + 'px sans-serif';
          ctx.globalAlpha = 0.8;
          ctx.textAlign = 'left';
          ctx.fillText('—— ' + author, pad + 40, centerY + totalTextH + 55);
          ctx.textAlign = 'right';
          ctx.globalAlpha = 0.6;
          ctx.fillText(self.data.currentDate, W - pad - 40, centerY + totalTextH + 55);
          ctx.textAlign = 'center';
          ctx.globalAlpha = 1;
        }
      } else {
        var centerY = H / 2 - (totalTextH + authorH) / 2;
        for (var k = 0; k < lines.length; k++) {
          ctx.fillText(lines[k], W / 2, centerY + k * lineHeight + fontSize);
        }
        ctx.shadowBlur = 0;
        if (author) {
          ctx.font = Math.round(fontSize * 0.55) + 'px sans-serif';
          ctx.globalAlpha = 0.8;
          ctx.fillText('—— ' + author, W / 2, centerY + totalTextH + 40);
          ctx.globalAlpha = 1;
        }
      }

    } else if (tpl === 'note') {
      // Ruled lines background
      var lineStart = 120;
      ctx.strokeStyle = '#e8e4d0';
      ctx.lineWidth = 1;
      for (var y = lineStart; y < H - 40; y += 60) {
        ctx.beginPath();
        ctx.moveTo(pad - 20, y);
        ctx.lineTo(W - pad + 20, y);
        ctx.stroke();
      }

      // Pin
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(W / 2, 60, 14, 0, Math.PI * 2);
      ctx.fill();

      // Text on lines
      ctx.font = fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      var textStartY = 140;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, textStartY + k * 60 + fontSize * 0.5);
      }

      if (author) {
        ctx.font = Math.round(fontSize * 0.55) + 'px sans-serif';
        ctx.globalAlpha = 0.6;
        ctx.textAlign = 'right';
        ctx.fillText('—— ' + author, W - pad + 10, textStartY + lines.length * 60);
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;
      }

    } else if (tpl === 'dark') {
      // Decorative lines above and below
      var centerY = H / 2 - (totalTextH + authorH + 60) / 2;

      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 25, centerY - 10);
      ctx.lineTo(W / 2 + 25, centerY - 10);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = '300 ' + fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, centerY + 30 + k * lineHeight + fontSize);
      }

      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 25, centerY + 30 + totalTextH + 20);
      ctx.lineTo(W / 2 + 25, centerY + 30 + totalTextH + 20);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (author) {
        ctx.font = Math.round(fontSize * 0.5) + 'px sans-serif';
        ctx.globalAlpha = 0.5;
        ctx.fillText('—— ' + author, W / 2, centerY + 30 + totalTextH + 55);
        ctx.globalAlpha = 1;
      }

    } else if (tpl === 'torn') {
      // Torn edge simulation at top and bottom
      ctx.fillStyle = this.data.bgColor;
      ctx.fillRect(0, 0, W, 20);
      ctx.fillRect(0, H - 20, W, 20);

      // Inner paper
      ctx.fillStyle = '#faf8f3';
      ctx.fillRect(15, 20, W - 30, H - 40);

      // Torn effect top
      ctx.fillStyle = this.data.bgColor;
      for (var x = 15; x < W - 15; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + 12, 32);
        ctx.lineTo(x + 24, 20);
        ctx.fill();
      }
      // Torn effect bottom
      for (var x = 15; x < W - 15; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, H - 20);
        ctx.lineTo(x + 12, H - 32);
        ctx.lineTo(x + 24, H - 20);
        ctx.fill();
      }

      // Text
      ctx.font = fontSize + 'px sans-serif';
      ctx.fillStyle = textColor;
      var textY = H / 2 - (totalTextH + authorH) / 2;
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], W / 2, textY + k * lineHeight + fontSize);
      }

      if (author) {
        ctx.font = Math.round(fontSize * 0.55) + 'px sans-serif';
        ctx.globalAlpha = 0.6;
        ctx.textAlign = 'right';
        ctx.fillText('—— ' + author, W - 60, textY + totalTextH + 40);
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;
      }
    }
  },

  onShareAppMessage: function () {
    return {
      title: '文字转图片 - 精美文字卡片生成器',
      path: '/packages/imgTools/text2img/index'
    };
  }
});
