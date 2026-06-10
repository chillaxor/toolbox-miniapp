/**
 * 纯JS GIF89a编码器
 * 支持多帧动画GIF生成
 */

function GifEncoder(width, height) {
  this.width = width;
  this.height = height;
  this.frames = [];
  this.delay = 200; // 默认帧间隔ms
  this.repeat = 0; // 0=无限循环
}

GifEncoder.prototype.setDelay = function (ms) {
  this.delay = ms;
};

GifEncoder.prototype.setRepeat = function (count) {
  this.repeat = count;
};

/**
 * 添加一帧，imageData为Uint8ClampedArray(RGBA)
 */
GifEncoder.prototype.addFrame = function (imageData) {
  this.frames.push(imageData);
};

/**
 * 编码输出GIF ArrayBuffer
 */
GifEncoder.prototype.encode = function () {
  var buffers = [];
  var w = this.width, h = this.height;
  var frameCount = this.frames.length;
  var delayCs = Math.round(this.delay / 10); // 转换为1/100秒

  // Header
  buffers.push(strToBytes('GIF89a'));

  // Logical Screen Descriptor
  var lsd = new Uint8Array(7);
  lsd[0] = w & 0xFF;
  lsd[1] = (w >> 8) & 0xFF;
  lsd[2] = h & 0xFF;
  lsd[3] = (h >> 8) & 0xFF;
  lsd[4] = 0xF7; // GCT flag=0, color res=7, sort=0, GCT size=7(256 colors)
  lsd[5] = 0; // bg color index
  lsd[6] = 0; // pixel aspect ratio
  buffers.push(lsd);

  // Netscape Application Extension (for looping)
  if (this.repeat >= 0) {
    buffers.push(new Uint8Array([0x21, 0xFF, 0x0B]));
    buffers.push(strToBytes('NETSCAPE2.0'));
    buffers.push(new Uint8Array([0x03, 0x01]));
    var rep = this.repeat;
    buffers.push(new Uint8Array([rep & 0xFF, (rep >> 8) & 0xFF, 0x00]));
  }

  // 编码每一帧
  for (var f = 0; f < frameCount; f++) {
    var pixels = this.frames[f];
    var quant = medianCut(pixels, w * h);
    var palette = quant.palette;
    var indexed = quant.indexed;
    var colorTableSize = quant.tableSize;

    // Graphic Control Extension
    buffers.push(new Uint8Array([0x21, 0xF9, 0x04, 0x00]));
    buffers.push(new Uint8Array([delayCs & 0xFF, (delayCs >> 8) & 0xFF]));
    buffers.push(new Uint8Array([0x00, 0x00]));

    // Image Descriptor
    var id = new Uint8Array(10);
    id[0] = 0x2C;
    id[1] = 0; id[2] = 0; // left
    id[3] = 0; id[4] = 0; // top
    id[5] = w & 0xFF; id[6] = (w >> 8) & 0xFF;
    id[7] = h & 0xFF; id[8] = (h >> 8) & 0xFF;
    id[9] = 0x80 | (colorTableSize - 1); // local color table, size
    buffers.push(id);

    // Local Color Table
    var lct = new Uint8Array(3 * (1 << colorTableSize));
    for (var i = 0; i < palette.length; i++) {
      lct[i * 3] = palette[i][0];
      lct[i * 3 + 1] = palette[i][1];
      lct[i * 3 + 2] = palette[i][2];
    }
    buffers.push(lct);

    // LZW Image Data
    var minCodeSize = colorTableSize;
    if (minCodeSize < 2) minCodeSize = 2;
    var lzwData = lzwEncode(indexed, minCodeSize);
    buffers.push(lzwData);
  }

  // Trailer
  buffers.push(new Uint8Array([0x3B]));

  // 合并所有buffer
  var totalLen = 0;
  for (var i = 0; i < buffers.length; i++) {
    totalLen += buffers[i].length;
  }
  var result = new Uint8Array(totalLen);
  var offset = 0;
  for (var i = 0; i < buffers.length; i++) {
    result.set(buffers[i], offset);
    offset += buffers[i].length;
  }
  return result.buffer;
};

function strToBytes(str) {
  var arr = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

/**
 * 中位切分色彩量化 → 256色
 */
function medianCut(pixels, pixelCount) {
  var colorMap = {};
  var colors = [];
  var i, r, g, b, key;

  // 采样（大图跳像素加速）
  var step = pixelCount > 30000 ? 2 : 1;
  for (i = 0; i < pixelCount; i += step) {
    var idx = i * 4;
    r = pixels[idx] >> 3 << 3;
    g = pixels[idx + 1] >> 3 << 3;
    b = pixels[idx + 2] >> 3 << 3;
    key = (r << 16) | (g << 8) | b;
    if (!colorMap[key]) {
      colorMap[key] = { r: r, g: g, b: b, count: 0 };
      colors.push(colorMap[key]);
    }
    colorMap[key].count++;
  }

  // 如果颜色少于256，直接用
  var maxColors = Math.min(colors.length, 256);
  var tableBits = 2;
  while ((1 << tableBits) < maxColors) tableBits++;
  var tableSize = 1 << tableBits;

  var palette = [];
  var colorIndex = {};

  if (colors.length <= 256) {
    for (i = 0; i < colors.length; i++) {
      colorIndex[(colors[i].r << 16) | (colors[i].g << 8) | colors[i].b] = i;
      palette.push([colors[i].r, colors[i].g, colors[i].b]);
    }
  } else {
    // 中位切分
    var buckets = [colors];
    while (buckets.length < maxColors) {
      // 找最长的桶
      var maxRange = -1, maxIdx = 0;
      for (i = 0; i < buckets.length; i++) {
        var range = getRange(buckets[i]);
        if (range.maxRange > maxRange && buckets[i].length > 1) {
          maxRange = range.maxRange;
          maxIdx = i;
        }
      }
      if (maxRange <= 0) break;
      var bucket = buckets.splice(maxIdx, 1)[0];
      var split = splitBucket(bucket);
      buckets.push(split[0], split[1]);
    }

    // 从每个桶取平均色
    for (i = 0; i < buckets.length; i++) {
      var avg = getAverage(buckets[i]);
      palette.push([avg.r, avg.g, avg.b]);
      for (var j = 0; j < buckets[i].length; j++) {
        var c = buckets[i][j];
        colorIndex[(c.r << 16) | (c.g << 8) | c.b] = i;
      }
    }
  }

  // 生成索引图
  var indexed = new Uint8Array(pixelCount);
  for (i = 0; i < pixelCount; i++) {
    var idx = i * 4;
    r = pixels[idx] >> 3 << 3;
    g = pixels[idx + 1] >> 3 << 3;
    b = pixels[idx + 2] >> 3 << 3;
    key = (r << 16) | (g << 8) | b;
    indexed[i] = colorIndex[key] !== undefined ? colorIndex[key] : findNearest(palette, r, g, b);
  }

  // 确保palette长度为tableSize
  while (palette.length < tableSize) {
    palette.push([0, 0, 0]);
  }

  return { palette: palette, indexed: indexed, tableSize: tableBits };
}

function getRange(bucket) {
  var rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (var i = 0; i < bucket.length; i++) {
    var c = bucket[i];
    if (c.r < rMin) rMin = c.r; if (c.r > rMax) rMax = c.r;
    if (c.g < gMin) gMin = c.g; if (c.g > gMax) gMax = c.g;
    if (c.b < bMin) bMin = c.b; if (c.b > bMax) bMax = c.b;
  }
  var rr = rMax - rMin, gg = gMax - gMin, bb = bMax - bMin;
  var maxR = rr, channel = 'r';
  if (gg > maxR) { maxR = gg; channel = 'g'; }
  if (bb > maxR) { maxR = bb; channel = 'b'; }
  return { maxRange: maxR, channel: channel };
}

function splitBucket(bucket) {
  var info = getRange(bucket);
  var ch = info.channel;
  bucket.sort(function (a, b) { return a[ch] - b[ch]; });
  var mid = Math.floor(bucket.length / 2);
  return [bucket.slice(0, mid), bucket.slice(mid)];
}

function getAverage(bucket) {
  var rSum = 0, gSum = 0, bSum = 0, wSum = 0;
  for (var i = 0; i < bucket.length; i++) {
    var c = bucket[i];
    var w = c.count || 1;
    rSum += c.r * w;
    gSum += c.g * w;
    bSum += c.b * w;
    wSum += w;
  }
  return { r: Math.round(rSum / wSum), g: Math.round(gSum / wSum), b: Math.round(bSum / wSum) };
}

function findNearest(palette, r, g, b) {
  var minDist = Infinity, minIdx = 0;
  for (var i = 0; i < palette.length; i++) {
    var dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
    var dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) { minDist = dist; minIdx = i; }
  }
  return minIdx;
}

/**
 * LZW编码
 */
function lzwEncode(indexed, minCodeSize) {
  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;
  var codeSize = minCodeSize + 1;
  var nextCode = eoiCode + 1;
  var codeLimit = 1 << codeSize;

  var dict = {};
  for (var i = 0; i < clearCode; i++) {
    dict[String.fromCharCode(i)] = i;
  }

  var bits = [];
  var curBits = codeSize;
  var buf = 0, bufBits = 0;

  function writeCode(code) {
    buf |= (code << bufBits);
    bufBits += curBits;
    while (bufBits >= 8) {
      bits.push(buf & 0xFF);
      buf >>= 8;
      bufBits -= 8;
    }
  }

  writeCode(clearCode);

  var curCodeSize = minCodeSize + 1;
  var curLimit = 1 << curCodeSize;
  var dictSize = eoiCode + 1;
  var maxDictSize = 4096;

  // 初始化字典
  var localDict = {};
  for (i = 0; i < clearCode; i++) {
    localDict[String.fromCharCode(i)] = i;
  }
  dictSize = eoiCode + 1;

  var w = String.fromCharCode(indexed[0]);

  for (i = 1; i < indexed.length; i++) {
    var k = String.fromCharCode(indexed[i]);
    var wk = w + k;
    if (localDict[wk] !== undefined) {
      w = wk;
    } else {
      writeCode(localDict[w]);
      if (dictSize < maxDictSize) {
        localDict[wk] = dictSize++;
        if (dictSize > curLimit && curCodeSize < 12) {
          curCodeSize++;
          curLimit = 1 << curCodeSize;
        }
      } else {
        // 字典满了，写clear code重置
        writeCode(clearCode);
        localDict = {};
        for (var j = 0; j < clearCode; j++) {
          localDict[String.fromCharCode(j)] = j;
        }
        dictSize = eoiCode + 1;
        curCodeSize = minCodeSize + 1;
        curLimit = 1 << curCodeSize;
      }
      w = k;
    }
  }

  writeCode(localDict[w]);
  writeCode(eoiCode);

  if (bufBits > 0) {
    bits.push(buf & 0xFF);
  }

  // 分成子块（每块最多255字节）
  var subBlocks = [];
  var pos = 0;
  while (pos < bits.length) {
    var blockSize = Math.min(255, bits.length - pos);
    subBlocks.push(blockSize);
    for (var s = 0; s < blockSize; s++) {
      subBlocks.push(bits[pos + s]);
    }
    pos += blockSize;
  }
  subBlocks.push(0); // 块终止符

  var result = new Uint8Array(1 + subBlocks.length);
  result[0] = minCodeSize;
  for (i = 0; i < subBlocks.length; i++) {
    result[i + 1] = subBlocks[i];
  }
  return result;
}

module.exports = GifEncoder;
