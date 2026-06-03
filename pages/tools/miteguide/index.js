var storage = require('../../../utils/storage.js');

var guides = {
  bedroom: {
    title: '🛏️ 卧室除螨指南',
    desc: '卧室是螨虫最密集的地方，床褥、枕头、床垫都是螨虫的温床。据统计，一张使用超过2年的床垫可能藏有数百万只螨虫。',
    methods: [
      { name: '高温清洗床品', detail: '每周用55°C以上热水清洗床单、被套、枕套，可杀死99%的螨虫。' },
      { name: '阳光暴晒', detail: '将被子、枕头放在阳光下暴晒3-5小时，翻面后再晒2小时，紫外线能有效杀螨。' },
      { name: '吸尘器深度清洁', detail: '使用带HEPA滤网的吸尘器对床垫、枕头进行深度吸尘，每周1-2次。' },
      { name: '使用防螨床品', detail: '选择防螨面料的床笠、枕套，物理阻隔螨虫进入床垫和枕头。' },
      { name: '保持通风干燥', detail: '每天开窗通风30分钟以上，保持室内湿度在50%以下，螨虫在干燥环境难以存活。' }
    ],
    frequency: [
      { icon: '🔄', text: '床单被套：每周更换清洗' },
      { icon: '☀️', text: '被子枕头：每2周暴晒一次' },
      { icon: '🧹', text: '床垫吸尘：每周1-2次' },
      { icon: '🛏️', text: '更换床垫：建议5-8年更换' }
    ]
  },
  living: {
    title: '🛋️ 客厅除螨指南',
    desc: '客厅的沙发、地毯、毛绒玩具也是螨虫的聚集地，尤其布艺沙发更容易藏匿螨虫和排泄物。',
    methods: [
      { name: '沙发定期吸尘', detail: '用吸尘器仔细清洁沙发表面和缝隙，特别注意坐垫下方和靠背缝隙。' },
      { name: '地毯深度清洁', detail: '每周用吸尘器清洁地毯，每月进行一次蒸汽清洗或干洗。' },
      { name: '毛绒玩具处理', detail: '将毛绒玩具放入密封袋，放冰箱冷冻24小时后取出拍打，可杀死螨虫。' },
      { name: '窗帘清洗', detail: '每1-2个月清洗窗帘，窗帘也是灰尘和螨虫的聚集地。' },
      { name: '减少织物覆盖', detail: '尽量选择皮质或仿皮沙发，减少螨虫栖息场所。' }
    ],
    frequency: [
      { icon: '🧹', text: '沙发吸尘：每周2次' },
      { icon: '🧶', text: '地毯清洁：每周吸尘+每月深洗' },
      { icon: '🧸', text: '毛绒玩具：每2周处理一次' },
      { icon: '🪟', text: '窗帘清洗：每1-2个月' }
    ]
  },
  bathroom: {
    title: '🚿 浴室除螨指南',
    desc: '浴室潮湿温暖的环境是螨虫和霉菌的理想家园，浴巾、毛巾、浴帘都需要特别注意清洁。',
    methods: [
      { name: '毛巾高温消毒', detail: '毛巾每周用沸水浸泡10分钟或用洗衣机高温模式清洗。' },
      { name: '保持干燥', detail: '洗澡后打开排风扇至少30分钟，降低浴室湿度。' },
      { name: '浴帘定期更换', detail: '浴帘容易发霉滋生螨虫，建议每3个月更换一次或定期清洗。' },
      { name: '地垫清洁', detail: '浴室地垫每周清洗一次，使用后尽量挂在通风处晾干。' },
      { name: '定期除霉', detail: '使用白醋或专用除霉剂清洁浴室角落和缝隙。' }
    ],
    frequency: [
      { icon: '🧴', text: '毛巾：每2-3天更换，每周消毒' },
      { icon: '🚿', text: '浴帘：每月清洗/每3月更换' },
      { icon: '🧹', text: '地垫：每周清洗' },
      { icon: '💨', text: '排风：每次洗澡后开30分钟' }
    ]
  },
  closet: {
    title: '👔 衣柜除螨指南',
    desc: '衣柜中的换季衣物如果存放不当，很容易受潮滋生螨虫，尤其是棉、羊毛等天然纤维材质。',
    methods: [
      { name: '换季衣物先清洗', detail: '存放前务必清洗干净，人体皮屑和汗渍是螨虫的食物来源。' },
      { name: '使用防潮防虫用品', detail: '在衣柜中放置樟脑丸、竹炭包或干燥剂，防潮防虫。' },
      { name: '真空压缩袋', detail: '换季衣物使用真空压缩袋密封存放，隔绝空气和螨虫。' },
      { name: '定期通风晾晒', detail: '换季取出衣物前先在阳光下晾晒2-3小时再穿着。' },
      { name: '保持衣柜整洁', detail: '定期清理衣柜内部，用湿布擦拭柜体，保持干燥。' }
    ],
    frequency: [
      { icon: '📦', text: '换季整理：每季度一次' },
      { icon: '☀️', text: '衣物晾晒：换季取出时' },
      { icon: '🧽', text: '衣柜擦拭：每月一次' },
      { icon: '🌿', text: '干燥剂更换：每2-3个月' }
    ]
  }
};

var knowledge = [
  { q: '螨虫是什么？', a: '螨虫是一种肉眼不可见的微型节肢动物，体长约0.1-0.5mm，广泛存在于家居环境中。' },
  { q: '螨虫靠什么存活？', a: '螨虫以人体脱落的皮屑为食，一个成年人每天约脱落1.5g皮屑，足够养活100万只螨虫。' },
  { q: '螨虫会带来什么危害？', a: '螨虫的排泄物和尸体碎片是强过敏原，可引发过敏性鼻炎、哮喘、湿疹、皮肤瘙痒等症状。' },
  { q: '螨虫最喜欢什么环境？', a: '螨虫最喜欢温度20-30°C、湿度60%-80%的环境，春秋季节是螨虫繁殖高峰期。' }
];

var tips = [
  { icon: '🌡️', text: '保持室内湿度低于50%，螨虫在干燥环境中难以存活' },
  { icon: '☀️', text: '多晒太阳，紫外线是天然的杀螨利器' },
  { icon: '🐱', text: '宠物也是螨虫携带者，定期给宠物驱虫' },
  { icon: '🧹', text: '使用HEPA滤网吸尘器，普通吸尘器可能吹起螨虫' },
  { icon: '🌿', text: '桉树精油、茶树精油有一定驱螨效果' },
  { icon: '🚫', text: '卧室尽量不铺地毯，减少螨虫栖息地' }
];

var symptoms = [
  { icon: '🤧', text: '早晨起床频繁打喷嚏、流鼻涕' },
  { icon: '👃', text: '反复鼻塞、鼻痒' },
  { icon: '👀', text: '眼睛发痒、流泪、红肿' },
  { icon: '😷', text: '皮肤出现红疹、瘙痒' },
  { icon: '😮‍💨', text: '夜间咳嗽加重、呼吸不畅' },
  { icon: '🤕', text: '湿疹反复发作' }
];

Page({
  data: {
    isFavorite: false,
    currentScene: 'bedroom',
    currentGuide: {},
    knowledge: [],
    tips: [],
    symptoms: []
  },

  onLoad: function () {
    this.checkFavorite();
    this.setData({
      currentGuide: guides.bedroom,
      knowledge: knowledge,
      tips: tips,
      symptoms: symptoms
    });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('miteguide') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('miteguide');
    this.setData({ isFavorite: fav });
  },

  onSceneTap: function (e) {
    var scene = e.currentTarget.dataset.scene;
    this.setData({
      currentScene: scene,
      currentGuide: guides[scene]
    });
  },

  onShareAppMessage: function () {
    return {
      title: '家居除螨指南 — 守护家人健康',
      path: '/pages/tools/miteguide/index'
    };
  }
});
