// 小小侦探案件库（本地兜底，与 gitee 远程一致）
// gitee: https://gitee.com/b64882/qian_data/raw/master/clueguess_cases.json
module.exports = [
  {
    "title": "谁拿走了小红的绘本？",
    "scene": "小红的绘本不见了，大家都在到处找。是谁悄悄拿走的呢？",
    "suspects": [
      {
        "name": "小猫",
        "emoji": "🐱"
      },
      {
        "name": "小鲀",
        "emoji": "🐡"
      },
      {
        "name": "小鸡",
        "emoji": "🐤"
      },
      {
        "name": "小企鹅",
        "emoji": "🐧"
      },
      {
        "name": "小猴",
        "emoji": "🐵"
      },
      {
        "name": "小狮子",
        "emoji": "🦁"
      }
    ],
    "culprit": 4,
    "clues": [
      {
        "icon": "🎵",
        "text": "小猫在轻轻哼歌，没参与这件事",
        "eliminate": [
          0,
          5
        ]
      },
      {
        "icon": "🐾",
        "text": "现场没有小鲀的脚印，可以排除它",
        "eliminate": [
          1
        ]
      },
      {
        "icon": "📝",
        "text": "小鸡说它一直在荡秋千玩，没靠近过现场",
        "eliminate": [
          2
        ]
      },
      {
        "icon": "🧶",
        "text": "小企鹅在搭积木，一直没离开",
        "eliminate": [
          3
        ]
      }
    ]
  },
  {
    "title": "谁弄坏了积木塔？",
    "scene": "积木塔坏掉了，散落一地。是谁不小心弄坏的？",
    "suspects": [
      {
        "name": "小牛",
        "emoji": "🐮"
      },
      {
        "name": "小猫",
        "emoji": "🐱"
      },
      {
        "name": "小龟",
        "emoji": "🐢"
      },
      {
        "name": "小猪",
        "emoji": "🐷"
      },
      {
        "name": "小企鹅",
        "emoji": "🐧"
      }
    ],
    "culprit": 3,
    "clues": [
      {
        "icon": "📝",
        "text": "小牛说它一直在草地上打滚玩，没靠近过现场",
        "eliminate": [
          0
        ]
      },
      {
        "icon": "🐾",
        "text": "现场没有小猫的脚印，可以排除它",
        "eliminate": [
          1
        ]
      },
      {
        "icon": "🌟",
        "text": "小龟当时在啃胡萝卜，有小伙伴可以作证",
        "eliminate": [
          2
        ]
      },
      {
        "icon": "👀",
        "text": "有人看见小企鹅在远处的树下，离得远远的",
        "eliminate": [
          4
        ]
      }
    ]
  },
  {
    "title": "谁打翻了红色颜料？",
    "scene": "红色颜料洒了一地，黏糊糊的。是谁闯的祸？",
    "suspects": [
      {
        "name": "小狐狸",
        "emoji": "🦊"
      },
      {
        "name": "小仓鼠",
        "emoji": "🐹"
      },
      {
        "name": "大壮",
        "emoji": "🧔"
      },
      {
        "name": "小猪",
        "emoji": "🐷"
      },
      {
        "name": "小鲀",
        "emoji": "🐡"
      }
    ],
    "culprit": 4,
    "clues": [
      {
        "icon": "🐾",
        "text": "现场没有小狐狸的脚印，可以排除它",
        "eliminate": [
          0
        ]
      },
      {
        "icon": "🎨",
        "text": "小仓鼠在玩毛线球忙别的事，被大家看见了",
        "eliminate": [
          1
        ]
      },
      {
        "icon": "📷",
        "text": "照片里大壮在远处的树下，不在现场",
        "eliminate": [
          2
        ]
      },
      {
        "icon": "💤",
        "text": "小猪在午睡打呼噜，什么都不知道",
        "eliminate": [
          3
        ]
      }
    ]
  },
  {
    "title": "谁吃掉了糖果？",
    "scene": "盘子里少了一块糖果，香味还飘着。是谁偷吃的呀？",
    "suspects": [
      {
        "name": "小青蛙",
        "emoji": "🐸"
      },
      {
        "name": "小鲀",
        "emoji": "🐡"
      },
      {
        "name": "小老虎",
        "emoji": "🐯"
      },
      {
        "name": "小鸡",
        "emoji": "🐤"
      },
      {
        "name": "小考拉",
        "emoji": "🐨"
      },
      {
        "name": "小兔",
        "emoji": "🐰"
      },
      {
        "name": "小猪",
        "emoji": "🐷"
      }
    ],
    "culprit": 6,
    "clues": [
      {
        "icon": "👀",
        "text": "有人看见小青蛙在玩滑梯，离得远远的",
        "eliminate": [
          0,
          5
        ]
      },
      {
        "icon": "🍎",
        "text": "小鲀只爱吃玉米，对这事没兴趣",
        "eliminate": [
          1
        ]
      },
      {
        "icon": "🧶",
        "text": "小老虎在听音乐，一直没离开",
        "eliminate": [
          2
        ]
      },
      {
        "icon": "🎨",
        "text": "小鸡在草地上打滚忙别的事，被大家看见了",
        "eliminate": [
          3
        ]
      },
      {
        "icon": "🐾",
        "text": "现场没有小考拉的脚印，可以排除它",
        "eliminate": [
          4
        ]
      }
    ]
  }
];
