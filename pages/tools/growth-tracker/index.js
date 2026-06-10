var storage = require('../../../utils/storage.js');

// WHO儿童生长标准参考数据（简化版，按年龄月份）
// 数据来源：WHO Child Growth Standards
var GROWTH_STANDARDS = {
  // WHO生长参考标准（0-5岁采用WHO Child Growth Standards，5-18岁采用WHO Growth Reference 5-19y）
  // 男孩身高标准 (cm): {age_months: {p3, p15, p50, p85, p97}}
  boy_height: {
    24: { p3: 82.1, p15: 84.9, p50: 87.1, p85: 89.8, p97: 92.9 },
    36: { p3: 89.0, p15: 92.1, p50: 95.1, p85: 98.4, p97: 101.5 },
    48: { p3: 95.5, p15: 98.9, p50: 102.3, p85: 105.8, p97: 109.1 },
    60: { p3: 101.2, p15: 105.0, p50: 110.0, p85: 114.0, p97: 118.7 },
    72: { p3: 106.4, p15: 110.5, p50: 115.5, p85: 119.8, p97: 124.0 },
    84: { p3: 111.2, p15: 115.5, p50: 121.1, p85: 126.0, p97: 130.5 },
    96: { p3: 115.5, p15: 120.1, p50: 127.0, p85: 132.0, p97: 137.0 },
    108: { p3: 119.4, p15: 124.3, p50: 132.5, p85: 138.0, p97: 143.0 },
    120: { p3: 123.0, p15: 128.4, p50: 137.5, p85: 143.5, p97: 149.5 },
    132: { p3: 126.5, p15: 132.5, p50: 143.0, p85: 150.0, p97: 156.5 },
    144: { p3: 130.0, p15: 136.8, p50: 149.0, p85: 157.0, p97: 164.0 },
    156: { p3: 134.0, p15: 141.5, p50: 155.5, p85: 164.0, p97: 171.0 },
    168: { p3: 139.0, p15: 147.0, p50: 161.5, p85: 170.0, p97: 177.0 },
    180: { p3: 144.0, p15: 152.5, p50: 167.0, p85: 175.0, p97: 181.0 },
    192: { p3: 149.0, p15: 157.5, p50: 171.5, p85: 178.0, p97: 183.5 },
    204: { p3: 153.0, p15: 161.0, p50: 174.5, p85: 180.0, p97: 185.5 },
    216: { p3: 155.5, p15: 163.0, p50: 176.0, p85: 181.0, p97: 187.0 }
  },
  // 女孩身高标准 (cm)
  girl_height: {
    24: { p3: 80.0, p15: 83.0, p50: 86.4, p85: 89.8, p97: 92.9 },
    36: { p3: 87.4, p15: 90.7, p50: 94.1, p85: 97.6, p97: 100.9 },
    48: { p3: 93.8, p15: 97.4, p50: 101.2, p85: 105.0, p97: 108.5 },
    60: { p3: 99.9, p15: 103.8, p50: 108.4, p85: 112.4, p97: 116.4 },
    72: { p3: 105.3, p15: 109.6, p50: 115.0, p85: 119.5, p97: 124.0 },
    84: { p3: 110.2, p15: 115.0, p50: 121.0, p85: 126.5, p97: 131.5 },
    96: { p3: 114.6, p15: 120.0, p50: 127.1, p85: 133.0, p97: 138.5 },
    108: { p3: 118.8, p15: 124.6, p50: 132.8, p85: 139.5, p97: 145.5 },
    120: { p3: 122.8, p15: 129.2, p50: 138.4, p85: 146.0, p97: 152.5 },
    132: { p3: 126.8, p15: 134.0, p50: 144.2, p85: 152.0, p97: 159.0 },
    144: { p3: 131.0, p15: 139.0, p50: 149.8, p85: 157.5, p97: 164.0 },
    156: { p3: 135.5, p15: 143.5, p50: 154.0, p85: 161.5, p97: 167.0 },
    168: { p3: 139.5, p15: 147.0, p50: 157.5, p85: 164.5, p97: 169.5 },
    180: { p3: 142.0, p15: 149.5, p50: 160.0, p85: 166.5, p97: 171.0 },
    192: { p3: 143.5, p15: 151.0, p50: 161.5, p85: 167.5, p97: 172.0 },
    204: { p3: 144.5, p15: 151.5, p50: 162.0, p85: 168.0, p97: 172.5 },
    216: { p3: 145.0, p15: 152.0, p50: 162.5, p85: 168.5, p97: 173.0 }
  },
  // 男孩体重标准 (kg)
  boy_weight: {
    24: { p3: 10.2, p15: 11.0, p50: 12.2, p85: 13.6, p97: 15.0 },
    36: { p3: 12.0, p15: 13.0, p50: 14.3, p85: 16.0, p97: 18.0 },
    48: { p3: 13.5, p15: 14.8, p50: 16.3, p85: 18.5, p97: 21.0 },
    60: { p3: 15.0, p15: 16.5, p50: 18.3, p85: 21.0, p97: 24.0 },
    72: { p3: 16.5, p15: 18.2, p50: 20.5, p85: 23.5, p97: 27.5 },
    84: { p3: 18.0, p15: 20.0, p50: 22.9, p85: 26.8, p97: 31.5 },
    96: { p3: 19.6, p15: 22.0, p50: 25.6, p85: 30.5, p97: 36.5 },
    108: { p3: 21.4, p15: 24.2, p50: 28.5, p85: 34.5, p97: 42.0 },
    120: { p3: 23.5, p15: 26.8, p50: 31.9, p85: 39.5, p97: 48.5 },
    132: { p3: 26.0, p15: 29.8, p50: 35.6, p85: 44.5, p97: 55.0 },
    144: { p3: 29.0, p15: 33.5, p50: 39.9, p85: 50.0, p97: 62.0 },
    156: { p3: 33.0, p15: 38.0, p50: 44.9, p85: 56.0, p97: 69.0 },
    168: { p3: 37.5, p15: 43.0, p50: 50.8, p85: 62.5, p97: 76.0 },
    180: { p3: 42.0, p15: 48.0, p50: 57.1, p85: 69.0, p97: 82.0 },
    192: { p3: 46.0, p15: 52.0, p50: 61.0, p85: 73.0, p97: 86.5 },
    204: { p3: 49.0, p15: 55.0, p50: 64.0, p85: 76.0, p97: 89.5 },
    216: { p3: 51.0, p15: 57.0, p50: 66.5, p85: 78.0, p97: 91.5 }
  },
  // 女孩体重标准 (kg)
  girl_weight: {
    24: { p3: 9.7, p15: 10.6, p50: 11.8, p85: 13.3, p97: 14.8 },
    36: { p3: 11.5, p15: 12.5, p50: 14.0, p85: 16.0, p97: 18.2 },
    48: { p3: 13.0, p15: 14.3, p50: 16.0, p85: 18.5, p97: 21.5 },
    60: { p3: 14.6, p15: 16.1, p50: 18.2, p85: 21.2, p97: 25.0 },
    72: { p3: 16.1, p15: 17.9, p50: 20.2, p85: 24.0, p97: 29.0 },
    84: { p3: 17.7, p15: 19.8, p50: 22.4, p85: 27.0, p97: 33.0 },
    96: { p3: 19.5, p15: 22.0, p50: 25.0, p85: 30.8, p97: 38.0 },
    108: { p3: 21.6, p15: 24.5, p50: 28.2, p85: 35.0, p97: 44.0 },
    120: { p3: 24.0, p15: 27.4, p50: 31.9, p85: 40.0, p97: 50.5 },
    132: { p3: 27.0, p15: 31.0, p50: 36.0, p85: 45.5, p97: 57.5 },
    144: { p3: 30.5, p15: 35.0, p50: 40.3, p85: 50.5, p97: 63.0 },
    156: { p3: 34.5, p15: 39.0, p50: 44.6, p85: 55.0, p97: 67.5 },
    168: { p3: 38.0, p15: 42.5, p50: 48.0, p85: 58.5, p97: 71.0 },
    180: { p3: 40.5, p15: 45.0, p50: 51.0, p85: 61.0, p97: 73.5 },
    192: { p3: 42.5, p15: 47.0, p50: 53.0, p85: 63.0, p97: 75.5 },
    204: { p3: 43.5, p15: 48.0, p50: 54.5, p85: 64.5, p97: 77.0 },
    216: { p3: 44.5, p15: 49.0, p50: 56.0, p85: 65.5, p97: 78.0 }
  }
};

function getAgeMonths(birthday) {
  if (!birthday) return null;
  var birth = new Date(birthday);
  var now = new Date();
  var months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return months > 0 ? months : null;
}

function getClosestStandard(standards, ageMonths) {
  if (!ageMonths || !standards) return null;
  var keys = Object.keys(standards).map(Number).sort(function (a, b) { return a - b; });
  var closest = keys[0];
  for (var i = 0; i < keys.length; i++) {
    if (Math.abs(keys[i] - ageMonths) < Math.abs(closest - ageMonths)) {
      closest = keys[i];
    }
  }
  return standards[closest];
}

function calculateBMI(height, weight) {
  if (!height || !weight || height <= 0 || weight <= 0) return '0.0';
  var h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function getBmiCategory(bmi) {
  var b = parseFloat(bmi);
  if (b < 15) return { text: '偏瘦', color: '#3498DB' };
  if (b < 18.5) return { text: '正常', color: '#27AE60' };
  if (b < 24) return { text: '正常', color: '#27AE60' };
  if (b < 28) return { text: '偏胖', color: '#F39C12' };
  return { text: '肥胖', color: '#E74C3C' };
}

function getTodayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

var STORAGE_KEY = 'growth_tracker_records';
var SETTINGS_KEY = 'growth_tracker_settings';

Page({
  data: {
    date: '',
    height: '',
    weight: '',
    records: [],
    latestRecord: null,
    latestBmiColor: '#27AE60',
    latestBmiCategory: '正常',
    chartTab: 'height',
    genderIndex: 0,
    birthday: '',
    stdHeightRange: '--',
    stdWeightRange: '--',
    stdBmiRange: '18.5-23.9',
    heightStatus: '--',
    heightStatusColor: '#999',
    weightStatus: '--',
    weightStatusColor: '#999',
    isFavorite: false
  },

  onLoad: function () {
    this.setData({ date: getTodayStr() });
    this.loadSettings();
    this.loadRecords();
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('growth-tracker') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('growth-tracker');
    this.setData({ isFavorite: fav });
  },

  loadSettings: function () {
    try {
      var settings = wx.getStorageSync(SETTINGS_KEY);
      if (settings) {
        this.setData({
          genderIndex: settings.genderIndex || 0,
          birthday: settings.birthday || ''
        });
      }
    } catch (e) {}
  },

  saveSettings: function () {
    try {
      wx.setStorageSync(SETTINGS_KEY, {
        genderIndex: this.data.genderIndex,
        birthday: this.data.birthday
      });
    } catch (e) {}
  },

  loadRecords: function () {
    try {
      var records = wx.getStorageSync(STORAGE_KEY) || [];
      // Sort by date descending
      records.sort(function (a, b) { return b.date.localeCompare(a.date); });
      // Calculate height diff
      for (var i = 0; i < records.length; i++) {
        if (i < records.length - 1) {
          var diff = (parseFloat(records[i].height) - parseFloat(records[i + 1].height)).toFixed(1);
          records[i].heightDiff = parseFloat(diff);
        } else {
          records[i].heightDiff = null;
        }
      }
      var latest = records.length > 0 ? records[0] : null;
      var bmiInfo = latest ? getBmiCategory(latest.bmi) : null;
      this.setData({
        records: records,
        latestRecord: latest,
        latestBmiColor: bmiInfo ? bmiInfo.color : '#27AE60',
        latestBmiCategory: bmiInfo ? bmiInfo.text : '正常'
      });
      this.updateStandardRef();
      if (records.length >= 2) {
        this.drawChart();
      }
    } catch (e) {
      console.error('加载记录失败', e);
    }
  },

  saveRecords: function () {
    try {
      wx.setStorageSync(STORAGE_KEY, this.data.records);
    } catch (e) {}
  },

  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },

  onHeightInput: function (e) {
    this.setData({ height: e.detail.value });
  },

  onWeightInput: function (e) {
    this.setData({ weight: e.detail.value });
  },

  onAddRecord: function () {
    var date = this.data.date;
    var height = parseFloat(this.data.height);
    var weight = parseFloat(this.data.weight);

    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (!height || height <= 0 || height > 250) {
      wx.showToast({ title: '请输入有效身高', icon: 'none' });
      return;
    }
    if (!weight || weight <= 0 || weight > 200) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' });
      return;
    }

    var bmi = calculateBMI(height, weight);
    var newRecord = {
      date: date,
      height: height,
      weight: weight,
      bmi: bmi,
      timestamp: Date.now()
    };

    // Check if date already exists, update instead
    var records = this.data.records;
    var found = false;
    for (var i = 0; i < records.length; i++) {
      if (records[i].date === date) {
        records[i] = newRecord;
        found = true;
        break;
      }
    }
    if (!found) {
      records.push(newRecord);
    }

    // Sort by date descending
    records.sort(function (a, b) { return b.date.localeCompare(a.date); });

    // Recalculate height diffs
    for (var j = 0; j < records.length; j++) {
      if (j < records.length - 1) {
        var diff = (parseFloat(records[j].height) - parseFloat(records[j + 1].height)).toFixed(1);
        records[j].heightDiff = parseFloat(diff);
      } else {
        records[j].heightDiff = null;
      }
    }

    var latest = records[0];
    var bmiInfo = getBmiCategory(latest.bmi);

    this.setData({
      records: records,
      latestRecord: latest,
      latestBmiColor: bmiInfo.color,
      latestBmiCategory: bmiInfo.text,
      height: '',
      weight: ''
    });

    this.saveRecords();
    this.updateStandardRef();

    wx.showToast({ title: found ? '已更新记录' : '添加成功', icon: 'success' });

    storage.addHistory({
      toolId: 'growth-tracker',
      toolName: '身高体重记录',
      category: 'life',
      summary: date + ' 身高' + height + 'cm 体重' + weight + 'kg BMI' + bmi,
      timestamp: Date.now()
    });

    if (records.length >= 2) {
      this.drawChart();
    }
  },

  onDeleteRecord: function (e) {
    var index = e.currentTarget.dataset.index;
    var records = this.data.records;
    records.splice(index, 1);

    for (var j = 0; j < records.length; j++) {
      if (j < records.length - 1) {
        var diff = (parseFloat(records[j].height) - parseFloat(records[j + 1].height)).toFixed(1);
        records[j].heightDiff = parseFloat(diff);
      } else {
        records[j].heightDiff = null;
      }
    }

    var latest = records.length > 0 ? records[0] : null;
    var bmiInfo = latest ? getBmiCategory(latest.bmi) : null;

    this.setData({
      records: records,
      latestRecord: latest,
      latestBmiColor: bmiInfo ? bmiInfo.color : '#27AE60',
      latestBmiCategory: bmiInfo ? bmiInfo.text : '正常'
    });

    this.saveRecords();
    this.updateStandardRef();

    if (records.length >= 2) {
      this.drawChart();
    }
  },

  onClearAll: function () {
    var that = this;
    wx.showModal({
      title: '确认清空',
      content: '将删除所有身高体重记录，此操作不可恢复',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            records: [],
            latestRecord: null
          });
          that.saveRecords();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  setGender: function (e) {
    var gender = parseInt(e.currentTarget.dataset.gender);
    this.setData({ genderIndex: gender });
    this.saveSettings();
    this.updateStandardRef();
  },

  onBirthdayChange: function (e) {
    this.setData({ birthday: e.detail.value });
    this.saveSettings();
    this.updateStandardRef();
  },

  updateStandardRef: function () {
    var birthday = this.data.birthday;
    var genderIndex = this.data.genderIndex;
    var latest = this.data.latestRecord;
    if (!birthday || !latest) return;

    var ageMonths = getAgeMonths(birthday);
    if (!ageMonths) return;

    var gender = genderIndex === 0 ? 'boy' : 'girl';
    var stdH = getClosestStandard(GROWTH_STANDARDS[gender + '_height'], ageMonths);
    var stdW = getClosestStandard(GROWTH_STANDARDS[gender + '_weight'], ageMonths);

    if (stdH) {
      this.setData({
        stdHeightRange: stdH.p3 + '-' + stdH.p97 + 'cm'
      });
      var h = parseFloat(latest.height);
      if (h < stdH.p3) {
        this.setData({ heightStatus: '偏矮', heightStatusColor: '#E74C3C' });
      } else if (h > stdH.p97) {
        this.setData({ heightStatus: '偏高', heightStatusColor: '#F39C12' });
      } else if (h < stdH.p15) {
        this.setData({ heightStatus: '中下', heightStatusColor: '#3498DB' });
      } else if (h > stdH.p85) {
        this.setData({ heightStatus: '中上', heightStatusColor: '#3498DB' });
      } else {
        this.setData({ heightStatus: '正常', heightStatusColor: '#27AE60' });
      }
    }

    if (stdW) {
      this.setData({
        stdWeightRange: stdW.p3 + '-' + stdW.p97 + 'kg'
      });
      var w = parseFloat(latest.weight);
      if (w < stdW.p3) {
        this.setData({ weightStatus: '偏轻', weightStatusColor: '#E74C3C' });
      } else if (w > stdW.p97) {
        this.setData({ weightStatus: '偏重', weightStatusColor: '#F39C12' });
      } else if (w < stdW.p15) {
        this.setData({ weightStatus: '中下', weightStatusColor: '#3498DB' });
      } else if (w > stdW.p85) {
        this.setData({ weightStatus: '中上', weightStatusColor: '#3498DB' });
      } else {
        this.setData({ weightStatus: '正常', weightStatusColor: '#27AE60' });
      }
    }
  },

  switchChartTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ chartTab: tab });
    this.drawChart();
  },

  drawChart: function () {
    var records = this.data.records.slice().reverse(); // chronological order
    if (records.length < 2) return;

    var tab = this.data.chartTab;
    var ctx = wx.createCanvasContext('growthChart', this);
    var canvasWidth = 300;
    var canvasHeight = 200;
    var padding = { top: 20, right: 20, bottom: 30, left: 40 };
    var chartWidth = canvasWidth - padding.left - padding.right;
    var chartHeight = canvasHeight - padding.top - padding.bottom;

    // Get data
    var values = records.map(function (r) {
      if (tab === 'height') return parseFloat(r.height);
      if (tab === 'weight') return parseFloat(r.weight);
      return parseFloat(r.bmi);
    });
    var labels = records.map(function (r) { return r.date.substring(5); }); // MM-DD

    var minVal = Math.min.apply(null, values);
    var maxVal = Math.max.apply(null, values);
    var range = maxVal - minVal;
    if (range === 0) range = maxVal * 0.2 || 10;
    minVal = minVal - range * 0.1;
    maxVal = maxVal + range * 0.1;

    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Grid lines
    ctx.setStrokeStyle('#F0F0F0');
    ctx.setLineWidth(0.5);
    for (var i = 0; i <= 4; i++) {
      var y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvasWidth - padding.right, y);
      ctx.stroke();

      var val = maxVal - ((maxVal - minVal) / 4) * i;
      ctx.setFillStyle('#999999');
      ctx.setFontSize(8);
      ctx.fillText(val.toFixed(1), 2, y + 3);
    }

    // X labels
    var step = Math.max(1, Math.floor(records.length / 5));
    for (var k = 0; k < labels.length; k += step) {
      var x = padding.left + (chartWidth / (values.length - 1)) * k;
      ctx.setFillStyle('#999999');
      ctx.setFontSize(8);
      ctx.fillText(labels[k], x - 10, canvasHeight - 5);
    }

    // Line color
    var lineColor = tab === 'height' ? '#4ECDC4' : (tab === 'weight' ? '#FF6B35' : '#9B59B6');
    ctx.setStrokeStyle(lineColor);
    ctx.setLineWidth(2);
    ctx.beginPath();

    var points = [];
    for (var j = 0; j < values.length; j++) {
      var px = padding.left + (chartWidth / (values.length - 1)) * j;
      var py = padding.top + chartHeight - ((values[j] - minVal) / (maxVal - minVal)) * chartHeight;
      points.push({ x: px, y: py });
      if (j === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Fill area
    ctx.setFillStyle(lineColor + '30');
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var m = 1; m < points.length; m++) {
      ctx.lineTo(points[m].x, points[m].y);
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.lineTo(points[0].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Points
    for (var n = 0; n < points.length; n++) {
      ctx.setFillStyle(lineColor);
      ctx.beginPath();
      ctx.arc(points[n].x, points[n].y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setFillStyle('#FFFFFF');
      ctx.beginPath();
      ctx.arc(points[n].x, points[n].y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.draw();
  },

  onShareAppMessage: function () {
    return {
      title: '身高体重记录 - 儿童成长追踪',
      path: '/pages/tools/growth-tracker/index'
    };
  }
});
