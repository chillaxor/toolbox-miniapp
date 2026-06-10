const storage = require('../../../utils/storage.js')

const quotes = [
  '人生天地之间，若白驹过隙，忽然而已',
  '你不会比今天更年轻了',
  '种一棵树最好的时间是十年前，其次是现在',
  '每一个不曾起舞的日子，都是对生命的辜负',
  '生命不在于活了多少日子，而在于记住了多少日子',
  '一万年太久，只争朝夕',
  '时间就像海绵里的水，只要愿挤总还是有的',
  '把每一天当作生命的最后一天来过',
  '不要等待机会，而要创造机会',
  '昨天已逝，明日未知，今日珍贵'
]

const zodiacs = [
  { name: '摩羯座', start: [1,1], end: [1,19] },
  { name: '水瓶座', start: [1,20], end: [2,18] },
  { name: '双鱼座', start: [2,19], end: [3,20] },
  { name: '白羊座', start: [3,21], end: [4,19] },
  { name: '金牛座', start: [4,20], end: [5,20] },
  { name: '双子座', start: [5,21], end: [6,21] },
  { name: '巨蟹座', start: [6,22], end: [7,22] },
  { name: '狮子座', start: [7,23], end: [8,22] },
  { name: '处女座', start: [8,23], end: [9,22] },
  { name: '天秤座', start: [9,23], end: [10,23] },
  { name: '天蝎座', start: [10,24], end: [11,22] },
  { name: '射手座', start: [11,23], end: [12,21] },
  { name: '摩羯座', start: [12,22], end: [12,31] }
]

Page({
  data: {
    today: '',
    birthDate: '',
    lifeYears: 80,
    generated: false,
    // 结果数据
    ageYears: 0,
    weeksLived: 0,
    weeksLeft: 0,
    lifePercent: 0,
    daysLived: 0,
    hoursLived: 0,
    daysToNext: 0,
    zodiac: '',
    totalWeeks: 0,
    gridRows: [],
    yearMarks: [],
    gridWidth: 0,
    quote: ''
  },

  onLoad() {
    const now = new Date()
    const today = this.formatDate(now)
    this.setData({ today })
  },

  formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  onDateChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  setLife(e) {
    this.setData({ lifeYears: parseInt(e.currentTarget.dataset.v) })
  },

  generate() {
    const { birthDate, lifeYears, today } = this.data
    if (!birthDate) {
      wx.showToast({ title: '请选择出生日期', icon: 'none' })
      return
    }

    const birth = new Date(birthDate.replace(/-/g, '/'))
    const now = new Date(today.replace(/-/g, '/'))

    // 计算年龄
    const diffMs = now - birth
    const daysLived = Math.floor(diffMs / 86400000)
    const hoursLived = Math.floor(diffMs / 3600000)
    const ageYears = Math.floor(daysLived / 365.25)

    // 计算周数
    const weeksLived = Math.floor(daysLived / 7)
    const totalWeeks = lifeYears * 52
    const weeksLeft = totalWeeks - weeksLived
    const lifePercent = Math.min(100, Math.round((weeksLived / totalWeeks) * 100))

    // 下一个生日
    let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday <= now) {
      nextBirthday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
    }
    const daysToNext = Math.ceil((nextBirthday - now) / 86400000)

    // 星座
    const m = birth.getMonth() + 1
    const d = birth.getDate()
    let zodiac = '未知'
    for (const z of zodiacs) {
      const [sm, sd] = z.start
      const [em, ed] = z.end
      if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)) {
        zodiac = z.name
        break
      }
    }

    // 生成格子数据
    const { gridRows, yearMarks, gridWidth } = this.buildGrid(birth, lifeYears, weeksLived)

    // 随机名言
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    this.setData({
      generated: true,
      ageYears,
      weeksLived,
      weeksLeft,
      lifePercent,
      daysLived,
      hoursLived,
      daysToNext,
      zodiac,
      totalWeeks,
      gridRows,
      yearMarks,
      gridWidth,
      quote
    })

    // 保存历史
    storage.addHistory({ id: 'lifecalendar', title: '人生日历', time: Date.now() })
  },

  buildGrid(birth, lifeYears, weeksLived) {
    const rows = []
    const marks = []
    const COLS = 52
    const dotSize = 14
    const gap = 4
    const labelW = 60
    const gridWidth = labelW + COLS * (dotSize + gap) + 20

    for (let year = 0; year < lifeYears; year++) {
      const dots = []
      for (let week = 0; week < COLS; week++) {
        const weekIndex = year * 52 + week
        let s = 0 // 0=future
        if (weekIndex < weeksLived) s = 1 // lived
        else if (weekIndex === weeksLived) s = 2 // current
        dots.push({ y: year, w: week, s })
      }
      // 每10年加标签
      let yearLabel = ''
      if (year % 10 === 0) yearLabel = year + '岁'
      rows.push({ yearLabel, dots })

      // 年代标记
      if (year % 10 === 0) {
        marks.push({ year: birth.getFullYear() + year, pos: (year / lifeYears) * 100 })
      }
    }

    return { gridRows: rows, yearMarks: marks, gridWidth }
  },

  onDotTap(e) {
    const { year, week } = e.currentTarget.dataset
    const age = year + Math.floor(week / 52)
    wx.showToast({ title: `${age}岁 第${week % 52 + 1}周`, icon: 'none' })
  },

  reset() {
    this.setData({ generated: false })
  },

  onShareAppMessage() {
    return {
      title: `我的人生已过了${this.data.lifePercent}%，你的呢？`,
      path: '/pages/tools/lifecalendar/index'
    }
  }
})
