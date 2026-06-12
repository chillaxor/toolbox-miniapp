const { ELEMENTS, CATEGORY_COLORS } = require('../../../utils/elements-data.js');

Page({
  data: {
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
    this.buildGrid();
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
