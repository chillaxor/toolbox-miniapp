/**
 * 万年历月视图网格计算
 */

var lunarUtil = require('./lunar.js');
var holidaysData = require('../data/holidays-2026.js');

/**
 * 获取某月的日历网格数据 (6行7列)
 * @param {number} year - 公历年
 * @param {number} month - 公历月(1-12)
 * @returns {Array<Array<Object>>} 6x7 的 DayCell 二维数组
 */
function getCalendarGrid(year, month) {
  var firstDay = new Date(year, month - 1, 1);
  var startWeekDay = firstDay.getDay(); // 0=周日
  var totalDays = lunarUtil.getSolarMonthDays(year, month);
  var prevMonthDays = month === 1 ? lunarUtil.getSolarMonthDays(year - 1, 12) : lunarUtil.getSolarMonthDays(year, month - 1);
  var today = new Date();
  var todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  var grid = [];
  var dayCount = 1;
  var nextMonthDay = 1;

  for (var row = 0; row < 6; row++) {
    var rowArr = [];
    for (var col = 0; col < 7; col++) {
      var cellIndex = row * 7 + col;
      var dayCell = {};

      if (cellIndex < startWeekDay) {
        // 上月日期
        var prevDay = prevMonthDays - startWeekDay + cellIndex + 1;
        var prevMonth = month === 1 ? 12 : month - 1;
        var prevYear = month === 1 ? year - 1 : year;
        dayCell = createDayCell(prevYear, prevMonth, prevDay, false, todayStr, col);
      } else if (dayCount <= totalDays) {
        // 本月日期
        dayCell = createDayCell(year, month, dayCount, true, todayStr, col);
        dayCount++;
      } else {
        // 下月日期
        var nextMonth = month === 12 ? 1 : month + 1;
        var nextYear = month === 12 ? year + 1 : year;
        dayCell = createDayCell(nextYear, nextMonth, nextMonthDay, false, todayStr, col);
        nextMonthDay++;
      }

      rowArr.push(dayCell);
    }
    grid.push(rowArr);
  }

  return grid;
}

/**
 * 创建单个日期格子数据
 */
function createDayCell(year, month, day, isCurrentMonth, todayStr, weekDay) {
  var dateStr = formatDate(year, month, day);
  var isToday = dateStr === todayStr;
  var isWeekend = weekDay === 0 || weekDay === 6;

  // 农历信息
  var lunarInfo = lunarUtil.solarToLunar(year, month, day);
  var lunarDay = lunarInfo.lunarDayName || '';

  // 节假日信息
  var holiday = holidaysData.isHoliday(dateStr);
  var holidayName = holiday ? holiday.name : '';
  var isMakeup = holidaysData.isMakeupWorkday(dateStr);

  // 节气/节日简化处理
  var displayText = lunarDay;
  if (holidayName) {
    displayText = holidayName;
  } else if (lunarDay === '初一') {
    displayText = lunarInfo.lunarMonthName;
  }

  return {
    year: year,
    month: month,
    date: day,
    dateStr: dateStr,
    isCurrentMonth: isCurrentMonth,
    isToday: isToday,
    isWeekend: isWeekend,
    lunarDay: lunarDay,
    lunarMonth: lunarInfo.lunarMonthName || '',
    displayText: displayText,
    holiday: holidayName,
    isMakeup: isMakeup,
    zodiac: lunarInfo.zodiac || '',
    ganZhi: lunarInfo.ganZhi || '',
    isLeap: lunarInfo.isLeap || false
  };
}

/**
 * 格式化日期字符串
 */
function formatDate(year, month, day) {
  var m = month < 10 ? '0' + month : '' + month;
  var d = day < 10 ? '0' + day : '' + day;
  return year + '-' + m + '-' + d;
}

module.exports = {
  getCalendarGrid: getCalendarGrid,
  formatDate: formatDate
};
