module.exports = [
  {
    "id": "toy",
    "title": "借玩具风波",
    "difficulty": 1,
    "a": {
      "name": "小明",
      "emoji": "🧒"
    },
    "b": {
      "name": "小红",
      "emoji": "👧"
    },
    "scene": "客厅的地板上，摔坏的机器人玩具散落一地。",
    "bubbles": [
      {
        "who": "a",
        "text": "小红把我的机器人弄坏了！这是我生日收到的！"
      },
      {
        "who": "b",
        "text": "我不是故意的…它自己掉地上的…"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "先观察：小明现在是什么心情？",
        "options": [
          {
            "emoji": "😡",
            "label": "生气",
            "correct": true
          },
          {
            "emoji": "😢",
            "label": "伤心",
            "correct": true
          },
          {
            "emoji": "😐",
            "label": "无所谓",
            "correct": false
          }
        ]
      },
      {
        "who": "b",
        "prompt": "小红呢？她现在是什么心情？",
        "options": [
          {
            "emoji": "😟",
            "label": "内疚",
            "correct": true
          },
          {
            "emoji": "😠",
            "label": "愤怒",
            "correct": false
          },
          {
            "emoji": "😴",
            "label": "困了",
            "correct": false
          }
        ]
      }
    ],
    "choices": [
      {
        "key": "A",
        "text": "“你就是故意的！我再也不跟你玩了！”",
        "score": -30,
        "ending": "cold",
        "result": "小红咬着嘴唇跑开了，眼睛红红的。两人好几天都没说话，谁也不理谁。",
        "tip": "生气很正常，但说伤人的话会让朋友更难过。想试试别的方式吗？"
      },
      {
        "key": "B",
        "text": "“…算了，没关系。”（但表情有点委屈）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "两人表面上又一起玩了，可小明心里还记着这件事，没完全放下。",
        "tip": "看起来和好了，但心里还有个小疙瘩。以后真诚聊聊会更好哦。"
      },
      {
        "key": "C",
        "text": "“这个机器人对我很重要，我现在很生气。你能帮我一起修吗？”",
        "score": 20,
        "ending": "repair",
        "result": "小红点点头，两人一起用胶带把机器人修好。虽然有裂痕，但这是一起修好的，更特别了！",
        "tip": "用“我句式”说出感受，还邀请对方一起解决，真是沟通小达人！"
      }
    ]
  }
];
