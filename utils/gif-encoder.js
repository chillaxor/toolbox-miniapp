/**
 * 纯JS GIF89a编码器
 * 支持多帧动画GIF生成
 */
function GifEncoder(width, height) {
  this.width = width;
  this.height = height;
  this.frames = [];
  this.delay = 200;
  this.repeat = 0;
}

GifEncoder.prototype.setDelay = function (ms) {
  this.delay = ms;
};

GifEncoder.prototype.setRepeat = function (count) {
  this.repeat = count;
};

GifEncoder.prototype.addFrame = function (imageData) {
  this.frames.push(imageData);
};

GifEncoder.prototype.encode = function () {
  var self = this;
  var w = self.width, h = self.height;
  var delayCs = Math.round(self.delay / 10);
  var out = new ByteArray(w * h * 4 + 4096);

  // GIF89a Header
  out.writeString('GIF89a');

  // Logical Screen Descriptor
  out.writeShort(w);
  out.writeShort(h);
  out.writeByte(0x00); // no GCT
  out.writeByte(0x00); // bg color
  out.writeByte(0x00); // pixel aspect

  // Netscape Extension (looping)
  out.writeByte(0x21);
  out.writeByte(0xFF);
  out.writeByte(0x0B);
  out.writeString('NETSCAPE2.0');
  out.writeByte(0x03);
  out.writeByte(0x01);
  out.writeShort(self.repeat);
  out.writeByte(0x00);

  for (var f = 0; f < self.frames.length; f++) {
    var pixels = self.frames[f];
    var quant = quantize(pixels, w * h);
    var palette = quant.palette;
    var indexed = quant.indexed;
    var colorTableBits = quant.bits;
    var colorTableSize = 1 << colorTableBits;

    // Graphic Control Extension
    out.writeByte(0x21);
    out.writeByte(0xF9);
    out.writeByte(0x04);
    out.writeByte(0x00); // disposal=0, no transparency
    out.writeShort(delayCs);
    out.writeByte(0x00); // transparent color index
    out.writeByte(0x00); // block terminator

    // Image Descriptor
    out.writeByte(0x2C);
    out.writeShort(0); // left
    out.writeShort(0); // top
    out.writeShort(w);
    out.writeShort(h);
    out.writeByte(0x80 | (colorTableBits - 1)); // local color table flag + size

    // Local Color Table
    for (var i = 0; i < colorTableSize; i++) {
      if (i < palette.length) {
        out.writeByte(palette[i][0]);
        out.writeByte(palette[i][1]);
        out.writeByte(palette[i][2]);
      } else {
        out.writeByte(0);
        out.writeByte(0);
        out.writeByte(0);
      }
    }

    // LZW Image Data
    var minCodeSize = colorTableBits;
    if (minCodeSize < 2) minCodeSize = 2;
    out.writeByte(minCodeSize);
    var lzwBlocks = lzwEncode(indexed, minCodeSize);
    for (var b = 0; b < lzwBlocks.length; b++) {
      out.writeByte(lzwBlocks[b]);
    }
  }

  // Trailer
  out.writeByte(0x3B);

  return out.getBuffer();
};

// ========== ByteArray 工具 ==========

function ByteArray(initSize) {
  this.data = new Uint8Array(initSize);
  this.pos = 0;
}

ByteArray.prototype.ensure = function (need) {
  if (this.pos + need > this.data.length) {
    var newSize = Math.max(this.data.length * 2, this.pos + need + 1024);
    var newData = new Uint8Array(newSize);
    newData.set(this.data);
    this.data = newData;
  }
};

ByteArray.prototype.writeByte = function (b) {
  this.ensure(1);
  this.data[this.pos++] = b & 0xFF;
};

ByteArray.prototype.writeShort = function (s) {
  this.writeByte(s & 0xFF);
  this.writeByte((s >> 8) & 0xFF);
};

ByteArray.prototype.writeString = function (str) {
  this.ensure(str.length);
  for (var i = 0; i < str.length; i++) {
    this.data[this.pos++] = str.charCodeAt(i);
  }
};

ByteArray.prototype.writeBytes = function (arr) {
  this.ensure(arr.length);
  this.data.set(arr, this.pos);
  this.pos += arr.length;
};

ByteArray.prototype.getBuffer = function () {
  return this.data.buffer.slice(0, this.pos);
};

// ========== 色彩量化（中位切分 → 256色） ==========

function quantize(pixels, pixelCount) {
  var colorMap = {};
  var colors = [];
  var step = pixelCount > 20000 ? 4 : pixelCount > 5000 ? 2 : 1;

  for (var i = 0; i < pixelCount; i += step) {
    var idx = i * 4;
    var r = pixels[idx] & 0xF8;
    var g = pixels[idx + 1] & 0xF8;
    var b = pixels[idx + 2] & 0xF8;
    var key = (r << 16) | (g << 8) | b;
    if (!colorMap[key]) {
      colorMap[key] = { r: r, g: g, b: b, count: 0 };
      colors.push(colorMap[key]);
    }
    colorMap[key].count++;
  }

  var palette;
  var colorIdxMap = {};

  if (colors.length <= 256) {
    palette = [];
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      palette.push([c.r, c.g, c.b]);
      colorIdxMap[(c.r << 16) | (c.g << 8) | c.b] = i;
    }
  } else {
    // 中位切分
    var buckets = [colors];
    while (buckets.length < 256) {
      var maxRange = -1, maxIdx = 0;
      for (var i = 0; i < buckets.length; i++) {
        var r = bucketRange(buckets[i]);
        if (r.max > maxRange && buckets[i].length > 1) {
          maxRange = r.max;
          maxIdx = i;
        }
      }
      if (maxRange <= 0) break;
      var bucket = buckets.splice(maxIdx, 1)[0];
      var split = splitBucket(bucket);
      buckets.push(split[0], split[1]);
    }

    palette = [];
    for (var i = 0; i < buckets.length; i++) {
      var avg = bucketAvg(buckets[i]);
      palette.push([avg.r, avg.g, avg.b]);
      for (var j = 0; j < buckets[i].length; j++) {
        var bc = buckets[i][j];
        colorIdxMap[(bc.r << 16) | (bc.g << 8) | bc.b] = i;
      }
    }
  }

  var bits = 2;
  while ((1 << bits) < palette.length) bits++;

  // 生成索引图
  var indexed = new Uint8Array(pixelCount);
  for (var i = 0; i < pixelCount; i++) {
    var idx = i * 4;
    var r = pixels[idx] & 0xF8;
    var g = pixels[idx + 1] & 0xF8;
    var b = pixels[idx + 2] & 0xF8;
    var key = (r << 16) | (g << 8) | b;
    if (colorIdxMap[key] !== undefined) {
      indexed[i] = colorIdxMap[key];
    } else {
      indexed[i] = nearestColor(palette, r, g, b);
    }
  }

  return { palette: palette, indexed: indexed, bits: bits };
}

function bucketRange(bucket) {
  var rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (var i = 0; i < bucket.length; i++) {
    var c = bucket[i];
    if (c.r < rMin) rMin = c.r; if (c.r > rMax) rMax = c.r;
    if (c.g < gMin) gMin = c.g; if (c.g > gMax) gMax = c.g;
    if (c.b < bMin) bMin = c.b; if (c.b > bMax) bMax = c.b;
  }
  var rr = rMax - rMin, gg = gMax - gMin, bb = bMax - bMin;
  var max = rr, ch = 'r';
  if (gg > max) { max = gg; ch = 'g'; }
  if (bb > max) { max = bb; ch = 'b'; }
  return { max: max, ch: ch };
}

function splitBucket(bucket) {
  var info = bucketRange(bucket);
  var ch = info.ch;
  bucket.sort(function (a, b) { return a[ch] - b[ch]; });
  var mid = Math.floor(bucket.length / 2);
  return [bucket.slice(0, mid), bucket.slice(mid)];
}

function bucketAvg(bucket) {
  var rSum = 0, gSum = 0, bSum = 0, wSum = 0;
  for (var i = 0; i < bucket.length; i++) {
    var c = bucket[i];
    var w = c.count || 1;
    rSum += c.r * w;
    gSum += c.g * w;
    bSum += c.b * w;
    wSum += w;
  }
  return {
    r: Math.round(rSum / wSum),
    g: Math.round(gSum / wSum),
    b: Math.round(bSum / wSum)
  };
}

function nearestColor(palette, r, g, b) {
  var minDist = Infinity, minIdx = 0;
  for (var i = 0; i < palette.length; i++) {
    var dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
    var dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) { minDist = dist; minIdx = i; }
  }
  return minIdx;
}

// ========== LZW编码（正确的GIF LZW实现） ==========

function lzwEncode(indexed, minCodeSize) {
  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;

  var codeSize = minCodeSize + 1;
  var nextCode = eoiCode + 1;
  var codeLimit = 1 << codeSize;

  // 使用数组做字典树，性能更好
  var dict = new Map();
  resetDict();

  var buffer = 0;
  var bufferBits = 0;
  var output = [];

  function writeBits(code, numBits) {
    buffer |= (code << bufferBits);
    bufferBits += numBits;
    while (bufferBits >= 8) {
      output.push(buffer & 0xFF);
      buffer >>= 8;
      bufferBits -= 8;
    }
  }

  function resetDict() {
    dict = new Map();
    for (var i = 0; i < clearCode; i++) {
      dict.set(i.toString(), i);
    }
    nextCode = eoiCode + 1;
    codeSize = minCodeSize + 1;
    codeLimit = 1 << codeSize;
  }

  // 写入Clear Code
  writeBits(clearCode, codeSize);

  var indexBuffer = indexed[0].toString();

  for (var i = 1; i < indexed.length; i++) {
    var k = indexed[i].toString();
    var combined = indexBuffer + ',' + k;

    if (dict.has(combined)) {
      indexBuffer = combined;
    } else {
      writeBits(dict.get(indexBuffer), codeSize);

      if (nextCode < 4096) {
        dict.set(combined, nextCode);
        nextCode++;
        if (nextCode > codeLimit && codeSize < 12) {
          codeSize++;
          codeLimit = 1 << codeSize;
        }
      } else {
        // 字典满了，输出Clear Code并重置
        writeBits(clearCode, codeSize);
        resetDict();
      }

      indexBuffer = k;
    }
  }

  // 输出最后一个code
  writeBits(dict.get(indexBuffer), codeSize);

  // 输出EOI
  writeBits(eoiCode, codeSize);

  // 刷新剩余位
  if (bufferBits > 0) {
    output.push(buffer & 0xFF);
  }

  // 分成子块
  var result = [];
  var pos = 0;
  while (pos < output.length) {
    var blockSize = Math.min(255, output.length - pos);
    result.push(blockSize);
    for (var j = 0; j < blockSize; j++) {
      result.push(output[pos + j]);
    }
    pos += blockSize;
  }
  result.push(0); // 块终止符

  return result;
}

module.exports = GifEncoder;
