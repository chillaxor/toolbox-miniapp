/**
 * 字帖生成核心工具函数
 * Canvas 绘制格子（田/米/方格）、描红字、拼音、控笔线条
 * 适配 A4 纸张输出
 */

var pinyinUtil = require('./pinyin.js');

// A4 尺寸常量（mm）
var A4_WIDTH_MM = 210;
var A4_HEIGHT_MM = 297;

// 页边距（mm）
var PAGE_MARGIN_MM = 15;

// 格子类型
var GRID_TYPES = {
  TIAN: 'tian',    // 田字格
  MI: 'mi',        // 米字格
  FANG: 'fang',    // 方格
  PINYIN: 'pinyin' // 拼音格
};

// 格子类型名称映射
var GRID_TYPE_NAMES = {};
GRID_TYPE_NAMES[GRID_TYPES.TIAN] = '田字格';
GRID_TYPE_NAMES[GRID_TYPES.MI] = '米字格';
GRID_TYPE_NAMES[GRID_TYPES.FANG] = '方格';
GRID_TYPE_NAMES[GRID_TYPES.PINYIN] = '拼音格';

/**
 * mm 转 px（基于 DPI）
 * @param {number} mm 毫米
 * @param {number} dpi 默认 72（标准打印 DPI）
 */
function mm2px(mm, dpi) {
  dpi = dpi || 72;
  return Math.round(mm * dpi / 25.4);
}

/**
 * 计算 A4 页面布局
 * @param {Object} options 配置项
 * @returns {Object} 布局信息
 */
function calcA4Layout(options) {
  var cellSizeMM = options.cellSizeMM || 15; // 格子尺寸 mm
  var showPinyin = options.showPinyin || false;
  var lineSpacingMM = options.lineSpacingMM || 3; // 行间距 mm
  var marginMM = options.marginMM || PAGE_MARGIN_MM;

  var dpi = 72;
  var pageW = mm2px(A4_WIDTH_MM, dpi);
  var pageH = mm2px(A4_HEIGHT_MM, dpi);
  var margin = mm2px(marginMM, dpi);
  var cellSize = mm2px(cellSizeMM, dpi);
  var lineSpacing = mm2px(lineSpacingMM, dpi);
  var pinyinHeight = showPinyin ? Math.round(cellSize * 0.4) : 0;
  var rowHeight = cellSize + pinyinHeight + lineSpacing;

  var contentW = pageW - margin * 2;
  var contentH = pageH - margin * 2;

  var cols = Math.floor(contentW / cellSize);
  var rows = Math.floor(contentH / rowHeight);

  // 确保至少 1 列 1 行
  cols = Math.max(cols, 1);
  rows = Math.max(rows, 1);

  return {
    pageW: pageW,
    pageH: pageH,
    margin: margin,
    cellSize: cellSize,
    lineSpacing: lineSpacing,
    pinyinHeight: pinyinHeight,
    rowHeight: rowHeight,
    cols: cols,
    rows: rows
  };
}

/**
 * 绘制田字格
 */
function drawTianGrid(ctx, x, y, size, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(0.5);

  // 外框
  ctx.strokeRect(x, y, size, size);

  // 十字虚线
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制米字格
 */
function drawMiGrid(ctx, x, y, size, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(0.5);

  // 外框
  ctx.strokeRect(x, y, size, size);

  // 十字虚线
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();

  // 对角线
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * 绘制方格
 */
function drawFangGrid(ctx, x, y, size, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(0.5);
  ctx.strokeRect(x, y, size, size);
}

/**
 * 绘制拼音格
 */
function drawPinyinGrid(ctx, x, y, width, height, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(0.5);

  // 外框
  ctx.strokeRect(x, y, width, height);

  // 四线三格（拼音格）
  var lineH = height / 4;
  ctx.setLineDash([2, 2]);
  for (var i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + lineH * i);
    ctx.lineTo(x + width, y + lineH * i);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/**
 * 绘制单个描红汉字
 */
function drawChar(ctx, char, x, y, size, color, alpha) {
  color = color || '#dddddd';
  alpha = alpha !== undefined ? alpha : 0.4;
  ctx.setFillStyle(color);
  ctx.setGlobalAlpha(alpha);
  ctx.font = Math.round(size * 0.85) + 'px "KaiTi", "楷体", "STKaiti", serif';
  ctx.setTextAlign('center');
  ctx.setTextBaseline('middle');
  ctx.fillText(char, x + size / 2, y + size / 2);
  ctx.setGlobalAlpha(1);
}

/**
 * 绘制描红拼音
 */
function drawPinyinText(ctx, pinyin, x, y, width, height, color, alpha) {
  color = color || '#dddddd';
  alpha = alpha !== undefined ? alpha : 0.4;
  ctx.setFillStyle(color);
  ctx.setGlobalAlpha(alpha);
  ctx.font = Math.round(height * 0.5) + 'px sans-serif';
  ctx.setTextAlign('center');
  ctx.setTextBaseline('middle');
  ctx.fillText(pinyin, x + width / 2, y + height / 2);
  ctx.setGlobalAlpha(1);
}

/**
 * 绘制控笔线条 - 波浪线
 */
function drawWaveLine(ctx, x, y, width, height, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(1);
  ctx.beginPath();
  var amplitude = height / 4;
  var centerY = y + height / 2;
  var segments = 3;
  var segW = width / segments;

  ctx.moveTo(x, centerY);
  for (var i = 0; i < segments; i++) {
    var cp1x = x + segW * i + segW / 4;
    var cp1y = centerY - amplitude;
    var cp2x = x + segW * i + segW * 3 / 4;
    var cp2y = centerY + amplitude;
    var endX = x + segW * (i + 1);
    var endY = centerY;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  }
  ctx.stroke();
}

/**
 * 绘制控笔线条 - 直线
 */
function drawStraightLine(ctx, x, y, width, height, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(1);
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x + 10, y + height / 2);
  ctx.lineTo(x + width - 10, y + height / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制控笔线条 - 折线
 */
function drawZigzagLine(ctx, x, y, width, height, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(1);
  var points = 4;
  var segW = width / points;
  var amp = height / 4;
  var centerY = y + height / 2;

  ctx.beginPath();
  ctx.moveTo(x, centerY);
  for (var i = 0; i < points; i++) {
    var px = x + segW * (i + 0.5);
    var py = i % 2 === 0 ? centerY - amp : centerY + amp;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + width, centerY);
  ctx.stroke();
}

/**
 * 绘制控笔线条 - 螺旋/圆形
 */
function drawCircleLine(ctx, x, y, width, height, color) {
  color = color || '#cccccc';
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(1);
  var cx = x + width / 2;
  var cy = y + height / 2;
  var r = Math.min(width, height) / 3;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * 生成字帖数据（A4 满页模式）
 * @param {Object} options 配置项
 *   - type: 'hanzi'|'pinyin'|'number'|'english'|'line'
 *   - text: 输入文字
 *   - cellSizeMM: 格子尺寸 mm，默认 15
 *   - showPinyin: 是否显示拼音
 *   - repeatCount: 描红次数
 *   - lineSpacingMM: 行间距 mm
 *   - marginMM: 页边距 mm
 *   - gridType: 格子类型
 * @returns {Object} { rows, layout } 行数据数组 + 布局信息
 */
function generatePaperData(options) {
  var type = options.type || 'hanzi';
  var text = options.text || '';
  var repeatCount = options.repeatCount || 1;
  var showPinyin = options.showPinyin || false;

  // 计算 A4 布局
  var layout = calcA4Layout({
    cellSizeMM: options.cellSizeMM || 15,
    showPinyin: showPinyin,
    lineSpacingMM: options.lineSpacingMM || 3,
    marginMM: options.marginMM || PAGE_MARGIN_MM
  });

  var cols = layout.cols;
  var maxRows = layout.rows; // A4 可容纳的最大行数

  var rows = [];

  if (type === 'line') {
    // 控笔线条练习 — 填满整页
    for (var l = 0; l < maxRows; l++) {
      rows.push({ lineType: 'wave' });
    }
    return { rows: rows, layout: layout };
  }

  // 构建单元格队列（每个字符按 repeatCount 展开）
  var cellQueue = [];
  var chars;

  if (type === 'hanzi' || type === 'pinyin') {
    chars = text.replace(/\s/g, '').split('');
  } else if (type === 'number' || type === 'english') {
    chars = text.split('');
  } else {
    chars = [];
  }

  for (var i = 0; i < chars.length; i++) {
    for (var r = 0; r < repeatCount; r++) {
      cellQueue.push({
        char: chars[i],
        pinyin: (showPinyin || type === 'pinyin') ? (pinyinUtil.getPinyin(chars[i]) || '') : ''
      });
    }
  }

  // 如果没有内容，用空行填满整页
  if (cellQueue.length === 0) {
    var emptyRow = [];
    for (var ci = 0; ci < cols; ci++) {
      emptyRow.push({ char: '', pinyin: '' });
    }
    for (var ei = 0; ei < maxRows; ei++) {
      rows.push(emptyRow.slice());
    }
    return { rows: rows, layout: layout };
  }

  // 循环重复内容直到填满整页
  var queueIdx = 0;
  while (rows.length < maxRows) {
    var currentRow = [];
    for (var c = 0; c < cols; c++) {
      currentRow.push(cellQueue[queueIdx % cellQueue.length]);
      queueIdx++;
    }
    rows.push(currentRow);
  }

  return { rows: rows, layout: layout };
}

/**
 * 在 Canvas 上渲染字帖（A4 尺寸）
 * @param {Object} ctx Canvas 上下文（旧版 createCanvasContext）
 * @param {Object} layout calcA4Layout 返回的布局
 * @param {String} gridType 格子类型
 * @param {Array} rows 行数据
 * @param {Object} colors { gridColor, traceColor }
 */
function renderPaper(ctx, layout, gridType, rows, colors) {
  var cellSize = layout.cellSize;
  var cols = layout.cols;
  var margin = layout.margin;
  var pinyinHeight = layout.pinyinHeight;
  var lineSpacing = layout.lineSpacing;
  var rowHeight = layout.rowHeight;
  var gridColor = (colors && colors.gridColor) || '#cccccc';
  var traceColor = (colors && colors.traceColor) || '#dddddd';
  var type = layout.type || 'hanzi';

  // 白色背景填满整页
  ctx.setFillStyle('#ffffff');
  ctx.fillRect(0, 0, layout.pageW, layout.pageH);

  for (var r = 0; r < rows.length; r++) {
    var rowData = rows[r];
    var yPos = margin + r * rowHeight;

    // 控笔线条模式
    if (rowData.lineType) {
      var lineX = margin;
      var lineW = cols * cellSize;
      var lineH = cellSize;

      if (rowData.lineType === 'wave') {
        drawWaveLine(ctx, lineX, yPos, lineW, lineH, gridColor);
      } else if (rowData.lineType === 'straight') {
        drawStraightLine(ctx, lineX, yPos, lineW, lineH, gridColor);
      } else if (rowData.lineType === 'zigzag') {
        drawZigzagLine(ctx, lineX, yPos, lineW, lineH, gridColor);
      } else if (rowData.lineType === 'circle') {
        drawCircleLine(ctx, lineX, yPos, lineW, lineH, gridColor);
      }
      continue;
    }

    // 普通格子模式
    if (!Array.isArray(rowData)) continue;

    for (var c = 0; c < rowData.length; c++) {
      var cellData = rowData[c];
      var xPos = margin + c * cellSize;

      // 绘制拼音格
      if (pinyinHeight > 0 && cellData.pinyin) {
        drawPinyinGrid(ctx, xPos, yPos, cellSize, pinyinHeight, gridColor);
        drawPinyinText(ctx, cellData.pinyin, xPos, yPos, cellSize, pinyinHeight, traceColor);
      }

      // 绘制主格子
      var gridY = yPos + pinyinHeight;
      if (gridType === GRID_TYPES.TIAN) {
        drawTianGrid(ctx, xPos, gridY, cellSize, gridColor);
      } else if (gridType === GRID_TYPES.MI) {
        drawMiGrid(ctx, xPos, gridY, cellSize, gridColor);
      } else if (gridType === GRID_TYPES.FANG) {
        drawFangGrid(ctx, xPos, gridY, cellSize, gridColor);
      }

      // 绘制描红字
      if (cellData.char) {
        drawChar(ctx, cellData.char, xPos, gridY, cellSize, traceColor);
      }
    }
  }
}

module.exports = {
  A4_WIDTH_MM: A4_WIDTH_MM,
  A4_HEIGHT_MM: A4_HEIGHT_MM,
  PAGE_MARGIN_MM: PAGE_MARGIN_MM,
  GRID_TYPES: GRID_TYPES,
  GRID_TYPE_NAMES: GRID_TYPE_NAMES,
  mm2px: mm2px,
  calcA4Layout: calcA4Layout,
  generatePaperData: generatePaperData,
  renderPaper: renderPaper,
  drawTianGrid: drawTianGrid,
  drawMiGrid: drawMiGrid,
  drawFangGrid: drawFangGrid,
  drawChar: drawChar
};
