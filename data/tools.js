/**
 * 工具配置数据
 * 包含分类信息和工具列表
 */

const CATEGORIES = {
  LIFE_CALC: { id: 'life', name: '生活计算', color: '#FF6B35', bgColor: '#FFE5D9' },
  DATE_TIME: { id: 'date', name: '日期时间', color: '#4ECDC4', bgColor: '#D8F5F3' },
  TEXT_PROC: { id: 'text', name: '文本处理', color: '#45B058', bgColor: '#D9F0DC' },
  IMAGE_TOOL: { id: 'image', name: '图片工具', color: '#9B59B6', bgColor: '#EFD9F7' },
  FUN_RANDOM: { id: 'fun', name: '趣味随机', color: '#E74C3C', bgColor: '#FDE8E8' }
};

const TOOLS = [
  { id: 'bmi', name: 'BMI计算', category: 'life', icon: '📊', path: '/pages/tools/bmi/index', description: '计算身体质量指数' },
  { id: 'unit', name: '单位换算', category: 'life', icon: '📏', path: '/pages/tools/unit/index', description: '长度/重量/温度换算' },
  { id: 'currency', name: '汇率转换', category: 'life', icon: '💱', path: '/pages/tools/currency/index', description: '多币种实时换算' },
  { id: 'salary', name: '税后工资', category: 'life', icon: '💰', path: '/pages/tools/salary/index', description: '五险一金+个税计算' },
  { id: 'calendar', name: '万年历', category: 'date', icon: '📅', path: '/pages/tools/calendar/index', description: '月视图+农历+节假日' },
  { id: 'countdown', name: '倒计时', category: 'date', icon: '⏳', path: '/pages/tools/countdown/index', description: '目标日期倒计时' },
  { id: 'workday', name: '工作日计算', category: 'date', icon: '💼', path: '/pages/tools/workday/index', description: '工作日天数计算' },
  { id: 'lunar', name: '农历转换', category: 'date', icon: '🌙', path: '/pages/tools/lunar/index', description: '公历↔农历互转' },
  { id: 'wordcount', name: '字数统计', category: 'text', icon: '📝', path: '/pages/tools/wordcount/index', description: '字符/字数/行数统计' },
  { id: 'caseconvert', name: '大小写转换', category: 'text', icon: '🔤', path: '/pages/tools/caseconvert/index', description: '英文大小写转换' },
  { id: 'jsonformat', name: 'JSON格式化', category: 'text', icon: '📋', path: '/pages/tools/jsonformat/index', description: 'JSON美化/压缩' },
  { id: 'base64', name: 'Base64编解码', category: 'text', icon: '🔐', path: '/pages/tools/base64/index', description: '文本编解码' },
  { id: 'imgcompress', name: '图片压缩', category: 'image', icon: '🖼️', path: '/pages/tools/imgcompress/index', description: '压缩图片体积' },
  { id: 'imgbase64', name: '图转Base64', category: 'image', icon: '🔄', path: '/pages/tools/imgbase64/index', description: '图片转字符串' },
  { id: 'qrcode', name: '二维码生成', category: 'image', icon: '📱', path: '/pages/tools/qrcode/index', description: '文本/URL生成二维码' },
  { id: 'loan', name: '贷款计算器', category: 'life', icon: '🏦', path: '/pages/tools/loan/index', description: '房贷/车贷月供计算' },
  { id: 'worldclock', name: '世界时钟', category: 'date', icon: '🌍', path: '/pages/tools/worldclock/index', description: '全球城市当前时间' },
  { id: 'whateat', name: '今天吃什么', category: 'fun', icon: '🍜', path: '/pages/tools/whateat/index', description: '随机推荐菜品' },
  { id: 'drawlot', name: '抽签抓阄', category: 'fun', icon: '🎯', path: '/pages/tools/drawlot/index', description: '输入选项随机抽取' },
  { id: 'dice', name: '摇骰子', category: 'fun', icon: '🎲', path: '/pages/tools/dice/index', description: '1-6随机摇骰子' },
  { id: 'randomgroup', name: '随机分组', category: 'fun', icon: '👥', path: '/pages/tools/randomgroup/index', description: '名单随机分组' },
  { id: 'sketch', name: '简易画板', category: 'image', icon: '✏️', path: '/pages/tools/sketch/index', description: '涂鸦/签名画板' },
  { id: 'math24', name: '数学训练', category: 'fun', icon: '🧮', path: '/pages/tools/math24/index', description: '24点计算挑战' },
  { id: 'sudoku', name: '逻辑推理', category: 'fun', icon: '🔢', path: '/pages/tools/sudoku/index', description: '数独逻辑训练' },
  { id: 'klotski', name: '拼图益智', category: 'fun', icon: '🧩', path: '/pages/tools/klotski/index', description: '数字滑块拼图' },
  { id: 'maze', name: '专注力训练', category: 'fun', icon: '🌀', path: '/pages/tools/maze/index', description: '迷宫寻路挑战' },
  { id: 'colorchallenge', name: '色感测试', category: 'fun', icon: '🎨', path: '/pages/tools/colorchallenge/index', description: '色彩敏感度挑战' },
  { id: 'jokes', name: '解压文案', category: 'fun', icon: '😂', path: '/pages/tools/jokes/index', description: '随机笑话解压' },
  { id: 'luckywheel', name: '抽签助手', category: 'fun', icon: '🎯', path: '/pages/tools/luckywheel/index', description: '大转盘随机抽签' },
  { id: 'coincoin', name: '抛硬币', category: 'fun', icon: '🪙', path: '/pages/tools/coincoin/index', description: '随机正反面·统计概率' },
  { id: 'sticker', name: '表情包制作', category: 'image', icon: '😀', path: '/pages/tools/sticker/index', description: '自定义表情包·加字加表情' },
];

/**
 * 根据分类获取工具列表
 * @param {string} categoryId - 分类ID
 * @returns {Array} 工具列表
 */
function getToolsByCategory(categoryId) {
  return TOOLS.filter(function (tool) {
    return tool.category === categoryId;
  });
}

/**
 * 根据ID获取工具信息
 * @param {string} toolId - 工具ID
 * @returns {Object|null} 工具信息
 */
function getToolById(toolId) {
  for (var i = 0; i < TOOLS.length; i++) {
    if (TOOLS[i].id === toolId) {
      return TOOLS[i];
    }
  }
  return null;
}

/**
 * 根据分类ID获取分类信息
 * @param {string} categoryId - 分类ID
 * @returns {Object|null} 分类信息
 */
function getCategoryById(categoryId) {
  var keys = Object.keys(CATEGORIES);
  for (var i = 0; i < keys.length; i++) {
    if (CATEGORIES[keys[i]].id === categoryId) {
      return CATEGORIES[keys[i]];
    }
  }
  return null;
}

/**
 * 获取分类列表（有序）
 * @returns {Array} 分类列表
 */
function getCategoryList() {
  return [
    CATEGORIES.LIFE_CALC,
    CATEGORIES.DATE_TIME,
    CATEGORIES.TEXT_PROC,
    CATEGORIES.IMAGE_TOOL,
    CATEGORIES.FUN_RANDOM
  ];
}

module.exports = {
  CATEGORIES: CATEGORIES,
  TOOLS: TOOLS,
  getToolsByCategory: getToolsByCategory,
  getToolById: getToolById,
  getCategoryById: getCategoryById,
  getCategoryList: getCategoryList
};
