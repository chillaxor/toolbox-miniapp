/**
 * 人民币购物练习 - 出题引擎（纯函数模块）
 * 页面与离线校验脚本共用同一份代码，保证「验证的就是上线的」。
 * 金额一律用整数「角」运算，杜绝浮点。不含「分」（付钱环节贴近流通现实）。
 */

// ============ 钱币定义 ============
// value 单位：角。cls 用于 WXML 直接绑定（CSS 绘制，零图片素材，规避人民币图样风险）
var MONEY = [
  { id: 'j1',   kind: 'coin', value: 1,    label: '1角',   cls: 'money coin coin-j1' },
  { id: 'j5',   kind: 'coin', value: 5,    label: '5角',   cls: 'money coin coin-j5' },
  { id: 'y1c',  kind: 'coin', value: 10,   label: '1元',   cls: 'money coin coin-y1' },
  { id: 'y1',   kind: 'bill', value: 10,   label: '1元',   cls: 'money bill bill-1' },
  { id: 'y5',   kind: 'bill', value: 50,   label: '5元',   cls: 'money bill bill-5' },
  { id: 'y10',  kind: 'bill', value: 100,  label: '10元',  cls: 'money bill bill-10' },
  { id: 'y20',  kind: 'bill', value: 200,  label: '20元',  cls: 'money bill bill-20' },
  { id: 'y50',  kind: 'bill', value: 500,  label: '50元',  cls: 'money bill bill-50' },
  { id: 'y100', kind: 'bill', value: 1000, label: '100元', cls: 'money bill bill-100' }
];

function moneyById(id) {
  for (var i = 0; i < MONEY.length; i++) { if (MONEY[i].id === id) return MONEY[i]; }
  return null;
}

// 各难度可用的「钱包/凑钱」面额（value 列表，降序）
// L1 只有整元；L2 加角币；L3 加大面额
var LEVEL_VALUES = {
  1: [100, 50, 10],
  2: [100, 50, 10, 5, 1],
  3: [500, 200, 100, 50, 10, 5, 1]
};

// value -> 优先使用的 denom id（10 角特殊：硬币/纸币两种形态，由调用方分配）
var VALUE_TO_ID = { 1: 'j1', 5: 'j5', 10: 'y1', 50: 'y5', 100: 'y10', 200: 'y20', 500: 'y50', 1000: 'y100' };

// 「换零」表：value -> [子面额, 张数]，用于保证付钱题存在第二种凑法（k 均 ≤5，控制张数）
var EXCHANGE = {
  10: [5, 2],
  5: [1, 5],
  50: [10, 5],
  100: [50, 2],
  200: [100, 2],
  500: [100, 5]
};

// ============ 商品表 ============
// band: [min, max] 单位角，保证价格合理（不会出现 98 元的铅笔）
var GOODS = [
  { emoji: '✏️', name: '铅笔',   band: [5, 40] },
  { emoji: '🧽', name: '橡皮',   band: [5, 20] },
  { emoji: '📒', name: '本子',   band: [15, 50] },
  { emoji: '🍬', name: '糖果',   band: [5, 20] },
  { emoji: '🍪', name: '饼干',   band: [20, 60] },
  { emoji: '🥛', name: '牛奶',   band: [25, 80] },
  { emoji: '🍞', name: '面包',   band: [30, 80] },
  { emoji: '🍎', name: '苹果',   band: [10, 50] },
  { emoji: '🎈', name: '气球',   band: [10, 30] },
  { emoji: '🖍️', name: '蜡笔',   band: [40, 120] },
  { emoji: '📏', name: '尺子',   band: [10, 40] },
  { emoji: '⚽', name: '皮球',   band: [50, 200] },
  { emoji: '🧸', name: '玩具熊', band: [80, 400] },
  { emoji: '🚗', name: '玩具车', band: [100, 500] },
  { emoji: '📚', name: '故事书', band: [80, 300] },
  { emoji: '🪁', name: '风筝',   band: [100, 350] },
  { emoji: '🎨', name: '颜料',   band: [60, 250] },
  { emoji: '🛴', name: '滑板车', band: [300, 1000] }
];

// ============ 工具函数 ============
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// 角 -> "X元Y角"
function formatJiao(j) {
  var yuan = Math.floor(j / 10);
  var jiao = j % 10;
  if (yuan > 0 && jiao > 0) return yuan + '元' + jiao + '角';
  if (yuan > 0) return yuan + '元';
  return jiao + '角';
}

// 按 value 合并分组（1元硬币与1元纸币按同一价值参与凑钱判定）
function mergeByValue(groups) {
  var map = {};
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    map[g.value] = (map[g.value] || 0) + g.count;
  }
  var out = [];
  for (var k in map) { out.push({ value: Number(k), count: map[k] }); }
  return out;
}

// 有界计数背包：统计恰好凑出 target 的方案数（按价值组合去重），最多数到 cap 即停
function countWays(target, valueGroups, cap) {
  var ways = [];
  for (var t = 0; t <= target; t++) ways.push(0);
  ways[0] = 1;
  for (var i = 0; i < valueGroups.length; i++) {
    var v = valueGroups[i].value, c = valueGroups[i].count;
    var next = [];
    for (var t2 = 0; t2 <= target; t2++) next.push(0);
    for (var t3 = 0; t3 <= target; t3++) {
      if (!ways[t3]) continue;
      for (var n = 0; n <= c; n++) {
        var nt = t3 + n * v;
        if (nt > target) break;
        next[nt] += ways[t3];
        if (next[nt] > cap) next[nt] = cap + 1;
      }
    }
    ways = next;
  }
  return ways[target];
}

// 钱包受限最少张数（DP），凑不出返回 -1
function minPiecesWallet(target, valueGroups) {
  var INF = 99999;
  var dp = [];
  for (var t = 0; t <= target; t++) dp.push(INF);
  dp[0] = 0;
  for (var i = 0; i < valueGroups.length; i++) {
    var v = valueGroups[i].value, c = valueGroups[i].count;
    // 有界背包逆序展开
    for (var n = 0; n < c; n++) {
      for (var t2 = target; t2 >= v; t2--) {
        if (dp[t2 - v] + 1 < dp[t2]) dp[t2] = dp[t2 - v] + 1;
      }
    }
  }
  return dp[target] >= INF ? -1 : dp[target];
}

// ============ 价格生成 ============
// L1：1~10 元整；L2：1~20 元（约 6 成带角）；L3：5~100 元（约 4 成带角）
function genPrice(level) {
  if (level === 1) return randInt(1, 10) * 10;
  if (level === 2) {
    var p = randInt(1, 19) * 10;
    if (Math.random() < 0.6) p += randInt(1, 9);
    return p;
  }
  var p3 = randInt(5, 99) * 10;
  if (Math.random() < 0.4) p3 += randInt(1, 9);
  return p3;
}

// 按价格挑一个 band 覆盖该价的商品；挑不到就放宽（纯展示用途，不影响判定）
function pickGood(price) {
  var fits = [];
  for (var i = 0; i < GOODS.length; i++) {
    var g = GOODS[i];
    if (price >= g.band[0] && price <= g.band[1]) fits.push(g);
  }
  if (fits.length) return pick(fits);
  // 放宽：找 band 上限最接近的
  var best = GOODS[0], bd = Infinity;
  for (var j = 0; j < GOODS.length; j++) {
    var d = Math.min(Math.abs(price - GOODS[j].band[0]), Math.abs(price - GOODS[j].band[1]));
    if (d < bd) { bd = d; best = GOODS[j]; }
  }
  return best;
}

// ============ 钱包组装 ============
// comp: {value: count} -> 钱包分组数组（10 角拆成硬币/纸币两种形态之一或混合）
function compToGroups(comp) {
  var groups = [];
  for (var vs in comp) {
    var v = Number(vs), c = comp[vs];
    if (!c) continue;
    if (v === 10) {
      // 1 元：随机决定硬币/纸币/混合，制造「两种形态都是 1 元」的认知场景
      var coinN = 0;
      if (c >= 2 && Math.random() < 0.4) coinN = randInt(1, c - 1);
      else if (Math.random() < 0.5) coinN = c;
      if (coinN > 0) groups.push({ id: 'y1c', count: coinN });
      if (c - coinN > 0) groups.push({ id: 'y1', count: c - coinN });
    } else {
      groups.push({ id: VALUE_TO_ID[v], count: c });
    }
  }
  return groups;
}

// 展开分组为页面友好的完整对象
function hydrateGroups(rawGroups) {
  var out = [];
  for (var i = 0; i < rawGroups.length; i++) {
    var m = moneyById(rawGroups[i].id);
    out.push({
      id: m.id, kind: m.kind, value: m.value, label: m.label, cls: m.cls,
      count: rawGroups[i].count
    });
  }
  // 面额从大到小排，硬币靠后
  out.sort(function (a, b) {
    if (b.value !== a.value) return b.value - a.value;
    return a.kind === 'bill' ? -1 : 1;
  });
  return out;
}

// 贪心分解（值降序）；本引擎的 value 体系保证能整除到底
function greedyComp(target, values) {
  var rem = target, comp = {};
  for (var i = 0; i < values.length; i++) {
    var v = values[i];
    var n = Math.floor(rem / v);
    if (n > 0) { comp[v] = n; rem -= n * v; }
  }
  return rem === 0 ? comp : null;
}

// ============ 题型 B：付钱 ============
// 保证：钱包至少存在 2 种凑法；含干扰钱；张数上限可控
function genB(level) {
  var guard = 0;
  while (guard < 60) {
    guard++;
    var price = genPrice(level);
    var values = LEVEL_VALUES[level];
    var comp = greedyComp(price, values);
    if (!comp) continue;

    // 换零：挑一个已用面额加入等值小钱，制造第二种凑法
    var exValues = [];
    for (var vs in comp) {
      var v = Number(vs);
      if (EXCHANGE[v] && values.indexOf(EXCHANGE[v][0]) !== -1) exValues.push(v);
    }
    if (!exValues.length) continue;
    var exV = pick(exValues);
    var sub = EXCHANGE[exV][0], k = EXCHANGE[exV][1];
    comp[sub] = (comp[sub] || 0) + k;

    // 干扰钱：塞一张比商品还大的钱（有的话），教孩子「用不上的钱不要拿」
    var bigs = [];
    for (var i = 0; i < values.length; i++) { if (values[i] > price) bigs.push(values[i]); }
    if (bigs.length) {
      var bv = pick(bigs);
      comp[bv] = (comp[bv] || 0) + 1;
    }

    var rawGroups = compToGroups(comp);
    var groups = hydrateGroups(rawGroups);

    // 张数体验控制：单面额 ≤9
    var ok = true;
    for (var g = 0; g < groups.length; g++) { if (groups[g].count > 9) { ok = false; break; } }
    if (!ok) continue;

    var merged = mergeByValue(groups);
    if (countWays(price, merged, 2) < 2) continue;
    var minP = minPiecesWallet(price, merged);
    if (minP <= 0) continue;

    var good = pickGood(price);
    return {
      type: 'B',
      good: { emoji: good.emoji, name: good.name },
      priceJiao: price,
      priceText: formatJiao(price),
      priceYuan: Math.floor(price / 10),
      priceJiaoDigit: price % 10,
      priceDec2: ('0' + (price % 10)).slice(-2),
      wallet: groups,
      minPieces: minP
    };
  }
  return null;
}

// ============ 题型 C：付大钱算找零 ============
// mode: 'fill'（填数字，L2）| 'pick'（替店主拿零钱，L3）
function genC(level, mode) {
  var guard = 0;
  var payPool = level === 2 ? [100, 200] : [100, 200, 500, 1000];
  while (guard < 60) {
    guard++;
    var price = genPrice(level);
    // 找出严格大于价格的最小可付面额（贴近真实：拿最合适的整钱付）
    var paid = 0;
    var sorted = payPool.slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < sorted.length; i++) { if (sorted[i] > price) { paid = sorted[i]; break; } }
    if (!paid) continue;
    var change = paid - price;
    if (change < 1) continue;

    var paidId = VALUE_TO_ID[paid];
    var paidMoney = moneyById(paidId);
    var q = {
      type: 'C',
      mode: mode,
      good: null,
      priceJiao: price,
      priceText: formatJiao(price),
      priceYuan: Math.floor(price / 10),
      priceJiaoDigit: price % 10,
      priceDec2: ('0' + (price % 10)).slice(-2),
      paidId: paidId,
      paidLabel: paidMoney.label,
      paidCls: paidMoney.cls,
      paidValue: paid,
      changeJiao: change,
      changeText: formatJiao(change),
      changeYuan: Math.floor(change / 10),
      changeJiaoDigit: change % 10
    };
    var good = pickGood(price);
    q.good = { emoji: good.emoji, name: good.name };

    if (mode === 'pick') {
      // 零钱盒：保证找零必可组合（1角×9 + 5角×3 覆盖任意角位；元位由 10/5/1 元覆盖）
      var box = hydrateGroups([
        { id: 'y10', count: 2 },
        { id: 'y5', count: 3 },
        { id: 'y1', count: 9 },
        { id: 'j5', count: 3 },
        { id: 'j1', count: 9 }
      ]);
      if (countWays(change, mergeByValue(box), 1) < 1) continue;
      q.box = box;
    }
    return q;
  }
  return null;
}

// ============ 题型 A：认一认 ============
// mode: value（这是多少钱）| find（找出 X）| equiv（1张大钱=几张小钱）
function levelMoneys(level) {
  // 认一认不受付钱面额限制：L1 也放 20 元进认币池（保证 find 模式有 4 种不同面值）
  var ids = level === 1 ? ['y1c', 'y1', 'y5', 'y10', 'y20'] : ['j1', 'j5', 'y1c', 'y1', 'y5', 'y10', 'y20'];
  var out = [];
  for (var i = 0; i < ids.length; i++) out.push(moneyById(ids[i]));
  return out;
}

var EQUIV_L1 = [
  { big: 'y10', small: 'y5', k: 2 },
  { big: 'y10', small: 'y1', k: 10 },
  { big: 'y5', small: 'y1', k: 5 }
];
var EQUIV_L2 = EQUIV_L1.concat([
  { big: 'y1', small: 'j5', k: 2 },
  { big: 'y1', small: 'j1', k: 10 },
  { big: 'j5', small: 'j1', k: 5 }
]);

function genA(level) {
  var pool = levelMoneys(level);
  var mode = pick(level === 1 ? ['value', 'find', 'equiv'] : ['value', 'find', 'equiv']);

  if (mode === 'value') {
    var target = pick(pool);
    // 选项：先用同难度面额的 label，凑不够 4 个再从全量面额标签池补（1元硬币/纸币 label 相同需去重）
    var labels = [];
    for (var i = 0; i < pool.length; i++) { if (labels.indexOf(pool[i].label) === -1) labels.push(pool[i].label); }
    var allLabels = [];
    for (var a = 0; a < MONEY.length; a++) { if (allLabels.indexOf(MONEY[a].label) === -1) allLabels.push(MONEY[a].label); }
    shuffle(labels);
    shuffle(allLabels);
    var opts = [target.label];
    for (var j = 0; j < labels.length && opts.length < 4; j++) {
      if (opts.indexOf(labels[j]) === -1) opts.push(labels[j]);
    }
    for (var j2 = 0; j2 < allLabels.length && opts.length < 4; j2++) {
      if (opts.indexOf(allLabels[j2]) === -1) opts.push(allLabels[j2]);
    }
    shuffle(opts);
    return {
      type: 'A', mode: 'value',
      question: '这是多少钱？',
      showMoney: { label: target.label, cls: target.cls, kind: target.kind },
      options: opts.map(function (t) { return { text: t, cls: 'opt' }; }),
      correctIndex: opts.indexOf(target.label),
      answerText: target.label
    };
  }

  if (mode === 'find') {
    // 4 个不同面值的钱，点出目标
    var byValue = {};
    for (var p = 0; p < pool.length; p++) {
      if (!byValue[pool[p].value] || Math.random() < 0.5) byValue[pool[p].value] = pool[p];
    }
    var distinct = [];
    for (var vk in byValue) distinct.push(byValue[vk]);
    shuffle(distinct);
    var four = distinct.slice(0, 4);
    if (four.length < 4) return genA(level); // 兜底重生成
    var tgt = pick(four);
    var cells = four.map(function (m) {
      return { label: m.label, cls: m.cls, kind: m.kind, value: m.value, cellCls: 'find-cell' };
    });
    return {
      type: 'A', mode: 'find',
      question: '请点出「' + tgt.label + '」',
      cells: cells,
      correctValue: tgt.value,
      answerText: tgt.label
    };
  }

  // equiv
  var pair = pick(level === 1 ? EQUIV_L1 : EQUIV_L2);
  var big = moneyById(pair.big), small = moneyById(pair.small);
  var kOpts = [pair.k];
  var candidates = shuffle([2, 3, 4, 5, 6, 8, 10].slice());
  for (var c = 0; c < candidates.length && kOpts.length < 4; c++) {
    if (kOpts.indexOf(candidates[c]) === -1) kOpts.push(candidates[c]);
  }
  shuffle(kOpts);
  return {
    type: 'A', mode: 'equiv',
    question: '1张' + big.label + ' 能换几张' + small.label + '？',
    showMoney: { label: big.label, cls: big.cls, kind: big.kind },
    subMoney: { label: small.label, cls: small.cls, kind: small.kind },
    options: kOpts.map(function (n) { return { text: n + ' 张', cls: 'opt' }; }),
    correctIndex: kOpts.indexOf(pair.k),
    answerText: pair.k + ' 张'
  };
}

// ============ 总入口 ============
// L1：A 40% + B 60%；L2：A 20% + B 60% + C(fill) 20%；L3：B 40% + C(pick) 60%
function genQuestion(level) {
  var r = Math.random();
  var q = null;
  if (level === 1) {
    q = r < 0.4 ? genA(1) : genB(1);
  } else if (level === 2) {
    if (r < 0.2) q = genA(2);
    else if (r < 0.8) q = genB(2);
    else q = genC(2, 'fill');
  } else {
    q = r < 0.4 ? genB(3) : genC(3, 'pick');
  }
  // 极小概率生成失败时兜底出 B 题（B 的 guard 内必然可产出常规题）
  if (!q) q = genB(level) || genB(1);
  return q;
}

module.exports = {
  MONEY: MONEY,
  GOODS: GOODS,
  LEVEL_VALUES: LEVEL_VALUES,
  moneyById: moneyById,
  formatJiao: formatJiao,
  mergeByValue: mergeByValue,
  countWays: countWays,
  minPiecesWallet: minPiecesWallet,
  genPrice: genPrice,
  genA: genA,
  genB: genB,
  genC: genC,
  genQuestion: genQuestion
};
