/**
 * 哪个更划算 · 核心计算模块（纯函数，页面与离线校验共用）
 * 内部一律用「分 + 最小单位」整数思路计算，避免浮点误差。
 */

// 单位表：group 相同才可比；factor = 换算到组内基准单位的倍数
var UNITS = {
  g:  { label: 'g',  group: 'weight', factor: 1,    baseQty: 100, baseLabel: '100g' },
  kg: { label: 'kg', group: 'weight', factor: 1000, baseQty: 100, baseLabel: '100g' },
  jin:{ label: '斤', group: 'weight', factor: 500,  baseQty: 100, baseLabel: '100g' },
  ml: { label: 'ml', group: 'volume', factor: 1,    baseQty: 100, baseLabel: '100ml' },
  L:  { label: 'L',  group: 'volume', factor: 1000, baseQty: 100, baseLabel: '100ml' },
  ge: { label: '个', group: 'count',  factor: 1,    baseQty: 1,   baseLabel: '1个' }
};

var GROUP_NAMES = { weight: '重量', volume: '容量', count: '数量' };

// 省钱等价物文案（把省的钱换成孩子能懂的东西）
function treatFor(yuan) {
  if (yuan <= 0) return '';
  if (yuan < 1) return '能多买一颗糖 🍬';
  if (yuan < 5) return '能多买一根棒棒糖 🍭';
  if (yuan < 20) return '能多买一支冰淇淋 🍦';
  return '能多买一本绘本 📚';
}

// 金额显示：最多 2 位小数，去掉多余的 0
function fmtMoney(yuan) {
  var s = yuan.toFixed(2);
  s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

// 数量显示：500g / 1.5kg 原样回显（amount 已是用户输入）
function fmtQty(amount, unitKey, multi) {
  var u = UNITS[unitKey];
  var s = String(amount) + u.label;
  if (multi > 1) s = s + '×' + multi;
  return s;
}

/**
 * 单卡校验 + 归一化
 * item: { price(元), amount, unit(key), multi }
 * 返回 { ok, priceCents, qty(基准单位数量), group } 或 { ok:false }
 */
function normalize(item) {
  var price = parseFloat(item.price);
  var amount = parseFloat(item.amount);
  var multi = parseInt(item.multi, 10) || 1;
  var u = UNITS[item.unit];
  if (!u) return { ok: false };
  if (isNaN(price) || price <= 0 || price > 999999) return { ok: false };
  if (isNaN(amount) || amount <= 0 || amount > 999999) return { ok: false };
  if (multi < 1 || multi > 999) return { ok: false };
  var priceCents = Math.round(price * 100);
  var qty = amount * u.factor * multi; // 组内基准单位总量
  if (qty <= 0) return { ok: false };
  return { ok: true, priceCents: priceCents, qty: qty, group: u.group, unit: item.unit, multi: multi, amount: amount, price: price };
}

/**
 * 比较入口
 * items: 2~3 个 { price, amount, unit, multi, emoji, name }
 * 返回:
 *  { ok:false, reason:'missing'|'group', msg }
 *  { ok:true, verdict:'win'|'tie', winnerIdx, baseLabel,
 *    rows:[{ idx, emoji, name, perBaseText, qtyText, priceText, rank, isWinner }],
 *    lines:[三行结论], explainLines:[计算过程], saveYuan }
 */
function compare(items) {
  var norms = [];
  for (var i = 0; i < items.length; i++) {
    var n = normalize(items[i]);
    if (!n.ok) return { ok: false, reason: 'missing', msg: '还差一个数字哦，把价格和分量都填好～' };
    n.emoji = items[i].emoji || '🛒';
    n.name = items[i].name || ('商品' + (i + 1));
    n.idx = i;
    norms.push(n);
  }
  // 同组校验
  for (var j = 1; j < norms.length; j++) {
    if (norms[j].group !== norms[0].group) {
      return {
        ok: false, reason: 'group',
        msg: '一个是' + GROUP_NAMES[norms[0].group] + '、一个是' + GROUP_NAMES[norms[j].group] + '，它俩没法比哦 🤔'
      };
    }
  }

  var baseQty = UNITS[norms[0].unit].baseQty;
  var baseLabel = UNITS[norms[0].unit].baseLabel;

  // 每基准量单价（分，浮点保留精度，只在显示时舍入）
  norms.forEach(function (n) {
    n.perBaseCents = n.priceCents * baseQty / n.qty;
  });

  var sorted = norms.slice().sort(function (a, b) { return a.perBaseCents - b.perBaseCents; });
  var best = sorted[0];
  var worst = sorted[sorted.length - 1];

  // 平局判定：最贵与最便宜差 < 1%
  var isTie = (worst.perBaseCents - best.perBaseCents) / best.perBaseCents < 0.01;

  var rows = norms.map(function (n) {
    var rank = 0;
    for (var k = 0; k < sorted.length; k++) { if (sorted[k].idx === n.idx) { rank = k; break; } }
    return {
      idx: n.idx,
      emoji: n.emoji,
      name: n.name,
      perBase: Math.round(n.perBaseCents) / 100,
      perBaseText: '每' + baseLabel + ' ' + fmtMoney(n.perBaseCents / 100) + '元',
      qtyText: fmtQty(n.amount, n.unit, n.multi),
      priceText: fmtMoney(n.price) + '元',
      rank: rank,
      isWinner: !isTie && n.idx === best.idx
    };
  });

  // 计算过程（"为什么"折叠区）
  var explainLines = norms.map(function (n) {
    return n.emoji + ' ' + n.name + '：' + fmtMoney(n.price) + '元 ÷ ' + fmtQty(n.amount, n.unit, n.multi) +
      ' = 每' + baseLabel + ' ' + fmtMoney(n.perBaseCents / 100) + '元';
  });

  if (isTie) {
    explainLines.push('它们的单价几乎一样（相差不到 1%）');
    return {
      ok: true, verdict: 'tie', winnerIdx: -1, baseLabel: baseLabel, rows: rows,
      lines: ['🤝 两个差不多，买哪个都行！'],
      explainLines: explainLines, saveYuan: 0
    };
  }

  // 省钱结论：按获胜包装的分量，用最贵单价对比
  var diffPerBase = (worst.perBaseCents - best.perBaseCents) / 100; // 元/基准量
  var saveYuan = diffPerBase * (best.qty / baseQty);
  var treat = treatFor(saveYuan);

  var lines = [
    '🏆 ' + best.emoji + ' ' + best.name + ' 更划算！',
    '每' + baseLabel + '便宜 ' + fmtMoney(diffPerBase) + ' 元',
    '买它这一份，总共能省 ' + fmtMoney(saveYuan) + ' 元' + (treat ? '，' + treat : '')
  ];

  explainLines.push(fmtMoney(best.perBaseCents / 100) + ' 比 ' + fmtMoney(worst.perBaseCents / 100) + ' 小，所以 ' + best.name + ' 更划算');

  return {
    ok: true, verdict: 'win', winnerIdx: best.idx, baseLabel: baseLabel, rows: rows,
    lines: lines, explainLines: explainLines, saveYuan: Math.round(saveYuan * 100) / 100
  };
}

module.exports = {
  UNITS: UNITS,
  compare: compare,
  normalize: normalize,
  fmtMoney: fmtMoney,
  treatFor: treatFor
};
