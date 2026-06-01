/**
 * 今天吃什么 - 随机推荐菜品
 * 内置菜品库 + 自定义添加
 */

var FOOD_CATEGORIES = [
  {
    id: 'chinese',
    name: '中餐',
    emoji: '🥢',
    items: ['宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '回锅肉', '红烧肉', '糖醋排骨', '水煮鱼', '酸菜鱼', '剁椒鱼头', '番茄炒蛋', '青椒肉丝', '地三鲜', '锅包肉', '小鸡炖蘑菇', '梅菜扣肉', '东坡肉', '口水鸡', '辣子鸡', '干煸豆角', '蒜蓉西兰花', '土豆炖牛肉', '清蒸鲈鱼', '白切鸡', '京酱肉丝', '木须肉', '红烧茄子', '蚂蚁上树', '干锅花菜', '毛血旺', '龙井虾仁']
  },
  {
    id: 'noodle',
    name: '面食',
    emoji: '🍜',
    items: ['兰州拉面', '重庆小面', '炸酱面', '刀削面', '担担面', '热干面', '油泼面', '牛肉面', '阳春面', '云吞面', '螺蛳粉', '酸辣粉', '炒河粉', '炒意面', '冷面']
  },
  {
    id: 'fastfood',
    name: '快餐',
    emoji: '🍔',
    items: ['汉堡', '炸鸡', '披萨', '三明治', '薯条', '鸡块', '卷饼', '饭团', '便当']
  },
  {
    id: 'hotpot',
    name: '火锅/烧烤',
    emoji: '🔥',
    items: ['四川火锅', '重庆火锅', '潮汕牛肉锅', '铜锅涮肉', '串串香', '烤肉', '烤串', '韩式烤肉', '日式烧肉', '铁板烧']
  },
  {
    id: 'asian',
    name: '日韩/东南亚',
    emoji: '🍣',
    items: ['寿司', '拉面', '咖喱饭', '石锅拌饭', '冬阴功', '泰式炒粉', '越南粉', '海南鸡饭', '日式定食', '天妇罗']
  },
  {
    id: 'light',
    name: '轻食/小吃',
    emoji: '🥗',
    items: ['沙拉', '三明治', '粥', '包子', '饺子', '馄饨', '煎饼果子', '肉夹馍', '凉皮', '烤冷面', '鸡蛋灌饼', '手抓饼']
  }
];

/**
 * 随机推荐一道菜
 * @param {Array} categoryIds - 可选分类ID，空则全部
 * @returns {Object} { name, category, emoji }
 */
function randomFood(categoryIds) {
  var pool = [];
  for (var i = 0; i < FOOD_CATEGORIES.length; i++) {
    var cat = FOOD_CATEGORIES[i];
    if (!categoryIds || categoryIds.length === 0 || categoryIds.indexOf(cat.id) >= 0) {
      for (var j = 0; j < cat.items.length; j++) {
        pool.push({ name: cat.items[j], category: cat.name, emoji: cat.emoji });
      }
    }
  }
  if (pool.length === 0) return null;
  var idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * 随机推荐N道菜（不重复）
 * @param {number} count - 推荐数量
 * @param {Array} categoryIds - 可选分类
 * @returns {Array}
 */
function randomFoods(count, categoryIds) {
  var pool = [];
  for (var i = 0; i < FOOD_CATEGORIES.length; i++) {
    var cat = FOOD_CATEGORIES[i];
    if (!categoryIds || categoryIds.length === 0 || categoryIds.indexOf(cat.id) >= 0) {
      for (var j = 0; j < cat.items.length; j++) {
        pool.push({ name: cat.items[j], category: cat.name, emoji: cat.emoji });
      }
    }
  }
  // Fisher-Yates 洗牌
  for (var k = pool.length - 1; k > 0; k--) {
    var swap = Math.floor(Math.random() * (k + 1));
    var temp = pool[k];
    pool[k] = pool[swap];
    pool[swap] = temp;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * 获取所有分类
 */
function getCategories() {
  return FOOD_CATEGORIES.slice();
}

/**
 * 获取自定义菜品（从storage读取）
 */
function getCustomFoods() {
  try {
    var data = wx.getStorageSync('toolbox_custom_foods');
    return data || [];
  } catch (e) {
    return [];
  }
}

/**
 * 添加自定义菜品
 */
function addCustomFood(name) {
  var foods = getCustomFoods();
  foods.push({ name: name, category: '自定义', emoji: '⭐' });
  wx.setStorageSync('toolbox_custom_foods', foods);
  return foods;
}

/**
 * 删除自定义菜品
 */
function removeCustomFood(index) {
  var foods = getCustomFoods();
  if (index >= 0 && index < foods.length) {
    foods.splice(index, 1);
    wx.setStorageSync('toolbox_custom_foods', foods);
  }
  return foods;
}

module.exports = {
  randomFood: randomFood,
  randomFoods: randomFoods,
  getCategories: getCategories,
  getCustomFoods: getCustomFoods,
  addCustomFood: addCustomFood,
  removeCustomFood: removeCustomFood
};
