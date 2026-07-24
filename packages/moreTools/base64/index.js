/*
 * @Author: chillaxor chenxinbin@linghit.com
 * @Date: 2026-05-29 15:04:26
 * @LastEditors: chillaxor chenxinbin@linghit.com
 * @LastEditTime: 2026-07-24 17:34:32
 * @FilePath: \toolbox-miniapp\packages\moreTools\base64\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var base64Util = require('../../../utils/base64.js');
var storage = require('../../../utils/storage.js');

Page({
  data: { text: '', result: '', errorMsg: '', isFavorite: false },

  onLoad: function () { this.checkFavorite(); },
  onShow: function () { this.checkFavorite(); },
  checkFavorite: function () { this.setData({ isFavorite: storage.isFavorite('base64') }); },
  toggleFavorite: function () { this.setData({ isFavorite: storage.toggleFavorite('base64') }); },

  onTextInput: function (e) { this.setData({ text: e.detail.value, errorMsg: '' }); },

  onEncode: function () {
    if (!this.data.text) { wx.showToast({ title: '请输入文本', icon: 'none' }); return; }
    var result = base64Util.encodeBase64(this.data.text);
    this.setData({ result: result, errorMsg: '' });
    storage.addHistory({ toolId: 'base64', toolName: 'Base64编解码', category: 'text', summary: '编码成功', timestamp: Date.now() });
  },

  onDecode: function () {
    if (!this.data.text) { wx.showToast({ title: '请输入Base64字符串', icon: 'none' }); return; }
    var res = base64Util.decodeBase64(this.data.text);
    if (res.success) {
      this.setData({ result: res.result, errorMsg: '' });
      storage.addHistory({ toolId: 'base64', toolName: 'Base64编解码', category: 'text', summary: '解码成功', timestamp: Date.now() });
    } else {
      this.setData({ errorMsg: res.error });
    }
  },

  onCopyResult: function () {
    wx.setClipboardData({ data: this.data.result, success: function () { wx.showToast({ title: '已复制', icon: 'success' }); } });
  },

  onClear: function () { this.setData({ text: '', result: '', errorMsg: '' }); },

  onShareAppMessage: function () { return { title: 'Base64编解码 - 工具箱', path: '/packages/moreTools/base64/index' }; }
});
