/**
 * 中国历史朝代数据
 */
var DYNASTIES = [
  {
    name: '夏朝',
    period: '约前2070-前1600',
    duration: '约470年',
    founder: '禹',
    capital: '阳城（今河南登封）',
    events: ['大禹治水', '家天下开始', '夏桀暴政'],
    figures: ['禹', '启', '太康', '少康', '桀'],
    culture: ['夏历', '青铜器萌芽', '原始文字']
  },
  {
    name: '商朝',
    period: '约前1600-前1046',
    duration: '约554年',
    founder: '汤',
    capital: '殷（今河南安阳）',
    events: ['商汤灭夏', '盘庚迁殷', '武丁中兴', '牧野之战'],
    figures: ['汤', '盘庚', '武丁', '纣王', '妲己'],
    culture: ['甲骨文', '青铜器鼎盛', '司母戊鼎']
  },
  {
    name: '西周',
    period: '约前1046-前771',
    duration: '约275年',
    founder: '周武王',
    capital: '镐京（今陕西西安）',
    events: ['武王伐纣', '分封制', '国人暴动', '烽火戏诸侯'],
    figures: ['周武王', '姜子牙', '周公旦', '周幽王'],
    culture: ['礼乐制度', '井田制', '《诗经》起源']
  },
  {
    name: '东周（春秋）',
    period: '前770-前476',
    duration: '约294年',
    founder: '周平王',
    capital: '洛邑（今河南洛阳）',
    events: ['春秋五霸', '城濮之战', '孔子周游列国'],
    figures: ['齐桓公', '晋文公', '楚庄王', '孔子', '老子'],
    culture: ['百家争鸣开端', '铁器使用', '儒道兴起']
  },
  {
    name: '东周（战国）',
    period: '前475-前221',
    duration: '约254年',
    founder: '—',
    capital: '洛邑',
    events: ['战国七雄', '商鞅变法', '长平之战', '合纵连横'],
    figures: ['商鞅', '苏秦', '张仪', '白起', '廉颇'],
    culture: ['百家争鸣鼎盛', '《孙子兵法》', '都江堰']
  },
  {
    name: '秦朝',
    period: '前221-前207',
    duration: '15年',
    founder: '秦始皇嬴政',
    capital: '咸阳（今陕西咸阳）',
    events: ['统一六国', '统一文字度量衡', '修筑长城', '焚书坑儒', '陈胜吴广起义'],
    figures: ['秦始皇', '李斯', '蒙恬', '赵高', '陈胜'],
    culture: ['小篆', '兵马俑', '灵渠', '郡县制']
  },
  {
    name: '西汉',
    period: '前202-公元8',
    duration: '210年',
    founder: '刘邦',
    capital: '长安（今陕西西安）',
    events: ['楚汉争霸', '文景之治', '汉武帝开拓西域', '王莽篡汉'],
    figures: ['刘邦', '项羽', '汉武帝', '张骞', '司马迁'],
    culture: ['丝绸之路', '造纸术', '《史记》', '罢黜百家独尊儒术']
  },
  {
    name: '新朝',
    period: '公元8-23',
    duration: '15年',
    founder: '王莽',
    capital: '长安',
    events: ['王莽改制', '绿林赤眉起义'],
    figures: ['王莽', '刘秀'],
    culture: ['货币改革']
  },
  {
    name: '东汉',
    period: '25-220',
    duration: '195年',
    founder: '刘秀',
    capital: '洛阳',
    events: ['光武中兴', '班超通西域', '黄巾起义', '董卓之乱'],
    figures: ['刘秀', '班超', '张衡', '蔡伦', '华佗'],
    culture: ['造纸术改进', '地动仪', '《伤寒杂病论》']
  },
  {
    name: '三国',
    period: '220-280',
    duration: '60年',
    founder: '曹操/刘备/孙权',
    capital: '洛阳/成都/建业',
    events: ['赤壁之战', '三顾茅庐', '夷陵之战', '诸葛亮北伐'],
    figures: ['曹操', '刘备', '孙权', '诸葛亮', '关羽'],
    culture: ['建安文学', '《三国演义》素材']
  },
  {
    name: '西晋',
    period: '265-316',
    duration: '51年',
    founder: '司马炎',
    capital: '洛阳',
    events: ['三国归晋', '八王之乱', '五胡乱华'],
    figures: ['司马炎', '司马衷', '贾南风'],
    culture: ['门阀制度', '玄学兴起']
  },
  {
    name: '东晋',
    period: '317-420',
    duration: '103年',
    founder: '司马睿',
    capital: '建康（今南京）',
    events: ['衣冠南渡', '淝水之战', '刘裕代晋'],
    figures: ['司马睿', '王导', '谢安', '王羲之', '陶渊明'],
    culture: ['书法艺术', '田园诗', '佛教兴盛']
  },
  {
    name: '南北朝',
    period: '420-589',
    duration: '169年',
    founder: '—',
    capital: '多地',
    events: ['南北对峙', '北魏孝文帝改革', '侯景之乱'],
    figures: ['拓跋宏', '祖冲之', '郦道元', '贾思勰'],
    culture: ['石窟艺术', '《齐民要术》', '圆周率计算']
  },
  {
    name: '隋朝',
    period: '581-618',
    duration: '37年',
    founder: '杨坚',
    capital: '大兴城（今西安）',
    events: ['统一南北', '开凿大运河', '科举制创立', '三征高句丽'],
    figures: ['杨坚', '杨广', '李渊'],
    culture: ['大运河', '科举制度', '赵州桥']
  },
  {
    name: '唐朝',
    period: '618-907',
    duration: '289年',
    founder: '李渊',
    capital: '长安（今西安）',
    events: ['贞观之治', '武则天称帝', '开元盛世', '安史之乱', '黄巢起义'],
    figures: ['李世民', '武则天', '李白', '杜甫', '玄奘'],
    culture: ['唐诗', '丝绸之路鼎盛', '唐三彩', '雕版印刷']
  },
  {
    name: '五代十国',
    period: '907-960',
    duration: '53年',
    founder: '—',
    capital: '多地',
    events: ['藩镇割据', '政权更迭频繁'],
    figures: ['朱温', '李存勖', '柴荣', '李煜'],
    culture: ['词的发展', '花间派']
  },
  {
    name: '北宋',
    period: '960-1127',
    duration: '167年',
    founder: '赵匡胤',
    capital: '开封',
    events: ['陈桥兵变', '杯酒释兵权', '澶渊之盟', '王安石变法', '靖康之变'],
    figures: ['赵匡胤', '包拯', '苏轼', '王安石', '岳飞'],
    culture: ['活字印刷术', '指南针', '火药武器', '宋词']
  },
  {
    name: '南宋',
    period: '1127-1279',
    duration: '152年',
    founder: '赵构',
    capital: '临安（今杭州）',
    events: ['岳飞抗金', '绍兴和议', '崖山之战'],
    figures: ['赵构', '岳飞', '韩世忠', '辛弃疾', '陆游'],
    culture: ['理学发展', '海上贸易', '瓷器鼎盛']
  },
  {
    name: '元朝',
    period: '1271-1368',
    duration: '97年',
    founder: '忽必烈',
    capital: '大都（今北京）',
    events: ['忽必烈统一', '马可波罗来华', '红巾军起义'],
    figures: ['忽必烈', '成吉思汗', '郭守敬', '关汉卿'],
    culture: ['元曲', '行省制度', '《窦娥冤》']
  },
  {
    name: '明朝',
    period: '1368-1644',
    duration: '276年',
    founder: '朱元璋',
    capital: '北京（永乐后）',
    events: ['朱元璋建国', '郑和下西洋', '土木堡之变', '戚继光抗倭', '李自成起义'],
    figures: ['朱元璋', '朱棣', '郑和', '戚继光', '王阳明'],
    culture: ['《永乐大典》', '四大名著', '瓷器外销']
  },
  {
    name: '清朝',
    period: '1636-1912',
    duration: '276年',
    founder: '皇太极',
    capital: '北京',
    events: ['入关统一', '康乾盛世', '鸦片战争', '太平天国', '戊戌变法', '辛亥革命'],
    figures: ['康熙', '雍正', '乾隆', '林则徐', '孙中山'],
    culture: ['《四库全书》', '京剧', '考据学']
  },
  {
    name: '中华民国',
    period: '1912-1949',
    duration: '37年',
    founder: '孙中山',
    capital: '南京/重庆',
    events: ['辛亥革命', '五四运动', '北伐战争', '抗日战争', '解放战争'],
    figures: ['孙中山', '蒋介石', '毛泽东', '周恩来'],
    culture: ['新文化运动', '白话文运动']
  },
  {
    name: '中华人民共和国',
    period: '1949-至今',
    duration: '',
    founder: '毛泽东',
    capital: '北京',
    events: ['开国大典', '改革开放', '香港澳门回归', '加入WTO'],
    figures: ['毛泽东', '邓小平', '习近平'],
    culture: ['社会主义建设', '现代化发展']
  }
];

// 朝代排序题目
var SORT_QUESTIONS = [
  { question: '请按时间顺序排列以下朝代：', options: ['唐朝', '汉朝', '宋朝', '明朝'], answer: ['汉朝', '唐朝', '宋朝', '明朝'] },
  { question: '请按时间顺序排列以下朝代：', options: ['清朝', '明朝', '元朝', '宋朝'], answer: ['宋朝', '元朝', '明朝', '清朝'] },
  { question: '请按时间顺序排列以下朝代：', options: ['秦朝', '汉朝', '三国', '隋朝'], answer: ['秦朝', '汉朝', '三国', '隋朝'] },
  { question: '请按时间顺序排列以下朝代：', options: ['唐朝', '隋朝', '五代十国', '宋朝'], answer: ['隋朝', '唐朝', '五代十国', '宋朝'] },
  { question: '请按时间顺序排列以下朝代：', options: ['西周', '东周', '秦朝', '西汉'], answer: ['西周', '东周', '秦朝', '西汉'] }
];

// 历史问答题目
var QUIZ_QUESTIONS = [
  { question: '秦始皇统一六国后，统一使用的文字是？', options: ['小篆', '大篆', '隶书', '楷书'], answer: '小篆' },
  { question: '汉武帝时期，出使西域的使者是？', options: ['张骞', '班超', '郑和', '玄奘'], answer: '张骞' },
  { question: '被称为"诗仙"的诗人是？', options: ['李白', '杜甫', '白居易', '王维'], answer: '李白' },
  { question: '活字印刷术发明于哪个朝代？', options: ['宋朝', '唐朝', '明朝', '清朝'], answer: '宋朝' },
  { question: '郑和下西洋发生在哪个朝代？', options: ['明朝', '清朝', '宋朝', '唐朝'], answer: '明朝' },
  { question: '科举制度创立于哪个朝代？', options: ['隋朝', '唐朝', '宋朝', '汉朝'], answer: '隋朝' },
  { question: '大运河开凿于哪个朝代？', options: ['隋朝', '唐朝', '秦朝', '汉朝'], answer: '隋朝' },
  { question: '《史记》的作者是？', options: ['司马迁', '班固', '司马光', '左丘明'], answer: '司马迁' },
  { question: '唐朝的都城是？', options: ['长安', '洛阳', '开封', '北京'], answer: '长安' },
  { question: '清朝最后一个皇帝是？', options: ['溥仪', '光绪', '同治', '宣统'], answer: '溥仪' },
  { question: '造纸术改进于哪个朝代？', options: ['东汉', '西汉', '秦朝', '三国'], answer: '东汉' },
  { question: '岳飞是哪个朝代的将领？', options: ['南宋', '北宋', '唐朝', '明朝'], answer: '南宋' },
  { question: '孔子是哪个时期的思想家？', options: ['春秋', '战国', '秦朝', '汉朝'], answer: '春秋' },
  { question: '辛亥革命发生在哪一年？', options: ['1911年', '1919年', '1921年', '1949年'], answer: '1911年' },
  { question: '四大发明中，指南针发明于哪个时期？', options: ['战国', '宋朝', '汉朝', '唐朝'], answer: '战国' }
];

module.exports = {
  DYNASTIES: DYNASTIES,
  SORT_QUESTIONS: SORT_QUESTIONS,
  QUIZ_QUESTIONS: QUIZ_QUESTIONS
};
