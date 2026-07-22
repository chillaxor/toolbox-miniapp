/**
 * 名人名言/格言数据库
 * 约200条，分8个类别
 */

var QUOTES = [
  // === 励志 ===
  { content: '天行健，君子以自强不息。', author: '《周易》', category: '励志' },

  // === 人生 ===
  { content: '人生自古谁无死，留取丹心照汗青。', author: '文天祥', category: '人生' },

  // === 爱情 ===
  { content: '两情若是久长时，又岂在朝朝暮暮。', author: '秦观', category: '爱情' },
  // === 友情 ===
  { content: '海内存知己，天涯若比邻。', author: '王勃', category: '友情' },
  // === 智慧 ===
  { content: '学而不思则罔，思而不学则殆。', author: '孔子', category: '智慧' },

  // === 哲理 ===
  { content: '祸兮福所倚，福兮祸所伏。', author: '老子', category: '哲理' },

  // === 职场 ===
  { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈', category: '职场' },

  // === 学习 ===
  { content: '业精于勤荒于嬉，行成于思毁于随。', author: '韩愈', category: '学习' },

  // === 励志（续） ===
  { content: '壮志与毅力是事业的双翼。', author: '歌德', category: '励志' },

  // === 人生（续） ===
  { content: '把脸一直向着阳光，这样就不会见到阴影。', author: '海伦·凯勒', category: '人生' },

  // === 爱情（续） ===
  { content: '相见时难别亦难，东风无力百花残。', author: '李商隐', category: '爱情' },
  // === 友情（续） ===
  { content: '有朋自远方来，不亦乐乎。', author: '孔子', category: '友情' },

  // === 智慧（续） ===
  { content: '满招损，谦受益。', author: '《尚书》', category: '智慧' },

  // === 哲理（续） ===
  { content: '当局者迷，旁观者清。', author: '《新唐书》', category: '哲理' },
  // === 职场（续） ===
  { content: '千里之行，始于足下。', author: '老子', category: '职场' },

  // === 学习（续） ===
  { content: '非学无以广才，非志无以成学。', author: '诸葛亮', category: '学习' },
  // === 生活/感悟 ===
  { content: '静以修身，俭以养德。', author: '诸葛亮', category: '人生' },

  // === 新增第二批：200条不重复 ===

  // 励志补充
  { content: '燕雀安知鸿鹄之志哉。', author: '陈涉', category: '励志' },
 
  // 人生补充
  { content: '众鸟高飞尽，孤云独去闲。相看两不厌，只有敬亭山。', author: '李白', category: '人生' },

  // 爱情补充
  { content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。', author: '王维', category: '爱情' },

  // 友情补充
  { content: '折花逢驿使，寄与陇头人。江南无所有，聊赠一枝春。', author: '陆凯', category: '友情' },

  // 友情补充（第三批）
  { content: '翻手作云覆手雨，纷纷轻薄何须数。', author: '杜甫', category: '友情' },

  // 智慧补充
  { content: '尽信书不如无书。', author: '孟子', category: '智慧' },

  // 哲理补充
  { content: '不识庐山真面目，只缘身在此山中。', author: '苏轼', category: '哲理' },

  // 职场补充
  { content: '功崇惟志，业广惟勤。', author: '《尚书》', category: '职场' },

  // 学习补充
  { content: '不以规矩，不能成方圆。', author: '孟子', category: '学习' },

  // 补充跨类经典
  { content: '苟日新，日日新，又日新。', author: '《大学》', category: '哲理' },
];

var CATEGORIES = ['全部', '励志', '人生', '爱情', '友情', '智慧', '哲理', '职场', '学习'];

// ===== 远程数据：gitee wx.request 直连 + jsDelivr 镜像回退（不用云函数）=====
// 远程 quotes.json 中的中文已转成 \uXXXX 存储，JSON.parse 会自动还原。
var QUOTES_GITEE = 'https://gitee.com/b64882/qian_data/raw/master/quotes.json';
var QUOTES_MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/quotes.json';
var _quotesLoaded = false;
var _quotesCallbacks = [];

function _normalizeQuotesData(d) {
  if (Array.isArray(d)) return d;
  if (typeof d === 'string') {
    try { var p = JSON.parse(d); if (Array.isArray(p)) return p; } catch (e) {}
  }
  return null;
}

function _applyQuotes(data) {
  QUOTES = data;
  try { wx.setStorageSync('quotes_cache', data); } catch (e) {}
}

// 从 gitee 拉取名言；主源失败回退 jsDelivr 镜像；两路都失败则用本地兜底 QUOTES。
// 无论成功/失败都会触发一次回调（回调里重新渲染即可）；本地兜底 + 上次缓存保证离线可用。
function loadQuotes(opts) {
  opts = opts || {};
  var fired = false;
  function finish() {
    if (fired) return;
    fired = true;
    _quotesLoaded = true;
    var cbs = _quotesCallbacks;
    _quotesCallbacks = [];
    cbs.forEach(function (cb) { try { cb(QUOTES); } catch (e) {} });
    if (typeof opts.success === 'function') { try { opts.success(QUOTES); } catch (e) {} }
  }
  // 先用本地缓存（上次成功拉取）快速填充，离线时也能用
  var cached = null;
  try { cached = wx.getStorageSync('quotes_cache'); } catch (e) {}
  if (cached && Array.isArray(cached) && cached.length) {
    _applyQuotes(cached);
  }
  function tryMirror() {
    wx.request({
      url: QUOTES_MIRROR,
      success: function (res) {
        var data = _normalizeQuotesData(res.data);
        if (res.statusCode === 200 && data && data.length) {
          _applyQuotes(data);
          finish();
        } else {
          finish();
        }
      },
      fail: function () { finish(); }
    });
  }
  wx.request({
    url: QUOTES_GITEE,
    success: function (res) {
      var data = _normalizeQuotesData(res.data);
      if (res.statusCode === 200 && data && data.length) {
        _applyQuotes(data);
        finish();
      } else {
        tryMirror();
      }
    },
    fail: function () { tryMirror(); }
  });
}

/**
 * 获取分类列表
 */
function getCategories() {
  return CATEGORIES;
}

/**
 * 获取随机名言
 * @param {string} category - 分类名，空字符串表示全部
 * @returns {Object} {content, author, category}
 */
function getRandomQuote(category) {
  var list = QUOTES;
  if (category && category !== '全部') {
    list = QUOTES.filter(function (q) {
      return q.category === category;
    });
  }
  if (list.length === 0) list = QUOTES;
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * 获取今日名言（基于日期固定）
 * @returns {Object} {content, author, category}
 */
function getTodayQuote() {
  var now = new Date();
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var idx = dayOfYear % QUOTES.length;
  return QUOTES[idx];
}

/**
 * 获取名言总数
 */
function getTotalCount() {
  return QUOTES.length;
}

/**
 * 获取各分类数量
 */
function getCategoryCounts() {
  var counts = {};
  counts['全部'] = QUOTES.length;
  for (var i = 0; i < QUOTES.length; i++) {
    var cat = QUOTES[i].category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

module.exports = {
  QUOTES: QUOTES,
  CATEGORIES: CATEGORIES,
  loadQuotes: loadQuotes,
  getCategories: getCategories,
  getRandomQuote: getRandomQuote,
  getTodayQuote: getTodayQuote,
  getTotalCount: getTotalCount,
  getCategoryCounts: getCategoryCounts
};
