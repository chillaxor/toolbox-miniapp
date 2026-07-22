Page({
  data: {
    unit: 'cm',
    direction: 'h',
    cal: 100,
    statusBarHeight: 20,
    panelOpen: true
  },

  onLoad() {
    this.resetOffset()
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },

  onReady() {
    this.initCanvas()
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  togglePanel() {
    this.setData({ panelOpen: !this.data.panelOpen })
  },

  resetOffset() {
    this.offsetX = 0
    this.offsetY = 0
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#ruler')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          this.canvas = res[0].node
          this.ctx = this.canvas.getContext('2d')
          const dpr = wx.getWindowInfo().pixelRatio
          const w = res[0].width
          const h = res[0].height
          this.canvas.width = w * dpr
          this.canvas.height = h * dpr
          this.ctx.scale(dpr, dpr)
          this.canvasW = w
          this.canvasH = h
          this.draw()
        }
      })
  },

  switchUnit(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ unit })
    this.resetOffset()
    this.draw()
  },

  switchDir(e) {
    const dir = e.currentTarget.dataset.dir
    this.setData({ direction: dir })
    this.resetOffset()
    setTimeout(() => {
      this.initCanvas()
    }, 100)
  },

  decreaseCal() {
    let cal = this.data.cal - 1
    if (cal < 70) cal = 70
    this.setData({ cal })
    this.draw()
  },

  increaseCal() {
    let cal = this.data.cal + 1
    if (cal > 130) cal = 130
    this.setData({ cal })
    this.draw()
  },

  lastX: 0,
  lastY: 0,
  offsetX: 0,
  offsetY: 0,

  onTouchStart(e) {
    const touch = e.touches[0]
    this.lastX = touch.clientX
    this.lastY = touch.clientY
  },

  onTouchMove(e) {
    const touch = e.touches[0]
    const dx = touch.clientX - this.lastX
    const dy = touch.clientY - this.lastY
    if (this.data.direction === 'h') {
      this.offsetX += dx
    } else {
      this.offsetY += dy
    }
    this.lastX = touch.clientX
    this.lastY = touch.clientY
    this.draw()
  },

  onTouchEnd() {},

  getPxPerUnit(unit, cal) {
    const sysInfo = wx.getWindowInfo()
    const screenWidth = sysInfo.windowWidth
    const assumedPhysicalWidth = 7
    const basePxPerCm = screenWidth / assumedPhysicalWidth
    const calibratedPxPerCm = basePxPerCm * (cal / 100)
    if (unit === 'cm') {
      return calibratedPxPerCm
    } else {
      return calibratedPxPerCm * 2.54
    }
  },

  draw() {
    if (!this.ctx) return
    const ctx = this.ctx
    const { unit, cal, direction } = this.data
    const isH = direction === 'h'
    const w = this.canvasW || 300
    const h = this.canvasH || 150
    const length = isH ? w : h
    const offset = isH ? this.offsetX : this.offsetY

    ctx.clearRect(0, 0, w, h)

    // 尺子背景 - 木纹色
    ctx.fillStyle = '#FDEBD0'
    ctx.fillRect(0, 0, w, h)

    // 边框
    ctx.strokeStyle = '#D4A574'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)

    const pxPerUnit = this.getPxPerUnit(unit, cal)
    const minorCount = unit === 'cm' ? 10 : 8
    const tickStep = 1 / minorCount

    const baseLinePos = 10
    const maxTickH = (isH ? h : w) - 30

    const startVal = -offset / pxPerUnit
    const endVal = startVal + length / pxPerUnit

    // 基线
    ctx.strokeStyle = '#5D4037'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (isH) {
      ctx.moveTo(0, baseLinePos)
      ctx.lineTo(w, baseLinePos)
    } else {
      ctx.moveTo(baseLinePos, 0)
      ctx.lineTo(baseLinePos, h)
    }
    ctx.stroke()

    const firstIdx = Math.floor(startVal / tickStep)
    const lastIdx = Math.ceil(endVal / tickStep)

    for (let i = firstIdx; i <= lastIdx; i++) {
      const val = i * tickStep
      const pos = (val - startVal) * pxPerUnit
      if (pos < -10 || pos > length + 10) continue

      const roundVal = Math.round(val * 10000)
      const isMajor = roundVal % 10000 === 0
      const isHalfCm = !isMajor && (roundVal % 5000 === 0)

      let tickH, lw
      if (isMajor) {
        tickH = maxTickH * 0.75
        lw = 1.2
      } else if (isHalfCm) {
        tickH = maxTickH * 0.5
        lw = 0.9
      } else {
        tickH = maxTickH * 0.2
        lw = 0.5
      }

      ctx.lineWidth = lw
      ctx.strokeStyle = '#5D4037'
      ctx.beginPath()
      if (isH) {
        ctx.moveTo(pos, baseLinePos)
        ctx.lineTo(pos, baseLinePos + tickH)
      } else {
        ctx.moveTo(baseLinePos, pos)
        ctx.lineTo(baseLinePos + tickH, pos)
      }
      ctx.stroke()

      if (isMajor) {
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#4E342E'
        const label = Math.round(val)
        if (isH) {
          ctx.fillText(String(label), pos, baseLinePos + tickH + 4)
        } else {
          ctx.save()
          ctx.translate(baseLinePos + tickH + 4, pos)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(String(label), 0, 0)
          ctx.restore()
        }
      }

      if (isHalfCm) {
        ctx.font = '8px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#795548'
        const halfLabel = (roundVal / 10000).toString()
        if (isH) {
          ctx.fillText(halfLabel, pos, baseLinePos + tickH + 3)
        } else {
          ctx.save()
          ctx.translate(baseLinePos + tickH + 3, pos)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(halfLabel, 0, 0)
          ctx.restore()
        }
      }
    }

    // 0刻度红线
    const zeroPos = (0 - startVal) * pxPerUnit
    if (zeroPos >= -5 && zeroPos <= length + 5) {
      ctx.strokeStyle = '#D32F2F'
      ctx.lineWidth = 2
      ctx.beginPath()
      if (isH) {
        ctx.moveTo(zeroPos, baseLinePos - 5)
        ctx.lineTo(zeroPos, baseLinePos + maxTickH * 0.75 + 5)
      } else {
        ctx.moveTo(baseLinePos - 5, zeroPos)
        ctx.lineTo(baseLinePos + maxTickH * 0.75 + 5, zeroPos)
      }
      ctx.stroke()
    }
  },

  onShareAppMessage() {
    return {
      title: '虚拟尺子 - 手机测量工具',
      path: '/packages/calcTools/ruler/index'
    }
  }
})
