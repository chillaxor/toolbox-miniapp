var storage = require('../../../utils/storage.js');

var bodyParts = [
  { id: 'head', name: '头面部', icon: '🧠' },
  { id: 'neck', name: '颈肩部', icon: '💪' },
  { id: 'arm', name: '上肢', icon: '🤚' },
  { id: 'chest', name: '胸腹部', icon: '🫁' },
  { id: 'back', name: '腰背部', icon: '🔙' },
  { id: 'leg', name: '下肢', icon: '🦵' }
];

var acupoints = {
  head: [
    { name: '百会', code: 'GV20', location: '头顶正中线与两耳尖连线的交点', effect: '醒脑开窍、升阳举陷', mainUse: '头痛、眩晕、失眠、脱肛、高血压', method: '用指腹按压，每次3-5分钟，力度适中' },
    { name: '太阳', code: 'EX-HN5', location: '眉梢与眼角之间向后约一横指凹陷处', effect: '清热明目、止痛', mainUse: '偏头痛、眼睛疲劳、牙痛、面瘫', method: '双手拇指按揉，每次2-3分钟' },
    { name: '印堂', code: 'GV29', location: '两眉头连线的中点', effect: '清头明目、通鼻开窍', mainUse: '头痛、鼻炎、失眠、高血压', method: '用拇指按压，每次3-5分钟' },
    { name: '风池', code: 'GB20', location: '后颈部枕骨下方凹陷处', effect: '疏风清热、明目开窍', mainUse: '颈椎病、头痛、眩晕、感冒、鼻塞', method: '双手拇指按揉，每次3-5分钟' },
    { name: '睛明', code: 'BL1', location: '内眼角稍上方凹陷处', effect: '明目退翳', mainUse: '近视、眼睛疲劳、迎风流泪', method: '闭眼，用食指轻轻按压，每次1-2分钟' },
    { name: '迎香', code: 'LI20', location: '鼻翼外缘中点旁鼻唇沟中', effect: '通鼻开窍', mainUse: '鼻塞、鼻炎、嗅觉减退、面瘫', method: '食指按揉，每次2-3分钟' },
    { name: '四白', code: 'ST2', location: '瞳孔正下方，眼眶下缘凹陷处', effect: '明目祛风', mainUse: '近视、眼睛干涩、面神经麻痹', method: '食指轻轻按压，每次2分钟' },
    { name: '耳门', code: 'SJ21', location: '耳屏上切迹前方凹陷处', effect: '聪耳开窍', mainUse: '耳鸣、耳聋、牙痛', method: '食指按压，每次2-3分钟' }
  ],
  neck: [
    { name: '大椎', code: 'GV14', location: '第七颈椎棘突下凹陷处', effect: '清热解表、截疟止痛', mainUse: '感冒、发热、颈椎病、落枕', method: '低头，用指腹按压，每次3-5分钟' },
    { name: '肩井', code: 'GB21', location: '肩上，大椎与肩峰连线的中点', effect: '祛风散寒、活血通络', mainUse: '肩背疼痛、颈椎病、乳腺炎', method: '用拇指或肘部按压，每次3分钟' },
    { name: '天柱', code: 'BL10', location: '后发际正中旁开约两指宽', effect: '清头明目、强筋骨', mainUse: '颈椎病、头痛、鼻塞、视力模糊', method: '双手拇指按揉，每次3分钟' },
    { name: '扶突', code: 'LI18', location: '喉结旁开约三指宽', effect: '理气化痰、清利咽喉', mainUse: '咽喉肿痛、声音嘶哑、甲状腺问题', method: '食指轻按，每次2分钟，注意力度轻柔' }
  ],
  arm: [
    { name: '合谷', code: 'LI4', location: '虎口处，第一二掌骨之间', effect: '镇静止痛、通经活络', mainUse: '头痛、牙痛、感冒、便秘、经痛', method: '拇指按揉，每次3-5分钟，有酸胀感为佳' },
    { name: '内关', code: 'PC6', location: '腕横纹向上约三指宽，两筋之间', effect: '宁心安神、理气止痛', mainUse: '心悸、失眠、恶心呕吐、晕车', method: '拇指按压，每次3-5分钟' },
    { name: '外关', code: 'SJ5', location: '腕背横纹向上约三指宽，两骨之间', effect: '清热解表、通经活络', mainUse: '感冒发热、头痛、耳鸣、上肢麻木', method: '拇指按揉，每次3分钟' },
    { name: '曲池', code: 'LI11', location: '肘横纹外侧端，屈肘时凹陷处', effect: '清热和营、降逆活络', mainUse: '高血压、皮肤病、发热、肘臂疼痛', method: '拇指按揉，每次3-5分钟' },
    { name: '列缺', code: 'LU7', location: '腕横纹上约两指宽，桡骨茎突上方', effect: '宣肺解表、通经活络', mainUse: '咳嗽、气喘、头痛、颈椎病', method: '拇指按压，每次3分钟' },
    { name: '劳宫', code: 'PC8', location: '握拳时中指指尖所对的掌心处', effect: '清心安神、消肿止痒', mainUse: '中暑、口臭、心悸、失眠', method: '拇指按压，每次3-5分钟' },
    { name: '少商', code: 'LU11', location: '拇指指甲旁约0.1寸', effect: '清热利咽、开窍醒神', mainUse: '咽喉肿痛、中风昏迷、发热', method: '用另一手拇指指甲掐按，每次1分钟' }
  ],
  chest: [
    { name: '膻中', code: 'CV17', location: '两乳头连线中点', effect: '宽胸理气、活血通络', mainUse: '胸闷、气喘、咳嗽、产后缺乳', method: '用指腹按揉，每次3-5分钟' },
    { name: '中脘', code: 'CV12', location: '肚脐上方约五指宽', effect: '健脾和胃、降逆利水', mainUse: '胃痛、腹胀、消化不良、呕吐', method: '手掌顺时针按揉，每次5分钟' },
    { name: '气海', code: 'CV6', location: '肚脐下方约两指宽', effect: '益气助阳、调经固经', mainUse: '体虚乏力、月经不调、腹泻、遗尿', method: '手掌按揉，每次5分钟' },
    { name: '关元', code: 'CV4', location: '肚脐下方约四指宽', effect: '培元固本、补益下焦', mainUse: '体虚、月经不调、遗精、尿频', method: '手掌按揉或热敷，每次5-10分钟' },
    { name: '天枢', code: 'ST25', location: '肚脐旁开约三指宽', effect: '调理肠胃、理气行滞', mainUse: '便秘、腹泻、腹痛、月经不调', method: '双手按揉，每次3-5分钟' }
  ],
  back: [
    { name: '命门', code: 'GV4', location: '第二腰椎棘突下凹陷处（与肚脐相对）', effect: '补肾壮阳、培元固本', mainUse: '腰痛、肾虚、月经不调、遗尿', method: '双手搓热后按压，每次5分钟' },
    { name: '肾俞', code: 'BL23', location: '命门旁开约两指宽', effect: '益肾助阳、强腰利水', mainUse: '腰痛、耳鸣、遗精、月经不调', method: '双手按揉，每次3-5分钟' },
    { name: '腰阳关', code: 'GV3', location: '第四腰椎棘突下凹陷处', effect: '强腰膝、利下焦', mainUse: '腰痛、坐骨神经痛、下肢麻木', method: '指压或热敷，每次5分钟' },
    { name: '委中', code: 'BL40', location: '膝关节后方腘窝正中', effect: '舒筋通络、散瘀活血', mainUse: '腰背疼痛、膝关节痛、坐骨神经痛', method: '拇指按压，每次3-5分钟' },
    { name: '秩边', code: 'BL54', location: '骶骨旁开约四指宽', effect: '通经活络、强壮腰膝', mainUse: '坐骨神经痛、腰痛、下肢瘫痪', method: '拇指或肘部按压，每次3分钟' }
  ],
  leg: [
    { name: '足三里', code: 'ST36', location: '膝盖下方约四指宽，胫骨外侧', effect: '健脾和胃、扶正培元', mainUse: '胃痛、消化不良、体虚、膝痛', method: '拇指按揉，每次5分钟，有酸胀感为佳' },
    { name: '三阴交', code: 'SP6', location: '内踝尖上方约四指宽，胫骨后缘', effect: '健脾益血、调肝补肾', mainUse: '月经不调、失眠、消化不良、水肿', method: '拇指按揉，每次3-5分钟，孕妇禁用' },
    { name: '涌泉', code: 'KI1', location: '脚底前1/3凹陷处（足趾屈曲时）', effect: '滋肾降火、醒脑安神', mainUse: '失眠、头晕、中暑、足底痛', method: '睡前按揉，每脚5分钟' },
    { name: '太冲', code: 'LR3', location: '足背第一二跖骨结合部前方凹陷处', effect: '平肝息风、疏肝养血', mainUse: '头痛、眩晕、失眠、高血压、月经不调', method: '拇指按揉，每次3-5分钟' },
    { name: '阳陵泉', code: 'GB34', location: '小腿外侧，腓骨小头前下方凹陷处', effect: '疏肝利胆、舒筋活络', mainUse: '膝关节痛、下肢麻木、胆囊炎', method: '拇指按揉，每次3分钟' },
    { name: '血海', code: 'SP10', location: '膝盖内上方约三指宽，股四头肌内侧', effect: '活血化瘀、补血养血', mainUse: '月经不调、荨麻疹、膝痛', method: '拇指按揉，每次3-5分钟' },
    { name: '昆仑', code: 'BL60', location: '外踝尖与跟腱之间凹陷处', effect: '安神清热、舒筋活络', mainUse: '头痛、腰痛、脚踝疼痛、难产', method: '拇指按压，每次3分钟' }
  ]
};

Page({
  data: {
    isFavorite: false,
    bodyParts: [],
    currentPart: 'head',
    currentAcupoints: [],
    selectedPoint: null,
    keyword: '',
    searchResults: []
  },

  onLoad: function () {
    this.checkFavorite();
    this.setData({
      bodyParts: bodyParts,
      currentAcupoints: acupoints.head
    });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('acupoint') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('acupoint');
    this.setData({ isFavorite: fav });
  },

  onPartTap: function (e) {
    var partId = e.currentTarget.dataset.id;
    this.setData({
      currentPart: partId,
      currentAcupoints: acupoints[partId] || [],
      selectedPoint: null,
      keyword: '',
      searchResults: []
    });
  },

  onPointTap: function (e) {
    var name = e.currentTarget.dataset.name;
    var points = this.data.currentAcupoints;
    var selected = null;
    for (var i = 0; i < points.length; i++) {
      if (points[i].name === name) {
        selected = points[i];
        break;
      }
    }
    if (this.data.selectedPoint && this.data.selectedPoint.name === name) {
      this.setData({ selectedPoint: null });
    } else {
      this.setData({ selectedPoint: selected });
    }
  },

  onSearchInput: function (e) {
    var keyword = e.detail.value.trim();
    if (!keyword) {
      this.setData({ keyword: '', searchResults: [] });
      return;
    }
    var results = [];
    var keys = Object.keys(acupoints);
    for (var i = 0; i < keys.length; i++) {
      var points = acupoints[keys[i]];
      for (var j = 0; j < points.length; j++) {
        var p = points[j];
        if (p.name.indexOf(keyword) !== -1 || p.code.indexOf(keyword) !== -1 ||
            p.effect.indexOf(keyword) !== -1 || p.mainUse.indexOf(keyword) !== -1) {
          results.push(p);
        }
      }
    }
    this.setData({ keyword: keyword, searchResults: results });
  },

  onShareAppMessage: function () {
    return {
      title: '穴位图谱 — 常用穴位位置和功效查询',
      path: '/pages/tools/acupoint/index'
    };
  }
});
