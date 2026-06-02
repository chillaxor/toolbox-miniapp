Page({
  data: {
    isOn: false,
    flashMode: 'off',
    brightness: 100
  },

  onLoad: function () {
    // 手电筒通过 WXML 中的 <camera flash="torch/off"> 控制
  },

  toggleFlash: function () {
    var isOn = !this.data.isOn;
    this.setData({
      isOn: isOn,
      flashMode: isOn ? 'torch' : 'off'
    });
  },

  onBrightnessChange: function (e) {
    this.setData({ brightness: e.detail.value });
  },

  onError: function (e) {
    wx.showToast({
      title: '无法访问相机，请检查权限',
      icon: 'none'
    });
  },

  onShareAppMessage: function () {
    return {
      title: '手电筒 - 工具箱',
      path: '/pages/tools/flashlight/index'
    };
  }
});