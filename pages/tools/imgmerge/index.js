Page({
  data: {
    images: [],        // {tempFilePath, width, height}
    direction: 'vertical', // vertical | horizontal
    gap: 2,
    dragIndex: -1,
    merging: false
  },

  pickImages() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多选择9张', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => ({
          tempFilePath: f.tempFilePath,
          width: f.width,
          height: f.height
        }));
        this.setData({
          images: [...this.data.images, ...newImages]
        });
      }
    });
  },

  clearImages() {
    this.setData({ images: [], dragIndex: -1 });
  },

  deleteImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(idx, 1);
    this.setData({ images });
  },

  previewImage(e) {
    const idx = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[idx].tempFilePath,
      urls: this.data.images.map(i => i.tempFilePath)
    });
  },

  setDirection(e) {
    this.setData({ direction: e.currentTarget.dataset.dir });
  },

  onGapChange(e) {
    this.setData({ gap: e.detail.value });
  },

  // 拖拽排序
  onDragStart(e) {
    this.setData({ dragIndex: e.currentTarget.dataset.idx });
  },

  onDragMove() {},

  onDragTo(e) {
    const targetIdx = e.currentTarget.dataset.target;
    const fromIdx = this.data.dragIndex;
    if (fromIdx === targetIdx || fromIdx < 0) {
      this.setData({ dragIndex: -1 });
      return;
    }
    const images = [...this.data.images];
    const [moved] = images.splice(fromIdx, 1);
    images.splice(targetIdx, 0, moved);
    this.setData({ images, dragIndex: -1 });
  },

  onDragEnd() {
    this.setData({ dragIndex: -1 });
  },

  mergeAndSave() {
    if (this.data.merging) return;
    if (this.data.images.length < 2) {
      wx.showToast({ title: '至少需要2张图片', icon: 'none' });
      return;
    }
    this.setData({ merging: true });
    wx.showLoading({ title: '合并中...' });

    // 先获取所有图片信息，再合并
    this._loadAllImages().then(imgInfos => {
      return this._drawMerge(imgInfos);
    }).then(tempPath => {
      wx.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: () => {
          wx.hideLoading();
          wx.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: (err) => {
          wx.hideLoading();
          if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
            wx.showModal({
              title: '需要授权',
              content: '请在设置中允许保存到相册',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              }
            });
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '合并失败', icon: 'none' });
    }).finally(() => {
      this.setData({ merging: false });
    });
  },

  _loadAllImages() {
    return Promise.all(this.data.images.map(img => {
      return new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: img.tempFilePath,
          success: (info) => resolve(info),
          fail: reject
        });
      });
    }));
  },

  _drawMerge(imgInfos) {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('#mergeCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            reject(new Error('canvas not found'));
            return;
          }
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          const isVertical = this.data.direction === 'vertical';
          const gap = this.data.gap;

          // 计算画布尺寸：统一宽度(垂直)或统一高度(水平)
          let totalW, totalH;

          if (isVertical) {
            const targetW = 750; // 统一宽度
            totalW = targetW;
            totalH = 0;
            imgInfos.forEach((info, i) => {
              const ratio = targetW / info.width;
              totalH += Math.round(info.height * ratio);
              if (i > 0) totalH += gap;
            });
          } else {
            const targetH = 750; // 统一高度
            totalH = targetH;
            totalW = 0;
            imgInfos.forEach((info, i) => {
              const ratio = targetH / info.height;
              totalW += Math.round(info.width * ratio);
              if (i > 0) totalW += gap;
            });
          }

          // 限制最大尺寸防止内存溢出
          const maxDim = 4096;
          let scale = 1;
          if (totalW > maxDim || totalH > maxDim) {
            scale = Math.min(maxDim / totalW, maxDim / totalH);
            totalW = Math.round(totalW * scale);
            totalH = Math.round(totalH * scale);
          }

          canvas.width = totalW;
          canvas.height = totalH;

          // 白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, totalW, totalH);

          // 逐张绘制
          let offset = 0;
          const drawNext = (index) => {
            if (index >= imgInfos.length) {
              // 全部绘制完成，导出
              wx.canvasToTempFilePath({
                canvas: canvas,
                fileType: 'jpg',
                quality: 0.95,
                success: (r) => resolve(r.tempFilePath),
                fail: reject
              });
              return;
            }

            const info = imgInfos[index];
            let drawW, drawH, drawX, drawY;

            if (isVertical) {
              const ratio = (totalW / scale) / info.width * scale;
              drawW = totalW;
              drawH = Math.round(info.height * ratio);
              drawX = 0;
              drawY = offset;
              offset += drawH + gap;
            } else {
              const ratio = (totalH / scale) / info.height * scale;
              drawH = totalH;
              drawW = Math.round(info.width * ratio);
              drawX = offset;
              drawY = 0;
              offset += drawW + gap;
            }

            const img = canvas.createImage();
            img.onload = () => {
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              drawNext(index + 1);
            };
            img.onerror = () => {
              reject(new Error('image load failed'));
            };
            img.src = info.path;
          };

          drawNext(0);
        });
    });
  }
});
