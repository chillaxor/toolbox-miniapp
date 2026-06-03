Page({
  data: {
    // 编辑态
    text: '',
    hasText: false,

    // 播放态
    playing: false,
    fullscreen: false,
    mirror: false,

    // 参数
    speed: 3,
    speedLabel: '3',
    fontSize: 56,
    fontSizeLabel: '56',
    lineHeight: 1.8,

    // 滚动
    scrollTop: 0,
    scrollHeight: 0,
    viewHeight: 0,
    progress: 0,

    // 预设文本
    presets: [
      { label: '欢迎致辞', text: '各位来宾，大家好！\n\n非常荣幸能够在这里与大家相聚。\n\n今天，我们齐聚一堂，共同探讨未来的发展方向。\n\n在过去的日子里，我们取得了令人瞩目的成绩。\n\n展望未来，我们将继续携手前行，创造更加辉煌的明天。\n\n感谢大家的到来，祝愿本次活动圆满成功！\n\n谢谢！' },
      { label: '直播开场', text: '哈喽大家好，欢迎来到今天的直播间！\n\n我是你们的主播小助手。\n\n今天给大家带来了一波超值福利，千万别走开！\n\n先给大家介绍一下今天的好物清单。\n\n第一款产品是我们的人气爆款，回购率超高。\n\n接下来还有更多惊喜等着大家，记得点赞关注哦！\n\n话不多说，让我们开始今天的种草之旅吧！' },
      { label: '产品演示', text: '大家好，今天给大家演示一下这款产品的使用方法。\n\n首先，我们打开包装，可以看到产品的整体外观。\n\n产品采用了简约的设计理念，手感非常舒适。\n\n接下来，我们来看看具体的操作步骤。\n\n第一步，长按电源键三秒开机。\n\n第二步，连接蓝牙设备。\n\n第三步，打开配套APP进行初始化设置。\n\n是不是非常简单？跟着操作就可以了。\n\n如果有任何问题，欢迎在评论区留言。' }
    ]
  },

  timer: null,
  scrollContext: null,

  onLoad: function () {
    var saved = wx.getStorageSync('teleprompter_text');
    if (saved) {
      this.setData({ text: saved, hasText: true });
    }
  },

  onUnload: function () {
    this.stopScroll();
  },

  onInput: function (e) {
    this.setData({ text: e.detail.value, hasText: !!e.detail.value });
  },

  onSpeedChange: function (e) {
    var val = e.detail.value;
    this.setData({ speed: val, speedLabel: String(val) });
    if (this.data.playing) {
      this.stopScroll();
      this.startScroll();
    }
  },

  onFontSizeChange: function (e) {
    var val = e.detail.value;
    this.setData({ fontSize: val, fontSizeLabel: String(val) });
  },

  onMirrorToggle: function () {
    this.setData({ mirror: !this.data.mirror });
  },

  onSelectPreset: function (e) {
    var idx = e.currentTarget.dataset.index;
    var preset = this.data.presets[idx];
    this.setData({ text: preset.text, hasText: true });
  },

  onClearText: function () {
    this.setData({ text: '', hasText: false, scrollTop: 0, progress: 0 });
    wx.removeStorageSync('teleprompter_text');
  },

  // 开始播放
  onPlay: function () {
    if (!this.data.text.trim()) {
      wx.showToast({ title: '请先输入提词内容', icon: 'none' });
      return;
    }
    wx.setStorageSync('teleprompter_text', this.data.text);
    this.setData({
      playing: true,
      fullscreen: true,
      scrollTop: 0,
      progress: 0
    });
    var that = this;
    setTimeout(function () {
      that.calcScrollDimensions();
      that.startScroll();
    }, 300);
  },

  // 暂停/继续
  onTogglePause: function () {
    if (this.data.playing) {
      this.stopScroll();
      this.setData({ playing: false });
    } else {
      this.setData({ playing: true });
      this.startScroll();
    }
  },

  // 停止并退出全屏
  onStop: function () {
    this.stopScroll();
    this.setData({
      playing: false,
      fullscreen: false,
      scrollTop: 0,
      progress: 0
    });
  },

  // 回到顶部重播
  onRestart: function () {
    this.stopScroll();
    this.setData({ scrollTop: 0, progress: 0, playing: true });
    var that = this;
    setTimeout(function () {
      that.calcScrollDimensions();
      that.startScroll();
    }, 100);
  },

  // 点击屏幕切换暂停
  onTapScreen: function () {
    if (this.data.fullscreen) {
      this.onTogglePause();
    }
  },

  // 计算滚动尺寸
  calcScrollDimensions: function () {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('#prompter-scroll').boundingClientRect();
    query.select('#prompter-scroll').scrollOffset();
    query.exec(function (res) {
      if (res && res[0]) {
        that.setData({
          viewHeight: res[0].height || 600,
          scrollHeight: res[1] ? res[1].scrollHeight : 2000
        });
      }
    });
  },

  // 开始自动滚动
  startScroll: function () {
    var that = this;
    var pxPerTick = this.data.speed * 0.5; // 每帧滚动的像素数

    this.timer = setInterval(function () {
      var next = that.data.scrollTop + pxPerTick;
      var maxScroll = that.data.scrollHeight - that.data.viewHeight;
      if (maxScroll <= 0) maxScroll = 1;

      var pct = Math.min(Math.round((next / maxScroll) * 100), 100);

      if (next >= maxScroll) {
        that.setData({ scrollTop: maxScroll, progress: 100 });
        that.stopScroll();
        return;
      }
      that.setData({ scrollTop: next, progress: pct });
    }, 30);
  },

  stopScroll: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onShareAppMessage: function () {
    return {
      title: '全屏提词器 - 演讲直播必备',
      path: '/pages/tools/teleprompter/index'
    };
  }
});
