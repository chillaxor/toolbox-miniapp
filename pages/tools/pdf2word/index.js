var storage = require('../../../utils/storage.js');

var CLOUD_ENV = 'cloud1-d9gm1qla9bebafa31';

var FORMAT_LABELS = {
  docx: 'Word(.docx)',
  rtf: 'RTF(.rtf)',
  txt: '纯文本(.txt)'
};

Page({
  data: {
    filePath: '',
    fileName: '',
    fileSize: '',
    outputFormat: 'docx',
    formatLabel: 'Word(.docx)',
    isFavorite: false,
    isExtracting: false,
    isCloudConverting: false,
    resultText: '',
    resultCharCount: 0,
    resultPath: '',
    resultExt: '',
    cloudReady: false,
    youdaoAvailable: false,
    dailyUserUsed: 0,
    dailyUserLimit: 1,
    dailyUserRemaining: 1,
    dailyTotalUsed: 0,
    dailyTotalLimit: 20,
    dailyTotalRemaining: 20,
    cloudResultFileID: '',
    cloudResultName: '',
    tips: [
      '纯本地解析·文件不上传·保护隐私',
      'AI云端转换输出',
      '生成RTF/TXT可被Word/WPS直接打开',
      '复杂排版建议用WPS等专业App'
    ]
  },

  onLoad: function () { this.checkFavorite(); this.checkCloudQuota(); },
  onShow: function () { this.checkFavorite(); this.checkCloudQuota(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('pdf2word') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('pdf2word') }); },

  formatFileSize: function (bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
  },

  onChoosePDF: function () {
    var self = this;
    wx.showActionSheet({
      itemList: ['💬 从聊天记录选择', '📁 从手机文件管理器选择'],
      success: function (res) {
        if (res.tapIndex === 0) {
          self.doChooseFile(false);
        } else if (res.tapIndex === 1) {
          self.chooseFromFileManager();
        }
      },
      fail: function () {}
    });
  },

  chooseFromFileManager: function () {
    var self = this;
    wx.showModal({
      title: '从手机文件管理器选择',
      content: '点击"去选择"后，在弹出的面板中点击「文件管理器」或「本地文件」入口，即可浏览手机文件夹选择PDF文件。\n\n若未看到该入口，请升级微信到最新版本。',
      confirmText: '去选择',
      cancelText: '取消',
      success: function (r) {
        if (!r.confirm) return;
        self.doChooseFile(true);
      }
    });
  },

  doChooseFile: function (fromFileManager) {
    var self = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        var file = res.tempFiles[0];
        if (!file) {
          wx.showToast({ title: '未选择到文件', icon: 'none' });
          return;
        }
        self.setData({
          filePath: file.path,
          fileName: file.name,
          fileSize: self.formatFileSize(file.size),
          resultText: '',
          resultCharCount: 0,
          resultPath: '',
          resultExt: ''
        });
        storage.addHistory({
          toolId: 'pdf2word', toolName: 'PDF转Word', category: 'image',
          summary: '选择了文件：' + file.name,
          timestamp: Date.now()
        });
        wx.showToast({ title: '已选择文件', icon: 'success', duration: 1200 });
      },
      fail: function (err) {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择失败：' + (err.errMsg || '未知错误'), icon: 'none' });
        }
      }
    });
  },

  onFormatChange: function (e) {
    var fmt = e.currentTarget.dataset.format;
    this.setData({
      outputFormat: fmt,
      formatLabel: FORMAT_LABELS[fmt] || fmt
    });
  },

  /**
   * 查询云函数额度
   */
  checkCloudQuota: function () {
    var self = this;
    if (!wx.cloud) {
      self.setData({ cloudReady: false });
      return;
    }
    wx.cloud.callFunction({
      name: 'pdf2word',
      data: { action: 'quota' },
      env: CLOUD_ENV,
      success: function (res) {
        if (res && res.result && res.result.success) {
          self.setData({
            cloudReady: true,
            youdaoAvailable: !!res.result.youdaoAvailable,
            dailyUserUsed: res.result.dailyUserUsed,
            dailyUserLimit: res.result.dailyUserLimit,
            dailyUserRemaining: res.result.dailyUserRemaining,
            dailyTotalUsed: res.result.dailyTotalUsed,
            dailyTotalLimit: res.result.dailyTotalLimit,
            dailyTotalRemaining: res.result.dailyTotalRemaining
          });
        }
      },
      fail: function () {
        self.setData({ cloudReady: false });
      }
    });
  },

  /**
   * 调用云函数进行AI PDF转Word
   */
  onCloudConvert: function () {
    var self = this;
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    if (this.data.isCloudConverting) return;
    if (!this.data.cloudReady) {
      wx.showToast({ title: '云服务暂不可用', icon: 'none' });
      return;
    }
    if (!this.data.youdaoAvailable) {
      wx.showModal({
        title: '云服务未配置',
        content: '有道API密钥未配置，请在云函数环境变量中设置 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET',
        showCancel: false
      });
      return;
    }
    if (this.data.dailyUserRemaining <= 0) {
      wx.showModal({
        title: '今日次数已用完',
        content: '每人每天可使用 ' + this.data.dailyUserLimit + ' 次，明天再来吧',
        showCancel: false
      });
      return;
    }
    if (this.data.dailyTotalRemaining <= 0) {
      wx.showModal({
        title: '今日总量已用完',
        content: '今日全局总量 ' + this.data.dailyTotalLimit + ' 次已用完，明天再来',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '云端AI转换',
      content: '将通过有道智云将PDF转为Word(.docx)\n\n⏱️ 转换时长取决于文件大小和页数（通常 30s~2min）\n📊 本次将消耗 1 次个人额度（每天共 ' + this.data.dailyUserLimit + ' 次）\n💾 转换完成后文件将保存到本机\n\n确认开始转换？',
      confirmText: '开始转换',
      success: function (r) {
        if (!r.confirm) return;
        self.startCloudConvert();
      }
    });
  },

  startCloudConvert: function () {
    var self = this;
    self.setData({
      isCloudConverting: true,
      loadingText: '正在上传到云端...',
      resultText: '',
      resultCharCount: 0,
      resultPath: '',
      resultExt: '',
      cloudResultFileID: '',
      cloudResultName: ''
    });

    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: this.data.filePath,
      encoding: 'base64',
      success: function (readRes) {
        self.setData({ loadingText: '正在上传到云端...' });
        wx.cloud.callFunction({
          name: 'pdf2word',
          data: {
            action: 'convert',
            fileBase64: readRes.data,
            fileName: self.data.fileName
          },
          env: CLOUD_ENV,
          success: function (callRes) {
            self.setData({ isCloudConverting: false });
            if (!callRes || !callRes.result) {
              wx.showToast({ title: '转换失败', icon: 'none' });
              return;
            }
            var result = callRes.result;
            if (!result.success) {
              self.handleCloudError(result);
              return;
            }
            self.setData({
              dailyUserUsed: result.dailyUserUsed,
              dailyUserRemaining: result.dailyUserRemaining,
              dailyTotalUsed: result.dailyTotalUsed,
              dailyTotalRemaining: result.dailyTotalRemaining,
              cloudResultFileID: result.fileID,
              cloudResultName: result.fileName
            });
            self.downloadAndSaveResult(result.fileID, result.fileName);
            storage.addHistory({
              toolId: 'pdf2word', toolName: 'PDF转Word', category: 'image',
              summary: '云端AI转换：' + result.fileName,
              timestamp: Date.now()
            });
          },
          fail: function (err) {
            self.setData({ isCloudConverting: false });
            var msg = '云函数调用失败';
            if (err && err.errMsg) {
              if (err.errMsg.indexOf('timeout') !== -1) msg = '请求超时（转换可能仍在进行）';
              else if (err.errMsg.indexOf('FunctionName') !== -1) msg = '云函数未部署，请在开发者工具上传 pdf2word';
            }
            wx.showModal({ title: '服务异常', content: msg, showCancel: false });
          }
        });
      },
      fail: function () {
        self.setData({ isCloudConverting: false });
        wx.showToast({ title: '文件读取失败', icon: 'none' });
      }
    });
  },

  handleCloudError: function (result) {
    var title = '转换失败';
    var content = result.errorMsg || '未知错误';
    if (result.errorCode === 'USER_LIMIT') {
      title = '今日次数已用完';
    } else if (result.errorCode === 'TOTAL_LIMIT') {
      title = '今日总量已用完';
    } else if (result.errorCode === 'NO_CONFIG') {
      title = '云服务未配置';
    } else if (result.errorCode === 'CONVERT_FAILED' || result.errorCode === 'TIMEOUT') {
      title = '转换未完成';
    }
    if (result.errorCode === 'USER_LIMIT' || result.errorCode === 'TOTAL_LIMIT') {
      // 刷新额度
      this.checkCloudQuota();
    }
    wx.showModal({ title: title, content: content, showCancel: false });
  },

  /**
   * 从云存储下载docx并保存到本机
   */
  downloadAndSaveResult: function (fileID, fileName) {
    var self = this;
    wx.showLoading({ title: '下载文件中...', mask: true });
    wx.cloud.downloadFile({
      fileID: fileID,
      success: function (res) {
        wx.hideLoading();
        var tempFilePath = res.tempFilePath;
        var savePath = wx.env.USER_DATA_PATH + '/pdf2word_' + Date.now() + '.docx';
        var fs = wx.getFileSystemManager();
        // 复制到持久目录
        fs.saveFile({
          tempFilePath: tempFilePath,
          filePath: savePath,
          success: function () {
            self.setData({
              resultPath: savePath,
              resultExt: 'docx'
            });
            wx.showModal({
              title: '🎉 转换成功',
              content: '已生成 ' + fileName + '，是否立即用Word/WPS打开？',
              confirmText: '打开',
              cancelText: '稍后',
              success: function (r) {
                if (r.confirm) self.onOpenResult();
              }
            });
          },
          fail: function () {
            // 降级：直接用 tempFilePath
            self.setData({ resultPath: tempFilePath, resultExt: 'docx' });
            wx.showModal({
              title: '🎉 转换成功',
              content: '已生成 ' + fileName,
              confirmText: '打开',
              success: function (r) { if (r.confirm) self.onOpenResult(); }
            });
          }
        });
      },
      fail: function (err) {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
        console.error('[pdf2word] downloadFile fail:', err);
      }
    });
  },

  onPreviewPDF: function () {
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    var self = this;
    wx.openDocument({
      filePath: this.data.filePath,
      showMenu: true,
      success: function () {
        wx.showModal({
          title: '查看提示',
          content: 'PDF已打开，查看完毕后请返回此页面继续操作。\n\n提示：微信内置预览器支持长按复制单段文字。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: function () {
        wx.showToast({ title: '无法打开此PDF文件', icon: 'none' });
      }
    });
  },

  /**
   * 提取PDF文本并生成Word/TXT文件
   * 纯本地实现：不联网、不传文件、不调云函数
   */
  onExtractText: function () {
    var self = this;
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    if (this.data.isExtracting) return;

    self.setData({ isExtracting: true });
    wx.showLoading({ title: '正在解析PDF...', mask: true });

    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: this.data.filePath,
      success: function (readRes) {
        self.parsePdfText(readRes.data).then(function (text) {
          wx.hideLoading();

          if (!text || text.length < 2) {
            self.setData({ isExtracting: false });
            wx.showModal({
              title: '提取失败',
              content: '未能从该PDF中提取到文字。可能原因：\n1. PDF为扫描件（纯图片）\n2. PDF使用Flate压缩未解压\n3. PDF结构被加密\n\n建议使用"分享到WPS/Word"功能转换。',
              showCancel: false,
              confirmText: '我知道了'
            });
            return;
          }

          self.setData({
            resultText: text.length > 800 ? text.substring(0, 800) + '...' : text,
            resultCharCount: text.length,
            isExtracting: false
          });
          self.writeOutputFile(text);
        }).catch(function (err) {
          wx.hideLoading();
          self.setData({ isExtracting: false });
          console.error('[pdf2word] parse error:', err);
          wx.showToast({ title: '解析失败', icon: 'none' });
        });
      },
      fail: function (err) {
        wx.hideLoading();
        self.setData({ isExtracting: false });
        wx.showToast({ title: '读取文件失败', icon: 'none' });
      }
    });
  },

  /**
   * 解析PDF文本（无需依赖pako/外部库）
   * 返回 Promise，resolve 出整理好的纯文本
   * 策略：
   *   1. 直接在原始字节中搜索 (text) 模式 —— 覆盖未压缩 PDF
   *   2. 尝试用原生 DecompressionStream 解压 FlateDecode 流 —— 覆盖压缩 PDF
   *   3. 解码 PDF 字符串转义（\n \r \t \\ \( \) 八进制等）
   */
  parsePdfText: function (arrayBuffer) {
    var self = this;
    return new Promise(function (resolve) {
      var bytes = new Uint8Array(arrayBuffer);
      var allText = [];
      var seen = {};

      // 方法1: 遍历 stream...endstream，先在原始块里找文本
      var content = self.bytesToString(bytes);
      var streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      var pending = [];
      var m;
      while ((m = streamRe.exec(content)) !== null) {
        var body = m[1];
        self.extractTextObjects(body, allText, seen);
        // 方法2: 异步尝试解压
        pending.push(self.tryInflate(body).then(function (decoded) {
          if (decoded) self.extractTextObjects(decoded, allText, seen);
        }).catch(function () {}));
      }

      // 方法3: 直接在原始字节里扫一遍（兜底）
      self.extractFromRawBytes(bytes, allText, seen);

      // 等所有解压都完成
      Promise.all(pending).then(function () {
        resolve(self.cleanupText(allText.join('\n')));
      });
    });
  },

  /**
   * 尝试用原生 DecompressionStream 解压 FlateDecode 流
   * 微信基础库 2.16+ 在部分客户端支持，失败返回 null
   */
  tryInflate: function (raw) {
    if (typeof DecompressionStream === 'undefined') {
      return Promise.resolve(null);
    }
    try {
      var u8 = typeof raw === 'string' ? this.stringToBytes(raw) : new Uint8Array(raw);
      var ds = new DecompressionStream('deflate-raw');
      var writer = ds.writable.getWriter();
      var reader = ds.readable.getReader();
      writer.write(u8);
      writer.close();
      var chunks = [];
      function readAll() {
        return reader.read().then(function (r) {
          if (r.done) return chunks;
          chunks.push(r.value);
          return readAll();
        });
      }
      return readAll().then(function (arrs) {
        return new TextDecoder('utf-8', { fatal: false }).decode(this.concatBytes(arrs));
      }.bind(this));
    } catch (e) {
      return Promise.resolve(null);
    }
  },

  /**
   * 从content stream的文本中提取 Tj / TJ 操作符的字符串
   */
  extractTextObjects: function (text, allText, seen) {
    if (!text) return;
    // Tj 操作: (str) Tj
    var tjRe = /\((?:\\.|[^\\()]|\((?:[^()]*)\))*\)\s*Tj/g;
    // TJ 数组: [(str) (str)] TJ
    var tjArrRe = /\[((?:\\.|[^[\]])*)\]\s*TJ/g;
    // ' (引号) 操作符
    var quoteRe = /\u0027((?:\\.|[^\u0027])*)\u0027/g;

    var combined = '';
    var m;
    while ((m = tjRe.exec(text)) !== null) combined += this.decodePdfString(m[0]);
    while ((m = tjArrRe.exec(text)) !== null) {
      var inner = m[1];
      var innerRe = /\(([^)]*)\)/g;
      var im;
      while ((im = innerRe.exec(inner)) !== null) {
        combined += this.decodePdfString('(' + im[1] + ')');
      }
    }
    while ((m = quoteRe.exec(text)) !== null) {
      combined += this.decodePdfString('(' + m[1] + ')');
    }

    if (combined.length > 0) {
      var key = combined.substring(0, 50);
      if (!seen[key]) {
        seen[key] = true;
        allText.push(combined);
      }
    }
  },

  /**
   * 在原始字节里直接匹配 (str) 模式（很多PDF里BT...ET文本块并不压缩）
   */
  extractFromRawBytes: function (bytes, allText, seen) {
    var str = this.bytesToString(bytes);
    var re = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    var m;
    var combined = '';
    while ((m = re.exec(str)) !== null) {
      var t = m[1];
      // 过滤掉明显是PDF语法的（如页面对象引用 /F1 5 0 R）
      if (/^[\w\.\-]+$/.test(t) && t.length < 30) continue;
      if (t.indexOf('\\') === -1 && !/[a-zA-Z0-9\u4e00-\u9fa5]/.test(t)) continue;
      combined += this.decodePdfString('(' + t + ')');
    }
    if (combined.length > 0) {
      var key = combined.substring(0, 50);
      if (!seen[key]) {
        seen[key] = true;
        allText.push(combined);
      }
    }
  },

  /**
   * 解码PDF字符串中的转义字符
   */
  decodePdfString: function (raw) {
    var s = raw;
    // 去掉外层括号
    if (s.charAt(0) === '(') s = s.substring(1);
    if (s.charAt(s.length - 1) === ')') s = s.substring(0, s.length - 1);

    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '\\') {
        var n = s.charAt(i + 1);
        if (n === 'n') { out += '\n'; i++; }
        else if (n === 'r') { out += '\r'; i++; }
        else if (n === 't') { out += '\t'; i++; }
        else if (n === 'b') { out += '\b'; i++; }
        else if (n === 'f') { out += '\f'; i++; }
        else if (n === '(') { out += '('; i++; }
        else if (n === ')') { out += ')'; i++; }
        else if (n === '\\') { out += '\\'; i++; }
        else if (n >= '0' && n <= '9') {
          var oct = n;
          for (var k = 1; k < 3 && i + k < s.length; k++) {
            var nk = s.charAt(i + k);
            if (nk >= '0' && nk <= '7') oct += nk; else break;
          }
          out += String.fromCharCode(parseInt(oct, 8));
          i += oct.length - 1;
        } else {
          out += n;
          i++;
        }
      } else {
        out += c;
      }
    }
    return out;
  },

  /**
   * 文本清理：合并多余空行、去重段落
   */
  cleanupText: function (text) {
    if (!text) return '';
    return text
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  bytesToString: function (bytes) {
    try {
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } catch (e) {}
    // 回退：latin-1 风格
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  },

  stringToBytes: function (str) {
    var out = [];
    for (var i = 0; i < str.length; i++) out.push(str.charCodeAt(i) & 0xff);
    return new Uint8Array(out);
  },

  concatBytes: function (arrs) {
    var total = 0;
    for (var i = 0; i < arrs.length; i++) total += arrs[i].length;
    var out = new Uint8Array(total);
    var off = 0;
    for (var j = 0; j < arrs.length; j++) {
      out.set(arrs[j], off);
      off += arrs[j].length;
    }
    return out;
  },

  /**
   * 把提取出的文本按当前格式写为文件
   */
  writeOutputFile: function (text) {
    var self = this;
    var fmt = this.data.outputFormat;
    var fs = wx.getFileSystemManager();
    var baseName = (this.data.fileName || 'pdf').replace(/\.pdf$/i, '');
    var fileName, filePath, content;

    if (fmt === 'rtf') {
      fileName = baseName + '.rtf';
      filePath = wx.env.USER_DATA_PATH + '/pdf2word_' + Date.now() + '.rtf';
      content = this.buildRtf(text);
    } else if (fmt === 'docx') {
      // 微信小程序不打包jszip时降级为RTF
      fileName = baseName + '.rtf';
      filePath = wx.env.USER_DATA_PATH + '/pdf2word_' + Date.now() + '.rtf';
      content = this.buildRtf(text);
      wx.showModal({
        title: '格式说明',
        content: '小程序无 zip 库时已自动输出 RTF 格式（Word/WPS 均可打开编辑）。如需真实 .docx，请用"分享到WPS"功能。',
        showCancel: false
      });
    } else {
      fileName = baseName + '.txt';
      filePath = wx.env.USER_DATA_PATH + '/pdf2word_' + Date.now() + '.txt';
      content = text;
    }

    var dataType = fmt === 'txt' || fmt === 'rtf' || fmt === 'docx' ? 'string' : 'string';
    fs.writeFile({
      filePath: filePath,
      data: content,
      encoding: 'utf8',
      success: function () {
        self.setData({
          resultPath: filePath,
          resultExt: fileName.split('.').pop()
        });
        storage.addHistory({
          toolId: 'pdf2word', toolName: 'PDF转Word', category: 'image',
          summary: '已生成' + fileName + '（' + text.length + '字）',
          timestamp: Date.now()
        });
        wx.showToast({ title: '已生成 ' + fileName, icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '文件保存失败', icon: 'none' });
      }
    });
  },

  /**
   * 构造 RTF 文档（Word/WPS 均可打开）
   */
  buildRtf: function (text) {
    var escaped = text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par\n');

    var lines = [
      '{\\rtf1\\ansi\\ansicpg65001\\deff0',
      '{\\fonttbl{\\f0\\fnil\\fcharset134 \\u25991\\u31616\\u20307;}{\\f1\\fnil\\fcharset0 Arial;}}',
      '{\\colortbl;\\red0\\green0\\blue0;\\red0\\green0\\blue255;}',
      '\\viewkind4\\uc1\\lang2052\\f0\\fs24',
      escaped,
      '}'
    ];
    return lines.join('\n');
  },

  /**
   * 打开生成的输出文件
   */
  onOpenResult: function () {
    if (!this.data.resultPath) {
      wx.showToast({ title: '请先生成文件', icon: 'none' });
      return;
    }
    wx.openDocument({
      filePath: this.data.resultPath,
      showMenu: true,
      success: function () {
        wx.showToast({ title: '已用Word打开', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '打开失败，请用其他App打开', icon: 'none' });
      }
    });
  },

  /**
   * 复制提取出的全部文字
   */
  onCopyExtracted: function () {
    if (!this.data.resultText) return;
    var fullText = this.data.resultText.replace(/\.\.\.$/, '');
    wx.setClipboardData({
      data: fullText,
      success: function () {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  /**
   * 分享PDF到其他App（WPS、Word等）
   */
  onShareToApp: function () {
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    if (typeof wx.shareFileMessage !== 'function') {
      wx.showModal({
        title: '微信版本过低',
        content: '请升级到最新版微信后使用此功能',
        showCancel: false
      });
      return;
    }
    wx.shareFileMessage({
      filePath: this.data.filePath,
      success: function () {
        storage.addHistory({
          toolId: 'pdf2word', toolName: 'PDF转Word', category: 'image',
          summary: '分享PDF到其他App转换',
          timestamp: Date.now()
        });
      },
      fail: function (err) {
        if (!err || !err.errMsg || err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '分享失败', icon: 'none' });
        }
      }
    });
  },

  onShowTips: function () {
    wx.showModal({
      title: 'PDF转Word方法汇总',
      content: '1. 电脑Word直接打开PDF自动转换\n2. 在线工具：smallpdf.com / ilovepdf.com\n3. WPS Office：手机端直接转换\n4. Adobe Acrobat：付费专业方案\n5. 福昕PDF：免费方案转换效果佳\n\n本工具箱提供纯本地提取（适合文字型PDF），复杂排版请用"分享到WPS/Word"功能。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onClear: function () {
    this.setData({
      filePath: '',
      fileName: '',
      fileSize: '',
      resultText: '',
      resultCharCount: 0,
      resultPath: '',
      resultExt: '',
      cloudResultFileID: '',
      cloudResultName: ''
    });
  },

  onShareAppMessage: function () {
    return { title: 'PDF转Word - 工具箱', path: '/pages/tools/pdf2word/index' };
  }
});
