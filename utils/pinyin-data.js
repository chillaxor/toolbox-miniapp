/**
 * 拼音学习数据
 * 声母、韵母、整体认读音节
 */

// 声母
var INITIALS = [
  'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x',
  'zh', 'ch', 'sh', 'r', 'z', 'c', 's',
  'y', 'w'
];

// 声母对应的汉字示例（便于联想记忆）
var INITIALS_EXAMPLES = {
  'b': { word: '玻', pinyin: 'bō', emoji: '🪟' },
  'p': { word: '坡', pinyin: 'pō', emoji: '⛰️' },
  'm': { word: '摸', pinyin: 'mō', emoji: '🤚' },
  'f': { word: '佛', pinyin: 'fó', emoji: '🙏' },
  'd': { word: '得', pinyin: 'dé', emoji: '✅' },
  't': { word: '特', pinyin: 'tè', emoji: '⭐' },
  'n': { word: '呢', pinyin: 'ne', emoji: '❓' },
  'l': { word: '勒', pinyin: 'lè', emoji: '🎀' },
  'g': { word: '哥', pinyin: 'gē', emoji: '👦' },
  'k': { word: '科', pinyin: 'kē', emoji: '🔬' },
  'h': { word: '喝', pinyin: 'hē', emoji: '🥤' },
  'j': { word: '鸡', pinyin: 'jī', emoji: '🐔' },
  'q': { word: '气', pinyin: 'qì', emoji: '🎈' },
  'x': { word: '西', pinyin: 'xī', emoji: '🌅' },
  'zh': { word: '知', pinyin: 'zhī', emoji: '📖' },
  'ch': { word: '吃', pinyin: 'chī', emoji: '🍚' },
  'sh': { word: '诗', pinyin: 'shī', emoji: '📝' },
  'r': { word: '日', pinyin: 'rì', emoji: '☀️' },
  'z': { word: '字', pinyin: 'zì', emoji: '🔤' },
  'c': { word: '刺', pinyin: 'cì', emoji: '🦔' },
  's': { word: '丝', pinyin: 'sī', emoji: '🧵' },
  'y': { word: '衣', pinyin: 'yī', emoji: '👕' },
  'w': { word: '屋', pinyin: 'wū', emoji: '🏠' }
};

// 单韵母
var SIMPLE_FINALS = ['a', 'o', 'e', 'i', 'u', 'ü'];

// 复韵母
var COMPOUND_FINALS = [
  'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
  'ie', 'üe', 'er',
  'an', 'en', 'in', 'un', 'ün',
  'ang', 'eng', 'ing', 'ong'
];

// 所有韵母
var FINALS = SIMPLE_FINALS.concat(COMPOUND_FINALS);

// 韵母对应的汉字示例
var FINALS_EXAMPLES = {
  'a': { word: '啊', pinyin: 'ā', emoji: '😮' },
  'o': { word: '哦', pinyin: 'ó', emoji: '💡' },
  'e': { word: '鹅', pinyin: 'é', emoji: '🦢' },
  'i': { word: '衣', pinyin: 'yī', emoji: '👕' },
  'u': { word: '屋', pinyin: 'wū', emoji: '🏠' },
  'ü': { word: '鱼', pinyin: 'yú', emoji: '🐟' },
  'ai': { word: '爱', pinyin: 'ài', emoji: '❤️' },
  'ei': { word: '杯', pinyin: 'bēi', emoji: '🏆' },
  'ui': { word: '水', pinyin: 'shuǐ', emoji: '💧' },
  'ao': { word: '猫', pinyin: 'māo', emoji: '🐱' },
  'ou': { word: '藕', pinyin: 'ǒu', emoji: '🪷' },
  'iu': { word: '牛', pinyin: 'niú', emoji: '🐮' },
  'ie': { word: '叶', pinyin: 'yè', emoji: '🍃' },
  'üe': { word: '月', pinyin: 'yuè', emoji: '🌙' },
  'er': { word: '耳', pinyin: 'ěr', emoji: '👂' },
  'an': { word: '安', pinyin: 'ān', emoji: '😴' },
  'en': { word: '恩', pinyin: 'ēn', emoji: '🙏' },
  'in': { word: '音', pinyin: 'yīn', emoji: '🎵' },
  'un': { word: '云', pinyin: 'yún', emoji: '☁️' },
  'ün': { word: '韵', pinyin: 'yùn', emoji: '🎶' },
  'ang': { word: '羊', pinyin: 'yáng', emoji: '🐑' },
  'eng': { word: '风', pinyin: 'fēng', emoji: '🌬️' },
  'ing': { word: '鹰', pinyin: 'yīng', emoji: '🦅' },
  'ong': { word: '龙', pinyin: 'lóng', emoji: '🐉' }
};

// 韵母分组（用于韵母表展示）
var FINAL_GROUPS = [
  { title: '单韵母', items: SIMPLE_FINALS },
  { title: '复韵母', items: ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er'] },
  { title: '前鼻韵母', items: ['an', 'en', 'in', 'un', 'ün'] },
  { title: '后鼻韵母', items: ['ang', 'eng', 'ing', 'ong'] }
];

// 声母分组
var INITIAL_GROUPS = [
  { title: '唇音', items: ['b', 'p', 'm', 'f'] },
  { title: '舌尖音', items: ['d', 't', 'n', 'l'] },
  { title: '舌根音', items: ['g', 'k', 'h'] },
  { title: '舌面音', items: ['j', 'q', 'x'] },
  { title: '翘舌音', items: ['zh', 'ch', 'sh', 'r'] },
  { title: '平舌音', items: ['z', 'c', 's'] },
  { title: '特殊声母', items: ['y', 'w'] }
];

// 整体认读音节
var WHOLE_SYLLABLES = [
  'zhi', 'chi', 'shi', 'ri',
  'zi', 'ci', 'si',
  'yi', 'wu', 'yu',
  'ye', 'yue', 'yuan',
  'yin', 'yun', 'ying'
];

// 整体认读音节对应的汉字示例
var WHOLE_SYLLABLES_EXAMPLES = {
  'zhi': { word: '知', pinyin: 'zhī', emoji: '📖' },
  'chi': { word: '吃', pinyin: 'chī', emoji: '🍚' },
  'shi': { word: '诗', pinyin: 'shī', emoji: '📝' },
  'ri': { word: '日', pinyin: 'rì', emoji: '☀️' },
  'zi': { word: '字', pinyin: 'zì', emoji: '🔤' },
  'ci': { word: '词', pinyin: 'cí', emoji: '📖' },
  'si': { word: '思', pinyin: 'sī', emoji: '🤔' },
  'yi': { word: '一', pinyin: 'yī', emoji: '1️⃣' },
  'wu': { word: '五', pinyin: 'wǔ', emoji: '5️⃣' },
  'yu': { word: '鱼', pinyin: 'yú', emoji: '🐟' },
  'ye': { word: '叶', pinyin: 'yè', emoji: '🍃' },
  'yue': { word: '月', pinyin: 'yuè', emoji: '🌙' },
  'yuan': { word: '圆', pinyin: 'yuán', emoji: '⭕' },
  'yin': { word: '音', pinyin: 'yīn', emoji: '🎵' },
  'yun': { word: '云', pinyin: 'yún', emoji: '☁️' },
  'ying': { word: '鹰', pinyin: 'yīng', emoji: '🦅' }
};

// 声调标记
var TONES = [
  { mark: 'ā', tone: 1, name: '第一声（阴平）', desc: '高高一路平', symbol: 'ˉ' },
  { mark: 'á', tone: 2, name: '第二声（阳平）', desc: '从低到高升', symbol: 'ˊ' },
  { mark: 'ǎ', tone: 3, name: '第三声（上声）', desc: '先降再扬起', symbol: 'ˇ' },
  { mark: 'à', tone: 4, name: '第四声（去声）', desc: '从高往下降', symbol: 'ˋ' },
  { mark: 'a', tone: 0, name: '轻声', desc: '又轻又短', symbol: '·' }
];

module.exports = {
  INITIALS: INITIALS,
  INITIALS_EXAMPLES: INITIALS_EXAMPLES,
  SIMPLE_FINALS: SIMPLE_FINALS,
  COMPOUND_FINALS: COMPOUND_FINALS,
  FINALS: FINALS,
  FINALS_EXAMPLES: FINALS_EXAMPLES,
  FINAL_GROUPS: FINAL_GROUPS,
  INITIAL_GROUPS: INITIAL_GROUPS,
  WHOLE_SYLLABLES: WHOLE_SYLLABLES,
  WHOLE_SYLLABLES_EXAMPLES: WHOLE_SYLLABLES_EXAMPLES,
  TONES: TONES
};
