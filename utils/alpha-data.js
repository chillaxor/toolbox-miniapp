/**
 * 英语字母学习数据
 * 26个字母卡、单词、元辅音分类、练习题库
 */
var VOWELS = ['A', 'E', 'I', 'O', 'U'];

var ALPHABET = [
  {
    letter: 'A', lower: 'a', phonetic: '/eɪ/',
    words: [
      { word: 'apple', chinese: '苹果', emoji: '🍎' },
      { word: 'ant', chinese: '蚂蚁', emoji: '🐜' }
    ],
    funFact: 'A 是英语中最常用的元音字母之一'
  },
  {
    letter: 'B', lower: 'b', phonetic: '/biː/',
    words: [
      { word: 'ball', chinese: '球', emoji: '⚽' },
      { word: 'bear', chinese: '熊', emoji: '🐻' }
    ],
    funFact: 'B 的发音需要双唇合拢再打开'
  },
  {
    letter: 'C', lower: 'c', phonetic: '/siː/',
    words: [
      { word: 'cat', chinese: '猫', emoji: '🐱' },
      { word: 'cake', chinese: '蛋糕', emoji: '🎂' }
    ],
    funFact: 'C 在 a/o/u 前发 /k/，在 e/i 前发 /s/'
  },
  {
    letter: 'D', lower: 'd', phonetic: '/diː/',
    words: [
      { word: 'dog', chinese: '狗', emoji: '🐶' },
      { word: 'duck', chinese: '鸭子', emoji: '🦆' }
    ],
    funFact: 'D 的发音舌尖抵住上齿龈'
  },
  {
    letter: 'E', lower: 'e', phonetic: '/iː/',
    words: [
      { word: 'egg', chinese: '鸡蛋', emoji: '🥚' },
      { word: 'elephant', chinese: '大象', emoji: '🐘' }
    ],
    funFact: 'E 是英语中出现频率最高的字母'
  },
  {
    letter: 'F', lower: 'f', phonetic: '/ef/',
    words: [
      { word: 'fish', chinese: '鱼', emoji: '🐟' },
      { word: 'frog', chinese: '青蛙', emoji: '🐸' }
    ],
    funFact: 'F 的发音上齿咬下唇'
  },
  {
    letter: 'G', lower: 'g', phonetic: '/dʒiː/',
    words: [
      { word: 'grape', chinese: '葡萄', emoji: '🍇' },
      { word: 'girl', chinese: '女孩', emoji: '👧' }
    ],
    funFact: 'G 在 e/i/y 前可能发 /dʒ/ 的音'
  },
  {
    letter: 'H', lower: 'h', phonetic: '/eɪtʃ/',
    words: [
      { word: 'hat', chinese: '帽子', emoji: '🎩' },
      { word: 'horse', chinese: '马', emoji: '🐴' }
    ],
    funFact: 'H 的发音从喉咙呼出气流'
  },
  {
    letter: 'I', lower: 'i', phonetic: '/aɪ/',
    words: [
      { word: 'ice cream', chinese: '冰淇淋', emoji: '🍦' },
      { word: 'igloo', chinese: '冰屋', emoji: '🏠' }
    ],
    funFact: 'I 是第五个元音字母，大写像一个人站着'
  },
  {
    letter: 'J', lower: 'j', phonetic: '/dʒeɪ/',
    words: [
      { word: 'juice', chinese: '果汁', emoji: '🧃' },
      { word: 'jellyfish', chinese: '水母', emoji: '🪼' }
    ],
    funFact: 'J 是英语中较晚加入的字母之一'
  },
  {
    letter: 'K', lower: 'k', phonetic: '/keɪ/',
    words: [
      { word: 'kite', chinese: '风筝', emoji: '🪁' },
      { word: 'key', chinese: '钥匙', emoji: '🔑' }
    ],
    funFact: 'K 在 n 前面通常不发音，如 knee、knife'
  },
  {
    letter: 'L', lower: 'l', phonetic: '/el/',
    words: [
      { word: 'lion', chinese: '狮子', emoji: '🦁' },
      { word: 'leaf', chinese: '树叶', emoji: '🍃' }
    ],
    funFact: 'L 的发音舌尖抵住上齿龈'
  },
  {
    letter: 'M', lower: 'm', phonetic: '/em/',
    words: [
      { word: 'moon', chinese: '月亮', emoji: '🌙' },
      { word: 'monkey', chinese: '猴子', emoji: '🐵' }
    ],
    funFact: 'M 是婴儿最早学会的辅音之一（妈妈）'
  },
  {
    letter: 'N', lower: 'n', phonetic: '/en/',
    words: [
      { word: 'nose', chinese: '鼻子', emoji: '👃' },
      { word: 'nut', chinese: '坚果', emoji: '🥜' }
    ],
    funFact: 'N 的发音舌尖抵住上齿龈，气流从鼻腔出'
  },
  {
    letter: 'O', lower: 'o', phonetic: '/əʊ/',
    words: [
      { word: 'orange', chinese: '橙子', emoji: '🍊' },
      { word: 'owl', chinese: '猫头鹰', emoji: '🦉' }
    ],
    funFact: 'O 像一个圆圆的嘴巴形状'
  },
  {
    letter: 'P', lower: 'p', phonetic: '/piː/',
    words: [
      { word: 'panda', chinese: '熊猫', emoji: '🐼' },
      { word: 'pig', chinese: '猪', emoji: '🐷' }
    ],
    funFact: 'P 的发音双唇合拢后突然打开，送气'
  },
  {
    letter: 'Q', lower: 'q', phonetic: '/kjuː/',
    words: [
      { word: 'queen', chinese: '女王', emoji: '👸' },
      { word: 'quilt', chinese: '被子', emoji: '🛏️' }
    ],
    funFact: 'Q 后面几乎总是跟着 U'
  },
  {
    letter: 'R', lower: 'r', phonetic: '/ɑː/',
    words: [
      { word: 'rabbit', chinese: '兔子', emoji: '🐰' },
      { word: 'rainbow', chinese: '彩虹', emoji: '🌈' }
    ],
    funFact: 'R 的发音舌头卷起靠近上颚'
  },
  {
    letter: 'S', lower: 's', phonetic: '/es/',
    words: [
      { word: 'sun', chinese: '太阳', emoji: '☀️' },
      { word: 'star', chinese: '星星', emoji: '⭐' }
    ],
    funFact: 'S 像一条蛇的形状'
  },
  {
    letter: 'T', lower: 't', phonetic: '/tiː/',
    words: [
      { word: 'tiger', chinese: '老虎', emoji: '🐯' },
      { word: 'tree', chinese: '树', emoji: '🌳' }
    ],
    funFact: 'T 的发音舌尖抵住上齿龈后突然放开'
  },
  {
    letter: 'U', lower: 'u', phonetic: '/juː/',
    words: [
      { word: 'umbrella', chinese: '雨伞', emoji: '☂️' },
      { word: 'unicorn', chinese: '独角兽', emoji: '🦄' }
    ],
    funFact: 'U 是最后一个元音字母'
  },
  {
    letter: 'V', lower: 'v', phonetic: '/viː/',
    words: [
      { word: 'violin', chinese: '小提琴', emoji: '🎻' },
      { word: 'volcano', chinese: '火山', emoji: '🌋' }
    ],
    funFact: 'V 的发音上齿咬下唇，声带振动'
  },
  {
    letter: 'W', lower: 'w', phonetic: '/ˈdʌbljuː/',
    words: [
      { word: 'water', chinese: '水', emoji: '💧' },
      { word: 'whale', chinese: '鲸鱼', emoji: '🐋' }
    ],
    funFact: 'W 的名字最长：double-U（两个U）'
  },
  {
    letter: 'X', lower: 'x', phonetic: '/eks/',
    words: [
      { word: 'xylophone', chinese: '木琴', emoji: '🎵' },
      { word: 'x-ray', chinese: 'X光', emoji: '🔬' }
    ],
    funFact: 'X 在单词开头很少见，常出现在词尾'
  },
  {
    letter: 'Y', lower: 'y', phonetic: '/waɪ/',
    words: [
      { word: 'yellow', chinese: '黄色', emoji: '💛' },
      { word: 'yak', chinese: '牦牛', emoji: '🐂' }
    ],
    funFact: 'Y 有时当元音用，如 baby、gym、gym'
  },
  {
    letter: 'Z', lower: 'z', phonetic: '/zed/',
    words: [
      { word: 'zebra', chinese: '斑马', emoji: '🦓' },
      { word: 'zoo', chinese: '动物园', emoji: '🦁' }
    ],
    funFact: 'Z 是英语字母表的最后一个字母'
  }
];

// 简单词库（用于练习出题）
var SIMPLE_WORDS = [
  { word: 'apple', chinese: '苹果', emoji: '🍎' },
  { word: 'ball', chinese: '球', emoji: '⚽' },
  { word: 'cat', chinese: '猫', emoji: '🐱' },
  { word: 'dog', chinese: '狗', emoji: '🐶' },
  { word: 'egg', chinese: '鸡蛋', emoji: '🥚' },
  { word: 'fish', chinese: '鱼', emoji: '🐟' },
  { word: 'grape', chinese: '葡萄', emoji: '🍇' },
  { word: 'hat', chinese: '帽子', emoji: '🎩' },
  { word: 'ice cream', chinese: '冰淇淋', emoji: '🍦' },
  { word: 'juice', chinese: '果汁', emoji: '🧃' },
  { word: 'kite', chinese: '风筝', emoji: '🪁' },
  { word: 'lion', chinese: '狮子', emoji: '🦁' },
  { word: 'moon', chinese: '月亮', emoji: '🌙' },
  { word: 'nose', chinese: '鼻子', emoji: '👃' },
  { word: 'orange', chinese: '橙子', emoji: '🍊' },
  { word: 'panda', chinese: '熊猫', emoji: '🐼' },
  { word: 'queen', chinese: '女王', emoji: '👸' },
  { word: 'rabbit', chinese: '兔子', emoji: '🐰' },
  { word: 'sun', chinese: '太阳', emoji: '☀️' },
  { word: 'tiger', chinese: '老虎', emoji: '🐯' },
  { word: 'umbrella', chinese: '雨伞', emoji: '☂️' },
  { word: 'violin', chinese: '小提琴', emoji: '🎻' },
  { word: 'water', chinese: '水', emoji: '💧' },
  { word: 'xylophone', chinese: '木琴', emoji: '🎵' },
  { word: 'yellow', chinese: '黄色', emoji: '💛' },
  { word: 'zebra', chinese: '斑马', emoji: '🦓' }
];

module.exports = {
  ALPHABET: ALPHABET,
  VOWELS: VOWELS,
  SIMPLE_WORDS: SIMPLE_WORDS
};
