/**
 * 文字填稿纸 - 排版引擎
 * 核心功能：将文字按稿纸格子进行排版、分页
 */

var paperUtil = require('./paper.js');

/**
 * 获取文字配置默认值
 */
function getTextDefaultConfig() {
  return {
    text: '',           // 输入的文本内容
    fontType: 'kaiti',  // 字体类型：songti/kaiti
    fontSize: 16,       // 字号
    charsPerCell: 1,    // 每格字数：1/2
    textAlign: 'center',// 对齐：center/left
    indent: 2,          // 首行缩进格数
    paragraphSpace: 1   // 段落间距行数
  };
}

/**
 * 获取字体名称
 * @param {string} fontType - 字体类型
 * @returns {string} 系统字体名称
 */
function getFontName(fontType) {
  var fontMap = {
    'songti': 'SimSun',
    'kaiti': 'KaiTi'
  };
  return fontMap[fontType] || 'KaiTi';
}

/**
 * 计算稿纸每页可容纳的格子信息
 * @param {Object} paperConfig - 稿纸配置
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @returns {Object} 格子信息
 */
function calculateGridInfo(paperConfig, canvasWidth, canvasHeight) {
  var paperPixels = paperUtil.getPaperPixels(paperConfig.paperSize, paperConfig.customWidth, paperConfig.customHeight);
  var scaleX = canvasWidth / paperPixels.width;
  var scaleY = canvasHeight / paperPixels.height;
  var scale = Math.min(scaleX, scaleY);

  // 计算实际绘制区域
  var drawWidth = paperPixels.width * scale;
  var drawHeight = paperPixels.height * scale;
  var offsetX = (canvasWidth - drawWidth) / 2;
  var offsetY = (canvasHeight - drawHeight) / 2;

  // 计算内容区域（考虑边距）
  var marginTop = paperUtil.mmToPx(paperConfig.marginTop) * scale;
  var marginBottom = paperUtil.mmToPx(paperConfig.marginBottom) * scale;
  var marginLeft = paperUtil.mmToPx(paperConfig.marginLeft) * scale;
  var marginRight = paperUtil.mmToPx(paperConfig.marginRight) * scale;

  var contentX = offsetX + marginLeft;
  var contentY = offsetY + marginTop;
  var contentWidth = drawWidth - marginLeft - marginRight;
  var contentHeight = drawHeight - marginTop - marginBottom;

  // 计算格子大小和行列数
  var cellSize = paperUtil.mmToPx(paperConfig.lineSpacing) * scale;
  var cols = Math.floor(contentWidth / cellSize);
  var rows = Math.floor(contentHeight / cellSize);

  return {
    scale: scale,
    offsetX: offsetX,
    offsetY: offsetY,
    drawWidth: drawWidth,
    drawHeight: drawHeight,
    contentX: contentX,
    contentY: contentY,
    contentWidth: contentWidth,
    contentHeight: contentHeight,
    cellSize: cellSize,
    cols: cols,
    rows: rows,
    totalCells: cols * rows
  };
}

/**
 * 将文本分页
 * @param {string} text - 输入文本
 * @param {Object} textConfig - 文字配置
 * @param {Object} gridInfo - 格子信息
 * @returns {Array} 分页结果
 */
function paginateText(text, textConfig, gridInfo) {
  if (!text || text.length === 0) {
    return [];
  }

  var cols = gridInfo.cols;
  var rows = gridInfo.rows;
  var totalCellsPerPage = cols * rows;
  var pages = [];
  var currentPage = [];
  var currentRow = 0;
  var currentCol = 0;
  var isFirstLineOfParagraph = true;

  // 按段落分割（保留空行）
  var paragraphs = text.split('\n');

  for (var p = 0; p < paragraphs.length; p++) {
    var paragraph = paragraphs[p];
    var isLastParagraph = (p === paragraphs.length - 1);

    // 处理段落间距（空行）
    if (p > 0 && textConfig.paragraphSpace > 0) {
      for (var sp = 0; sp < textConfig.paragraphSpace; sp++) {
        // 跳到下一行
        currentCol = 0;
        currentRow++;

        // 检查是否需要翻页
        if (currentRow >= rows) {
          pages.push({
            pageNum: pages.length + 1,
            chars: currentPage.slice(),
            totalCells: totalCellsPerPage
          });
          currentPage = [];
          currentRow = 0;
        }
      }
    }

    // 处理首行缩进
    if (isFirstLineOfParagraph && textConfig.indent > 0) {
      for (var ind = 0; ind < textConfig.indent; ind++) {
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
          if (currentRow >= rows) {
            pages.push({
              pageNum: pages.length + 1,
              chars: currentPage.slice(),
              totalCells: totalCellsPerPage
            });
            currentPage = [];
            currentRow = 0;
          }
        }
        currentPage.push({
          char: '',
          row: currentRow,
          col: currentCol,
          isEmpty: true
        });
        currentCol++;
      }
      isFirstLineOfParagraph = false;
    }

    // 处理空段落（连续换行）
    if (paragraph.length === 0) {
      if (!isLastParagraph) {
        currentCol = 0;
        currentRow++;
        if (currentRow >= rows) {
          pages.push({
            pageNum: pages.length + 1,
            chars: currentPage.slice(),
            totalCells: totalCellsPerPage
          });
          currentPage = [];
          currentRow = 0;
        }
      }
      continue;
    }

    // 逐字填入格子
    for (var i = 0; i < paragraph.length; i++) {
      var char = paragraph[i];

      // 检查是否需要翻页
      if (currentRow >= rows) {
        pages.push({
          pageNum: pages.length + 1,
          chars: currentPage.slice(),
          totalCells: totalCellsPerPage
        });
        currentPage = [];
        currentRow = 0;
      }

      // 检查是否需要换行
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;

        // 再次检查翻页
        if (currentRow >= rows) {
          pages.push({
            pageNum: pages.length + 1,
            chars: currentPage.slice(),
            totalCells: totalCellsPerPage
          });
          currentPage = [];
          currentRow = 0;
        }
      }

      // 填入字符
      currentPage.push({
        char: char,
        row: currentRow,
        col: currentCol,
        isEmpty: false
      });
      currentCol++;
    }

    // 段落结束后，重置下一段为新段落
    if (!isLastParagraph) {
      isFirstLineOfParagraph = true;
    }
  }

  // 添加最后一页（如果有内容）
  if (currentPage.length > 0) {
    pages.push({
      pageNum: pages.length + 1,
      chars: currentPage.slice(),
      totalCells: totalCellsPerPage
    });
  }

  return pages;
}

/**
 * 渲染文字稿纸（单页）
 * @param {Object} ctx - Canvas上下文
 * @param {Object} paperConfig - 稿纸配置
 * @param {Object} textConfig - 文字配置
 * @param {Object} pageData - 该页数据
 * @param {Object} gridInfo - 格子信息
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 */
function renderTextPaper(ctx, paperConfig, textConfig, pageData, gridInfo, canvasWidth, canvasHeight) {
  // 先绘制稿纸网格
  paperUtil.renderPaper(ctx, paperConfig, canvasWidth, canvasHeight);

  // 如果没有文字数据，直接返回
  if (!pageData || !pageData.chars || pageData.chars.length === 0) {
    return;
  }

  var cellSize = gridInfo.cellSize;
  var contentX = gridInfo.contentX;
  var contentY = gridInfo.contentY;

  // 设置文字样式
  var fontSize = textConfig.fontSize * gridInfo.scale;
  var fontName = getFontName(textConfig.fontType);
  ctx.setFontSize(fontSize);
  ctx.setFillStyle('#333333');
  ctx.setTextAlign(textConfig.textAlign === 'center' ? 'center' : 'left');

  // 逐格绘制文字
  for (var i = 0; i < pageData.chars.length; i++) {
    var item = pageData.chars[i];
    if (item.isEmpty || !item.char) continue;

    // 计算格子位置
    var cellX = contentX + item.col * cellSize;
    var cellY = contentY + item.row * cellSize;

    // 计算文字位置（居中于格子）
    var textX, textY;
    if (textConfig.textAlign === 'center') {
      textX = cellX + cellSize / 2;
    } else {
      textX = cellX + cellSize * 0.15; // 靠左时留一点边距
    }
    textY = cellY + cellSize / 2 + fontSize / 3; // 垂直居中（微调基线）

    ctx.fillText(item.char, textX, textY);
  }

  // 将文字渲染到画布上，保留之前的稿纸网格
  ctx.draw(true);
}

/**
 * 渲染完整预览（带分页指示）
 * @param {Object} ctx - Canvas上下文
 * @param {Object} paperConfig - 稿纸配置
 * @param {Object} textConfig - 文字配置
 * @param {number} pageNum - 当前页码（从1开始）
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @returns {Object} { totalPages, gridInfo, pages }
 */
function renderPreview(ctx, paperConfig, textConfig, pageNum, canvasWidth, canvasHeight) {
  var gridInfo = calculateGridInfo(paperConfig, canvasWidth, canvasHeight);
  var pages = paginateText(textConfig.text, textConfig, gridInfo);

  // 确保至少有一页
  if (pages.length === 0) {
    pages = [{
      pageNum: 1,
      chars: [],
      totalCells: gridInfo.totalCells
    }];
  }

  // 获取当前页数据
  var pageIndex = Math.max(0, Math.min(pageNum - 1, pages.length - 1));
  var currentPageData = pages[pageIndex];

  // 渲染当前页
  renderTextPaper(ctx, paperConfig, textConfig, currentPageData, gridInfo, canvasWidth, canvasHeight);

  return {
    totalPages: pages.length,
    gridInfo: gridInfo,
    pages: pages
  };
}

module.exports = {
  getTextDefaultConfig: getTextDefaultConfig,
  getFontName: getFontName,
  calculateGridInfo: calculateGridInfo,
  paginateText: paginateText,
  renderTextPaper: renderTextPaper,
  renderPreview: renderPreview
};
