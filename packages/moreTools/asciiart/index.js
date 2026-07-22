// ASCII艺术生成器
// 支持方块风格和线条风格，支持中文输入（自动转换为拼音）

// 拼音映射表（覆盖常用汉字，约500字）
var pinyinMap = {
  // 称谓
  '你': 'ni', '好': 'hao', '我': 'wo', '他': 'ta', '她': 'ta', '它': 'ta',
  '们': 'men', '您': 'nin', '咱': 'zan', '谁': 'shui',
  '爸': 'ba', '妈': 'ma', '哥': 'ge', '姐': 'jie', '弟': 'di', '妹': 'mei',
  '爷': 'ye', '奶': 'nai', '叔': 'shu', '姨': 'yi', '舅': 'jiu', '姑': 'gu',
  '朋': 'peng', '友': 'you', '师': 'shi',
  // 基本动词
  '是': 'shi', '有': 'you', '在': 'zai', '不': 'bu', '来': 'lai', '去': 'qu',
  '看': 'kan', '听': 'ting', '说': 'shuo', '读': 'du', '写': 'xie', '吃': 'chi',
  '喝': 'he', '睡': 'shui', '走': 'zou', '跑': 'pao', '飞': 'fei', '跳': 'tiao',
  '开': 'kai', '关': 'guan', '想': 'xiang', '知': 'zhi', '要': 'yao', '做': 'zuo',
  '给': 'gei', '拿': 'na', '放': 'fang', '买': 'mai', '卖': 'mai', '用': 'yong',
  '问': 'wen', '答': 'da', '叫': 'jiao', '找': 'zhao', '等': 'deng', '坐': 'zuo',
  '站': 'zhan', '立': 'li', '哭': 'ku', '笑': 'xiao', '玩': 'wan', '学': 'xue',
  '教': 'jiao', '带': 'dai', '送': 'song', '回': 'hui', '到': 'dao', '过': 'guo',
  '起': 'qi', '住': 'zhu', '活': 'huo', '死': 'si', '生': 'sheng', '怕': 'pa',
  '爱': 'ai', '恨': 'hen', '懂': 'dong', '忘': 'wang', '记': 'ji', '信': 'xin',
  // 基本名词
  '人': 'ren', '天': 'tian', '地': 'di', '山': 'shan', '水': 'shui', '火': 'huo',
  '木': 'mu', '金': 'jin', '土': 'tu', '风': 'feng', '雨': 'yu', '雪': 'xue',
  '云': 'yun', '日': 'ri', '月': 'yue', '星': 'xing', '花': 'hua', '草': 'cao',
  '树': 'shu', '河': 'he', '海': 'hai', '湖': 'hu', '江': 'jiang', '路': 'lu',
  '门': 'men', '窗': 'chuang', '房': 'fang', '家': 'jia', '车': 'che', '船': 'chuan',
  '飞': 'fei', '机': 'ji', '书': 'shu', '笔': 'bi', '纸': 'zhi', '字': 'zi',
  '话': 'hua', '声': 'sheng', '光': 'guang', '色': 'se', '红': 'hong', '黄': 'huang',
  '蓝': 'lan', '绿': 'lv', '白': 'bai', '黑': 'hei', '手': 'shou', '脚': 'jiao',
  '头': 'tou', '眼': 'yan', '耳': 'er', '口': 'kou', '鼻': 'bi', '心': 'xin',
  '饭': 'fan', '菜': 'cai', '肉': 'rou', '鱼': 'yu', '鸡': 'ji', '猪': 'zhu',
  '狗': 'gou', '猫': 'mao', '马': 'ma', '牛': 'niu', '羊': 'yang', '鸟': 'niao',
  '虫': 'chong', '龙': 'long', '虎': 'hu', '象': 'xiang', '蛇': 'she',
  // 数字
  '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu',
  '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
  '百': 'bai', '千': 'qian', '万': 'wan', '亿': 'yi', '零': 'ling',
  // 时间
  '年': 'nian', '时': 'shi', '分': 'fen', '秒': 'miao', '点': 'dian',
  '春': 'chun', '夏': 'xia', '秋': 'qiu', '冬': 'dong', '今': 'jin',
  '明': 'ming', '昨': 'zuo', '早': 'zao', '晚': 'wan', '午': 'wu',
  '星': 'xing', '期': 'qi',
  // 方位
  '上': 'shang', '下': 'xia', '左': 'zuo', '右': 'you', '前': 'qian',
  '后': 'hou', '东': 'dong', '西': 'xi', '南': 'nan', '北': 'bei',
  '中': 'zhong', '内': 'nei', '外': 'wai',
  // 形容词
  '大': 'da', '小': 'xiao', '多': 'duo', '少': 'shao', '长': 'chang',
  '短': 'duan', '高': 'gao', '低': 'di', '快': 'kuai', '慢': 'man',
  '新': 'xin', '旧': 'jiu', '老': 'lao', '年': 'nian', '轻': 'qing',
  '重': 'zhong', '热': 're', '冷': 'leng', '干': 'gan', '湿': 'shi',
  '美': 'mei', '丑': 'chou', '好': 'hao', '坏': 'huai', '真': 'zhen',
  '假': 'jia', '对': 'dui', '错': 'cuo', '远': 'yuan', '近': 'jin',
  '难': 'nan', '易': 'yi', '深': 'shen', '浅': 'qian', '满': 'man',
  '空': 'kong', '暗': 'an', '亮': 'liang',
  // 其他常用
  '这': 'zhe', '那': 'na', '什': 'shen', '么': 'me', '怎': 'zen',
  '样': 'yang', '候': 'hou', '间': 'jian', '道': 'dao', '事': 'shi',
  '情': 'qing', '意': 'yi', '气': 'qi', '力': 'li', '国': 'guo',
  '世': 'shi', '界': 'jie', '世': 'shi', '界': 'jie', '世': 'shi',
  '和': 'he', '与': 'yu', '但': 'dan', '就': 'jiu', '都': 'dou',
  '只': 'zhi', '也': 'ye', '还': 'hai', '很': 'hen', '太': 'tai',
  '最': 'zui', '更': 'geng', '比': 'bi', '从': 'cong', '到': 'dao',
  '把': 'ba', '被': 'bei', '让': 'rang', '向': 'xiang', '往': 'wang',
  '请': 'qing', '谢': 'xie', '对': 'dui', '起': 'qi', '没': 'mei',
  '能': 'neng', '会': 'hui', '可': 'ke', '以': 'yi', '应': 'ying',
  '该': 'gai', '需': 'xu', '必': 'bi', '已': 'yi', '经': 'jing',
  '正': 'zheng', '在': 'zai', '着': 'zhe', '了': 'le', '的': 'de',
  '地': 'di', '得': 'de', '吗': 'ma', '呢': 'ne', '啊': 'a',
  '呀': 'ya', '吧': 'ba', '哦': 'o', '嗯': 'en',
  // 祝福语常用
  '福': 'fu', '禄': 'lu', '寿': 'shou', '喜': 'xi', '财': 'cai',
  '发': 'fa', '吉': 'ji', '祥': 'xiang', '如': 'ru', '安': 'an',
  '康': 'kang', '宁': 'ning', '平': 'ping', '永': 'yong', '幸': 'xing',
  '运': 'yun', '功': 'gong', '利': 'li', '成': 'cheng', '圆': 'yuan',
  '梦': 'meng', '实': 'shi', '现': 'xian', '健': 'jian',
  // 更多常用字
  '王': 'wang', '李': 'li', '张': 'zhang', '刘': 'liu', '陈': 'chen',
  '杨': 'yang', '赵': 'zhao', '黄': 'huang', '周': 'zhou', '吴': 'wu',
  '徐': 'xu', '孙': 'sun', '胡': 'hu', '朱': 'zhu', '高': 'gao',
  '林': 'lin', '何': 'he', '郭': 'guo', '马': 'ma', '罗': 'luo',
  '学': 'xue', '工': 'gong', '作': 'zuo', '业': 'ye', '商': 'shang',
  '医': 'yi', '法': 'fa', '科': 'ke', '技': 'ji', '术': 'shu',
  '电': 'dian', '脑': 'nao', '网': 'wang', '手': 'shou', '游': 'you',
  '戏': 'xi', '音': 'yin', '乐': 'le', '电': 'dian', '影': 'ying',
  '视': 'shi', '图': 'tu', '片': 'pian', '文': 'wen', '数': 'shu',
  '据': 'ju', '信': 'xin', '息': 'xi', '报': 'bao', '新': 'xin',
  '闻': 'wen', '天': 'tian', '气': 'qi', '预': 'yu', '报': 'bao',
  '打': 'da', '电': 'dian', '话': 'hua', '发': 'fa', '短': 'duan',
  '消': 'xiao', '收': 'shou', '红': 'hong', '包': 'bao',
  '转': 'zhuan', '账': 'zhang', '支': 'zhi', '付': 'fu',
  '购': 'gou', '物': 'wu', '外': 'wai', '卖': 'mai', '快': 'kuai',
  '递': 'di', '地': 'di', '铁': 'tie', '公': 'gong', '交': 'jiao',
  '出': 'chu', '租': 'zu', '酒': 'jiu', '店': 'dian', '餐': 'can',
  '馆': 'guan', '超': 'chao', '市': 'shi', '银': 'yin', '行': 'hang',
  '医': 'yi', '院': 'yuan', '学': 'xue', '校': 'xiao',
  '图': 'tu', '书': 'shu', '馆': 'guan', '公': 'gong', '园': 'yuan',
  '停': 'ting', '场': 'chang', '机': 'ji', '场': 'chang',
  '火': 'huo', '车': 'che', '站': 'zhan',
  '游': 'you', '泳': 'yong', '跑': 'pao', '步': 'bu', '球': 'qiu',
  '篮': 'lan', '足': 'zu', '乒': 'ping', '乓': 'pang',
  '新': 'xin', '年': 'nian', '快': 'kuai', '乐': 'le',
  '恭': 'gong', '喜': 'xi', '财': 'cai',
  '万': 'wan', '事': 'shi', '如': 'ru', '意': 'yi',
  '心': 'xin', '想': 'xiang', '事': 'shi', '成': 'cheng',
  '马': 'ma', '到': 'dao', '功': 'gong',
  '身': 'shen', '体': 'ti', '健': 'jian', '康': 'kang',
  '工': 'gong', '作': 'zuo', '顺': 'shun', '利': 'li',
  '学': 'xue', '业': 'ye', '进': 'jin', '步': 'bu',
  '爱': 'ai', '情': 'qing', '甜': 'tian', '蜜': 'mi',
  '家': 'jia', '庭': 'ting', '和': 'he', '睦': 'mu',
  '平': 'ping', '安': 'an',
  '财': 'cai', '源': 'yuan', '广': 'guang', '进': 'jin',
  '金': 'jin', '玉': 'yu', '满': 'man', '堂': 'tang',
  '大': 'da', '展': 'zhan', '宏': 'hong', '图': 'tu',
  '鹏': 'peng', '程': 'cheng', '万': 'wan', '里': 'li',
  '步': 'bu', '步': 'bu', '高': 'gao', '升': 'sheng',
  '蒸': 'zheng', '蒸': 'zheng', '日': 'ri', '上': 'shang',
  '前': 'qian', '程': 'cheng', '似': 'si', '锦': 'jin',
  '鱼': 'yu', '跃': 'yue', '龙': 'long', '门': 'men',
  '飞': 'fei', '黄': 'huang', '腾': 'teng', '达': 'da',
  '一': 'yi', '帆': 'fan', '风': 'feng', '顺': 'shun',
  '百': 'bai', '年': 'nian', '好': 'hao', '合': 'he',
  '永': 'yong', '结': 'jie', '同': 'tong', '心': 'xin',
  '白': 'bai', '头': 'tou', '偕': 'xie', '老': 'lao',
  '早': 'zao', '生': 'sheng', '贵': 'gui', '子': 'zi',
  '儿': 'er', '孙': 'sun', '满': 'man', '堂': 'tang',
  '天': 'tian', '伦': 'lun', '之': 'zhi', '乐': 'le',
  '阖': 'he', '家': 'jia', '欢': 'huan', '乐': 'le',
  '开': 'kai', '心': 'xin', '每': 'mei', '天': 'tian',
  '笑': 'xiao', '口': 'kou', '常': 'chang', '开': 'kai',
  '健': 'jian', '康': 'kang', '长': 'chang', '寿': 'shou',
  '福': 'fu', '如': 'ru', '东': 'dong', '海': 'hai',
  '寿': 'shou', '比': 'bi', '南': 'nan', '山': 'shan',
  '日': 'ri', '月': 'yue', '长': 'chang', '明': 'ming',
  '松': 'song', '鹤': 'he', '延': 'yan', '年': 'nian',
  '寿': 'shou', '星': 'xing', '高': 'gao', '照': 'zhao',
  '福': 'fu', '星': 'xing', '高': 'gao', '照': 'zhao',
  '吉': 'ji', '祥': 'xiang', '如': 'ru', '意': 'yi',
  '万': 'wan', '事': 'shi', '大': 'da', '吉': 'ji',
  '五': 'wu', '福': 'fu', '临': 'lin', '门': 'men',
  '三': 'san', '阳': 'yang', '开': 'kai', '泰': 'tai',
  '龙': 'long', '马': 'ma', '精': 'jing', '神': 'shen',
  '生': 'sheng', '意': 'yi', '兴': 'xing', '隆': 'long',
  '招': 'zhao', '财': 'cai', '进': 'jin', '宝': 'bao',
  '恭': 'gong', '贺': 'he', '新': 'xin', '禧': 'xi',
  '岁': 'sui', '岁': 'sui', '平': 'ping', '安': 'an',
  '年': 'nian', '年': 'nian', '有': 'you', '余': 'yu',
  '心': 'xin', '想': 'xiang', '事': 'shi', '成': 'cheng',
  '步': 'bu', '步': 'bu', '高': 'gao', '升': 'sheng',
  '大': 'da', '吉': 'ji', '大': 'da', '利': 'li',
  '好': 'hao', '运': 'yun', '连': 'lian', '连': 'lian',
  '快': 'kuai', '乐': 'le', '幸': 'xing', '福': 'fu',
  '永': 'yong', '远': 'yuan', '幸': 'xing', '福': 'fu'
};

// 将中文转拼音的函数，返回 {text, missing}
function convertToPinyin(text) {
  var result = '';
  var missingChars = [];
  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    if (pinyinMap[char]) {
      result += pinyinMap[char].toUpperCase();
    } else if (/^[a-zA-Z0-9\s]$/.test(char)) {
      result += char;
    } else if (/[\u4e00-\u9fa5]/.test(char)) {
      // 中文但未收录
      missingChars.push(char);
      result += '?';
    } else {
      // 非中文非英文数字，跳过
      continue;
    }
  }
  return { text: result, missing: missingChars };
}

var blockFont = {
  'A': [
    ' ███ ',
    '█   █',
    '█████',
    '█   █',
    '█   █'
  ],
  'B': [
    '████ ',
    '█   █',
    '████ ',
    '█   █',
    '████ '
  ],
  'C': [
    ' ████',
    '█    ',
    '█    ',
    '█    ',
    ' ████'
  ],
  'D': [
    '████ ',
    '█   █',
    '█   █',
    '█   █',
    '████ '
  ],
  'E': [
    '█████',
    '█    ',
    '████ ',
    '█    ',
    '█████'
  ],
  'F': [
    '█████',
    '█    ',
    '████ ',
    '█    ',
    '█    '
  ],
  'G': [
    ' ████',
    '█    ',
    '█  ██',
    '█   █',
    ' ███ '
  ],
  'H': [
    '█   █',
    '█   █',
    '█████',
    '█   █',
    '█   █'
  ],
  'I': [
    '█████',
    '  █  ',
    '  █  ',
    '  █  ',
    '█████'
  ],
  'J': [
    '█████',
    '    █',
    '    █',
    '█   █',
    ' ███ '
  ],
  'K': [
    '█   █',
    '█  █ ',
    '███  ',
    '█  █ ',
    '█   █'
  ],
  'L': [
    '█    ',
    '█    ',
    '█    ',
    '█    ',
    '█████'
  ],
  'M': [
    '█   █',
    '██ ██',
    '█ █ █',
    '█   █',
    '█   █'
  ],
  'N': [
    '█   █',
    '██  █',
    '█ █ █',
    '█  ██',
    '█   █'
  ],
  'O': [
    ' ███ ',
    '█   █',
    '█   █',
    '█   █',
    ' ███ '
  ],
  'P': [
    '████ ',
    '█   █',
    '████ ',
    '█    ',
    '█    '
  ],
  'Q': [
    ' ███ ',
    '█   █',
    '█ █ █',
    '█  ██',
    ' ████'
  ],
  'R': [
    '████ ',
    '█   █',
    '████ ',
    '█  █ ',
    '█   █'
  ],
  'S': [
    ' ████',
    '█    ',
    ' ███ ',
    '    █',
    '████ '
  ],
  'T': [
    '█████',
    '  █  ',
    '  █  ',
    '  █  ',
    '  █  '
  ],
  'U': [
    '█   █',
    '█   █',
    '█   █',
    '█   █',
    ' ███ '
  ],
  'V': [
    '█   █',
    '█   █',
    '█   █',
    ' █ █ ',
    '  █  '
  ],
  'W': [
    '█   █',
    '█   █',
    '█ █ █',
    '██ ██',
    '█   █'
  ],
  'X': [
    '█   █',
    ' █ █ ',
    '  █  ',
    ' █ █ ',
    '█   █'
  ],
  'Y': [
    '█   █',
    ' █ █ ',
    '  █  ',
    '  █  ',
    '  █  '
  ],
  'Z': [
    '█████',
    '   █ ',
    '  █  ',
    ' █   ',
    '█████'
  ],
  '0': [
    ' ███ ',
    '█   █',
    '█   █',
    '█   █',
    ' ███ '
  ],
  '1': [
    '  █  ',
    ' ██  ',
    '  █  ',
    '  █  ',
    '█████'
  ],
  '2': [
    ' ███ ',
    '█   █',
    '  ██ ',
    ' █   ',
    '█████'
  ],
  '3': [
    '████ ',
    '    █',
    ' ███ ',
    '    █',
    '████ '
  ],
  '4': [
    '█   █',
    '█   █',
    '█████',
    '    █',
    '    █'
  ],
  '5': [
    '█████',
    '█    ',
    '████ ',
    '    █',
    '████ '
  ],
  '6': [
    ' ████',
    '█    ',
    '████ ',
    '█   █',
    ' ███ '
  ],
  '7': [
    '█████',
    '   █ ',
    '  █  ',
    ' █   ',
    '█    '
  ],
  '8': [
    ' ███ ',
    '█   █',
    ' ███ ',
    '█   █',
    ' ███ '
  ],
  '9': [
    ' ███ ',
    '█   █',
    ' ████',
    '    █',
    '████ '
  ],
  ' ': [
    '     ',
    '     ',
    '     ',
    '     ',
    '     '
  ],
  '?': [
    ' ███ ',
    '█   █',
    '  ██ ',
    '     ',
    '  █  '
  ]
};

var lineFont = {
  'A': [
    '  _  ',
    ' / \\ ',
    '/_- \\',
    '| | |',
    '|_|_|'
  ],
  'B': [
    '| _ \\',
    '|  _)',
    '| _ <',
    '|  _)',
    '|___/'
  ],
  'C': [
    ' /--\\',
    '|    ',
    '|    ',
    '|    ',
    ' \\--/'
  ],
  'D': [
    '| _ \\',
    '| | |',
    '| | |',
    '| | |',
    '|___/'
  ],
  'E': [
    '|___ ',
    '|    ',
    '|___ ',
    '|    ',
    '|___ '
  ],
  'F': [
    '|___ ',
    '|    ',
    '|___ ',
    '|    ',
    '|    '
  ],
  'G': [
    ' /--\\',
    '|    ',
    '| -| ',
    '|  | ',
    ' \\_-/'
  ],
  'H': [
    '|   |',
    '|   |',
    '|---|',
    '|   |',
    '|   |'
  ],
  'I': [
    '_____',
    '  |  ',
    '  |  ',
    '  |  ',
    '_____'
  ],
  'J': [
    '_____',
    '    |',
    '    |',
    '|   |',
    ' \\_/ '
  ],
  'K': [
    '|  / ',
    '| /  ',
    '|<   ',
    '| \\  ',
    '|  \\ '
  ],
  'L': [
    '|    ',
    '|    ',
    '|    ',
    '|    ',
    '|___ '
  ],
  'M': [
    '|\\/| ',
    '|  | ',
    '|  | ',
    '|  | ',
    '|  | '
  ],
  'N': [
    '|\\ | ',
    '| \\| ',
    '|  | ',
    '|  | ',
    '|  | '
  ],
  'O': [
    ' /-\\ ',
    '|   |',
    '|   |',
    '|   |',
    ' \\_/ '
  ],
  'P': [
    '| _ \\',
    '|  _)',
    '|___/',
    '|    ',
    '|    '
  ],
  'Q': [
    ' /-\\ ',
    '|   |',
    '| \\ |',
    '|  \\|',
    ' \\_/\\'
  ],
  'R': [
    '| _ \\',
    '|  _)',
    '|_ / ',
    '| \\  ',
    '|  \\ '
  ],
  'S': [
    ' /__ ',
    '|    ',
    ' \\_\\ ',
    '    |',
    '\\__/ '
  ],
  'T': [
    '_____',
    '  |  ',
    '  |  ',
    '  |  ',
    '  |  '
  ],
  'U': [
    '|   |',
    '|   |',
    '|   |',
    '|   |',
    ' \\_/ '
  ],
  'V': [
    '|   |',
    '|   |',
    ' \\ / ',
    '  V  ',
    '     '
  ],
  'W': [
    '|   |',
    '|   |',
    '| | |',
    '|/ \\|',
    '     '
  ],
  'X': [
    '\\   /',
    ' \\ / ',
    '  X  ',
    ' / \\ ',
    '/   \\'
  ],
  'Y': [
    '\\   /',
    ' \\ / ',
    '  |  ',
    '  |  ',
    '  |  '
  ],
  'Z': [
    '_____',
    '   / ',
    '  /  ',
    ' /   ',
    '/____'
  ],
  '0': [
    ' /-\\ ',
    '|  /|',
    '| / |',
    '|/  |',
    ' \\_/ '
  ],
  '1': [
    '  |  ',
    ' /|  ',
    '  |  ',
    '  |  ',
    '_____'
  ],
  '2': [
    ' /-\\ ',
    '    |',
    '  _/ ',
    ' /   ',
    '/___ '
  ],
  '3': [
    '__-\\ ',
    '    |',
    '  _/ ',
    '    |',
    '\\__-/'
  ],
  '4': [
    '|   |',
    '|   |',
    '\\___|',
    '    |',
    '    |'
  ],
  '5': [
    '\\___ ',
    '|    ',
    '|___ ',
    '    |',
    '\\___/'
  ],
  '6': [
    ' /-\\ ',
    '|    ',
    '|___ ',
    '|   |',
    ' \\_/ '
  ],
  '7': [
    '\\___/',
    '   / ',
    '  /  ',
    ' /   ',
    '/    '
  ],
  '8': [
    ' /-\\ ',
    '|   |',
    ' \\_/ ',
    '|   |',
    ' \\_/ '
  ],
  '9': [
    ' /-\\ ',
    '|   |',
    ' \\__|',
    '    |',
    '\\___/'
  ],
  ' ': [
    '     ',
    '     ',
    '     ',
    '     ',
    '     '
  ],
  '?': [
    ' /-\\ ',
    '    |',
    '  _/ ',
    '     ',
    '  o  '
  ]
};

Page({
  _inputValue: '',

  data: {
    inputText: '',
    result: '',
    missingTip: '',
    currentStyle: 'block',
    styleOptions: [
      { key: 'block', label: '方块风格' },
      { key: 'line', label: '线条风格' }
    ]
  },

  onInput: function (e) {
    var val = (e.detail && e.detail.value) || '';
    this._inputValue = val;
    this.setData({ inputText: val });
  },

  onSelectStyle: function (e) {
    var style = e.currentTarget.dataset.style;
    this.setData({ currentStyle: style });
  },

  onGenerate: function () {
    var text = (this._inputValue || this.data.inputText || '').trim();
    if (!text) {
      wx.showToast({ title: '请输入文本', icon: 'none' });
      return;
    }

    var processedText = text;
    var missingTip = '';

    // 检测是否有中文，如有则转拼音
    if (/[\u4e00-\u9fa5]/.test(text)) {
      var result = convertToPinyin(text);
      processedText = result.text;
      if (result.missing.length > 0) {
        missingTip = '以下汉字暂不支持，已用?替代：' + result.missing.join('、');
      }
      if (!processedText) {
        wx.showToast({ title: '无法转换', icon: 'none' });
        return;
      }
    }

    var upper = processedText.toUpperCase();
    var fontMap = this.data.currentStyle === 'block' ? blockFont : lineFont;
    var lines = ['', '', '', '', ''];
    var i, j, ch, charArt;

    for (i = 0; i < upper.length; i++) {
      ch = upper[i];
      charArt = fontMap[ch] || fontMap[' '];
      for (j = 0; j < 5; j++) {
        lines[j] = lines[j] + charArt[j] + ' ';
      }
    }

    // 去除每行末尾多余空格
    for (i = 0; i < 5; i++) {
      lines[i] = lines[i].replace(/\s+$/, '');
    }

    var result = lines.join('\n');
    this.setData({ result: result, missingTip: missingTip });
  },

  onCopy: function () {
    if (!this.data.result) {
      return;
    }
    wx.setClipboardData({
      data: this.data.result,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  onClear: function () {
    this._inputValue = '';
    this.setData({ inputText: '', result: '', missingTip: '' });
  },

  onShareAppMessage: function () {
    return {
      title: 'ASCII艺术生成器 - 工具箱',
      path: '/packages/moreTools/asciiart/index'
    };
  }
});
