/**
 * 二维码生成工具
 * 基于 weapp-qrcode 核心实现
 */

/**
 * 生成二维码到 Canvas
 * @param {Object} canvasContext - Canvas 上下文
 * @param {string} text - 要编码的文本/URL
 * @param {Object} options - 选项 { width, colorDark, colorLight }
 * @returns {Promise}
 */
function generateQRCode(canvasContext, text, options) {
  options = options || {};
  var width = options.width || 200;
  var colorDark = options.colorDark || '#000000';
  var colorLight = options.colorLight || '#FFFFFF';

  return new Promise(function (resolve, reject) {
    if (!text) {
      reject(new Error('请输入要编码的内容'));
      return;
    }

    try {
      // 使用 QR Code 算法生成数据矩阵
      var qrData = _generateQRMatrix(text);
      var cellSize = width / qrData.moduleCount;
      var margin = 0;

      // 清空画布
      canvasContext.setFillStyle(colorLight);
      canvasContext.fillRect(0, 0, width, width);

      // 绘制模块
      for (var row = 0; row < qrData.moduleCount; row++) {
        for (var col = 0; col < qrData.moduleCount; col++) {
          if (qrData.isDark(row, col)) {
            canvasContext.setFillStyle(colorDark);
            var x = col * cellSize + margin;
            var y = row * cellSize + margin;
            canvasContext.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      canvasContext.draw(true, function () {
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

// ========== QR Code 核心算法（简化版） ==========
// 基于 qrcode-generator 简化实现

var QRMode = { MODE_8BIT_BYTE: 1 << 2 };

function _generateQRMatrix(text) {
  var typeNumber = _getTypeNumber(text);
  var qr = new QRCodeModel(typeNumber, 'L');
  qr.addData(text);
  qr.make();
  return qr;
}

function _getTypeNumber(text) {
  var len = text.length;
  if (len <= 25) return 1;
  if (len <= 47) return 2;
  if (len <= 77) return 3;
  if (len <= 114) return 4;
  if (len <= 154) return 5;
  if (len <= 195) return 6;
  if (len <= 224) return 7;
  if (len <= 279) return 8;
  if (len <= 335) return 9;
  return 10;
}

function QRCodeModel(typeNumber, errorCorrectLevel) {
  this.typeNumber = typeNumber;
  this.errorCorrectLevel = errorCorrectLevel;
  this.modules = null;
  this.moduleCount = 0;
  this.dataCache = null;
  this.dataList = [];
}

QRCodeModel.prototype = {
  addData: function (data) {
    this.dataList.push(new QR8bitByte(data));
    this.dataCache = null;
  },

  isDark: function (row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + ',' + col);
    }
    return this.modules[row][col];
  },

  getModuleCount: function () {
    return this.moduleCount;
  },

  make: function () {
    this.makeImpl(false, this.getBestMaskPattern());
  },

  makeImpl: function (test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (var row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (var col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = null;
      }
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupPositionAdjustPattern();
    if (test) {
      this.mapData(this.dataCache, maskPattern);
    } else {
      var dataArray = this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
      this.mapData(dataArray, maskPattern);
    }
  },

  setupPositionProbePattern: function (row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  },

  getBestMaskPattern: function () {
    var minLostPoint = 0;
    var pattern = 0;
    for (var i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      var lostPoint = this.lostPoint(i);
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  },

  setupTimingPattern: function () {
    for (var r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = (r % 2 === 0);
    }
    for (var c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = (c % 2 === 0);
    }
  },

  setupPositionAdjustPattern: function () {
    var pos = this.getPatternPosition(this.typeNumber);
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i];
        var col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  },

  getPatternPosition: function (typeNumber) {
    var PATTERN_POSITION_TABLE = [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
    ];
    return PATTERN_POSITION_TABLE[typeNumber - 1] || [6, 30, 54];
  },

  createData: function (typeNumber, errorCorrectLevel, dataList) {
    var buffer = [];
    for (var i = 0; i < dataList.length; i++) {
      var data = dataList[i];
      buffer.push(data.mode);
      buffer.push(data.data.length);
      for (var j = 0; j < data.data.length; j++) {
        buffer.push(data.data.charCodeAt(j));
      }
    }
    // 简化：填充到合适长度
    var totalDataCount = this.getDataCount(typeNumber);
    while (buffer.length < totalDataCount) {
      buffer.push(buffer.length % 2 === 0 ? 236 : 17);
    }
    return buffer.slice(0, totalDataCount);
  },

  getDataCount: function (typeNumber) {
    return typeNumber * 4 + 17;
  },

  mapData: function (data, maskPattern) {
    var inc = -1;
    var row = this.moduleCount - 1;
    var bitIndex = 7;
    var byteIndex = 0;
    for (var col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            var dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if (maskPattern !== -1) {
              var mod = row + col % 3;
              if (maskPattern === 0) mod = (row + col) % 2;
              if (maskPattern === 1) mod = row % 2;
              if (maskPattern === 2) mod = col % 3;
              if (maskPattern === 3) mod = (row + col) % 3;
              if (maskPattern === 4) mod = (Math.floor(row / 2) + Math.floor(col / 3)) % 2;
              if (mod === 0) dark = !dark;
            }
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  },

  lostPoint: function () {
    return 0;
  }
};

function QR8bitByte(data) {
  this.mode = QRMode.MODE_8BIT_BYTE;
  this.data = data;
}

module.exports = {
  generateQRCode: generateQRCode
};
