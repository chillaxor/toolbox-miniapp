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

// ---- 1. 闰年布尔式 ----
ok(E.isLeapYear(2000) === true, '2000 应闰年(÷400)');
ok(E.isLeapYear(1900) === false, '1900 应平年(整百不÷400)');
ok(E.isLeapYear(2100) === false, '2100 应平年(整百不÷400)');
ok(E.isLeapYear(2024) === true, '2024 应闰年(÷4)');
ok(E.isLeapYear(2023) === false, '2023 应平年');
ok(E.isLeapYear(2020) === true, '2020 应闰年');

// ---- 2. 大月/小月/2月天数 ----
var BIG = E.BIG_MONTHS, SMALL = E.SMALL_MONTHS;
BIG.forEach(function (m) { ok(E.daysInMonth(2023, m) === 31, m + '月应为31天'); });
SMALL.forEach(function (m) { ok(E.daysInMonth(2023, m) === 30, m + '月应为30天'); });
ok(E.daysInMonth(2023, 2) === 28, '2023年2月应28天(平年)');
ok(E.daysInMonth(2024, 2) === 29, '2024年2月应29天(闰年)');

// ---- 3. 全年天数与逐月求和 ----
var Y0 = 1800, Y1 = 2200;
for (var y = Y0; y <= Y1; y++) {
  var sum = 0;
  for (var m = 1; m <= 12; m++) sum += E.daysInMonth(y, m);
  ok(sum === E.daysInYear(y), y + ' 各月求和应等于全年天数 ' + E.daysInYear(y) + '，实际' + sum);
  ok(E.daysInYear(y) === (E.isLeapYear(y) ? 366 : 365), y + ' 全年天数错误');
}

// ---- 4. 星期：与 JS Date 独立对照（1800-2200 抽样） ----
function dateWeekday(y, m, d) {
  // 用原生 Date 作 oracle（公历范围，足够）
  return new Date(y, m - 1, d).getDay();
}
var wchecks = 0;
for (var y2 = 1900; y2 <= 2100; y2++) {
  for (var m2 = 1; m2 <= 12; m2++) {
    // 每月抽 1 号、15 号、末号
    var ds = [1, 15, E.daysInMonth(y2, m2)];
    for (var k = 0; k < ds.length; k++) {
      var w = E.weekdayOf(y2, m2, ds[k]);
      var wref = dateWeekday(y2, m2, ds[k]);
      ok(w === wref, y2 + '-' + m2 + '-' + ds[k] + ' 星期应为 ' + wref + '，engine 得 ' + w);
      wchecks++;
    }
  }
}
ok(E.weekdayOf(2000, 1, 1) === 6, '2000-01-01 应为周六(6)');

// ---- 5. leapYearSteps 结论与 isLeapYear 一致 ----
for (var y3 = 1900; y3 <= 2100; y3 += 7) {
  var st = E.leapYearSteps(y3);
  ok(st.isLeap === E.isLeapYear(y3), y3 + ' 步骤结论应与 isLeapYear 一致');
  ok(st.febDays === (st.isLeap ? 29 : 28), y3 + ' 2月天数应随闰年');
  ok(st.steps.length === 2, y3 + ' 应有两个判断步骤');
}

// ---- 6. 月历网格结构 ----
var fixedToday = new Date(2026, 6, 31); // 2026-07-31
for (var y4 = 1999; y4 <= 2030; y4++) {
  for (var m4 = 1; m4 <= 12; m4++) {
    var cal = E.buildMonthCalendar(y4, m4, fixedToday);
    ok(cal.cells.length === 42, y4 + '-' + m4 + ' 网格应为 42 格');
    var inCount = 0, seen = {};
    for (var c = 0; c < cal.cells.length; c++) {
      var cell = cal.cells[c];
      if (cell.inMonth) {
        inCount++;
        ok(!seen[cell.day], y4 + '-' + m4 + ' 日 ' + cell.day + ' 重复');
        seen[cell.day] = 1;
        ok(cell.day >= 1 && cell.day <= cal.totalDays, y4 + '-' + m4 + ' 日越界 ' + cell.day);
      }
    }
    ok(inCount === cal.totalDays, y4 + '-' + m4 + ' 当月格数应等于天数');
    // 首个当月格位置 == 当月1号星期
    var firstIdx = -1;
    for (var c2 = 0; c2 < cal.cells.length; c2++) { if (cal.cells[c2].inMonth) { firstIdx = c2; break; } }
    ok(firstIdx === cal.firstWeekday, y4 + '-' + m4 + ' 首个当月格索引应等于首星期');
  }
}

console.log('\n抽样星期对照点：' + wchecks + ' 个');
console.log('总断言：' + checks + '，失败：' + fails);
if (fails > 0) { console.error('❌ 校验未通过'); process.exit(1); }
console.log('✅ 全部通过');
