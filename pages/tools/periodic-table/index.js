// 远程数据源：gitee 上的 elements-data
// 注意：微信小程序 wx.request 不会自动跟随 gitee raw 的 302 跳转（跳到 raw.giteeusercontent.com），
// 所以这里改用云函数 giteeData 做代理——由云端 Node.js 去拉取并解析，绕开域名白名单与重定向限制。
const GITEE_ELEMENTS_URL = 'https://gitee.com/b64882/qian_data/raw/master/elements-data-for-gitee.json';

// 模块级数据：初始为空，onLoad 后由云函数或本地缓存填充
// 不再 require 本地文件，以减小主包体积（本地 elements-data.js 已删除）
let ELEMENTS = [];
let CATEGORY_COLORS = {};

Page({
  data: {
    loading: true,        // 首次从远程加载中
    loadError: false,     // 远程与缓存都失败
    loadErrorMsg: '',      // 失败时的具体原因（排查用）
    searchKey: '',
    filterCategory: '',
    showDetail: false,
    selectedElement: null,
    detailColor: '',
    categoryName: '',
    periods: [],
    lanthanides: [],
    actinides: [],
    categories: [
      { key: 'alkali-metal', name: '碱金属', color: '#ff6b6b' },
      { key: 'alkaline-earth', name: '碱土金属', color: '#ffa94d' },
      { key: 'transition-metal', name: '过渡金属', color: '#ffd43b' },
      { key: 'post-transition', name: '后过渡金属', color: '#69db7c' },
      { key: 'metalloid', name: '准金属', color: '#38d9a9' },
      { key: 'nonmetal', name: '非金属', color: '#4dabf7' },
      { key: 'halogen', name: '卤素', color: '#748ffc' },
      { key: 'noble-gas', name: '稀有气体', color: '#cc5de8' },
      { key: 'lanthanide', name: '镧系', color: '#f783ac' },
      { key: 'actinide', name: '锕系', color: '#e599f7' }
    ]
  },

  onLoad() {
    this.loadElements();
  },

  // 通过云函数 giteeData 拉取远程数据；失败则用本地 storage 缓存兜底；都失败才进入错误态
  loadElements() {
    this.setData({ loading: true, loadError: false });
    const cache = wx.getStorageSync('remote_elements_cache');
    wx.cloud.callFunction({
      name: 'giteeData',
      data: { url: GITEE_ELEMENTS_URL },
      success: (res) => {
        const result = (res && res.result) || {};
        const data = result.data;
        if (data && Array.isArray(data.ELEMENTS) && data.CATEGORY_COLORS) {
          ELEMENTS = data.ELEMENTS;
          CATEGORY_COLORS = data.CATEGORY_COLORS;
          wx.setStorageSync('remote_elements_cache', data); // 缓存，弱网/离线可兜底
          this.setData({ loading: false, loadError: false });
          this.buildGrid();
        } else if (cache && Array.isArray(cache.ELEMENTS) && cache.CATEGORY_COLORS) {
          this.useCache(cache);
        } else {
          this.setData({ loading: false, loadError: true, loadErrorMsg: '数据格式不对：' + (result.error || '远程返回空') });
          wx.showToast({ title: '元素数据加载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        // 云函数调用本身失败（环境/网络），用 storage 兜底
        if (cache && Array.isArray(cache.ELEMENTS) && cache.CATEGORY_COLORS) {
          this.useCache(cache);
        } else {
          this.setData({ loading: false, loadError: true, loadErrorMsg: '云函数调用失败：' + ((err && err.errMsg) || '未知错误') });
          wx.showToast({ title: '元素数据加载失败', icon: 'none' });
        }
      }
    });
  },

  useCache(cache) {
    ELEMENTS = cache.ELEMENTS;
    CATEGORY_COLORS = cache.CATEGORY_COLORS;
    this.setData({ loading: false, loadError: false });
    this.buildGrid();
  },

  onRetry() {
    this.loadElements();
  },

  buildGrid() {
    const { filterCategory, searchKey } = this.data;

    // 按周期和族分组
    const periods = [];
    for (let p = 1; p <= 7; p++) {
      const cells = [];
      for (let g = 1; g <= 18; g++) {
        const el = ELEMENTS.find(e => e.period === p && e.group === g && e.category !== 'lanthanide' && e.category !== 'actinide');
        if (el) {
          const opacity = this.getElementOpacity(el, filterCategory, searchKey);
          const color = CATEGORY_COLORS[el.category] || '#999';
          cells.push({ ...el, isEmpty: false, opacity, color });
        } else {
          cells.push({ isEmpty: true, z: 0, opacity: 1, color: 'transparent' });
        }
      }
      periods.push({ cells });
    }

    // 镧系 (Z=57-71)
    const lanthanides = ELEMENTS.filter(e => e.category === 'lanthanide').map(el => ({
      ...el,
      opacity: this.getElementOpacity(el, filterCategory, searchKey),
      color: CATEGORY_COLORS[el.category] || '#999'
    }));

    // 锕系 (Z=89-103)
    const actinides = ELEMENTS.filter(e => e.category === 'actinide').map(el => ({
      ...el,
      opacity: this.getElementOpacity(el, filterCategory, searchKey),
      color: CATEGORY_COLORS[el.category] || '#999'
    }));

    this.setData({ periods, lanthanides, actinides });
  },

  getElementOpacity(el, filterCategory, searchKey) {
    let match = true;
    if (filterCategory) {
      match = el.category === filterCategory;
    }
    if (searchKey) {
      const key = searchKey.toLowerCase();
      const nameMatch = el.name.toLowerCase().includes(key);
      const symbolMatch = el.symbol.toLowerCase().includes(key);
      const zMatch = String(el.z) === key;
      if (!nameMatch && !symbolMatch && !zMatch) match = false;
    }
    if (!filterCategory && !searchKey) return 1;
    return match ? 1 : 0.2;
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value });
    this.buildGrid();
  },

  onFilterCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ filterCategory: cat });
    this.buildGrid();
  },

  onTapElement(e) {
    const z = parseInt(e.currentTarget.dataset.z);
    if (!z) return;
    const el = ELEMENTS.find(e => e.z === z);
    if (!el) return;

    const cat = this.data.categories.find(c => c.key === el.category);
    this.setData({
      showDetail: true,
      selectedElement: el,
      detailColor: cat ? cat.color : '#ccc',
      categoryName: cat ? cat.name : el.category
    });
  },

  onCloseDetail() {
    this.setData({ showDetail: false });
  }
});
