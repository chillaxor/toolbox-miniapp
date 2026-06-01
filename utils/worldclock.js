/**
 * 世界时钟工具
 * 内置主要城市时区数据
 */

var CITIES = [
  { id: 'beijing', name: '北京', country: '中国', offset: 8, emoji: '🇨🇳' },
  { id: 'shanghai', name: '上海', country: '中国', offset: 8, emoji: '🇨🇳' },
  { id: 'hongkong', name: '香港', country: '中国', offset: 8, emoji: '🇭🇰' },
  { id: 'taipei', name: '台北', country: '中国', offset: 8, emoji: '🇹🇼' },
  { id: 'tokyo', name: '东京', country: '日本', offset: 9, emoji: '🇯🇵' },
  { id: 'seoul', name: '首尔', country: '韩国', offset: 9, emoji: '🇰🇷' },
  { id: 'singapore', name: '新加坡', country: '新加坡', offset: 8, emoji: '🇸🇬' },
  { id: 'bangkok', name: '曼谷', country: '泰国', offset: 7, emoji: '🇹🇭' },
  { id: 'dubai', name: '迪拜', country: '阿联酋', offset: 4, emoji: '🇦🇪' },
  { id: 'mumbai', name: '孟买', country: '印度', offset: 5.5, emoji: '🇮🇳' },
  { id: 'moscow', name: '莫斯科', country: '俄罗斯', offset: 3, emoji: '🇷🇺' },
  { id: 'london', name: '伦敦', country: '英国', offset: 1, emoji: '🇬🇧' },
  { id: 'paris', name: '巴黎', country: '法国', offset: 1, emoji: '🇫🇷' },
  { id: 'berlin', name: '柏林', country: '德国', offset: 1, emoji: '🇩🇪' },
  { id: 'rome', name: '罗马', country: '意大利', offset: 1, emoji: '🇮🇹' },
  { id: 'madrid', name: '马德里', country: '西班牙', offset: 1, emoji: '🇪🇸' },
  { id: 'newyork', name: '纽约', country: '美国', offset: -4, emoji: '🇺🇸' },
  { id: 'chicago', name: '芝加哥', country: '美国', offset: -5, emoji: '🇺🇸' },
  { id: 'losangeles', name: '洛杉矶', country: '美国', offset: -7, emoji: '🇺🇸' },
  { id: 'vancouver', name: '温哥华', country: '加拿大', offset: -7, emoji: '🇨🇦' },
  { id: 'sydney', name: '悉尼', country: '澳大利亚', offset: 10, emoji: '🇦🇺' },
  { id: 'auckland', name: '奥克兰', country: '新西兰', offset: 12, emoji: '🇳🇿' },
  { id: 'saopaulo', name: '圣保罗', country: '巴西', offset: -3, emoji: '🇧🇷' },
  { id: 'cairo', name: '开罗', country: '埃及', offset: 2, emoji: '🇪🇬' }
];

// 默认关注的城市
var DEFAULT_WATCHED = ['beijing', 'tokyo', 'london', 'newyork', 'sydney'];

/**
 * 获取所有城市列表
 */
function getAllCities() {
  return CITIES.slice();
}

/**
 * 获取城市当前时间
 * @param {string} cityId - 城市ID
 * @returns {Object} { time, date, weekday, isDaytime }
 */
function getCityTime(cityId) {
  var city = null;
  for (var i = 0; i < CITIES.length; i++) {
    if (CITIES[i].id === cityId) {
      city = CITIES[i];
      break;
    }
  }
  if (!city) return null;

  var now = new Date();
  var utc = now.getTime() + now.getTimezoneOffset() * 60000;
  var cityTime = new Date(utc + city.offset * 3600000);

  var hours = cityTime.getHours();
  var minutes = cityTime.getMinutes();
  var seconds = cityTime.getSeconds();

  var weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return {
    id: city.id,
    name: city.name,
    country: city.country,
    emoji: city.emoji,
    offset: city.offset,
    time: padZero(hours) + ':' + padZero(minutes) + ':' + padZero(seconds),
    timeShort: padZero(hours) + ':' + padZero(minutes),
    hours: hours,
    minutes: minutes,
    date: cityTime.getFullYear() + '-' + padZero(cityTime.getMonth() + 1) + '-' + padZero(cityTime.getDate()),
    weekday: '周' + weekdays[cityTime.getDay()],
    isDaytime: hours >= 6 && hours < 18,
    offsetLabel: formatOffset(city.offset)
  };
}

/**
 * 获取关注城市的时间列表
 * @param {Array} watched - 关注的城市ID列表
 * @returns {Array}
 */
function getWatchedTimes(watched) {
  if (!watched || watched.length === 0) {
    watched = DEFAULT_WATCHED;
  }
  var result = [];
  for (var i = 0; i < watched.length; i++) {
    var t = getCityTime(watched[i]);
    if (t) result.push(t);
  }
  return result;
}

/**
 * 搜索城市
 * @param {string} keyword - 搜索关键词
 * @returns {Array}
 */
function searchCity(keyword) {
  if (!keyword) return CITIES.slice();
  keyword = keyword.toLowerCase();
  var result = [];
  for (var i = 0; i < CITIES.length; i++) {
    var c = CITIES[i];
    if (c.name.toLowerCase().indexOf(keyword) >= 0 || c.country.toLowerCase().indexOf(keyword) >= 0 || c.id.indexOf(keyword) >= 0) {
      result.push(c);
    }
  }
  return result;
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatOffset(offset) {
  var sign = offset >= 0 ? '+' : '';
  var hours = Math.floor(Math.abs(offset));
  var mins = Math.round((Math.abs(offset) - hours) * 60);
  if (mins === 0) {
    return 'UTC' + sign + (offset < 0 ? '-' : '') + hours;
  }
  return 'UTC' + sign + (offset < 0 ? '-' : '') + hours + ':' + padZero(mins);
}

module.exports = {
  getAllCities: getAllCities,
  getCityTime: getCityTime,
  getWatchedTimes: getWatchedTimes,
  searchCity: searchCity,
  DEFAULT_WATCHED: DEFAULT_WATCHED
};
