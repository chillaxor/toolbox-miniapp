Page({
  data: {
    position: 'front',
    frozen: false,
    capturedSrc: '',
    zoom: 1.0
  },

  cameraCtx: null,

  onLoad: function () {
    this.cameraCtx = wx.createCameraContext();
  },

  onSwitchCamera: function () {
    var next = this.data.position === 'front' ? 'back' : 'front';
    this.setData({ position: next });
  },

  onFreeze: function () {
    var that = this;
    this.cameraCtx.takePhoto({
      quality: 'high',
      success: function (res) {
        that.setData({
          frozen: true,
          capturedSrc: res.tempImagePath
        });
      },
      fail: function (err) {
        wx.showToast({ title: '拍照失败', icon: 'none' });
        console.error('takePhoto fail:', err);
      }
    });
  },

  onResume: function () {
    this.setData({
      frozen: false,
      capturedSrc: ''
    });
  },

  onZoomChange: function (e) {
    this.setData({ zoom: e.detail.value });
  },

  onCameraError: function (e) {
    console.error('camera error:', e.detail);
    wx.showToast({ title: '相机启动失败', icon: 'none' });
  },

  onShareAppMessage: function () {
    return {
      title: '镜子 - 用手机当镜子',
      path: '/pages/tools/mirror/index'
    };
  }
});
