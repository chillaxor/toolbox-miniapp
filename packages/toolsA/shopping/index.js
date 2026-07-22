var storage = require('../../../utils/storage.js');

var DIFFICULTIES = {
  easy: { budget: 30, label: '简单(30元)' },
  normal: { budget: 80, label: '普通(80元)' },
  hard: { budget: 150, label: '困难(150元)' }
};

var TIME_LIMITS = { easy: 60, normal: 90, hard: 120 };

var ALL_ITEMS = [
  // 🍎 水果 (15种)
  { id: 'apple', name: '苹果', price: 2, emoji: '🍎', group: '水果' },
  { id: 'banana', name: '香蕉', price: 3, emoji: '🍌', group: '水果' },
  { id: 'orange', name: '橘子', price: 4, emoji: '🍊', group: '水果' },
  { id: 'grape', name: '葡萄', price: 5, emoji: '🍇', group: '水果' },
  { id: 'watermelon', name: '西瓜', price: 8, emoji: '🍉', group: '水果' },
  { id: 'strawberry', name: '草莓', price: 6, emoji: '🍓', group: '水果' },
  { id: 'peach', name: '桃子', price: 4, emoji: '🍑', group: '水果' },
  { id: 'pear', name: '梨', price: 3, emoji: '🍐', group: '水果' },
  { id: 'cherry', name: '樱桃', price: 8, emoji: '🍒', group: '水果' },
  { id: 'pineapple', name: '菠萝', price: 6, emoji: '🍍', group: '水果' },
  { id: 'mango', name: '芒果', price: 5, emoji: '🥭', group: '水果' },
  { id: 'kiwi', name: '猕猴桃', price: 4, emoji: '🥝', group: '水果' },
  { id: 'lemon', name: '柠檬', price: 2, emoji: '🍋', group: '水果' },
  { id: 'coconut', name: '椰子', price: 7, emoji: '🥥', group: '水果' },
  { id: 'blueberry', name: '蓝莓', price: 9, emoji: '🫐', group: '水果' },
  { id: 'lychee', name: '荔枝', price: 7, emoji: '🫐', group: '水果' },
  { id: 'plum', name: '李子', price: 3, emoji: '🍑', group: '水果' },
  { id: 'pomegranate', name: '石榴', price: 6, emoji: '🍎', group: '水果' },
  { id: 'dragonfruit', name: '火龙果', price: 6, emoji: '🐉', group: '水果' },
  { id: 'persimmon', name: '柿子', price: 4, emoji: '🍊', group: '水果' },
  // 🍪 零食 (15种)
  { id: 'cookie', name: '饼干', price: 3, emoji: '🍪', group: '零食' },
  { id: 'chocolate', name: '巧克力', price: 5, emoji: '🍫', group: '零食' },
  { id: 'cake', name: '蛋糕', price: 7, emoji: '🧁', group: '零食' },
  { id: 'lollipop', name: '棒棒糖', price: 1, emoji: '🍭', group: '零食' },
  { id: 'candy', name: '糖果', price: 2, emoji: '🍬', group: '零食' },
  { id: 'doughnut', name: '甜甜圈', price: 4, emoji: '🍩', group: '零食' },
  { id: 'pie', name: '派', price: 5, emoji: '🥧', group: '零食' },
  { id: 'icecream', name: '冰淇淋', price: 4, emoji: '🍦', group: '零食' },
  { id: 'popcorn', name: '爆米花', price: 3, emoji: '🍿', group: '零食' },
  { id: 'pretzel', name: '椒盐卷饼', price: 3, emoji: '🥨', group: '零食' },
  { id: 'waffle', name: '华夫饼', price: 4, emoji: '🧇', group: '零食' },
  { id: 'pancake', name: '煎饼', price: 3, emoji: '🥞', group: '零食' },
  { id: 'bread', name: '面包', price: 2, emoji: '🍞', group: '零食' },
  { id: 'croissant', name: '牛角包', price: 4, emoji: '🥐', group: '零食' },
  { id: 'sandwich', name: '三明治', price: 5, emoji: '🥪', group: '零食' },
  // 🥤 饮料 (15种)
  { id: 'milk', name: '牛奶', price: 4, emoji: '🥛', group: '饮料' },
  { id: 'juice', name: '果汁', price: 3, emoji: '🧃', group: '饮料' },
  { id: 'water', name: '矿泉水', price: 1, emoji: '💧', group: '饮料' },
  { id: 'cola', name: '可乐', price: 3, emoji: '🥤', group: '饮料' },
  { id: 'tea', name: '茶', price: 2, emoji: '🍵', group: '饮料' },
  { id: 'coffee', name: '咖啡', price: 5, emoji: '☕', group: '饮料' },
  { id: 'smoothie', name: '奶昔', price: 6, emoji: '🥤', group: '饮料' },
  { id: 'hotchoco', name: '热巧克力', price: 4, emoji: '🍫', group: '饮料' },
  { id: 'soda', name: '汽水', price: 2, emoji: '🫧', group: '饮料' },
  { id: 'yogurt', name: '酸奶', price: 3, emoji: '🥛', group: '饮料' },
  { id: 'milkshake', name: '冰淇淋奶昔', price: 7, emoji: '🍨', group: '饮料' },
  { id: 'bubbletea', name: '珍珠奶茶', price: 6, emoji: '🧋', group: '饮料' },
  { id: 'lemonade', name: '柠檬水', price: 3, emoji: '🍋', group: '饮料' },
  { id: 'orangejuice', name: '橙汁', price: 4, emoji: '🍊', group: '饮料' },
  { id: 'coconutwater', name: '椰汁', price: 5, emoji: '🥥', group: '饮料' },
  // ✏️ 文具 (15种)
  { id: 'pencil', name: '铅笔', price: 1, emoji: '✏️', group: '文具' },
  { id: 'notebook', name: '笔记本', price: 3, emoji: '📒', group: '文具' },
  { id: 'crayon', name: '蜡笔', price: 5, emoji: '🖍️', group: '文具' },
  { id: 'ruler', name: '尺子', price: 2, emoji: '📐', group: '文具' },
  { id: 'eraser', name: '橡皮', price: 1, emoji: '🧽', group: '文具' },
  { id: 'scissors', name: '剪刀', price: 3, emoji: '✂️', group: '文具' },
  { id: 'backpack', name: '书包', price: 15, emoji: '🎒', group: '文具' },
  { id: 'pen', name: '钢笔', price: 8, emoji: '🖊️', group: '文具' },
  { id: 'paint', name: '颜料', price: 6, emoji: '🎨', group: '文具' },
  { id: 'glue', name: '胶水', price: 2, emoji: '🫧', group: '文具' },
  { id: 'stapler', name: '订书机', price: 4, emoji: '📎', group: '文具' },
  { id: 'calculator', name: '计算器', price: 10, emoji: '🧮', group: '文具' },
  { id: 'book', name: '故事书', price: 8, emoji: '📕', group: '文具' },
  { id: 'colorpaper', name: '彩纸', price: 2, emoji: '📄', group: '文具' },
  { id: 'sticker', name: '贴纸', price: 1, emoji: '🏷️', group: '文具' },
  // 🧼 日用 (15种)
  { id: 'soap', name: '洗手液', price: 6, emoji: '🧴', group: '日用' },
  { id: 'tissue', name: '纸巾', price: 3, emoji: '🧻', group: '日用' },
  { id: 'toothbrush', name: '牙刷', price: 4, emoji: '🪥', group: '日用' },
  { id: 'soapbar', name: '香皂', price: 2, emoji: '🧼', group: '日用' },
  { id: 'towel', name: '毛巾', price: 5, emoji: '🧶', group: '日用' },
  { id: 'comb', name: '梳子', price: 2, emoji: '💇', group: '日用' },
  { id: 'sunglasses', name: '太阳镜', price: 8, emoji: '🕶️', group: '日用' },
  { id: 'hat', name: '帽子', price: 6, emoji: '🧢', group: '日用' },
  { id: 'umbrella', name: '雨伞', price: 7, emoji: '☂️', group: '日用' },
  { id: 'bag', name: '购物袋', price: 2, emoji: '🛍️', group: '日用' },
  { id: 'slipper', name: '拖鞋', price: 5, emoji: '🩴', group: '日用' },
  { id: 'cup', name: '水杯', price: 4, emoji: '🥤', group: '日用' },
  { id: 'bowl', name: '碗', price: 3, emoji: '🥣', group: '日用' },
  { id: 'plate', name: '盘子', price: 3, emoji: '🍽️', group: '日用' },
  { id: 'chopstick', name: '筷子', price: 2, emoji: '🥢', group: '日用' },
  // 🐾 玩具 (10种)
  { id: 'teddy', name: '小熊', price: 12, emoji: '🧸', group: '玩具' },
  { id: 'ball', name: '皮球', price: 5, emoji: '⚽', group: '玩具' },
  { id: 'kite', name: '风筝', price: 8, emoji: '🪁', group: '玩具' },
  { id: 'yo-yo', name: '溜溜球', price: 3, emoji: '🪀', group: '玩具' },
  { id: 'doll', name: '娃娃', price: 10, emoji: '🪆', group: '玩具' },
  { id: 'robot', name: '机器人', price: 15, emoji: '🤖', group: '玩具' },
  { id: 'jigsaw', name: '拼图', price: 6, emoji: '🧩', group: '玩具' },
  { id: 'blocks', name: '积木', price: 8, emoji: '🧱', group: '玩具' },
  { id: 'trumpet', name: '小号', price: 7, emoji: '🎺', group: '玩具' },
  { id: 'drum', name: '小鼓', price: 6, emoji: '🥁', group: '玩具' },
  { id: 'slime', name: '橡皮泥', price: 4, emoji: '🫠', group: '玩具' },
  { id: 'toy_car', name: '玩具车', price: 8, emoji: '🚗', group: '玩具' },
  { id: 'balloon', name: '气球', price: 1, emoji: '🎈', group: '玩具' },
  { id: 'telescope', name: '望远镜', price: 12, emoji: '🔭', group: '玩具' },
  { id: 'microscope', name: '显微镜', price: 15, emoji: '🔬', group: '玩具' },
  // 🥦 蔬菜 (15种)
  { id: 'carrot', name: '胡萝卜', price: 2, emoji: '🥕', group: '蔬菜' },
  { id: 'broccoli', name: '西兰花', price: 3, emoji: '🥦', group: '蔬菜' },
  { id: 'corn', name: '玉米', price: 2, emoji: '🌽', group: '蔬菜' },
  { id: 'tomato', name: '西红柿', price: 3, emoji: '🍅', group: '蔬菜' },
  { id: 'potato', name: '土豆', price: 2, emoji: '🥔', group: '蔬菜' },
  { id: 'eggplant', name: '茄子', price: 3, emoji: '🍆', group: '蔬菜' },
  { id: 'pepper', name: '辣椒', price: 2, emoji: '🌶️', group: '蔬菜' },
  { id: 'cucumber', name: '黄瓜', price: 2, emoji: '🥒', group: '蔬菜' },
  { id: 'lettuce', name: '生菜', price: 2, emoji: '🥬', group: '蔬菜' },
  { id: 'onion', name: '洋葱', price: 1, emoji: '🧅', group: '蔬菜' },
  { id: 'garlic', name: '大蒜', price: 1, emoji: '🧄', group: '蔬菜' },
  { id: 'mushroom', name: '蘑菇', price: 3, emoji: '🍄', group: '蔬菜' },
  { id: 'avocado', name: '牛油果', price: 5, emoji: '🥑', group: '蔬菜' },
  { id: 'pea', name: '豌豆', price: 2, emoji: '🫛', group: '蔬菜' },
  { id: 'ginger', name: '生姜', price: 2, emoji: '🫚', group: '蔬菜' },
  // 🥩 肉类 (15种)
  { id: 'steak', name: '牛排', price: 18, emoji: '🥩', group: '肉类' },
  { id: 'drumstick', name: '鸡腿', price: 5, emoji: '🍗', group: '肉类' },
  { id: 'meatbone', name: '排骨', price: 12, emoji: '🍖', group: '肉类' },
  { id: 'sausage', name: '香肠', price: 4, emoji: '🌭', group: '肉类' },
  { id: 'hamburger', name: '汉堡', price: 8, emoji: '🍔', group: '肉类' },
  { id: 'hotdog', name: '热狗', price: 5, emoji: '🌭', group: '肉类' },
  { id: 'pizza', name: '披萨', price: 10, emoji: '🍕', group: '肉类' },
  { id: 'bacon', name: '培根', price: 6, emoji: '🥓', group: '肉类' },
  { id: 'chickenwing', name: '鸡翅', price: 6, emoji: '🍗', group: '肉类' },
  { id: 'beefball', name: '牛肉丸', price: 8, emoji: '🧆', group: '肉类' },
  { id: 'ribs', name: '烤肋排', price: 15, emoji: '🍖', group: '肉类' },
  { id: 'lamb', name: '羊肉卷', price: 14, emoji: '🥩', group: '肉类' },
  { id: 'ham', name: '火腿', price: 5, emoji: '🍖', group: '肉类' },
  { id: 'meatball', name: '肉丸', price: 4, emoji: '🧆', group: '肉类' },
  { id: 'duck', name: '烤鸭', price: 20, emoji: '🦆', group: '肉类' },
  // 🦐 海鲜 (10种)
  { id: 'shrimp', name: '虾', price: 12, emoji: '🦐', group: '海鲜' },
  { id: 'lobster', name: '龙虾', price: 25, emoji: '🦞', group: '海鲜' },
  { id: 'crab', name: '螃蟹', price: 18, emoji: '🦀', group: '海鲜' },
  { id: 'squid', name: '鱿鱼', price: 10, emoji: '🦑', group: '海鲜' },
  { id: 'oyster', name: '生蚝', price: 8, emoji: '🦪', group: '海鲜' },
  { id: 'fish', name: '鱼', price: 8, emoji: '🐟', group: '海鲜' },
  { id: 'tropicalfish', name: '热带鱼', price: 10, emoji: '🐠', group: '海鲜' },
  { id: 'blowfish', name: '河豚', price: 15, emoji: '🐡', group: '海鲜' },
  { id: 'octopus', name: '章鱼', price: 12, emoji: '🐙', group: '海鲜' },
  { id: 'seaweed', name: '海带', price: 3, emoji: '🌿', group: '海鲜' },
  { id: 'salmon', name: '三文鱼', price: 15, emoji: '🐟', group: '海鲜' },
  { id: 'tuna', name: '金枪鱼', price: 14, emoji: '🐟', group: '海鲜' },
  { id: 'clam', name: '蛤蜊', price: 6, emoji: '🐚', group: '海鲜' },
  { id: 'scallop', name: '扇贝', price: 10, emoji: '🐚', group: '海鲜' },
  { id: 'eel', name: '鳗鱼', price: 16, emoji: '🐍', group: '海鲜' },
  // 🧂 调味品 (10种)
  { id: 'salt', name: '盐', price: 1, emoji: '🧂', group: '调味品' },
  { id: 'soysauce', name: '酱油', price: 4, emoji: '🫗', group: '调味品' },
  { id: 'vinegar', name: '醋', price: 3, emoji: '🫗', group: '调味品' },
  { id: 'honey', name: '蜂蜜', price: 8, emoji: '🍯', group: '调味品' },
  { id: 'butter', name: '黄油', price: 5, emoji: '🧈', group: '调味品' },
  { id: 'ketchup', name: '番茄酱', price: 3, emoji: '🍅', group: '调味品' },
  { id: 'chilisauce', name: '辣椒酱', price: 4, emoji: '🌶️', group: '调味品' },
  { id: 'sesame', name: '芝麻酱', price: 6, emoji: '🫙', group: '调味品' },
  { id: 'oliveoil', name: '橄榄油', price: 10, emoji: '🫒', group: '调味品' },
  { id: 'sugar', name: '白糖', price: 2, emoji: '🍬', group: '调味品' },
  // 🧊 冷冻食品 (10种)
  { id: 'dumpling', name: '饺子', price: 8, emoji: '🥟', group: '冷冻' },
  { id: 'baozi', name: '包子', price: 5, emoji: '🫓', group: '冷冻' },
  { id: 'tangyuan', name: '汤圆', price: 6, emoji: '⚪', group: '冷冻' },
  { id: 'frozendim', name: '烧麦', price: 7, emoji: '🥟', group: '冷冻' },
  { id: 'nugget', name: '鸡块', price: 5, emoji: '🍗', group: '冷冻' },
  { id: 'fries', name: '薯条', price: 4, emoji: '🍟', group: '冷冻' },
  { id: 'frozenpizza', name: '冷冻披萨', price: 10, emoji: '🍕', group: '冷冻' },
  { id: 'icebar', name: '雪糕', price: 3, emoji: '🍦', group: '冷冻' },
  { id: 'popsicle', name: '冰棍', price: 2, emoji: '🧊', group: '冷冻' },
  { id: 'frozenveg', name: '速冻蔬菜', price: 4, emoji: '🥦', group: '冷冻' },
  // 🥚 蛋奶 (10种)
  { id: 'egg', name: '鸡蛋', price: 2, emoji: '🥚', group: '蛋奶' },
  { id: 'cheese', name: '奶酪', price: 6, emoji: '🧀', group: '蛋奶' },
  { id: 'milkbox', name: '纯牛奶', price: 5, emoji: '🥛', group: '蛋奶' },
  { id: 'soymilk', name: '豆浆', price: 3, emoji: '🥛', group: '蛋奶' },
  { id: 'custard', name: '蛋挞', price: 4, emoji: '🥧', group: '蛋奶' },
  { id: 'pudding', name: '布丁', price: 4, emoji: '🍮', group: '蛋奶' },
  { id: 'creampie', name: '奶油派', price: 6, emoji: '🥧', group: '蛋奶' },
  { id: 'greek_yogurt', name: '希腊酸奶', price: 5, emoji: '🥛', group: '蛋奶' },
  { id: 'condensed', name: '炼乳', price: 4, emoji: '🫙', group: '蛋奶' },
  { id: 'quail_egg', name: '鹌鹑蛋', price: 5, emoji: '🥚', group: '蛋奶' },
  // 🌰 干果坚果 (10种)
  { id: 'peanut', name: '花生', price: 3, emoji: '🥜', group: '干果' },
  { id: 'walnut', name: '核桃', price: 6, emoji: '🌰', group: '干果' },
  { id: 'almond', name: '杏仁', price: 8, emoji: '🥜', group: '干果' },
  { id: 'sunflower', name: '瓜子', price: 3, emoji: '🌻', group: '干果' },
  { id: 'cashew', name: '腰果', price: 10, emoji: '🥜', group: '干果' },
  { id: 'raisin', name: '葡萄干', price: 4, emoji: '🍇', group: '干果' },
  { id: 'driedmango', name: '芒果干', price: 6, emoji: '🥭', group: '干果' },
  { id: 'pistachio', name: '开心果', price: 12, emoji: '🥜', group: '干果' },
  { id: 'chestnut', name: '栗子', price: 5, emoji: '🌰', group: '干果' },
  { id: 'dates', name: '红枣', price: 4, emoji: '🫒', group: '干果' },
  { id: 'macadamia', name: '夏威夷果', price: 14, emoji: '🥜', group: '干果' },
  { id: 'pine_nut', name: '松子', price: 12, emoji: '🥜', group: '干果' },
  { id: 'hazelnut', name: '榛子', price: 10, emoji: '🌰', group: '干果' },
  { id: 'dried_longan', name: '桂圆', price: 5, emoji: '🫒', group: '干果' },
  { id: 'lotus_seed', name: '莲子', price: 8, emoji: '🫘', group: '干果' },
  // 🍜 方便速食 (10种)
  { id: 'noodle', name: '方便面', price: 3, emoji: '🍜', group: '速食' },
  { id: 'ramen', name: '拉面', price: 8, emoji: '🍜', group: '速食' },
  { id: 'rice', name: '米饭', price: 2, emoji: '🍚', group: '速食' },
  { id: 'curry', name: '咖喱饭', price: 10, emoji: '🍛', group: '速食' },
  { id: 'sushi', name: '寿司', price: 12, emoji: '🍣', group: '速食' },
  { id: 'bento', name: '便当', price: 10, emoji: '🍱', group: '速食' },
  { id: 'spaghetti', name: '意面', price: 6, emoji: '🍝', group: '速食' },
  { id: 'mooncake', name: '月饼', price: 8, emoji: '🥮', group: '速食' },
  { id: 'tamago', name: '蛋包饭', price: 8, emoji: '🍳', group: '速食' },
  { id: 'riceball', name: '饭团', price: 4, emoji: '🍙', group: '速食' },
  { id: 'friedrice', name: '炒饭', price: 8, emoji: '🍚', group: '速食' },
  { id: 'wonton', name: '馄饨', price: 6, emoji: '🥟', group: '速食' },
  { id: 'naan', name: '馕', price: 3, emoji: '🫓', group: '速食' },
  { id: 'bibimbap', name: '拌饭', price: 9, emoji: '🍚', group: '速食' },
  { id: 'rice_noodle', name: '米粉', price: 5, emoji: '🍜', group: '速食' }
];

var GROUPS = ['水果', '零食', '饮料', '文具', '日用', '玩具', '蔬菜', '肉类', '海鲜', '调味品', '冷冻', '蛋奶', '干果', '速食'];

Page({
  data: {
    isFavorite: false,
    phase: 'select', // select | shopping | receipt
    difficulty: 'normal',
    budget: 50,
    shopItems: [],
    cart: [],
    totalSpent: 0,
    change: 0,
    score: 0,
    totalGames: 0,
    bestScore: 0,
    gameMode: 'free',
    timeLeft: 0,
    timer: null,
    timeWarning: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.loadScore();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('shopping') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('shopping');
    this.setData({ isFavorite: fav });
  },

  loadScore: function () {
    var data = wx.getStorageSync('shopping_best') || { totalGames: 0, bestScore: 0 };
    this.setData({ totalGames: data.totalGames || 0, bestScore: data.bestScore || 0 });
  },

  saveScore: function (score) {
    var totalGames = this.data.totalGames + 1;
    var bestScore = Math.max(this.data.bestScore, score);
    this.setData({ totalGames: totalGames, bestScore: bestScore });
    wx.setStorageSync('shopping_best', { totalGames: totalGames, bestScore: bestScore });
  },

  onDifficultyChange: function (e) {
    var diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff });
  },

  onGameModeChange: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({ gameMode: mode });
  },

  onUnload: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  startGame: function () {
    var budget = DIFFICULTIES[this.data.difficulty].budget;
    var timeLimit = TIME_LIMITS[this.data.difficulty];
    // Show all 200 items
    var shopItems = ALL_ITEMS.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        group: item.group,
        quantity: 0
      };
    });
    // Sort by group
    var groupOrder = {};
    GROUPS.forEach(function (g, i) { groupOrder[g] = i; });
    shopItems.sort(function (a, b) { return groupOrder[a.group] - groupOrder[b.group]; });
    // Mark first item of each group to show group header
    var lastGroup = '';
    var groupEmojis = { '水果': '🍎', '零食': '🍪', '饮料': '🥤', '文具': '✏️', '日用': '🧴', '玩具': '🧸', '蔬菜': '🥦', '肉类': '🥩', '海鲜': '🦐', '调味品': '🧂', '冷冻': '🧊', '蛋奶': '🥚', '干果': '🌰', '速食': '🍜' };
    for (var k = 0; k < shopItems.length; k++) {
      if (shopItems[k].group !== lastGroup) {
        shopItems[k].showGroup = true;
        shopItems[k].groupEmoji = groupEmojis[shopItems[k].group] || '📦';
        lastGroup = shopItems[k].group;
      } else {
        shopItems[k].showGroup = false;
      }
    }

    this.setData({
      phase: 'shopping',
      budget: budget,
      shopItems: shopItems,
      cart: [],
      totalSpent: 0,
      change: 0,
      score: 0,
      timeLeft: timeLimit,
      timeWarning: false
    });
    if (this.data.gameMode === 'timed') {
      this.startTimer();
    }
  },

  shuffleArray: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  },

  startTimer: function () {
    var that = this;
    if (that.data.timer) {
      clearInterval(that.data.timer);
    }
    var timer = setInterval(function () {
      var timeLeft = that.data.timeLeft - 1;
      if (timeLeft <= 0) {
        clearInterval(timer);
        that.setData({ timeLeft: 0, timer: null });
        // Time's up - auto checkout
        that.checkout(true);
      } else {
        that.setData({
          timeLeft: timeLeft,
          timeWarning: timeLeft <= 10
        });
      }
    }, 1000);
    that.setData({ timer: timer });
  },

  addItem: function (e) {
    var id = e.currentTarget.dataset.id;
    var shopItems = this.data.shopItems.slice();
    var totalSpent = this.data.totalSpent;

    for (var i = 0; i < shopItems.length; i++) {
      if (shopItems[i].id === id) {
        if (totalSpent + shopItems[i].price > this.data.budget) {
          wx.showToast({ title: '钱不够啦！', icon: 'none' });
          return;
        }
        shopItems[i] = Object.assign({}, shopItems[i], { quantity: shopItems[i].quantity + 1 });
        totalSpent += shopItems[i].price;
        break;
      }
    }

    this.setData({ shopItems: shopItems, totalSpent: totalSpent });
  },

  removeItem: function (e) {
    var id = e.currentTarget.dataset.id;
    var shopItems = this.data.shopItems.slice();
    var totalSpent = this.data.totalSpent;

    for (var i = 0; i < shopItems.length; i++) {
      if (shopItems[i].id === id && shopItems[i].quantity > 0) {
        shopItems[i] = Object.assign({}, shopItems[i], { quantity: shopItems[i].quantity - 1 });
        totalSpent -= shopItems[i].price;
        break;
      }
    }

    this.setData({ shopItems: shopItems, totalSpent: totalSpent });
  },

  checkout: function (isTimeout) {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    var cart = [];
    var shopItems = this.data.shopItems;
    for (var i = 0; i < shopItems.length; i++) {
      if (shopItems[i].quantity > 0) {
        cart.push({
          name: shopItems[i].name,
          emoji: shopItems[i].emoji,
          price: shopItems[i].price,
          quantity: shopItems[i].quantity,
          subtotal: shopItems[i].price * shopItems[i].quantity
        });
      }
    }

    if (cart.length === 0) {
      if (isTimeout) {
        wx.showToast({ title: '⏰ 时间到！你什么都没买', icon: 'none', duration: 2000 });
      } else {
        wx.showToast({ title: '购物车是空的哦', icon: 'none' });
      }
      if (isTimeout) {
        this.setData({ phase: 'select' });
      }
      return;
    }

    var totalSpent = this.data.totalSpent;
    var change = this.data.budget - totalSpent;
    var itemCount = 0;
    for (var j = 0; j < cart.length; j++) {
      itemCount += cart[j].quantity;
    }
    // Score: more items + less change = better (max 100)
    var itemScore = Math.min(itemCount * 8, 60);
    var spendRatio = totalSpent / this.data.budget;
    var spendScore = Math.round(spendRatio * 40);
    var score = Math.min(itemScore + spendScore, 100);

    this.saveScore(score);

    this.setData({
      phase: 'receipt',
      cart: cart,
      totalSpent: totalSpent,
      change: change,
      score: score,
      itemCount: itemCount
    });

    storage.addHistory({
      toolId: 'shopping',
      toolName: '超市购物',
      category: 'fun',
      summary: '花了' + totalSpent + '元买了' + itemCount + '件商品',
      timestamp: Date.now()
    });
  },

  goBack: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    this.setData({ phase: 'select', timer: null });
  },

  playAgain: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    this.startGame();
  },

  onShareAppMessage: function () {
    return {
      title: '超市购物 - 学习理财从小开始！',
      path: '/packages/toolsA/shopping/index'
    };
  }
});
