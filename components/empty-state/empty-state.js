Component({
  properties: {
    show: { type: Boolean, value: false },
    icon: { type: String, value: '📭' },
    message: { type: String, value: '暂无数据' },
    actionText: { type: String, value: '' }
  },

  methods: {
    onAction: function () {
      this.triggerEvent('action');
    }
  }
});
