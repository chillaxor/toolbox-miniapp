// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 发起 HTTP 请求获取签文数据
    const response = await axios.get('https://gitee.com/b64882/qian_data/raw/master/lingqian_data.js')
    const dataStr = response.data

    // 文件格式： var LINGQIAN_DATA = [ ... ]; （JS 对象字面量，键名未加引号、含嵌套数组与 \u 转义）
    // 1) 剥掉 "var LINGQIAN_DATA = " 前缀（容忍前面的注释行）
    // 2) 剥掉结尾的分号
    const body = dataStr
      .replace(/^[\s\S]*?var\s+LINGQIAN_DATA\s*=\s*/, '')
      .replace(/;\s*$/, '')

    // 用 new Function 求值，而非 JSON.parse
    // （数据不是严格 JSON：键名没引号、含 \u 转义、有嵌套数组，JSON.parse 必报错）
    const LINGQIAN_DATA = (new Function('return ' + body))()

    if (!Array.isArray(LINGQIAN_DATA)) {
      throw new Error('解析得到的签文数据不是数组')
    }

    return { LINGQIAN_DATA }
  } catch (error) {
    console.error('获取签文数据失败:', error)
    throw new Error('获取签文数据失败')
  }
}