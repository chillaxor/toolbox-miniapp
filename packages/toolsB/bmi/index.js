var bmiUtil = require('../../../utils/bmi.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    height: '',
    weight: '',
    result: null,
    resultColor: '#27AE60',
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('bmi') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('bmi');
    this.setData({ isFavorite: fav });
  },

  onHeightInput: function (e) {
    this.setData({ height: e.detail.value });
  },

  onWeightInput: function (e) {
    this.setData({ weight: e.detail.value });
  },

  onCalculate: function () {
    var height = parseFloat(this.data.height);
    var weight = parseFloat(this.data.weight);

    if (!height || !weight || height <= 0 || weight <= 0) {
      wx.showToast({ title: '请输入有效数据', icon: 'none' });
      return;
    }

    if (height > 300 || weight > 500) {
      wx.showToast({ title: '请输入合理数据', icon: 'none' });
      return;
    }

    var result = bmiUtil.calculateBMI(height, weight);

    var colorMap = {
      '偏瘦': '#3498DB',
      '正常': '#27AE60',
      '偏胖': '#F39C12',
      '肥胖': '#E74C3C',
      '重度肥胖': '#C0392B'
    };

    this.setData({
      result: result,
      resultColor: colorMap[result.category] || '#999999'
    });

    this.recordHistory(height, weight, result.bmi);
  },

  recordHistory: function (height, weight, bmi) {
    storage.addHistory({
      toolId: 'bmi',
      toolName: 'BMI计算',
      category: 'life',
      summary: '身高' + height + 'cm 体重' + weight + 'kg → BMI ' + bmi,
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: 'BMI计算 - 工具箱',
      path: '/packages/toolsB/bmi/index'
    };
  }
});
