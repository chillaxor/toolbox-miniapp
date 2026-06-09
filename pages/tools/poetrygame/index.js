/**
 * 诗词飞花令 - 浏览与挑战模式
 * 内置 90+ 首经典诗词数据
 */

// ==================== 诗词数据库 ====================
var poems = [
  { title: '静夜思', author: '李白', dynasty: '唐', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
  { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  { title: '登鹳雀楼', author: '王之涣', dynasty: '唐', lines: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
  { title: '相思', author: '王维', dynasty: '唐', lines: ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'] },
  { title: '鹿柴', author: '王维', dynasty: '唐', lines: ['空山不见人', '但闻人语响', '返景入深林', '复照青苔上'] },
  { title: '竹里馆', author: '王维', dynasty: '唐', lines: ['独坐幽篁里', '弹琴复长啸', '深林人不知', '明月来相照'] },
  { title: '送别', author: '王维', dynasty: '唐', lines: ['山中相送罢', '日暮掩柴扉', '春草明年绿', '王孙归不归'] },
  { title: '鸟鸣涧', author: '王维', dynasty: '唐', lines: ['人闲桂花落', '夜静春山空', '月出惊山鸟', '时鸣春涧中'] },
  { title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', lines: ['独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人'] },
  { title: '送元二使安西', author: '王维', dynasty: '唐', lines: ['渭城朝雨浥轻尘', '客舍青青柳色新', '劝君更尽一杯酒', '西出阳关无故人'] },
  { title: '终南别业', author: '王维', dynasty: '唐', lines: ['中岁颇好道', '晚家南山陲', '兴来每独往', '胜事空自知', '行到水穷处', '坐看云起时', '偶然值林叟', '谈笑无还期'] },
  { title: '凉州词', author: '王之涣', dynasty: '唐', lines: ['黄河远上白云间', '一片孤城万仞山', '羌笛何须怨杨柳', '春风不度玉门关'] },
  { title: '望庐山瀑布', author: '李白', dynasty: '唐', lines: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
  { title: '赠汪伦', author: '李白', dynasty: '唐', lines: ['李白乘舟将欲行', '忽闻岸上踏歌声', '桃花潭水深千尺', '不及汪伦送我情'] },
  { title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', lines: ['故人西辞黄鹤楼', '烟花三月下扬州', '孤帆远影碧空尽', '唯见长江天际流'] },
  { title: '早发白帝城', author: '李白', dynasty: '唐', lines: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },
  { title: '独坐敬亭山', author: '李白', dynasty: '唐', lines: ['众鸟高飞尽', '孤云独去闲', '相看两不厌', '只有敬亭山'] },
  { title: '望天门山', author: '李白', dynasty: '唐', lines: ['天门中断楚江开', '碧水东流至此回', '两岸青山相对出', '孤帆一片日边来'] },
  { title: '渡荆门送别', author: '李白', dynasty: '唐', lines: ['渡远荆门外', '来从楚国游', '山随平野尽', '江入大荒流', '月下飞天镜', '云生结海楼', '仍怜故乡水', '万里送行舟'] },
  { title: '关山月', author: '李白', dynasty: '唐', lines: ['明月出天山', '苍茫云海间', '长风几万里', '吹度玉门关', '汉下白登道', '胡窥青海湾', '由来征战地', '不见有人还'] },
  { title: '古朗月行', author: '李白', dynasty: '唐', lines: ['小时不识月', '呼作白玉盘', '又疑瑶台镜', '飞在青云端', '仙人垂两足', '桂树何团团', '白兔捣药成', '问言与谁餐'] },
  { title: '春望', author: '杜甫', dynasty: '唐', lines: ['国破山河在', '城春草木深', '感时花溅泪', '恨别鸟惊心', '烽火连三月', '家书抵万金', '白头搔更短', '浑欲不胜簪'] },
  { title: '绝句', author: '杜甫', dynasty: '唐', lines: ['迟日江山丽', '春风花草香', '泥融飞燕子', '沙暖睡鸳鸯'] },
  { title: '登高', author: '杜甫', dynasty: '唐', lines: ['风急天高猿啸哀', '渚清沙白鸟飞回', '无边落木萧萧下', '不尽长江滚滚来', '万里悲秋常作客', '百年多病独登台', '艰难苦恨繁霜鬓', '潦倒新停浊酒杯'] },
  { title: '春夜喜雨', author: '杜甫', dynasty: '唐', lines: ['好雨知时节', '当春乃发生', '随风潜入夜', '润物细无声', '野径云俱黑', '江船火独明', '晓看红湿处', '花重锦官城'] },
  { title: '江南逢李龟年', author: '杜甫', dynasty: '唐', lines: ['岐王宅里寻常见', '崔九堂前几度闻', '正是江南好风景', '落花时节又逢君'] },
  { title: '江畔独步寻花', author: '杜甫', dynasty: '唐', lines: ['黄四娘家花满蹊', '千朵万朵压枝低', '留连戏蝶时时舞', '自在娇莺恰恰啼'] },
  { title: '闻官军收河南河北', author: '杜甫', dynasty: '唐', lines: ['剑外忽传收蓟北', '初闻涕泪满衣裳', '却看妻子愁何在', '漫卷诗书喜欲狂', '白日放歌须纵酒', '青春作伴好还乡', '即从巴峡穿巫峡', '便下襄阳向洛阳'] },
  { title: '望岳', author: '杜甫', dynasty: '唐', lines: ['岱宗夫如何', '齐鲁青未了', '造化钟神秀', '阴阳割昏晓', '荡胸生曾云', '决眦入归鸟', '会当凌绝顶', '一览众山小'] },
  { title: '赋得古原草送别', author: '白居易', dynasty: '唐', lines: ['离离原上草', '一岁一枯荣', '野火烧不尽', '春风吹又生', '远芳侵古道', '晴翠接荒城', '又送王孙去', '萋萋满别情'] },
  { title: '暮江吟', author: '白居易', dynasty: '唐', lines: ['一道残阳铺水中', '半江瑟瑟半江红', '可怜九月初三夜', '露似真珠月似弓'] },
  { title: '问刘十九', author: '白居易', dynasty: '唐', lines: ['绿蚁新醅酒', '红泥小火炉', '晚来天欲雪', '能饮一杯无'] },
  { title: '无题', author: '李商隐', dynasty: '唐', lines: ['相见时难别亦难', '东风无力百花残', '春蚕到死丝方尽', '蜡炬成灰泪始干', '晓镜但愁云鬓改', '夜吟应觉月光寒', '蓬山此去无多路', '青鸟殷勤为探看'] },
  { title: '夜雨寄北', author: '李商隐', dynasty: '唐', lines: ['君问归期未有期', '巴山夜雨涨秋池', '何当共剪西窗烛', '却话巴山夜雨时'] },
  { title: '乐游原', author: '李商隐', dynasty: '唐', lines: ['向晚意不适', '驱车登古原', '夕阳无限好', '只是近黄昏'] },
  { title: '锦瑟', author: '李商隐', dynasty: '唐', lines: ['锦瑟无端五十弦', '一弦一柱思华年', '庄生晓梦迷蝴蝶', '望帝春心托杜鹃', '沧海月明珠有泪', '蓝田日暖玉生烟', '此情可待成追忆', '只是当时已惘然'] },
  { title: '清明', author: '杜牧', dynasty: '唐', lines: ['清明时节雨纷纷', '路上行人欲断魂', '借问酒家何处有', '牧童遥指杏花村'] },
  { title: '山行', author: '杜牧', dynasty: '唐', lines: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
  { title: '秋夕', author: '杜牧', dynasty: '唐', lines: ['银烛秋光冷画屏', '轻罗小扇扑流萤', '天阶夜色凉如水', '卧看牵牛织女星'] },
  { title: '出塞', author: '王昌龄', dynasty: '唐', lines: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'] },
  { title: '芙蓉楼送辛渐', author: '王昌龄', dynasty: '唐', lines: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'] },
  { title: '别董大', author: '高适', dynasty: '唐', lines: ['千里黄云白日曛', '北风吹雁雪纷纷', '莫愁前路无知己', '天下谁人不识君'] },
  { title: '枫桥夜泊', author: '张继', dynasty: '唐', lines: ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'] },
  { title: '早春呈水部张十八员外', author: '韩愈', dynasty: '唐', lines: ['天街小雨润如酥', '草色遥看近却无', '最是一年春好处', '绝胜烟柳满皇都'] },
  { title: '江雪', author: '柳宗元', dynasty: '唐', lines: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'] },
  { title: '回乡偶书', author: '贺知章', dynasty: '唐', lines: ['少小离家老大回', '乡音无改鬓毛衰', '儿童相见不相识', '笑问客从何处来'] },
  { title: '咏柳', author: '贺知章', dynasty: '唐', lines: ['碧玉妆成一树高', '万条垂下绿丝绦', '不知细叶谁裁出', '二月春风似剪刀'] },
  { title: '游子吟', author: '孟郊', dynasty: '唐', lines: ['慈母手中线', '游子身上衣', '临行密密缝', '意恐迟迟归', '谁言寸草心', '报得三春晖'] },
  { title: '乌衣巷', author: '刘禹锡', dynasty: '唐', lines: ['朱雀桥边野草花', '乌衣巷口夕阳斜', '旧时王谢堂前燕', '飞入寻常百姓家'] },
  { title: '悯农（其二）', author: '李绅', dynasty: '唐', lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
  { title: '滁州西涧', author: '韦应物', dynasty: '唐', lines: ['独怜幽草涧边生', '上有黄鹂深树鸣', '春潮带雨晚来急', '野渡无人舟自横'] },
  { title: '塞下曲', author: '卢纶', dynasty: '唐', lines: ['月黑雁飞高', '单于夜遁逃', '欲将轻骑逐', '大雪满弓刀'] },
  { title: '小儿垂钓', author: '胡令能', dynasty: '唐', lines: ['蓬头稚子学垂纶', '侧坐莓苔草映身', '路人借问遥招手', '怕得鱼惊不应人'] },
  { title: '寻隐者不遇', author: '贾岛', dynasty: '唐', lines: ['松下问童子', '言师采药去', '只在此山中', '云深不知处'] },
  { title: '行路难', author: '李白', dynasty: '唐', lines: ['金樽清酒斗十千', '玉盘珍羞直万钱', '停杯投箸不能食', '拔剑四顾心茫然', '欲渡黄河冰塞川', '将登太行雪满山', '闲来垂钓碧溪上', '忽复乘舟梦日边', '行路难', '行路难', '多歧路', '今安在', '长风破浪会有时', '直挂云帆济沧海'] },
  { title: '望月怀远', author: '张九龄', dynasty: '唐', lines: ['海上生明月', '天涯共此时', '情人怨遥夜', '竟夕起相思', '灭烛怜光满', '披衣觉露滋', '不堪盈手赠', '还寝梦佳期'] },
  { title: '送杜少府之任蜀州', author: '王勃', dynasty: '唐', lines: ['城阙辅三秦', '风烟望五津', '与君离别意', '同是宦游人', '海内存知己', '天涯若比邻', '无为在歧路', '儿女共沾巾'] },
  { title: '登幽州台歌', author: '陈子昂', dynasty: '唐', lines: ['前不见古人', '后不见来者', '念天地之悠悠', '独怆然而涕下'] },
  { title: '题西林壁', author: '苏轼', dynasty: '宋', lines: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'] },
  { title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', lines: ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'] },
  { title: '惠崇春江晚景', author: '苏轼', dynasty: '宋', lines: ['竹外桃花三两枝', '春江水暖鸭先知', '蒌蒿满地芦芽短', '正是河豚欲上时'] },
  { title: '水调歌头·明月几时有', author: '苏轼', dynasty: '宋', lines: ['明月几时有', '把酒问青天', '不知天上宫阙', '今夕是何年', '我欲乘风归去', '又恐琼楼玉宇', '高处不胜寒', '起舞弄清影', '何似在人间', '转朱阁', '低绮户', '照无眠', '不应有恨', '何事长向别时圆', '人有悲欢离合', '月有阴晴圆缺', '此事古难全', '但愿人长久', '千里共婵娟'] },
  { title: '元日', author: '王安石', dynasty: '宋', lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
  { title: '泊船瓜洲', author: '王安石', dynasty: '宋', lines: ['京口瓜洲一水间', '钟山只隔数重山', '春风又绿江南岸', '明月何时照我还'] },
  { title: '示儿', author: '陆游', dynasty: '宋', lines: ['死去元知万事空', '但悲不见九州同', '王师北定中原日', '家祭无忘告乃翁'] },
  { title: '游山西村', author: '陆游', dynasty: '宋', lines: ['莫笑农家腊酒浑', '丰年留客足鸡豚', '山重水复疑无路', '柳暗花明又一村', '箫鼓追随春社近', '衣冠简朴古风存', '从今若许闲乘月', '拄杖无时夜叩门'] },
  { title: '十一月四日风雨大作', author: '陆游', dynasty: '宋', lines: ['僵卧孤村不自哀', '尚思为国戍轮台', '夜阑卧听风吹雨', '铁马冰河入梦来'] },
  { title: '小池', author: '杨万里', dynasty: '宋', lines: ['泉眼无声惜细流', '树阴照水爱晴柔', '小荷才露尖尖角', '早有蜻蜓立上头'] },
  { title: '晓出净慈寺送林子方', author: '杨万里', dynasty: '宋', lines: ['毕竟西湖六月中', '风光不与四时同', '接天莲叶无穷碧', '映日荷花别样红'] },
  { title: '游园不值', author: '叶绍翁', dynasty: '宋', lines: ['应怜屐齿印苍苔', '小扣柴扉久不开', '春色满园关不住', '一枝红杏出墙来'] },
  { title: '春日', author: '朱熹', dynasty: '宋', lines: ['胜日寻芳泗水滨', '无边光景一时新', '等闲识得东风面', '万紫千红总是春'] },
  { title: '题临安邸', author: '林升', dynasty: '宋', lines: ['山外青山楼外楼', '西湖歌舞几时休', '暖风熏得游人醉', '直把杭州作汴州'] },
  { title: '夏日绝句', author: '李清照', dynasty: '宋', lines: ['生当作人杰', '死亦为鬼雄', '至今思项羽', '不肯过江东'] },
  { title: '过零丁洋', author: '文天祥', dynasty: '宋', lines: ['辛苦遭逢起一经', '干戈寥落四周星', '山河破碎风飘絮', '身世浮沉雨打萍', '惶恐滩头说惶恐', '零丁洋里叹零丁', '人生自古谁无死', '留取丹心照汗青'] },
  { title: '青玉案·元夕', author: '辛弃疾', dynasty: '宋', lines: ['东风夜放花千树', '更吹落星如雨', '宝马雕车香满路', '凤箫声动', '玉壶光转', '一夜鱼龙舞', '蛾儿雪柳黄金缕', '笑语盈盈暗香去', '众里寻他千百度', '蓦然回首', '那人却在', '灯火阑珊处'] },
  { title: '短歌行', author: '曹操', dynasty: '汉', lines: ['对酒当歌', '人生几何', '譬如朝露', '去日苦多', '慨当以慷', '忧思难忘', '何以解忧', '唯有杜康'] },
  { title: '饮酒·其五', author: '陶渊明', dynasty: '晋', lines: ['结庐在人境', '而无车马喧', '问君何能尔', '心远地自偏', '采菊东篱下', '悠然见南山', '山气日夕佳', '飞鸟相与还', '此中有真意', '欲辨已忘言'] },
  { title: '长歌行', author: '汉乐府', dynasty: '汉', lines: ['青青园中葵', '朝露待日晞', '阳春布德泽', '万物生光辉', '常恐秋节至', '焜黄华叶衰', '百川东到海', '何时复西归', '少壮不努力', '老大徒伤悲'] },
  { title: '七步诗', author: '曹植', dynasty: '魏', lines: ['煮豆持作羹', '漉菽以为汁', '萁在釜下燃', '豆在釜中泣', '本自同根生', '相煎何太急'] },
  { title: '敕勒歌', author: '北朝民歌', dynasty: '南北朝', lines: ['敕勒川', '阴山下', '天似穹庐', '笼盖四野', '天苍苍', '野茫茫', '风吹草低见牛羊'] },
  { title: '登飞来峰', author: '王安石', dynasty: '宋', lines: ['飞来山上千寻塔', '闻说鸡鸣见日升', '不畏浮云遮望眼', '自缘身在最高层'] },
  { title: '回乡偶书（其二）', author: '贺知章', dynasty: '唐', lines: ['离别家乡岁月多', '近来人事半消磨', '惟有门前镜湖水', '春风不改旧时波'] },
  { title: '秋浦歌', author: '李白', dynasty: '唐', lines: ['白发三千丈', '缘愁似个长', '不知明镜里', '何处得秋霜'] },
  { title: '夜宿山寺', author: '李白', dynasty: '唐', lines: ['危楼高百尺', '手可摘星辰', '不敢高声语', '恐惊天上人'] },
  { title: '春夜洛城闻笛', author: '李白', dynasty: '唐', lines: ['谁家玉笛暗飞声', '散入春风满洛城', '此夜曲中闻折柳', '何人不起故园情'] },
  { title: '逢雪宿芙蓉山主人', author: '刘长卿', dynasty: '唐', lines: ['日暮苍山远', '天寒白屋贫', '柴门闻犬吠', '风雪夜归人'] },
  { title: '望洞庭', author: '刘禹锡', dynasty: '唐', lines: ['湖光秋月两相和', '潭面无风镜未磨', '遥望洞庭山水翠', '白银盘里一青螺'] },
  { title: '石灰吟', author: '于谦', dynasty: '明', lines: ['千锤万凿出深山', '烈火焚烧若等闲', '粉骨碎身浑不怕', '要留清白在人间'] },
  { title: '竹石', author: '郑燮', dynasty: '清', lines: ['咬定青山不放松', '立根原在破岩中', '千磨万击还坚劲', '任尔东西南北风'] },
  { title: '己亥杂诗', author: '龚自珍', dynasty: '清', lines: ['九州生气恃风雷', '万马齐喑究可哀', '我劝天公重抖擞', '不拘一格降人才'] },
  { title: '所见', author: '袁枚', dynasty: '清', lines: ['牧童骑黄牛', '歌声振林樾', '意欲捕鸣蝉', '忽然闭口立'] },
  { title: '村居', author: '高鼎', dynasty: '清', lines: ['草长莺飞二月天', '拂堤杨柳醉春烟', '儿童散学归来早', '忙趁东风放纸鸢'] },
  { title: '墨梅', author: '王冕', dynasty: '元', lines: ['吾家洗砚池头树', '朵朵花开淡墨痕', '不要人夸好颜色', '只留清气满乾坤'] },
  { title: '乡村四月', author: '翁卷', dynasty: '宋', lines: ['绿遍山原白满川', '子规声里雨如烟', '乡村四月闲人少', '才了蚕桑又插田'] },
  { title: '四时田园杂兴', author: '范成大', dynasty: '宋', lines: ['昼出耘田夜绩麻', '村庄儿女各当家', '童孙未解供耕织', '也傍桑阴学种瓜'] }
];

// ==================== 飞花令字符集 ====================
var feihualing = ['月', '花', '风', '雨', '雪', '春', '秋', '山', '水', '云', '日', '夜', '人', '天', '酒', '梦', '心', '情', '红', '白'];

// ==================== 工具函数 ====================

/**
 * 将诗句文本按目标字拆分为段落
 * 返回 [{type:'normal',text:'xxx'}, {type:'hl',text:'月'}, ...]
 */
function splitLine(line, char) {
  var parts = [];
  var i = 0;
  var len = line.length;
  var buf = '';
  while (i < len) {
    if (line[i] === char) {
      if (buf) {
        parts.push({ type: 'normal', text: buf, partIdx: parts.length });
        buf = '';
      }
      parts.push({ type: 'hl', text: char, partIdx: parts.length });
    } else {
      buf += line[i];
    }
    i++;
  }
  if (buf) {
    parts.push({ type: 'normal', text: buf, partIdx: parts.length });
  }
  return parts;
}

/**
 * 查找诗词中包含指定字的所有诗句行，并做高亮拆分
 */
function findMatchingLines(poem, char) {
  var result = [];
  var i = 0;
  for (i = 0; i < poem.lines.length; i++) {
    if (poem.lines[i].indexOf(char) !== -1) {
      result.push({
        lineIdx: i,
        parts: splitLine(poem.lines[i], char)
      });
    }
  }
  return result;
}

/**
 * 筛选包含指定字的诗词列表
 */
function filterPoems(char) {
  var result = [];
  var i = 0;
  for (i = 0; i < poems.length; i++) {
    var matchingLines = findMatchingLines(poems[i], char);
    if (matchingLines.length > 0) {
      result.push({
        idx: i,
        title: poems[i].title,
        author: poems[i].author,
        dynasty: poems[i].dynasty,
        matchingLines: matchingLines
      });
    }
  }
  return result;
}

// ==================== 页面逻辑 ====================
Page({
  data: {
    // 基础数据
    characters: feihualing,
    // 浏览模式
    mode: 'browse',
    selectedChar: '',
    matchingPoems: [],
    // 挑战模式
    gameActive: false,
    gameOver: false,
    gameChar: '',
    timer: 30,
    score: 0,
    round: 1,
    totalRounds: 10,
    hintCount: 0,
    revealedHints: [],
    // 内部数据：当前挑战字对应的所有匹配诗词
    _gameMatches: [],
    _hintIndex: 0
  },

  _timerId: null,

  onLoad: function () {
    // 默认选择第一个字
    this.onCharSelect({ currentTarget: { dataset: { char: '月' } } });
  },

  onUnload: function () {
    this.clearTimer();
  },

  // ==================== 模式切换 ====================
  switchToBrowse: function () {
    this.clearTimer();
    this.setData({ mode: 'browse', gameActive: false, gameOver: false });
  },

  switchToGame: function () {
    this.setData({ mode: 'game', gameActive: false, gameOver: false });
  },

  // ==================== 字符选择 ====================
  onCharSelect: function (e) {
    var char = e.currentTarget.dataset.char;
    var matching = filterPoems(char);
    this.setData({
      selectedChar: char,
      matchingPoems: matching
    });
  },

  onRandomChar: function () {
    var idx = Math.floor(Math.random() * feihualing.length);
    var char = feihualing[idx];
    var matching = filterPoems(char);
    this.setData({
      selectedChar: char,
      matchingPoems: matching
    });
  },

  // ==================== 挑战模式 ====================
  startGame: function () {
    this.clearTimer();
    var charIdx = Math.floor(Math.random() * feihualing.length);
    var char = feihualing[charIdx];
    var matches = filterPoems(char);

    this.setData({
      gameActive: true,
      gameOver: false,
      gameChar: char,
      timer: 30,
      score: 0,
      round: 1,
      totalRounds: 10,
      hintCount: 0,
      revealedHints: [],
      _gameMatches: matches,
      _hintIndex: 0
    });

    this.startTimer();
  },

  startTimer: function () {
    var that = this;
    this.clearTimer();
    this._timerId = setInterval(function () {
      var t = that.data.timer - 1;
      if (t <= 0) {
        that.clearTimer();
        that.setData({ timer: 0 });
        // 超时自动进入下一轮
        that.nextRound();
      } else {
        that.setData({ timer: t });
      }
    }, 1000);
  },

  clearTimer: function () {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  },

  giveHint: function () {
    var matches = this.data._gameMatches;
    var hintIdx = this.data._hintIndex;
    var revealed = this.data.revealedHints;

    if (hintIdx >= matches.length) {
      wx.showToast({ title: '没有更多提示了', icon: 'none' });
      return;
    }

    // 取该诗词的所有匹配行
    var poem = matches[hintIdx];
    var i = 0;
    var newRevealed = revealed.slice();
    for (i = 0; i < poem.matchingLines.length; i++) {
      newRevealed.push({
        parts: poem.matchingLines[i].parts,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        idx: newRevealed.length
      });
    }

    this.setData({
      hintCount: this.data.hintCount + 1,
      revealedHints: newRevealed,
      _hintIndex: hintIdx + 1
    });
  },

  nextRound: function () {
    this.clearTimer();
    var curRound = this.data.round;
    var total = this.data.totalRounds;

    // 本轮得分：基础10分，每个提示扣2分
    var roundScore = 10 - this.data.revealedHints.length * 2;
    if (roundScore < 1) roundScore = 1;
    var newScore = this.data.score + roundScore;

    if (curRound >= total) {
      // 挑战结束
      this.setData({
        gameActive: false,
        gameOver: true,
        score: newScore
      });
      return;
    }

    // 下一轮：随机选一个新字（尽量不与上一轮重复）
    var newChar = this.pickNewChar(this.data.gameChar);
    var matches = filterPoems(newChar);

    this.setData({
      round: curRound + 1,
      gameChar: newChar,
      timer: 30,
      score: newScore,
      revealedHints: [],
      _gameMatches: matches,
      _hintIndex: 0
    });

    this.startTimer();
  },

  pickNewChar: function (excludeChar) {
    var pool = [];
    var i = 0;
    for (i = 0; i < feihualing.length; i++) {
      if (feihualing[i] !== excludeChar) {
        pool.push(feihualing[i]);
      }
    }
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }
});
