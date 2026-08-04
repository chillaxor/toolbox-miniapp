/**
 * 离线校验脚本（node 直接运行）：断言 engine 不变量。
 * 验证通过即说明「上线逻辑」正确；可反复跑，改 engine 后回归。
 * 运行：node engine.test.js
 */
var E = require('./engine.js');

var fails = 0;
var checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) { fails++; console.error('  ✗ ' + msg); }
}

// ---- 1. 表盘数字坐标（12点在上、3点在右、6点在下、9点在左） ----
var nums = E.clockNumbers();
ok(nums.length === 12, '应有 12 个数字');
function numAt(n) { for (var i = 0; i < nums.length; i++) if (nums[i].n === n) return nums[i]; return null; }
ok(Math.abs(numAt(12).x - 50) < 0.5 && Math.abs(numAt(12).y - 9) < 0.5, '12点应在正上方(50,9)');
ok(Math.abs(numAt(3).x - 91) < 0.5 && Math.abs(numAt(3).y - 50) < 0.5, '3点应在正右方(91,50)');
ok(Math.abs(numAt(6).x - 50) < 0.5 && Math.abs(numAt(6).y - 91) < 0.5, '6点应在正下方(50,91)');
ok(Math.abs(numAt(9).x - 9) < 0.5 && Math.abs(numAt(9).y - 50) < 0.5, '9点应在正左方(9,50)');

// ---- 2. 指针角度 ----
ok(E.hourAngle(3, 0) === 90, '3:00 时针应 90°');
ok(E.hourAngle(12, 0) === 0, '12:00 时针应 0°');
ok(E.hourAngle(6, 0) === 180, '6:00 时针应 180°');
ok(E.hourAngle(3, 30) === 105, '3:30 时针应 105°(走半格)');
ok(E.hourAngle(0, 0) === 0, '0:00 时针应 0°');
ok(E.minuteAngle(0) === 0, '0分 分针应 0°');
ok(E.minuteAngle(15) === 90, '15分 分针应 90°');
ok(E.minuteAngle(30) === 180, '30分 分针应 180°');
ok(E.minuteAngle(45) === 270, '45分 分针应 270°');

// ---- 3. 12 小时制读数 ----
ok(E.h12(0) === 12, '0 点记作 12');
ok(E.h12(12) === 12, '12 点记作 12');
ok(E.h12(15) === 3, '15 点记作 3');

// ---- 4. 时间文字 ----
ok(E.timeText(3, 0) === '3时', '3:00→3时');
ok(E.timeText(3, 30) === '3时半', '3:30→3时半');
ok(E.timeText(3, 15) === '3时15分', '3:15→3时15分');
ok(E.timeText(12, 0) === '12时', '12:00→12时');
ok(E.timeText(0, 0) === '12时', '0:00→12时');
ok(E.timeMode(0) === 'oclock', '0分=整时');
ok(E.timeMode(30) === 'half', '30分=半时');
ok(E.timeMode(15) === 'minutes', '15分=几分');

// ---- 5. 出题不变量（大量随机） ----
var i, j;
for (i = 0; i < 5000; i++) {
  var eq = E.genQuiz('easy');
  ok(eq.minute === 0 || eq.minute === 30, 'easy 题分钟只能是 0 或 30，实际 ' + eq.minute);
  ok(E.timeMode(eq.minute) !== 'minutes', 'easy 题不应出现「几分」类型');
  ok(eq.hourAngle === E.hourAngle(eq.hour, eq.minute), 'easy 题时针角度应自洽');
  ok(eq.minuteAngle % 6 === 0, '分针角度必为 6 的倍数');

  var hq = E.genQuiz('hard');
  ok(E.MINUTES_SET.indexOf(hq.minute) !== -1, 'hard 题分钟应落在 5 分钟刻度');
  ok(E.timeText(hq.hour, hq.minute) === hq.text, 'hard 题文字应与时间一致');
  // 角度与公式一致
  ok(Math.abs(hq.minuteAngle - hq.minute * 6) < 1e-9, 'hard 题分针角度公式一致');
  ok(Math.abs(hq.hourAngle - ((hq.hour % 12) + hq.minute / 60) * 30) < 1e-9, 'hard 题时针角度公式一致');
}

// ---- 6. 脚手架讲解步骤 ----
var oc = E.explainTime(3, 0);
ok(oc.length === 3 && oc[oc.length - 1].key === 'ans', '整时讲解应 3 步且末步为答案');
var hf = E.explainTime(8, 30);
ok(hf.length === 3 && hf[1].detail.indexOf('8 和 9') !== -1, '半时讲解应点出「8 和 9 之间」');
var mm = E.explainTime(3, 15);
ok(mm.length === 4, '几分讲解应 4 步');
ok(mm[1].detail.indexOf('× 5 = 15') !== -1, '15分讲解应体现「3 × 5 = 15」');
// explainTime 对任意 5 分钟刻度都应给出有效步骤
for (i = 0; i < 200; i++) {
  var q = E.genQuiz('hard');
  var st = E.explainTime(q.hour, q.minute);
  ok(st.length >= 3, '讲解步骤应不少于 3');
  ok(st[st.length - 1].detail === q.text, '讲解末步文字应等于答案文字');
}

// ---- 7. 校验答案 ----
function ck(h, m, qh, qm, expectCorrect) {
  var quiz = E.buildQuiz(qh, qm, 'easy');
  var r = E.checkAnswer(h, m, quiz);
  ok(r.correct === expectCorrect, '(' + h + ':' + m + ') 对照 (' + qh + ':' + qm + ') 应为 ' + expectCorrect);
  ok(r.steps[0].key === 'min', '校验返回应带讲解步骤');
}
ck(3, 0, 3, 0, true);
ck(3, 30, 3, 30, true);
ck(9, 0, 9, 0, true);
ck(3, 0, 9, 0, false);
ck(3, 30, 3, 0, false);
ck(3, 0, 3, 30, false);
// 12 小时制读数一致：3:00 与 15:00 视作同一答案
ok(E.checkAnswer(3, 0, E.buildQuiz(15, 0, 'easy')).correct === true, '15:00 与 3:00 读数相同');

console.log('\n总断言：' + checks + '，失败：' + fails);
if (fails > 0) { console.error('❌ 校验未通过'); process.exit(1); }
console.log('✅ 全部通过');
