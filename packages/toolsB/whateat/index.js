var whatEatUtil = require('../../../utils/whateat.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    isFavorite: false,
    categories: [],
    selectedCategories: [],
    result: null,
    resultList: [],
    showResult: false,
    customFood: '',
    customFoods: [],
    shaking: false
  },

  onLoad: function () {
    var cats = whatEatUtil.getCategories();
    var selectedIds = cats.map(function (c) { return c.id; });
    this.setData({
      categories: cats,
      selectedCategories: selectedIds,
      customFoods: whatEatUtil.getCustomFoods()
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('whateat') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('whateat');
    this.setData({ isFavorite: fav });
  },

  onCategoryToggle: function (e) {
    var id = e.currentTarget.dataset.id;
    var selected = this.data.selectedCategories.slice();
    var idx = selected.indexOf(id);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(id);
    }
    this.setData({ selectedCategories: selected });
  },

  onRandomOne: function () {
    var self = this;
    this.setData({ shaking: true });

    // 摇晃动画效果
    var count = 0;
    var interval = setInterval(function () {
      var food = whatEatUtil.randomFood(self.data.selectedCategories);
      self.setData({ result: food });
      count++;
      if (count >= 8) {
        clearInterval(interval);
        // 最终结果
        var finalFood = whatEatUtil.randomFood(self.data.selectedCategories);
        // 也考虑自定义菜品
        var customFoods = whatEatUtil.getCustomFoods();
        if (customFoods.length > 0 && Math.random() < 0.3) {
          var cIdx = Math.floor(Math.random() * customFoods.length);
          finalFood = customFoods[cIdx];
        }
        self.setData({
          result: finalFood,
          showResult: true,
          shaking: false
        });

        storage.addHistory({
          toolId: 'whateat',
          toolName: '今天吃什么',
          category: 'fun',
          summary: '随机推荐：' + finalFood.name,
          timestamp: Date.now()
        });
      }
    }, 100);
  },

  onRandomThree: function () {
    var results = whatEatUtil.randomFoods(3, this.data.selectedCategories);
    this.setData({
      resultList: results,
      result: null,
      showResult: true
    });

    var names = results.map(function (r) { return r.name; }).join('、');
    storage.addHistory({
      toolId: 'whateat',
      toolName: '今天吃什么',
      category: 'fun',
      summary: '推荐3道：' + names,
      timestamp: Date.now()
    });
  },

  onCustomInput: function (e) {
    this.setData({ customFood: e.detail.value });
  },

  onAddCustom: function () {
    var name = this.data.customFood.trim();
    if (!name) {
      wx.showToast({ title: '请输入菜品名', icon: 'none' });
      return;
    }
    var foods = whatEatUtil.addCustomFood(name);
    this.setData({
      customFoods: foods,
      customFood: ''
    });
    wx.showToast({ title: '添加成功', icon: 'success' });
  },

  onRemoveCustom: function (e) {
    var index = e.currentTarget.dataset.index;
    var foods = whatEatUtil.removeCustomFood(index);
    this.setData({ customFoods: foods });
  },

  onReset: function () {
    this.setData({
      result: null,
      resultList: [],
      showResult: false
    });
  },

  onShareAppMessage: function () {
    var food = this.data.result;
    return {
      title: food ? '今天吃' + food.name + '！' : '今天吃什么？',
      path: '/packages/toolsB/whateat/index'
    };
  }
});
