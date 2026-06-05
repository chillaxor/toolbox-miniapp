var coloringData = require('../../../data/coloring-data.js');

function pointInPolygon(x, y, polygon) {
  var inside = false;
  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    var xi = polygon[i][0], yi = polygon[i][1];
    var xj = polygon[j][0], yj = polygon[j][1];
    var intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawRegionsOnCtx(ctx, w, h, regions, colors, selectedId) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, w, h);
  var scaleX = w / 100;
  var scaleY = h / 100;
  regions.forEach(function (r) {
    var pts = r.points;
    if (!pts || pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * scaleX, pts[0][1] * scaleY);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0] * scaleX, pts[i][1] * scaleY);
    }
    ctx.closePath();
    var color = colors ? colors[r.id] : null;
    ctx.fillStyle = color || '#f0f0f0';
    ctx.fill();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    if (selectedId && r.id === selectedId) {
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  // Draw border for main canvas
  regions.forEach(function (r) {
    var pts = r.points;
    if (!pts || pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * scaleX, pts[0][1] * scaleY);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0] * scaleX, pts[i][1] * scaleY);
    }
    ctx.closePath();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
  });
}

Page({
  data: {
    categories: coloringData.categories,
    palette: coloringData.defaultPalette,
    difficultyText: coloringData.difficultyText,
    currentCategory: 'animals',
    templateList: [],
    currentTemplate: null,
    selectedColor: '#E74C3C',
    selectedRegionId: null,
    colorHistory: ['#E74C3C', '#F1C40F', '#3498DB'],
    eraserOn: false,
    canvasWidth: 320,
    canvasHeight: 320,
    regionColors: {},
    showPicker: false,
    customColor: '#FF0000',
    savedWorks: [],
    showGallery: false,
    undoStack: [],
    redoStack: []
  },

  onLoad: function () {
    var sys = wx.getSystemInfoSync();
    var cw = Math.min(sys.windowWidth - 40, 360);
    var allTemplates = coloringData.templates;
    var processed = {};
    Object.keys(allTemplates).forEach(function (cat) {
      processed[cat] = allTemplates[cat].map(function (tpl) {
        return {
          id: tpl.id,
          name: tpl.name,
          difficulty: tpl.difficulty,
          regions: tpl.regions.map(function (r) {
            return { id: r.id, points: r.points };
          })
        };
      });
    });
    this._allTemplates = processed;
    var cat = this.data.currentCategory;
    this.setData({
      canvasWidth: cw,
      canvasHeight: cw,
      templateList: processed[cat]
    });
    this.loadSavedWorks();
  },

  onReady: function () {
    // 先选择第一个模板（会通过setData取消hidden），再初始化Canvas
    if (this.data.templateList.length > 0) {
      this._selectTemplateInternal(this.data.templateList[0]);
    }
  },

  onShow: function () {
    this.loadSavedWorks();
  },

  _selectTemplateInternal: function (tpl) {
    var colors = {};
    tpl.regions.forEach(function (r) { colors[r.id] = ''; });
    var self = this;
    this.setData({
      currentTemplate: tpl,
      regionColors: colors,
      selectedRegionId: null,
      undoStack: [],
      redoStack: []
    }, function () {
      // Canvas已在DOM中，直接绘制
      if (self._mainCanvas && self._mainCtx) {
        self._drawMainCanvas();
      } else {
        // 首次初始化（onReady可能还没完成）
        self._initCanvasWithRetry(0);
      }
      self._drawAllPreviewsWithRetry(0);
    });
  },

  _initCanvasWithRetry: function (retryCount) {
    var self = this;
    if (retryCount > 15) {
      console.log('Canvas初始化失败，已达最大重试次数');
      return;
    }
    setTimeout(function () {
      var query = self.createSelectorQuery();
      query.select('#mainCanvas')
        .fields({ node: true, size: true })
        .exec(function (res) {
          if (!res || !res[0] || !res[0].node) {
            console.log('Canvas未就绪，重试第' + (retryCount + 1) + '次');
            self._initCanvasWithRetry(retryCount + 1);
            return;
          }
          var canvas = res[0].node;
          var ctx = canvas.getContext('2d');
          var dpr = wx.getSystemInfoSync().pixelRatio;
          var w = res[0].width;
          var h = res[0].height;
          if (w === 0 || h === 0) {
            console.log('Canvas尺寸为0，重试第' + (retryCount + 1) + '次');
            self._initCanvasWithRetry(retryCount + 1);
            return;
          }
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);
          self._mainCanvas = canvas;
          self._mainCtx = ctx;
          self._mainW = w;
          self._mainH = h;
          self._mainDpr = dpr;
          console.log('Canvas初始化成功，尺寸:', w, h, 'DPR:', dpr);
          self._drawMainCanvas();
        });
    }, 50 + retryCount * 80);
  },

  _drawAllPreviewsWithRetry: function (retryCount) {
    var self = this;
    if (retryCount > 8) return;
    var list = this.data.templateList;
    if (!list || list.length === 0) return;
    setTimeout(function () {
      self._drawAllPreviews();
    }, 150 + retryCount * 100);
  },

  _drawAllPreviews: function () {
    var self = this;
    var list = this.data.templateList;
    list.forEach(function (tpl, idx) {
      var query = self.createSelectorQuery();
      query.select('#tplPreview' + idx)
        .fields({ node: true, size: true })
        .exec(function (res) {
          if (!res || !res[0] || !res[0].node) return;
          var canvas = res[0].node;
          var ctx = canvas.getContext('2d');
          var dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          drawRegionsOnCtx(ctx, res[0].width, res[0].height, tpl.regions, null, null);
        });
    });
  },

  _drawMainCanvas: function () {
    if (!this._mainCtx || !this.data.currentTemplate) return;
    drawRegionsOnCtx(
      this._mainCtx,
      this._mainW,
      this._mainH,
      this.data.currentTemplate.regions,
      this.data.regionColors,
      this.data.selectedRegionId
    );
  },

  switchCategory: function (e) {
    var cat = e.currentTarget.dataset.id;
    var list = this._allTemplates[cat];
    this.setData({ currentCategory: cat, templateList: list });
    var self = this;
    if (list.length > 0) {
      this._selectTemplateInternal(list[0]);
    }
  },

  onTapTemplate: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var tpl = this.data.templateList[idx];
    if (tpl) this._selectTemplateInternal(tpl);
  },

  onCanvasTap: function (e) {
    if (!this.data.currentTemplate || !this._mainCanvas) return;
    // Canvas 2D touchstart事件：touches[0].x/y 是相对于canvas的CSS像素坐标
    var x, y;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].x;
      y = e.touches[0].y;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      x = e.changedTouches[0].x;
      y = e.changedTouches[0].y;
    } else if (e.detail && e.detail.x !== undefined) {
      x = e.detail.x;
      y = e.detail.y;
    } else {
      return;
    }
    if (x === undefined || y === undefined) return;
    // 触摸坐标已经是CSS像素，直接转换到数据坐标(0-100范围)
    var scaleX = 100 / this._mainW;
    var scaleY = 100 / this._mainH;
    var dataX = x * scaleX;
    var dataY = y * scaleY;
    var tpl = this.data.currentTemplate;
    var hitRegion = null;
    for (var i = tpl.regions.length - 1; i >= 0; i--) {
      var r = tpl.regions[i];
      if (r.points && r.points.length >= 3 && pointInPolygon(dataX, dataY, r.points)) {
        hitRegion = r;
        break;
      }
    }
    if (!hitRegion) return;
    var regionId = hitRegion.id;
    var color = this.data.eraserOn ? '' : this.data.selectedColor;
    var oldColors = JSON.parse(JSON.stringify(this.data.regionColors));
    var newColors = JSON.parse(JSON.stringify(this.data.regionColors));
    newColors[regionId] = color;
    var undoStack = this.data.undoStack.concat([oldColors]);
    this.setData({
      regionColors: newColors,
      selectedRegionId: regionId,
      undoStack: undoStack,
      redoStack: []
    });
    this._drawMainCanvas();
  },

  selectColor: function (e) {
    var color = e.currentTarget.dataset.color;
    this.setData({
      selectedColor: color,
      eraserOn: false,
      colorHistory: this._pushHistory(this.data.colorHistory, color)
    });
  },

  toggleEraser: function () {
    this.setData({ eraserOn: !this.data.eraserOn });
  },

  undo: function () {
    if (this.data.undoStack.length === 0) return;
    var undoStack = this.data.undoStack.slice();
    var prev = undoStack.pop();
    var current = JSON.parse(JSON.stringify(this.data.regionColors));
    var redoStack = this.data.redoStack.concat([current]);
    this.setData({
      regionColors: prev,
      undoStack: undoStack,
      redoStack: redoStack
    });
    this._drawMainCanvas();
  },

  redo: function () {
    if (this.data.redoStack.length === 0) return;
    var redoStack = this.data.redoStack.slice();
    var next = redoStack.pop();
    var current = JSON.parse(JSON.stringify(this.data.regionColors));
    var undoStack = this.data.undoStack.concat([current]);
    this.setData({
      regionColors: next,
      undoStack: undoStack,
      redoStack: redoStack
    });
    this._drawMainCanvas();
  },

  clearAll: function () {
    var colors = {};
    this.data.currentTemplate.regions.forEach(function (r) { colors[r.id] = ''; });
    var undoStack = this.data.undoStack.concat([JSON.parse(JSON.stringify(this.data.regionColors))]);
    this.setData({
      regionColors: colors,
      undoStack: undoStack,
      redoStack: []
    });
    this._drawMainCanvas();
  },

  openCustomPicker: function () {
    this.setData({ showPicker: true });
  },

  closePicker: function () {
    this.setData({ showPicker: false });
  },

  onCustomColorInput: function (e) {
    this.setData({ customColor: e.detail.value });
  },

  confirmCustomColor: function () {
    var c = this.data.customColor;
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) {
      wx.showToast({ title: '请输入正确颜色值', icon: 'none' });
      return;
    }
    this.setData({
      selectedColor: c,
      showPicker: false,
      eraserOn: false,
      colorHistory: this._pushHistory(this.data.colorHistory, c)
    });
  },

  saveWork: function () {
    var tpl = this.data.currentTemplate;
    if (!tpl) return;
    var saved = wx.getStorageSync('coloring_saved') || [];
    var colors = this.data.regionColors;
    var hasColor = Object.keys(colors).some(function (k) { return colors[k]; });
    if (!hasColor) {
      wx.showToast({ title: '还没有涂色哦', icon: 'none' });
      return;
    }
    var id = tpl.id + '_' + Date.now();
    saved.unshift({
      id: id,
      templateId: tpl.id,
      name: tpl.name,
      category: this.data.currentCategory,
      colors: colors,
      time: Date.now()
    });
    if (saved.length > 20) saved = saved.slice(0, 20);
    wx.setStorageSync('coloring_saved', saved);
    this.setData({ savedWorks: saved });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  loadSavedWorks: function () {
    var saved = wx.getStorageSync('coloring_saved') || [];
    this.setData({ savedWorks: saved });
  },

  toggleGallery: function () {
    this.setData({ showGallery: !this.data.showGallery });
  },

  loadWork: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var work = this.data.savedWorks[idx];
    if (!work) return;
    var tpl = null;
    var self = this;
    Object.keys(this._allTemplates).forEach(function (cat) {
      self._allTemplates[cat].forEach(function (t) {
        if (t.id === work.templateId) tpl = t;
      });
    });
    if (!tpl) {
      wx.showToast({ title: '模板未找到', icon: 'none' });
      return;
    }
    var colors = work.colors || {};
    this.setData({
      currentTemplate: tpl,
      regionColors: colors,
      selectedRegionId: null,
      showGallery: false,
      undoStack: [],
      redoStack: []
    }, function () {
      // Canvas已在DOM中，直接绘制
      if (self._mainCanvas && self._mainCtx) {
        self._drawMainCanvas();
      } else {
        self._initCanvasWithRetry(0);
      }
      self._drawAllPreviewsWithRetry(0);
    });
  },

  deleteWork: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var saved = this.data.savedWorks.slice();
    saved.splice(idx, 1);
    wx.setStorageSync('coloring_saved', saved);
    this.setData({ savedWorks: saved });
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  _pushHistory: function (arr, item) {
    var a = arr.filter(function (x) { return x !== item; });
    a.unshift(item);
    if (a.length > 8) a = a.slice(0, 8);
    return a;
  }
});
