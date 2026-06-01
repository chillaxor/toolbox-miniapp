/**
 * 本地存储封装
 * 提供统一的存储接口，包含收藏、历史、偏好等功能
 */

var STORAGE_KEYS = {
  FAVORITES: 'toolbox_favorites',
  HISTORY: 'toolbox_history',
  PREFERENCES: 'toolbox_preferences',
  CURRENCY_CUSTOM: 'toolbox_currency_custom'
};

var MAX_HISTORY = 100;

/**
 * 同步读取数据
 * @param {string} key - 存储键
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
function getSync(key, defaultValue) {
  try {
    var value = wx.getStorageSync(key);
    if (value === '' || value === undefined || value === null) {
      return defaultValue;
    }
    return value;
  } catch (e) {
    console.error('[Storage] getSync error:', key, e);
    return defaultValue;
  }
}

/**
 * 同步写入数据
 * @param {string} key - 存储键
 * @param {*} value - 值
 * @returns {boolean}
 */
function setSync(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    console.error('[Storage] setSync error:', key, e);
    return false;
  }
}

/**
 * 删除数据
 * @param {string} key - 存储键
 */
function removeSync(key) {
  try {
    wx.removeStorageSync(key);
  } catch (e) {
    console.error('[Storage] removeSync error:', key, e);
  }
}

// ========== 收藏功能 ==========

/**
 * 获取收藏列表
 * @returns {Array<string>} 收藏的工具ID列表
 */
function getFavorites() {
  return getSync(STORAGE_KEYS.FAVORITES, []);
}

/**
 * 判断工具是否已收藏
 * @param {string} toolId - 工具ID
 * @returns {boolean}
 */
function isFavorite(toolId) {
  var favorites = getFavorites();
  return favorites.indexOf(toolId) !== -1;
}

/**
 * 切换收藏状态
 * @param {string} toolId - 工具ID
 * @returns {boolean} 切换后的状态
 */
function toggleFavorite(toolId) {
  var favorites = getFavorites();
  var index = favorites.indexOf(toolId);
  if (index !== -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(toolId);
  }
  setSync(STORAGE_KEYS.FAVORITES, favorites);
  return index === -1; // 返回true表示新增收藏，false表示取消收藏
}

/**
 * 添加收藏
 * @param {string} toolId - 工具ID
 */
function addFavorite(toolId) {
  var favorites = getFavorites();
  if (favorites.indexOf(toolId) === -1) {
    favorites.push(toolId);
    setSync(STORAGE_KEYS.FAVORITES, favorites);
  }
}

/**
 * 移除收藏
 * @param {string} toolId - 工具ID
 */
function removeFavorite(toolId) {
  var favorites = getFavorites();
  var index = favorites.indexOf(toolId);
  if (index !== -1) {
    favorites.splice(index, 1);
    setSync(STORAGE_KEYS.FAVORITES, favorites);
  }
}

// ========== 历史记录功能 ==========

/**
 * 获取历史记录
 * @returns {Array<HistoryRecord>}
 */
function getHistory() {
  return getSync(STORAGE_KEYS.HISTORY, []);
}

/**
 * 记录使用历史
 * @param {Object} record - 历史记录 { toolId, toolName, category, summary, timestamp }
 */
function addHistory(record) {
  var history = getHistory();
  
  // 添加时间戳
  if (!record.timestamp) {
    record.timestamp = Date.now();
  }
  
  // 插入到最前面
  history.unshift(record);
  
  // FIFO淘汰，上限100条
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  
  setSync(STORAGE_KEYS.HISTORY, history);
}

/**
 * 清空历史记录
 */
function clearHistory() {
  setSync(STORAGE_KEYS.HISTORY, []);
}

/**
 * 删除指定历史记录
 * @param {number} index - 记录索引
 */
function deleteHistory(index) {
  var history = getHistory();
  if (index >= 0 && index < history.length) {
    history.splice(index, 1);
    setSync(STORAGE_KEYS.HISTORY, history);
  }
}

/**
 * 根据工具ID获取历史记录
 * @param {string} toolId - 工具ID
 * @returns {Array}
 */
function getHistoryByToolId(toolId) {
  var history = getHistory();
  return history.filter(function (item) {
    return item.toolId === toolId;
  });
}

// ========== 用户偏好 ==========

/**
 * 获取用户偏好
 * @param {string} key - 偏好键
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
function getPreference(key, defaultValue) {
  var prefs = getSync(STORAGE_KEYS.PREFERENCES, {});
  if (prefs[key] !== undefined) {
    return prefs[key];
  }
  return defaultValue;
}

/**
 * 设置用户偏好
 * @param {string} key - 偏好键
 * @param {*} value - 值
 */
function setPreference(key, value) {
  var prefs = getSync(STORAGE_KEYS.PREFERENCES, {});
  prefs[key] = value;
  setSync(STORAGE_KEYS.PREFERENCES, prefs);
}

// ========== 自定义汇率 ==========

/**
 * 获取自定义汇率
 * @returns {Object}
 */
function getCustomRates() {
  return getSync(STORAGE_KEYS.CURRENCY_CUSTOM, {});
}

/**
 * 设置自定义汇率
 * @param {string} code - 币种代码
 * @param {number} rate - 汇率
 */
function setCustomRate(code, rate) {
  var rates = getCustomRates();
  rates[code] = rate;
  setSync(STORAGE_KEYS.CURRENCY_CUSTOM, rates);
}

/**
 * 重置自定义汇率
 */
function resetCustomRates() {
  setSync(STORAGE_KEYS.CURRENCY_CUSTOM, {});
}

module.exports = {
  STORAGE_KEYS: STORAGE_KEYS,
  MAX_HISTORY: MAX_HISTORY,
  getSync: getSync,
  setSync: setSync,
  removeSync: removeSync,
  getFavorites: getFavorites,
  isFavorite: isFavorite,
  toggleFavorite: toggleFavorite,
  addFavorite: addFavorite,
  removeFavorite: removeFavorite,
  getHistory: getHistory,
  addHistory: addHistory,
  clearHistory: clearHistory,
  deleteHistory: deleteHistory,
  getHistoryByToolId: getHistoryByToolId,
  getPreference: getPreference,
  setPreference: setPreference,
  getCustomRates: getCustomRates,
  setCustomRate: setCustomRate,
  resetCustomRates: resetCustomRates
};
