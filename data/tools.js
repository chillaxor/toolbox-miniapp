/**
 * 工具配置数据
 * 包含分类信息和工具列表
 */

const CATEGORIES = {
  LIFE_CALC: { id: 'life', name: '生活计算', color: '#FF6B35', bgColor: '#FFE5D9' },
  DATE_TIME: { id: 'date', name: '日期时间', color: '#4ECDC4', bgColor: '#D8F5F3' },
  TEXT_PROC: { id: 'text', name: '文本处理', color: '#45B058', bgColor: '#D9F0DC' },
  IMAGE_TOOL: { id: 'image', name: '图片工具', color: '#9B59B6', bgColor: '#EFD9F7' },
  FUN_RANDOM: { id: 'fun', name: '趣味随机', color: '#E74C3C', bgColor: '#FDE8E8' },
  STUDY: { id: 'study', name: '学习教育', color: '#2196F3', bgColor: '#E3F2FD' }
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
  { id: 'pdf2img', name: 'PDF转图片', category: 'image', icon: '📄', path: '/pages/tools/pdf2img/index', description: 'PDF文件转图片预览保存' },
  { id: 'pdf2word', name: 'PDF转Word', category: 'image', icon: '📝', path: '/pages/tools/pdf2word/index', description: 'PDF文件转Word文档·多格式输出' },
  { id: 'answereraser', name: '答案遮挡器', category: 'image', icon: '✏️', path: '/pages/tools/answereraser/index', description: '试卷图片涂抹遮挡答案·导出保存' },
  { id: 'paperclean', name: '试卷擦除', category: 'image', icon: '🧹', path: '/pages/tools/paperclean/index', description: 'AI智能识别并擦除手写笔迹·还原空白试卷' },
  { id: 'gifmaker', name: 'GIF制作器', category: 'image', icon: '🎞️', path: '/pages/tools/gifmaker/index', description: '多图合成GIF动图·调速·保存分享' },
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
  { id: 'idphoto', name: '证件照生成', category: 'image', icon: '📷', path: '/pages/tools/idphoto/index', description: '多尺寸证件照制作' },
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
  // { id: 'voicenote', name: '语音备忘录', category: 'life', icon: '🎙️', path: '/pages/tools/voicenote/index', description: '录音·列表管理·回放' },
  { id: 'teleprompter', name: '全屏提词器', category: 'text', icon: '📜', path: '/pages/tools/teleprompter/index', description: '文字自动滚动·演讲直播必备' },
  // { id: 'kaleidoscope', name: '万花筒', category: 'fun', icon: '🔮', path: '/pages/tools/kaleidoscope/index', description: '相机实时万花筒·旋转对称效果' },
  { id: 'countdown2', name: '全屏倒计时', category: 'date', icon: '⏱️', path: '/pages/tools/countdown2/index', description: '大数字全屏倒计时·会议煮面运动' },
  { id: 'scoreboard', name: '计分板', category: 'fun', icon: '🏆', path: '/pages/tools/scoreboard/index', description: '多人比分记录·球类桌游必备' },
  { id: 'gradient', name: '渐变色壁纸', category: 'image', icon: '🎨', path: '/pages/tools/gradient/index', description: '选颜色生成渐变壁纸·保存到相册' },
  { id: 'neontext', name: '流光文字', category: 'fun', icon: '✨', path: '/pages/tools/neontext/index', description: '霓虹流光动画文字效果' },
  { id: 'poetrygame', name: '诗词飞花令', category: 'text', icon: '🏮', path: '/pages/tools/poetrygame/index', description: '选字列出经典诗句·挑战模式' },
  { id: 'dailyquote', name: '人生格言', category: 'fun', icon: '💬', path: '/pages/tools/dailyquote/index', description: '每日一句名人名言·收藏复制' },
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
  // { id: 'game2048', name: '2048', category: 'fun', icon: '🔢', path: '/pages/tools/game2048/index', description: '经典2048数字合并·滑动挑战' },
  { id: 'guessnumber', name: '猜数字', category: 'fun', icon: '🔢', path: '/pages/tools/guessnumber/index', description: '猜数字大小·越猜越接近答案' },
  { id: 'whoisspy', name: '谁是卧底', category: 'fun', icon: '🕵️', path: '/pages/tools/whoisspy/index', description: '聚会派对·词语卧底桌游' },
  { id: 'whackmole', name: '打地鼠', category: 'fun', icon: '🔨', path: '/pages/tools/whackmole/index', description: '限时打地鼠·考验手速' },
  { id: 'gomoku', name: '五子棋', category: 'fun', icon: '⚫', path: '/pages/tools/gomoku/index', description: '经典五子棋·双人对战' },
  { id: 'snake', name: '贪吃蛇', category: 'fun', icon: '🐍', path: '/pages/tools/snake/index', description: '经典贪吃蛇·滑动/按键操控·速度可调' },
  { id: 'shopping', name: '模拟超市购物', category: 'fun', icon: '🛒', path: '/pages/tools/shopping/index', description: '给预算选商品·学习理财找零' },
  { id: 'growth-tracker', name: '身高体重记录', category: 'life', icon: '📏', path: '/pages/tools/growth-tracker/index', description: '定期记录身高体重·生长曲线·标准对比' },
  { id: 'multiplication', name: '乘法口诀表', category: 'study', icon: '✖️', path: '/pages/tools/multiplication/index', description: '背诵九九乘法表·抽查练习·速度测试' },
  { id: 'mental-math', name: '口算心算', category: 'study', icon: '🧮', path: '/pages/tools/mental-math/index', description: '加减乘除口算练习·难度可调·计时挑战' },
  { id: 'dictation', name: '听写练习', category: 'study', icon: '🎧', path: '/pages/tools/dictation/index', description: '输入文字语音朗读·跟写跟读·学习助手' },
  { id: 'poetry', name: '古诗文背诵', category: 'study', icon: '📜', path: '/pages/tools/poetry/index', description: '古诗文填空背诵·逐句过关·看提示想诗句' },
  { id: 'idiom-stories', name: '成语故事', category: 'study', icon: '📚', path: '/pages/tools/idiom-stories/index', description: '经典成语故事阅读·拼音释义·学习收藏' },
  { id: 'math27', name: '算27点', category: 'study', icon: '🎯', path: '/pages/tools/math27/index', description: '4个数字算出27·数学运算训练' },
  { id: 'pinyin-learn', name: '拼音学习', category: 'study', icon: '🅰️', path: '/pages/tools/pinyin-learn/index', description: '声母韵母整体认读·发音练习·声调标注' },
  { id: 'alpha-learn', name: '英语字母卡', category: 'study', icon: '🔤', path: '/pages/tools/alpha-learn/index', description: '26个字母学习·大小写配对·首字母练习' },
  { id: 'focus-game', name: '专注力互动', category: 'study', icon: '🎯', path: '/pages/tools/focus-game/index', description: '舒尔特方格·找不同·颜色干扰·记忆翻牌' },
  { id: 'stacking', name: '叠叠乐', category: 'fun', icon: '🏗️', path: '/pages/tools/stacking/index', description: '方块下落对齐·越高越难·完美连击加分' },
  { id: 'cardmatch', name: '翻牌配对', category: 'fun', icon: '🃏', path: '/pages/tools/cardmatch/index', description: '翻转卡牌找到相同图案·计时计步·难度递增' },
  { id: 'pomodoro', name: '番茄钟', category: 'life', icon: '🍅', path: '/pages/tools/pomodoro/index', description: '25分钟专注+5分钟休息·白噪音·每日统计' },
  { id: 'lifecalendar', name: '人生日历', category: 'life', icon: '📅', path: '/pages/tools/lifecalendar/index', description: '输入生日·可视化已过/剩余周数·珍惜时间' },
  { id: 'dynasty', name: '历史朝代表', category: 'study', icon: '📜', path: '/pages/tools/dynasty/index', description: '中国历史朝代时间轴·排序互动·历史问答' },
  { id: 'geo-quiz', name: '地理知识问答', category: 'study', icon: '🌍', path: '/pages/tools/geo-quiz/index', description: '中国地理·世界地理·随机10题·知识挑战' },
  { id: 'tang-poetry', name: '唐诗三百首', category: 'study', icon: '📖', path: '/pages/tools/tang-poetry/index', description: '唐诗背诵·填空练习·赏析学习' },
  { id: 'math-formulas', name: '数学公式大全', category: 'study', icon: '📐', path: '/pages/tools/math-formulas/index', description: '小学到高中数学公式速查·搜索收藏' },
  // { id: 'cert-expiry', name: '证件有效期', category: 'life', icon: '🪪', path: '/pages/tools/cert-expiry/index', description: '身份证护照驾照有效期管理·到期提醒' },
  { id: 'cal-wallpaper', name: '日历壁纸', category: 'image', icon: '📅', path: '/pages/tools/cal-wallpaper/index', description: '选图片+当月日历生成手机壁纸·保存到相册' },
  { id: 'onestroke', name: '一笔画', category: 'fun', icon: '✏️', path: '/pages/tools/onestroke/index', description: '数学逻辑一笔画·欧拉路径·关卡挑战' },
  { id: 'periodic-table', name: '元素周期表', category: 'study', icon: '⚛️', path: '/pages/tools/periodic-table/index', description: '化学元素周期表·搜索·分类筛选·详细信息' },
  { id: 'daily-photo', name: '每日一拍', category: 'life', icon: '📸', path: '/pages/tools/daily-photo/index', description: '每天拍一张照片·日历回顾·时光轴·连续打卡' },
  { id: 'typing-test', name: '打字速度', category: 'study', icon: '⌨️', path: '/pages/tools/typing-test/index', description: '测试打字速度WPM·准确率统计·三种难度' },
  { id: 'text2img', name: '文字转图片', category: 'image', icon: '📝', path: '/pages/tools/text2img/index', description: '输入文字生成精美长图·8种模板·适合发朋友圈' },
  { id: 'imgmerge', name: '图片拼接', category: 'image', icon: '🧩', path: '/pages/tools/imgmerge/index', description: '多张图片上下/左右拼接成长图·保存到相册' },
  { id: 'picpuzzle', name: '照片拼图', category: 'fun', icon: '🧩', path: '/pages/tools/picpuzzle/index', description: '选图切块打乱重拼·3种难度·计时挑战' },
  { id: 'lovecard', name: '情话卡片', category: 'fun', icon: '💕', path: '/pages/tools/lovecard/index', description: '每日情话·精美卡片·保存分享' },
  { id: 'pixelavatar', name: '像素头像', category: 'image', icon: '👾', path: '/pages/tools/pixelavatar/index', description: '输入名字生成专属像素风头像' },
  { id: 'watermarkremove', name: '去水印', category: 'image', icon: '🧽', path: '/pages/tools/watermarkremove/index', description: 'AI智能去水印+手动涂抹修补' },
  { id: 'witchpoison', name: '神秘陷阱', category: 'fun', icon: '🧪', path: '/pages/tools/witchpoison/index', description: '神秘陷阱猜猜看·单人双人都能玩' },
  { id: 'commandreaction', name: '指令反应', category: 'fun', icon: '🕹️', path: '/pages/tools/commandreaction/index', description: '手机下指令·你来做动作·测反应抗干扰' },
  { id: 'drawguess', name: '多图编号抢答画猜', category: 'fun', icon: '🎨', path: '/pages/tools/drawguess/index', description: '多图编号·线下画·抢答猜词·聚会必备' },
  { id: 'guessword', name: '头顶猜词', category: 'fun', icon: '📱', path: '/pages/tools/guessword/index', description: '手机顶头上·对面描述·翻手机切词·双人聚会' },
  { id: 'clueguess', name: '小小侦探', category: 'fun', icon: '🕵️', path: '/pages/tools/clueguess/index', description: '搜集线索·缩圈排除·指认凶手·侦探徽章' },
  { id: 'friendship', name: '友谊修复', category: 'fun', icon: '🤝', path: '/pages/tools/friendship/index', description: '模拟吵架·识别情绪·选对方式和解·关系升温' },
  { id: 'pipeconnect', name: '水管连接', category: 'fun', icon: '🚰', path: '/pages/tools/pipeconnect/index', description: '旋转管道连通水路·考验空间想象力' },
  { id: 'codeblock', name: '编程启蒙', category: 'study', icon: '🤖', path: '/pages/tools/codeblock/index', description: '拖拽指令块控制角色移动·图形化编程启蒙' },
  { id: 'numberbomb', name: '数字炸弹', category: 'fun', icon: '💣', path: '/pages/tools/numberbomb/index', description: '轮流点数字·谁点中藏起来的炸弹谁就爆炸·聚会必备' },
  { id: 'dontpress', name: '别按这个按钮', category: 'fun', icon: '🚫', path: '/pages/tools/dontpress/index', description: '各种诱惑按钮·忍住不按·坚持越久分越高·反直觉挑战' },
  { id: 'reverse', name: '反着来', category: 'fun', icon: '🙃', path: '/pages/tools/reverse/index', description: '屏幕让你点左你偏点右·反向反应挑战·连击计分' },
  { id: 'balancebeam', name: '平衡木', category: 'fun', icon: '⚖️', path: '/pages/tools/balancebeam/index', description: '左右倾斜手机·保持小球在木条上不掉落·坚持越久分越高' },
  { id: 'grabcolor', name: '抢颜色', category: 'fun', icon: '🌈', path: '/pages/tools/grabcolor/index', description: '斯特鲁普效应·字义和颜色打架·两人抢点正确颜色·手快脑稳者胜' },
  { id: 'subtract', name: '减法游戏', category: 'fun', icon: '➖', path: '/pages/tools/subtract/index', description: '一堆石子轮流拿·拿到最后赢(可反转)·(K+1)倍数必胜策略·同屏双人' },
  { id: 'nim', name: 'Nim游戏', category: 'fun', icon: '🪨', path: '/pages/tools/nim/index', description: '多堆石子轮流拿·Nim和必胜策略·正常/misère/限拿K/多堆/随机事件变体·同屏双人' },
  { id: 'leftright', name: '左右互搏', category: 'fun', icon: '🥊', path: '/pages/tools/leftright/index', description: '屏幕左右分屏·两人各答各题却互相干扰·闪光/变色/加速/偷题·能量连击放大招·限时/生存/合作' },
  { id: 'splitball', name: '分裂球', category: 'fun', icon: '⚽', path: '/pages/tools/splitball/index', description: '中央分裂双色球·点自己颜色得分·假球/变色/反弹/连发·限时/生存/无尽·斯特鲁普/互换/合作变体·同屏双人' }
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
    CATEGORIES.FUN_RANDOM,
    CATEGORIES.STUDY
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
