/**
 * 稿纸渲染核心引擎
 * 支持横线纸、方格纸、田字格、空白纸、点阵纸
 */

// 纸张尺寸定义（单位 mm）
var PAPER_SIZES = {
  'A4':  { width: 210, height: 297, name: 'A4' },
  'A5':  { width: 148, height: 210, name: 'A5' },
  'B5':  { width: 176, height: 250, name: 'B5' },
  '16k': { width: 185, height: 260, name: '16开' }
};

// 纸张类型
var PAPER_TYPES = [
  { key: 'lined', name: '横线', icon: '▬' },
  { key: 'grid', name: '方格', icon: '▦' },
  { key: 'tianzige', name: '田字格', icon: '田' },
  { key: 'blank', name: '空白', icon: '□' },
  { key: 'dotted', name: '点阵', icon: '·' }
];

// 预设颜色
var LINE_COLORS = [
  '#CCCCCC', '#999999', '#666666', '#333333',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

var BG_COLORS = [
  '#FFFFFF', '#FFF8E7', '#F5F5DC', '#E8F5E9',
  '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5'
];

/**
 * 毫米转像素（96dpi）
 * @param {number} mm - 毫米值
 * @returns {number} 像素值
 */
function mmToPx(mm) {
  return mm * 96 / 25.4;
}

/**
 * 获取纸张像素尺寸
 * @param {string} sizeName - 纸张尺寸名称
 * @param {number} [customWidth] - 自定义宽度 mm
 * @param {number} [customHeight] - 自定义高度 mm
 * @returns {{ width: number, height: number }}
 */
function getPaperPixels(sizeName, customWidth, customHeight) {
  var size = PAPER_SIZES[sizeName];
  if (!size) {
    size = { width: customWidth || 210, height: customHeight || 297 };
  }
  return {
    width: Math.round(mmToPx(size.width)),
    height: Math.round(mmToPx(size.height))
  };
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
  return {
    paperType: 'lined',
    paperSize: 'A4',
    customWidth: 210,
    customHeight: 297,
    lineColor: '#CCCCCC',
    lineStyle: 'solid',
    lineSpacing: 8,
    lineWidth: 0.5,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 15,
    marginRight: 15,
    bgColor: '#FFFFFF',
    texture: 'none',
    watermark: false,
    watermarkText: '草稿纸',
    watermarkColor: '#F0F0F0',
    watermarkSize: 24,
    watermarkAngle: -30,
    pageCount: 1,
    showPageNumber: false
  };
}

/**
 * 渲染稿纸
 * @param {Object} ctx - Canvas 上下文
 * @param {Object} config - 配置对象
 * @param {number} canvasWidth - Canvas 实际宽度
 * @param {number} canvasHeight - Canvas 实际高度
 */
function renderPaper(ctx, config, canvasWidth, canvasHeight) {
  var paperPixels = getPaperPixels(config.paperSize, config.customWidth, config.customHeight);
  var scaleX = canvasWidth / paperPixels.width;
  var scaleY = canvasHeight / paperPixels.height;
  var scale = Math.min(scaleX, scaleY);

  // 计算实际绘制区域（居中）
  var drawWidth = paperPixels.width * scale;
  var drawHeight = paperPixels.height * scale;
  var offsetX = (canvasWidth - drawWidth) / 2;
  var offsetY = (canvasHeight - drawHeight) / 2;

  // 清空画布
  ctx.setFillStyle('#F0F0F0');
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 绘制纸张背景（带阴影效果）
  ctx.setFillStyle('#E0E0E0');
  ctx.fillRect(offsetX + 4, offsetY + 4, drawWidth, drawHeight);
  ctx.setFillStyle(config.bgColor);
  ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);

  // 绘制纹理
  if (config.texture !== 'none') {
    drawTexture(ctx, config, offsetX, offsetY, drawWidth, drawHeight, scale);
  }

  // 计算内容区域（考虑边距）
  var marginTop = mmToPx(config.marginTop) * scale;
  var marginBottom = mmToPx(config.marginBottom) * scale;
  var marginLeft = mmToPx(config.marginLeft) * scale;
  var marginRight = mmToPx(config.marginRight) * scale;
  var contentX = offsetX + marginLeft;
  var contentY = offsetY + marginTop;
  var contentWidth = drawWidth - marginLeft - marginRight;
  var contentHeight = drawHeight - marginTop - marginBottom;

  // 绘制边距参考线（浅色虚线）
  drawMarginLines(ctx, contentX, contentY, contentWidth, contentHeight, scale);

  // 绘制水印
  if (config.watermark && config.watermarkText) {
    drawWatermark(ctx, config, offsetX, offsetY, drawWidth, drawHeight);
  }

  // 绘制主体线条
  var lineSpacing = mmToPx(config.lineSpacing) * scale;
  var lineWidth = config.lineWidth * scale;

  ctx.setStrokeStyle(config.lineColor);
  ctx.setLineWidth(lineWidth);

  switch (config.paperType) {
    case 'lined':
      drawLinedPaper(ctx, contentX, contentY, contentWidth, contentHeight, lineSpacing, config.lineStyle, lineWidth);
      break;
    case 'grid':
      drawGridPaper(ctx, contentX, contentY, contentWidth, contentHeight, lineSpacing, config.lineStyle, lineWidth);
      break;
    case 'tianzige':
      drawTianzigePaper(ctx, contentX, contentY, contentWidth, contentHeight, lineSpacing, lineWidth);
      break;
    case 'dotted':
      drawDottedPaper(ctx, contentX, contentY, contentWidth, contentHeight, lineSpacing, config.lineColor, scale);
      break;
    case 'blank':
      // 空白纸不绘制线条
      break;
  }

  ctx.draw();
}

/**
 * 绘制纹理
 */
function drawTexture(ctx, config, x, y, width, height, scale) {
  if (config.texture === 'paper') {
    // 牛皮纸纹理效果（用随机点模拟）
    var dotSize = 1 * scale;
    var density = 50 * scale;
    ctx.setFillStyle('rgba(0,0,0,0.02)');
    for (var i = 0; i < 200; i++) {
      var px = x + Math.random() * width;
      var py = y + Math.random() * height;
      ctx.fillRect(px, py, dotSize, dotSize);
    }
  }
}

/**
 * 绘制边距参考线
 */
function drawMarginLines(ctx, x, y, width, height, scale) {
  ctx.save();
  ctx.setStrokeStyle('rgba(200,200,200,0.3)');
  ctx.setLineWidth(0.5 * scale);
  ctx.setLineDash([4 * scale, 4 * scale]);

  // 左边距
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();

  // 右边距
  ctx.beginPath();
  ctx.moveTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * 绘制横线纸
 */
function drawLinedPaper(ctx, x, y, width, height, spacing, lineStyle, lineWidth) {
  var lineCount = Math.floor(height / spacing);
  var startY = y + spacing; // 第一条线从顶部一个间距开始

  ctx.beginPath();
  if (lineStyle === 'dashed') {
    ctx.setLineDash([6, 4]);
  } else {
    ctx.setLineDash([]);
  }

  for (var i = 0; i < lineCount; i++) {
    var ly = startY + i * spacing;
    if (ly > y + height) break;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + width, ly);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制方格纸
 */
function drawGridPaper(ctx, x, y, width, height, spacing, lineStyle, lineWidth) {
  var cols = Math.floor(width / spacing);
  var rows = Math.floor(height / spacing);

  ctx.beginPath();
  if (lineStyle === 'dashed') {
    ctx.setLineDash([4, 3]);
  } else {
    ctx.setLineDash([]);
  }

  // 水平线
  for (var i = 0; i <= rows; i++) {
    var ly = y + i * spacing;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + width, ly);
  }

  // 垂直线
  for (var j = 0; j <= cols; j++) {
    var lx = x + j * spacing;
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y + height);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制田字格
 */
function drawTianzigePaper(ctx, x, y, width, height, spacing, lineWidth) {
  var cols = Math.floor(width / spacing);
  var rows = Math.floor(height / spacing);

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var cellX = x + j * spacing;
      var cellY = y + i * spacing;

      // 外框实线
      ctx.beginPath();
      ctx.setStrokeStyle('#CCCCCC');
      ctx.setLineWidth(lineWidth * 1.5);
      ctx.setLineDash([]);
      ctx.rect(cellX, cellY, spacing, spacing);
      ctx.stroke();

      // 中心十字虚线
      ctx.beginPath();
      ctx.setStrokeStyle('rgba(204,204,204,0.5)');
      ctx.setLineWidth(lineWidth * 0.8);
      ctx.setLineDash([3, 3]);

      // 水平中线
      ctx.moveTo(cellX, cellY + spacing / 2);
      ctx.lineTo(cellX + spacing, cellY + spacing / 2);

      // 垂直中线
      ctx.moveTo(cellX + spacing / 2, cellY);
      ctx.lineTo(cellX + spacing / 2, cellY + spacing);

      ctx.stroke();

      // 四角对角虚线（可选，标准田字格不含）
      // ctx.beginPath();
      // ctx.setStrokeStyle('rgba(204,204,204,0.3)');
      // ctx.setLineDash([2, 2]);
      // ctx.moveTo(cellX, cellY);
      // ctx.lineTo(cellX + spacing, cellY + spacing);
      // ctx.moveTo(cellX + spacing, cellY);
      // ctx.lineTo(cellX, cellY + spacing);
      // ctx.stroke();
    }
  }

  ctx.setLineDash([]);
}

/**
 * 绘制点阵纸
 */
function drawDottedPaper(ctx, x, y, width, height, spacing, color, scale) {
  var cols = Math.floor(width / spacing);
  var rows = Math.floor(height / spacing);
  var dotRadius = 1.2 * scale;

  ctx.setFillStyle(color);

  for (var i = 0; i <= rows; i++) {
    for (var j = 0; j <= cols; j++) {
      var dx = x + j * spacing;
      var dy = y + i * spacing;

      ctx.beginPath();
      ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 绘制水印
 */
function drawWatermark(ctx, config, x, y, width, height) {
  ctx.save();

  var fontSize = config.watermarkSize || 24;
  var angle = (config.watermarkAngle || -30) * Math.PI / 180;
  var color = config.watermarkColor || '#F0F0F0';
  var text = config.watermarkText || '草稿纸';

  ctx.setFillStyle(color);
  ctx.setFontSize(fontSize);
  ctx.setTextAlign('center');

  // 旋转画布
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);

  // 计算水印间距
  var textWidth = text.length * fontSize;
  var gapX = textWidth + 80;
  var gapY = fontSize * 4;

  // 覆盖整个区域
  var diagonal = Math.sqrt(width * width + height * height);
  var countX = Math.ceil(diagonal / gapX) + 2;
  var countY = Math.ceil(diagonal / gapY) + 2;

  var startX = -countX / 2 * gapX;
  var startY = -countY / 2 * gapY;

  for (var i = 0; i < countY; i++) {
    for (var j = 0; j < countX; j++) {
      var tx = startX + j * gapX;
      var ty = startY + i * gapY;
      ctx.fillText(text, tx, ty);
    }
  }

  ctx.restore();
}

/**
 * 获取预设模板
 */
function getPresetTemplates() {
  return [
    {
      id: 'preset_1',
      name: '作文稿纸',
      category: 'homework',
      config: Object.assign({}, getDefaultConfig(), {
        paperType: 'lined',
        lineSpacing: 10,
        lineColor: '#999999',
        marginTop: 25,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 15
      })
    },
    {
      id: 'preset_2',
      name: '练字田字格',
      category: 'practice',
      config: Object.assign({}, getDefaultConfig(), {
        paperType: 'tianzige',
        lineSpacing: 15,
        lineColor: '#CCCCCC'
      })
    },
    {
      id: 'preset_3',
      name: '笔记本横线',
      category: 'note',
      config: Object.assign({}, getDefaultConfig(), {
        paperType: 'lined',
        lineSpacing: 8,
        lineColor: '#CCCCCC',
        bgColor: '#FFF8E7',
        marginLeft: 25
      })
    },
    {
      id: 'preset_4',
      name: '手账点阵',
      category: 'handbook',
      config: Object.assign({}, getDefaultConfig(), {
        paperType: 'dotted',
        lineSpacing: 5,
        lineColor: '#CCCCCC',
        bgColor: '#FFFFFF'
      })
    }
  ];
}

module.exports = {
  PAPER_SIZES: PAPER_SIZES,
  PAPER_TYPES: PAPER_TYPES,
  LINE_COLORS: LINE_COLORS,
  BG_COLORS: BG_COLORS,
  mmToPx: mmToPx,
  getPaperPixels: getPaperPixels,
  getDefaultConfig: getDefaultConfig,
  getPresetTemplates: getPresetTemplates,
  renderPaper: renderPaper
};
