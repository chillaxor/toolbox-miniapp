var storage = require('../../../utils/storage.js');

// 内置成语库
var IDIOM_BANK = [
  {
    idiom: '画蛇添足',
    pinyin: 'huà shé tiān zú',
    meaning: '比喻做了多余的事，反而不恰当。',
    story: '楚国有一家人，祭过了祖宗以后，便将一壶祭祀酒赏给办事的人喝。但酒太少，大家决定在地上画蛇，谁先画好谁喝。一人先画好了，拿起酒壶准备喝，见别人还没画好，便左手持壶，右手为蛇画脚，并得意地说："我还能给蛇画脚呢！"还没等他画完，另一个人已画好了蛇，抢过酒壶说："蛇本来没有脚，你怎么能给它画脚呢？"说完就把酒喝了。',
    origin: '《战国策·齐策二》',
    example: '这篇文章已经很完整了，你再加一段结尾纯属画蛇添足。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '守株待兔',
    pinyin: 'shǒu zhū dài tù',
    meaning: '比喻不主动努力，而存万一的侥幸心理，希望得到意外的收获。',
    story: '从前宋国有一个农夫，有一天在田里耕作时，看见一只兔子飞奔而来，撞在田边的树桩上死了。农夫白捡了一只兔子，从此他放下锄头，每天守在树桩旁，希望能再得到兔子。可是再也没有兔子撞死，他的田地也荒芜了，成了宋国人的笑柄。',
    origin: '《韩非子·五蠹》',
    example: '天上不会掉馅饼，我们不能守株待兔。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '掩耳盗铃',
    pinyin: 'yǎn ěr dào líng',
    meaning: '比喻自己欺骗自己，明明掩盖不了的事情却偏要想法子掩盖。',
    story: '春秋时候，有人想偷一口大钟，但钟太大背不动。他就想用锤子把钟敲碎再搬走。可一敲钟就发出巨大的声响。他怕别人听见来抢钟，就捂住自己的耳朵，以为自己听不见别人也听不见。',
    origin: '《吕氏春秋·自知》',
    example: '考试作弊是掩耳盗铃，最终害的是自己。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '亡羊补牢',
    pinyin: 'wáng yáng bǔ láo',
    meaning: '比喻出了问题以后想办法补救，免得继续受损失。',
    story: '从前有个人养了一群羊。一天早晨发现少了一只羊，原来是羊圈破了个洞，夜里狼叼走了羊。邻居劝他赶快修好羊圈，他说："羊已经丢了，修什么羊圈。"第二天又少了一只羊。他很后悔没听邻居的话，赶紧修好了羊圈。从此再没有丢过羊。',
    origin: '《战国策·楚策四》',
    example: '虽然犯了错，但亡羊补牢，为时未晚。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '拔苗助长',
    pinyin: 'bá miáo zhù zhǎng',
    meaning: '比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。',
    story: '宋国有个急性子的农夫，种了禾苗后天天去看，总觉得禾苗长得太慢。一天他终于想出了办法，把禾苗一棵一棵往上拔，从中午一直忙到天黑。他回到家告诉家人说："今天累坏了，我帮禾苗长高了！"他儿子赶去一看，禾苗全都枯死了。',
    origin: '《孟子·公孙丑上》',
    example: '学习要循序渐进，不能拔苗助长。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '刻舟求剑',
    pinyin: 'kè zhōu qiú jiàn',
    meaning: '比喻不懂事物已发展变化而仍静止地看问题。',
    story: '楚国有个人坐船过江，不小心把剑掉进了江里。他立刻在船舷上刻了个记号。船靠岸后，他从刻记号的地方跳下水去找剑。船已经走了很远，而剑还在原来掉下去的地方，怎么能找到呢？',
    origin: '《吕氏春秋·察今》',
    example: '时代在变化，我们不能刻舟求剑。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '叶公好龙',
    pinyin: 'yè gōng hào lóng',
    meaning: '比喻口头上说爱好某事物，实际上并不是真正爱好。',
    story: '叶公非常喜欢龙，家里到处都画着龙、刻着龙。天上的真龙听说后非常感动，就下凡来拜访叶公。真龙把头伸进窗户，尾巴拖在厅堂里。叶公一看是真龙，吓得面如土色，转身就跑。原来叶公喜欢的不是真龙，而是似龙非龙的东西。',
    origin: '《新序·杂事》',
    example: '他说喜欢运动，但从不锻炼，真是叶公好龙。',
    difficulty: 2,
    category: '寓言'
  },
  {
    idiom: '对牛弹琴',
    pinyin: 'duì niú tán qín',
    meaning: '比喻对不懂道理的人讲道理，对外行人说内行话。',
    story: '古代有一位音乐家叫公明仪，有一天他对着一头正在吃草的牛弹奏了一首高雅的曲子。牛无动于衷，只顾低头吃草。后来他弹奏了蚊虻的嗡嗡声和小牛的叫声，牛立刻竖起耳朵，摇着尾巴走过来听。',
    origin: '《理惑论》',
    example: '跟他说这些道理，简直是对牛弹琴。',
    difficulty: 1,
    category: '寓言'
  },
  {
    idiom: '狐假虎威',
    pinyin: 'hú jiǎ hǔ wēi',
    meaning: '比喻仰仗或倚仗别人的权势来欺压、恐吓人。',
    story: '老虎抓到了一只狐狸，正要吃它。狐狸说："你不能吃我！天帝派我当百兽之王，你要是吃了我，就是违抗天帝的命令。你如果不信，就跟在我后面走，看百兽见了我敢不逃跑？"老虎信以为真，就跟在狐狸后面走。果然百兽见了都纷纷逃跑。老虎以为它们真的怕狐狸，不知道它们其实是怕自己。',
    origin: '《战国策·楚策一》',
    example: '他不过是狐假虎威，借着老板的名头吓唬人。',
    difficulty: 2,
    category: '寓言'
  },
  {
    idiom: '愚公移山',
    pinyin: 'yú gōng yí shān',
    meaning: '比喻坚持不懈地改造自然和坚定不移地进行斗争。',
    story: '愚公家门前有太行、王屋两座大山，出行非常不便。愚公决定带领全家人挖山。智叟嘲笑他，愚公说："我死了有儿子，儿子又生孙子，孙子又生儿子，子子孙孙无穷无尽，而山不会增高，何愁挖不平？"天帝被他的诚心感动，命令夸娥氏的两个儿子背走了两座山。',
    origin: '《列子·汤问》',
    example: '只要有愚公移山的精神，就没有克服不了的困难。',
    difficulty: 2,
    category: '寓言'
  },
  {
    idiom: '半途而废',
    pinyin: 'bàn tú ér fèi',
    meaning: '做事不能坚持到底，中途停顿，有始无终。',
    story: '东汉时，乐羊子外出求学，一年后因想家回来了。妻子拿起剪刀走到织布机前说："这布是一丝一丝地积累成寸、成丈、成匹的。现在如果割断它，就会前功尽弃。你求学也是如此，如果半途而废，和割断这匹布有什么区别呢？"乐羊子深受感动，回去继续求学，七年没有回家。',
    origin: '《后汉书·列女传》',
    example: '做事不能半途而废，要坚持到底。',
    difficulty: 2,
    category: '励志'
  },
  {
    idiom: '闻鸡起舞',
    pinyin: 'wén jī qǐ wǔ',
    meaning: '比喻有志报国的人及时奋起。',
    story: '晋代的祖逖和刘琨是好朋友，两人常常同床而眠。一天半夜，祖逖听到鸡叫声，把刘琨叫醒说："别人都认为半夜听见鸡叫不吉利，我偏不这样想，咱们干脆以后听见鸡叫就起床练剑如何？"刘琨欣然同意。从此两人每天鸡叫就起来练剑，后来都成了能文能武的全才。',
    origin: '《晋书·祖逖传》',
    example: '他每天闻鸡起舞，坚持锻炼身体。',
    difficulty: 2,
    category: '励志'
  },
  {
    idiom: '卧薪尝胆',
    pinyin: 'wò xīn cháng dǎn',
    meaning: '形容人刻苦自励，发奋图强。',
    story: '春秋时期，越王勾践被吴王夫差打败，被迫到吴国当奴仆。回国后，他每天睡在柴草上，吃饭前先尝苦胆，提醒自己不忘耻辱。经过十年的努力，越国终于强大起来，最终打败了吴国。',
    origin: '《史记·越王勾践世家》',
    example: '他卧薪尝胆三年，终于考上了理想的大学。',
    difficulty: 2,
    category: '励志'
  },
  {
    idiom: '悬梁刺股',
    pinyin: 'xuán liáng cì gǔ',
    meaning: '形容刻苦学习。',
    story: '汉朝孙敬读书时用绳子把头发系在房梁上，一打瞌睡就会被绳子拉醒。战国苏秦读书困倦时就用锥子刺自己的大腿，用疼痛来提神。两人都通过刻苦学习成为了大学问家。',
    origin: '《太平御览》《战国策·秦策一》',
    example: '学习要有悬梁刺股的精神。',
    difficulty: 3,
    category: '励志'
  },
  {
    idiom: '凿壁偷光',
    pinyin: 'záo bì tōu guāng',
    meaning: '形容家境贫寒却刻苦读书。',
    story: '西汉匡衡小时候家里很穷，买不起蜡烛。他发现邻居家夜里点蜡烛，就在墙壁上凿了一个小洞，借着透过来的微弱光线读书。后来他学问渊博，当上了丞相。',
    origin: '《西京杂记》',
    example: '我们要学习凿壁偷光的精神，珍惜学习机会。',
    difficulty: 2,
    category: '励志'
  },
  {
    idiom: '三顾茅庐',
    pinyin: 'sān gù máo lú',
    meaning: '比喻真心诚意，一再邀请。',
    story: '东汉末年，刘备听说诸葛亮很有才能，就带着关羽和张飞去隆中请他出山。前两次都没见到，第三次去时诸葛亮正在睡觉，刘备在门外等了很久。诸葛亮被他的诚意打动，终于答应出山辅佐他。',
    origin: '《三国演义》',
    example: '为了请到这位专家，公司三顾茅庐。',
    difficulty: 2,
    category: '历史'
  },
  {
    idiom: '负荆请罪',
    pinyin: 'fù jīng qǐng zuì',
    meaning: '表示向人认错赔罪。',
    story: '战国时赵国蔺相如因功被封为上卿，位在廉颇之上。廉颇不服气，扬言要羞辱蔺相如。蔺相如处处回避退让。后来廉颇得知蔺相如是为了国家利益才退让，十分惭愧，就背着荆条到蔺相如府上请罪。两人从此成为生死之交。',
    origin: '《史记·廉颇蔺相如列传》',
    example: '知道自己错了，就应该负荆请罪。',
    difficulty: 2,
    category: '历史'
  },
  {
    idiom: '完璧归赵',
    pinyin: 'wán bì guī zhào',
    meaning: '比喻把原物完好地归还本人。',
    story: '赵国得到了和氏璧，秦昭王要用十五座城来换。蔺相如奉命带璧出使秦国，发现秦王没有诚意换城。他机智地要回和氏璧，派人悄悄送回赵国，自己留在秦国面对秦王。秦王无奈，只好放他回国。',
    origin: '《史记·廉颇蔺相如列传》',
    example: '这本书我看完一定完璧归赵。',
    difficulty: 2,
    category: '历史'
  },
  {
    idiom: '纸上谈兵',
    pinyin: 'zhǐ shàng tán bīng',
    meaning: '比喻空谈理论，不能解决实际问题。',
    story: '战国时赵国名将赵奢的儿子赵括，从小熟读兵法，谈论军事头头是道。但赵奢认为他只会纸上谈兵。后来赵括代替廉颇领兵作战，在长平之战中被秦军大败，四十万赵军被坑杀。',
    origin: '《史记·廉颇蔺相如列传》',
    example: '光有理论不够，不能纸上谈兵。',
    difficulty: 2,
    category: '历史'
  },
  {
    idiom: '望梅止渴',
    pinyin: 'wàng méi zhǐ kě',
    meaning: '比喻用空想来安慰自己。',
    story: '曹操带兵行军，天气炎热，士兵口渴难耐。曹操心生一计，指着前方说："前面有一片梅林，梅子又酸又甜，可以解渴。"士兵们听了，口水都流出来了，也就不觉得那么渴了，终于走到了有水的地方。',
    origin: '《世说新语·假谲》',
    example: '没有实际行动，光靠望梅止渴是不行的。',
    difficulty: 1,
    category: '历史'
  },
  {
    idiom: '胸有成竹',
    pinyin: 'xiōng yǒu chéng zhú',
    meaning: '比喻在做事之前已经有了充分的准备和把握。',
    story: '北宋画家文同画竹子非常有名。他家院子里种满了竹子，每天仔细观察竹子的生长变化。所以他画竹子时，心里已经有了完整的竹子形象，下笔如有神。别人问他秘诀，他说："我只是把竹子的形象记在心里罢了。"',
    origin: '《文与可画筼筜谷偃竹记》',
    example: '考试前他做了充分准备，胸有成竹地走进考场。',
    difficulty: 2,
    category: '艺术'
  },
  {
    idiom: '程门立雪',
    pinyin: 'chéng mén lì xuě',
    meaning: '形容尊师重道，恭敬求教。',
    story: '北宋杨时去拜访老师程颐，到了门口发现程颐正在午睡。杨时不忍打扰，就站在门外等候。当时正下着大雪，等程颐醒来时，门外的雪已经积了一尺多深。程颐深受感动，将毕生学问传授给他。',
    origin: '《宋史·杨时传》',
    example: '我们要学习程门立雪的精神，尊敬老师。',
    difficulty: 2,
    category: '品德'
  },
  {
    idiom: '铁杵磨针',
    pinyin: 'tiě chǔ mó zhēn',
    meaning: '比喻只要有恒心，再难的事也能做成功。',
    story: '李白小时候不爱学习，有一天他逃学出去玩，遇到一位老婆婆在石头上磨一根铁棒。李白问她磨什么，老婆婆说要磨成一根针。李白很惊讶，老婆婆说："只要功夫深，铁杵磨成针。"李白深受启发，从此发奋读书。',
    origin: '《方舆胜览》',
    example: '学习要有铁杵磨针的毅力。',
    difficulty: 1,
    category: '励志'
  },
  {
    idiom: '鹬蚌相争',
    pinyin: 'yù bàng xiāng zhēng',
    meaning: '比喻双方相争，两败俱伤，让第三者得利。',
    story: '一只鹬鸟去啄蚌的肉，蚌合上壳夹住了鹬鸟的嘴。鹬鸟说："今天不下雨，明天不下雨，你就会干死。"蚌说："今天不放你，明天不放你，你就会饿死。"它们互不相让，一个渔翁走过来把它们一起捉走了。',
    origin: '《战国策·燕策二》',
    example: '两家公司鹬蚌相争，让第三方渔翁得利。',
    difficulty: 2,
    category: '寓言'
  },
  {
    idiom: '朝三暮四',
    pinyin: 'zhāo sān mù sì',
    meaning: '比喻常常变卦，反复无常。',
    story: '宋国有个养猴子的人，他跟猴子们说："早上给你们三颗橡子，晚上给四颗。"猴子们都很生气。他又说："那早上四颗，晚上三颗。"猴子们都很高兴。其实总数是一样的，只是说法不同而已。',
    origin: '《庄子·齐物论》',
    example: '做事不能朝三暮四，要有恒心。',
    difficulty: 2,
    category: '寓言'
  }
];

Page({
  data: {
    page: 'list',       // list | detail | quiz | result
    idioms: [],
    filteredIdioms: [],
    currentIdiom: null,
    currentIndex: 0,
    categories: [],
    selectedCategory: '全部',
    // 问答模式
    quizIdioms: [],
    quizIndex: 0,
    quizOptions: [],
    selectedOption: -1,
    showAnswer: false,
    correctNum: 0,
    wrongNum: 0,
    quizTotal: 10,
    // 结果
    resultSummary: null,
    isFavorite: false
  },

  onLoad: function () {
    var categories = ['全部'];
    var catMap = {};
    for (var i = 0; i < IDIOM_BANK.length; i++) {
      var cat = IDIOM_BANK[i].category;
      if (!catMap[cat]) {
        catMap[cat] = true;
        categories.push(cat);
      }
    }
    this.setData({
      idioms: IDIOM_BANK,
      filteredIdioms: IDIOM_BANK,
      categories: categories
    });
    this.checkFavorite();
  },

  onShow: function () {
    this.checkFavorite();
  },

  checkFavorite: function () {
    this.setData({ isFavorite: storage.isFavorite('idiom-stories') });
  },

  toggleFavorite: function () {
    var fav = storage.toggleFavorite('idiom-stories');
    this.setData({ isFavorite: fav });
  },

  onCategoryTap: function (e) {
    var cat = e.currentTarget.dataset.category;
    var filtered = cat === '全部' ? IDIOM_BANK : IDIOM_BANK.filter(function (item) {
      return item.category === cat;
    });
    this.setData({
      selectedCategory: cat,
      filteredIdioms: filtered
    });
  },

  onIdiomTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var idiom = this.data.filteredIdioms[idx];
    this.setData({
      currentIdiom: idiom,
      currentIndex: idx,
      page: 'detail'
    });
  },

  onBackList: function () {
    this.setData({ page: 'list' });
  },

  onNextIdiom: function () {
    var nextIdx = (this.data.currentIndex + 1) % this.data.filteredIdioms.length;
    this.setData({
      currentIdiom: this.data.filteredIdioms[nextIdx],
      currentIndex: nextIdx
    });
  },

  onPrevIdiom: function () {
    var prevIdx = (this.data.currentIndex - 1 + this.data.filteredIdioms.length) % this.data.filteredIdioms.length;
    this.setData({
      currentIdiom: this.data.filteredIdioms[prevIdx],
      currentIndex: prevIdx
    });
  },

  onStartQuiz: function () {
    // 随机抽取10道题
    var all = IDIOM_BANK.slice().sort(function () { return Math.random() - 0.5; });
    var quiz = all.slice(0, Math.min(10, all.length));
    this.setData({
      page: 'quiz',
      quizIdioms: quiz,
      quizIndex: 0,
      correctNum: 0,
      wrongNum: 0,
      selectedOption: -1,
      showAnswer: false
    });
    this.generateOptions(0, quiz);
  },

  generateOptions: function (idx, quiz) {
    var current = quiz[idx];
    // 从含义选：正确含义 + 3个错误含义
    var options = [current.meaning];
    var others = IDIOM_BANK.filter(function (item) {
      return item.idiom !== current.idiom;
    }).sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < 3 && i < others.length; i++) {
      options.push(others[i].meaning);
    }
    // 打乱
    options.sort(function () { return Math.random() - 0.5; });
    var correctIdx = options.indexOf(current.meaning);
    this.setData({
      quizOptions: options,
      correctOptionIndex: correctIdx
    });
  },

  onOptionTap: function (e) {
    if (this.data.showAnswer) return;
    var idx = e.currentTarget.dataset.index;
    var isCorrect = idx === this.data.correctOptionIndex;
    this.setData({
      selectedOption: idx,
      showAnswer: true,
      correctNum: isCorrect ? this.data.correctNum + 1 : this.data.correctNum,
      wrongNum: isCorrect ? this.data.wrongNum : this.data.wrongNum + 1
    });
  },

  onNextQuiz: function () {
    var nextIdx = this.data.quizIndex + 1;
    if (nextIdx >= this.data.quizIdioms.length) {
      // 结束
      this.finishQuiz();
    } else {
      this.setData({
        quizIndex: nextIdx,
        selectedOption: -1,
        showAnswer: false
      });
      this.generateOptions(nextIdx, this.data.quizIdioms);
    }
  },

  finishQuiz: function () {
    var total = this.data.quizIdioms.length;
    var correct = this.data.correctNum;
    this.setData({
      page: 'result',
      resultSummary: {
        total: total,
        correct: correct,
        wrong: total - correct,
        accuracy: Math.round(correct / total * 100)
      }
    });
    storage.addHistory({
      toolId: 'idiom-stories',
      toolName: '成语故事',
      category: 'study',
      summary: '成语问答 正确' + correct + '/' + total,
      timestamp: Date.now()
    });
  },

  onRetry: function () {
    this.onStartQuiz();
  },

  onShareAppMessage: function () {
    return {
      title: '成语故事 - 24个经典成语故事',
      path: '/packages/toolsB/idiom-stories/index'
    };
  }
});
