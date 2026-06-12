Page({
  data: {
    mode: 'easy',
    status: 'ready', // ready, typing, result
    textArray: [],
    targetText: '',
    inputValue: '',
    currentPos: 0,
    charsTyped: 0,
    totalChars: 0,
    errorCount: 0,
    seconds: 0,
    wpm: 0,
    cpm: 0,
    accuracy: 100,
    grade: '',
    gradeClass: '',
    gradeIcon: '',
    bestWpm: 0,
    inputFocus: false
  },

  timer: null,
  startTime: 0,
  correctCount: 0,
  totalKeystrokes: 0,

  // 测试文本库
  textBank: {
    easy: [
      '今天天气真好，适合出去散步。',
      '我最喜欢吃苹果和香蕉了。',
      '明天是星期三，我们去公园玩吧。',
      '春天来了，花儿开了，小鸟在唱歌。',
      '妈妈做的饭菜真好吃。',
      '我在学校学到了很多新知识。',
      '爸爸带我去看了电影，非常精彩。',
      '小猫在阳光下懒洋洋地睡觉。',
      '这本书很有趣，我一口气读完了。',
      '快乐的时光总是过得特别快。',
      '早上好，今天又是美好的一天。',
      '我喜欢在雨天听音乐看书。',
      '奶奶给我讲了一个有趣的故事。',
      '月亮弯弯的，像一条小船。',
      '夏天的西瓜又甜又解渴。',
      '秋天的树叶变成了金黄色。',
      '冬天来了，我最喜欢堆雪人。',
      '老师说读书要认真仔细。',
      '弟弟学会了骑自行车，很高兴。',
      '我家门前有一棵大树，很茂盛。'
    ],
    medium: [
      '编程是一门有趣的技术，通过编写代码，我们可以创造出各种各样的应用程序。无论是手机应用、网站还是互动，都离不开程序员的努力。学习编程需要耐心和坚持，但当你看到自己的代码运行成功时，那种成就感是无与伦比的。',
      '春天是一个充满希望的季节，万物复苏，大地披上了绿色的新装。公园里的樱花盛开，吸引了很多游客前来观赏。孩子们在草地上奔跑嬉戏，老人们在长椅上晒太阳聊天。春风轻轻吹过，带来花的芬芳。',
      '阅读是获取知识的重要途径，一本好书可以开阔我们的视野，丰富我们的思想。无论是文学作品、历史书籍还是科学读物，都能给我们带来不同的收获。养成每天阅读的好习惯，对我们的成长非常有帮助。',
      '中国有着悠久的历史和灿烂的文化，从长城到故宫，从兵马俑到莫高窟，每一处古迹都承载着千年的故事。中华文明源远流长，博大精深，是我们引以为豪的精神财富。',
      '健康的生活方式对每个人都非常重要。合理的饮食、充足的睡眠和适当的运动是保持健康的三大要素。我们应该多吃蔬菜水果，少吃油腻食品，每天保证八小时的睡眠时间，坚持锻炼身体。',
      '科技的发展日新月异，人工智能、大数据、云计算等新技术正在改变我们的生活。智能家居让我们的生活更加便捷，移动支付让我们出门不用带钱包，外卖平台让我们足不出户就能享受美食。',
      '音乐是人类最美好的艺术形式之一，它能表达语言无法传递的情感。古典音乐优雅深沉，流行音乐活泼欢快，民谣音乐温暖质朴。不同风格的音乐带给我们不同的感受和体验。',
      '旅行是一种很好的放松方式，去看看不同的风景，体验不同的文化，品尝不同的美食。每一次旅行都会给我们留下难忘的回忆，让我们更加热爱这个世界。人生就像一场旅行，重要的不是目的地，而是沿途的风景。'
    ],
    hard: [
      '在计算机科学领域，算法是解决特定问题的一系列明确指令。一个高效的算法可以在极短的时间内处理海量数据，而一个低效的算法可能需要数倍甚至数百倍的时间。因此，算法设计与分析是计算机科学的核心内容之一。常见的算法思想包括分治法、动态规划、贪心算法、回溯法等。每种算法思想都有其适用的场景和局限性，选择合适的算法对于解决实际问题至关重要。',
      '中华人民共和国成立于一九四九年十月一日，从那时起，中华民族开始了新的历史征程。七十余年来，中国从一个积贫积弱的农业国发展成为世界第二大经济体，创造了人类发展史上的奇迹。高铁网络四通八达，移动支付全面普及，科技创新成果层出不穷。这一切成就的取得，离不开全体中国人民的辛勤付出和不懈奋斗。',
      '量子计算是当今科技前沿最热门的研究方向之一。与传统计算机使用比特作为基本信息单位不同，量子计算机使用量子比特，利用量子叠加和量子纠缠等特性来处理信息。理论上，量子计算机在某些特定问题上的计算能力远超传统计算机。然而，量子计算技术目前仍处于发展初期，面临着量子退相干、错误校正等诸多技术挑战。',
      '气候变化是二十一世纪人类面临的最严峻挑战之一。全球变暖导致冰川融化、海平面上升、极端天气事件频发。为了应对这一挑战，各国政府纷纷提出碳达峰和碳中和目标，大力发展可再生能源，推动绿色低碳转型。作为普通人，我们也应该从日常生活的点滴做起，节约能源，减少排放，为保护地球家园贡献自己的力量。',
      '人工智能的发展历程可以追溯到上世纪五十年代，经过几十年的起起落落，如今终于迎来了爆发式增长。深度学习技术的突破使得机器在图像识别、语音处理、自然语言理解等领域取得了超越人类的表现。大语言模型的出现更是掀起了一场革命，它不仅能与人进行自然流畅的对话，还能撰写文章、编写代码、辅助科学研究。',
      '中华美食文化源远流长，博大精深，是中华民族智慧的结晶。中国菜系丰富多样，最具代表性的有川菜、粤菜、鲁菜、淮扬菜等八大菜系。每一种菜系都有其独特的烹饪技法和风味特点。川菜以麻辣著称，粤菜以清淡鲜美闻名，鲁菜擅长爆炒烧炸，淮扬菜注重刀工火候。中华美食不仅满足了人们的味蕾，更承载着深厚的地域文化和历史记忆。'
    ]
  },

  onLoad() {
    this.loadBestWpm();
    this.generateText();
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 加载历史最佳WPM
  loadBestWpm() {
    try {
      const best = wx.getStorageSync('typing_test_best_wpm');
      if (best) {
        this.setData({ bestWpm: best });
      }
    } catch (e) {}
  },

  // 保存历史最佳WPM
  saveBestWpm(wpm) {
    try {
      const best = wx.getStorageSync('typing_test_best_wpm') || 0;
      if (wpm > best) {
        wx.setStorageSync('typing_test_best_wpm', wpm);
        this.setData({ bestWpm: wpm });
      }
    } catch (e) {}
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });
    this.generateText();
  },

  // 生成测试文本
  generateText() {
    const { mode } = this.data;
    const texts = this.textBank[mode];
    const randomIndex = Math.floor(Math.random() * texts.length);
    const targetText = texts[randomIndex];
    const textArray = targetText.split('').map(char => ({
      char: char,
      typed: false,
      correct: false
    }));

    this.setData({
      targetText,
      textArray,
      inputValue: '',
      currentPos: 0,
      charsTyped: 0,
      errorCount: 0,
      correctCount: 0,
      totalKeystrokes: 0,
      seconds: 0,
      wpm: 0,
      cpm: 0,
      accuracy: 100,
      status: 'ready',
      inputFocus: false
    });
  },

  // 开始测试
  startTest() {
    this.startTime = Date.now();
    this.timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.setData({ seconds });
      this.calcWpm();
    }, 200);

    this.setData({
      status: 'typing',
      inputFocus: true
    });
  },

  // 处理输入
  onInput(e) {
    const inputValue = e.detail.value;
    const { targetText, textArray, currentPos } = this.data;

    // 处理新增的字符
    if (inputValue.length > this.data.inputValue.length) {
      const newChar = inputValue[inputValue.length - 1];
      const targetChar = targetText[currentPos];

      if (currentPos < targetText.length) {
        textArray[currentPos] = {
          char: targetChar,
          typed: true,
          correct: newChar === targetChar
        };

        if (newChar === targetChar) {
          this.correctCount++;
        } else {
          this.data.errorCount++;
        }
        this.totalKeystrokes++;

        this.setData({
          textArray,
          currentPos: currentPos + 1,
          charsTyped: currentPos + 1,
          inputValue: inputValue,
          errorCount: this.data.errorCount
        });
      }

      // 检查是否完成
      if (currentPos + 1 >= targetText.length) {
        this.finishTest();
      }
    } else {
      // 处理删除
      if (currentPos > 0 && inputValue.length < this.data.inputValue.length) {
        const prevPos = currentPos - 1;
        const wasCorrect = textArray[prevPos].correct;
        if (wasCorrect) {
          this.correctCount--;
        }
        this.totalKeystrokes--;

        textArray[prevPos] = {
          char: targetText[prevPos],
          typed: false,
          correct: false
        };

        this.setData({
          textArray,
          currentPos: prevPos,
          charsTyped: prevPos,
          inputValue: inputValue
        });
      }
    }

    this.calcWpm();
  },

  onBlur() {
    if (this.data.status === 'typing') {
      this.setData({ inputFocus: true });
    }
  },

  // 计算WPM
  calcWpm() {
    const { seconds, charsTyped, targetText, errorCount } = this.data;
    if (seconds <= 0) return;

    const minutes = seconds / 60;
    // CPM = 已输入字符 / 分钟数
    const cpm = Math.round(charsTyped / minutes);
    // WPM = CPM / 5 (国际标准，5字符=1单词)
    const wpm = Math.round(cpm / 5);
    // 准确率
    const accuracy = charsTyped > 0 ? Math.round(((charsTyped - errorCount) / charsTyped) * 100) : 100;

    this.setData({
      wpm: wpm > 0 ? wpm : 0,
      cpm: cpm > 0 ? cpm : 0,
      accuracy: Math.max(0, accuracy)
    });
  },

  // 完成测试
  finishTest() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const { wpm, accuracy, seconds, targetText, errorCount } = this.data;
    const totalChars = targetText.length;

    // 评级
    let grade, gradeClass, gradeIcon;
    if (wpm >= 80 && accuracy >= 95) {
      grade = '打字大师'; gradeClass = 'grade-s'; gradeIcon = '🏆';
    } else if (wpm >= 60 && accuracy >= 90) {
      grade = '打字高手'; gradeClass = 'grade-a'; gradeIcon = '⭐';
    } else if (wpm >= 40 && accuracy >= 85) {
      grade = '打字达人'; gradeClass = 'grade-b'; gradeIcon = '👍';
    } else if (wpm >= 20) {
      grade = '打字新手'; gradeClass = 'grade-c'; gradeIcon = '💪';
    } else {
      grade = '继续加油'; gradeClass = 'grade-d'; gradeIcon = '🌱';
    }

    this.saveBestWpm(wpm);

    this.setData({
      status: 'result',
      totalChars,
      grade,
      gradeClass,
      gradeIcon,
      inputFocus: false
    });
  },

  // 重新开始
  resetTest() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.generateText();
  }
});
