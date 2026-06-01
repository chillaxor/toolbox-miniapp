Component({
  properties: {
    toolId: { type: String, value: '' },
    name: { type: String, value: '' },
    icon: { type: String, value: '' },
    description: { type: String, value: '' },
    color: { type: String, value: '#FF6B35' },
    bgColor: { type: String, value: '#FFE5D9' },
    path: { type: String, value: '' }
  },

  methods: {
    onTap: function () {
      if (!this.data.path) return;
      wx.navigateTo({
        url: this.data.path,
        fail: function (err) {
          console.error('[ToolCard] navigate fail:', err);
        }
      });
    }
  }
});
