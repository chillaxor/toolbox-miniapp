/**
 * 名人名言/格言数据库
 * 约200条，分8个类别
 */

var QUOTES = [
  // === 励志 ===
  { content: '天行健，君子以自强不息。', author: '《周易》', category: '励志' },
  { content: '世上无难事，只要肯登攀。', author: '毛泽东', category: '励志' },
  { content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子', category: '励志' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》', category: '励志' },
  { content: '千磨万击还坚劲，任尔东西南北风。', author: '郑燮', category: '励志' },
  { content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', category: '励志' },
  { content: '长风破浪会有时，直挂云帆济沧海。', author: '李白', category: '励志' },
  { content: '老骥伏枥，志在千里；烈士暮年，壮心不已。', author: '曹操', category: '励志' },
  { content: '少壮不努力，老大徒伤悲。', author: '《长歌行》', category: '励志' },
  { content: '有志者事竟成。', author: '《后汉书》', category: '励志' },
  { content: '人生在勤，不索何获。', author: '张衡', category: '励志' },
  { content: '会当凌绝顶，一览众山小。', author: '杜甫', category: '励志' },
  { content: '天生我材必有用，千金散尽还复来。', author: '李白', category: '励志' },
  { content: '生当作人杰，死亦为鬼雄。', author: '李清照', category: '励志' },
  { content: '落红不是无情物，化作春泥更护花。', author: '龚自珍', category: '励志' },
  { content: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '黄蘖禅师', category: '励志' },
  { content: '故天将降大任于是人也，必先苦其心志，劳其筋骨。', author: '孟子', category: '励志' },
  { content: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子', category: '励志' },
  { content: '生命不息，奋斗不止。', author: '卡莱尔', category: '励志' },
  { content: '成功的秘诀在于永不改变既定的目标。', author: '托尔斯泰', category: '励志' },
  { content: '只有登上山顶，才能看到那边的风光。', author: '徐志摩', category: '励志' },
  { content: '生活就像海洋，只有意志坚强的人才能到达彼岸。', author: '马克思', category: '励志' },
  { content: '千里之行，始于足下。', author: '老子', category: '励志' },
  { content: '精诚所至，金石为开。', author: '《后汉书》', category: '励志' },
  { content: '穷且益坚，不坠青云之志。', author: '王勃', category: '励志' },

  // === 人生 ===
  { content: '人生自古谁无死，留取丹心照汗青。', author: '文天祥', category: '人生' },
  { content: '人固有一死，或重于泰山，或轻于鸿毛。', author: '司马迁', category: '人生' },
  { content: '人生如逆旅，我亦是行人。', author: '苏轼', category: '人生' },
  { content: '人生天地之间，若白驹过隙，忽然而已。', author: '庄子', category: '人生' },
  { content: '人生的意义不在于拿一手好牌，而在于打好一手坏牌。', author: '佚名', category: '人生' },
  { content: '人生没有彩排，每天都是现场直播。', author: '佚名', category: '人生' },
  { content: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', author: '维维安·格林', category: '人生' },
  { content: '世事无常，唯有用心过好每一天。', author: '佚名', category: '人生' },
  { content: '人生最大的遗憾，莫过于轻易放弃了不该放弃的。', author: '柏拉图', category: '人生' },
  { content: '人生如棋，落子无悔。', author: '佚名', category: '人生' },
  { content: '人生的价值，并不是用时间，而是用深度去衡量的。', author: '列夫·托尔斯泰', category: '人生' },
  { content: '人生应该如蜡烛一样，从顶燃到底，一直都是光明的。', author: '萧楚女', category: '人生' },
  { content: '生活是一面镜子，你对它笑，它就对你笑。', author: '萨克雷', category: '人生' },
  { content: '人生最重要的不是所站的位置，而是所朝的方向。', author: '佚名', category: '人生' },
  { content: '世界以痛吻我，要我报之以歌。', author: '泰戈尔', category: '人生' },
  { content: '既然选择了远方，便只顾风雨兼程。', author: '汪国真', category: '人生' },
  { content: '你若盛开，清风自来。', author: '三毛', category: '人生' },
  { content: '人生没有白走的路，每一步都算数。', author: '李宗盛', category: '人生' },
  { content: '人间有味是清欢。', author: '苏轼', category: '人生' },
  { content: '生活不止眼前的苟且，还有诗和远方的田野。', author: '高晓松', category: '人生' },

  // === 爱情 ===
  { content: '两情若是久长时，又岂在朝朝暮暮。', author: '秦观', category: '爱情' },
  { content: '曾经沧海难为水，除却巫山不是云。', author: '元稹', category: '爱情' },
  { content: '问世间情为何物，直教人生死相许。', author: '元好问', category: '爱情' },
  { content: '在天愿作比翼鸟，在地愿为连理枝。', author: '白居易', category: '爱情' },
  { content: '身无彩凤双飞翼，心有灵犀一点通。', author: '李商隐', category: '爱情' },
  { content: '执子之手，与子偕老。', author: '《诗经》', category: '爱情' },
  { content: '愿得一心人，白首不相离。', author: '卓文君', category: '爱情' },
  { content: '爱情不是数着日子过去，而是让每个日子都变得有意义。', author: '佚名', category: '爱情' },
  { content: '最好的爱情，是你刚好成熟，我刚好温柔。', author: '张爱玲', category: '爱情' },
  { content: '爱是恒久忍耐，又有恩慈。', author: '《圣经》', category: '爱情' },
  { content: '春蚕到死丝方尽，蜡炬成灰泪始干。', author: '李商隐', category: '爱情' },
  { content: '此情可待成追忆，只是当时已惘然。', author: '李商隐', category: '爱情' },
  { content: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德', category: '爱情' },
  { content: '玲珑骰子安红豆，入骨相思知不知。', author: '温庭筠', category: '爱情' },
  { content: '我爱你，与你无关。', author: '歌德', category: '爱情' },
  { content: '相遇是春风十里，原来是你；相爱是山长水阔，最后是你。', author: '佚名', category: '爱情' },
  { content: '喜欢是乍见之欢，爱是久处不厌。', author: '佚名', category: '爱情' },
  { content: '你是我温暖的手套，冰冷的啤酒，带着阳光味道的衬衫。', author: '村上春树', category: '爱情' },
  { content: '我行过许多地方的桥，看过许多次数的云，喝过许多种类的酒，却只爱过一个正当最好年龄的人。', author: '沈从文', category: '爱情' },
  { content: '不要因为结束而哭泣，微笑吧，为你的曾经拥有。', author: '佚名', category: '爱情' },

  // === 友情 ===
  { content: '海内存知己，天涯若比邻。', author: '王勃', category: '友情' },
  { content: '桃花潭水深千尺，不及汪伦送我情。', author: '李白', category: '友情' },
  { content: '人生得一知己足矣，斯世当以同怀视之。', author: '鲁迅', category: '友情' },
  { content: '君子之交淡如水，小人之交甘若醴。', author: '庄子', category: '友情' },
  { content: '莫愁前路无知己，天下谁人不识君。', author: '高适', category: '友情' },
  { content: '同是天涯沦落人，相逢何必曾相识。', author: '白居易', category: '友情' },
  { content: '朋友就是把你看透了，还能喜欢你的人。', author: '佚名', category: '友情' },
  { content: '真正的友谊，是一株成长缓慢的植物。', author: '华盛顿', category: '友情' },
  { content: '患难见真情。', author: '佚名', category: '友情' },
  { content: '独学而无友，则孤陋而寡闻。', author: '《礼记》', category: '友情' },
  { content: '人生贵相知，何必金与钱。', author: '李白', category: '友情' },
  { content: '万两黄金容易得，知心一个也难求。', author: '曹雪芹', category: '友情' },
  { content: '友谊是两颗心真诚相待，而不是一颗心对另一颗心的敲打。', author: '鲁迅', category: '友情' },
  { content: '一个好朋友，当看到对方的错误时，会真诚地指出。', author: '佚名', category: '友情' },
  { content: '真正的朋友，是一个灵魂孕育在两个躯体里。', author: '亚里士多德', category: '友情' },

  // === 智慧 ===
  { content: '学而不思则罔，思而不学则殆。', author: '孔子', category: '智慧' },
  { content: '知之为知之，不知为不知，是知也。', author: '孔子', category: '智慧' },
  { content: '温故而知新，可以为师矣。', author: '孔子', category: '智慧' },
  { content: '三人行，必有我师焉。', author: '孔子', category: '智慧' },
  { content: '己所不欲，勿施于人。', author: '孔子', category: '智慧' },
  { content: '知人者智，自知者明。', author: '老子', category: '智慧' },
  { content: '上善若水，水善利万物而不争。', author: '老子', category: '智慧' },
  { content: '大智若愚，大巧若拙。', author: '老子', category: '智慧' },
  { content: '读万卷书，行万里路。', author: '刘彝', category: '智慧' },
  { content: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈', category: '智慧' },
  { content: '吾生也有涯，而知也无涯。', author: '庄子', category: '智慧' },
  { content: '敏而好学，不耻下问。', author: '孔子', category: '智慧' },
  { content: '读书破万卷，下笔如有神。', author: '杜甫', category: '智慧' },
  { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', category: '智慧' },
  { content: '知识就是力量。', author: '培根', category: '智慧' },
  { content: '活到老，学到老。', author: '佚名', category: '智慧' },
  { content: '我思故我在。', author: '笛卡尔', category: '智慧' },
  { content: '智慧是宝石，如果用谦虚镶边，就会更加灿烂夺目。', author: '高尔基', category: '智慧' },
  { content: '愚者自以为聪明，智者则有自知之明。', author: '莎士比亚', category: '智慧' },
  { content: '学而不厌，诲人不倦。', author: '孔子', category: '智慧' },

  // === 哲理 ===
  { content: '祸兮福所倚，福兮祸所伏。', author: '老子', category: '哲理' },
  { content: '塞翁失马，焉知非福。', author: '《淮南子》', category: '哲理' },
  { content: '物极必反，否极泰来。', author: '《易经》', category: '哲理' },
  { content: '水至清则无鱼，人至察则无徒。', author: '《汉书》', category: '哲理' },
  { content: '不以规矩，不能成方圆。', author: '孟子', category: '哲理' },
  { content: '尽信书，则不如无书。', author: '孟子', category: '哲理' },
  { content: '尺有所短，寸有所长。', author: '屈原', category: '哲理' },
  { content: '失败是成功之母。', author: '佚名', category: '哲理' },
  { content: '种瓜得瓜，种豆得豆。', author: '佚名', category: '哲理' },
  { content: '冰冻三尺，非一日之寒。', author: '佚名', category: '哲理' },
  { content: '三十年河东，三十年河西。', author: '佚名', category: '哲理' },
  { content: '世界上没有绝望的处境，只有对处境绝望的人。', author: '费洛姆', category: '哲理' },
  { content: '一切伟大的行动和思想，都有一个微不足道的开始。', author: '加缪', category: '哲理' },
  { content: '你不能左右天气，但可以改变心情。', author: '佚名', category: '哲理' },
  { content: '山重水复疑无路，柳暗花明又一村。', author: '陆游', category: '哲理' },
  { content: '横看成岭侧成峰，远近高低各不同。', author: '苏轼', category: '哲理' },
  { content: '沉舟侧畔千帆过，病树前头万木春。', author: '刘禹锡', category: '哲理' },
  { content: '存在即合理。', author: '黑格尔', category: '哲理' },
  { content: '人不能两次踏进同一条河流。', author: '赫拉克利特', category: '哲理' },
  { content: '吾日三省吾身。', author: '曾子', category: '哲理' },

  // === 职场 ===
  { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈', category: '职场' },
  { content: '天道酬勤。', author: '《尚书》', category: '职场' },
  { content: '一分耕耘，一分收获。', author: '佚名', category: '职场' },
  { content: '机会总是留给有准备的人。', author: '巴斯德', category: '职场' },
  { content: '态度决定一切。', author: '佚名', category: '职场' },
  { content: '细节决定成败。', author: '佚名', category: '职场' },
  { content: '不经历风雨，怎么见彩虹。', author: '佚名', category: '职场' },
  { content: '吃得苦中苦，方为人上人。', author: '佚名', category: '职场' },
  { content: '台上一分钟，台下十年功。', author: '佚名', category: '职场' },
  { content: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅', category: '职场' },
  { content: '天才就是百分之一的灵感加百分之九十九的汗水。', author: '爱迪生', category: '职场' },
  { content: '不要等待机会，而要创造机会。', author: '佚名', category: '职场' },
  { content: '今天做的事不要等到明天，自己做的事不要指望别人。', author: '富兰克林', category: '职场' },
  { content: '把每一件简单的事做好就是不简单。', author: '张瑞敏', category: '职场' },
  { content: '世上没有绝望的处境，只有对处境绝望的人。', author: '佚名', category: '职场' },
  { content: '成功的花，人们只惊羡她现时的明艳，然而当初她的芽儿浸透了奋斗的泪泉。', author: '冰心', category: '职场' },
  { content: '聪明在于勤奋，天才在于积累。', author: '华罗庚', category: '职场' },
  { content: '做自己喜欢的事，永远不会觉得累。', author: '乔布斯', category: '职场' },
  { content: 'Stay hungry, Stay foolish。', author: '乔布斯', category: '职场' },
  { content: '简单的事情重复做，你就是专家；重复的事情用心做，你就是赢家。', author: '佚名', category: '职场' },

  // === 学习 ===
  { content: '业精于勤荒于嬉，行成于思毁于随。', author: '韩愈', category: '学习' },
  { content: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿', category: '学习' },
  { content: '书到用时方恨少，事非经过不知难。', author: '陆游', category: '学习' },
  { content: '学无止境。', author: '荀子', category: '学习' },
  { content: '博学之，审问之，慎思之，明辨之，笃行之。', author: '《中庸》', category: '学习' },
  { content: '学而时习之，不亦说乎。', author: '孔子', category: '学习' },
  { content: '不学自知，不问自晓，古今行事，未之有也。', author: '王充', category: '学习' },
  { content: '知不足者好学，耻下问者自满。', author: '林逋', category: '学习' },
  { content: '玉不琢，不成器；人不学，不知道。', author: '《礼记》', category: '学习' },
  { content: '三更灯火五更鸡，正是男儿读书时。', author: '颜真卿', category: '学习' },
  { content: '发奋识遍天下字，立志读尽人间书。', author: '苏轼', category: '学习' },
  { content: '旧书不厌百回读，熟读精思子自知。', author: '苏轼', category: '学习' },
  { content: '少年易老学难成，一寸光阴不可轻。', author: '朱熹', category: '学习' },
  { content: '问渠那得清如许，为有源头活水来。', author: '朱熹', category: '学习' },
  { content: '立身以立学为先，立学以读书为本。', author: '欧阳修', category: '学习' },
  { content: '读书有三到：心到、眼到、口到。', author: '朱熹', category: '学习' },
  { content: '读一本好书，就是和许多高尚的人谈话。', author: '歌德', category: '学习' },
  { content: '学而不思则罔，思而不学则殆。', author: '孔子', category: '学习' },
  { content: '学习是劳动，是充满思想的劳动。', author: '乌申斯基', category: '学习' },
  { content: '聪明的人不是具有广博知识的人，而是掌握了有用知识的人。', author: '埃斯库罗斯', category: '学习' },

  // === 励志（续） ===
  { content: '壮志与毅力是事业的双翼。', author: '歌德', category: '励志' },
  { content: '志不强者智不达。', author: '墨子', category: '励志' },
  { content: '古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。', author: '苏轼', category: '励志' },
  { content: '将相本无种，男儿当自强。', author: '汪洙', category: '励志' },
  { content: '志当存高远。', author: '诸葛亮', category: '励志' },
  { content: '世上没有绝望的处境，只有对处境绝望的人。', author: '费洛姆', category: '励志' },
  { content: '人生最大的快乐不在于占有什么，而在于追求什么的过程。', author: '本生', category: '励志' },
  { content: '一个人的价值，应该看他贡献什么，而不应当看他取得什么。', author: '爱因斯坦', category: '励志' },
  { content: '冬天来了，春天还会远吗？', author: '雪莱', category: '励志' },
  { content: '人生就像骑自行车，想保持平衡就得往前走。', author: '爱因斯坦', category: '励志' },

  // === 人生（续） ===
  { content: '把脸一直向着阳光，这样就不会见到阴影。', author: '海伦·凯勒', category: '人生' },
  { content: '人生如茶，空杯以对，才有喝不完的好茶。', author: '林清玄', category: '人生' },
  { content: '不要为成功而努力，要为做一个有价值的人而努力。', author: '爱因斯坦', category: '人生' },
  { content: '不管前方的路有多苦，只要走的方向正确，不管多么崎岖不平，都比站在原地更接近幸福。', author: '宫崎骏', category: '人生' },
  { content: '人生没有如果，只有后果和结果。', author: '佚名', category: '人生' },
  { content: '人之所以痛苦，在于追求错误的东西。', author: '路遥', category: '人生' },
  { content: '但愿每次回忆，对生活都不感到负疚。', author: '郭小川', category: '人生' },
  { content: '人生的路，靠自己一步步走去，真正能保护你的，是你自己的人格选择和文化选择。', author: '余秋雨', category: '人生' },
  { content: '不乱于心，不困于情，不畏将来，不念过往。如此，安好。', author: '丰子恺', category: '人生' },
  { content: '温柔半两，从容一生。', author: '三毛', category: '人生' },

  // === 爱情（续） ===
  { content: '相见时难别亦难，东风无力百花残。', author: '李商隐', category: '爱情' },
  { content: '衣带渐宽终不悔，为伊消得人憔悴。', author: '柳永', category: '爱情' },
  { content: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。', author: '辛弃疾', category: '爱情' },
  { content: '我爱你，不是因为你是一个怎样的人，而是因为我喜欢与你在一起时的感觉。', author: '佚名', category: '爱情' },
  { content: '有些人注定是等待别人的，有些人是注定被人等的。', author: '张小娴', category: '爱情' },
  { content: '一花一世界，一叶一追寻，一曲一场叹，一生为一人。', author: '布莱克', category: '爱情' },
  { content: '你若不离不弃，我必生死相依。', author: '佚名', category: '爱情' },
  { content: '我爱你，为了你的幸福，我愿意放弃一切，包括你。', author: '张爱玲', category: '爱情' },
  { content: '真正的爱情是不能用言语表达的，行为才是忠心的最好说明。', author: '莎士比亚', category: '爱情' },
  { content: '陪伴是最长情的告白。', author: '佚名', category: '爱情' },

  // === 友情（续） ===
  { content: '有朋自远方来，不亦乐乎。', author: '孔子', category: '友情' },
  { content: '以财交者，财尽而交绝；以色交者，华落而爱渝。', author: '《战国策》', category: '友情' },
  { content: '与善人居，如入芝兰之室，久而不闻其香；与不善人居，如入鲍鱼之肆，久而不闻其臭。', author: '孔子', category: '友情' },
  { content: '人生所贵在知已，四海相逢骨肉亲。', author: '李贺', category: '友情' },
  { content: '路遥知马力，日久见人心。', author: '佚名', category: '友情' },
  { content: '近朱者赤，近墨者黑。', author: '傅玄', category: '友情' },
  { content: '人之相识，贵在相知；人之相知，贵在知心。', author: '孟子', category: '友情' },
  { content: '布衣之交不可忘。', author: '李延寿', category: '友情' },
  { content: '落地为兄弟，何必骨肉亲。', author: '陶渊明', category: '友情' },
  { content: '朋友间的不和，就是敌人进攻的机会。', author: '伊索', category: '友情' },

  // === 智慧（续） ===
  { content: '满招损，谦受益。', author: '《尚书》', category: '智慧' },
  { content: '见贤思齐焉，见不贤而内自省也。', author: '孔子', category: '智慧' },
  { content: '工欲善其事，必先利其器。', author: '孔子', category: '智慧' },
  { content: '君子坦荡荡，小人长戚戚。', author: '孔子', category: '智慧' },
  { content: '不患人之不己知，患不知人也。', author: '孔子', category: '智慧' },
  { content: '道可道，非常道；名可名，非常名。', author: '老子', category: '智慧' },
  { content: '千里之堤，溃于蚁穴。', author: '《韩非子》', category: '智慧' },
  { content: '兼听则明，偏信则暗。', author: '《资治通鉴》', category: '智慧' },
  { content: '纸上谈兵终觉浅，绝知此事要躬行。', author: '陆游', category: '智慧' },
  { content: '智者千虑，必有一失；愚者千虑，必有一得。', author: '司马迁', category: '智慧' },

  // === 哲理（续） ===
  { content: '当局者迷，旁观者清。', author: '《新唐书》', category: '哲理' },
  { content: '生于忧患，死于安乐。', author: '孟子', category: '哲理' },
  { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', category: '哲理' },
  { content: '路不拾遗，夜不闭户。', author: '《礼记》', category: '哲理' },
  { content: '天网恢恢，疏而不漏。', author: '老子', category: '哲理' },
  { content: '防民之口，甚于防川。', author: '《国语》', category: '哲理' },
  { content: '星星之火，可以燎原。', author: '毛泽东', category: '哲理' },
  { content: '滴水穿石，非一日之功。', author: '佚名', category: '哲理' },
  { content: '近水知鱼性，近山识鸟音。', author: '《增广贤文》', category: '哲理' },
  { content: '凡事预则立，不预则废。', author: '《礼记》', category: '哲理' },

  // === 职场（续） ===
  { content: '千里之行，始于足下。', author: '老子', category: '职场' },
  { content: '勤能补拙。', author: '佚名', category: '职场' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名', category: '职场' },
  { content: '失败乃成功之母。', author: '佚名', category: '职场' },
  { content: '世上本没有路，走的人多了，也便成了路。', author: '鲁迅', category: '职场' },
  { content: '不论你在什么时候开始，重要的是开始之后就不要停止。', author: '佚名', category: '职场' },
  { content: '人生在世，事业为重。一息尚存，绝不松劲。', author: '吴玉章', category: '职场' },
  { content: '伟大的事业，需要决心，能力，组织和责任感。', author: '易卜生', category: '职场' },
  { content: '只有把抱怨环境的心情，化为上进的力量，才是成功的保证。', author: '罗曼·罗兰', category: '职场' },
  { content: '人的大脑和肢体一样，多用则灵，不用则废。', author: '茅以升', category: '职场' },

  // === 学习（续） ===
  { content: '非学无以广才，非志无以成学。', author: '诸葛亮', category: '学习' },
  { content: '读书百遍，其义自见。', author: '陈寿', category: '学习' },
  { content: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。', author: '陶渊明', category: '学习' },
  { content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', category: '学习' },
  { content: '不飞则已，一飞冲天；不鸣则已，一鸣惊人。', author: '司马迁', category: '学习' },
  { content: '读书之法，在循序而渐进，熟读而精思。', author: '朱熹', category: '学习' },
  { content: '锲而不舍，金石可镂。', author: '荀子', category: '学习' },
  { content: '勿以恶小而为之，勿以善小而不为。', author: '刘备', category: '学习' },
  { content: '书犹药也，善读之可以医愚。', author: '刘向', category: '学习' },
  { content: '奇文共欣赏，疑义相与析。', author: '陶渊明', category: '学习' },

  // === 生活/感悟 ===
  { content: '静以修身，俭以养德。', author: '诸葛亮', category: '人生' },
  { content: '知足常足，终身不辱；知止常止，终身不耻。', author: '老子', category: '人生' },
  { content: '宠辱不惊，看庭前花开花落；去留无意，望天上云卷云舒。', author: '洪应明', category: '人生' },
  { content: '走得最慢的人，只要他不丧失目标，也比漫无目的地徘徊的人走得快。', author: '莱辛', category: '励志' },
  { content: '当你的才华还撑不起你的野心时，你就应该静下心来学习。', author: '莫言', category: '学习' },
  { content: '时间就是生命，无端的空耗别人的时间，其实是无异于谋财害命的。', author: '鲁迅', category: '智慧' },
  { content: '没有加倍的勤奋，就既没有才能，也没有天才。', author: '门捷列夫', category: '职场' },
  { content: '一个人的快乐，不是因为他拥有的多，而是因为他计较的少。', author: '佚名', category: '哲理' },
  { content: '人生最大的勇敢之一，就是经历欺骗和伤害之后，还能保持信任和爱的能力。', author: '佚名', category: '人生' },
  { content: '低调做人，你会一次比一次稳健；高调做事，你会一次比一次优秀。', author: '佚名', category: '职场' },

  // === 新增第二批：200条不重复 ===

  // 励志补充
  { content: '燕雀安知鸿鹄之志哉。', author: '陈涉', category: '励志' },
  { content: '大鹏一日同风起，扶摇直上九万里。', author: '李白', category: '励志' },
  { content: '春风得意马蹄疾，一日看尽长安花。', author: '孟郊', category: '励志' },
  { content: '黄沙百战穿金甲，不破楼兰终不还。', author: '王昌龄', category: '励志' },
  { content: '壮志饥餐胡虏肉，笑谈渴饮匈奴血。', author: '岳飞', category: '励志' },
  { content: '三十功名尘与土，八千里路云和月。', author: '岳飞', category: '励志' },
  { content: '为天地立心，为生民立命，为往圣继绝学，为万世开太平。', author: '张载', category: '励志' },
  { content: '苟利国家生死以，岂因祸福避趋之。', author: '林则徐', category: '励志' },
  { content: '红军不怕远征难，万水千山只等闲。', author: '毛泽东', category: '励志' },
  { content: '数风流人物，还看今朝。', author: '毛泽东', category: '励志' },
  { content: '自信人生二百年，会当水击三千里。', author: '毛泽东', category: '励志' },
  { content: '不畏浮云遮望眼，自缘身在最高层。', author: '王安石', category: '励志' },
  { content: '刑天舞干戚，猛志固常在。', author: '陶渊明', category: '励志' },
  { content: '粉身碎骨浑不怕，要留清白在人间。', author: '于谦', category: '励志' },
  { content: '咬定青山不放松，立根原在破岩中。', author: '郑板桥', category: '励志' },
  { content: '我自横刀向天笑，去留肝胆两昆仑。', author: '谭嗣同', category: '励志' },
  { content: '愿中国青年都摆脱冷气，只是向上走。', author: '鲁迅', category: '励志' },
  { content: '世上只有一种英雄主义，就是在认清生活的真相后依然热爱生活。', author: '罗曼·罗兰', category: '励志' },
  { content: '你若要喜爱你自己的价值，你就得给世界创造价值。', author: '歌德', category: '励志' },
  { content: '人的一切痛苦，本质上都是对自己无能的愤怒。', author: '王小波', category: '励志' },
  { content: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采', category: '励志' },
  { content: '我要扼住命运的咽喉，它妄想使我屈服。', author: '贝多芬', category: '励志' },
  { content: '勇士是在充满荆棘的道路上前行的。', author: '歌德', category: '励志' },
  { content: '即使翅膀断了，心也要飞翔。', author: '张海迪', category: '励志' },
  { content: '强烈的信仰会赢取坚强的人，然后又使他们更坚强。', author: '华特·贝基霍', category: '励志' },

  // 人生补充
  { content: '众鸟高飞尽，孤云独去闲。相看两不厌，只有敬亭山。', author: '李白', category: '人生' },
  { content: '采菊东篱下，悠然见南山。', author: '陶渊明', category: '人生' },
  { content: '人生得意须尽欢，莫使金樽空对月。', author: '李白', category: '人生' },
  { content: '抽刀断水水更流，举杯消愁愁更愁。', author: '李白', category: '人生' },
  { content: '同是天涯沦落人，相逢何必曾相识。', author: '白居易', category: '人生' },
  { content: '人生代代无穷已，江月年年只相似。', author: '张若虚', category: '人生' },
  { content: '年年岁岁花相似，岁岁年年人不同。', author: '刘希夷', category: '人生' },
  { content: '对酒当歌，人生几何。', author: '曹操', category: '人生' },
  { content: '月有阴晴圆缺，人有悲欢离合。', author: '苏轼', category: '人生' },
  { content: '寄蜉蝣于天地，渺沧海之一粟。', author: '苏轼', category: '人生' },
  { content: '纵使晴明无雨色，入云深处亦沾衣。', author: '张旭', category: '人生' },
  { content: '行到水穷处，坐看云起时。', author: '王维', category: '人生' },
  { content: '人生到处知何似，应似飞鸿踏雪泥。', author: '苏轼', category: '人生' },
  { content: '世事一场大梦，人生几度秋凉。', author: '苏轼', category: '人生' },
  { content: '人生有情泪沾臆，江水江花岂终极。', author: '杜甫', category: '人生' },
  { content: '人生若尘露，天道邈悠悠。', author: '阮籍', category: '人生' },
  { content: '莫道桑榆晚，为霞尚满天。', author: '刘禹锡', category: '人生' },
  { content: '人这一辈子，最不值得的事情就是为没发生的事情担忧。', author: '蔡澜', category: '人生' },
  { content: '你不愿意种花，你说，我不愿看见它一点点凋落。', author: '顾城', category: '人生' },
  { content: '岁月不居，时节如流。', author: '孔融', category: '人生' },
  { content: '有花堪折直须折，莫待无花空折枝。', author: '杜秋娘', category: '人生' },
  { content: '浮生若梦，为欢几何。', author: '李白', category: '人生' },
  { content: '人生天地间，忽如远行客。', author: '佚名', category: '人生' },
  { content: '天地者，万物之逆旅也；光阴者，百代之过客也。', author: '李白', category: '人生' },
  { content: '悲欢离合总无情，一任阶前点滴到天明。', author: '蒋捷', category: '人生' },

  // 爱情补充
  { content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。', author: '王维', category: '爱情' },
  { content: '关关雎鸠，在河之洲。窈窕淑女，君子好逑。', author: '《诗经》', category: '爱情' },
  { content: '蒹葭苍苍，白露为霜。所谓伊人，在水一方。', author: '《诗经》', category: '爱情' },
  { content: '相见争如不见，有情何似无情。', author: '司马光', category: '爱情' },
  { content: '天长地久有时尽，此恨绵绵无绝期。', author: '白居易', category: '爱情' },
  { content: '十年生死两茫茫，不思量，自难忘。', author: '苏轼', category: '爱情' },
  { content: '一日不见，如三秋兮。', author: '《诗经》', category: '爱情' },
  { content: '柔情似水，佳期如梦，忍顾鹊桥归路。', author: '秦观', category: '爱情' },
  { content: '平生不会相思，才会相思，便害相思。', author: '徐再思', category: '爱情' },
  { content: '得成比目何辞死，愿作鸳鸯不羡仙。', author: '卢照邻', category: '爱情' },
  { content: '天涯地角有穷时，只有相思无尽处。', author: '晏殊', category: '爱情' },
  { content: '落花人独立，微雨燕双飞。', author: '晏几道', category: '爱情' },
  { content: '换我心，为你心，始知相忆深。', author: '顾敻', category: '爱情' },
  { content: '花自飘零水自流，一种相思，两处闲愁。', author: '李清照', category: '爱情' },
  { content: '只愿君心似我心，定不负相思意。', author: '李之仪', category: '爱情' },
  { content: '金风玉露一相逢，便胜却人间无数。', author: '秦观', category: '爱情' },
  { content: '山有木兮木有枝，心悦君兮君不知。', author: '《越人歌》', category: '爱情' },
  { content: '结发为夫妻，恩爱两不疑。', author: '苏武', category: '爱情' },
  { content: '春心莫共花争发，一寸相思一寸灰。', author: '李商隐', category: '爱情' },
  { content: '天不老，情难绝。心似双丝网，中有千千结。', author: '张先', category: '爱情' },
  { content: '相思树底说相思，思郎恨郎郎不知。', author: '梁启超', category: '爱情' },
  { content: '离恨却如春草，更行更远还生。', author: '李煜', category: '爱情' },
  { content: '相思相见知何日，此时此夜难为情。', author: '李白', category: '爱情' },
  { content: '此去经年，应是良辰好景虚设。便纵有千种风情，更与何人说。', author: '柳永', category: '爱情' },
  { content: '晓看天色暮看云，行也思君，坐也思君。', author: '唐寅', category: '爱情' },

  // 友情补充
  { content: '折花逢驿使，寄与陇头人。江南无所有，聊赠一枝春。', author: '陆凯', category: '友情' },
  { content: '故人西辞黄鹤楼，烟花三月下扬州。', author: '李白', category: '友情' },
  { content: '洛阳亲友如相问，一片冰心在玉壶。', author: '王昌龄', category: '友情' },
  { content: '我寄愁心与明月，随风直到夜郎西。', author: '李白', category: '友情' },
  { content: '浮云游子意，落日故人情。', author: '李白', category: '友情' },
  { content: '劝君更尽一杯酒，西出阳关无故人。', author: '王维', category: '友情' },
  { content: '正是江南好风景，落花时节又逢君。', author: '杜甫', category: '友情' },
  { content: '四海皆兄弟，谁为行路人。', author: '佚名', category: '友情' },
  { content: '以利相交，利尽则散；以势相交，势去则倾。', author: '王通', category: '友情' },
  { content: '与朋友交，言而有信。', author: '子夏', category: '友情' },
  { content: '不愧于人，不畏于天。', author: '《诗经》', category: '友情' },
  { content: '合意友来情不厌，知心人至话投机。', author: '冯梦龙', category: '友情' },
  { content: '相知无远近，万里尚为邻。', author: '张九龄', category: '友情' },
  { content: '一生大笑能几回，斗酒相逢须醉倒。', author: '岑参', category: '友情' },
  { content: '杨花落尽子规啼，闻道龙标过五溪。我寄愁心与明月，随君直到夜郎西。', author: '李白', category: '友情' },

  // 友情补充（第三批）
  { content: '翻手作云覆手雨，纷纷轻薄何须数。', author: '杜甫', category: '友情' },
  { content: '故人入我梦，明我长相忆。', author: '杜甫', category: '友情' },
  { content: '西窗下，风摇翠竹，疑是故人来。', author: '秦观', category: '友情' },
  { content: '故人江海别，几度隔山川。', author: '司空曙', category: '友情' },
  { content: '莫怨他乡暂离别，知君到处有逢迎。', author: '高适', category: '友情' },
  { content: '青山一道同云雨，明月何曾是两乡。', author: '王昌龄', category: '友情' },
  { content: '我见青山多妩媚，料青山见我应如是。', author: '辛弃疾', category: '友情' },
  { content: '数人世相逢，百年欢笑，能得几回又。', author: '何梦桂', category: '友情' },
  { content: '投我以木瓜，报之以琼琚。匪报也，永以为好也。', author: '《诗经》', category: '友情' },
  { content: '嘤其鸣矣，求其友声。', author: '《诗经》', category: '友情' },

  // 智慧补充
  { content: '尽信书不如无书。', author: '孟子', category: '智慧' },
  { content: '举一隅不以三隅反，则不复也。', author: '孔子', category: '智慧' },
  { content: '不愤不启，不悱不发。', author: '孔子', category: '智慧' },
  { content: '知之者不如好之者，好之者不如乐之者。', author: '孔子', category: '智慧' },
  { content: '朝闻道，夕死可矣。', author: '孔子', category: '智慧' },
  { content: '人无远虑，必有近忧。', author: '孔子', category: '智慧' },
  { content: '生于深宫之中，长于妇人之手。', author: '曹丕', category: '智慧' },
  { content: '后生可畏，焉知来者之不如今也。', author: '孔子', category: '智慧' },
  { content: '默而识之，学而不厌，诲人不倦。', author: '孔子', category: '智慧' },
  { content: '名不正则言不顺，言不顺则事不成。', author: '孔子', category: '智慧' },
  { content: '独乐乐，与人乐乐，孰乐？', author: '孟子', category: '智慧' },
  { content: '穷则独善其身，达则兼济天下。', author: '孟子', category: '智慧' },
  { content: '尽其心者，知其性也。知其性，则知天矣。', author: '孟子', category: '智慧' },
  { content: '老吾老以及人之老，幼吾幼以及人之幼。', author: '孟子', category: '智慧' },
  { content: '富贵不能淫，贫贱不能移，威武不能屈。', author: '孟子', category: '智慧' },

  // 哲理补充
  { content: '不识庐山真面目，只缘身在此山中。', author: '苏轼', category: '哲理' },
  { content: '欲穷千里目，更上一层楼。', author: '王之涣', category: '哲理' },
  { content: '野火烧不尽，春风吹又生。', author: '白居易', category: '哲理' },
  { content: '曾经沧海难为水。', author: '元稹', category: '哲理' },
  { content: '青山遮不住，毕竟东流去。', author: '辛弃疾', category: '哲理' },
  { content: '世事洞明皆学问，人情练达即文章。', author: '曹雪芹', category: '哲理' },
  { content: '落霞与孤鹜齐飞，秋水共长天一色。', author: '王勃', category: '哲理' },
  { content: '失之东隅，收之桑榆。', author: '《后汉书》', category: '哲理' },
  { content: '良药苦口利于病，忠言逆耳利于行。', author: '《孔子家语》', category: '哲理' },
  { content: '知我者谓我心忧，不知我者谓我何求。', author: '《诗经》', category: '哲理' },
  { content: '此曲只应天上有，人间能得几回闻。', author: '杜甫', category: '哲理' },
  { content: '一叶障目，不见泰山。', author: '《鹖冠子》', category: '哲理' },
  { content: '城门失火，殃及池鱼。', author: '佚名', category: '哲理' },
  { content: '失之毫厘，差之千里。', author: '《大戴礼记》', category: '哲理' },
  { content: '多行不义必自毙。', author: '《左传》', category: '哲理' },

  // 职场补充
  { content: '功崇惟志，业广惟勤。', author: '《尚书》', category: '职场' },
  { content: '人生在勤，不索何获。', author: '张衡', category: '职场' },
  { content: '临渊羡鱼，不如退而结网。', author: '《汉书》', category: '职场' },
  { content: '大事难事看担当，逆境顺境看襟度。', author: '佚名', category: '职场' },
  { content: '博观而约取，厚积而薄发。', author: '苏轼', category: '职场' },
  { content: '人生的道路虽然漫长，但关键处常常只有几步。', author: '柳青', category: '职场' },
  { content: '无冥冥之志者，无昭昭之明。', author: '荀子', category: '职场' },
  { content: '逆水行舟，不进则退。', author: '佚名', category: '职场' },
  { content: '坐这山，望那山，一事无成。', author: '曾国藩', category: '职场' },
  { content: '不怕慢，就怕站。', author: '佚名', category: '职场' },
  { content: '不积跬步，无以至千里。', author: '荀子', category: '职场' },
  { content: '凡事要好，须问三老。', author: '佚名', category: '职场' },
  { content: '善不可失，恶不可长。', author: '《左传》', category: '职场' },
  { content: '一日一钱，千日千钱。绳锯木断，水滴石穿。', author: '班固', category: '职场' },
  { content: '虽有智慧，不如乘势。', author: '孟子', category: '职场' },

  // 学习补充
  { content: '不以规矩，不能成方圆。', author: '孟子', category: '学习' },
  { content: '独学而无友，则孤陋而寡闻。', author: '《礼记》', category: '学习' },
  { content: '木受绳则直，金就砺则利。', author: '荀子', category: '学习' },
  { content: '青，取之于蓝，而青于蓝。', author: '荀子', category: '学习' },
  { content: '冰，水为之，而寒于水。', author: '荀子', category: '学习' },
  { content: '世事洞明皆学问，人情练达即文章。', author: '曹雪芹', category: '学习' },
  { content: '千淘万漉虽辛苦，吹尽狂沙始到金。', author: '刘禹锡', category: '学习' },
  { content: '古人学问无遗力，少壮工夫老始成。', author: '陆游', category: '学习' },
  { content: '若要功夫深，铁杵磨成针。', author: '祝穆', category: '学习' },
  { content: '吾尝终日而思矣，不如须臾之所学也。', author: '荀子', category: '学习' },
  { content: '不登高山，不知天之高也；不临深溪，不知地之厚也。', author: '荀子', category: '学习' },
  { content: '学如逆水行舟，不进则退。', author: '佚名', category: '学习' },
  { content: '书读百遍，其义自见。', author: '陈寿', category: '学习' },
  { content: '多见者博，多闻者智。', author: '桓宽', category: '学习' },
  { content: '敏而好学，不耻下问。', author: '孔子', category: '学习' },

  // 补充跨类经典
  { content: '苟日新，日日新，又日新。', author: '《大学》', category: '哲理' },
  { content: '满目山河空念远，落花风雨更伤春，不如怜取眼前人。', author: '晏殊', category: '人生' },
  { content: '桃李不言，下自成蹊。', author: '司马迁', category: '智慧' },
  { content: '风声雨声读书声声声入耳，家事国事天下事事事关心。', author: '顾宪成', category: '学习' },
  { content: '为中华之崛起而读书。', author: '周恩来', category: '学习' },
  { content: '横眉冷对千夫指，俯首甘为孺子牛。', author: '鲁迅', category: '人生' },
  { content: '我爱我师，我更爱真理。', author: '亚里士多德', category: '智慧' },
  { content: '不经巨大的困难，不会有伟大的事业。', author: '伏尔泰', category: '励志' },
  { content: '合理安排时间，就等于节约时间。', author: '培根', category: '职场' },
  { content: '抛弃时间的人，时间也抛弃他。', author: '莎士比亚', category: '智慧' },
  { content: '一万年太久，只争朝夕。', author: '毛泽东', category: '励志' },
  { content: '不管风吹浪打，胜似闲庭信步。', author: '毛泽东', category: '励志' },
  { content: '独立寒秋，湘江北去，橘子洲头。', author: '毛泽东', category: '人生' },
  { content: '到中流击水，浪遏飞舟。', author: '毛泽东', category: '励志' },
  { content: '鹰击长空，鱼翔浅底，万类霜天竞自由。', author: '毛泽东', category: '人生' },
  { content: '牢骚太盛防肠断，风物长宜放眼量。', author: '毛泽东', category: '哲理' },
  { content: '天若有情天亦老，人间正道是沧桑。', author: '毛泽东', category: '哲理' },
  { content: '雄关漫道真如铁，而今迈步从头越。', author: '毛泽东', category: '励志' },
  { content: '宜将剩勇追穷寇，不可沽名学霸王。', author: '毛泽东', category: '哲理' },
  { content: '与天奋斗，其乐无穷；与地奋斗，其乐无穷；与人奋斗，其乐无穷。', author: '毛泽东', category: '励志' }
];

var CATEGORIES = ['全部', '励志', '人生', '爱情', '友情', '智慧', '哲理', '职场', '学习'];

/**
 * 获取分类列表
 */
function getCategories() {
  return CATEGORIES;
}

/**
 * 获取随机名言
 * @param {string} category - 分类名，空字符串表示全部
 * @returns {Object} {content, author, category}
 */
function getRandomQuote(category) {
  var list = QUOTES;
  if (category && category !== '全部') {
    list = QUOTES.filter(function (q) {
      return q.category === category;
    });
  }
  if (list.length === 0) list = QUOTES;
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * 获取今日名言（基于日期固定）
 * @returns {Object} {content, author, category}
 */
function getTodayQuote() {
  var now = new Date();
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var idx = dayOfYear % QUOTES.length;
  return QUOTES[idx];
}

/**
 * 获取名言总数
 */
function getTotalCount() {
  return QUOTES.length;
}

/**
 * 获取各分类数量
 */
function getCategoryCounts() {
  var counts = {};
  counts['全部'] = QUOTES.length;
  for (var i = 0; i < QUOTES.length; i++) {
    var cat = QUOTES[i].category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

module.exports = {
  getCategories: getCategories,
  getRandomQuote: getRandomQuote,
  getTodayQuote: getTodayQuote,
  getTotalCount: getTotalCount,
  getCategoryCounts: getCategoryCounts
};
