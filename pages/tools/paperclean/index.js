var storage = require('../../../utils/storage.js');

// 云环境ID（与app.js中wx.cloud.init的env保持一致）
var CLOUD_ENV = '7856333';

Page({
  data: {
    imageSrc: '',
    resultSrc: '',
    isFavorite: false,
    isLoading: false,
    loadingText: '',
    usedCount: 0,
    remainingCount: 50,
    monthlyLimit: 50,
    showResult: false,
    cloudReady: false, // 云函数是否可用
    tips: [
      '选择拍好的试卷照片',
      'AI自动识别并擦除手写笔迹',
      '还原出干净的空白试卷',
      '每月免费50次，超出暂不可用'
    ]
  },

  onLoad: function () {
    this.checkFavorite();
    this.checkCloudReady();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('paperclean') });
  },

  toggleFavorite: function () {
    this.setData({ isFavorite: storage.toggleFavorite('paperclean') });
  },

  /**
   * 检测云函数是否可用
   */
  checkCloudReady: function () {
    var self = this;
    if (!wx.cloud) {
      self.setData({ cloudReady: false });
      return;
    }
    wx.cloud.callFunction({
      name: 'paperclean',
      data: { action: 'quota' },
      env: CLOUD_ENV,
      success: function (res) {
        console.log('[paperclean] cloud ready, quota:', res.result);
        self.setData({ cloudReady: true });
        if (res.result && res.result.success) {
          self.setData({
            usedCount: res.result.used,
            remainingCount: res.result.remaining,
            monthlyLimit: res.result.limit
          });
        }
      },
      fail: function (err) {
        console.error('[paperclean] cloud check failed:', JSON.stringify(err));
        self.setData({ cloudReady: false });
      }
    });
  },

  /**
   * 查询本月剩余额度
   */
  fetchQuota: function () {
    wx.cloud.callFunction({
      name: 'paperclean',
      data: { action: 'quota' },
      env: CLOUD_ENV,
      success: function (res) {
        if (res.result && res.result.success) {
          this.setData({
            usedCount: res.result.used,
            remainingCount: res.result.remaining,
            monthlyLimit: res.result.limit
          });
        }
      }.bind(this),
      fail: function (err) {
        // 额度查询失败不影响使用，静默处理
        console.log('[paperclean] quota query failed:', JSON.stringify(err));
      }
    });
  },

  /**
   * 选择图片
   */
  onChooseImage: function () {
    if (this.data.remainingCount <= 0) {
      wx.showModal({
        title: '额度已用完',
        content: '本月免费额度已用完（50次），该功能暂不可用，下月自动恢复',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        var file = res.tempFiles[0];
        // 检查图片大小（base64编码后不超过4M，原图约3M以内）
        if (file.size > 3 * 1024 * 1024) {
          wx.showModal({
            title: '图片过大',
            content: '图片大小超过3MB，可能导致处理失败，请选择较小的图片或压缩后重试',
            showCancel: true,
            confirmText: '仍然选择'
          });
          // 不强制阻止，只是提醒
        }
        self.setData({
          imageSrc: file.tempFilePath,
          resultSrc: '',
          showResult: false
        });
      }
    });
  },

  /**
   * 开始擦除
   */
  onStartClean: function () {
    if (!this.data.imageSrc) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    if (this.data.remainingCount <= 0) {
      wx.showModal({
        title: '额度已用完',
        content: '本月免费额度已用完（50次），该功能暂不可用',
        showCancel: false
      });
      return;
    }

    var self = this;
    this.setData({ isLoading: true, loadingText: '正在读取图片...' });

    // 步骤1: 将图片转为base64
    wx.getFileSystemManager().readFile({
      filePath: self.data.imageSrc,
      encoding: 'base64',
      success: function (readRes) {
        self.setData({ loadingText: 'AI正在擦除手写笔迹...' });

        // 步骤2: 调用云函数
        wx.cloud.callFunction({
          name: 'paperclean',
          data: {
            action: 'clean',
            imageBase64: readRes.data
          },
          env: CLOUD_ENV,
          success: function (callRes) {
            self.setData({ isLoading: false, loadingText: '' });

            if (!callRes.result) {
              wx.showToast({ title: '处理失败', icon: 'none' });
              return;
            }

            var result = callRes.result;

            if (!result.success) {
              // 额度已用完
              if (result.errorCode === 'QUOTA_EXCEEDED') {
                self.setData({ remainingCount: 0 });
                wx.showModal({
                  title: '额度已用完',
                  content: '本月免费额度已用完（50次），该功能暂不可用',
                  showCancel: false
                });
              } else {
                wx.showModal({
                  title: '处理失败',
                  content: result.errorMsg || '未知错误',
                  showCancel: false
                });
              }
              return;
            }

            // 成功：将base64写入临时文件并展示
            var base64Data = result.imageProcessed;
            var filePath = wx.env.USER_DATA_PATH + '/paperclean_result_' + Date.now() + '.png';

            wx.getFileSystemManager().writeFile({
              filePath: filePath,
              data: base64Data,
              encoding: 'base64',
              success: function () {
                self.setData({
                  resultSrc: filePath,
                  showResult: true,
                  usedCount: result.used,
                  remainingCount: result.remaining
                });
                wx.showToast({ title: '擦除完成', icon: 'success' });

                storage.addHistory({
                  toolId: 'paperclean',
                  toolName: '试卷擦除',
                  category: 'image',
                  summary: '擦除手写笔迹还原空白试卷',
                  timestamp: Date.now()
                });
              },
              fail: function () {
                self.setData({ isLoading: false });
                wx.showToast({ title: '结果保存失败', icon: 'none' });
              }
            });
          },
          fail: function (err) {
            self.setData({ isLoading: false, loadingText: '' });
            console.error('[paperclean] callFunction failed:', JSON.stringify(err));
            var errMsg = '云函数调用失败';
            if (err.errMsg) {
              // 提取关键错误信息
              if (err.errMsg.indexOf('timeout') !== -1 || err.errMsg.indexOf('timed out') !== -1) {
                errMsg = '请求超时，请稍后重试';
              } else if (err.errMsg.indexOf('not found') !== -1 || err.errMsg.indexOf('FunctionName') !== -1) {
                errMsg = '云函数未部署，请在开发者工具中上传 paperclean 云函数';
              } else if (err.errMsg.indexOf('network') !== -1 || err.errMsg.indexOf('ECONNREFUSED') !== -1) {
                errMsg = '网络连接失败，请检查网络';
              }
            }
            wx.showModal({
              title: '服务暂不可用',
              content: errMsg,
              showCancel: false
            });
          }
        });
      },
      fail: function () {
        self.setData({ isLoading: false, loadingText: '' });
        wx.showToast({ title: '图片读取失败', icon: 'none' });
      }
    });
  },

  /**
   * 保存结果到相册
   */
  onSaveResult: function () {
    if (!this.data.resultSrc) return;

    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultSrc,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: function (err) {
        if (err.errMsg.indexOf('auth') !== -1) {
          wx.showModal({
            title: '需要授权',
            content: '请授权保存图片到相册',
            confirmText: '去授权',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 重新选择图片
   */
  onReset: function () {
    this.setData({
      imageSrc: '',
      resultSrc: '',
      showResult: false
    });
  },

  /**
   * 分享
   */
  onShareAppMessage: function () {
    return {
      title: '试卷擦除 - AI智能去除手写笔迹',
      path: '/pages/tools/paperclean/index'
    };
  }
});