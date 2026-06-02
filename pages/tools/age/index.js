var storage = require('../../../utils/storage.js');

var ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
var CONSTELLATION = [
  { name: '摩羯座', m: 1, d: 19 }, { name: '水瓶座', m: 2, d: 18 }, { name: '双鱼座', m: 3, d: 20 },
  { name: '白羊座', m: 4, d: 19 }, { name: '金牛座', m: 5, d: 20 }, { name: '双子座', m: 6, d: 21 },
  { name: '巨蟹座', m: 7, d: 22 }, { name: '狮子座', m: 8, d: 22 }, { name: '处女座', m: 9, d: 22 },
  { name: '天秤座', m: 10, d: 22 }, { name: '天蝎座', m: 11, d: 21 }, { name: '射手座', m: 12, d: 21 }
];
var CONST_NAMES = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];

function getConstellation(month, day) {
  var idx = month - 1;
  if (day > CONSTELLATION[idx].d) idx = (idx + 1) % 12;
  return CONST_NAMES[idx];
}

function padZero(n) { return n < 10 ? '0' + n : '' + n; }

Page({
  data: {
    isFavorite: false,
    birthDate: '',
    showResult: false,
    ageYears: 0,
    ageMonths: 0,
    ageDays: 0,
    totalDays: 0,
    zodiac: '',
    constellation: '',
    nextBirthday: ''
  },
  onLoad: function () {
    this.checkFavorite();
    var saved = wx.getStorageSync('age_birth');
    if (saved) {
      this.setData({ birthDate: saved });
      this.calculate();
    }
  },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('age') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('age') }); },
  onDateChange: function (e) {
    this.setData({ birthDate: e.detail.value });
    wx.setStorageSync('age_birth', e.detail.value);
    this.calculate();
  },
  calculate: function () {
    var parts = this.data.birthDate.split('-');
    var birth = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var now = new Date();
    if (birth > now) { wx.showToast({ title: '请选择正确的日期', icon: 'none' }); return; }

    var years = now.getFullYear() - birth.getFullYear();
    var months = now.getMonth() - birth.getMonth();
    var days = now.getDate() - birth.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    var totalDays = Math.floor((now - birth) / 86400000);

    // 生肖
    var zodiac = ZODIAC[(birth.getFullYear() - 1900) % 12];
    // 星座
    var constellation = getConstellation(birth.getMonth() + 1, birth.getDate());

    // 距下一个生日
    var nextB = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextB <= now) nextB.setFullYear(nextB.getFullYear() + 1);
    var daysToNext = Math.ceil((nextB - now) / 86400000);

    this.setData({
      showResult: true,
      ageYears: years, ageMonths: months, ageDays: days,
      totalDays: totalDays,
      zodiac: zodiac,
      constellation: constellation,
      nextBirthday: daysToNext + '天'
    });

    storage.addHistory({
      toolId: 'age', toolName: '年龄生肖', category: 'life',
      summary: years + '岁 · ' + zodiac + ' · ' + constellation,
      timestamp: Date.now()
    });
  },
  onShareAppMessage: function () { return { title: '年龄生肖计算器 - 工具箱', path: '/pages/tools/age/index' }; }
});
