// 友谊修复 · 场景库（本地兜底数据，require 三级路径 ../../../data/friendship_scenes.js）
// 运行时优先从 gitee 拉取最新版（wx.request 直连，不走云函数），拉不到则用本文件兜底。
// 每个场景 = 一场朋友间的小冲突。玩家经历 4 幕：冲突发生 → 情绪识别 → 应对选择 → 结果反馈。
// moods：情绪识别题，options 中 correct:true 的都算答对（可多选正确）。
// choices：3 个应对选项，score 为关系值变化（起始 60）；surface:true 为"表面和好"特殊态。
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
  },
  {
    "id": "rules",
    "title": "游戏规则分歧",
    "difficulty": 1,
    "a": {
      "name": "小刚",
      "emoji": "🧒"
    },
    "b": {
      "name": "小美",
      "emoji": "👧"
    },
    "scene": "大家在玩跳棋，小刚觉得自己赢了，小美却说规则不是这样。",
    "bubbles": [
      {
        "who": "a",
        "text": "我明明赢了！你耍赖！"
      },
      {
        "who": "b",
        "text": "没有呀，是你没看清规则…"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "小刚现在是什么心情？",
        "options": [
          {
            "emoji": "😤",
            "label": "愤怒",
            "correct": true
          },
          {
            "emoji": "😊",
            "label": "开心",
            "correct": false
          },
          {
            "emoji": "🥱",
            "label": "无聊",
            "correct": false
          }
        ]
      },
      {
        "who": "b",
        "prompt": "小美被说是“耍赖”，她是什么心情？",
        "options": [
          {
            "emoji": "😕",
            "label": "委屈",
            "correct": true
          },
          {
            "emoji": "🤔",
            "label": "困惑",
            "correct": true
          },
          {
            "emoji": "😡",
            "label": "暴怒",
            "correct": false
          }
        ]
      }
    ],
    "choices": [
      {
        "key": "A",
        "text": "“你就是耍赖！这棋我不下了！”",
        "score": -30,
        "ending": "cold",
        "result": "小刚把棋盘一推，小美愣住了。游戏不欢而散，两人都闷闷不乐。",
        "tip": "认定对方耍赖，往往会让小事变大。换个角度看看？"
      },
      {
        "key": "B",
        "text": "“…那就不玩了。”（转身走开，有点不高兴）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "游戏停了，小刚心里还堵着，和小美之间多了一点隔阂。",
        "tip": "避开冲突不等于解决冲突。下次可以试着把话说明白。"
      },
      {
        "key": "C",
        "text": "“我们重新看一遍规则好不好？一起确认谁赢了。”",
        "score": 20,
        "ending": "repair",
        "result": "两人头碰头看规则，发现是小刚看漏了一行。他不好意思地笑了，友谊小船稳稳的。",
        "tip": "一起核对事实，比互相指责有用多啦！"
      }
    ]
  },
  {
    "id": "secret",
    "title": "秘密泄露",
    "difficulty": 2,
    "a": {
      "name": "小丽",
      "emoji": "👧"
    },
    "b": {
      "name": "小雅",
      "emoji": "👧"
    },
    "scene": "小丽发现自己悄悄告诉小雅的小秘密，被大家知道了。",
    "bubbles": [
      {
        "who": "a",
        "text": "你答应我不告诉别人的！"
      },
      {
        "who": "b",
        "text": "对不起…我不小心说漏嘴了…"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "小丽现在是什么心情？",
        "options": [
          {
            "emoji": "😢",
            "label": "伤心",
            "correct": true
          },
          {
            "emoji": "💔",
            "label": "觉得被背叛",
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
        "prompt": "小雅说漏嘴后，她是什么心情？",
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
        "text": "“你这个大嘴巴！我再也不信你了！”",
        "score": -30,
        "ending": "cold",
        "result": "小丽扭头就走，小雅站在原地很自责。两人不再说悄悄话了。",
        "tip": "一句“再也不信你”，可能把好朋友推得很远。先听听她的解释？"
      },
      {
        "key": "B",
        "text": "“…没关系。”（但以后再也不跟她分享秘密）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "小丽嘴上说没事，却悄悄把小雅从“好朋友名单”里划掉了。",
        "tip": "假装没关系，心里却关上了门。真正的和解需要说出来。"
      },
      {
        "key": "C",
        "text": "“我很难过你说了出去。但我知道你不是故意的，我们约定以后先问我好吗？”",
        "score": 20,
        "ending": "repair",
        "result": "小雅用力点头，两人拉了钩。秘密依然是小秘密，信任也补好了。",
        "tip": "说出自己的感受，也相信对方不是故意的——这就是成熟的和解。"
      }
    ]
  },
  {
    "id": "ignored",
    "title": "被冷落",
    "difficulty": 2,
    "a": {
      "name": "小宇",
      "emoji": "🧑"
    },
    "b": {
      "name": "小新",
      "emoji": "👦"
    },
    "scene": "来了新朋友小新，大家都在围着小新玩，没人注意到小宇。",
    "bubbles": [
      {
        "who": "a",
        "text": "（小声）大家都去跟小新玩了…没人找我。"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "小宇现在是什么心情？",
        "options": [
          {
            "emoji": "😢",
            "label": "孤独",
            "correct": true
          },
          {
            "emoji": "😔",
            "label": "不安",
            "correct": true
          },
          {
            "emoji": "😊",
            "label": "开心",
            "correct": false
          }
        ]
      }
    ],
    "choices": [
      {
        "key": "A",
        "text": "“你们都不理我，我也不跟你们玩了！”",
        "score": -30,
        "ending": "cold",
        "result": "小宇赌气走开，大家玩得正开心，竟没发现他难过了。",
        "tip": "把自己关起来，别人更难发现你的感受。试试说出来？"
      },
      {
        "key": "B",
        "text": "（默默走开，一个人待着）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "小宇远远看着，心里酸酸的。大家玩完才想起他，有点不好意思。",
        "tip": "一个人待着能冷静，但朋友也需要知道你在想什么。"
      },
      {
        "key": "C",
        "text": "“我也想一起玩，可以加我一个吗？”",
        "score": 20,
        "ending": "repair",
        "result": "小伙伴连忙招手：“快来快来！”小宇笑着跑过去，新朋友旧朋友一起玩。",
        "tip": "主动说“我想加入”，比生闷气更容易被看见。你做得真好！"
      }
    ]
  },
  {
    "id": "misunderstand",
    "title": "误会",
    "difficulty": 3,
    "a": {
      "name": "小浩",
      "emoji": "🧒"
    },
    "b": {
      "name": "小彤",
      "emoji": "👧"
    },
    "scene": "小浩以为小彤故意不理自己，其实小彤刚才在想事情，根本没看见他。",
    "bubbles": [
      {
        "who": "a",
        "text": "你为什么不理我？"
      },
      {
        "who": "b",
        "text": "啊？我刚才在想事情，没注意到你呀。"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "小浩一开始误会时，是什么心情？",
        "options": [
          {
            "emoji": "😕",
            "label": "困惑",
            "correct": true
          },
          {
            "emoji": "😢",
            "label": "委屈",
            "correct": true
          },
          {
            "emoji": "😠",
            "label": "暴怒",
            "correct": false
          }
        ]
      },
      {
        "who": "b",
        "prompt": "小彤被突然质问，她是什么心情？",
        "options": [
          {
            "emoji": "😶",
            "label": "茫然",
            "correct": true
          },
          {
            "emoji": "😠",
            "label": "生气",
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
        "text": "“你就是故意不理我，绝交！”",
        "score": -30,
        "ending": "cold",
        "result": "小浩气呼呼走了，小彤一脸委屈。好好的朋友，因为一个误会闹僵了。",
        "tip": "误会最怕“我以为”。先问一句“你怎么了”，比下定论更温柔。"
      },
      {
        "key": "B",
        "text": "“…那以后别找我了。”（其实还介意）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "小浩闷在心里，见小彤还是不冷不热，两人渐渐疏远了。",
        "tip": "把误会憋着，友谊会慢慢变凉。把话说开才是办法。"
      },
      {
        "key": "C",
        "text": "“原来你没听见呀！我还以为你生我气了，吓我一跳～”",
        "score": 20,
        "ending": "repair",
        "result": "两人都笑了。小彤说“下次我一定先看你”，小浩说“那我们说好啦”。",
        "tip": "误会解开的那一刻，比没发生还亲近。沟通真神奇！"
      }
    ]
  },
  {
    "id": "excluded",
    "title": "团体排斥",
    "difficulty": 3,
    "a": {
      "name": "小萌",
      "emoji": "👧"
    },
    "b": {
      "name": "小伙伴",
      "emoji": "👦"
    },
    "scene": "几个人在玩游戏，却没让小萌加入，小萌站在旁边不知所措。",
    "bubbles": [
      {
        "who": "a",
        "text": "我也想玩，可以带我一起吗？"
      },
      {
        "who": "b",
        "text": "（有人小声）可是我们人好像够了吧…"
      }
    ],
    "moods": [
      {
        "who": "a",
        "prompt": "小萌现在是什么心情？",
        "options": [
          {
            "emoji": "😢",
            "label": "难过",
            "correct": true
          },
          {
            "emoji": "😔",
            "label": "自卑",
            "correct": true
          },
          {
            "emoji": "😠",
            "label": "愤怒",
            "correct": true
          }
        ]
      },
      {
        "who": "b",
        "prompt": "其他小伙伴呢？他们是什么心情？",
        "options": [
          {
            "emoji": "😶",
            "label": "不知怎么开口",
            "correct": true
          },
          {
            "emoji": "😠",
            "label": "恶意",
            "correct": false
          },
          {
            "emoji": "😴",
            "label": "无关",
            "correct": false
          }
        ]
      }
    ],
    "choices": [
      {
        "key": "A",
        "text": "“不玩就不玩，谁稀罕！”（其实心里很难过）",
        "score": -30,
        "ending": "cold",
        "result": "小萌假装不在乎走开，可眼眶红了。大家也有点尴尬，气氛僵了。",
        "tip": "用“谁稀罕”保护自尊，却把真心藏起来了。你的感受值得被看见。"
      },
      {
        "key": "B",
        "text": "（站在旁边看别人玩，不说话）",
        "score": 0,
        "surface": true,
        "ending": "surface",
        "result": "小萌一直旁观，大家玩着玩着也忘了邀请她，距离越来越远。",
        "tip": "默默等着被邀请，常常等不到。主动一点，局面会不一样。"
      },
      {
        "key": "C",
        "text": "“那你们先玩，等有人想加入我叫你们～或者我们换个都能玩的游戏？”",
        "score": 20,
        "ending": "repair",
        "result": "大家一想也是，干脆加了小萌，还约好下次玩“人人都能参加”的游戏。",
        "tip": "既照顾自己，也给别人台阶——你已经是小小调解员啦！"
      }
    ]
  }
];
