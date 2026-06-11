/**
 * 数学公式大全数据
 * 小学到高中数学公式速查
 */

var FORMULAS = [
  // ==================== 小学 ====================
  // 数与运算
  { id: 'primary-1', level: '小学', category: '数与运算', name: '加法交换律', formula: 'a + b = b + a', note: '两个数相加，交换加数的位置，和不变。', example: '3 + 5 = 5 + 3 = 8' },
  { id: 'primary-2', level: '小学', category: '数与运算', name: '加法结合律', formula: '(a + b) + c = a + (b + c)', note: '三个数相加，先把前两个数相加，或先把后两个数相加，和不变。', example: '(2+3)+5 = 2+(3+5) = 10' },
  { id: 'primary-3', level: '小学', category: '数与运算', name: '乘法交换律', formula: 'a × b = b × a', note: '两个数相乘，交换因数的位置，积不变。', example: '4 × 5 = 5 × 4 = 20' },
  { id: 'primary-4', level: '小学', category: '数与运算', name: '乘法结合律', formula: '(a × b) × c = a × (b × c)', note: '三个数相乘，先把前两个数相乘，或先把后两个数相乘，积不变。', example: '(2×3)×5 = 2×(3×5) = 30' },
  { id: 'primary-5', level: '小学', category: '数与运算', name: '乘法分配律', formula: '(a + b) × c = a × c + b × c', note: '两个数的和与一个数相乘，等于分别相乘再相加。', example: '(3+5)×2 = 3×2 + 5×2 = 16' },
  { id: 'primary-6', level: '小学', category: '数与运算', name: '减法性质', formula: 'a - b - c = a - (b + c)', note: '一个数连续减去两个数，等于减去这两个数的和。', example: '10-3-2 = 10-(3+2) = 5' },
  { id: 'primary-7', level: '小学', category: '数与运算', name: '除法性质', formula: 'a ÷ b ÷ c = a ÷ (b × c)', note: '一个数连续除以两个数，等于除以这两个数的积。', example: '24÷2÷3 = 24÷(2×3) = 4' },
  // 分数与百分数
  { id: 'primary-8', level: '小学', category: '分数与百分数', name: '分数加法', formula: 'a/b + c/d = (ad+bc)/bd', note: '异分母分数相加，先通分再相加。', example: '1/2 + 1/3 = 3/6 + 2/6 = 5/6' },
  { id: 'primary-9', level: '小学', category: '分数与百分数', name: '分数乘法', formula: 'a/b × c/d = ac/bd', note: '分数乘以分数，分子乘分子，分母乘分母。', example: '2/3 × 3/4 = 6/12 = 1/2' },
  { id: 'primary-10', level: '小学', category: '分数与百分数', name: '分数除法', formula: 'a/b ÷ c/d = a/b × d/c', note: '除以一个分数等于乘以它的倒数。', example: '2/3 ÷ 3/4 = 2/3 × 4/3 = 8/9' },
  { id: 'primary-11', level: '小学', category: '分数与百分数', name: '百分数转小数', formula: '百分数 ÷ 100 = 小数', note: '把百分数的小数点向左移动两位。', example: '25% = 25÷100 = 0.25' },
  { id: 'primary-12', level: '小学', category: '分数与百分数', name: '百分数转分数', formula: '百分数/100 = 分数（约分）', note: '把百分数写成分母是100的分数再约分。', example: '60% = 60/100 = 3/5' },
  // 面积
  { id: 'primary-13', level: '小学', category: '面积公式', name: '正方形面积', formula: 'S = a²', note: 'a为正方形的边长。', example: '边长为5cm，S = 5² = 25cm²' },
  { id: 'primary-14', level: '小学', category: '面积公式', name: '长方形面积', formula: 'S = a × b', note: 'a为长，b为宽。', example: '长6cm宽4cm，S = 6×4 = 24cm²' },
  { id: 'primary-15', level: '小学', category: '面积公式', name: '三角形面积', formula: 'S = ½ × a × h', note: 'a为底，h为高。三角形面积是等底等高平行四边形面积的一半。', example: '底8cm高5cm，S = ½×8×5 = 20cm²' },
  { id: 'primary-16', level: '小学', category: '面积公式', name: '平行四边形面积', formula: 'S = a × h', note: 'a为底，h为高。', example: '底10cm高6cm，S = 10×6 = 60cm²' },
  { id: 'primary-17', level: '小学', category: '面积公式', name: '梯形面积', formula: 'S = ½ × (a + b) × h', note: 'a为上底，b为下底，h为高。', example: '上底3cm下底7cm高4cm，S = ½×(3+7)×4 = 20cm²' },
  { id: 'primary-18', level: '小学', category: '面积公式', name: '圆的面积', formula: 'S = πr²', note: 'r为半径，π≈3.14。', example: '半径3cm，S = 3.14×9 = 28.26cm²' },
  // 体积
  { id: 'primary-19', level: '小学', category: '体积公式', name: '正方体体积', formula: 'V = a³', note: 'a为棱长。', example: '棱长3cm，V = 3³ = 27cm³' },
  { id: 'primary-20', level: '小学', category: '体积公式', name: '长方体体积', formula: 'V = a × b × c', note: 'a为长，b为宽，c为高。', example: '长5cm宽3cm高2cm，V = 30cm³' },
  { id: 'primary-21', level: '小学', category: '体积公式', name: '圆柱体积', formula: 'V = πr²h', note: 'r为底面半径，h为高。', example: '半径2cm高5cm，V = 3.14×4×5 = 62.8cm³' },
  { id: 'primary-22', level: '小学', category: '体积公式', name: '圆锥体积', formula: 'V = ⅓πr²h', note: 'r为底面半径，h为高。圆锥体积是等底等高圆柱的⅓。', example: '半径2cm高6cm，V = ⅓×3.14×4×6 = 25.12cm³' },
  // 周长
  { id: 'primary-23', level: '小学', category: '周长公式', name: '圆的周长', formula: 'C = 2πr = πd', note: 'r为半径，d为直径，π≈3.14。', example: '半径3cm，C = 2×3.14×3 = 18.84cm' },
  { id: 'primary-24', level: '小学', category: '周长公式', name: '长方形周长', formula: 'C = 2(a + b)', note: 'a为长，b为宽。', example: '长6cm宽4cm，C = 2×(6+4) = 20cm' },
  { id: 'primary-25', level: '小学', category: '周长公式', name: '正方形周长', formula: 'C = 4a', note: 'a为边长。', example: '边长5cm，C = 4×5 = 20cm' },
  // 速度问题
  { id: 'primary-26', level: '小学', category: '应用问题', name: '路程公式', formula: '路程 = 速度 × 时间', note: 's = v × t', example: '速度60km/h，时间2h，路程 = 120km' },
  { id: 'primary-27', level: '小学', category: '应用问题', name: '工程问题', formula: '工作总量 = 工作效率 × 工作时间', note: '把工作总量看作"1"。', example: '甲每天完成1/5，5天完成全部工作' },
  { id: 'primary-28', level: '小学', category: '应用问题', name: '利润公式', formula: '利润 = 售价 - 成本', note: '利润率 = 利润 ÷ 成本 × 100%', example: '成本80元，售价100元，利润20元' },

  // ==================== 初中 ====================
  // 代数
  { id: 'junior-1', level: '初中', category: '代数式', name: '平方差公式', formula: '(a+b)(a-b) = a² - b²', note: '两个数的和与差的积等于这两个数的平方差。', example: '(5+3)(5-3) = 25-9 = 16' },
  { id: 'junior-2', level: '初中', category: '代数式', name: '完全平方公式', formula: '(a±b)² = a² ± 2ab + b²', note: '两数和（差）的平方等于各自平方加（减）两倍之积。', example: '(x+3)² = x² + 6x + 9' },
  { id: 'junior-3', level: '初中', category: '代数式', name: '立方和公式', formula: 'a³ + b³ = (a+b)(a² - ab + b²)', note: '两个数的立方和可以因式分解。', example: 'x³ + 8 = (x+2)(x²-2x+4)' },
  { id: 'junior-4', level: '初中', category: '代数式', name: '立方差公式', formula: 'a³ - b³ = (a-b)(a² + ab + b²)', note: '两个数的立方差可以因式分解。', example: 'x³ - 27 = (x-3)(x²+3x+9)' },
  // 方程
  { id: 'junior-5', level: '初中', category: '方程', name: '一元二次方程求根公式', formula: 'x = (-b ± √(b²-4ac)) / 2a', note: '适用于 ax² + bx + c = 0 (a≠0)，判别式 Δ = b²-4ac。', example: 'x²-5x+6=0，x = (5±1)/2，x₁=3, x₂=2' },
  { id: 'junior-6', level: '初中', category: '方程', name: '韦达定理', formula: 'x₁ + x₂ = -b/a，x₁·x₂ = c/a', note: '一元二次方程两根之和与积的关系。', example: 'x²-5x+6=0，x₁+x₂=5，x₁·x₂=6' },
  { id: 'junior-7', level: '初中', category: '方程', name: '二元一次方程组', formula: '{ ax+by=c, dx+ey=f }', note: '可用代入法或加减消元法求解。', example: '{x+y=5, 2x-y=1} → x=2, y=3' },
  // 不等式
  { id: 'junior-8', level: '初中', category: '不等式', name: '一元二次不等式', formula: 'ax²+bx+c > 0 或 < 0', note: '先求方程的根，再结合抛物线开口方向判断解集。', example: 'x²-5x+6>0 的解集为 x<2 或 x>3' },
  // 函数
  { id: 'junior-9', level: '初中', category: '函数', name: '一次函数', formula: 'y = kx + b (k≠0)', note: 'k>0递增，k<0递减。b为y轴截距。图像为直线。', example: 'y = 2x + 1，过(0,1)斜率为2的直线' },
  { id: 'junior-10', level: '初中', category: '函数', name: '反比例函数', formula: 'y = k/x (k≠0)', note: 'k>0在1、3象限，k<0在2、4象限。', example: 'y = 6/x，当x=2时y=3' },
  { id: 'junior-11', level: '初中', category: '函数', name: '二次函数标准形式', formula: 'y = ax² + bx + c (a≠0)', note: 'a>0开口向上有最小值，a<0开口向下有最大值。', example: 'y = x² - 4x + 3' },
  { id: 'junior-12', level: '初中', category: '函数', name: '二次函数顶点式', formula: 'y = a(x-h)² + k', note: '顶点坐标为(h,k)，对称轴为x=h。', example: 'y = 2(x-1)² + 3，顶点(1,3)' },
  { id: 'junior-13', level: '初中', category: '函数', name: '二次函数顶点坐标', formula: '顶点: (-b/2a, (4ac-b²)/4a)', note: '由标准形式转换。', example: 'y=x²-4x+3 顶点(2,-1)' },
  // 几何
  { id: 'junior-14', level: '初中', category: '几何', name: '勾股定理', formula: 'a² + b² = c²', note: '直角三角形两直角边的平方和等于斜边的平方。', example: '两直角边3和4，斜边 = √(9+16) = 5' },
  { id: 'junior-15', level: '初中', category: '几何', name: '三角形内角和', formula: '∠A + ∠B + ∠C = 180°', note: '任意三角形的三个内角之和等于180度。', example: '∠A=60°，∠B=80°，则∠C=40°' },
  { id: 'junior-16', level: '初中', category: '几何', name: '正弦定理', formula: 'a/sinA = b/sinB = c/sinC = 2R', note: 'R为三角形外接圆半径。', example: 'a=5, A=30°, 则5/sin30° = 10 = 2R' },
  { id: 'junior-17', level: '初中', category: '几何', name: '余弦定理', formula: 'c² = a² + b² - 2ab·cosC', note: '任意三角形中，一边的平方等于另外两边平方和减去两倍之积乘夹角余弦。', example: 'a=3, b=4, C=60°, c²=9+16-12=13' },
  { id: 'junior-18', level: '初中', category: '几何', name: '圆的弧长', formula: 'l = nπr/180', note: 'n为圆心角度数，r为半径。', example: '圆心角60°，半径6cm，l = 60×3.14×6/180 ≈ 6.28cm' },
  { id: 'junior-19', level: '初中', category: '几何', name: '扇形面积', formula: 'S = nπr²/360 = ½lr', note: 'n为圆心角度数，r为半径，l为弧长。', example: '圆心角90°，半径4cm，S = 90×3.14×16/360 ≈ 12.56cm²' },
  // 统计
  { id: 'junior-20', level: '初中', category: '统计', name: '平均数', formula: 'x̄ = (x₁+x₂+...+xₙ)/n', note: '所有数据之和除以数据个数。', example: '2,4,6,8的平均数 = (2+4+6+8)/4 = 5' },
  { id: 'junior-21', level: '初中', category: '统计', name: '方差', formula: 'S² = [(x₁-x̄)² + ... + (xₙ-x̄)²] / n', note: '方差越小，数据越集中。', example: '数据2,4,6,8的方差 = 5' },
  { id: 'junior-22', level: '初中', category: '统计', name: '标准差', formula: 'S = √S²', note: '方差的算术平方根。', example: '方差为4，则标准差为2' },

  // ==================== 高中 ====================
  // 集合与逻辑
  { id: 'senior-1', level: '高中', category: '集合', name: '集合交集', formula: 'A ∩ B = {x | x∈A 且 x∈B}', note: '两个集合的公共元素组成交集。', example: 'A={1,2,3}, B={2,3,4}, A∩B={2,3}' },
  { id: 'senior-2', level: '高中', category: '集合', name: '集合并集', formula: 'A ∪ B = {x | x∈A 或 x∈B}', note: '两个集合的所有元素组成并集。', example: 'A={1,2,3}, B={2,3,4}, A∪B={1,2,3,4}' },
  { id: 'senior-3', level: '高中', category: '集合', name: '补集', formula: '∁ᵤA = {x | x∈U 且 x∉A}', note: '全集中不属于A的元素。', example: 'U={1,2,3,4,5}, A={1,3}, ∁ᵤA={2,4,5}' },
  // 指数与对数
  { id: 'senior-4', level: '高中', category: '指数与对数', name: '指数运算法则', formula: 'aᵐ × aⁿ = aᵐ⁺ⁿ', note: '同底数幂相乘，底数不变指数相加。', example: '2³ × 2⁴ = 2⁷ = 128' },
  { id: 'senior-5', level: '高中', category: '指数与对数', name: '指数运算法则2', formula: '(aᵐ)ⁿ = aᵐⁿ', note: '幂的乘方，底数不变指数相乘。', example: '(2³)² = 2⁶ = 64' },
  { id: 'senior-6', level: '高中', category: '指数与对数', name: '对数定义', formula: 'logₐN = b ⟺ aᵇ = N', note: '以a为底N的对数等于b。', example: 'log₂8 = 3 因为 2³ = 8' },
  { id: 'senior-7', level: '高中', category: '指数与对数', name: '对数运算法则', formula: 'logₐ(MN) = logₐM + logₐN', note: '乘积的对数等于对数之和。', example: 'log₂(8×4) = log₂8 + log₂4 = 3+2 = 5' },
  { id: 'senior-8', level: '高中', category: '指数与对数', name: '对数运算法则2', formula: 'logₐ(M/N) = logₐM - logₐN', note: '商的对数等于对数之差。', example: 'log₂(16/4) = log₂16 - log₂4 = 4-2 = 2' },
  { id: 'senior-9', level: '高中', category: '指数与对数', name: '换底公式', formula: 'logₐb = logcb / logca', note: '可以换成任意底数的对数来计算。', example: 'log₂8 = lg8/lg2 = 0.903/0.301 ≈ 3' },
  // 三角函数
  { id: 'senior-10', level: '高中', category: '三角函数', name: '基本定义', formula: 'sinθ = 对边/斜边, cosθ = 邻边/斜边, tanθ = 对边/邻边', note: '直角三角形中三角函数的定义。', example: '对边3，邻边4，斜边5，sinθ=3/5' },
  { id: 'senior-11', level: '高中', category: '三角函数', name: '同角关系', formula: 'sin²θ + cos²θ = 1', note: '三角函数最基本的恒等式。', example: 'sinθ=3/5，则cosθ=4/5' },
  { id: 'senior-12', level: '高中', category: '三角函数', name: '正弦和角公式', formula: 'sin(α±β) = sinα·cosβ ± cosα·sinβ', note: '两角和（差）的正弦公式。', example: 'sin75° = sin(45°+30°) = (√6+√2)/4' },
  { id: 'senior-13', level: '高中', category: '三角函数', name: '余弦和角公式', formula: 'cos(α±β) = cosα·cosβ ∓ sinα·sinβ', note: '两角和（差）的余弦公式。', example: 'cos75° = cos(45°+30°) = (√6-√2)/4' },
  { id: 'senior-14', level: '高中', category: '三角函数', name: '正切和角公式', formula: 'tan(α±β) = (tanα±tanβ) / (1∓tanα·tanβ)', note: '两角和（差）的正切公式。', example: 'tan(45°+30°) = (1+√3/3)/(1-√3/3)' },
  { id: 'senior-15', level: '高中', category: '三角函数', name: '二倍角公式', formula: 'sin2α = 2sinα·cosα', note: '正弦的二倍角公式。', example: 'sin60° = 2sin30°·cos30° = 2×½×(√3/2) = √3/2' },
  { id: 'senior-16', level: '高中', category: '三角函数', name: '二倍角余弦', formula: 'cos2α = cos²α - sin²α = 2cos²α - 1 = 1 - 2sin²α', note: '余弦的二倍角公式有三种形式。', example: 'cos60° = 2cos²30°-1 = 2×3/4-1 = 1/2' },
  { id: 'senior-17', level: '高中', category: '三角函数', name: '辅助角公式', formula: 'asinx + bcosx = √(a²+b²)·sin(x+φ)', note: '其中 tanφ = b/a。', example: 'sinx+cosx = √2·sin(x+π/4)' },
  // 数列
  { id: 'senior-18', level: '高中', category: '数列', name: '等差数列通项', formula: 'aₙ = a₁ + (n-1)d', note: 'd为公差。', example: 'a₁=2, d=3, a₅ = 2+4×3 = 14' },
  { id: 'senior-19', level: '高中', category: '数列', name: '等差数列求和', formula: 'Sₙ = n(a₁+aₙ)/2 = na₁ + n(n-1)d/2', note: '等差数列前n项和。', example: 'a₁=1, d=2, S₁₀ = 10×1+10×9×2/2 = 100' },
  { id: 'senior-20', level: '高中', category: '数列', name: '等比数列通项', formula: 'aₙ = a₁ · qⁿ⁻¹', note: 'q为公比。', example: 'a₁=2, q=3, a₄ = 2×3³ = 54' },
  { id: 'senior-21', level: '高中', category: '数列', name: '等比数列求和', formula: 'Sₙ = a₁(1-qⁿ)/(1-q) (q≠1)', note: '等比数列前n项和。当q=1时，Sₙ=na₁。', example: 'a₁=1, q=2, S₅ = 1×(1-32)/(1-2) = 31' },
  // 向量
  { id: 'senior-22', level: '高中', category: '向量', name: '向量加法', formula: '⃗a + ⃗b = (a₁+b₁, a₂+b₂)', note: '对应分量相加。', example: '(1,2)+(3,4) = (4,6)' },
  { id: 'senior-23', level: '高中', category: '向量', name: '数量积', formula: '⃗a · ⃗b = |⃗a||⃗b|cosθ = a₁b₁ + a₂b₂', note: '向量的数量积（点积）。', example: '(1,2)·(3,4) = 3+8 = 11' },
  { id: 'senior-24', level: '高中', category: '向量', name: '向量模', formula: '|⃗a| = √(a₁² + a₂²)', note: '向量的长度（模）。', example: '|(3,4)| = √(9+16) = 5' },
  // 导数
  { id: 'senior-25', level: '高中', category: '导数', name: '幂函数导数', formula: "(xⁿ)' = nxⁿ⁻¹", note: 'x的n次方的导数。', example: "(x³)' = 3x²" },
  { id: 'senior-26', level: '高中', category: '导数', name: '三角函数导数', formula: "(sinx)' = cosx, (cosx)' = -sinx", note: '正弦和余弦的导数。', example: "(sinx)' = cosx" },
  { id: 'senior-27', level: '高中', category: '导数', name: '指数函数导数', formula: "(eˣ)' = eˣ", note: '以e为底的指数函数的导数是其本身。', example: "f(x)=eˣ, f'(x)=eˣ" },
  { id: 'senior-28', level: '高中', category: '导数', name: '对数函数导数', formula: "(lnx)' = 1/x", note: '自然对数的导数。', example: "f(x)=lnx, f'(x)=1/x" },
  { id: 'senior-29', level: '高中', category: '导数', name: '求导法则', formula: "[f(x)·g(x)]' = f'(x)g(x) + f(x)g'(x)", note: '乘法求导法则（莱布尼茨法则）。', example: "(x²·sinx)' = 2x·sinx + x²·cosx" },
  // 概率
  { id: 'senior-30', level: '高中', category: '概率', name: '古典概型', formula: 'P(A) = A的基本事件数 / 总基本事件数', note: '等可能事件的概率。', example: '掷骰子出现偶数的概率 = 3/6 = 1/2' },
  { id: 'senior-31', level: '高中', category: '概率', name: '对立事件', formula: 'P(A) = 1 - P(Ā)', note: '事件A不发生的概率。', example: '至少有一次命中的概率 = 1-全不中的概率' },
  { id: 'senior-32', level: '高中', category: '概率', name: '独立事件', formula: 'P(AB) = P(A) × P(B)', note: '两个独立事件同时发生的概率。', example: '两次都正面的概率 = 1/2 × 1/2 = 1/4' },
  { id: 'senior-33', level: '高中', category: '概率', name: '二项分布', formula: 'P(X=k) = C(n,k)·pᵏ·(1-p)ⁿ⁻ᵏ', note: 'n次独立重复试验中恰好发生k次的概率。', example: '抛5次硬币恰好3次正面 = C(5,3)×(1/2)⁵' },
  { id: 'senior-34', level: '高中', category: '概率', name: '排列数', formula: 'A(n,m) = n! / (n-m)!', note: '从n个不同元素中取m个排列的数目。', example: 'A(5,3) = 5!/(5-3)! = 60' },
  { id: 'senior-35', level: '高中', category: '概率', name: '组合数', formula: 'C(n,m) = n! / [m!(n-m)!]', note: '从n个不同元素中取m个组合的数目。', example: 'C(5,3) = 5!/(3!×2!) = 10' },
  // 圆锥曲线
  { id: 'senior-36', level: '高中', category: '圆锥曲线', name: '椭圆标准方程', formula: 'x²/a² + y²/b² = 1 (a>b>0)', note: 'c² = a² - b²，焦点在x轴上。', example: 'a=5, b=3, c=4，焦点(±4,0)' },
  { id: 'senior-37', level: '高中', category: '圆锥曲线', name: '双曲线标准方程', formula: 'x²/a² - y²/b² = 1 (a>0, b>0)', note: 'c² = a² + b²，渐近线 y = ±(b/a)x。', example: 'a=3, b=4, c=5，焦点(±5,0)' },
  { id: 'senior-38', level: '高中', category: '圆锥曲线', name: '抛物线标准方程', formula: 'y² = 2px (p>0)', note: '焦点(p/2, 0)，准线 x = -p/2。', example: 'y²=8x，焦点(2,0)，准线x=-2' },
  { id: 'senior-39', level: '高中', category: '圆锥曲线', name: '椭圆离心率', formula: 'e = c/a (0<e<1)', note: 'e越接近0越圆，越接近1越扁。', example: 'a=5, c=3, e=3/5=0.6' }
];

/**
 * 获取所有年级段
 */
function getLevels() {
  return ['小学', '初中', '高中'];
}

/**
 * 获取某年级段的所有分类
 */
function getCategoriesByLevel(level) {
  var cats = [];
  var seen = {};
  for (var i = 0; i < FORMULAS.length; i++) {
    if (FORMULAS[i].level === level && !seen[FORMULAS[i].category]) {
      seen[FORMULAS[i].category] = true;
      cats.push(FORMULAS[i].category);
    }
  }
  return cats;
}

/**
 * 获取某年级段某分类的公式
 */
function getFormulas(level, category) {
  return FORMULAS.filter(function (f) {
    if (level && f.level !== level) return false;
    if (category && f.category !== category) return false;
    return true;
  });
}

/**
 * 搜索公式
 */
function searchFormulas(keyword) {
  if (!keyword) return [];
  var kw = keyword.toLowerCase();
  return FORMULAS.filter(function (f) {
    return f.name.toLowerCase().indexOf(kw) >= 0 ||
           f.formula.toLowerCase().indexOf(kw) >= 0 ||
           f.note.toLowerCase().indexOf(kw) >= 0 ||
           f.category.toLowerCase().indexOf(kw) >= 0;
  });
}

module.exports = {
  FORMULAS: FORMULAS,
  getLevels: getLevels,
  getCategoriesByLevel: getCategoriesByLevel,
  getFormulas: getFormulas,
  searchFormulas: searchFormulas
};
