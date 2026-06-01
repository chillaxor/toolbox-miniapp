Component({
  properties: {
    grid: {
      type: Array,
      value: []
    }
  },

  methods: {
    onDayTap: function (e) {
      var cell = e.currentTarget.dataset.cell;
      this.triggerEvent('daytap', { cell: cell });
    }
  }
});
