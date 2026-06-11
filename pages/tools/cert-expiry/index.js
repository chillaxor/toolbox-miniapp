var storage = require('../../../utils/storage.js');

var STORAGE_KEY = 'cert_expiry_list';

var TYPE_OPTIONS = [
  { key: 'id_card', icon: '🪪', name: '身份证' },
  { key: 'passport', icon: '🛂', name: '护照' },
  { key: 'driver', icon: '🚗', name: '驾驶证' },
  { key: 'residence', icon: '🏥', name: '居住证' },
  { key: 'vehicle', icon: '🔧', name: '行驶证' },
  { key: 'business', icon: '📋', name: '营业执照' },
  { key: 'house', icon: '🏠', name: '房产证' },
  { key: 'custom', icon: '📌', name: '自定义' }
];

var typeMap = {};
TYPE_OPTIONS.forEach(function (t) {
  typeMap[t.key] = t;
});

Page({
  data: {
    certList: [],
    stats: { total: 0, expired: 0, warning: 0, normal: 0 },
    showModal: false,
    showRemindModal: false,
    editId: '',
    selectedType: 'id_card',
    typeOptions: TYPE_OPTIONS,
    remindDays: 30,
    remindOptions: [7, 15, 30, 60, 90],
    form: {
      customType: '',
      name: '',
      expireDate: '',
      remark: ''
    },
    canSave: false
  },

  onLoad: function () {
    var remindDays = storage.getSync('cert_remind_days', 30);
    this.setData({ remindDays: remindDays });
    this.loadList();
  },

  onShow: function () {
    this.loadList();
  },

  loadList: function () {
    var list = storage.getSync(STORAGE_KEY, []);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var remindDays = this.data.remindDays || 30;
    var stats = { total: list.length, expired: 0, warning: 0, normal: 0 };

    var processed = list.map(function (item) {
      var info = typeMap[item.type] || { icon: '📄', name: item.type };
      var typeName = item.type === 'custom' && item.customType ? item.customType : info.name;
      var icon = info.icon;

      var expireDate = new Date(item.expireDate);
      expireDate.setHours(0, 0, 0, 0);
      var diffMs = expireDate.getTime() - now.getTime();
      var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      var statusClass, statusText, daysText;
      if (diffDays < 0) {
        statusClass = 'expired';
        statusText = '已过期';
        daysText = '过期' + Math.abs(diffDays) + '天';
        stats.expired++;
      } else if (diffDays <= remindDays) {
        statusClass = 'warning';
        statusText = '即将过期';
        daysText = diffDays === 0 ? '今天到期' : '剩' + diffDays + '天';
        stats.warning++;
      } else {
        statusClass = 'normal';
        statusText = '正常';
        daysText = '剩' + diffDays + '天';
        stats.normal++;
      }

      return {
        id: item.id,
        type: item.type,
        typeName: typeName,
        typeIcon: icon,
        name: item.name || '',
        expireDate: item.expireDate,
        remark: item.remark || '',
        statusClass: statusClass,
        statusText: statusText,
        daysText: daysText,
        diffDays: diffDays
      };
    });

    // 按到期时间排序：已过期在前，然后按剩余天数升序
    processed.sort(function (a, b) {
      return a.diffDays - b.diffDays;
    });

    this.setData({ certList: processed, stats: stats });
  },

  onAdd: function () {
    this.setData({
      showModal: true,
      editId: '',
      selectedType: 'id_card',
      form: { customType: '', name: '', expireDate: '', remark: '' },
      canSave: false
    });
  },

  onEdit: function (e) {
    var id = e.currentTarget.dataset.id;
    var list = storage.getSync(STORAGE_KEY, []);
    var item = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { item = list[i]; break; }
    }
    if (!item) return;

    this.setData({
      showModal: true,
      editId: id,
      selectedType: item.type,
      form: {
        customType: item.customType || '',
        name: item.name || '',
        expireDate: item.expireDate || '',
        remark: item.remark || ''
      },
      canSave: !!item.expireDate
    });
  },

  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条证件记录吗？',
      confirmColor: '#e74c3c',
      success: function (res) {
        if (res.confirm) {
          var list = storage.getSync(STORAGE_KEY, []);
          list = list.filter(function (item) { return item.id !== id; });
          storage.setSync(STORAGE_KEY, list);
          self.loadList();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  onCardTap: function () {
    // 点击卡片不做操作，编辑和删除用按钮
  },

  onModalBgTap: function () {
    this.setData({ showModal: false });
  },

  stopPropagation: function () {
    // 阻止冒泡
  },

  onSelectType: function (e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ selectedType: key });
    this.checkCanSave();
  },

  onInputCustomType: function (e) {
    this.setData({ 'form.customType': e.detail.value });
    this.checkCanSave();
  },

  onInputName: function (e) {
    this.setData({ 'form.name': e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ 'form.expireDate': e.detail.value });
    this.checkCanSave();
  },

  onInputRemark: function (e) {
    this.setData({ 'form.remark': e.detail.value });
  },

  checkCanSave: function () {
    var form = this.data.form;
    var type = this.data.selectedType;
    var canSave = !!form.expireDate;
    if (type === 'custom') {
      canSave = canSave && !!form.customType;
    }
    this.setData({ canSave: canSave });
  },

  onConfirm: function () {
    if (!this.data.canSave) return;

    var list = storage.getSync(STORAGE_KEY, []);
    var now = Date.now();

    var entry = {
      id: this.data.editId || ('cert_' + now + '_' + Math.floor(Math.random() * 10000)),
      type: this.data.selectedType,
      customType: this.data.form.customType || '',
      name: this.data.form.name || '',
      expireDate: this.data.form.expireDate,
      remark: this.data.form.remark || '',
      createdAt: now,
      updatedAt: now
    };

    if (this.data.editId) {
      // 编辑模式：替换原记录，保留createdAt
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === this.data.editId) {
          entry.createdAt = list[i].createdAt || now;
          list[i] = entry;
          break;
        }
      }
    } else {
      list.push(entry);
    }

    storage.setSync(STORAGE_KEY, list);
    this.setData({ showModal: false });
    this.loadList();

    wx.showToast({
      title: this.data.editId ? '已更新' : '添加成功',
      icon: 'success'
    });

    // 记录历史
    storage.addHistory({
      toolId: 'cert-expiry',
      toolName: '证件有效期',
      category: 'life',
      summary: (this.data.editId ? '编辑' : '添加') + '证件：' + entry.name,
      timestamp: now
    });
  },

  onShowRemindSetting: function () {
    this.setData({ showRemindModal: true });
  },

  onRemindModalBgTap: function () {
    this.setData({ showRemindModal: false });
  },

  onSelectRemindDays: function (e) {
    this.setData({ remindDays: e.currentTarget.dataset.days });
  },

  onConfirmRemind: function () {
    storage.setSync('cert_remind_days', this.data.remindDays);
    // 清除今天的提醒记录，让新设置立即生效
    storage.removeSync('cert_last_remind_date');
    this.setData({ showRemindModal: false });
    this.loadList();
    wx.showToast({ title: '已设置提前' + this.data.remindDays + '天提醒', icon: 'none' });
  },

  onCancelModal: function () {
    this.setData({ showModal: false });
  },

  onShareAppMessage: function () {
    return {
      title: '证件有效期管理 - 再也不怕忘记续期',
      path: '/pages/tools/cert-expiry/index'
    };
  }
});
