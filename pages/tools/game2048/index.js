var storage = require('../../../utils/storage.js');

var GRID_SIZE = 4;

Page({
  data: {
    grid: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    won: false,
    keepPlaying: false,
    moved: false,
    startX: 0,
    startY: 0
  },

  _previousGrid: null,
  _previousScore: 0,

  onLoad: function () {
    var best = wx.getStorageSync('game2048_best') || 0;
    this.setData({ bestScore: best });
    this.newGame();
  },

  newGame: function () {
    var grid = this._emptyGrid();
    this._addRandomTile(grid);
    this._addRandomTile(grid);
    this.setData({
      grid: grid,
      score: 0,
      gameOver: false,
      won: false,
      keepPlaying: false,
      moved: false
    });
    this._previousGrid = null;
    this._previousScore = 0;
  },

  _emptyGrid: function () {
    var grid = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      grid[i] = [];
      for (var j = 0; j < GRID_SIZE; j++) {
        grid[i][j] = 0;
      }
    }
    return grid;
  },

  _addRandomTile: function (grid) {
    var empty = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      for (var j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) {
          empty.push({ r: i, c: j });
        }
      }
    }
    if (empty.length === 0) return;
    var pos = empty[Math.floor(Math.random() * empty.length)];
    grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
  },

  _cloneGrid: function (grid) {
    var g = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      g[i] = grid[i].slice();
    }
    return g;
  },

  _move: function (direction) {
    if (this.data.gameOver) return;

    var grid = this._cloneGrid(this.data.grid);
    var score = this.data.score;
    var moved = false;
    var won = false;

    // rotate grid so we always slide left
    var rotated = grid;
    for (var r = 0; r < direction; r++) {
      rotated = this._rotateLeft(rotated);
    }

    // slide left
    for (var i = 0; i < GRID_SIZE; i++) {
      var row = rotated[i].filter(function (v) { return v !== 0; });
      // merge
      for (var j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          score += row[j];
          if (row[j] === 2048 && !this.data.keepPlaying) {
            won = true;
          }
          row.splice(j + 1, 1);
        }
      }
      // pad
      while (row.length < GRID_SIZE) {
        row.push(0);
      }
      rotated[i] = row;
    }

    // rotate back
    for (var rb = 0; rb < (4 - direction) % 4; rb++) {
      rotated = this._rotateLeft(rotated);
    }

    // check if moved
    for (var ci = 0; ci < GRID_SIZE; ci++) {
      for (var cj = 0; cj < GRID_SIZE; cj++) {
        if (rotated[ci][cj] !== grid[ci][cj]) {
          moved = true;
          break;
        }
      }
      if (moved) break;
    }

    if (!moved) return;

    this._previousGrid = grid;
    this._previousScore = this.data.score;

    this._addRandomTile(rotated);

    // check game over
    var gameOver = !this._canMove(rotated);

    if (score > this.data.bestScore) {
      this.setData({ bestScore: score });
      wx.setStorageSync('game2048_best', score);
    }

    this.setData({
      grid: rotated,
      score: score,
      gameOver: gameOver,
      won: won && !this.data.keepPlaying,
      moved: true
    });

    if (gameOver) {
      storage.addHistory({
        toolId: 'game2048',
        toolName: '2048',
        category: 'fun',
        summary: '得分：' + score,
        timestamp: Date.now()
      });
    }
  },

  _rotateLeft: function (grid) {
    var n = GRID_SIZE;
    var result = [];
    for (var i = 0; i < n; i++) {
      result[i] = [];
      for (var j = 0; j < n; j++) {
        result[i][j] = grid[j][n - 1 - i];
      }
    }
    return result;
  },

  _canMove: function (grid) {
    for (var i = 0; i < GRID_SIZE; i++) {
      for (var j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return true;
        if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return true;
        if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return true;
      }
    }
    return false;
  },

  // Touch handlers
  touchStart: function (e) {
    var touch = e.touches[0];
    this.setData({
      startX: touch.clientX,
      startY: touch.clientY
    });
  },

  touchEnd: function (e) {
    var touch = e.changedTouches[0];
    var dx = touch.clientX - this.data.startX;
    var dy = touch.clientY - this.data.startY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return; // too small

    if (absDx > absDy) {
      // horizontal
      this._move(dx > 0 ? 1 : 3); // right=1, left=3 (after rotate logic)
    } else {
      // vertical
      this._move(dy > 0 ? 2 : 0); // down=2, up=0
    }
  },

  undoMove: function () {
    if (!this._previousGrid) return;
    this.setData({
      grid: this._previousGrid,
      score: this._previousScore,
      gameOver: false
    });
    this._previousGrid = null;
  },

  continuePlaying: function () {
    this.setData({ won: false, keepPlaying: true });
  },

  _getTileColor: function (value) {
    var colors = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    return colors[value] || '#3c3a32';
  },

  onShareAppMessage: function () {
    return {
      title: '2048 - 我得了' + this.data.score + '分！来挑战吧',
      path: '/pages/tools/game2048/index'
    };
  }
});
