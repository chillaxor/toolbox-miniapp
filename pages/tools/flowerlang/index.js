var storage = require('../../../utils/storage.js');

var flowers = [
  { name: '玫瑰', emoji: '🌹', color: '红色', meaning: '爱情、热恋、我爱你', send: '恋人、爱人', note: '不同颜色寓意不同：红玫瑰代表热恋，粉玫瑰代表初恋，白玫瑰代表纯洁。' },
  { name: '百合', emoji: '🌷', color: '白色', meaning: '纯洁、高雅、百年好合', send: '新婚夫妇、长辈', note: '婚礼常用花，寓意百年好合。白色百合象征纯洁，黄色百合象征财富。' },
  { name: '向日葵', emoji: '🌻', color: '黄色', meaning: '阳光、积极、沉默的爱', send: '朋友、老师', note: '向日葵永远朝向太阳，象征积极向上和忠诚。送给朋友表达祝福。' },
  { name: '康乃馨', emoji: '🌸', color: '粉红色', meaning: '母爱、感恩、温馨', send: '母亲、长辈', note: '母亲节首选花卉，粉红色康乃馨代表对母亲的爱和感激。' },
  { name: '郁金香', emoji: '🌷', color: '紫色', meaning: '高贵、神秘、永恒的爱', send: '恋人、知己', note: '不同颜色含义不同：红色代表爱的告白，紫色代表高贵神秘。' },
  { name: '满天星', emoji: '✨', color: '白色', meaning: '思念、纯洁、配角的爱', send: '暗恋对象、朋友', note: '常作为配花使用，寓意"甘愿做你的配角"。' },
  { name: '勿忘我', emoji: '💙', color: '蓝色', meaning: '永恒的爱、不要忘记我', send: '恋人、远行的朋友', note: '花名即是寓意，适合送给即将分别的人。' },
  { name: '薰衣草', emoji: '💜', color: '紫色', meaning: '等待爱情、浪漫', send: '恋人', note: '薰衣草的花语是等待爱情，象征忠诚和浪漫。' },
  { name: '栀子花', emoji: '🤍', color: '白色', meaning: '永恒的爱、一生的守候', send: '恋人、闺蜜', note: '栀子花花语是"永恒的爱，一生的守候"，花香浓郁。' },
  { name: '牡丹', emoji: '🌺', color: '红色', meaning: '富贵、圆满、雍容华贵', send: '长辈、开业祝贺', note: '百花之王，象征富贵吉祥，国花之选。' },
  { name: '菊花', emoji: '🏵️', color: '黄色', meaning: '高洁、长寿、吉祥', send: '长辈、祝寿', note: '在中国文化中象征长寿吉祥（注意：白菊常用于祭奠）。' },
  { name: '茉莉花', emoji: '🤍', color: '白色', meaning: '纯洁、质朴、你是我的', send: '爱人、朋友', note: '茉莉花象征纯洁质朴，也是许多国家的爱情之花。' },
  { name: '桃花', emoji: '🌸', color: '粉色', meaning: '爱情的俘虏、桃花运', send: '恋人', note: '桃花象征爱情运，"桃花运"一词即来源于此。' },
  { name: '绣球花', emoji: '🔵', color: '蓝色', meaning: '团聚、希望、忠贞', send: '家人、恋人', note: '绣球花形似球状，象征团圆和美满。' },
  { name: '雏菊', emoji: '🌼', color: '白色', meaning: '天真、纯洁、暗恋', send: '暗恋对象', note: '雏菊的花语是"隐藏在心中的爱"，适合暗恋时送出。' },
  { name: '风信子', emoji: '💐', color: '紫色', meaning: '悲伤中的爱、重生', send: '朋友、恋人', note: '紫色风信子表示悲伤中的爱，蓝色表示恒心。' },
  { name: '紫罗兰', emoji: '💜', color: '紫色', meaning: '永恒的美、质朴', send: '恋人、朋友', note: '紫罗兰象征永恒的美和质朴的美德。' },
  { name: '水仙花', emoji: '💛', color: '白色', meaning: '自恋、思念、吉祥', send: '自己、朋友', note: '在中国文化中象征吉祥如意，春节期间常见。' },
  { name: '梅花', emoji: '🩷', color: '红色', meaning: '坚强、高洁、不屈不挠', send: '长辈、敬仰之人', note: '梅花在寒冬开放，象征坚韧不拔的精神。' },
  { name: '兰花', emoji: '🌿', color: '淡紫色', meaning: '高洁、贤德、君子', send: '长辈、文人', note: '花中四君子之一，象征高洁品格。' },
  { name: '荷花', emoji: '🪷', color: '粉色', meaning: '纯洁、清正、出淤泥而不染', send: '长辈、朋友', note: '象征高洁品格，佛教圣花。' },
  { name: '桂花', emoji: '🌼', color: '金黄色', meaning: '崇高、吉祥、收获', send: '长辈、朋友', note: '桂花象征崇高和吉祥，"折桂"代表金榜题名。' },
  { name: '芙蓉花', emoji: '🌺', color: '粉色', meaning: '纤细之美、纯洁', send: '女性、朋友', note: '芙蓉花娇艳美丽，象征纤细之美。' },
  { name: '木棉花', emoji: '🔴', color: '红色', meaning: '珍惜眼前的幸福', send: '恋人、朋友', note: '木棉花花语是珍惜身边的人和眼前的幸福。' },
  { name: '丁香花', emoji: '💜', color: '紫色', meaning: '忧愁、思念、初恋', send: '初恋对象', note: '丁香花象征初恋的感觉和淡淡的忧愁。' },
  { name: '樱花', emoji: '🌸', color: '粉色', meaning: '纯洁、高尚、热烈', send: '恋人、朋友', note: '樱花象征热烈而短暂的爱情，日本国花。' },
  { name: '茶花', emoji: '🌺', color: '红色', meaning: '可爱、谦让、谨慎', send: '恋人、朋友', note: '茶花花姿端庄，象征谦逊和美德。' },
  { name: '玉兰花', emoji: '🤍', color: '白色', meaning: '高洁、纯洁、真挚', send: '长辈、朋友', note: '玉兰花先花后叶，象征高洁和报恩。' },
  { name: '紫藤花', emoji: '💜', color: '紫色', meaning: '沉迷的爱、执着', send: '恋人', note: '紫藤花缠绕生长，象征执着而深沉的爱。' },
  { name: '蝴蝶兰', emoji: '🦋', color: '白色', meaning: '幸福、纯洁、高洁', send: '新婚夫妇、长辈', note: '蝴蝶兰形似蝴蝶，象征幸福和吉祥。' },
  { name: '蒲公英', emoji: '🌼', color: '黄色', meaning: '自由、无法停留的爱', send: '朋友', note: '蒲公英随风飘散，象征自由和无法停留的爱。' },
  { name: '彼岸花', emoji: '🔴', color: '红色', meaning: '分离、死亡之美、思念', send: '不宜送人', note: '彼岸花开彼岸，象征分离和思念，常用于祭祀。' },
  { name: '睡莲', emoji: '🪷', color: '白色', meaning: '纯洁、纯真、不懈怠', send: '朋友、恋人', note: '睡莲象征纯洁的心灵和不懈的努力。' },
  { name: '三色堇', emoji: '💜', color: '紫色', meaning: '思念、沉思、请想念我', send: '恋人、朋友', note: '三色堇花语是"请想念我"，适合表达思念。' },
  { name: '铃兰', emoji: '🔔', color: '白色', meaning: '幸福归来、纯洁', send: '恋人、新婚', note: '铃兰象征幸福归来，法国人视为报春花。' },
  { name: '石榴花', emoji: '🔴', color: '红色', meaning: '成熟美丽、子孙满堂', send: '新婚夫妇、长辈', note: '石榴多籽，象征多子多福和家庭兴旺。' },
  { name: '海棠花', emoji: '🌸', color: '粉色', meaning: '温和、美丽、快乐', send: '恋人、朋友', note: '海棠花姿潇洒，自古以来是雅俗共赏的名花。' },
  { name: '杏花', emoji: '🤍', color: '白色', meaning: '少女的慕情、娇羞', send: '恋人', note: '杏花象征少女的纯洁和娇羞。' },
  { name: '梨花', emoji: '🤍', color: '白色', meaning: '纯情、永远的爱、离别', send: '恋人、朋友', note: '梨花洁白如雪，象征纯真和离别之情。' },
  { name: '曼陀罗', emoji: '💜', color: '紫色', meaning: '不可预知的爱、死亡', send: '不宜送人', note: '曼陀罗有毒，象征不可预知的黑暗和死亡。' },
  { name: '仙人掌花', emoji: '🌵', color: '黄色', meaning: '坚强、等待、奇迹', send: '朋友', note: '仙人掌在沙漠中开花，象征奇迹和坚韧。' },
  { name: '马蹄莲', emoji: '🤍', color: '白色', meaning: '纯洁、幸福、永结同心', send: '新婚夫妇', note: '马蹄莲象征永结同心，婚礼常用花材。' },
  { name: '石斛兰', emoji: '💜', color: '紫色', meaning: '慈爱、勇敢、祝福', send: '父亲、长辈', note: '石斛兰是父亲节之花，象征父亲的刚毅和勇敢。' },
  { name: '夹竹桃', emoji: '🌺', color: '粉色', meaning: '深刻的友情、危险', send: '朋友（注意有毒）', note: '夹竹桃有毒，但象征深刻的友谊。' },
  { name: '含笑花', emoji: '😊', color: '白色', meaning: '含蓄、矜持、美丽', send: '女性、朋友', note: '含笑花开而不放，象征含蓄和矜持之美。' },
  { name: '凤仙花', emoji: '🌺', color: '红色', meaning: '别碰我、怀恋', send: '朋友', note: '凤仙花种子一触即弹，花语是"别碰我"。' },
  { name: '迎春花', emoji: '💛', color: '黄色', meaning: '相爱到永远、青春', send: '恋人、朋友', note: '迎春花率先开放，象征春天的到来和希望。' },
  { name: '合欢花', emoji: '🌸', color: '粉色', meaning: '夫妻好合、永远恩爱', send: '夫妻、恋人', note: '合欢花象征夫妻和睦，恩爱永远。' },
  { name: '扶郎花', emoji: '🌺', color: '红色', meaning: '有毅力、不畏艰难', send: '朋友、同事', note: '扶郎花又名非洲菊，象征热情和毅力。' },
  { name: '金盏花', emoji: '💛', color: '金黄色', meaning: '悲伤、离别、救济', send: '朋友', note: '金盏花象征悲伤中的离别和救济。' },
  { name: '紫薇花', emoji: '💜', color: '紫色', meaning: '好运、沉迷的爱', send: '恋人、朋友', note: '紫薇花期极长，象征好运和持久的爱。' },
  { name: '绣线菊', emoji: '🤍', color: '白色', meaning: '努力、祈愿', send: '朋友', note: '绣线菊象征努力和美好的祈愿。' },
  { name: '昙花', emoji: '🤍', color: '白色', meaning: '刹那间的美丽、一瞬间的永恒', send: '恋人', note: '昙花一现，象征短暂而珍贵的美好。' },
  { name: '木槿花', emoji: '🌺', color: '粉色', meaning: '坚韧、永恒的美丽', send: '朋友、恋人', note: '木槿花朝开暮落，但花期不断，象征坚韧。' },
  { name: '蔷薇', emoji: '🌹', color: '红色', meaning: '热恋、思念', send: '恋人', note: '蔷薇花语是热恋和思念，与玫瑰同属蔷薇科。' }
];

var scenes = [
  { name: '表白', icon: '💕', flowers: ['玫瑰', '郁金香', '雏菊', '勿忘我'] },
  { name: '母亲节', icon: '👩', flowers: ['康乃馨', '百合', '向日葵'] },
  { name: '生日', icon: '🎂', flowers: ['玫瑰', '百合', '向日葵', '绣球花'] },
  { name: '毕业', icon: '🎓', flowers: ['向日葵', '满天星', '勿忘我'] },
  { name: '探病', icon: '🏥', flowers: ['百合', '康乃馨', '兰花'] },
  { name: '乔迁', icon: '🏠', flowers: ['牡丹', '百合', '向日葵'] }
];

Page({
  data: {
    isFavorite: false,
    keyword: '',
    searchResults: [],
    scenes: [],
    currentScene: '',
    sceneFlowers: [],
    allFlowers: [],
    showAll: false
  },

  onLoad: function () {
    this.checkFavorite();
    this.setData({
      scenes: scenes,
      allFlowers: flowers,
      searchResults: flowers
    });
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('flowerlang') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('flowerlang');
    this.setData({ isFavorite: fav });
  },

  onSearchInput: function (e) {
    var keyword = e.detail.value.trim();
    var results = [];
    if (!keyword) {
      results = flowers;
    } else {
      for (var i = 0; i < flowers.length; i++) {
        if (flowers[i].name.indexOf(keyword) !== -1 || flowers[i].meaning.indexOf(keyword) !== -1) {
          results.push(flowers[i]);
        }
      }
    }
    this.setData({ keyword: keyword, searchResults: results });
  },

  onSceneTap: function (e) {
    var sceneName = e.currentTarget.dataset.name;
    var scene = null;
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].name === sceneName) { scene = scenes[i]; break; }
    }
    if (!scene) return;
    var sceneFlowers = [];
    for (var j = 0; j < flowers.length; j++) {
      if (scene.flowers.indexOf(flowers[j].name) !== -1) {
        sceneFlowers.push(flowers[j]);
      }
    }
    this.setData({
      currentScene: sceneName,
      sceneFlowers: sceneFlowers
    });
  },

  onShowAll: function () {
    this.setData({ showAll: true, currentScene: '' });
  },

  onShareAppMessage: function () {
    return {
      title: '花语查询 — 送花不再送错',
      path: '/pages/tools/flowerlang/index'
    };
  }
});
