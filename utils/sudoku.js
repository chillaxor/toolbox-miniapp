/**
 * 数独生成与求解 - 核心算法
 * 支持4×4和9×9模式
 */

/**
 * 生成数独谜题
 * @param {number} size - 4 或 9
 * @param {string} difficulty - 'easy'/'medium'/'hard'
 * @returns {Object} { puzzle: 二维数组(0表示空), solution: 二维数组 }
 */
function generatePuzzle(size, difficulty) {
  var solution = generateFullBoard(size);
  var puzzle = copyBoard(solution);

  // 根据难度决定挖空数量
  var removeCount;
  if (size === 4) {
    removeCount = difficulty === 'easy' ? 5 : (difficulty === 'medium' ? 7 : 9);
  } else {
    removeCount = difficulty === 'easy' ? 30 : (difficulty === 'medium' ? 40 : 50);
  }

  // 随机挖空
  var cells = [];
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      cells.push([r, c]);
    }
  }
  shuffle(cells);

  for (var i = 0; i < removeCount && i < cells.length; i++) {
    puzzle[cells[i][0]][cells[i][1]] = 0;
  }

  return { puzzle: puzzle, solution: solution };
}

/**
 * 生成完整的数独棋盘（回溯法）
 */
function generateFullBoard(size) {
  var board = [];
  for (var i = 0; i < size; i++) {
    board.push(new Array(size).fill(0));
  }
  fillBoard(board, size);
  return board;
}

function fillBoard(board, size) {
  var boxSize = size === 4 ? 2 : 3;
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        var nums = [];
        for (var n = 1; n <= size; n++) nums.push(n);
        shuffle(nums);
        for (var k = 0; k < nums.length; k++) {
          if (isValid(board, row, col, nums[k], size, boxSize)) {
            board[row][col] = nums[k];
            if (fillBoard(board, size)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * 检查某位置放某数是否合法
 */
function isValid(board, row, col, num, size, boxSize) {
  // 检查行
  for (var c = 0; c < size; c++) {
    if (board[row][c] === num) return false;
  }
  // 检查列
  for (var r = 0; r < size; r++) {
    if (board[r][col] === num) return false;
  }
  // 检查宫
  var boxRow = Math.floor(row / boxSize) * boxSize;
  var boxCol = Math.floor(col / boxSize) * boxSize;
  for (var r2 = boxRow; r2 < boxRow + boxSize; r2++) {
    for (var c2 = boxCol; c2 < boxCol + boxSize; c2++) {
      if (board[r2][c2] === num) return false;
    }
  }
  return true;
}

/**
 * 检查冲突（返回冲突位置列表）
 */
function getConflicts(board, size) {
  var boxSize = size === 4 ? 2 : 3;
  var conflicts = [];
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      if (board[row][col] === 0) continue;
      var num = board[row][col];
      // 检查行
      for (var c = 0; c < size; c++) {
        if (c !== col && board[row][c] === num) {
          conflicts.push([row, col]);
          break;
        }
      }
      if (conflicts.length > 0 && conflicts[conflicts.length - 1][0] === row && conflicts[conflicts.length - 1][1] === col) continue;
      // 检查列
      for (var r = 0; r < size; r++) {
        if (r !== row && board[r][col] === num) {
          conflicts.push([row, col]);
          break;
        }
      }
      if (conflicts.length > 0 && conflicts[conflicts.length - 1][0] === row && conflicts[conflicts.length - 1][1] === col) continue;
      // 检查宫
      var boxRow = Math.floor(row / boxSize) * boxSize;
      var boxCol = Math.floor(col / boxSize) * boxSize;
      var found = false;
      for (var r3 = boxRow; r3 < boxRow + boxSize && !found; r3++) {
        for (var c3 = boxCol; c3 < boxCol + boxSize && !found; c3++) {
          if (r3 !== row || c3 !== col) {
            if (board[r3][c3] === num) {
              conflicts.push([row, col]);
              found = true;
            }
          }
        }
      }
    }
  }
  return conflicts;
}

/**
 * 检查是否完成
 */
function isComplete(board, size) {
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return getConflicts(board, size).length === 0;
}

function copyBoard(board) {
  var copy = [];
  for (var i = 0; i < board.length; i++) {
    copy.push(board[i].slice());
  }
  return copy;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

module.exports = {
  generatePuzzle: generatePuzzle,
  getConflicts: getConflicts,
  isComplete: isComplete,
  copyBoard: copyBoard
};
