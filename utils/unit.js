/**
 * 单位换算逻辑
 * 支持长度、重量、温度三种类型
 */

// 长度单位（基准：米）
var LENGTH_UNITS = [
  { key: 'km', name: '千米(km)', ratio: 1000 },
  { key: 'm', name: '米(m)', ratio: 1 },
  { key: 'dm', name: '分米(dm)', ratio: 0.1 },
  { key: 'cm', name: '厘米(cm)', ratio: 0.01 },
  { key: 'mm', name: '毫米(mm)', ratio: 0.001 },
  { key: 'um', name: '微米(μm)', ratio: 0.000001 },
  { key: 'mi', name: '英里(mi)', ratio: 1609.344 },
  { key: 'yd', name: '码(yd)', ratio: 0.9144 },
  { key: 'ft', name: '英尺(ft)', ratio: 0.3048 },
  { key: 'in', name: '英寸(in)', ratio: 0.0254 },
  { key: 'nmi', name: '海里(nmi)', ratio: 1852 },
  { key: 'li', name: '里', ratio: 500 },
  { key: 'zhang', name: '丈', ratio: 10 / 3 },
  { key: 'chi', name: '尺', ratio: 1 / 3 },
  { key: 'cun', name: '寸', ratio: 1 / 30 }
];

// 重量单位（基准：千克）
var WEIGHT_UNITS = [
  { key: 't', name: '吨(t)', ratio: 1000 },
  { key: 'kg', name: '千克(kg)', ratio: 1 },
  { key: 'g', name: '克(g)', ratio: 0.001 },
  { key: 'mg', name: '毫克(mg)', ratio: 0.000001 },
  { key: 'lb', name: '磅(lb)', ratio: 0.45359237 },
  { key: 'oz', name: '盎司(oz)', ratio: 0.028349523 },
  { key: 'jin', name: '斤', ratio: 0.5 },
  { key: 'liang', name: '两', ratio: 0.05 }
];

// 温度单位（特殊处理，不使用ratio）
var TEMP_UNITS = [
  { key: 'c', name: '摄氏度(℃)', ratio: 1 },
  { key: 'f', name: '华氏度(℉)', ratio: 1 },
  { key: 'k', name: '开尔文(K)', ratio: 1 }
];

var UNIT_TYPES = [
  { key: 'length', name: '长度' },
  { key: 'weight', name: '重量' },
  { key: 'temp', name: '温度' }
];

/**
 * 获取单位列表
 * @param {string} unitType - 单位类型 length/weight/temp
 * @returns {Array<{key, name, ratio}>}
 */
function getUnitList(unitType) {
  if (unitType === 'length') return LENGTH_UNITS;
  if (unitType === 'weight') return WEIGHT_UNITS;
  if (unitType === 'temp') return TEMP_UNITS;
  return [];
}

/**
 * 单位换算
 * @param {number} value - 数值
 * @param {string} fromUnit - 源单位key
 * @param {string} toUnit - 目标单位key
 * @param {string} unitType - 单位类型
 * @returns {number} 转换结果
 */
function convertUnit(value, fromUnit, toUnit, unitType) {
  if (unitType === 'temp') {
    return convertTemperature(value, fromUnit, toUnit);
  }

  var units = getUnitList(unitType);
  var fromRatio = 1;
  var toRatio = 1;

  for (var i = 0; i < units.length; i++) {
    if (units[i].key === fromUnit) fromRatio = units[i].ratio;
    if (units[i].key === toUnit) toRatio = units[i].ratio;
  }

  // 先转为基准单位，再转为目标单位
  var baseValue = value * fromRatio;
  var result = baseValue / toRatio;

  // 保留合理精度
  return Math.round(result * 1000000) / 1000000;
}

/**
 * 温度换算
 * @param {number} value - 温度值
 * @param {string} from - 源单位
 * @param {string} to - 目标单位
 * @returns {number}
 */
function convertTemperature(value, from, to) {
  // 先转为摄氏度
  var celsius = 0;
  if (from === 'c') {
    celsius = value;
  } else if (from === 'f') {
    celsius = (value - 32) * 5 / 9;
  } else if (from === 'k') {
    celsius = value - 273.15;
  }

  // 从摄氏度转为目标
  var result = 0;
  if (to === 'c') {
    result = celsius;
  } else if (to === 'f') {
    result = celsius * 9 / 5 + 32;
  } else if (to === 'k') {
    result = celsius + 273.15;
  }

  return Math.round(result * 100) / 100;
}

module.exports = {
  LENGTH_UNITS: LENGTH_UNITS,
  WEIGHT_UNITS: WEIGHT_UNITS,
  TEMP_UNITS: TEMP_UNITS,
  UNIT_TYPES: UNIT_TYPES,
  getUnitList: getUnitList,
  convertUnit: convertUnit,
  convertTemperature: convertTemperature
};
