var COLS = 15;
var ROWS = 15;
var CELL_SIZE = 0; // will be set based on screen width
var WIN_COUNT = 5;

Page({
  data: {
    currentPlayer: 'black',
    gameOver: false,
    winner: '',
    history: [],
    blackScore: 0,
    whiteScore: 0,
    boardSize: 0
  },

  board: [],
  ctx: null,
  cellSize: 0,
  padding: 0,

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync();
    var screenWidth = sysInfo.windowWidth;
    var boardSize = Math.floor(screenWidth * 0.94);
    CELL_SIZE = Math.floor(boardSize / (COLS + 1));
    boardSize = CELL_SIZE * (COLS + 1);
    var padding = CELL_SIZE;

    this.cellSize = CELL_SIZE;
    this.padding = padding;
    this.setData({ boardSize: boardSize });
    this.initBoard();
  },

  onReady: function () {
    this.ctx = wx.createCanvasContext('boardCanvas', this);
    this.drawBoard();
  },

  initBoard: function () {
    this.board = [];
    for (var r = 0; r < ROWS; r++) {
      this.board[r] = [];
      for (var c = 0; c < COLS; c++) {
        this.board[r][c] = '';
      }
    }
    this.setData({
      currentPlayer: 'black',
      gameOver: false,
      winner: '',
      history: []
    });
  },

  drawBoard: function () {
    var ctx = this.ctx;
    var cs = this.cellSize;
    var pad = this.padding;
    var boardSize = this.data.boardSize;

    // Background
    ctx.setFillStyle('#DEB887');
    ctx.fillRect(0, 0, boardSize, boardSize);

    // Grid lines
    ctx.setStrokeStyle('#8B7355');
    ctx.setLineWidth(1);
    for (var r = 0; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(pad, pad + r * cs);
      ctx.lineTo(pad + (COLS - 1) * cs, pad + r * cs);
      ctx.stroke();
    }
    for (var c = 0; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(pad + c * cs, pad);
      ctx.lineTo(pad + c * cs, pad + (ROWS - 1) * cs);
      ctx.stroke();
    }

    // Star points (天元和星位)
    var starPoints = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
    ctx.setFillStyle('#8B7355');
    for (var i = 0; i < starPoints.length; i++) {
      var sp = starPoints[i];
      ctx.beginPath();
      ctx.arc(pad + sp[1] * cs, pad + sp[0] * cs, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw placed pieces
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (this.board[r][c]) {
          this.drawPiece(ctx, c, r, this.board[r][c]);
        }
      }
    }

    // Draw last move marker
    if (this.data.history.length > 0) {
      var last = this.data.history[this.data.history.length - 1];
      var cx = pad + last.col * cs;
      var cy = pad + last.row * cs;
      ctx.setStrokeStyle('#FF0000');
      ctx.setLineWidth(2);
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.15, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.draw();
  },

  drawPiece: function (ctx, col, row, color) {
    var cs = this.cellSize;
    var pad = this.padding;
    var cx = pad + col * cs;
    var cy = pad + row * cs;
    var radius = cs * 0.4;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);

    if (color === 'black') {
      var gradient = ctx.createCircularGradient(cx, cy, radius);
      gradient.addColorStop(0, '#555');
      gradient.addColorStop(1, '#000');
      ctx.setFillStyle(gradient);
    } else {
      var gradient = ctx.createCircularGradient(cx - radius * 0.3, cy - radius * 0.3, radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#ccc');
      ctx.setFillStyle(gradient);
    }
    ctx.fill();

    // Border for white pieces
    if (color === 'white') {
      ctx.setStrokeStyle('#999');
      ctx.setLineWidth(1);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  },

  onBoardTap: function (e) {
    if (this.data.gameOver) return;

    var x = e.detail.x;
    var y = e.detail.y;
    var cs = this.cellSize;
    var pad = this.padding;

    var col = Math.round((x - pad) / cs);
    var row = Math.round((y - pad) / cs);

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    if (this.board[row][col]) return;

    // Place piece
    this.board[row][col] = this.data.currentPlayer;
    var newHistory = this.data.history.concat([{ row: row, col: col, player: this.data.currentPlayer }]);
    this.setData({ history: newHistory });

    // Check win
    if (this.checkWin(row, col, this.data.currentPlayer)) {
      var bs = this.data.blackScore;
      var ws = this.data.whiteScore;
      if (this.data.currentPlayer === 'black') {
        bs++;
      } else {
        ws++;
      }
      this.setData({
        gameOver: true,
        winner: this.data.currentPlayer,
        blackScore: bs,
        whiteScore: ws
      });
      this.drawBoard();
      wx.showToast({ title: (this.data.currentPlayer === 'black' ? '黑棋' : '白棋') + '获胜！', icon: 'none' });
      return;
    }

    // Check draw
    if (newHistory.length === ROWS * COLS) {
      this.setData({ gameOver: true, winner: '' });
      this.drawBoard();
      wx.showToast({ title: '平局！', icon: 'none' });
      return;
    }

    // Switch player
    this.setData({
      currentPlayer: this.data.currentPlayer === 'black' ? 'white' : 'black'
    });
    this.drawBoard();
  },

  checkWin: function (row, col, player) {
    var directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal
      [1, -1]   // anti-diagonal
    ];

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var count = 1;

      // Forward
      for (var i = 1; i < WIN_COUNT; i++) {
        var nr = row + dr * i;
        var nc = col + dc * i;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.board[nr][nc] === player) {
          count++;
        } else {
          break;
        }
      }

      // Backward
      for (var i = 1; i < WIN_COUNT; i++) {
        var nr = row - dr * i;
        var nc = col - dc * i;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.board[nr][nc] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= WIN_COUNT) return true;
    }
    return false;
  },

  onUndo: function () {
    if (this.data.history.length === 0 || this.data.gameOver) return;

    var newHistory = this.data.history.slice();
    var last = newHistory.pop();
    this.board[last.row][last.col] = '';

    this.setData({
      history: newHistory,
      currentPlayer: last.player
    });
    this.drawBoard();
  },

  onRestart: function () {
    this.initBoard();
    this.drawBoard();
  }
});
