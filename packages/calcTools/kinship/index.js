/*
 * @Author: chillaxor chenxinbin@linghit.com
 * @Date: 2026-06-02 16:06:21
 * @LastEditors: chillaxor chenxinbin@linghit.com
 * @LastEditTime: 2026-06-02 16:06:36
 * @FilePath: \toolbox-miniapp\pages\tools\kinship\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var kinship = require('../../../utils/kinship.js');
var storage = require('../../../utils/storage.js');

Page({
  data: {
    gender: 'male',
    chain: [],
    result: null,
    relationOptions: [],
    isFavorite: false
  },

  onLoad: function () {
    this.setData({
      relationOptions: kinship.getRelationOptions()
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('kinship') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('kinship');
    this.setData({ isFavorite: fav });
  },

  onGenderChange: function (e) {
    this.setData({ gender: e.detail.value });
    if (this.data.chain.length > 0) {
      this.onCalculate();
    }
  },

  onAddRelation: function (e) {
    var rel = e.currentTarget.dataset.rel;
    var chain = this.data.chain.concat([rel]);
    this.setData({ chain: chain });
    this.onCalculate();
  },

  onRemoveLast: function () {
    var chain = this.data.chain.slice(0, -1);
    this.setData({ chain: chain });
    if (chain.length > 0) {
      this.onCalculate();
    } else {
      this.setData({ result: null });
    }
  },

  onReset: function () {
    this.setData({ chain: [], result: null });
  },

  onCalculate: function () {
    var result = kinship.calculate(this.data.chain, this.data.gender);
    this.setData({ result: result });

    if (this.data.chain.length > 0) {
      storage.addHistory({
        toolId: 'kinship',
        toolName: '亲戚称呼计算',
        category: 'life',
        summary: this.data.chain.join('的') + ' → ' + result.result,
        timestamp: Date.now()
      });
    }
  },

  onShareAppMessage: function () {
    return {
      title: '亲戚称呼计算器 - 工具箱',
      path: '/packages/calcTools/kinship/index'
    };
  }
});
