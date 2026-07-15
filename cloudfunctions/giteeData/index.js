// 云函数：giteeData —— 通用 gitee 远程数据代理
// 解决小程序 wx.request 不跟随 gitee raw 的 302 跳转（跳到 raw.giteeusercontent.com）问题：
// 由云端 Node.js（axios 默认自动跟随重定向）去拉取并解析，再把干净数据回传小程序。
// 小程序侧用 wx.cloud.callFunction 调用，完全不受 request 域名白名单限制，也不需要 gitee 域名加白。
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 仅允许 gitee 的 raw 源，避免本云函数被当成开放代理滥用
const ALLOWED_HOSTS = ['gitee.com', 'raw.giteeusercontent.com']

// 模块级缓存：云函数实例热启动时（同一容器）不再重复请求 gitee
// key: url, value: { value, expire }
const cache = new Map()
const DEFAULT_TTL = 10 * 60 * 1000 // 10 分钟

/**
 * 解析远程内容，兼容三种格式：
 *  1) 合法 JSON（如 elements-data-for-gitee.json）—— 直接 JSON.parse
 *  2) 含 module.exports 的 CommonJS 模块（如 coloring-data.js）—— new Function 受控执行后读 module.exports
 *  3) `var X = [...]` / `const X = {...}` 纯字面量（如 lingqian_data.js）—— new Function('return '+body)()
 */
function parseContent(str) {
  const s = (str || '').trim()
  if (!s) throw new Error('远程内容为空')

  // 1) 先试 JSON
  try {
    return JSON.parse(s)
  } catch (e) { /* 不是 JSON，往下走 */ }

  // 2) 再试 CommonJS 模块
  if (s.indexOf('module.exports') !== -1) {
    const moduleObj = { exports: {} }
    // eslint-disable-next-line no-new-func
    const fn = new Function('module', 'exports', s)
    fn(moduleObj, moduleObj.exports)
    return moduleObj.exports
  }

  // 3) 再试 `var/let/const X = 字面量`
  const body = s
    .replace(/^[\s\S]*?(?:var|let|const)\s+[A-Za-z_$][\w$]*\s*=\s*/, '') // 剥掉前缀声明（容忍前面的注释）
    .replace(/;\s*$/, '') // 剥掉结尾分号
  try {
    // eslint-disable-next-line no-new-func
    return (new Function('return ' + body))()
  } catch (e) {
    throw new Error('远程内容既非 JSON、也非可解析的 JS 模块/字面量')
  }
}

exports.main = async (event, context) => {
  const url = event && event.url
  if (!url) {
    return { data: null, source: 'error', error: '缺少 url 参数' }
  }

  // 校验 host 白名单
  let host = ''
  try {
    host = new URL(url).hostname
  } catch (e) {
    return { data: null, source: 'error', error: 'url 非法' }
  }
  if (ALLOWED_HOSTS.indexOf(host) === -1) {
    return { data: null, source: 'error', error: '仅允许 gitee 数据源，拒绝 host: ' + host }
  }

  const ttl = (event && event.ttl) || DEFAULT_TTL
  const now = Date.now()

  // 命中缓存（未过期）
  const hit = cache.get(url)
  if (hit && hit.expire > now) {
    return { data: hit.value, source: 'cache' }
  }

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      responseType: 'text',
      headers: { 'User-Agent': 'miniprogram-cloud/1.0' }
    })
    const content = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data)
    const parsed = parseContent(content)

    // 仅缓存 gitee 成功的结果
    cache.set(url, { value: parsed, expire: now + ttl })

    return { data: parsed, source: 'gitee' }
  } catch (error) {
    console.error('[giteeData] 远程获取失败:', url, error && error.message)
    // 若缓存里有（即便过期）也先兜底返回，提升弱网可用性
    if (hit) {
      return { data: hit.value, source: 'cache-stale' }
    }
    return {
      data: null,
      source: 'error',
      error: String((error && error.message) || error)
    }
  }
}
