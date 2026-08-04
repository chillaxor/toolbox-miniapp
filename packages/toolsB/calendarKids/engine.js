/**
 * 年月日 / 日历（儿童版） - 计算引擎（纯函数模块）
 * 页面与离线校验脚本共用同一份代码，保证「验证的就是上线的」。
 * 无任何小程序/WX 依赖，可在 node 下直接 require。
 */

var BIG_MONTHS = [1, 3, 5, 7, 8, 10, 12];
var SMALL_MONTHS = [4, 6, 9, 11];

// 拳头记忆法：凸起=大月，凹下=小月，2月特殊
var KNUCKLE = {
  1: 'up', 3: 'up', 5: 'up', 7: 'up', 8: 'up', 10: 'up', 12: 'up',
  4: 'down', 6: 'down', 9: 'down', 11: 'down',
  2: 'special'
};

// 儿童向公历节日（避免农历，保持纯公历、可精确计算）
var FESTIVALS = {
  '1-1': '元旦',
  '3-8': '妇女节',
  '3-12': '植树节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '9-1': '开学日',
  '9-10': '教师节',
  '10-1': '国庆节',
  '12-25': '圣诞节'
};

var WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// ============ 核心判断 ============
function isLeapYear(year) {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

function monthType(month) {
  if (month === 2) return 'feb';
  if (BIG_MONTHS.indexOf(month) !== -1) return 'big';
  return 'small';
}

function daysInMonth(year, month) {
  var t = monthType(month);
  if (t === 'big') return 31;
  if (t === 'small') return 30;
  return isLeapYear(year) ? 29 : 28;
}

function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

// 蔡勒公式（格里高利历）：返回 0=周日 .. 6=周六
function weekdayOf(year, month, day) {
  var m = month, y = year;
  if (m < 3) { m += 12; y -= 1; }
  var K = y % 100;
  var J = Math.floor(y / 100);
  var h = (day + Math.floor((13 * (m + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) - 2 * J) % 7;
  if (h < 0) h += 7;
  // h: 0=周六,1=周日,... 转换到 0=周日
  return (h + 6) % 7;
}

function weekdayName(w) {
  return WEEKDAY_NAMES[((w % 7) + 7) % 7];
}

function seasonOf(month) {
  if (month >= 1 && month <= 3) return '春';
  if (month >= 4 && month <= 6) return '夏';
  if (month >= 7 && month <= 9) return '秋';
  return '冬';
}

function festivalOf(month, day) {
  return FESTIVALS[month + '-' + day] || '';
}

// ============ 展示用聚合 ============
// 12 个月卡片数据（Feb 显示 28/29 为特殊）
function buildMonths() {
  var out = [];
  for (var m = 1; m <= 12; m++) {
    var t = monthType(m);
    out.push({
      month: m,
      name: m + '月',
      type: t,
      daysLabel: t === 'feb' ? '28/29' : (daysInMonth(2000, m) + ''),
      season: seasonOf(m),
      knuckle: KNUCKLE[m],
      cls: t === 'big' ? 'm-big' : (t === 'small' ? 'm-small' : 'm-feb')
    });
  }
  return out;
}

function knuckles() {
  var out = [];
  for (var m = 1; m <= 12; m++) {
    out.push({ month: m, knuckle: KNUCKLE[m], cls: monthType(m) === 'big' ? 'm-big' : (monthType(m) === 'small' ? 'm-small' : 'm-feb') });
  }
  return out;
}

// 月历网格：返回 42 格（6×7），含上/下月补位（inMonth=false）
function buildMonthCalendar(year, month, today) {
  var first = weekdayOf(year, month, 1);
  var total = daysInMonth(year, month);
  var t = today || new Date();
  var tY = t.getFullYear(), tM = t.getMonth() + 1, tD = t.getDate();

  var cells = [];
  // 上月补位
  var prevMonth = month - 1; var prevYear = year;
  if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }
  var prevTotal = daysInMonth(prevYear, prevMonth);
  for (var i = 0; i < first; i++) {
    var pd = prevTotal - first + 1 + i;
    cells.push(makeCell(prevYear, prevMonth, pd, false, tY, tM, tD));
  }
  // 当月
  for (var d = 1; d <= total; d++) {
    cells.push(makeCell(year, month, d, true, tY, tM, tD));
  }
  // 下月补位到 42
  var nextMonth = month + 1; var nextYear = year;
  if (nextMonth === 13) { nextMonth = 1; nextYear = year + 1; }
  var nd = 1;
  while (cells.length < 42) {
    cells.push(makeCell(nextYear, nextMonth, nd, false, tY, tM, tD));
    nd++;
  }
  return { year: year, month: month, firstWeekday: first, totalDays: total, cells: cells };
}

function makeCell(y, m, d, inMonth, tY, tM, tD) {
  var w = weekdayOf(y, m, d);
  var fes = festivalOf(m, d);
  return {
    id: y + '-' + m + '-' + d,
    year: y, month: m, day: d, weekday: w, weekdayName: WEEKDAY_NAMES[w],
    inMonth: inMonth,
    isToday: inMonth && (y === tY && m === tM && d === tD),
    isFestival: !!fes,
    festivalName: fes
  };
}

// ============ 闰年判断步骤（驱动动画） ============
function leapYearSteps(year) {
  var isCentury = (year % 100 === 0);
  var div100ok = (year % 100 === 0);
  var div400ok = (year % 400 === 0);
  var div4ok = (year % 4 === 0);
  var isLeap = isLeapYear(year);

  var steps = [];
  steps.push({
    key: 'century',
    label: '先看是不是整百年',
    detail: year + ' ÷ 100 ' + (div100ok ? '能整除 → 是整百年' : '不能整除 → 不是整百年'),
    result: div100ok ? '整百年' : '非整百年',
    active: true
  });
  if (isCentury) {
    steps.push({
      key: 'div400',
      label: '整百年要看能不能被 400 整除',
      detail: year + ' ÷ 400 ' + (div400ok ? '能整除' : '不能整除'),
      result: div400ok ? '能整除 → 闰年' : '不能整除 → 平年',
      active: true
    });
  } else {
    steps.push({
      key: 'div4',
      label: '再看能不能被 4 整除',
      detail: year + ' ÷ 4 ' + (div4ok ? '能整除' : '不能整除'),
      result: div4ok ? '能整除 → 闰年' : '不能整除 → 平年',
      active: true
    });
  }
  return {
    year: year,
    isCentury: isCentury,
    isLeap: isLeap,
    febDays: isLeap ? 29 : 28,
    steps: steps
  };
}

// ============ 练习出题（确定性数学，随机仅选题） ============
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 月份 → 天数（Feb 需给定年份，答案才唯一）
function genQuizMonthDays() {
  var month = randInt(1, 12);
  var year = randInt(2000, 2100);
  return {
    mode: 'monthToDays',
    year: year,
    month: month,
    question: year + '年' + month + '月有几个天？',
    answer: daysInMonth(year, month),
    isFeb: month === 2,
    options: [28, 29, 30, 31].map(function (v) {
      return { value: v, selected: false, correct: false, wrong: false };
    })
  };
}

// 天数 → 哪些月份
function genQuizDaysToMonths() {
  var use31 = Math.random() < 0.5;
  var days = use31 ? 31 : 30;
  var months = use31 ? BIG_MONTHS.slice() : SMALL_MONTHS.slice();
  return {
    mode: 'daysToMonths',
    days: days,
    question: '哪些月份有 ' + days + ' 天？（点一点，多选）',
    answerMonths: months.slice(),
    chips: (function () {
      var arr = [];
      for (var m = 1; m <= 12; m++) arr.push({ month: m, selected: false, isAnswer: months.indexOf(m) !== -1, wrong: false, correct: false });
      return arr;
    })()
  };
}

module.exports = {
  BIG_MONTHS: BIG_MONTHS,
  SMALL_MONTHS: SMALL_MONTHS,
  FESTIVALS: FESTIVALS,
  isLeapYear: isLeapYear,
  monthType: monthType,
  daysInMonth: daysInMonth,
  daysInYear: daysInYear,
  weekdayOf: weekdayOf,
  weekdayName: weekdayName,
  seasonOf: seasonOf,
  festivalOf: festivalOf,
  buildMonths: buildMonths,
  knuckles: knuckles,
  buildMonthCalendar: buildMonthCalendar,
  leapYearSteps: leapYearSteps,
  genQuizMonthDays: genQuizMonthDays,
  genQuizDaysToMonths: genQuizDaysToMonths
};
