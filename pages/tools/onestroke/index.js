var storage = require('../../../utils/storage.js');
var oneStroke = require('../../../utils/onestroke.js');

Page({
  data: {
    isFavorite: false,
    level: 'easy',
    difficultyLabel: '简单',
    currentLevelIndex: 0,
    totalLevels: 5,
    levelName: '',
    steps: 0,
    totalEdges: 0,
    started: false,
    completed: false,
    stuck: false,
    showComplete: false
  },

  _ctx: null,
  _canvas: null,
  _canvasW: 0,
  _canvasH: 0,
  _currentLevel: null,
  _path: [],
  _nodePath: [],
  _currentNode: -1,
  _usedEdges: [],
  _nodeScreenPos: [],

  onLoad: function () {
    this.checkFavorite();
    this.loadLevel();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('onestroke') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('onestroke');
    this.setData({ isFavorite: fav });
  },

  onLevelChange: function (e) {
    var level = e.currentTarget.dataset.level;
    var config = oneStroke.getDifficultyConfig(level);
    this.setData({
      level: level,
      difficultyLabel: config.label,
      currentLevelIndex: 0
    });
    this.loadLevel();
  },

  loadLevel: function () {
    var levels = oneStroke.getLevels(this.data.level);
    var idx = this.data.currentLevelIndex;
    if (idx >= levels.length) {
      this.setData({ showComplete: true });
      return;
    }
    var level = levels[idx];
    this._currentLevel = level;
    this._path = [];
    this._nodePath = [];
    this._currentNode = -1;
    this._usedEdges = [];
    this._nodeScreenPos = [];
    this.setData({
      levelName: level.name,
      totalLevels: levels.length,
      totalEdges: level.edges.length,
      steps: 0,
      started: false,
      completed: false,
      stuck: false
    });
    this.initCanvas();
  },

  initCanvas: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#gameCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res[0]) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getWindowInfo().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      self._canvas = canvas;
      self._ctx = ctx;
      self._canvasW = width;
      self._canvasH = height;
      self._calcNodePositions();
      self.drawGame();
    });
  },

  _calcNodePositions: function () {
    if (!this._currentLevel) return;
    var nodes = this._currentLevel.nodes;
    var w = this._canvasW;
    var h = this._canvasH;
    var padding = 30;
    this._nodeScreenPos = [];
    for (var i = 0; i < nodes.length; i++) {
      this._nodeScreenPos.push({
        x: padding + nodes[i].x * (w - 2 * padding),
        y: padding + nodes[i].y * (h - 2 * padding)
      });
    }
  },

  drawGame: function () {
    var ctx = this._ctx;
    var level = this._currentLevel;
    if (!ctx || !level) return;

    var w = this._canvasW;
    var h = this._canvasH;
    var config = oneStroke.getDifficultyConfig(this.data.level);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, h);

    var pos = this._nodeScreenPos;

    // 画未走过的边（灰色）
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = config.lineWidth;
    ctx.setLineDash([]);
    for (var i = 0; i < level.edges.length; i++) {
      if (this._usedEdges.indexOf(i) === -1) {
        var e = level.edges[i];
        ctx.beginPath();
        ctx.moveTo(pos[e[0]].x, pos[e[0]].y);
        ctx.lineTo(pos[e[1]].x, pos[e[1]].y);
        ctx.stroke();
      }
    }

    // 画已走过的边（渐变彩色）
    for (var i = 0; i < this._path.length; i++) {
      var edgeIdx = this._path[i];
      var e = level.edges[edgeIdx];
      var progress = (i + 1) / this._path.length;
      var r = Math.round(78 + progress * (231 - 78));
      var g = Math.round(205 + progress * (76 - 205));
      var b = Math.round(196 + progress * (120 - 196));
      ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.lineWidth = config.lineWidth + 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pos[e[0]].x, pos[e[0]].y);
      ctx.lineTo(pos[e[1]].x, pos[e[1]].y);
      ctx.stroke();
    }

    // 画节点
    for (var i = 0; i < pos.length; i++) {
      var isCurrent = (i === this._currentNode);
      var isHighlight = false;

      if (this.data.started && !this.data.completed && this._currentNode >= 0) {
        var adjEdges = this._getAdjacentUnusedEdges(this._currentNode);
        for (var j = 0; j < adjEdges.length; j++) {
          var edge = level.edges[adjEdges[j]];
          var neighbor = edge[0] === this._currentNode ? edge[1] : edge[0];
          if (neighbor === i) { isHighlight = true; break; }
        }
      }

      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, config.nodeSize, 0, Math.PI * 2);
      if (isCurrent) {
        ctx.fillStyle = '#E74C3C';
      } else if (isHighlight) {
        ctx.fillStyle = '#FF9800';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      ctx.fill();

      ctx.strokeStyle = isCurrent ? '#C0392B' : (isHighlight ? '#E65100' : '#666666');
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, config.nodeSize, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isCurrent ? '#FFFFFF' : (isHighlight ? '#FFFFFF' : '#333333');
      ctx.font = 'bold ' + (config.nodeSize - 2) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), pos[i].x, pos[i].y);
    }

    // 起点标记
    if (this.data.started && this._nodePath.length > 0) {
      var startPos = pos[this._nodePath[0]];
      ctx.fillStyle = '#4CAF50';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('起', startPos.x, startPos.y - config.nodeSize - 8);
    }
  },

  _getAdjacentUnusedEdges: function (nodeIdx) {
    var level = this._currentLevel;
    var result = [];
    for (var i = 0; i < level.edges.length; i++) {
      if (this._usedEdges.indexOf(i) !== -1) continue;
      var e = level.edges[i];
      if (e[0] === nodeIdx || e[1] === nodeIdx) {
        result.push(i);
      }
    }
    return result;
  },

  onCanvasTap: function (e) {
    if (this.data.completed) return;

    // canvas type="2d" 的 bindtap 事件通过 e.detail 获取坐标
    var x = e.detail.x;
    var y = e.detail.y;

    var clickedNode = -1;
    var config = oneStroke.getDifficultyConfig(this.data.level);
    var hitRadius = config.nodeSize + 12;
    for (var i = 0; i < this._nodeScreenPos.length; i++) {
      var dx = x - this._nodeScreenPos[i].x;
      var dy = y - this._nodeScreenPos[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
        clickedNode = i;
        break;
      }
    }

    if (clickedNode === -1) return;

    if (!this.data.started) {
      this._currentNode = clickedNode;
      this._nodePath = [clickedNode];
      this.setData({ started: true });
      this.drawGame();
      this._checkStuck();
      return;
    }

    this._tryMove(clickedNode);
  },

  _tryMove: function (targetNode) {
    var level = this._currentLevel;
    var edgeIdx = oneStroke.findEdge(level.edges, this._currentNode, targetNode);
    if (edgeIdx === -1) return;
    if (this._usedEdges.indexOf(edgeIdx) !== -1) return;

    this._path.push(edgeIdx);
    this._usedEdges.push(edgeIdx);
    this._currentNode = targetNode;
    this._nodePath.push(targetNode);

    var newSteps = this._path.length;
    this.setData({ steps: newSteps });

    this.drawGame();

    if (newSteps === level.edges.length) {
      this.setData({ completed: true, stuck: false });
      storage.addHistory({
        toolId: 'onestroke',
        toolName: '一笔画',
        category: 'fun',
        summary: this.data.difficultyLabel + '·' + level.name + ' 通关',
        timestamp: Date.now()
      });
    } else {
      this._checkStuck();
    }
  },

  _checkStuck: function () {
    var adj = this._getAdjacentUnusedEdges(this._currentNode);
    if (adj.length === 0 && this._path.length < this._currentLevel.edges.length) {
      this.setData({ stuck: true });
    } else {
      this.setData({ stuck: false });
    }
  },

  onHint: function () {
    if (this.data.completed) return;
    if (!this.data.started || this._currentNode < 0) {
      wx.showToast({ title: '请先点击节点开始', icon: 'none' });
      return;
    }
    var adj = this._getAdjacentUnusedEdges(this._currentNode);
    if (adj.length === 0) {
      wx.showToast({ title: '没有可走的边了', icon: 'none' });
      return;
    }
    var level = this._currentLevel;
    var edgeIdx = adj[0];
    var e = level.edges[edgeIdx];
    var target = e[0] === this._currentNode ? e[1] : e[0];
    var pos = this._nodeScreenPos[target];

    var ctx = this._ctx;
    var self = this;
    var count = 0;
    var flashInterval = setInterval(function () {
      count++;
      self.drawGame();
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, oneStroke.getDifficultyConfig(self.data.level).nodeSize + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (count >= 6) {
        clearInterval(flashInterval);
        self.drawGame();
      }
    }, 200);
  },

  onRetry: function () {
    if (this._path.length === 0) return;
    this._path.pop();
    this._usedEdges.pop();
    this._nodePath.pop();
    this._currentNode = this._nodePath.length > 0 ? this._nodePath[this._nodePath.length - 1] : -1;
    if (this._nodePath.length === 0) {
      this.setData({ started: false });
    }
    this.setData({ steps: this._path.length, stuck: false, completed: false });
    this.drawGame();
    if (this._currentNode >= 0) {
      this._checkStuck();
    }
  },

  onRestartLevel: function () {
    this.loadLevel();
  },

  onNextLevel: function () {
    var nextIdx = this.data.currentLevelIndex + 1;
    var levels = oneStroke.getLevels(this.data.level);
    if (nextIdx >= levels.length) {
      this.setData({ showComplete: true });
      return;
    }
    this.setData({ currentLevelIndex: nextIdx });
    this.loadLevel();
  },

  onRestartAll: function () {
    this.setData({ currentLevelIndex: 0, showComplete: false });
    this.loadLevel();
  },

  onCloseComplete: function () {
    this.setData({ showComplete: false });
  },

  onShareAppMessage: function () {
    return {
      title: '一笔画 - 数学逻辑益智',
      path: '/pages/tools/onestroke/index'
    };
  }
});
