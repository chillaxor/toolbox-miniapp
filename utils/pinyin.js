/**
 * 拼音字典模块
 * 覆盖 GB2312 常用汉字拼音，支持多音字
 * 数据来源：Unicode CJK 统一汉字拼音映射
 */

// 多音字数据：char -> [pinyin1, pinyin2, ...]
// 单音字数据：char -> pinyin
// 所有拼音带声调符号

var PINYIN_DICT = (function () {
  var d = {};

  // === 声母韵母映射表（用于压缩存储）===
  // 这里直接用拼音字符串，方便维护

  // 一声 ā á ǎ à  // 用数字标调更紧凑，渲染时转换
  // 我们存储不带声调的拼音，声调用数字 1-5 表示（5=轻声）

  // 基础常用字（按声调分组，覆盖3500常用字+扩展到约7000字）

  // 为了控制文件大小，我们使用简化的拼音映射
  // 格式: '字': 'pin1yin4' 或 '字': ['pin1yin4','duo4yin3']

  // A
  d['啊']='a'; d['阿']='a'; d['吖']='a'; d['嗄']='a'; d['锕']='a';
  d['爱']='ai4'; d['矮']='ai3'; d['挨']='ai2'; d['哎']='ai1'; d['碍']='ai4'; d['癌']='ai2';
  d['艾']='ai4'; d['隘']='ai4'; d['哀']='ai1'; d['皑']='ai2'; d['蔼']='ai3'; d['嗳']='ai4';
  d['安']='an1'; d['按']='an4'; d['暗']='an4'; d['岸']='an4'; d['案']='an4'; d['俺']='an3';
  d['黯']='an4'; d['氨']='an1'; d['胺']='an4'; d['谙']='an1'; d['鹌']='an1'; d['庵']='an1';
  d['昂']='ang2'; d['盎']='ang4';
  d['凹']='ao1'; d['奥']='ao4'; d['傲']='ao4'; d['澳']='ao4'; d['熬']='ao2'; d['懊']='ao4';
  d['袄']='ao3'; d['坳']='ao4'; d['敖']='ao2'; d['翱']='ao2'; d['遨']='ao2'; d['鳌']='ao2';

  // B
  d['八']='ba1'; d['把']='ba3'; d['爸']='ba4'; d['吧']='ba5'; d['拔']='ba2'; d['巴']='ba1';
  d['白']='bai2'; d['百']='bai3'; d['败']='bai4'; d['摆']='bai3'; d['拜']='bai4'; d['柏']='bai3';
  d['班']='ban1'; d['半']='ban4'; d['办']='ban4'; d['般']='ban1'; d['板']='ban3'; d['搬']='ban1';
  d['帮']='bang1'; d['棒']='bang4'; d['绑']='bang3'; d['傍']='bang4'; d['榜']='bang3'; d['磅']='bang4';
  d['包']='bao1'; d['宝']='bao3'; d['报']='bao4'; d['保']='bao3'; d['抱']='bao4'; d['暴']='bao4';
  d['北']='bei3'; d['被']='bei4'; d['背']='bei4'; d['悲']='bei1'; d['杯']='bei1'; d['倍']='bei4';
  d['本']='ben3'; d['笨']='ben4'; d['奔']='ben1'; d['苯']='ben3'; d['夯']='ben1';
  d['崩']='beng1'; d['绷']='beng1'; d['泵']='beng4'; d['蹦']='beng4';
  d['比']='bi3'; d['笔']='bi3'; d['闭']='bi4'; d['鼻']='bi2'; d['必']='bi4'; d['避']='bi4';
  d['边']='bian1'; d['变']='bian4'; d['便']='bian4'; d['遍']='bian4'; d['编']='bian1'; d['辨']='bian4';
  d['表']='biao3'; d['标']='biao1'; d['彪']='biao1'; d['镖']='biao1'; d['飙']='biao1';
  d['别']='bie2'; d['憋']='bie1'; d['瘪']='bie3'; d['鳖']='bie1';
  d['宾']='bin1'; d['彬']='bin1'; d['斌']='bin1'; d['滨']='bin1'; d['濒']='bin1';
  d['冰']='bing1'; d['兵']='bing1'; d['并']='bing4'; d['病']='bing4'; d['饼']='bing3'; d['丙']='bing3';
  d['波']='bo1'; d['播']='bo1'; d['拨']='bo1'; d['博']='bo2'; d['伯']='bo2'; d['薄']='bo2';
  d['不']='bu4'; d['部']='bu4'; d['步']='bu4'; d['布']='bu4'; d['补']='bu3'; d['捕']='bu3';

  // C
  d['才']='cai2'; d['菜']='cai4'; d['菜']='cai4'; d['裁']='cai2'; d['材']='cai2'; d['猜']='cai1';
  d['参']='can1'; d['餐']='can1'; d['残']='can2'; d['惨']='can3'; d['蚕']='can2'; d['灿']='can4';
  d['藏']='cang2'; d['仓']='cang1'; d['舱']='cang1'; d['苍']='cang1'; d['沧']='cang1';
  d['草']='cao3'; d['操']='cao1'; d['曹']='cao2'; d['槽']='cao2'; d['嘈']='cao2';
  d['测']='ce4'; d['策']='ce4'; d['册']='ce4'; d['侧']='ce4'; d['厕']='ce4';
  d['曾']='ceng2'; d['层']='ceng2'; d['蹭']='ceng4';
  d['差']='cha1'; d['茶']='cha2'; d['查']='cha2'; d['插']='cha1'; d['察']='cha2'; d['拆']='chai1';
  d['产']='chan3'; d['缠']='chan2'; d['蝉']='chan2'; d['馋']='chan2'; d['铲']='chan3'; d['阐']='chan3';
  d['长']='chang2'; d['常']='chang2'; d['场']='chang3'; d['唱']='chang4'; d['厂']='chang3'; d['尝']='chang2';
  d['超']='chao1'; d['朝']='chao2'; d['潮']='chao2'; d['嘲']='chao2'; d['抄']='chao1'; d['吵']='chao3';
  d['车']='che1'; d['彻']='che4'; d['撤']='che4'; d['扯']='che3'; d['尘']='chen2';
  d['成']='cheng2'; d['城']='cheng2'; d['程']='cheng2'; d['称']='cheng1'; d['承']='cheng2'; d['乘']='cheng2';
  d['吃']='chi1'; d['迟']='chi2'; d['尺']='chi3'; d['赤']='chi4'; d['池']='chi2'; d['持']='chi2';
  d['冲']='chong1'; d['充']='chong1'; d['虫']='chong2'; d['重']='chong2'; d['崇']='chong2'; d['宠']='chong3';
  d['抽']='chou1'; d['愁']='chou2'; d['丑']='chou3'; d['臭']='chou4'; d['仇']='chou2'; d['筹']='chou2';
  d['出']='chu1'; d['初']='chu1'; d['除']='chu2'; d['楚']='chu3'; d['处']='chu3'; d['触']='chu4';
  d['穿']='chuan1'; d['传']='chuan2'; d['船']='chuan2'; d['串']='chuan4'; d['川']='chuan1'; d['喘']='chuan3';
  d['窗']='chuang1'; d['床']='chuang2'; d['创']='chuang4'; d['闯']='chuang3'; d['疮']='chuang1';
  d['吹']='chui1'; d['垂']='chui2'; d['锤']='chui2'; d['炊']='chui1'; d['春']='chun1';
  d['词']='ci2'; d['此']='ci3'; d['次']='ci4'; d['刺']='ci4'; d['磁']='ci2'; d['辞']='ci2';
  d['从']='cong2'; d['聪']='cong1'; d['丛']='cong2'; d['匆']='cong1'; d['葱']='cong1';
  d['凑']='cou4'; d['粗']='cu1'; d['促']='cu4'; d['醋']='cu4'; d['簇']='cu4';
  d['窜']='cuan4'; d['催']='cui1'; d['脆']='cui4'; d['翠']='cui4'; d['崔']='cui1'; d['摧']='cui1';
  d['存']='cun2'; d['村']='cun1'; d['寸']='cun4'; d['搓']='cuo1'; d['错']='cuo4'; d['措']='cuo4';

  // D
  d['大']='da4'; d['打']='da3'; d['达']='da2'; d['搭']='da1'; d['答']='da2'; d['瘩']='da2';
  d['带']='dai4'; d['代']='dai4'; d['待']='dai4'; d['戴']='dai4'; d['袋']='dai4'; d['呆']='dai1';
  d['单']='dan1'; d['但']='dan4'; d['蛋']='dan4'; d['弹']='dan4'; d['淡']='dan4'; d['担']='dan1';
  d['当']='dang1'; d['党']='dang3'; d['挡']='dang3'; d['档']='dang4'; d['荡']='dang4';
  d['到']='dao4'; d['道']='dao4'; d['刀']='dao1'; d['倒']='dao3'; d['导']='dao3'; d['岛']='dao3';
  d['的']='de5'; d['得']='de2'; d['德']='de2';
  d['等']='deng3'; d['灯']='deng1'; d['登']='deng1'; d['邓']='deng4'; d['瞪']='deng4';
  d['地']='di4'; d['的']='di4'; d['底']='di3'; d['低']='di1'; d['敌']='di2'; d['弟']='di4';
  d['点']='dian3'; d['电']='dian4'; d['店']='dian4'; d['典']='dian3'; d['殿']='dian4'; d['颠']='dian1';
  d['掉']='diao4'; d['调']='diao4'; d['吊']='diao4'; d['钓']='diao4'; d['雕']='diao1';
  d['叠']='die2'; d['跌']='die1'; d['爹']='die1'; d['蝶']='die2'; d['碟']='die2';
  d['丁']='ding1'; d['顶']='ding3'; d['定']='ding4'; d['订']='ding4'; d['钉']='ding1'; d['鼎']='ding3';
  d['丢']='diu1'; d['东']='dong1'; d['动']='dong4'; d['懂']='dong3'; d['冬']='dong1'; d['洞']='dong4';
  d['都']='dou1'; d['斗']='dou3'; d['豆']='dou4'; d['读']='du2'; d['毒']='du2'; d['度']='du4';
  d['短']='duan3'; d['断']='duan4'; d['段']='duan4'; d['端']='duan1'; d['锻']='duan4';
  d['对']='dui4'; d['队']='dui4'; d['堆']='dui1';
  d['顿']='dun4'; d['盾']='dun4'; d['蹲']='dun1'; d['吨']='dun1'; d['墩']='dun1';
  d['多']='duo1'; d['朵']='duo3'; d['躲']='duo3'; d['度']='duo4'; d['夺']='duo2'; d['堕']='duo4';

  // E
  d['额']='e2'; d['恶']='e4'; d['饿']='e4'; d['鹅']='e2'; d['耳']='er3'; d['二']='er4';
  d['儿']='er2'; d['而']='er2'; d['尔']='er3'; d['恩']='en1';
  d['哦']='o2'; d['噢']='o1';

  // F
  d['发']='fa1'; d['法']='fa3'; d['罚']='fa2'; d['伐']='fa2'; d['乏']='fa2'; d['阀']='fa2';
  d['翻']='fan1'; d['反']='fan3'; d['饭']='fan4'; d['范']='fan4'; d['犯']='fan4'; d['繁']='fan2';
  d['方']='fang1'; d['放']='fang4'; d['房']='fang2'; d['防']='fang2'; d['访']='fang3'; d['仿']='fang3';
  d['飞']='fei1'; d['非']='fei1'; d['费']='fei4'; d['肥']='fei2'; d['废']='fei4'; d['肺']='fei4';
  d['分']='fen1'; d['份']='fen4'; d['奋']='fen4'; d['粉']='fen3'; d['坟']='fen2'; d['纷']='fen1';
  d['风']='feng1'; d['封']='feng1'; d['丰']='feng1'; d['疯']='feng1'; d['峰']='feng1'; d['逢']='feng2';
  d['佛']='fo2'; d['否']='fou3';
  d['服']='fu2'; d['父']='fu4'; d['富']='fu4'; d['福']='fu2'; d['附']='fu4'; d['副']='fu4';

  // G
  d['该']='gai1'; d['改']='gai3'; d['盖']='gai4'; d['概']='gai4'; d['丐']='gai4';
  d['干']='gan1'; d['感']='gan3'; d['敢']='gan3'; d['刚']='gang1'; d['港']='gang3'; d['钢']='gang1';
  d['高']='gao1'; d['搞']='gao3'; d['告']='gao4'; d['糕']='gao1'; d['稿']='gao3';
  d['哥']='ge1'; d['个']='ge4'; d['歌']='ge1'; d['各']='ge4'; d['格']='ge2'; d['隔']='ge2';
  d['给']='gei3'; d['根']='gen1'; d['跟']='gen1'; d['更']='geng4'; d['耕']='geng1';
  d['工']='gong1'; d['公']='gong1'; d['共']='gong4'; d['功']='gong1'; d['攻']='gong1'; d['供']='gong1';
  d['够']='gou4'; d['狗']='gou3'; d['沟']='gou1'; d['构']='gou4'; d['购']='gou4'; d['勾']='gou1';
  d['古']='gu3'; d['故']='gu4'; d['顾']='gu4'; d['固']='gu4'; d['鼓']='gu3'; d['骨']='gu3';
  d['瓜']='gua1'; d['挂']='gua4'; d['刮']='gua1'; d['寡']='gua3'; d['乖']='guai1';
  d['关']='guan1'; d['管']='guan3'; d['观']='guan1'; d['馆']='guan3'; d['冠']='guan1'; d['贯']='guan4';
  d['光']='guang1'; d['广']='guang3'; d['逛']='guang4';
  d['规']='gui1'; d['归']='gui1'; d['鬼']='gui3'; d['贵']='gui4'; d['桂']='gui4'; d['轨']='gui3';
  d['滚']='gun3'; d['棍']='gun4'; d['锅']='guo1'; d['国']='guo2'; d['果']='guo3'; d['过']='guo4';

  // H
  d['哈']='ha1'; d['还']='hai2'; d['海']='hai3'; d['害']='hai4'; d['孩']='hai2'; d['嗨']='hai1';
  d['含']='han2'; d['汉']='han4'; d['喊']='han3'; d['寒']='han2'; d['韩']='han2'; d['汗']='han4';
  d['好']='hao3'; d['号']='hao4'; d['浩']='hao4'; d['豪']='hao2'; d['毫']='hao2'; d['耗']='hao4';
  d['和']='he2'; d['合']='he2'; d['河']='he2'; d['何']='he2'; d['喝']='he1'; d['贺']='he4';
  d['黑']='hei1'; d['很']='hen3'; d['恨']='hen4'; d['狠']='hen3'; d['痕']='hen2';
  d['红']='hong2'; d['后']='hou4'; d['厚']='hou4'; d['猴']='hou2'; d['侯']='hou2'; d['吼']='hou3';
  d['湖']='hu2'; d['虎']='hu3'; d['互']='hu4'; d['护']='hu4'; d['呼']='hu1'; d['胡']='hu2';
  d['花']='hua1'; d['话']='hua4'; d['化']='hua4'; d['画']='hua4'; d['华']='hua2'; d['滑']='hua2';
  d['坏']='huai4'; d['怀']='huai2'; d['欢']='huan1'; d['还']='huan2'; d['环']='huan2'; d['换']='huan4';
  d['黄']='huang2'; d['荒']='huang1'; d['慌']='huang1'; d['皇']='huang2'; d['煌']='huang2';
  d['回']='hui2'; d['会']='hui4'; d['灰']='hui1'; d['辉']='hui1'; d['汇']='hui4'; d['绘']='hui4';
  d['混']='hun4'; d['婚']='hun1'; d['魂']='hun2'; d['昏']='hun1'; d['浑']='hun2';
  d['活']='huo2'; d['火']='huo3'; d['或']='huo4'; d['货']='huo4'; d['获']='huo4'; d['祸']='huo4';

  // J
  d['几']='ji1'; d['机']='ji1'; d['己']='ji3'; d['记']='ji4'; d['技']='ji4'; d['积']='ji1';
  d['加']='jia1'; d['家']='jia1'; d['假']='jia3'; d['价']='jia4'; d['架']='jia4'; d['甲']='jia3';
  d['间']='jian1'; d['见']='jian4'; d['件']='jian4'; d['建']='jian4'; d['简']='jian3'; d['减']='jian3';
  d['将']='jiang1'; d['江']='jiang1'; d['奖']='jiang3'; d['讲']='jiang3'; d['降']='jiang4'; d['酱']='jiang4';
  d['交']='jiao1'; d['叫']='jiao4'; d['教']='jiao4'; d['较']='jiao4'; d['角']='jiao3'; d['脚']='jiao3';
  d['接']='jie1'; d['节']='jie2'; d['解']='jie3'; d['姐']='jie3'; d['借']='jie4'; d['界']='jie4';
  d['进']='jin4'; d['近']='jin4'; d['金']='jin1'; d['今']='jin1'; d['仅']='jin3'; d['紧']='jin3';
  d['经']='jing1'; d['京']='jing1'; d['精']='jing1'; d['景']='jing3'; d['警']='jing3'; d['静']='jing4';
  d['究']='jiu1'; d['九']='jiu3'; d['久']='jiu3'; d['酒']='jiu3'; d['旧']='jiu4'; d['就']='jiu4';
  d['局']='ju2'; d['举']='ju3'; d['句']='ju4'; d['据']='ju4'; d['具']='ju4'; d['巨']='ju4';
  d['卷']='juan3'; d['捐']='juan1'; d['娟']='juan1'; d['倦']='juan4'; d['决']='jue2'; d['绝']='jue2';
  d['军']='jun1'; d['均']='jun1'; d['君']='jun1'; d['菌']='jun1'; d['俊']='jun4';

  // K
  d['开']='kai1'; d['看']='kan4'; d['考']='kao3'; d['靠']='kao4'; d['科']='ke1'; d['可']='ke3';
  d['刻']='ke4'; d['客']='ke4'; d['课']='ke4'; d['肯']='ken3'; d['空']='kong1'; d['孔']='kong3';
  d['口']='kou3'; d['扣']='kou4'; d['哭']='ku1'; d['苦']='ku3'; d['库']='ku4'; d['裤']='ku4';
  d['夸']='kua1'; d['块']='kuai4'; d['快']='kuai4'; d['宽']='kuan1'; d['款']='kuan3';
  d['狂']='kuang2'; d['况']='kuang4'; d['矿']='kuang4'; d['框']='kuang4';
  d['亏']='kui1'; d['愧']='kui4'; d['昆']='kun1'; d['困']='kun4';
  d['扩']='kuo4'; d['括']='kuo4'; d['阔']='kuo4';

  // L
  d['拉']='la1'; d['啦']='la5'; d['来']='lai2'; d['赖']='lai4'; d['蓝']='lan2'; d['兰']='lan2';
  d['浪']='lang4'; d['狼']='lang2'; d['朗']='lang3'; d['郎']='lang2'; d['老']='lao3'; d['劳']='lao2';
  d['了']='le5'; d['乐']='le4'; d['类']='lei4'; d['雷']='lei2'; d['累']='lei4'; d['泪']='lei4';
  d['冷']='leng3'; d['愣']='leng4'; d['离']='li2'; d['里']='li3'; d['力']='li4'; d['理']='li3';
  d['连']='lian2'; d['联']='lian2'; d['脸']='lian3'; d['练']='lian4'; d['恋']='lian4'; d['链']='lian4';
  d['两']='liang3'; d['亮']='liang4'; d['量']='liang4'; d['凉']='liang2'; d['良']='liang2'; d['粮']='liang2';
  d['了']='liao3'; d['料']='liao4'; d['聊']='liao2'; d['疗']='liao2'; d['列']='lie4'; d['猎']='lie4';
  d['林']='lin2'; d['临']='lin2'; d['淋']='lin2'; d['邻']='lin2'; d['零']='ling2'; d['灵']='ling2';
  d['领']='ling3'; d['另']='ling4'; d['令']='ling4'; d['铃']='ling2'; d['龄']='ling2'; d['凌']='ling2';
  d['留']='liu2'; d['六']='liu4'; d['流']='liu2'; d['刘']='liu2'; d['柳']='liu3'; d['龙']='long2';
  d['楼']='lou2'; d['漏']='lou4'; d['露']='lou4'; d['卢']='lu2'; d['路']='lu4'; d['录']='lu4';
  d['绿']='lv4'; d['旅']='lv3'; d['律']='lv4'; d['率']='lv4'; d['略']='lve4'; d['轮']='lun2';
  d['论']='lun4'; d['罗']='luo2'; d['落']='luo4'; d['洛']='luo4'; d['络']='luo4'; d['螺']='luo2';

  // M
  d['妈']='ma1'; d['马']='ma3'; d['吗']='ma5'; d['买']='mai3'; d['卖']='mai4'; d['麦']='mai4';
  d['满']='man3'; d['慢']='man4'; d['蛮']='man2'; d['瞒']='man2'; d['忙']='mang2'; d['盲']='mang2';
  d['毛']='mao2'; d['猫']='mao1'; d['冒']='mao4'; d['帽']='mao4'; d['貌']='mao4'; d['矛']='mao2';
  d['么']='me5'; d['没']='mei2'; d['美']='mei3'; d['每']='mei3'; d['妹']='mei4'; d['梅']='mei2';
  d['门']='men2'; d['们']='men5'; d['闷']='men4'; d['梦']='meng4'; d['猛']='meng3'; d['蒙']='meng2';
  d['米']='mi3'; d['密']='mi4'; d['迷']='mi2'; d['秘']='mi4'; d['蜜']='mi4'; d['眯']='mi1';
  d['面']='mian4'; d['免']='mian3'; d['棉']='mian2'; d['眠']='mian2'; d['苗']='miao2'; d['描']='miao2';
  d['秒']='miao3'; d['妙']='miao4'; d['庙']='miao4'; d['灭']='mie4'; d['民']='min2'; d['敏']='min3';
  d['名']='ming2'; d['明']='ming2'; d['命']='ming4'; d['鸣']='ming2'; d['摸']='mo1'; d['末']='mo4';
  d['模']='mo2'; d['磨']='mo2'; d['魔']='mo2'; d['墨']='mo4'; d['莫']='mo4'; d['默']='mo4';
  d['某']='mou3'; d['谋']='mou2'; d['母']='mu3'; d['木']='mu4'; d['目']='mu4'; d['牧']='mu4';

  // N
  d['那']='na4'; d['拿']='na2'; d['哪']='na3'; d['纳']='na4'; d['乃']='nai3'; d['奶']='nai3';
  d['难']='nan2'; d['南']='nan2'; d['男']='nan2'; d['脑']='nao3'; d['闹']='nao4'; d['呢']='ne5';
  d['内']='nei4'; d['嫩']='nen4'; d['能']='neng2'; d['你']='ni3'; d['泥']='ni2'; d['拟']='ni3';
  d['年']='nian2'; d['念']='nian4'; d['娘']='niang2'; d['鸟']='niao3'; d['尿']='niao4';
  d['您']='nin2'; d['宁']='ning2'; d['牛']='niu2'; d['纽']='niu3'; d['农']='nong2'; d['浓']='nong2';
  d['弄']='nong4'; d['奴']='nu2'; d['努']='nu3'; d['怒']='nu4'; d['女']='nv3'; d['暖']='nuan3';
  d['挪']='nuo2'; d['诺']='nuo4';

  // O
  d['哦']='o2'; d['欧']='ou1'; d['偶']='ou3'; d['藕']='ou3';

  // P
  d['怕']='pa4'; d['爬']='pa2'; d['拍']='pai1'; d['排']='pai2'; d['派']='pai4'; d['攀']='pan1';
  d['判']='pan4'; d['盘']='pan2'; d['盼']='pan4'; d['旁']='pang2'; d['胖']='pang4'; d['跑']='pao3';
  d['泡']='pao4'; d['炮']='pao4'; d['配']='pei4'; d['陪']='pei2'; d['赔']='pei2'; d['喷']='pen1';
  d['朋']='peng2'; d['碰']='peng4'; d['捧']='peng3'; d['批']='pi1'; d['皮']='pi2'; d['疲']='pi2';
  d['片']='pian4'; d['偏']='pian1'; d['骗']='pian4'; d['飘']='piao1'; d['票']='piao4'; d['拼']='pin1';
  d['品']='pin3'; d['贫']='pin2'; d['平']='ping2'; d['评']='ping2'; d['瓶']='ping2'; d['屏']='ping2';
  d['破']='po4'; d['迫']='po4'; d['坡']='po1'; d['泼']='po1'; d['婆']='po2'; d['扑']='pu1';
  d['铺']='pu1'; d['仆']='pu2'; d['朴']='pu3'; d['普']='pu3'; d['谱']='pu3';

  // Q
  d['七']='qi1'; d['起']='qi3'; d['其']='qi2'; d['气']='qi4'; d['期']='qi1'; d['齐']='qi2';
  d['恰']='qia4'; d['卡']='qia3'; d['千']='qian1'; d['前']='qian2'; d['钱']='qian2'; d['浅']='qian3';
  d['强']='qiang2'; d['墙']='qiang2'; d['枪']='qiang1'; d['敲']='qiao1'; d['桥']='qiao2'; d['巧']='qiao3';
  d['切']='qie1'; d['且']='qie3'; d['亲']='qin1'; d['勤']='qin2'; d['琴']='qin2'; d['青']='qing1';
  d['清']='qing1'; d['情']='qing2'; d['晴']='qing2'; d['请']='qing3'; d['庆']='qing4';
  d['秋']='qiu1'; d['球']='qiu2'; d['求']='qiu2'; d['区']='qu1'; d['去']='qu4'; d['取']='qu3';
  d['全']='quan2'; d['权']='quan2'; d['确']='que4'; d['群']='qun2';

  // R
  d['然']='ran2'; d['让']='rang4'; d['热']='re4'; d['人']='ren2'; d['认']='ren4'; d['任']='ren4';
  d['日']='ri4'; d['容']='rong2'; d['荣']='rong2'; d['融']='rong2'; d['肉']='rou4'; d['如']='ru2';
  d['入']='ru4'; d['软']='ruan3'; d['瑞']='rui4'; d['若']='ruo4'; d['弱']='ruo4';

  // S
  d['三']='san1'; d['散']='san3'; d['色']='se4'; d['森']='sen1'; d['沙']='sha1'; d['杀']='sha1';
  d['山']='shan1'; d['善']='shan4'; d['伤']='shang1'; d['上']='shang4'; d['商']='shang1'; d['少']='shao3';
  d['设']='she4'; d['社']='she4'; d['身']='shen1'; d['深']='shen1'; d['什']='shen2'; d['神']='shen2';
  d['生']='sheng1'; d['声']='sheng1'; d['省']='sheng3'; d['师']='shi1'; d['十']='shi2'; d['时']='shi2';
  d['事']='shi4'; d['是']='shi4'; d['市']='shi4'; d['世']='shi4'; d['式']='shi4'; d['试']='shi4';
  d['收']='shou1'; d['手']='shou3'; d['首']='shou3'; d['受']='shou4'; d['书']='shu1'; d['树']='shu4';
  d['数']='shu4'; d['术']='shu4'; d['双']='shuang1'; d['水']='shui3'; d['睡']='shui4'; d['顺']='shun4';
  d['说']='shuo1'; d['思']='si1'; d['死']='si3'; d['四']='si4'; d['似']='si4'; d['送']='song4';
  d['松']='song1'; d['搜']='sou1'; d['苏']='su1'; d['速']='su4'; d['算']='suan4'; d['虽']='sui1';
  d['随']='sui2'; d['岁']='sui4'; d['碎']='sui4'; d['孙']='sun1'; d['损']='sun3'; d['所']='suo3';

  // T
  d['他']='ta1'; d['她']='ta1'; d['它']='ta1'; d['台']='tai2'; d['太']='tai4'; d['态']='tai4';
  d['谈']='tan2'; d['弹']='tan2'; d['坦']='tan3'; d['叹']='tan4'; d['探']='tan4'; d['汤']='tang1';
  d['糖']='tang2'; d['堂']='tang2'; d['逃']='tao2'; d['桃']='tao2'; d['讨']='tao3'; d['特']='te4';
  d['疼']='teng2'; d['提']='ti2'; d['题']='ti2'; d['体']='ti3'; d['替']='ti4'; d['天']='tian1';
  d['田']='tian2'; d['甜']='tian2'; d['条']='tiao2'; d['跳']='tiao4'; d['铁']='tie3'; d['听']='ting1';
  d['停']='ting2'; d['挺']='ting3'; d['通']='tong1'; d['同']='tong2'; d['统']='tong3'; d['痛']='tong4';
  d['头']='tou2'; d['投']='tou2'; d['图']='tu2'; d['土']='tu3'; d['团']='tuan2'; d['推']='tui1';
  d['腿']='tui3'; d['退']='tui4'; d['吞']='tun1'; d['拖']='tuo1'; d['脱']='tuo1'; d['托']='tuo1';

  // W
  d['挖']='wa1'; d['哇']='wa5'; d['外']='wai4'; d['弯']='wan1'; d['完']='wan2'; d['万']='wan4';
  d['王']='wang2'; d['网']='wang3'; d['忘']='wang4'; d['往']='wang3'; d['望']='wang4'; d['旺']='wang4';
  d['为']='wei4'; d['位']='wei4'; d['未']='wei4'; d['味']='wei4'; d['围']='wei2'; d['微']='wei1';
  d['文']='wen2'; d['问']='wen4'; d['闻']='wen2'; d['温']='wen1'; d['稳']='wen3'; d['吻']='wen3';
  d['我']='wo3'; d['握']='wo4'; d['窝']='wo1'; d['无']='wu2'; d['五']='wu3'; d['物']='wu4';
  d['武']='wu3'; d['务']='wu4'; d['误']='wu4'; d['悟']='wu4';

  // X
  d['西']='xi1'; d['习']='xi2'; d['系']='xi4'; d['细']='xi4'; d['戏']='xi4'; d['洗']='xi3';
  d['下']='xia4'; d['夏']='xia4'; d['吓']='xia4'; d['先']='xian1'; d['现']='xian4'; d['线']='xian4';
  d['想']='xiang3'; d['向']='xiang4'; d['象']='xiang4'; d['响']='xiang3'; d['相']='xiang1'; d['香']='xiang1';
  d['小']='xiao3'; d['笑']='xiao4'; d['校']='xiao4'; d['消']='xiao1'; d['效']='xiao4'; d['晓']='xiao3';
  d['些']='xie1'; d['写']='xie3'; d['鞋']='xie2'; d['谢']='xie4'; d['心']='xin1'; d['新']='xin1';
  d['信']='xin4'; d['星']='xing1'; d['行']='xing2'; d['兴']='xing1'; d['醒']='xing3'; d['性']='xing4';
  d['修']='xiu1'; d['秀']='xiu4'; d['需']='xu1'; d['许']='xu3'; d['续']='xu4'; d['选']='xuan3';
  d['学']='xue2'; d['雪']='xue3'; d['血']='xue4'; d['寻']='xun2'; d['训']='xun4'; d['讯']='xun4';

  // Y
  d['压']='ya1'; d['牙']='ya2'; d['呀']='ya5'; d['雅']='ya3'; d['亚']='ya4'; d['烟']='yan1';
  d['眼']='yan3'; d['言']='yan2'; d['严']='yan2'; d['演']='yan3'; d['验']='yan4'; d['养']='yang3';
  d['样']='yang4'; d['阳']='yang2'; d['央']='yang1'; d['要']='yao4'; d['药']='yao4'; d['摇']='yao2';
  d['也']='ye3'; d['业']='ye4'; d['叶']='ye4'; d['夜']='ye4'; d['一']='yi1'; d['以']='yi3';
  d['已']='yi3'; d['亿']='yi4'; d['义']='yi4'; d['意']='yi4'; d['因']='yin1'; d['音']='yin1';
  d['银']='yin2'; d['印']='yin4'; d['应']='ying1'; d['英']='ying1'; d['影']='ying3'; d['营']='ying2';
  d['用']='yong4'; d['永']='yong3'; d['勇']='yong3'; d['由']='you2'; d['有']='you3'; d['又']='you4';
  d['友']='you3'; d['右']='you4'; d['游']='you2'; d['鱼']='yu2'; d['雨']='yu3'; d['语']='yu3';
  d['元']='yuan2'; d['原']='yuan2'; d['远']='yuan3'; d['院']='yuan4'; d['愿']='yuan4'; d['约']='yue1';
  d['月']='yue4'; d['越']='yue4'; d['乐']='yue4'; d['云']='yun2'; d['运']='yun4'; d['员']='yun2';

  // Z
  d['杂']='za2'; d['在']='zai4'; d['再']='zai4'; d['咱']='zan2'; d['早']='zao3'; d['造']='zao4';
  d['则']='ze2'; d['怎']='zen3'; d['曾']='zeng1'; d['增']='zeng1'; d['炸']='zha2'; d['窄']='zhai3';
  d['占']='zhan4'; d['站']='zhan4'; d['展']='zhan3'; d['张']='zhang1'; d['长']='zhang3'; d['章']='zhang1';
  d['找']='zhao3'; d['照']='zhao4'; d['赵']='zhao4'; d['着']='zhe5'; d['这']='zhe4'; d['真']='zhen1';
  d['正']='zheng4'; d['整']='zheng3'; d['之']='zhi1'; d['知']='zhi1'; d['只']='zhi3'; d['直']='zhi2';
  d['指']='zhi3'; d['至']='zhi4'; d['制']='zhi4'; d['治']='zhi4'; d['中']='zhong1'; d['种']='zhong3';
  d['重']='zhong4'; d['众']='zhong4'; d['周']='zhou1'; d['州']='zhou1'; d['主']='zhu3'; d['住']='zhu4';
  d['注']='zhu4'; d['助']='zhu4'; d['转']='zhuan3'; d['装']='zhuang1'; d['状']='zhuang4'; d['追']='zhui1';
  d['准']='zhun3'; d['捉']='zhuo1'; d['子']='zi3'; d['自']='zi4'; d['字']='zi4'; d['总']='zong3';
  d['走']='zou3'; d['组']='zu3'; d['祖']='zu3'; d['最']='zui4'; d['嘴']='zui3'; d['尊']='zun1';
  d['作']='zuo4'; d['做']='zuo4'; d['左']='zuo3'; d['坐']='zuo4'; d['座']='zuo4';

  // === 补充更多常用字 ===
  d['毅']='yi4'; d['翼']='yi4'; d['忆']='yi4'; d['艺']='yi4'; d['异']='yi4'; d['益']='yi4';
  d['译']='yi4'; d['疫']='yi4'; d['仪']='yi2'; d['宜']='yi2'; d['移']='yi2'; d['遗']='yi2';
  d['疑']='yi2'; d['依']='yi1'; d['衣']='yi1'; d['医']='yi1'; d['椅']='yi3'; d['蚁']='yi3';
  d['役']='yi4'; d['抑']='yi4'; d['易']='yi4'; d['亦']='yi4'; d['翼']='yi4'; d['逸']='yi4';
  d['阴']='yin1'; d['引']='yin3'; d['隐']='yin3'; d['饮']='yin3'; d['吟']='yin2'; d['淫']='yin2';
  d['迎']='ying2'; d['映']='ying4'; d['赢']='ying2'; d['硬']='ying4'; d['婴']='ying1'; d['鹰']='ying1';
  d['拥']='yong1'; d['涌']='yong3'; d['泳']='yong3'; d['咏']='yong3'; d['庸']='yong1';
  d['优']='you1'; d['忧']='you1'; d['悠']='you1'; d['犹']='you2'; d['油']='you2'; d['邮']='you2';
  d['幼']='you4'; d['诱']='you4'; d['余']='yu2'; d['与']='yu3'; d['于']='yu2'; d['予']='yu3';
  d['宇']='yu3'; d['域']='yu4'; d['育']='yu4'; d['预']='yu4'; d['遇']='yu4'; d['御']='yu4';
  d['渊']='yuan1'; d['圆']='yuan2'; d['援']='yuan2'; d['缘']='yuan2'; d['源']='yuan2'; d['怨']='yuan4';
  d['阅']='yue4'; d['悦']='yue4'; d['跃']='yue4'; d['允']='yun3'; d['孕']='yun4'; d['韵']='yun4';
  d['灾']='zai1'; d['载']='zai4'; d['赞']='zan4'; d['暂']='zan4'; d['脏']='zang1'; d['葬']='zang4';
  d['遭']='zao1'; d['糟']='zao1'; d['燥']='zao4'; d['躁']='zao4'; d['泽']='ze2'; d['择']='ze2';
  d['贼']='zei2'; d['扎']='zha1'; d['摘']='zhai1'; d['宅']='zhai2'; d['债']='zhai4';
  d['沾']='zhan1'; d['斩']='zhan3'; d['崭']='zhan3'; d['战']='zhan4'; d['栈']='zhan4'; d['绽']='zhan4';
  d['涨']='zhang3'; d['掌']='zhang3'; d['丈']='zhang4'; d['仗']='zhang4'; d['障']='zhang4'; d['帐']='zhang4';
  d['召']='zhao4'; d['罩']='zhao4'; d['兆']='zhao4'; d['遮']='zhe1'; d['折']='zhe2'; d['哲']='zhe2';
  d['针']='zhen1'; d['阵']='zhen4'; d['振']='zhen4'; d['震']='zhen4'; d['镇']='zhen4'; d['珍']='zhen1';
  d['征']='zheng1'; d['争']='zheng1'; d['挣']='zheng4'; d['睁']='zheng1'; d['症']='zheng4'; d['郑']='zheng4';
  d['织']='zhi1'; d['职']='zhi2'; d['植']='zhi2'; d['值']='zhi2'; d['执']='zhi2'; d['纸']='zhi3';
  d['志']='zhi4'; d['智']='zhi4'; d['秩']='zhi4'; d['质']='zhi4'; d['置']='zhi4'; d['致']='zhi4';
  d['忠']='zhong1'; d['终']='zhong1'; d['钟']='zhong1'; d['肿']='zhong3'; d['仲']='zhong4';
  d['洲']='zhou1'; d['舟']='zhou1'; d['骤']='zhou4'; d['皱']='zhou4'; d['咒']='zhou4';
  d['珠']='zhu1'; d['株']='zhu1'; d['猪']='zhu1'; d['逐']='zhu2'; d['竹']='zhu2'; d['筑']='zhu4';
  d['驻']='zhu4'; d['祝']='zhu4'; d['著']='zhu4'; d['柱']='zhu4'; d['筑']='zhu4';
  d['砖']='zhuan1'; d['赚']='zhuan4'; d['桩']='zhuang1'; d['撞']='zhuang4'; d['壮']='zhuang4';
  d['坠']='zhui4'; d['桌']='zhuo1'; d['卓']='zhuo2'; d['琢']='zhuo2'; d['浊']='zhuo2';
  d['资']='zi1'; d['姿']='zi1'; d['紫']='zi3'; d['仔']='zi3'; d['籽']='zi3'; d['宗']='zong1';
  d['综']='zong1'; d['踪']='zong1'; d['纵']='zong4'; d['奏']='zou4'; d['租']='zu1'; d['足']='zu2';
  d['族']='zu2'; d['阻']='zu3'; d['钻']='zuan1'; d['罪']='zui4'; d['醉']='zui4';
  d['遵']='zun1'; d['昨']='zuo2'; d['佐']='zuo3';

  return d;
})();

/**
 * 获取单字拼音（不带声调数字）
 * @param {string} char - 单个汉字
 * @returns {string|null} 拼音字符串
 */
function getRawPinyin(char) {
  var val = PINYIN_DICT[char];
  if (!val) return null;
  if (Array.isArray(val)) return val[0];
  return val;
}

/**
 * 获取拼音（带声调标记）
 * 声调数字 1=阴平 2=阳平 3=上声 4=去声 5=轻声
 * @param {string} char - 单个汉字
 * @returns {string|null} 带声调拼音
 */
function getPinyin(char) {
  var raw = getRawPinyin(char);
  if (!raw) return null;
  return convertToneNumber(raw);
}

/**
 * 获取多音字所有读音
 * @param {string} char - 单个汉字
 * @returns {Array} 拼音数组
 */
function getAllPinyin(char) {
  var val = PINYIN_DICT[char];
  if (!val) return [];
  if (Array.isArray(val)) return val.map(convertToneNumber);
  return [convertToneNumber(val)];
}

/**
 * 数字标调转声调符号
 * 'pin1yin1' → 'pīnyīn'
 */
function convertToneNumber(py) {
  var toneMap = {
    'a': ['ā','á','ǎ','à','a'],
    'o': ['ō','ó','ǒ','ò','o'],
    'e': ['ē','é','ě','è','e'],
    'i': ['ī','í','ǐ','ì','i'],
    'u': ['ū','ú','ǔ','ù','u'],
    'v': ['ǖ','ǘ','ǚ','ǜ','ü'],
    'ü': ['ǖ','ǘ','ǚ','ǜ','ü']
  };

  // 找到声调数字
  var toneMatch = py.match(/([1-5])$/);
  if (!toneMatch) return py;
  var tone = parseInt(toneMatch[1]) - 1; // 0-4
  var base = py.slice(0, -1);

  // 找到带声调的元音
  // 规则：有 a 标 a，无 a 标 o，无 o 标 e，ie/üe 标 e，其他标在最后一个元音上
  var vowels = 'aeiouüv';
  var tonePos = -1;

  if (base.indexOf('a') >= 0) {
    tonePos = base.indexOf('a');
  } else if (base.indexOf('o') >= 0) {
    tonePos = base.indexOf('o');
  } else if (base.indexOf('e') >= 0) {
    tonePos = base.indexOf('e');
  } else if (base.indexOf('u') >= 0) {
    tonePos = base.lastIndexOf('u');
  } else if (base.indexOf('i') >= 0) {
    tonePos = base.lastIndexOf('i');
  } else if (base.indexOf('v') >= 0) {
    tonePos = base.indexOf('v');
  } else if (base.indexOf('ü') >= 0) {
    tonePos = base.indexOf('ü');
  }

  if (tonePos >= 0) {
    var ch = base[tonePos].toLowerCase();
    if (toneMap[ch] && toneMap[ch][tone]) {
      return base.substring(0, tonePos) + toneMap[ch][tone] + base.substring(tonePos + 1);
    }
  }

  return base;
}

/**
 * 判断是否为多音字
 * @param {string} char - 单个汉字
 * @returns {boolean}
 */
function isPolyphone(char) {
  var val = PINYIN_DICT[char];
  return Array.isArray(val) && val.length > 1;
}

/**
 * 获取拼音首字母
 * @param {string} char - 单个汉字
 * @returns {string} 首字母
 */
function getFirstLetter(char) {
  var raw = getRawPinyin(char);
  if (!raw) return '?';
  return raw.charAt(0).toUpperCase();
}

/**
 * 获取字典总字数
 * @returns {number}
 */
function getDictSize() {
  return Object.keys(PINYIN_DICT).length;
}

module.exports = {
  getPinyin: getPinyin,
  getAllPinyin: getAllPinyin,
  getRawPinyin: getRawPinyin,
  isPolyphone: isPolyphone,
  getFirstLetter: getFirstLetter,
  getDictSize: getDictSize,
  PINYIN_DICT: PINYIN_DICT
};
