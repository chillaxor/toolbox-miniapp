/**
 * 24点数学训练 - 核心算法
 * 穷举4个数字的所有排列 × 3个运算符组合 × 5种括号模式
 */

var CALC_OPS = ['+', '-', '*', '/'];
var DISPLAY_OPS = ['+', '-', '×', '÷'];

/**
 * 生成4个1-13的随机数字（保证有解）
 */
function generateNumbers() {
  var maxAttempts = 100;
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var nums = [];
    for (var i = 0; i < 4; i++) {
      nums.push(Math.floor(Math.random() * 13) + 1);
    }
    if (solve24(nums)) {
      return nums;
    }
  }
  // 兜底：返回经典有解组合
  return [1, 2, 3, 4];
}

/**
 * 计算 a op b
 */
function calc(a, op, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') {
    if (Math.abs(b) < 1e-9) return null;
    return a / b;
  }
  return null;
}

/**
 * 求解24点，返回表达式字符串或null
 * 穷举5种括号模式
 */
function solve24(nums) {
  if (!nums || nums.length !== 4) return null;
  var a = nums[0], b = nums[1], c = nums[2], d = nums[3];

  // 枚举所有排列（24种）
  var allPerms = getPermutations([a, b, c, d]);

  for (var pi = 0; pi < allPerms.length; pi++) {
    var p = allPerms[pi];
    var w = p[0], x = p[1], y = p[2], z = p[3];

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        for (var k = 0; k < 4; k++) {
          // 5种括号模式
          var results = [
            calc(calc(calc(w, CALC_OPS[i], x), CALC_OPS[j], y), CALC_OPS[k], z),
            calc(calc(w, CALC_OPS[i], calc(x, CALC_OPS[j], y)), CALC_OPS[k], z),
            calc(calc(w, CALC_OPS[i], x), CALC_OPS[j], calc(y, CALC_OPS[k], z)),
            calc(w, CALC_OPS[i], calc(calc(x, CALC_OPS[j], y), CALC_OPS[k], z)),
            calc(w, CALC_OPS[i], calc(x, CALC_OPS[j], calc(y, CALC_OPS[k], z)))
          ];

          var expressions = [
            '((' + w + ' ' + DISPLAY_OPS[i] + ' ' + x + ') ' + DISPLAY_OPS[j] + ' ' + y + ') ' + DISPLAY_OPS[k] + ' ' + z,
            '(' + w + ' ' + DISPLAY_OPS[i] + ' (' + x + ' ' + DISPLAY_OPS[j] + ' ' + y + ')) ' + DISPLAY_OPS[k] + ' ' + z,
            '(' + w + ' ' + DISPLAY_OPS[i] + ' ' + x + ') ' + DISPLAY_OPS[j] + ' (' + y + ' ' + DISPLAY_OPS[k] + ' ' + z + ')',
            w + ' ' + DISPLAY_OPS[i] + ' ((' + x + ' ' + DISPLAY_OPS[j] + ' ' + y + ') ' + DISPLAY_OPS[k] + ' ' + z + ')',
            w + ' ' + DISPLAY_OPS[i] + ' (' + x + ' ' + DISPLAY_OPS[j] + ' (' + y + ' ' + DISPLAY_OPS[k] + ' ' + z + '))'
          ];

          for (var ri = 0; ri < 5; ri++) {
            if (results[ri] !== null && Math.abs(results[ri] - 24) < 1e-9) {
              return expressions[ri];
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * 获取数组的所有排列
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var rest = arr.slice(0, i).concat(arr.slice(i + 1));
    var subPerms = getPermutations(rest);
    for (var j = 0; j < subPerms.length; j++) {
      result.push([arr[i]].concat(subPerms[j]));
    }
  }
  return result;
}

/**
 * 将显示数字转为牌面（1→A, 11→J, 12→Q, 13→K）
 */
function toCardFace(num) {
  if (num === 1) return 'A';
  if (num === 11) return 'J';
  if (num === 12) return 'Q';
  if (num === 13) return 'K';
  return String(num);
}

module.exports = {
  generateNumbers: generateNumbers,
  solve24: solve24,
  calc: calc,
  toCardFace: toCardFace
};
