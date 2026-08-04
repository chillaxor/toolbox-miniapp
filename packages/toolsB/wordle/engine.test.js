// 离线断言：直接 node 运行。重点验证重复字判定与不变式。
const E = require('./engine.js');
const { ANSWERS } = require('./words.js');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error('FAIL:', msg);
  }
}

// 1) 完全相等 → 全绿
ok(
  E.evaluateGuess('形形色色', '形形色色').every((x) => x.state === 'green'),
  'all green when guess === answer'
);

// 2) 全错位且含重复字：猜"色色形形" 答"形形色色" → 应全黄（无绿）
const r1 = E.evaluateGuess('色色形形', '形形色色');
ok(r1.every((x) => x.state === 'yellow'), 'swapped dup → all yellow, no green');

// 3) 部分绿 + 重复字："形色形色" vs "形形色色" → 绿,黄,黄,绿
const r2 = E.evaluateGuess('形色形色', '形形色色');
ok(
  r2[0].state === 'green' &&
    r2[3].state === 'green' &&
    r2[1].state === 'yellow' &&
    r2[2].state === 'yellow',
  'partial green/yellow with dup'
);

// 4) 答案中完全没有某字 → 全灰
const r3 = E.evaluateGuess('过过过过', '高高兴兴');
ok(r3.every((x) => x.state === 'gray'), 'absent char → all gray');

// 5) 频率上限：答案"色色形形"(色×2)，猜"形色色色"(色×3，其中1个命中变绿) → 黄只能有 2 个
const r4 = E.evaluateGuess('形色色色', '色色形形');
const yellowCount = r4.filter((x) => x.state === 'yellow').length;
ok(yellowCount === 2, 'yellow count capped by freq (expect 2), got ' + yellowCount);

// 6) isValidWord
ok(E.isValidWord('你好世界') === true, 'valid hanzi');
ok(E.isValidWord('abc1') === false, 'reject non-hanzi');
ok(E.isValidWord('') === false, 'reject empty');

// 7) pickWord 确定性 + 在池内
ok(
  E.pickWord('d12', ANSWERS) === E.pickWord('d12', ANSWERS),
  'pickWord deterministic for same seed'
);
ok(ANSWERS.indexOf(E.pickWord('d12', ANSWERS)) >= 0, 'pickWord returns from pool');

// 8) dayIndex 合理
ok(E.dayIndexFromDate(new Date(2025, 0, 1)) === 0, 'dayIndex base = 0');
ok(E.dayIndexFromDate(new Date(2025, 0, 2)) === 1, 'dayIndex +1 day = 1');

// 9) buildShare 含 emoji
const share = E.buildShare([{ states: ['green', 'yellow', 'gray', 'green'] }], 'won', 12);
ok(share.indexOf('🟩') >= 0 && share.indexOf('🟨') >= 0 && share.indexOf('⬛') >= 0, 'share has emojis');

// 10) 不变式：ANSWERS × ANSWERS 全组合长度合法、状态合法
let total = 0;
for (const a of ANSWERS) {
  for (const g of ANSWERS) {
    const r = E.evaluateGuess(g, a);
    total++;
    if (r.length !== a.length) ok(false, 'len invariant: ' + g + ' vs ' + a);
    if (!r.every((x) => ['green', 'yellow', 'gray'].indexOf(x.state) >= 0))
      ok(false, 'state valid: ' + g + ' vs ' + a);
  }
}

// 11) 绿格总数不可能超过 answer 中各字出现次数（重复字不超标）单点抽查若干
for (const a of ANSWERS) {
  const countOf = {};
  for (const ch of a) countOf[ch] = (countOf[ch] || 0) + 1;
  for (const g of ANSWERS) {
    const r = E.evaluateGuess(g, a);
    for (const ch of new Set(g)) {
      const greenYellow = r.filter((x) => x.char === ch && (x.state === 'green' || x.state === 'yellow')).length;
      if (greenYellow > (countOf[ch] || 0)) ok(false, 'over-mark: ' + ch + ' in ' + g + ' vs ' + a);
    }
  }
}

console.log('\n汉兜引擎测试：通过 ' + pass + ' 条，失败 ' + fail + ' 条；组合不变式 ' + total + ' 组');
if (fail > 0) process.exit(1);
