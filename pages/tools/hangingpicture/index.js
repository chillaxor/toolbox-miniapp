Page({
  data: {
    wallHeight: '',
    wallWidth: '',
    frameHeight: '',
    frameWidth: '',
    hookOffset: '5',
    furnitureHeight: '',
    gapWithFurniture: '15',
    showResult: false,
    centerHeight: 0,
    nailHeight: 0,
    nailLeft: 0,
    aboveFurniture: false,
    furnitureNailHeight: 0,
    // 示意图百分比
    diagramNailY: 0,
    diagramFrameY: 0,
    diagramFrameW: 0,
    diagramFrameH: 0,
    diagramCenterY: 0,
    diagramFurnitureH: 0
  },

  onInput: function (e) {
    var key = e.currentTarget.dataset.key;
    var obj = {};
    obj[key] = e.detail.value;
    this.setData(obj);
  },

  calculate: function () {
    var wh = parseFloat(this.data.wallHeight);
    var ww = parseFloat(this.data.wallWidth);
    var fh = parseFloat(this.data.frameHeight);
    var fw = parseFloat(this.data.frameWidth);
    var hookOff = parseFloat(this.data.hookOffset) || 5;
    var furnH = parseFloat(this.data.furnitureHeight) || 0;
    var gap = parseFloat(this.data.gapWithFurniture) || 15;

    if (!wh || !ww || !fh || !fw) {
      wx.showToast({ title: '请填写墙面和画框尺寸', icon: 'none' });
      return;
    }

    // 标准挂画高度：画中心离地 145cm（博物馆标准）
    var standardCenter = 145;
    var centerHeight = standardCenter;

    // 如果有家具，检查画是否在家具上方
    var aboveFurniture = false;
    var furnitureNailHeight = 0;
    if (furnH > 0) {
      var furnitureTopNail = furnH + gap + hookOff;
      var furnitureCenterH = furnH + gap + fh / 2;
      // 如果画底部低于家具顶部+间距，则按家具上方计算
      if (furnitureCenterH < standardCenter) {
        aboveFurniture = true;
        centerHeight = furnitureCenterH;
        furnitureNailHeight = furnH + gap + hookOff;
      }
    }

    // 钉子高度 = 画中心高度 - 画高/2 + 挂钩偏移
    var nailHeight;
    if (aboveFurniture) {
      nailHeight = furnitureNailHeight;
    } else {
      nailHeight = centerHeight - fh / 2 + hookOff;
    }

    // 水平居中
    var nailLeft = ww / 2;

    // 示意图百分比计算
    var wallMax = Math.max(wh, 300);
    var diagramFrameH = Math.min(fh / wallMax * 100, 40);
    var diagramFrameW = Math.min(fw / ww * 100, 60);
    var diagramFrameY = (centerHeight - fh / 2) / wallMax * 100;
    var diagramNailY = nailHeight / wallMax * 100;
    var diagramCenterY = centerHeight / wallMax * 100;
    var diagramFurnitureH = furnH > 0 ? furnH / wallMax * 100 : 0;

    this.setData({
      showResult: true,
      centerHeight: Math.round(centerHeight),
      nailHeight: Math.round(nailHeight),
      nailLeft: Math.round(nailLeft),
      aboveFurniture: aboveFurniture,
      furnitureNailHeight: Math.round(furnitureNailHeight),
      diagramFrameH: diagramFrameH,
      diagramFrameW: diagramFrameW,
      diagramFrameY: Math.max(5, diagramFrameY),
      diagramNailY: Math.max(5, diagramNailY),
      diagramCenterY: Math.max(5, diagramCenterY),
      diagramFurnitureH: diagramFurnitureH
    });
  },

  onShareAppMessage: function () {
    return { title: '挂画助手 - 精准计算挂画位置', path: '/pages/tools/hangingpicture/index' };
  }
});