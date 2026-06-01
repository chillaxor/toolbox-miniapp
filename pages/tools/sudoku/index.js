var storage = require('../../../utils/storage.js');
var sudokuUtil = require('../../../utils/sudoku.js');

Page({
  data: {
    isFavorite: false,
    size: 9,
    mode: 'standard',
    board: [],
    puzzle: [],
    solution: [],
    selectedCell: null,
    conflicts: [],
    completed: 0,
    showComplete: false
  },

  onLoad: function () {
    this.checkFavorite();
    var completed = wx.getStorageSync('toolbox_sudoku_completed') || 0;
    this.setData({ completed: completed });
    this.newGame();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('sudoku') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('sudoku');
    this.setData({ isFavorite: fav });
  },

  onModeChange: function (e) {
    var mode = e.currentTarget.dataset.mode;
    var size = mode === 'easy' ? 4 : 9;
    this.setData({ mode: mode, size: size });
    this.newGame();
  },

  newGame: function () {
    var size = this.data.size;
    var difficulty = this.data.mode === 'easy' ? 'easy' : 'medium';
    var result = sudokuUtil.generatePuzzle(size, difficulty);

    // 构建显示用的棋盘数据
    var board = [];
    for (var r = 0; r < size; r++) {
      board[r] = [];
      for (var c = 0; c < size; c++) {
        board[r][c] = {
          value: result.puzzle[r][c],
          isGiven: result.puzzle[r][c] !== 0,
          isError: false
        };
      }
    }

    this.setData({
      board: board,
      puzzle: result.puzzle,
      solution: result.solution,
      selectedCell: null,
      conflicts: [],
      showComplete: false
    });
  },

  onCellTap: function (e) {
    var r = e.currentTarget.dataset.row;
    var c = e.currentTarget.dataset.col;
    if (this.data.board[r][c].isGiven) return;
    this.setData({ selectedCell: { row: r, col: c } });
  },

  onNumInput: function (e) {
    var num = Number(e.currentTarget.dataset.num);
    var cell = this.data.selectedCell;
    if (!cell) return;

    var board = this.data.board.slice();
    board[cell.row] = board[cell.row].slice();
    board[cell.row][cell.col] = {
      value: num,
      isGiven: false,
      isError: false
    };

    // 检查冲突
    var flatBoard = [];
    for (var r = 0; r < this.data.size; r++) {
      flatBoard[r] = [];
      for (var c = 0; c < this.data.size; c++) {
        flatBoard[r][c] = board[r][c].value;
      }
    }
    var conflicts = sudokuUtil.getConflicts(flatBoard, this.data.size);

    // 标记冲突
    for (var i = 0; i < conflicts.length; i++) {
      var cr = conflicts[i][0];
      var cc = conflicts[i][1];
      if (!board[cr][cc].isGiven) {
        board[cr][cc] = { value: board[cr][cc].value, isGiven: false, isError: true };
      }
    }

    this.setData({ board: board, conflicts: conflicts });

    // 检查是否完成
    if (sudokuUtil.isComplete(flatBoard, this.data.size)) {
      var completed = this.data.completed + 1;
      this.setData({ completed: completed, showComplete: true });
      wx.setStorageSync('toolbox_sudoku_completed', completed);
      storage.addHistory({
        toolId: 'sudoku',
        toolName: '逻辑推理',
        category: 'fun',
        summary: '完成' + this.data.size + '×' + this.data.size + '数独',
        timestamp: Date.now()
      });
    }
  },

  onErase: function () {
    var cell = this.data.selectedCell;
    if (!cell) return;
    var board = this.data.board.slice();
    board[cell.row] = board[cell.row].slice();
    board[cell.row][cell.col] = { value: 0, isGiven: false, isError: false };
    this.setData({ board: board });
  },

  onHint: function () {
    var cell = this.data.selectedCell;
    if (!cell) {
      // 随机找一个空格子
      for (var r = 0; r < this.data.size; r++) {
        for (var c = 0; c < this.data.size; c++) {
          if (this.data.board[r][c].value === 0) {
            cell = { row: r, col: c };
            break;
          }
        }
        if (cell) break;
      }
    }
    if (!cell) return;

    var board = this.data.board.slice();
    board[cell.row] = board[cell.row].slice();
    board[cell.row][cell.col] = {
      value: this.data.solution[cell.row][cell.col],
      isGiven: true,
      isError: false
    };
    this.setData({ board: board, selectedCell: null });
  },

  onCloseComplete: function () {
    this.setData({ showComplete: false });
  },

  onShareAppMessage: function () {
    return {
      title: '逻辑推理 - 数独训练',
      path: '/pages/tools/sudoku/index'
    };
  }
});