/**
 * 工作日计算逻辑
 * 排除周末和法定节假日，考虑调休上班日
 */

var holidaysData = require('../data/holidays-2026.js');

/**
 * 判断某日是否为工作日
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {Object} { isWorkday, reason }
 */
function isWorkday(dateStr) {
  var date = new Date(dateStr);
  var dayOfWeek = date.getDay();

  // 调休上班日（周末上班）
  if (holidaysData.isMakeupWorkday(dateStr)) {
    return { isWorkday: true, reason: '调休上班' };
  }

  // 法定节假日
  var holiday = holidaysData.isHoliday(dateStr);
  if (holiday) {
    return { isWorkday: false, reason: holiday.name + '假期' };
  }

  // 普通周末
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isWorkday: false, reason: '周末' };
  }

  // 普通工作日
  return { isWorkday: true, reason: '工作日' };
}

/**
 * 计算两个日期之间的工作日天数
 * @param {string} startDate - 开始日期 YYYY-MM-DD
 * @param {string} endDate - 结束日期 YYYY-MM-DD
 * @returns {Object} { workdays, weekends, holidays, makeupDays, totalDays }
 */
function calculateWorkdays(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);

  if (start > end) {
    var temp = start;
    start = end;
    end = temp;
  }

  var workdays = 0;
  var weekends = 0;
  var holidays = 0;
  var makeupDays = 0;
  var totalDays = 0;

  var current = new Date(start);
  while (current <= end) {
    totalDays++;
    var dateStr = formatDateStr(current.getFullYear(), current.getMonth() + 1, current.getDate());
    var dayOfWeek = current.getDay();

    var isHoliday = holidaysData.isHoliday(dateStr);
    var isMakeup = holidaysData.isMakeupWorkday(dateStr);

    if (isMakeup) {
      // 调休上班日
      workdays++;
      makeupDays++;
    } else if (isHoliday) {
      // 法定节假日
      holidays++;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 普通周末
      weekends++;
    } else {
      // 普通工作日
      workdays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    workdays: workdays,
    weekends: weekends,
    holidays: holidays,
    makeupDays: makeupDays,
    totalDays: totalDays
  };
}

/**
 * 格式化日期字符串
 */
function formatDateStr(year, month, day) {
  var m = month < 10 ? '0' + month : '' + month;
  var d = day < 10 ? '0' + day : '' + day;
  return year + '-' + m + '-' + d;
}

module.exports = {
  isWorkday: isWorkday,
  calculateWorkdays: calculateWorkdays
};
