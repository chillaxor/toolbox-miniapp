var storage = require('../../../utils/storage.js');

var CLOUD_ENV = 'cloud1-d9gm1qla9bebafa31';

Page({
  data: {
    filePath: '',
    fileName: '',
    fileSize: '',
    isFavorite: false,
    isConverting: false,
    cloudReady: false,
    dailyUserUsed: 0,
    dailyUserRemaining: 5,
    dailyTotalUsed: 0,
    dailyTotalRemaining: 100,
    cloudResultFileID: '',
    cloudResultName: '',
    resultPath: '',
    resultExt: '',
    tips: [
      '纯本地处理·不上传第三方·保护隐私',
      '提取PDF文字生成真实 .docx 文件',
      '扫描件（纯图片PDF）无法提取文字',
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
      content: '点击"去选择"后，在弹出的面板中点击「文件管理器」或「本地文件」入口，即可浏览手机文件夹选择PDF文件。',
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
        // 前端预校验文件大小（20MB）
        var MAX_PDF_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_PDF_SIZE) {
          wx.showModal({
            title: '文件过大',
            content: 'PDF文件不能超过20MB，当前文件 ' + self.formatFileSize(file.size) + '，请压缩后重试',
            showCancel: false
          });
          return;
        }
        self.setData({
          filePath: file.path,
          fileName: file.name,
          fileSize: self.formatFileSize(file.size),
          resultPath: '',
          resultExt: '',
          cloudResultFileID: '',
          cloudResultName: ''
        });
        storage.addHistory({
          toolId: 'pdf2word', toolName: 'PDF转Word', category: 'image',
          summary: '选择了文件：' + file.name,
          timestamp: Date.now()
        });
        wx.showToast({ title: '已选择文件', icon: 'success', duration: 1200 });
      },
      fail: function () {}
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
            dailyUserUsed: res.result.dailyUserUsed,
            dailyUserRemaining: res.result.dailyUserRemaining,
            dailyTotalUsed: res.result.dailyTotalUsed,
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
   * 云端转换PDF为Word
   */
  onCloudConvert: function () {
    var self = this;
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    if (this.data.isConverting) return;
    if (!this.data.cloudReady) {
      wx.showToast({ title: '云服务暂不可用', icon: 'none' });
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
        content: '今日全局总量已用完，明天再来',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '云端转换',
      content: '提取PDF文字生成真实 .docx\n\n⏱️ 转换时长取决于页数（通常 5~30s）\n📊 确认开始？',
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
      isConverting: true,
      resultPath: '',
      resultExt: '',
      cloudResultFileID: '',
      cloudResultName: ''
    });
    wx.showLoading({ title: '正在转换...', mask: true });

    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: this.data.filePath,
      encoding: 'base64',
      success: function (readRes) {
        wx.cloud.callFunction({
          name: 'pdf2word',
          data: {
            action: 'convert',
            fileBase64: readRes.data,
            fileName: self.data.fileName
          },
          env: CLOUD_ENV,
          timeout: 60000,
          success: function (callRes) {
            wx.hideLoading();
            self.setData({ isConverting: false });
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
              summary: '云端转换：' + result.fileName + '（' + result.charCount + '字）',
              timestamp: Date.now()
            });
            // 如果 PDF 超过页数上限被截断，提示用户
            if (result.truncated) {
              setTimeout(function () {
                wx.showModal({
                  title: '页数过多',
                  content: 'PDF页数超过上限，仅转换了前 ' + result.maxPages + ' 页',
                  showCancel: false,
                  confirmText: '知道了'
                });
              }, 500);
            }
          },
          fail: function (err) {
            wx.hideLoading();
            self.setData({ isConverting: false });
            var msg = '云函数调用失败';
            if (err && err.errMsg) {
              if (err.errMsg.indexOf('timeout') !== -1) msg = '请求超时';
              else if (err.errMsg.indexOf('FunctionName') !== -1) msg = '云函数未部署';
            }
            wx.showModal({ title: '服务异常', content: msg, showCancel: false });
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        self.setData({ isConverting: false });
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
    } else if (result.errorCode === 'NO_TEXT') {
      title = '无法提取文字';
      content = '可能是扫描件（纯图片PDF），建议使用OCR工具';
    } else if (result.errorCode === 'BAD_FILE') {
      title = '文件无效';
    } else if (result.errorCode === 'FILE_TOO_LARGE') {
      title = '文件过大';
    } else if (result.errorCode === 'UPLOAD_FAILED') {
      title = '上传失败';
    }
    if (result.errorCode === 'USER_LIMIT' || result.errorCode === 'TOTAL_LIMIT') {
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
        fs.saveFile({
          tempFilePath: tempFilePath,
          filePath: savePath,
          success: function () {
            self.setData({ resultPath: savePath, resultExt: 'docx' });
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
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  onOpenResult: function () {
    if (!this.data.resultPath) {
      wx.showToast({ title: '请先生成文件', icon: 'none' });
      return;
    }
    wx.openDocument({
      filePath: this.data.resultPath,
      showMenu: true,
      success: function () {
        wx.showToast({ title: '已打开', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '打开失败，请用其他App打开', icon: 'none' });
      }
    });
  },

  /**
   * 分享PDF到其他App
   */
  onShareToApp: function () {
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择PDF文件', icon: 'none' });
      return;
    }
    wx.shareFileMessage({
      filePath: this.data.filePath,
      success: function () {},
      fail: function () {
        wx.showToast({ title: '分享失败', icon: 'none' });
      }
    });
  },

  onClear: function () {
    this.setData({
      filePath: '',
      fileName: '',
      fileSize: '',
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
