/**
 * 华容道/数字滑块拼图 - 核心算法
 * 从已解状态随机移动N步保证可解
 */

/**
 * 生成已解状态（1,2,3,...,N-1,0）
 */
function createSolvedState(size) {
  var tiles = [];
  for (var i = 1; i < size * size; i++) {
    tiles.push(i);
  }
  tiles.push(0);
  return tiles;
}

/**
 * 打乱拼图（从已解状态随机移动，保证可解）
 * @param {number} size - 3/4/5
 * @param {number} steps - 随机移动步数
 * @returns {Array} 打乱后的数组
 */
function shufflePuzzle(size, steps) {
  var tiles = createSolvedState(size);
  var emptyIndex = size * size - 1;
  var lastMove = -1;

  for (var i = 0; i < steps; i++) {
    var neighbors = getNeighbors(emptyIndex, size);
    // 排除上一步移动的位置，避免来回移动
    var filtered = [];
    for (var j = 0; j < neighbors.length; j++) {
      if (neighbors[j] !== lastMove) {
        filtered.push(neighbors[j]);
      }
    }
    if (filtered.length === 0) filtered = neighbors;

    var pick = filtered[Math.floor(Math.random() * filtered.length)];
    lastMove = emptyIndex;
    tiles[emptyIndex] = tiles[pick];
    tiles[pick] = 0;
    emptyIndex = pick;
  }

  return tiles;
}

/**
 * 获取相邻位置
 */
function getNeighbors(index, size) {
  var row = Math.floor(index / size);
  var col = index % size;
  var neighbors = [];
  if (row > 0) neighbors.push((row - 1) * size + col);
  if (row < size - 1) neighbors.push((row + 1) * size + col);
  if (col > 0) neighbors.push(row * size + col - 1);
  if (col < size - 1) neighbors.push(row * size + col + 1);
  return neighbors;
}

/**
 * 检查是否已解
 */
function isSolved(tiles) {
  for (var i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

/**
 * 尝试移动（点击某块，如果与空格相邻则交换）
 * @returns {Array|null} 移动后的新数组，或null（不可移动）
 */
function tryMove(tiles, clickIndex, size) {
  var emptyIndex = -1;
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i] === 0) { emptyIndex = i; break; }
  }

  var neighbors = getNeighbors(emptyIndex, size);
  for (var j = 0; j < neighbors.length; j++) {
    if (neighbors[j] === clickIndex) {
      var newTiles = tiles.slice();
      newTiles[emptyIndex] = newTiles[clickIndex];
      newTiles[clickIndex] = 0;
      return newTiles;
    }
  }
  return null;
}

/**
 * 获取推荐步数
 */
function getShuffleSteps(size) {
  if (size === 3) return 50;
  if (size === 4) return 100;
  return 200;
}

module.exports = {
  createSolvedState: createSolvedState,
  shufflePuzzle: shufflePuzzle,
  getNeighbors: getNeighbors,
  isSolved: isSolved,
  tryMove: tryMove,
  getShuffleSteps: getShuffleSteps
};
