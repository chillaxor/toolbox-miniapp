const storage = require('../../../utils/storage.js');
const SCENES = require('../../../data/friendship_scenes.js');

// 远程场景库：wx.request 直连 gitee（主），jsDelivr 镜像回退；拉不到则用本地 SCENES 兜底。
const SCENES_URL = 'https://gitee.com/b64882/qian_data/raw/master/friendship_scenes.json';
const SCENES_MIRROR = 'https://cdn.jsdelivr.net/gh/b64882/qian_data@master/friendship_scenes.json';
const SCENES_CACHE_KEY = 'friendship_scenes_cache';

const BADGE_KEY = 'friendship_badges';
const DONE_KEY = 'friendship_done';
const START_RELATION = 60; // 每局关系值起点（普通档）

// 关系值档位（0-100）
function tierOf(v, surface) {
  if (surface && v <= 60) return { label: '表面和好', emoji: '😶' };
  if (v <= 20) return { label: '绝交', emoji: '💔' };
  if (v <= 40) return { label: '冷战', emoji: '😤' };
  if (v <= 60) return { label: '普通', emoji: '😐' };
  if (v <= 80) return { label: '友好', emoji: '😊' };
  return { label: '密友', emoji: '🤗' };
}

// 成就定义（本地 storage 记录）
const BADGES = [
  { id: 'first_repair', emoji: '🤝', name: '初次和解', desc: '第一次和朋友成功和好' },
  { id: 'comm_star', emoji: '🌟', name: '沟通小达人', desc: '用"我句式"表达并一起解决' },
  { id: 'mood_master', emoji: '🔍', name: '情绪小专家', desc: '一局里所有情绪都认对' },
  { id: 'deep_breath', emoji: '🌬️', name: '深呼吸小能手', desc: '冲突前先做了深呼吸' },
  { id: 'all_clear', emoji: '🏅', name: '友谊大师', desc: '完成全部场景的和解' }
];

Page({
  data: {
    phase: 'home',            // home | story | mood | choose | result
    scenesView: [],
    badgesView: [],
    homeProgress: '0/0',
    cur: null,
    moodIdx: 0,
    moodRight: false,
    moodFeedback: '',
    breathed: false,
    showBreath: false,
    chosenKey: '',
    relation: START_RELATION,
    tier: { label: '普通', emoji: '😐' },
    surface: false,
    result: '',
    tip: '',
    newBadges: [],
    showBadges: false
  },

  onLoad: function () {
    var __flags = wx.getStorageSync('feature_flags')
      || (getApp() && getApp().globalData && getApp().globalData.featureFlags) || {};
    if (!__flags.friendship) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this._scenes = SCENES;        // 本地兜底，远程拉取成功会替换
    this.refreshHome();
    this.loadScenes();
  },

  // 从 gitee 拉取最新场景库（wx.request 直连，不走云函数）；
  // 主 URL 失败自动尝试 jsDelivr 镜像；全失败保持本地兜底，不影响游戏。
  loadScenes: function () {
    var self = this;
    try {
      var cached = wx.getStorageSync(SCENES_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length) {
        self._scenes = cached;
        self.refreshHome();
        return;
      }
    } catch (e) {}
    var urls = [SCENES_URL, SCENES_MIRROR];
    function tryNext(i) {
      if (i >= urls.length) return;   // 全失败，保持本地 SCENES
      wx.request({
        url: urls[i],
        method: 'GET',
        success: function (res) {
          if (res.statusCode === 200 && res.data && Array.isArray(res.data) && res.data.length) {
            try { wx.setStorageSync(SCENES_CACHE_KEY, res.data); } catch (e) {}
            self._scenes = res.data;
            self.refreshHome();
          } else {
            tryNext(i + 1);
          }
        },
        fail: function () { tryNext(i + 1); }
      });
    }
    tryNext(0);
  },

  // 刷新首页数据（进度、徽章、场景完成态）
  refreshHome: function () {
    var badges = [];
    var done = [];
    try { badges = storage.get(BADGE_KEY) || []; } catch (e) {}
    try { done = storage.get(DONE_KEY) || []; } catch (e) {}
    if (!Array.isArray(badges)) badges = [];
    if (!Array.isArray(done)) done = [];
    var self = this;
    this.setData({
      phase: 'home',
      scenesView: self._scenes.map(function (s) {
        return Object.assign({}, s, { repaired: done.indexOf(s.id) >= 0 });
      }),
      badgesView: BADGES.map(function (b) {
        return Object.assign({}, b, { owned: badges.indexOf(b.id) >= 0 });
      }),
      homeProgress: done.length + '/' + self._scenes.length,
      badges: badges,
      doneScenes: done,
      cur: null,
      showBadges: false
    });
  },

  // 进入某个场景
  startScene: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var s = this._scenes[idx];
    var cur = Object.assign({}, s, {
      stars: new Array(s.difficulty).fill('⭐'),
      moods: s.moods.map(function (m) { return m; })
    });
    this._moodWrong = 0;
    this.setData({
      phase: 'story',
      si: idx,
      cur: cur,
      moodIdx: 0,
      moodRight: false,
      moodFeedback: '',
      breathed: false,
      showBreath: false,
      chosenKey: '',
      relation: START_RELATION,
      tier: tierOf(START_RELATION, false),
      surface: false,
      result: '',
      tip: '',
      newBadges: []
    });
  },

  // 第1幕 → 第2幕
  toMood: function () {
    this.setData({ phase: 'mood', moodIdx: 0, moodRight: false, moodFeedback: '' });
  },

  // 第2幕：情绪识别作答
  chooseMood: function (e) {
    if (this.data.phase !== 'mood' || this.data.moodRight) return;
    var q = this.data.cur.moods[this.data.moodIdx];
    var oidx = Number(e.currentTarget.dataset.oidx);
    var opt = q.options[oidx];
    if (opt.correct) {
      this.setData({ moodRight: true, moodFeedback: '对！你观察得很仔细 👍' });
    } else {
      this._moodWrong = 1;
      this.setData({ moodFeedback: '再看看…' + q.prompt + ' 注意他的表情和动作哦～' });
    }
  },

  // 第2幕：答对后继续
  continueMood: function () {
    if (!this.data.moodRight) return;
    if (this.data.moodIdx + 1 >= this.data.cur.moods.length) {
      this.setData({ phase: 'choose', moodRight: false, moodFeedback: '' });
    } else {
      this.setData({ moodIdx: this.data.moodIdx + 1, moodRight: false, moodFeedback: '' });
    }
  },

  // 第3幕前：深呼吸（辅助，可选）
  doBreath: function () {
    if (this.data.showBreath) return;
    var self = this;
    this.setData({ showBreath: true, breathed: true });
    setTimeout(function () { self.setData({ showBreath: false }); }, 3000);
  },

  // 第3幕：应对选择
  chooseOption: function (e) {
    if (this.data.phase !== 'choose') return;
    var key = e.currentTarget.dataset.key;
    var scene = this.data.cur;
    var ch = null;
    for (var i = 0; i < scene.choices.length; i++) {
      if (scene.choices[i].key === key) { ch = scene.choices[i]; break; }
    }
    if (!ch) return;
    var relation = START_RELATION + ch.score;
    var surface = !!ch.surface;

    var badges = (this.data.badges || []).slice();
    var done = (this.data.doneScenes || []).slice();
    var newBadges = [];
    var self = this;
    function addBadge(id) {
      if (badges.indexOf(id) === -1) {
        badges.push(id);
        for (var k = 0; k < BADGES.length; k++) {
          if (BADGES[k].id === id) { newBadges.push({ emoji: BADGES[k].emoji, name: BADGES[k].name }); break; }
        }
      }
    }

    if (ch.ending === 'repair') {
      addBadge('comm_star');
      if (done.indexOf(scene.id) === -1) { done.push(scene.id); addBadge('first_repair'); }
    }
    if (this._moodWrong === 0) addBadge('mood_master');   // 本局情绪全对
    if (this.data.breathed) addBadge('deep_breath');       // 本局做过深呼吸
    // 全部场景和解 → 友谊大师
    var allClear = this._scenes.every(function (s) { return done.indexOf(s.id) >= 0; });
    if (allClear) addBadge('all_clear');

    try { storage.set(BADGE_KEY, badges); storage.set(DONE_KEY, done); } catch (err) {}

    this.setData({
      phase: 'result',
      chosenKey: key,
      relation: relation,
      surface: surface,
      tier: tierOf(relation, surface),
      result: ch.result,
      tip: ch.tip,
      newBadges: newBadges,
      badges: badges,
      doneScenes: done,
      homeProgress: done.length + '/' + this._scenes.length,
      badgesView: BADGES.map(function (b) {
        return Object.assign({}, b, { owned: badges.indexOf(b.id) >= 0 });
      })
    });
  },

  // 时光倒流：重玩本场景
  retry: function () {
    this.startScene({ currentTarget: { dataset: { idx: this.data.si } } });
  },

  // 下一场景
  nextScene: function () {
    var idx = (this.data.si + 1) % this._scenes.length;
    this.startScene({ currentTarget: { dataset: { idx: idx } } });
  },

  // 回首页
  goHome: function () {
    this.refreshHome();
  },

  // 徽章墙
  showBadges: function () { this.setData({ showBadges: true }); },
  hideBadges: function () { this.setData({ showBadges: false }); },
  noop: function () {}
});
