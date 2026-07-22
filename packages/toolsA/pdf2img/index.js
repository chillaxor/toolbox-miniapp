var storage = require('../../../utils/storage.js');

var CLOUD_ENV = 'cloud1-d9gm1qla9bebafa31';

Page({
  data: {
    filePath: '',
    fileName: '',
    fileSize: '',
    pageCount: '',
    selectedFormat: 'png',
    selectedQuality: 'high',
    isConverting: false,
    convertedImages: [],
    isFavorite: false,
    cloudReady: false,
    dailyUserUsed: 0,
    dailyUserRemaining: 5,
    dailyTotalUsed: 0,
    dailyTotalRemaining: 100,
    tips: [
      '选择PDF文件后，可云端转换为高清图片',
      'PNG适合文字截图，JPG适合图片内容',
      '建议使用"高质量"获得更清晰的效果',
      '纯本地处理·不上传第三方·保护隐私'
    ]
  },

  onLoad: function () { this.checkFavorite(); this.checkCloudQuota(); },
  onShow: function () { this.checkFavorite(); this.checkCloudQuota(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('pdf2img') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('pdf2img') }); },

  formatFileSize: function (bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
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
          convertedImages: []
        });
        storage.addHistory({
          toolId: 'pdf2img', toolName: 'PDF转图片', category: 'image',
          summary: '选择了文件：' + file.name,
          timestamp: Date.now()
        });
      },
      fail: function () {}
    });
  },

  onChoosePDF: function () {
    this.doChooseFile(false);
  },

  onFormatChange: function (e) {
    this.setData({ selectedFormat: e.currentTarget.dataset.format });
  },

  onQualityChange: function (e) {
    this.setData({ selectedQuality: e.currentTarget.dataset.quality });
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
      name: 'pdf2img',
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
   * 云端转换PDF为图片
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
      content: '将PDF每页转换为高清图片\n\n⏱️ 转换时长取决于页数（通常 5~30s）\n📊\n\n确认开始？',
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
      convertedImages: []
    });
    wx.showLoading({ title: '正在转换...', mask: true });

    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: this.data.filePath,
      encoding: 'base64',
      success: function (readRes) {
        wx.cloud.callFunction({
          name: 'pdf2img',
          data: {
            action: 'convert',
            fileBase64: readRes.data,
            fileName: self.data.fileName,
            format: self.data.selectedFormat,
            quality: self.data.selectedQuality
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
              dailyTotalRemaining: result.dailyTotalRemaining
            });
            self.processCloudImages(result.images);
            storage.addHistory({
              toolId: 'pdf2img', toolName: 'PDF转图片', category: 'image',
              summary: '云端转换：' + result.pageCount + ' 页图片',
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

  /**
   * 处理云端返回的图片列表：逐个下载并展示
   */
  processCloudImages: function (images) {
    var self = this;
    var downloaded = [];

    function downloadNext(index) {
      if (index >= images.length) {
        self.setData({ convertedImages: downloaded });
        wx.showModal({
          title: '🎉 转换完成',
          content: '共 ' + downloaded.length + ' 页图片已生成\n可逐张长按保存到相册',
          showCancel: false
        });
        return;
      }

      wx.cloud.downloadFile({
        fileID: images[index].fileID,
        success: function (res) {
          downloaded.push({
            page: images[index].page,
            tempPath: res.tempFilePath,
            width: images[index].width,
            height: images[index].height,
            format: images[index].format
          });
          downloadNext(index + 1);
        },
        fail: function () {
          // 单张下载失败，跳过继续
          downloadNext(index + 1);
        }
      });
    }

    downloadNext(0);
  },

  /**
   * 保存单张图片到相册
   */
  onSaveImage: function (e) {
    var path = e.currentTarget.dataset.path;
    if (!path) return;
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('auth') !== -1) {
          wx.showModal({
            title: '需要授权',
            content: '请允许访问相册以保存图片',
            showCancel: false
          });
        }
      }
    });
  },

  /**
   * 保存所有图片到相册
   */
  onSaveAllImages: function () {
    var images = this.data.convertedImages;
    if (!images || images.length === 0) {
      wx.showToast({ title: '没有可保存的图片', icon: 'none' });
      return;
    }
    var saved = 0;
    for (var i = 0; i < images.length; i++) {
      wx.saveImageToPhotosAlbum({
        filePath: images[i].tempPath,
        success: function () { saved++; },
        fail: function () {}
      });
    }
    wx.showToast({ title: '已保存 ' + images.length + ' 张到相册', icon: 'success' });
  },

  handleCloudError: function (result) {
    var title = '转换失败';
    var content = result.errorMsg || '未知错误';
    if (result.errorCode === 'USER_LIMIT') {
      title = '今日次数已用完';
    } else if (result.errorCode === 'TOTAL_LIMIT') {
      title = '今日总量已用完';
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

  onClear: function () {
    this.setData({
      filePath: '',
      fileName: '',
      fileSize: '',
      convertedImages: []
    });
  },

  onShareAppMessage: function () {
    return { title: 'PDF转图片 - 工具箱', path: '/packages/toolsA/pdf2img/index' };
  }
});
