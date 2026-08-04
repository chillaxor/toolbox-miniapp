// 汉兜猜词 · 纯函数引擎（页面与 node 测试共用）
// 核心：evaluateGuess 两遍扫描处理重复字；pickWord 按日期确定性选词；buildShare 生成 emoji 战绩。

// 评判：返回 [{char, state}]，state ∈ 'green' | 'yellow' | 'gray'
// 算法：第①遍标绿并锁位；统计 answer 未标绿字频；第②遍对未锁位查 freq 标黄并递减，否则标灰。
function evaluateGuess(guess, answer) {
  const n = answer.length;
  if (guess.length !== n) {
    // 长度不符时按最短处理，避免越界
    const m = Math.min(guess.length, n);
    const out = [];
    for (let i = 0; i < m; i++) {
      out.push({ char: guess[i], state: guess[i] === answer[i] ? 'green' : 'gray' });
    }
    return out;
  }
  const res = new Array(n);
  const greens = new Array(n).fill(false);
  const freq = {};
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      res[i] = { char: guess[i], state: 'green' };
      greens[i] = true;
    } else {
      freq[answer[i]] = (freq[answer[i]] || 0) + 1;
      res[i] = null;
    }
  }
  for (let i = 0; i < n; i++) {
    if (greens[i]) continue;
    const g = guess[i];
    if (freq[g] > 0) {
      res[i] = { char: g, state: 'yellow' };
      freq[g]--;
    } else {
      res[i] = { char: g, state: 'gray' };
    }
  }
  return res;
}

// 仅校验为汉字（长度由页面按 WORD_LEN 控制）
function isValidWord(w) {
  return /^[一-龥]+$/.test(w);
}

// FNV-1a 字符串哈希，用于按种子确定性选词
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 确定性选词：同 seed 必同词
function pickWord(seed, answers) {
  if (!answers || !answers.length) return '';
  return answers[hashStr(String(seed)) % answers.length];
}

// 距离基准日(2025-01-01)的天数，作为每日一题序号（用本地年月日，避免时区偏移）
function dayIndexFromDate(date) {
  const d = date ? new Date(date.getTime()) : new Date();
  const base = new Date(2025, 0, 1);
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.floor((a - b) / 86400000);
}

function buildShare(board, status, dayIndex) {
  const map = { green: '🟩', yellow: '🟨', gray: '⬛' };
  const lines = board.map((row) => row.states.map((s) => map[s]).join(''));
  const head = status === 'won' ? '汉兜 ' + dayIndex + ' ' + board.length + '/6' : '汉兜 ' + dayIndex + ' X/6';
  return [head, ...lines].join('\n');
}

function isWin(board) {
  if (!board.length) return false;
  const last = board[board.length - 1];
  return last.states.every((s) => s === 'green');
}

module.exports = {
  evaluateGuess,
  isValidWord,
  hashStr,
  pickWord,
  dayIndexFromDate,
  buildShare,
  isWin
};
