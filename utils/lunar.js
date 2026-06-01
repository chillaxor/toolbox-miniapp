/**
 * 农历计算核心
 * 基于标准查表法实现公历↔农历互转
 *
 * 数据范围：1900-2100
 * 基准日期：1900年1月31日 = 农历庚子年正月初一
 */

var lunarTable = require('../data/lunar-table.js');

// 公历每月天数
var SOLAR_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 判断公历是否闰年
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 获取公历某月天数
 */
function getSolarMonthDays(year, month) {
  if (month === 2 && isLeapYear(year)) return 29;
  return SOLAR_MONTH_DAYS[month - 1];
}

/**
 * 获取公历某年总天数
 */
function getSolarYearDays(year) {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * 公历转农历
 * @param {number} year - 公历年
 * @param {number} month - 公历月(1-12)
 * @param {number} day - 公历日
 * @returns {Object} { lunarYear, lunarMonth, lunarDay, lunarMonthName, lunarDayName, zodiac, ganZhi, isLeap }
 */
function solarToLunar(year, month, day) {
  // 参数校验
  if (year < 1900 || year > 2100) {
    return { lunarYear: 0, lunarMonth: 0, lunarDay: 0, lunarMonthName: '', lunarDayName: '', zodiac: '', ganZhi: '', isLeap: false };
  }

  // 计算距离基准日期(1900年1月31日)的天数
  // 使用 UTC 避免本地时区导致的时间戳精度问题
  var baseTime = Date.UTC(1900, 0, 31);
  var targetTime = Date.UTC(year, month - 1, day);
  var offset = Math.round((targetTime - baseTime) / 86400000);

  if (offset < 0) {
    return { lunarYear: 0, lunarMonth: 0, lunarDay: 0, lunarMonthName: '', lunarDayName: '', zodiac: '', ganZhi: '', isLeap: false };
  }

  // 确定农历年
  var lunarYear = 1900;
  var yearDays = 0;
  for (var y = 1900; y < 2101; y++) {
    yearDays = lunarTable.getYearDays(y);
    if (offset < yearDays) {
      lunarYear = y;
      break;
    }
    offset -= yearDays;
  }

  if (lunarYear > 2100) {
    return { lunarYear: lunarYear, lunarMonth: 1, lunarDay: 1, lunarMonthName: '正月', lunarDayName: '初一', zodiac: '', ganZhi: '', isLeap: false };
  }

  // 确定农历月和日
  var leapMonth = lunarTable.getLeapMonth(lunarYear);
  var lunarMonth = 1;
  var isLeap = false;
  var monthFound = false;
  var monthDays = 0;

  for (var i = 1; i <= 12; i++) {
    // 先算正常月
    monthDays = lunarTable.getMonthDays(lunarYear, i);
    if (offset < monthDays) {
      lunarMonth = i;
      isLeap = false;
      monthFound = true;
      break;
    }
    offset -= monthDays;

    // 如果当月后有闰月，再算闰月
    if (i === leapMonth) {
      monthDays = lunarTable.getLeapMonthDays(lunarYear);
      if (offset < monthDays) {
        lunarMonth = i;
        isLeap = true;
        monthFound = true;
        break;
      }
      offset -= monthDays;
    }
  }

  if (!monthFound) {
    lunarMonth = 12;
    isLeap = false;
    offset = 0;
  }

  var lunarDay = offset + 1;

  // 天干地支年（以农历年计算）
  var ganIndex = (lunarYear - 4) % 10;
  var zhiIndex = (lunarYear - 4) % 12;
  var ganZhi = lunarTable.Gan[ganIndex] + lunarTable.Zhi[zhiIndex] + '年';

  // 生肖
  var zodiac = lunarTable.Animals[zhiIndex];

  // 月名
  var monthName = (isLeap ? '闰' : '') + lunarTable.lunarMonthName[lunarMonth - 1] + '月';

  // 日名
  var dayName = lunarTable.lunarDayName[lunarDay - 1];

  return {
    lunarYear: lunarYear,
    lunarMonth: lunarMonth,
    lunarDay: lunarDay,
    lunarMonthName: monthName,
    lunarDayName: dayName,
    zodiac: zodiac,
    ganZhi: ganZhi,
    isLeap: isLeap
  };
}

/**
 * 农历转公历
 * @param {number} lunarYear - 农历年
 * @param {number} lunarMonth - 农历月(1-12)
 * @param {number} lunarDay - 农历日
 * @param {boolean} isLeap - 是否闰月
 * @returns {Object} { year, month, day }
 */
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap) {
  isLeap = isLeap || false;

  // 参数校验
  if (lunarYear < 1900 || lunarYear > 2100) {
    return { year: 0, month: 0, day: 0 };
  }

  // 第一步：累加从1900年到目标农历年之前所有年份的天数
  var offset = 0;
  for (var y = 1900; y < lunarYear; y++) {
    offset += lunarTable.getYearDays(y);
  }

  // 第二步：累加目标农历年内，目标月之前所有月份的天数
  var leapMonth = lunarTable.getLeapMonth(lunarYear);

  for (var i = 1; i < lunarMonth; i++) {
    offset += lunarTable.getMonthDays(lunarYear, i);
    // 如果该月后面有闰月，也要加上
    if (i === leapMonth) {
      offset += lunarTable.getLeapMonthDays(lunarYear);
    }
  }

  // 如果目标月是闰月，先加上正常月的天数
  if (isLeap && lunarMonth === leapMonth) {
    offset += lunarTable.getMonthDays(lunarYear, lunarMonth);
  }

  // 第三步：加上当月已过的天数
  offset += lunarDay - 1;

  // 基准日期：1900年1月31日 = 农历1900年正月初一
  // 使用 UTC 避免时区精度问题
  var baseTime = Date.UTC(1900, 0, 31);
  var targetTime = baseTime + offset * 86400000;
  var targetDate = new Date(targetTime);

  return {
    year: targetDate.getUTCFullYear(),
    month: targetDate.getUTCMonth() + 1,
    day: targetDate.getUTCDate()
  };
}

/**
 * 计算公历两个日期之间的天数差
 */
function daysBetweenSolar(y1, m1, d1, y2, m2, d2) {
  var t1 = Date.UTC(y1, m1 - 1, d1);
  var t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}

module.exports = {
  isLeapYear: isLeapYear,
  getSolarMonthDays: getSolarMonthDays,
  getSolarYearDays: getSolarYearDays,
  daysBetweenSolar: daysBetweenSolar,
  solarToLunar: solarToLunar,
  lunarToSolar: lunarToSolar
};
