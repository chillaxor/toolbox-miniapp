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
  { id: 'base64', name: 'Base64编解', category: 'text', icon: '🔐', path: '/pages/tools/base64/index', description: '文本编解码' },
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
  { id: 'password', name: '密码生成器', category: 'text', icon: '🔑', path: '/pages/tools/password/index', description: '随机安全密码生成' },
  { id: 'timestamp', name: '时间戳转换', category: 'text', icon: '⏱️', path: '/pages/tools/timestamp/index', description: 'Unix时间戳↔日期互转' },
  { id: 'textdedup', name: '文本去重排序', category: 'text', icon: '🔄', path: '/pages/tools/textdedup/index', description: '按行去重·排序处理' },
  { id: 'urlencode', name: 'URL编解码', category: 'text', icon: '🔗', path: '/pages/tools/urlencode/index', description: 'URL编码/解码转换' },
  { id: 'age', name: '年龄生肖', category: 'life', icon: '🎂', path: '/pages/tools/age/index', description: '年龄·生肖·星座计算' },
  { id: 'reaction', name: '反应测试', category: 'fun', icon: '⚡', path: '/pages/tools/reaction/index', description: '测试你的反应速度' },
  { id: 'anniversary', name: '纪念日', category: 'date', icon: '💕', path: '/pages/tools/anniversary/index', description: '重要日子倒计时·记录' },
  { id: 'gridcut', name: '九宫格切图', category: 'image', icon: '🧱', path: '/pages/tools/gridcut/index', description: '图片切割九宫格发布' },
  { id: 'danmaku', name: '弹幕墙', category: 'fun', icon: '💬', path: '/pages/tools/danmaku/index', description: '输入文字生成彩色弹幕' },
  { id: 'textdiff', name: '文本对比', category: 'text', icon: '🔍', path: '/pages/tools/textdiff/index', description: '两段文本逐行对比差异' },
  { id: 'memory', name: '记忆力训练', category: 'fun', icon: '🧠', path: '/pages/tools/memory/index', description: '方块闪烁记忆挑战' },
  { id: 'timediff', name: '时间差计算', category: 'date', icon: '⏲️', path: '/pages/tools/timediff/index', description: '两个时间点之间的差值' },
  { id: 'kinship', name: '亲戚称呼', category: 'life', icon: '👨‍👩‍👧‍👦', path: '/pages/tools/kinship/index', description: '亲戚关系称呼速查' },
  { id: 'truthordare', name: '真心话大冒险', category: 'fun', icon: '🎭', path: '/pages/tools/truthordare/index', description: '聚会必备真心话大冒险' },
  { id: 'newyearwish', name: '新年许愿', category: 'fun', icon: '🎋', path: '/pages/tools/newyearwish/index', description: '许下新年愿望·生成贺卡' },
  { id: 'chatbubble', name: '聊天气泡', category: 'fun', icon: '💬', path: '/pages/tools/chatbubble/index', description: '生成趣味聊天气泡截图' },
  // { id: 'idphoto', name: '证件照生成', category: 'image', icon: '📷', path: '/pages/tools/idphoto/index', description: '多尺寸证件照制作' },
  { id: 'brainage', name: '脑力测试', category: 'fun', icon: '🧠', path: '/pages/tools/brainage/index', description: '测试你的脑力年龄' },
  { id: 'hangingpicture', name: '挂画助手', category: 'life', icon: '🖼️', path: '/pages/tools/hangingpicture/index', description: '墙面画作排版规划' },
  { id: 'ruler', name: '虚拟尺子', category: 'life', icon: '📏', path: '/pages/tools/ruler/index', description: '手机屏幕变尺子测量' },
  { id: 'flashlight', name: '手电筒', category: 'life', icon: '🔦', path: '/pages/tools/flashlight/index', description: '一键开启闪光灯照明' },
  { id: 'watermark', name: '水印相机', category: 'image', icon: '📸', path: '/pages/tools/watermark/index', description: '拍照添加时间地点水印' },
  { id: 'scicalc', name: '科学计算器', category: 'life', icon: '🔬', path: '/pages/tools/scicalc/index', description: '科学计算·三角函数·对数' },
  { id: 'todolist', name: '待办清单', category: 'life', icon: '📝', path: '/pages/tools/todolist/index', description: '任务管理·优先级·进度追踪' },
  { id: 'vote', name: '投票决策', category: 'fun', icon: '🗳️', path: '/pages/tools/vote/index', description: '快速发起投票·统计结果' },
  { id: 'asciiart', name: 'ASCII艺术', category: 'text', icon: '🔤', path: '/pages/tools/asciiart/index', description: '输入文字生成ASCII字符画' },
  { id: 'mirror', name: '镜子', category: 'life', icon: '🪞', path: '/pages/tools/mirror/index', description: '前置摄像头全屏当镜子用' },
  { id: 'voicenote', name: '语音备忘录', category: 'life', icon: '🎙️', path: '/pages/tools/voicenote/index', description: '录音·列表管理·回放' },
  { id: 'teleprompter', name: '全屏提词器', category: 'text', icon: '📜', path: '/pages/tools/teleprompter/index', description: '文字自动滚动·演讲直播必备' },
  // { id: 'kaleidoscope', name: '万花筒', category: 'fun', icon: '🔮', path: '/pages/tools/kaleidoscope/index', description: '相机实时万花筒·旋转对称效果' },
  { id: 'countdown2', name: '全屏倒计时', category: 'date', icon: '⏱️', path: '/pages/tools/countdown2/index', description: '大数字全屏倒计时·会议煮面运动' },
  { id: 'scoreboard', name: '计分板', category: 'fun', icon: '🏆', path: '/pages/tools/scoreboard/index', description: '多人比分记录·球类桌游必备' },
  { id: 'gradient', name: '渐变色壁纸', category: 'image', icon: '🎨', path: '/pages/tools/gradient/index', description: '选颜色生成渐变壁纸·保存到相册' },
  { id: 'neontext', name: '流光文字', category: 'fun', icon: '✨', path: '/pages/tools/neontext/index', description: '霓虹流光动画文字效果' },
  { id: 'poetrygame', name: '诗词飞花令', category: 'text', icon: '🏮', path: '/pages/tools/poetrygame/index', description: '选字列出经典诗句·挑战模式' },
  { id: 'dailyquote', name: '人生格言', category: 'fun', icon: '💬', path: '/pages/tools/dailyquote/index', description: '每日一句名人名言·收藏复制' },
  { id: 'woodfish', name: '电子木鱼', category: 'fun', icon: '🪵', path: '/pages/tools/woodfish/index', description: '敲木鱼积功德·功德计数' },
  { id: 'miteguide', name: '螨虫指南', category: 'life', icon: '🔍', path: '/pages/tools/miteguide/index', description: '除螨方法·螨虫类型·预防指南' },
  { id: 'flowerlang', name: '花语图鉴', category: 'life', icon: '🌸', path: '/pages/tools/flowerlang/index', description: '55种花语查询·送花场景推荐' },
  { id: 'acupoint', name: '穴位图谱', category: 'life', icon: '📍', path: '/pages/tools/acupoint/index', description: '常见穴位查询·按摩养生指南' },
  { id: 'answerbook', name: '答案之书', category: 'fun', icon: '📖', path: '/pages/tools/answerbook/index', description: '心中想问题·翻开答案之书解惑' },
  { id: 'coloring', name: '涂色本', category: 'fun', icon: '🎨', path: '/pages/tools/coloring/index', description: '创意填色·放松解压·作品保存' },
  { id: 'paper', name: '打印稿纸', category: 'life', icon: '📄', path: '/pages/tools/paper/index', description: '自定义横线方格田字格·导出打印' },
  { id: 'textpaper', name: '文字填稿纸', category: 'life', icon: '✍️', path: '/pages/tools/textpaper/index', description: '粘贴文字自动填入稿纸格子·分页导出' },
  { id: 'fireworks', name: '烟花特效', category: 'fun', icon: '🎆', path: '/pages/tools/fireworks/index', description: '全屏烟花燃放·12种类型·点击发射' },
  { id: 'z2h', name: '字帖生成器', category: 'life', icon: '✍️', path: '/pages/tools/z2h/index', description: '自定义描红字帖·汉字拼音数字英文控笔' },
  { id: 'cheesytalk', name: '土味情话', category: 'fun', icon: '💕', path: '/pages/tools/cheesytalk/index', description: '随机土味情话·收藏·分享给TA' },
  // { id: 'babyname', name: '起名', category: 'life', icon: '👶', path: '/pages/tools/babyname/index', description: '输入姓氏·智能推荐名字' },
  { id: 'mbtitest', name: 'MBTI性格', category: 'fun', icon: '🧬', path: '/pages/tools/mbtitest/index', description: '专业MBTI·16型人格分析' },
  { id: 'game2048', name: '2048', category: 'fun', icon: '🔢', path: '/pages/tools/game2048/index', description: '经典2048数字合并·滑动挑战' },
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
