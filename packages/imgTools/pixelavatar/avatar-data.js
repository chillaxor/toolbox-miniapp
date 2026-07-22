/**
 * 像素头像生成器 - 核心算法
 * 5种风格：对称色块/多色马赛克/像素精灵/像素表情/万花筒
 * 8×8网格，纯算法零素材
 */

var SIZE = 8;

var STYLES = [
  { id: 'identicon', name: '对称色块', icon: '🔲' },
  { id: 'mosaic', name: '多色马赛克', icon: '🎨' },
  { id: 'sprite', name: '像素精灵', icon: '👾' },
  { id: 'face', name: '像素表情', icon: '😀' },
  { id: 'kaleidoscope', name: '万花筒', icon: '❄️' }
];

var PALETTES = [
  { id: 'retro', name: '复古', fg: ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#F4A261'], bg: '#F1FAEE' },
  { id: 'cyber', name: '赛博', fg: ['#FF006E', '#8338EC', '#3A86FF', '#FB5607', '#FFBE0B'], bg: '#0D1B2A' },
  { id: 'forest', name: '森林', fg: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'], bg: '#D8F3DC' },
  { id: 'ocean', name: '海洋', fg: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8'], bg: '#CAF0F8' },
  { id: 'warm', name: '暖阳', fg: ['#FF4D00', '#FF6B35', '#F77F00', '#FCBF49', '#EAE2B7'], bg: '#FFF8E8' },
  { id: 'dream', name: '梦幻', fg: ['#7209B7', '#560BAD', '#480CA8', '#3A0CA3', '#3F37C9'], bg: '#F0E6FF' },
  { id: 'dark', name: '暗黑', fg: ['#C9184A', '#FF4D6D', '#FF758F', '#FF8FA3', '#FFB3C1'], bg: '#1A1A2E' },
  { id: 'macaron', name: '马卡龙', fg: ['#FFB5A7', '#F9DC5C', '#A8DADC', '#B5E48C', '#CDB4DB'], bg: '#FFFFFF' }
];

/* ======== 哈希工具 ======== */

function hash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

function getBytes(h, count) {
  var bytes = [];
  var seed = h;
  for (var i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    bytes.push((seed >>> 16) & 0xFF);
  }
  return bytes;
}

function fillBg(grid, bg) {
  for (var r = 0; r < SIZE; r++) {
    var row = [];
    for (var c = 0; c < SIZE; c++) row.push(bg);
    grid.push(row);
  }
}

/* 取镜像列索引（左右对称用） */
function mc(c) {
  return Math.min(c, SIZE - 1 - c);
}

/* ======== 风格1: 对称色块 Identicon ======== */
/* 8×8 左右镜像 + 多前景色 + 边框点缀 + 中心强调 */

function generateIdenticon(seed, palette) {
  var h = hash(seed);
  var bytes = getBytes(h, 32);

  /* 选 2~3 个前景色 */
  var numC = 2 + (bytes[30] % 2);
  var colors = [];
  for (var i = 0; i < numC; i++) {
    colors.push(palette.fg[(bytes[31 - i]) % palette.fg.length]);
  }

  var grid = [];
  fillBg(grid, palette.bg);

  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var m = mc(c);
      var idx = r * 4 + m;
      var b = bytes[idx];
      var filled = (b & 1) === 1;
      var isBorder = (r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1);
      if (isBorder) filled = (b & 3) === 0;

      if (filled) {
        grid[r][c] = colors[(b >> 1) % colors.length];
      }
    }
  }

  /* 中心 2×2 强调色 */
  var accent = colors[0];
  grid[3][3] = accent; grid[3][4] = accent;
  grid[4][3] = accent; grid[4][4] = accent;

  return grid;
}

/* ======== 风格2: 多色马赛克 ======== */
/* 按象限分区配色 + 边框 + 中心点缀，有结构感而非纯随机 */

function generateMosaic(seed, palette) {
  var h = hash(seed);
  var bytes = getBytes(h, 40);

  /* 选 3 个主色 */
  var c1 = palette.fg[bytes[0] % palette.fg.length];
  var c2 = palette.fg[(bytes[1] + 1) % palette.fg.length];
  var c3 = palette.fg[(bytes[2] + 2) % palette.fg.length];
  var regionColors = [c1, c2, c3];

  var grid = [];
  fillBg(grid, palette.bg);

  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var isBorder = (r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1);
      if (isBorder) {
        grid[r][c] = palette.fg[bytes[r * SIZE + c] % palette.fg.length];
        continue;
      }
      var region = (r < SIZE / 2 ? 0 : 1) + (c < SIZE / 2 ? 0 : 2);
      var noise = bytes[r * SIZE + c] % 2;
      grid[r][c] = regionColors[(region + noise) % regionColors.length];
    }
  }

  /* 中心点缀 */
  var center = palette.fg[bytes[35] % palette.fg.length];
  grid[3][3] = center; grid[3][4] = center;
  grid[4][3] = center; grid[4][4] = center;

  return grid;
}

/* ======== 风格3: 像素精灵 ======== */
/* 8×8 角色精灵：头(圆润轮廓+眼睛) + 身体(手臂) + 腿 */

function generateSprite(seed, palette) {
  var h = hash(seed);
  var bytes = getBytes(h, 40);
  var primary = palette.fg[bytes[0] % palette.fg.length];
  var secondary = palette.fg[(bytes[1] + 1) % palette.fg.length];
  var accent = palette.fg[(bytes[2] + 2) % palette.fg.length];

  var grid = [];
  fillBg(grid, palette.bg);

  /* 头部轮廓 row 0-3，逐行定义宽度（像素数） */
  var headW = [2, 4, 6, 6];
  for (var r = 0; r < 4; r++) {
    var w = headW[r];
    var start = (SIZE - w) / 2;
    for (var c = start; c < start + w; c++) {
      grid[r][c] = primary;
    }
  }

  /* 眼睛 row 2 */
  var eyeStyle = bytes[10] % 3;
  var e1, e2;
  if (eyeStyle === 0) { e1 = 2; e2 = 5; }      /* 标准 */
  else if (eyeStyle === 1) { e1 = 3; e2 = 4; }  /* 靠近 */
  else { e1 = 1; e2 = 6; }                       /* 大眼 */
  if (e1 >= 2 && e1 <= 5) grid[2][e1] = accent;
  if (e2 >= 2 && e2 <= 5) grid[2][e2] = accent;

  /* 身体 row 4-6 */
  var bodyW = [4, 6, 6];
  for (var br = 0; br < 3; br++) {
    var bw = bodyW[br];
    var bs = (SIZE - bw) / 2;
    for (var bc = bs; bc < bs + bw; bc++) {
      grid[br + 4][bc] = secondary;
    }
  }
  /* 手臂 row 5 */
  grid[5][0] = primary;
  grid[5][SIZE - 1] = primary;

  /* 腿 row 7 */
  var legPos = bytes[20] % 3;
  if (legPos === 0) {
    grid[7][2] = primary; grid[7][5] = primary;
  } else if (legPos === 1) {
    grid[7][2] = primary; grid[7][3] = primary;
    grid[7][4] = primary; grid[7][5] = primary;
  } else {
    grid[7][3] = primary; grid[7][4] = primary;
  }

  /* 帽子 50%概率 */
  if ((bytes[25] & 1) === 1) {
    grid[0][3] = accent; grid[0][4] = accent;
  }

  return grid;
}

/* ======== 风格4: 像素表情 ======== */
/* 圆头 + 发型变化 + 眼型变化 + 嘴型变化 */

function generateFace(seed, palette) {
  var h = hash(seed);
  var bytes = getBytes(h, 40);
  var skin = palette.fg[bytes[0] % palette.fg.length];
  var eyeColor = palette.fg[(bytes[1] + 1) % palette.fg.length];
  var hairColor = palette.fg[(bytes[2] + 2) % palette.fg.length];

  var grid = [];
  fillBg(grid, palette.bg);

  /* 头部轮廓 row 0-5，逐行宽度 */
  var headW = [2, 4, 6, 6, 6, 4];
  for (var r = 0; r < 6; r++) {
    var w = headW[r];
    var start = (SIZE - w) / 2;
    for (var c = start; c < start + w; c++) {
      grid[r][c] = skin;
    }
  }

  /* 发型 row 0 */
  var hairStyle = bytes[10] % 3;
  if (hairStyle === 0) {
    /* 平刘海 */
    grid[0][2] = hairColor; grid[0][3] = hairColor;
    grid[0][4] = hairColor; grid[0][5] = hairColor;
  } else if (hairStyle === 1) {
    /* 中分 */
    grid[0][3] = hairColor; grid[0][4] = hairColor;
    grid[1][2] = hairColor; grid[1][5] = hairColor;
  } else {
    /* 莫西干 */
    grid[0][3] = hairColor; grid[0][4] = hairColor;
  }

  /* 眼睛 row 3 */
  var eyeStyle = bytes[15] % 4;
  var e1, e2;
  if (eyeStyle === 0) { e1 = 2; e2 = 5; }
  else if (eyeStyle === 1) { e1 = 1; e2 = 6; }
  else if (eyeStyle === 2) { e1 = 3; e2 = 4; }
  else { e1 = 2; e2 = 5; }
  grid[3][e1] = eyeColor;
  grid[3][e2] = eyeColor;
  /* 大眼：额外像素 */
  if (eyeStyle === 1) {
    grid[3][2] = eyeColor; grid[3][5] = eyeColor;
  }

  /* 嘴巴 row 5 */
  var mouthStyle = bytes[20] % 4;
  if (mouthStyle === 0) {
    /* 一字 */
    grid[5][3] = eyeColor; grid[5][4] = eyeColor;
  } else if (mouthStyle === 1) {
    /* 微笑 */
    grid[5][2] = eyeColor; grid[5][3] = skin;
    grid[5][4] = skin; grid[5][5] = eyeColor;
  } else if (mouthStyle === 2) {
    /* 张嘴 */
    grid[5][3] = eyeColor; grid[5][4] = eyeColor;
    grid[4][3] = eyeColor; grid[4][4] = eyeColor;
  } else {
    /* 咧嘴 */
    grid[5][2] = eyeColor; grid[5][3] = eyeColor;
    grid[5][4] = eyeColor; grid[5][5] = eyeColor;
  }

  /* 腮红 50%概率 */
  if ((bytes[25] & 1) === 1) {
    grid[4][1] = hairColor; grid[4][6] = hairColor;
  }

  return grid;
}

/* ======== 风格5: 万花筒 ======== */
/* 极坐标：同心环 + 旋转扇区 = 曼陀罗效果 */

function generateKaleidoscope(seed, palette) {
  var h = hash(seed);
  var bytes = getBytes(h, 30);
  var numSectors = 3 + (bytes[0] % 3); /* 3~5 个扇区 */
  var numRings = 3;

  /* 每个环一个主色 */
  var ringColors = [];
  for (var i = 0; i < numRings; i++) {
    ringColors.push(palette.fg[(bytes[i + 1]) % palette.fg.length]);
  }
  var centerColor = palette.fg[bytes[5] % palette.fg.length];

  var grid = [];
  fillBg(grid, palette.bg);

  var half = (SIZE - 1) / 2; /* 3.5 */
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var dr = r - half;
      var dc = c - half;
      var dist = Math.sqrt(dr * dr + dc * dc);

      /* 环 */
      var ring = Math.min(Math.floor(dist / 1.4), numRings - 1);

      /* 扇区 */
      var angle = Math.atan2(dr, dc);
      if (angle < 0) angle += Math.PI * 2;
      var sector = Math.floor(angle / (Math.PI * 2) * numSectors);

      /* 偏移产生旋转 */
      var offset = bytes[10 + ring] % numSectors;
      var idx = (sector + offset) % 2;

      grid[r][c] = idx === 0 ? ringColors[ring] : palette.bg;
    }
  }

  /* 中心 */
  grid[3][3] = centerColor; grid[3][4] = centerColor;
  grid[4][3] = centerColor; grid[4][4] = centerColor;

  return grid;
}

/* ======== 主入口 ======== */

function generate(seed, styleId, paletteId) {
  var palette = PALETTES.filter(function (p) { return p.id === paletteId; })[0] || PALETTES[0];
  var grid;
  if (styleId === 'identicon') {
    grid = generateIdenticon(seed, palette);
  } else if (styleId === 'mosaic') {
    grid = generateMosaic(seed, palette);
  } else if (styleId === 'sprite') {
    grid = generateSprite(seed, palette);
  } else if (styleId === 'face') {
    grid = generateFace(seed, palette);
  } else {
    grid = generateKaleidoscope(seed, palette);
  }
  return { grid: grid, bg: palette.bg };
}

/* ======== 渲染 ======== */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawGrid(ctx, grid, x, y, totalSize) {
  totalSize = totalSize || 260;
  var cellSize = totalSize / SIZE;
  var r = Math.max(1, Math.floor(cellSize / 6));

  for (var row = 0; row < SIZE; row++) {
    for (var col = 0; col < SIZE; col++) {
      ctx.fillStyle = grid[row][col];
      var px = x + col * cellSize;
      var py = y + row * cellSize;
      roundRect(ctx, px, py, cellSize, cellSize, r);
    }
  }
}

module.exports = {
  STYLES: STYLES,
  PALETTES: PALETTES,
  SIZE: SIZE,
  hash: hash,
  generate: generate,
  drawGrid: drawGrid
};
