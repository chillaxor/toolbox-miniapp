// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 远程涂色数据源（gitee raw）
const REMOTE_URL = 'https://gitee.com/b64882/qian_data/raw/master/coloring-data.js'

// 本地兜底数据：部署时随云函数一起上传，gitee 拉取失败时使用
let localData = null
try {
  localData = require('./coloring-data.js')
} catch (e) {
  localData = null
}

// 模块级缓存：云函数实例热启动时（仍在同一容器）不再重复请求 gitee
let cache = null

/**
 * 解析远程 JS 字符串，取出 module.exports 导出的涂色数据。
 * coloring-data.js 内含 circle/star/heart 等 helper 函数（加载时动态生成坐标），
 * 不是纯 JSON，故用 new Function 在受控作用域里执行一遍后再读取 module.exports。
 */
function parseColoring(str) {
  const moduleObj = { exports: {} }
  // eslint-disable-next-line no-new-func
  const fn = new Function('module', 'exports', str)
  fn(moduleObj, moduleObj.exports)
  return moduleObj.exports
}

// 云函数入口函数
exports.main = async (event, context) => {
  // 命中缓存直接返回，减少外网请求
  if (cache) {
    return { COLORING_DATA: cache, source: 'cache' }
  }

  try {
    const response = await axios.get(REMOTE_URL, { timeout: 8000 })
    const dataStr = response.data
    if (typeof dataStr !== 'string' || dataStr.indexOf('module.exports') === -1) {
      throw new Error('远程涂色数据格式异常（可能不是 JS 文件）')
    }
    const COLORING_DATA = parseColoring(dataStr)
    if (!COLORING_DATA || !COLORING_DATA.templates) {
      throw new Error('解析得到的涂色数据无效')
    }
    // 仅缓存 gitee 成功的结果，本地兜底不缓存以便后续重试远程
    cache = COLORING_DATA
    return { COLORING_DATA, source: 'gitee' }
  } catch (error) {
    console.error('从 gitee 获取涂色数据失败，回退本地兜底:', error)
    if (localData && localData.templates) {
      return { COLORING_DATA: localData, source: 'local' }
    }
    // 兜底也失败，返回错误信息供页面提示
    return {
      COLORING_DATA: null,
      source: 'error',
      error: String((error && error.message) || error)
    }
  }
}
