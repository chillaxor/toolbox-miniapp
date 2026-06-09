var storage = require('../../../utils/storage.js');

// MBTI 28道测试题，每题两个选项对应两个维度
var QUESTIONS = [
  // E vs I (外向 vs 内向)
  { q: '周末到了，你更想？', a: '和朋友出去浪', b: '宅在家看书追剧', dim: 'EI' },
  { q: '聚会时你通常？', a: '主动和很多人聊天', b: '只和熟悉的人聊天', dim: 'EI' },
  { q: '充电方式是？', a: '和朋友聚餐聊天', b: '一个人待着发呆', dim: 'EI' },
  { q: '认识新朋友你会？', a: '主动打招呼聊天', b: '等别人来找我', dim: 'EI' },
  { q: '团队项目你更喜欢？', a: '面对面讨论合作', b: '各自独立完成再汇总', dim: 'EI' },
  { q: '旅行时你更享受？', a: '和一群人热热闹闹', b: '独自或和一两个好友', dim: 'EI' },
  { q: '别人说你是个？', a: '自来熟', b: '慢热型', dim: 'EI' },
  // S vs N (实感 vs 直觉)
  { q: '你更关注？', a: '眼前的具体事实', b: '未来的各种可能', dim: 'SN' },
  { q: '描述一件事时你倾向于？', a: '讲细节和过程', b: '讲感受和意义', dim: 'SN' },
  { q: '你更相信？', a: '亲身经历和数据', b: '第六感和直觉', dim: 'SN' },
  { q: '学习新东西你更喜欢？', a: '按步骤跟着做', b: '先了解整体框架', dim: 'SN' },
  { q: '你觉得自己是？', a: '务实派', b: '理想派', dim: 'SN' },
  { q: '做计划时你更看重？', a: '具体可执行的步骤', b: '方向和灵感', dim: 'SN' },
  { q: '你觉得哪个词更适合你？', a: '脚踏实地', b: '天马行空', dim: 'SN' },
  // T vs F (思考 vs 情感)
  { q: '朋友向你倾诉时你倾向于？', a: '帮TA分析问题', b: '先安慰TA的情绪', dim: 'TF' },
  { q: '做决定时你更看重？', a: '逻辑和公平', b: '感受和和谐', dim: 'TF' },
  { q: '看到不公平的事你会？', a: '据理力争指出问题', b: '考虑各方感受再表态', dim: 'TF' },
  { q: '别人说你更像？', a: '理性冷静', b: '感性温暖', dim: 'TF' },
  { q: '评价一个方案你更看重？', a: '逻辑是否通顺', b: '是否照顾到每个人', dim: 'TF' },
  { q: '争论中你更坚持？', a: '事实和道理', b: '不伤害关系', dim: 'TF' },
  { q: '你认为好的领导应该？', a: '公正果断', b: '体恤下属', dim: 'TF' },
  // J vs P (判断 vs 感知)
  { q: '你的桌面/房间通常是？', a: '整洁有序', b: '有生活气息（乱）', dim: 'JP' },
  { q: '出门旅行你会？', a: '提前做好详细攻略', b: '走到哪算哪', dim: 'JP' },
  { q: 'DDL临近你会？', a: '早就准备好了', b: 'DDL是第一生产力', dim: 'JP' },
  { q: '你更喜欢的生活是？', a: '有计划有节奏', b: '随性自由', dim: 'JP' },
  { q: '买东西时你通常？', a: '列好清单照着买', b: '逛到什么买什么', dim: 'JP' },
  { q: '周末安排你更倾向于？', a: '提前规划好', b: '看心情再说', dim: 'JP' },
  { q: '你更讨厌？', a: '计划被打乱', b: '被条条框框束缚', dim: 'JP' }
];

// MBTI 16种人格描述
var TYPES = {
  'INTJ': { name: '建筑师', emoji: '🏗️', desc: '富有想象力和战略性的思想家，一切皆在计划中。独立、有远见、追求效率，是天生的策略家。', traits: ['独立思考', '战略规划', '追求完美'] },
  'INTP': { name: '逻辑学家', emoji: '🔬', desc: '具有创造力的发明家，对知识有永不满足的渴望。安静内敛，思维灵活，善于分析复杂问题。', traits: ['逻辑分析', '创新思维', '求知欲强'] },
  'ENTJ': { name: '指挥官', emoji: '👑', desc: '大胆富有想象力且意志强大的领导者。天生的指挥官，善于组织和推动团队达成目标。', traits: ['领导力', '决策果断', '目标导向'] },
  'ENTP': { name: '辩论家', emoji: '⚡', desc: '聪明好奇的思想家，不会放过任何智力挑战。思维敏捷，善于发现问题的新角度。', traits: ['机智敏捷', '创新突破', '善于辩论'] },
  'INFJ': { name: '提倡者', emoji: '🌟', desc: '安静而神秘，同时鼓舞人心的理想主义者。有强烈的使命感，致力于帮助他人。', traits: ['有远见', '理想主义', '富有同理心'] },
  'INFP': { name: '调停者', emoji: '🦋', desc: '诗意善良的利他主义者，总是热心为正义事业提供帮助。内心世界丰富，追求意义。', traits: ['创意丰富', '忠于理想', '温柔善良'] },
  'ENFJ': { name: '主人公', emoji: '🦸', desc: '富有魅力且鼓舞人心的领导者，能够迷住TA的听众。天生的导师，善于激发他人潜力。', traits: ['魅力十足', '善于激励', '有感染力'] },
  'ENFP': { name: '竞选者', emoji: '🎉', desc: '热情有创造力的社交达人，总能找到微笑的理由。充满活力，善于发现生活中的美好。', traits: ['热情洋溢', '创意无限', '社交达人'] },
  'ISTJ': { name: '物流师', emoji: '📋', desc: '实际且注重事实的个人，其可靠性不容怀疑。做事认真负责，注重细节和秩序。', traits: ['可靠稳重', '注重细节', '责任心强'] },
  'ISFJ': { name: '守卫者', emoji: '🛡️', desc: '非常专注且温暖的守护者，时刻准备着保护所爱的人。低调奉献，默默付出。', traits: ['温暖体贴', '默默奉献', '忠诚可靠'] },
  'ESTJ': { name: '总经理', emoji: '📊', desc: '出色的管理者，在管理事物或人的方面无与伦比。组织能力强，注重规则和效率。', traits: ['组织能力强', '执行力高', '注重秩序'] },
  'ESFJ': { name: '执政官', emoji: '🤝', desc: '非常关心他人的人，社交能力极强且受人欢迎。热心助人，是朋友圈的粘合剂。', traits: ['热心助人', '善于社交', '重视和谐'] },
  'ISTP': { name: '鉴赏家', emoji: '🔧', desc: '大胆而实际的实验家，擅长使用各种形式的工具。动手能力强，喜欢探索事物运作原理。', traits: ['动手能力强', '冷静理性', '灵活应变'] },
  'ISFP': { name: '探险家', emoji: '🎨', desc: '灵活有魅力的艺术家，时刻准备着探索和体验新事物。感性浪漫，享受当下的美好。', traits: ['艺术气质', '随性自由', '享受当下'] },
  'ESTP': { name: '企业家', emoji: '🚀', desc: '聪明精力充沛且非常善于感知的人，真正享受活在边缘的感觉。行动派，喜欢冒险。', traits: ['行动力强', '善于交际', '勇于冒险'] },
  'ESFP': { name: '表演者', emoji: '🎭', desc: '自发的精力充沛的表演者，TA在哪里TA就不会无聊。天生的开心果，感染力十足。', traits: ['活力四射', '感染力强', '乐观开朗'] }
};

Page({
  data: {
    state: 'intro', // intro, testing, result
    currentQ: 0,
    totalQ: QUESTIONS.length,
    question: '',
    optionA: '',
    optionB: '',
    progress: 0,
    answers: { EI: 0, SN: 0, TF: 0, JP: 0 }, // 每个维度的选择A的次数
    resultType: '',
    resultEmoji: '',
    resultName: '',
    resultDesc: '',
    resultTraits: [],
    dimensions: [],
    historyList: []
  },

  onLoad: function () {
    var history = wx.getStorageSync('mbti_history') || [];
    this.setData({ historyList: history });
  },

  startTest: function () {
    // 随机打乱题目顺序
    var qs = QUESTIONS.slice();
    for (var i = qs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = qs[i]; qs[i] = qs[j]; qs[j] = tmp;
    }
    this._questions = qs;
    this.setData({
      state: 'testing',
      currentQ: 0,
      answers: { EI: 0, SN: 0, TF: 0, JP: 0 }
    });
    this._showQuestion(0);
  },

  _showQuestion: function (idx) {
    var q = this._questions[idx];
    this.setData({
      currentQ: idx,
      question: q.q,
      optionA: q.a,
      optionB: q.b,
      progress: Math.round((idx / QUESTIONS.length) * 100)
    });
  },

  chooseOption: function (e) {
    var choice = e.currentTarget.dataset.choice; // 'A' or 'B'
    var idx = this.data.currentQ;
    var q = this._questions[idx];
    var dim = q.dim;
    var answers = this.data.answers;

    // A = 第一个维度, B = 第二个维度
    if (choice === 'A') {
      answers[dim]++;
    }

    this.setData({ answers: answers });

    var nextIdx = idx + 1;
    if (nextIdx >= QUESTIONS.length) {
      this._calculateResult();
    } else {
      this._showQuestion(nextIdx);
    }
  },

  _calculateResult: function () {
    var a = this.data.answers;
    var half = QUESTIONS.length / 4; // 每个维度7题
    var type = '';
    type += a.EI >= half / 2 ? 'E' : 'I';
    type += a.SN >= half / 2 ? 'S' : 'N';
    type += a.TF >= half / 2 ? 'T' : 'F';
    type += a.JP >= half / 2 ? 'J' : 'P';

    var info = TYPES[type];
    var dimensions = [
      { label: '外向E ↔ 内向I', left: 'E', right: 'I', leftPct: Math.round(a.EI / 7 * 100), rightPct: Math.round((7 - a.EI) / 7 * 100), result: a.EI >= 3.5 ? 'E' : 'I' },
      { label: '实感S ↔ 直觉N', left: 'S', right: 'N', leftPct: Math.round(a.SN / 7 * 100), rightPct: Math.round((7 - a.SN) / 7 * 100), result: a.SN >= 3.5 ? 'S' : 'N' },
      { label: '思考T ↔ 情感F', left: 'T', right: 'F', leftPct: Math.round(a.TF / 7 * 100), rightPct: Math.round((7 - a.TF) / 7 * 100), result: a.TF >= 3.5 ? 'T' : 'F' },
      { label: '判断J ↔ 感知P', left: 'J', right: 'P', leftPct: Math.round(a.JP / 7 * 100), rightPct: Math.round((7 - a.JP) / 7 * 100), result: a.JP >= 3.5 ? 'J' : 'P' }
    ];

    this.setData({
      state: 'result',
      progress: 100,
      resultType: type,
      resultEmoji: info.emoji,
      resultName: info.name,
      resultDesc: info.desc,
      resultTraits: info.traits,
      dimensions: dimensions
    });

    // 保存历史
    var record = {
      type: type,
      name: info.name,
      emoji: info.emoji,
      timestamp: Date.now()
    };
    var history = wx.getStorageSync('mbti_history') || [];
    // 去重：只保留最近10条
    history.unshift(record);
    if (history.length > 10) history = history.slice(0, 10);
    wx.setStorageSync('mbti_history', history);
    this.setData({ historyList: history });

    storage.addHistory({
      toolId: 'mbtitest',
      toolName: 'MBTI人格测试',
      category: 'fun',
      summary: '我是' + type + ' ' + info.emoji + ' ' + info.name,
      timestamp: Date.now()
    });
  },

  restartTest: function () {
    this.setData({ state: 'intro' });
  },

  onShareAppMessage: function () {
    var type = this.data.resultType;
    var name = this.data.resultName;
    var emoji = this.data.resultEmoji;
    if (this.data.state === 'result') {
      return {
        title: '我是' + type + ' ' + emoji + name + '！你是什么人格？来测测看~',
        path: '/pages/tools/mbtitest/index'
      };
    }
    return {
      title: 'MBTI人格测试 - 发现真实的自己',
      path: '/pages/tools/mbtitest/index'
    };
  }
});
