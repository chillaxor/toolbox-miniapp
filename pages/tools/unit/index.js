var unitUtil = require('../../../utils/unit.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    unitTypeIndex: 0,
    unitTypeNames: ['长度', '重量', '温度'],
    unitTypeKeys: ['length', 'weight', 'temp'],
    inputValue: '',
    fromUnitIndex: 0,
    toUnitIndex: 1,
    fromUnitNames: [],
    toUnitNames: [],
    fromUnitKeys: [],
    toUnitKeys: [],
    result: null,
    isFavorite: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.updateUnitList();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('unit') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('unit');
    this.setData({ isFavorite: fav });
  },

  updateUnitList: function () {
    var unitType = this.data.unitTypeKeys[this.data.unitTypeIndex];
    var units = unitUtil.getUnitList(unitType);
    var names = units.map(function (u) { return u.name; });
    var keys = units.map(function (u) { return u.key; });

    this.setData({
      fromUnitNames: names,
      toUnitNames: names,
      fromUnitKeys: keys,
      toUnitKeys: keys,
      fromUnitIndex: 0,
      toUnitIndex: Math.min(1, names.length - 1),
      result: null
    });
  },

  onUnitTypeChange: function (e) {
    this.setData({ unitTypeIndex: e.detail.value, result: null });
    this.updateUnitList();
  },

  onInputValueChange: function (e) {
    this.setData({ inputValue: e.detail.value });
  },

  onFromUnitChange: function (e) {
    this.setData({ fromUnitIndex: e.detail.value, result: null });
  },

  onToUnitChange: function (e) {
    this.setData({ toUnitIndex: e.detail.value, result: null });
  },

  onSwap: function () {
    var fromIdx = this.data.fromUnitIndex;
    var toIdx = this.data.toUnitIndex;
    this.setData({
      fromUnitIndex: toIdx,
      toUnitIndex: fromIdx,
      result: null
    });
  },

  onConvert: function () {
    var value = parseFloat(this.data.inputValue);
    if (isNaN(value)) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' });
      return;
    }

    var unitType = this.data.unitTypeKeys[this.data.unitTypeIndex];
    var fromKey = this.data.fromUnitKeys[this.data.fromUnitIndex];
    var toKey = this.data.toUnitKeys[this.data.toUnitIndex];

    var result = unitUtil.convertUnit(value, fromKey, toKey, unitType);
    this.setData({ result: result });

    this.recordHistory(value, fromKey, toKey, result);
  },

  recordHistory: function (value, from, to, result) {
    var fromName = this.data.fromUnitNames[this.data.fromUnitIndex];
    var toName = this.data.toUnitNames[this.data.toUnitIndex];
    storage.addHistory({
      toolId: 'unit',
      toolName: '单位换算',
      category: 'life',
      summary: value + ' ' + fromName + ' → ' + result + ' ' + toName,
      timestamp: Date.now()
    });
  },

  onShareAppMessage: function () {
    return {
      title: '单位换算 - 工具箱',
      path: '/pages/tools/unit/index'
    };
  }
});
