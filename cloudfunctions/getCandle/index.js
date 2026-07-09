// 云函数：根据 type(left/right) 从中转拉取对应蜡烛图，上传到云存储后回传 fileID
// 走云函数中转的好处：小程序端无需把 github.io 加入 downloadFile 合法域名，
// <image> 直接用云存储 fileID 即可跨端显示（iOS/Android/开发者工具均兼容）。
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const BASE = 'https://gitee.com/b64882/qian_data/raw/master'

// 云函数入口函数
exports.main = async (event) => {
  const type = event.type
  const url = `${BASE}/${type}.png`
  const cloudPath = `candle/${type}.png`

  const ctx = cloud.getWXContext()
  const env = (typeof ctx.ENV === 'string') ? ctx.ENV : ''

  // 已知 env 时，先尝试复用已上传的文件，省一次下载+上传
  if (env) {
    const fileID = `cloud://${env}/${cloudPath}`
    try {
      const check = await cloud.getTempFileURL({ fileList: [fileID] })
      const f = check.fileList && check.fileList[0]
      if (f && f.status === 0 && f.tempFileURL) {
        return { fileID, cached: true }
      }
    } catch (e) {
      // 文件不存在，继续下载上传
    }
  }

  // 下载图片二进制
  const resp = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(resp.data)

  // 上传到云存储（同名覆盖）
  const up = await cloud.uploadFile({ cloudPath, fileContent: buffer })
  return { fileID: up.fileID, cached: false }
}
