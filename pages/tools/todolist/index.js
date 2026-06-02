Page({
  data: {
    newTodo: '',
    filter: 'all',
    todos: [],
    filteredTodos: [],
    totalCount: 0,
    activeCount: 0,
    doneCount: 0
  },

  _nextId: 1,

  onLoad: function () {
    var todos = wx.getStorageSync('todolist_data') || [];
    var maxId = 0;
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id > maxId) maxId = todos[i].id;
    }
    this._nextId = maxId + 1;
    this.setData({ todos: todos });
    this._updateStats();
  },

  onInput: function (e) {
    this.setData({ newTodo: e.detail.value });
  },

  addTodo: function () {
    var text = this.data.newTodo.trim();
    if (!text) {
      wx.showToast({ title: '请输入待办内容', icon: 'none' });
      return;
    }

    var now = new Date();
    var timeStr = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    var todo = {
      id: this._nextId++,
      text: text,
      done: false,
      priority: 'medium',
      time: timeStr
    };

    var todos = this.data.todos;
    todos.unshift(todo);
    this.setData({ todos: todos, newTodo: '' });
    this._save();
  },

  toggleTodo: function (e) {
    var id = e.currentTarget.dataset.id;
    var todos = this.data.todos;
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        todos[i].done = !todos[i].done;
        break;
      }
    }
    this.setData({ todos: todos });
    this._save();
  },

  deleteTodo: function (e) {
    var id = e.currentTarget.dataset.id;
    var todos = this.data.todos.filter(function (t) { return t.id !== id; });
    this.setData({ todos: todos });
    this._save();
  },

  cyclePriority: function (e) {
    var id = e.currentTarget.dataset.id;
    var todos = this.data.todos;
    var order = ['low', 'medium', 'high'];
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        var idx = order.indexOf(todos[i].priority);
        todos[i].priority = order[(idx + 1) % 3];
        break;
      }
    }
    this.setData({ todos: todos });
    this._save();
  },

  setFilter: function (e) {
    this.setData({ filter: e.currentTarget.dataset.filter });
    this._updateStats();
  },

  clearDone: function () {
    var todos = this.data.todos.filter(function (t) { return !t.done; });
    this.setData({ todos: todos });
    this._save();
  },

  _save: function () {
    wx.setStorageSync('todolist_data', this.data.todos);
    this._updateStats();
  },

  _updateStats: function () {
    var todos = this.data.todos;
    var filter = this.data.filter;
    var total = todos.length;
    var done = 0;
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].done) done++;
    }
    var active = total - done;

    var filtered;
    if (filter === 'active') {
      filtered = todos.filter(function (t) { return !t.done; });
    } else if (filter === 'done') {
      filtered = todos.filter(function (t) { return t.done; });
    } else {
      filtered = todos;
    }

    this.setData({
      filteredTodos: filtered,
      totalCount: total,
      activeCount: active,
      doneCount: done
    });
  },

  onShareAppMessage: function () {
    return { title: '待办清单 - 轻松管理每日任务', path: '/pages/tools/todolist/index' };
  }
});