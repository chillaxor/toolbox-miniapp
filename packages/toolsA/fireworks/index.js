var storage = require('../../../utils/storage.js');

var TOOL_ID = 'fireworks';

// 烟花类型定义
var FIREWORK_TYPES = [
  { key: 'random', name: 'Random', nameCn: '随机' },
  { key: 'crackle', name: 'Crackle', nameCn: '爆裂' },
  { key: 'crossette', name: 'Crossette', nameCn: '十字' },
  { key: 'crysanthemum', name: 'Crysanthemum', nameCn: '菊花' },
  { key: 'fallingLeaves', name: 'Falling Leaves', nameCn: '落叶' },
  { key: 'floral', name: 'Floral', nameCn: '繁花' },
  { key: 'ghost', name: 'Ghost', nameCn: '幻影' },
  { key: 'horseTail', name: 'Horse Tail', nameCn: '马尾' },
  { key: 'palm', name: 'Palm', nameCn: '棕榈' },
  { key: 'ring', name: 'Ring', nameCn: '圆环' },
  { key: 'strobe', name: 'Strobe', nameCn: '频闪' },
  { key: 'willow', name: 'Willow', nameCn: '垂柳' }
];

var SIZE_OPTIONS = [3, 4, 6, 8, 12, 16];
var QUALITY_OPTIONS = ['low', 'medium', 'high'];
var SKY_OPTIONS = ['dark', 'dim', 'normal'];
var ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200];

// 颜色调色板
var COLORS = [
  '#FF4444', '#FF8844', '#FFCC44', '#44FF44', '#44CCFF',
  '#4488FF', '#CC44FF', '#FF44CC', '#FFFFFF', '#FFD700',
  '#FF6B6B', '#48DBFB', '#FF9FF3', '#FECA57', '#54A0FF',
  '#5F27CD', '#01A3A4', '#F368E0', '#FF6348', '#7BED9F'
];

Page({
  data: {
    toolId: TOOL_ID,
    isFavorite: false,
    types: FIREWORK_TYPES,
    sizeOptions: SIZE_OPTIONS,
    qualityOptions: QUALITY_OPTIONS,
    skyOptions: SKY_OPTIONS,
    zoomOptions: ZOOM_OPTIONS,
    showPanel: true,
    isFullscreen: false,
    // 当前配置
    config: {
      type: 'random',
      size: 6,
      quality: 'medium',
      sky: 'dark',
      zoom: 100,
      autoFire: true,
      multiFire: false,
      retainSparks: false
    },
    skyLabel: { dark: '无', dim: '微亮', normal: '正常' },
    qualityLabel: { low: '低', medium: '中', high: '高' }
  },

  canvasWidth: 0,
  canvasHeight: 0,
  ctx: null,
  canvas: null,
  particles: [],
  rockets: [],
  animTimer: null,
  autoTimer: null,
  lastTime: 0,
  running: false,

  onLoad: function () {
    this.setData({ isFavorite: storage.isFavorite(TOOL_ID) });
    var sys = wx.getSystemInfoSync();
    this.canvasWidth = sys.windowWidth;
    this.canvasHeight = sys.windowHeight;
    this._loadSavedConfig();
  },

  onReady: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#fireworksCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res[0]) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var sys = wx.getSystemInfoSync();
        var dpr = sys.pixelRatio;
        canvas.width = self.canvasWidth * dpr;
        canvas.height = self.canvasHeight * dpr;
        ctx.scale(dpr, dpr);
        self.canvas = canvas;
        self.ctx = ctx;
        self._startAnimation();
        if (self.data.config.autoFire) {
          self._startAutoFire();
        }
      });
  },

  onUnload: function () {
    this.running = false;
    if (this.animTimer) clearTimeout(this.animTimer);
    if (this.autoTimer) clearInterval(this.autoTimer);
    storage.addHistory({
      toolId: TOOL_ID,
      toolName: '烟花特效',
      category: 'fun',
      summary: '烟花特效欣赏'
    });
  },

  toggleFavorite: function () {
    var result = storage.toggleFavorite(TOOL_ID);
    this.setData({ isFavorite: result });
  },

  togglePanel: function () {
    this.setData({ showPanel: !this.data.showPanel });
  },

  toggleFullscreen: function () {
    this.setData({ isFullscreen: !this.data.isFullscreen });
  },

  // 配置变更
  setType: function (e) {
    this._updateConfig('type', e.currentTarget.dataset.key);
  },

  setSize: function (e) {
    this._updateConfig('size', parseInt(e.currentTarget.dataset.val));
  },

  setQuality: function (e) {
    this._updateConfig('quality', e.currentTarget.dataset.val);
  },

  setSky: function (e) {
    this._updateConfig('sky', e.currentTarget.dataset.val);
  },

  setZoom: function (e) {
    this._updateConfig('zoom', parseInt(e.currentTarget.dataset.val));
  },

  toggleAutoFire: function () {
    var newVal = !this.data.config.autoFire;
    this._updateConfig('autoFire', newVal);
    if (newVal) {
      this._startAutoFire();
    } else if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  },

  toggleMultiFire: function () {
    this._updateConfig('multiFire', !this.data.config.multiFire);
  },

  toggleRetainSparks: function () {
    this._updateConfig('retainSparks', !this.data.config.retainSparks);
  },

  resetDefaults: function () {
    this.setData({
      config: {
        type: 'random',
        size: 6,
        quality: 'medium',
        sky: 'dark',
        zoom: 100,
        autoFire: true,
        multiFire: false,
        retainSparks: false
      }
    });
    this._saveConfig();
    this.particles = [];
    this.rockets = [];
    if (!this.data.config.autoFire) {
      this._startAutoFire();
    }
  },

  onTapCanvas: function (e) {
    var x = e.detail.x;
    var y = e.detail.y;
    this._launchRocket(x, this.canvasHeight, x, y);
  },

  // 内部方法
  _updateConfig: function (key, value) {
    var obj = {};
    obj['config.' + key] = value;
    this.setData(obj);
    this._saveConfig();
  },

  _saveConfig: function () {
    storage.setSync('toolbox_fireworks_config', this.data.config);
  },

  _loadSavedConfig: function () {
    var saved = storage.getSync('toolbox_fireworks_config', null);
    if (saved) {
      this.setData({ config: saved });
    }
  },

  _startAutoFire: function () {
    if (this.autoTimer) clearInterval(this.autoTimer);
    var self = this;
    var baseInterval = 800;
    this.autoTimer = setInterval(function () {
      if (!self.data.config.autoFire) return;
      var count = self.data.config.multiFire ? 2 + Math.floor(Math.random() * 2) : 1;
      for (var i = 0; i < count; i++) {
        var sx = self.canvasWidth * (0.2 + Math.random() * 0.6);
        var tx = self.canvasWidth * (0.1 + Math.random() * 0.8);
        self._launchRocket(sx, self.canvasHeight, tx, self.canvasHeight * (0.1 + Math.random() * 0.4));
      }
    }, baseInterval);
  },

  _getRandomColor: function () {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  },

  _getRandomColors: function (count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push(this._getRandomColor());
    }
    return arr;
  },

  _launchRocket: function (sx, sy, tx, ty) {
    var rocket = {
      x: sx, y: sy,
      targetX: tx, targetY: ty,
      speed: 6 + Math.random() * 4,
      type: this.data.config.type === 'random'
        ? FIREWORK_TYPES[Math.floor(Math.random() * (FIREWORK_TYPES.length - 1)) + 1].key
        : this.data.config.type,
      size: this.data.config.size,
      color: this._getRandomColor(),
      trail: [],
      alive: true
    };
    var dx = tx - sx, dy = ty - sy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    rocket.vx = (dx / dist) * rocket.speed;
    rocket.vy = (dy / dist) * rocket.speed;
    this.rockets.push(rocket);
  },

  _explode: function (x, y, type, size, color) {
    var particleCount;
    var zoom = this.data.config.zoom / 100;
    var qualityMul = this.data.config.quality === 'low' ? 0.5 : this.data.config.quality === 'high' ? 1.5 : 1;
    var baseCount = Math.floor(size * 8 * qualityMul);

    switch (type) {
      case 'crackle':
        this._createCrackle(x, y, baseCount, color, zoom);
        break;
      case 'crossette':
        this._createCrossette(x, y, baseCount, color, zoom);
        break;
      case 'crysanthemum':
        this._createCrysanthemum(x, y, baseCount, color, zoom);
        break;
      case 'fallingLeaves':
        this._createFallingLeaves(x, y, baseCount, color, zoom);
        break;
      case 'floral':
        this._createFloral(x, y, baseCount, color, zoom);
        break;
      case 'ghost':
        this._createGhost(x, y, baseCount, color, zoom);
        break;
      case 'horseTail':
        this._createHorseTail(x, y, baseCount, color, zoom);
        break;
      case 'palm':
        this._createPalm(x, y, baseCount, color, zoom);
        break;
      case 'ring':
        this._createRing(x, y, baseCount, color, zoom);
        break;
      case 'strobe':
        this._createStrobe(x, y, baseCount, color, zoom);
        break;
      case 'willow':
        this._createWillow(x, y, baseCount, color, zoom);
        break;
      default:
        this._createCrysanthemum(x, y, baseCount, color, zoom);
    }
  },

  _addParticle: function (p) {
    p.life = p.life || 1;
    p.decay = p.decay || 0.015;
    p.size = p.size || 2;
    p.gravity = p.gravity !== undefined ? p.gravity : 0.05;
    p.trail = [];
    p.maxTrail = p.maxTrail || 5;
    this.particles.push(p);
  },

  // 各类型烟花
  _createCrysanthemum: function (x, y, count, color, zoom) {
    var colors = this._getRandomColors(3);
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count;
      var speed = (2 + Math.random() * 3) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        decay: 0.008 + Math.random() * 0.006,
        maxTrail: 8
      });
    }
  },

  _createCrackle: function (x, y, count, color, zoom) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (1 + Math.random() * 4) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FFFFFF',
        decay: 0.02 + Math.random() * 0.02,
        size: 1.5,
        maxTrail: 2,
        flicker: true
      });
    }
  },

  _createCrossette: function (x, y, count, color, zoom) {
    var arms = 4 + Math.floor(Math.random() * 4);
    var colors = this._getRandomColors(2);
    for (var i = 0; i < arms; i++) {
      var angle = (Math.PI * 2 * i) / arms;
      var speed = 3 * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[0],
        decay: 0.012,
        maxTrail: 6,
        crossette: true,
        crossetteLife: 0.5
      });
    }
  },

  _createFallingLeaves: function (x, y, count, color, zoom) {
    var colors = ['#FF6B6B', '#FECA57', '#FF9FF3', '#FFA502', '#E056A0'];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (1 + Math.random() * 2) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.006 + Math.random() * 0.004,
        gravity: 0.03,
        wobble: true,
        wobblePhase: Math.random() * Math.PI * 2,
        maxTrail: 4
      });
    }
  },

  _createFloral: function (x, y, count, color, zoom) {
    var petals = 5 + Math.floor(Math.random() * 3);
    var colors = this._getRandomColors(3);
    for (var p = 0; p < petals; p++) {
      var petalAngle = (Math.PI * 2 * p) / petals;
      for (var i = 0; i < count / petals; i++) {
        var a = petalAngle + (Math.random() - 0.5) * 0.5;
        var speed = (2 + Math.random() * 2) * zoom;
        this._addParticle({
          x: x, y: y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          color: colors[p % colors.length],
          decay: 0.01,
          size: 2.5,
          maxTrail: 5
        });
      }
    }
  },

  _createGhost: function (x, y, count, color, zoom) {
    for (var i = 0; i < count * 0.6; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (1 + Math.random() * 2) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed * 0.5,
        vy: Math.sin(angle) * speed * 0.5,
        color: '#FFFFFF',
        decay: 0.004 + Math.random() * 0.003,
        size: 3,
        maxTrail: 12,
        gravity: 0.01
      });
    }
  },

  _createHorseTail: function (x, y, count, color, zoom) {
    var colors = this._getRandomColors(2);
    for (var i = 0; i < count; i++) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      var speed = (2 + Math.random() * 2) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed * 0.3,
        vy: Math.sin(angle) * speed,
        color: colors[i % 2],
        decay: 0.008,
        gravity: 0.08,
        maxTrail: 10
      });
    }
  },

  _createPalm: function (x, y, count, color, zoom) {
    var branches = 6 + Math.floor(Math.random() * 4);
    var colors = ['#FFD700', '#FFA500', '#FF6347'];
    for (var i = 0; i < branches; i++) {
      var angle = (Math.PI * 2 * i) / branches - Math.PI / 2;
      var speed = 4 * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        decay: 0.006,
        gravity: 0.1,
        maxTrail: 10,
        palm: true,
        palmLife: 0.6
      });
    }
  },

  _createRing: function (x, y, count, color, zoom) {
    var rings = 2 + Math.floor(Math.random() * 2);
    var colors = this._getRandomColors(rings);
    for (var r = 0; r < rings; r++) {
      var ringCount = Math.floor(count / rings);
      var radius = (2 + r) * zoom;
      for (var i = 0; i < ringCount; i++) {
        var angle = (Math.PI * 2 * i) / ringCount;
        this._addParticle({
          x: x, y: y,
          vx: Math.cos(angle) * radius,
          vy: Math.sin(angle) * radius,
          color: colors[r],
          decay: 0.01,
          size: 2,
          maxTrail: 3
        });
      }
    }
  },

  _createStrobe: function (x, y, count, color, zoom) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (2 + Math.random() * 3) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FFFFFF',
        decay: 0.015,
        size: 2,
        maxTrail: 3,
        strobe: true,
        strobeTimer: 0
      });
    }
  },

  _createWillow: function (x, y, count, color, zoom) {
    var colors = ['#FFD700', '#ADFF2F', '#7CFC00'];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (2 + Math.random() * 2) * zoom;
      this._addParticle({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        decay: 0.004,
        gravity: 0.12,
        maxTrail: 15
      });
    }
  },

  // 动画循环
  _startAnimation: function () {
    this.running = true;
    this.lastTime = Date.now();
    this._animate();
  },

  _animate: function () {
    if (!this.running) return;
    var self = this;
    var now = Date.now();
    var dt = Math.min((now - this.lastTime) / 16.67, 3);
    this.lastTime = now;

    this._update(dt);
    this._draw();

    this.animTimer = setTimeout(function () {
      self._animate();
    }, 1000 / 30);
  },

  _update: function (dt) {
    var zoom = this.data.config.zoom / 100;

    // 更新火箭
    for (var i = this.rockets.length - 1; i >= 0; i--) {
      var r = this.rockets[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();

      var dx = r.x - r.targetX;
      var dy = r.y - r.targetY;
      if (dx * dx + dy * dy < 400 || r.y < r.targetY) {
        this._explode(r.x, r.y, r.type, r.size, r.color);
        this.rockets.splice(i, 1);
      }
    }

    // 更新粒子
    for (var j = this.particles.length - 1; j >= 0; j--) {
      var p = this.particles[j];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life -= p.decay * dt;

      if (p.wobble) {
        p.wobblePhase += 0.1 * dt;
        p.vx += Math.sin(p.wobblePhase) * 0.05 * dt;
      }

      if (p.strobe) {
        p.strobeTimer += dt;
      }

      // 尾迹
      p.trail.push({ x: p.x, y: p.y, life: p.life });
      if (p.trail.length > p.maxTrail) p.trail.shift();

      // 棕榈二次爆
      if (p.palm && p.life < p.palmLife && !p.branched) {
        p.branched = true;
        for (var b = 0; b < 5; b++) {
          var a = Math.random() * Math.PI * 2;
          var sp = 1 + Math.random() * 2;
          this._addParticle({
            x: p.x, y: p.y,
            vx: p.vx * 0.3 + Math.cos(a) * sp,
            vy: p.vy * 0.3 + Math.sin(a) * sp,
            color: p.color,
            decay: 0.02,
            size: 1.5,
            gravity: 0.08,
            maxTrail: 4
          });
        }
      }

      // 十字二次爆
      if (p.crossette && p.life < p.crossetteLife && !p.branched) {
        p.branched = true;
        for (var c = 0; c < 4; c++) {
          var ca = (Math.PI / 2) * c;
          for (var s = 0; s < 3; s++) {
            var sp2 = 1 + s * 0.8;
            this._addParticle({
              x: p.x, y: p.y,
              vx: Math.cos(ca) * sp2,
              vy: Math.sin(ca) * sp2,
              color: p.color,
              decay: 0.02,
              size: 1.5,
              maxTrail: 3
            });
          }
        }
      }

      if (p.life <= 0 && !this.data.config.retainSparks) {
        this.particles.splice(j, 1);
      } else if (p.life <= -0.5) {
        this.particles.splice(j, 1);
      }
    }
  },

  _draw: function () {
    var ctx = this.ctx;
    var w = this.canvasWidth;
    var h = this.canvasHeight;

    // 天空背景
    var skyAlpha = this.data.config.sky === 'dark' ? 1 : this.data.config.sky === 'dim' ? 0.92 : 0.82;
    ctx.fillStyle = 'rgba(0,0,0,' + skyAlpha + ')';
    ctx.fillRect(0, 0, w, h);

    // 画火箭尾迹
    for (var ri = 0; ri < this.rockets.length; ri++) {
      var r = this.rockets[ri];
      for (var rt = 0; rt < r.trail.length; rt++) {
        var ta = rt / r.trail.length * 0.6;
        ctx.fillStyle = 'rgba(255,200,100,' + ta + ')';
        ctx.fillRect(r.trail[rt].x - 1, r.trail[rt].y - 1, 2, 2);
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 画粒子
    for (var pi = 0; pi < this.particles.length; pi++) {
      var p = this.particles[pi];
      var alpha = Math.max(0, p.life);

      // 尾迹
      for (var ti = 0; ti < p.trail.length; ti++) {
        var trailAlpha = (ti / p.trail.length) * alpha * 0.5;
        var trailSize = p.size * (ti / p.trail.length) * 0.6;
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.trail[ti].x, p.trail[ti].y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 频闪效果
      if (p.strobe && Math.floor(p.strobeTimer / 3) % 2 === 0) {
        alpha *= 0.2;
      }

      // 闪烁效果
      if (p.flicker) {
        alpha *= (0.5 + Math.random() * 0.5);
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  },

  onShareAppMessage: function () {
    return {
      title: '🎆 全屏烟花特效 - 新年快乐！',
      path: '/packages/toolsA/fireworks/index'
    };
  },

  onShareTimeline: function () {
    return {
      title: '🎆 全屏烟花特效，点击屏幕放烟花！'
    };
  }
});
