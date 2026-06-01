/**
 * 2026年法定节假日和调休数据
 * 包含放假日期和调休上班日期
 */

// 2026年法定节假日
const HOLIDAYS_2026 = {
  // 元旦：1月1日-1月3日
  'new_year': {
    name: '元旦',
    dates: ['2026-01-01', '2026-01-02', '2026-01-03'],
    start: '2026-01-01',
    end: '2026-01-03'
  },
  // 春节：2月15日-2月23日
  'spring_festival': {
    name: '春节',
    dates: ['2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23'],
    start: '2026-02-15',
    end: '2026-02-23'
  },
  // 清明节：4月4日-4月6日
  'qingming': {
    name: '清明节',
    dates: ['2026-04-04', '2026-04-05', '2026-04-06'],
    start: '2026-04-04',
    end: '2026-04-06'
  },
  // 劳动节：5月1日-5月5日
  'labor_day': {
    name: '劳动节',
    dates: ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'],
    start: '2026-05-01',
    end: '2026-05-05'
  },
  // 端午节：6月19日-6月21日
  'dragon_boat': {
    name: '端午节',
    dates: ['2026-06-19', '2026-06-20', '2026-06-21'],
    start: '2026-06-19',
    end: '2026-06-21'
  },
  // 中秋节：9月25日-9月27日
  'mid_autumn': {
    name: '中秋节',
    dates: ['2026-09-25', '2026-09-26', '2026-09-27'],
    start: '2026-09-25',
    end: '2026-09-27'
  },
  // 国庆节：10月1日-10月7日
  'national_day': {
    name: '国庆节',
    dates: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'],
    start: '2026-10-01',
    end: '2026-10-07'
  }
};

// 2026年调休上班日期（周末需要上班）
const MAKEUP_WORKDAYS_2026 = [
  '2026-01-04', // 元旦后周日上班
  '2026-02-14', // 春节前周六上班
  '2026-02-28', // 春节后周六上班
  '2026-05-09', // 劳动节后周六上班
  '2026-09-20', // 国庆节前周日上班
  '2026-10-10'  // 国庆节后周六上班
];

/**
 * 判断某日是否为法定节假日
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {Object|null} 节假日信息，非节假日返回null
 */
function isHoliday(dateStr) {
  var keys = Object.keys(HOLIDAYS_2026);
  for (var i = 0; i < keys.length; i++) {
    var holiday = HOLIDAYS_2026[keys[i]];
    if (holiday.dates.indexOf(dateStr) !== -1) {
      return holiday;
    }
  }
  return null;
}

/**
 * 判断某日是否为调休上班日
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {boolean}
 */
function isMakeupWorkday(dateStr) {
  return MAKEUP_WORKDAYS_2026.indexOf(dateStr) !== -1;
}

/**
 * 获取所有节假日日期集合
 * @returns {Array<string>} 节假日日期数组
 */
function getAllHolidayDates() {
  var dates = [];
  var keys = Object.keys(HOLIDAYS_2026);
  for (var i = 0; i < keys.length; i++) {
    var holiday = HOLIDAYS_2026[keys[i]];
    dates = dates.concat(holiday.dates);
  }
  return dates;
}

/**
 * 获取所有调休上班日期
 * @returns {Array<string>}
 */
function getAllMakeupWorkdays() {
  return MAKEUP_WORKDAYS_2026.slice();
}

/**
 * 获取2026年节假日列表
 * @returns {Object}
 */
function getHolidays2026() {
  return HOLIDAYS_2026;
}

module.exports = {
  HOLIDAYS_2026: HOLIDAYS_2026,
  MAKEUP_WORKDAYS_2026: MAKEUP_WORKDAYS_2026,
  isHoliday: isHoliday,
  isMakeupWorkday: isMakeupWorkday,
  getAllHolidayDates: getAllHolidayDates,
  getAllMakeupWorkdays: getAllMakeupWorkdays,
  getHolidays2026: getHolidays2026
};
