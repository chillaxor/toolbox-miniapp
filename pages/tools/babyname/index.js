var storage = require('../../../utils/storage.js');

// 常用汉字 - 按寓意分类
var CHAR_POOL = {
  boys: [
    { ch: '宇', meaning: '宇宙，气度' },
    { ch: '泽', meaning: '恩泽，润泽' },
    { ch: '睿', meaning: '睿智，聪明' },
    { ch: '浩', meaning: '浩大，正气' },
    { ch: '轩', meaning: '气宇轩昂' },
    { ch: '博', meaning: '博学，广博' },
    { ch: '铭', meaning: '铭记，铭刻' },
    { ch: '辰', meaning: '星辰，时光' },
    { ch: '逸', meaning: '飘逸，安逸' },
    { ch: '然', meaning: '自然，坦然' },
    { ch: '昊', meaning: '天空广大' },
    { ch: '霖', meaning: '甘霖，恩泽' },
    { ch: '煜', meaning: '光耀，明亮' },
    { ch: '哲', meaning: '哲理，智慧' },
    { ch: '瑞', meaning: '祥瑞，吉兆' },
    { ch: '晟', meaning: '光明，旺盛' },
    { ch: '旭', meaning: '旭日东升' },
    { ch: '恒', meaning: '恒心，永恒' },
    { ch: '骁', meaning: '骁勇善战' },
    { ch: '睿', meaning: '聪睿，通达' },
    { ch: '峰', meaning: '高峰，巅峰' },
    { ch: '楷', meaning: '楷模，典范' },
    { ch: '彬', meaning: '文质彬彬' },
    { ch: '澄', meaning: '清澈，澄明' },
    { ch: '奕', meaning: '神采奕奕' },
    { ch: '安', meaning: '平安，安定' },
    { ch: '晨', meaning: '清晨，朝气' },
    { ch: '松', meaning: '松柏，坚韧' },
    { ch: '涛', meaning: '波涛，气势' },
    { ch: '毅', meaning: '刚毅，果断' }
  ],
  girls: [
    { ch: '涵', meaning: '涵养，包容' },
    { ch: '萱', meaning: '萱草，快乐' },
    { ch: '瑶', meaning: '美玉，美好' },
    { ch: '馨', meaning: '温馨，芳香' },
    { ch: '悦', meaning: '喜悦，愉悦' },
    { ch: '彤', meaning: '红色，朝气' },
    { ch: '妍', meaning: '美丽，巧慧' },
    { ch: '琳', meaning: '美玉，珍贵' },
    { ch: '琪', meaning: '美玉，珍异' },
    { ch: '蕊', meaning: '花蕊，美好' },
    { ch: '颖', meaning: '聪颖，出众' },
    { ch: '璐', meaning: '美玉，宝璐' },
    { ch: '嫣', meaning: '嫣然，美好' },
    { ch: '昕', meaning: '黎明，明亮' },
    { ch: '婧', meaning: '纤弱美好' },
    { ch: '芮', meaning: '小巧玲珑' },
    { ch: '沁', meaning: '沁人心脾' },
    { ch: '瑾', meaning: '美玉，美德' },
    { ch: '诗', meaning: '诗意，文雅' },
    { ch: '漫', meaning: '浪漫，自由' },
    { ch: '沫', meaning: '泡沫，清新' },
    { ch: '绮', meaning: '绮丽，华美' },
    { ch: '汐', meaning: '潮汐，温柔' },
    { ch: '雅', meaning: '高雅，文雅' },
    { ch: '芷', meaning: '白芷，清雅' },
    { ch: '恬', meaning: '恬静，安适' },
    { ch: '晴', meaning: '晴朗，明媚' },
    { ch: '灵', meaning: '灵动，聪慧' },
    { ch: '恩', meaning: '感恩，恩惠' },
    { ch: '婉', meaning: '温婉，柔美' }
  ]
};

// 姓氏列表
var SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗',
  '郑', '梁', '谢', '宋', '唐', '韩', '曹', '许', '邓', '萧',
  '冯', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏',
  '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范'];

// 五行属性
var WUXING = ['金', '木', '水', '火', '土'];

Page({
  data: {
    surname: '',
    gender: 'boy',
    wuxing: '',
    generated: [],
    showResult: false,
    surnameList: [],
    wuxingList: WUXING,
    favNames: [],
    showFavPanel: false,
    historyList: []
  },

  onLoad: function () {
    var sList = SURNAMES.map(function (s) { return { name: s, selected: false }; });
    sList.unshift({ name: '随机', selected: true });
    var favs = wx.getStorageSync('babyname_fav') || [];
    var hist = wx.getStorageSync('babyname_history') || [];
    this.setData({
      surnameList: sList,
      favNames: favs,
      historyList: hist
    });
  },

  inputSurname: function (e) {
    this.setData({ surname: e.detail.value });
  },

  selectSurname: function (e) {
    var name = e.currentTarget.dataset.name;
    var list = this.data.surnameList.slice();
    for (var i = 0; i < list.length; i++) {
      list[i].selected = list[i].name === name;
    }
    this.setData({
      surname: name === '随机' ? '' : name,
      surnameList: list
    });
  },

  selectGender: function (e) {
    this.setData({ gender: e.currentTarget.dataset.gender });
  },

  selectWuxing: function (e) {
    var wx_val = e.currentTarget.dataset.wx;
    this.setData({ wuxing: this.data.wuxing === wx_val ? '' : wx_val });
  },

  generateNames: function () {
    var surname = this.data.surname;
    if (!surname) {
      surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    }
    var gender = this.data.gender;
    var pool = gender === 'boy' ? CHAR_POOL.boys : CHAR_POOL.girls;
    var results = [];

    // 生成8个名字
    for (var i = 0; i < 8; i++) {
      var chars = [];
      var meanings = [];
      var charCount = Math.random() > 0.5 ? 2 : 1;
      var usedChars = {};
      
      for (var j = 0; j < charCount; j++) {
        var idx;
        var attempts = 0;
        do {
          idx = Math.floor(Math.random() * pool.length);
          attempts++;
        } while (usedChars[idx] && attempts < 20);
        usedChars[idx] = true;
        chars.push(pool[idx].ch);
        meanings.push(pool[idx].ch + '：' + pool[idx].meaning);
      }

      var fullName = surname + chars.join('');
      results.push({
        name: fullName,
        chars: chars.join(''),
        meanings: meanings,
        score: Math.floor(Math.random() * 15) + 85, // 85-99分
        wuxing: this.data.wuxing || WUXING[Math.floor(Math.random() * 5)]
      });
    }

    // 保存历史
    var hist = this.data.historyList.slice();
    hist.unshift({
      surname: surname,
      gender: gender,
      count: results.length,
      timestamp: Date.now()
    });
    if (hist.length > 20) hist = hist.slice(0, 20);
    wx.setStorageSync('babyname_history', hist);

    this.setData({
      generated: results,
      showResult: true,
      historyList: hist
    });

    storage.addHistory({
      toolId: 'babyname',
      toolName: '起名神器',
      category: 'life',
      summary: '为' + surname + '姓' + (gender === 'boy' ? '男' : '女') + '宝生成了' + results.length + '个名字',
      timestamp: Date.now()
    });
  },

  favName: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var item = this.data.generated[idx];
    var favs = this.data.favNames.slice();
    var exists = false;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].name === item.name) { exists = true; break; }
    }
    if (exists) {
      wx.showToast({ title: '已收藏过了', icon: 'none' });
      return;
    }
    favs.unshift({ name: item.name, meanings: item.meanings, score: item.score, timestamp: Date.now() });
    if (favs.length > 30) favs = favs.slice(0, 30);
    wx.setStorageSync('babyname_fav', favs);
    this.setData({ favNames: favs });
    wx.showToast({ title: '已收藏', icon: 'success' });
  },

  toggleFavPanel: function () {
    this.setData({ showFavPanel: !this.data.showFavPanel });
  },

  removeFav: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var favs = this.data.favNames.slice();
    favs.splice(idx, 1);
    wx.setStorageSync('babyname_fav', favs);
    this.setData({ favNames: favs });
  },

  regenerate: function () {
    this.generateNames();
  },

  onShareAppMessage: function () {
    return {
      title: '起名神器 - 给宝宝起个好名字',
      path: '/pages/tools/babyname/index'
    };
  }
});
