/**
 * 迷宫生成与寻路 - 核心算法
 * 递归回溯法（DFS）生成
 */

/**
 * 迷宫单元格结构：
 * { top: true, right: true, bottom: true, left: true, visited: false }
 * true = 有墙, false = 无墙
 */

/**
 * 生成迷宫
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @returns {Array<Array<Object>>} 迷宫网格
 */
function generateMaze(rows, cols) {
  // 初始化网格，所有墙都存在
  var grid = [];
  for (var r = 0; r < rows; r++) {
    grid[r] = [];
    for (var c = 0; c < cols; c++) {
      grid[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
    }
  }

  // DFS 递归回溯
  var stack = [];
  var current = { r: 0, c: 0 };
  grid[0][0].visited = true;
  stack.push(current);

  while (stack.length > 0) {
    var r = current.r;
    var c = current.c;
    var neighbors = getUnvisitedNeighbors(r, c, grid, rows, cols);

    if (neighbors.length > 0) {
      var next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(grid, r, c, next.r, next.c);
      grid[next.r][next.c].visited = true;
      stack.push(current);
      current = next;
    } else {
      current = stack.pop();
    }
  }

  return grid;
}

function getUnvisitedNeighbors(r, c, grid, rows, cols) {
  var neighbors = [];
  if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c: c });
  if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c: c });
  if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r: r, c: c - 1 });
  if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push({ r: r, c: c + 1 });
  return neighbors;
}

function removeWall(grid, r1, c1, r2, c2) {
  if (r2 === r1 - 1) { grid[r1][c1].top = false; grid[r2][c2].bottom = false; }
  if (r2 === r1 + 1) { grid[r1][c1].bottom = false; grid[r2][c2].top = false; }
  if (c2 === c1 - 1) { grid[r1][c1].left = false; grid[r2][c2].right = false; }
  if (c2 === c1 + 1) { grid[r1][c1].right = false; grid[r2][c2].left = false; }
}

/**
 * 检查是否可以从(r,c)向某方向移动
 */
function canMove(grid, r, c, direction) {
  var cell = grid[r][c];
  if (direction === 'up') return !cell.top;
  if (direction === 'down') return !cell.bottom;
  if (direction === 'left') return !cell.left;
  if (direction === 'right') return !cell.right;
  return false;
}

/**
 * 获取难度参数
 */
function getDifficultyConfig(level) {
  if (level === 'small') return { rows: 8, cols: 8, label: '简单 8×8' };
  if (level === 'medium') return { rows: 12, cols: 12, label: '中等 12×12' };
  return { rows: 16, cols: 16, label: '困难 16×16' };
}

module.exports = {
  generateMaze: generateMaze,
  canMove: canMove,
  getDifficultyConfig: getDifficultyConfig
};
