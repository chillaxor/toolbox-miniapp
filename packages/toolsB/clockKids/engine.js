/**
 * 儿童认钟表（钟表小能手）- 计算引擎（纯函数模块）
 * 页面与离线校验脚本共用同一份代码，保证「验证的就是上线的」。
 * 无任何小程序 / WX 依赖，可在 node 下直接 require。
 *
 * 角度约定：0° = 12 点方向，顺时针为正。
 *   分针每分钟走 6°（360/60）；时针每小时走 30°（360/12），并随分钟再走 0.5°。
 */

// 出题可用的「分」集合（每 5 分钟一大格，符合小学认读习惯）
var MINUTES_SET = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function nextHour12(h12) { return (h12 % 12) + 1; }

// 表盘上 1..12 数字的百分比坐标（中心 50%,50%；半径 41%）
function clockNumbers() {
  var out = [];
  for (var n = 1; n <= 12; n++) {
    var ang = (n * 30) * Math.PI / 180; // 从 12 点顺时针
    var x = 50 + 41 * Math.sin(ang);
    var y = 50 - 41 * Math.cos(ang);
    out.push({ n: n, x: x.toFixed(2), y: y.toFixed(2) });
  }
  return out;
}

// 指针角度（0°=12点，顺时针）
function hourAngle(hour, minute) {
  var h = ((hour % 12) + (minute / 60));
  return h * 30; // 每小时 30°
}
function minuteAngle(minute) {
  return minute * 6; // 每分钟 6°
}

// 转为 12 小时制读数（0 点记作 12）
function h12(hour) {
  var h = hour % 12;
  return h === 0 ? 12 : h;
}

// 时间文字：整时 / 半时 / 几时几分
function timeText(hour, minute) {
  var h = h12(hour);
  if (minute === 0) return h + '时';
  if (minute === 30) return h + '时半';
  return h + '时' + minute + '分';
}

// 时间类型
function timeMode(minute) {
  if (minute === 0) return 'oclock';
  if (minute === 30) return 'half';
  return 'minutes';
}

// 构造一道题（hour 用 0-23 或 1-12 均可，内部统一到 12 制读数）
function buildQuiz(hour, minute, level) {
  return {
    hour: hour,
    minute: minute,
    h12: h12(hour),
    mode: timeMode(minute),
    text: timeText(hour, minute),
    hourAngle: hourAngle(hour, minute),
    minuteAngle: minuteAngle(minute),
    level: level || 'easy'
  };
}

// 出题：easy 只出整时/半时；hard 出全部 5 分钟刻度
function genQuiz(level) {
  var hour = randInt(1, 12);
  var minute;
  if (level === 'easy') {
    minute = pick([0, 30]);
  } else {
    minute = pick(MINUTES_SET);
  }
  return buildQuiz(hour, minute, level);
}

// 脚手架讲解：把「为什么这么读」拆成步骤，驱动推导链动画
function explainTime(hour, minute) {
  var h = h12(hour);
  var mode = timeMode(minute);
  var steps = [];

  if (mode === 'oclock') {
    steps.push({ key: 'min', label: '看分针', detail: '分针指向 12（正上方）→ 这表示「整时」', point: '分针指 12' });
    steps.push({ key: 'hour', label: '看时针', detail: '时针指向 ' + h + ' → 读作 ' + h + '时', point: '时针指 ' + h });
    steps.push({ key: 'ans', label: '答案', detail: timeText(hour, minute), point: '整时' });
  } else if (mode === 'half') {
    var h2 = nextHour12(h);
    steps.push({ key: 'min', label: '看分针', detail: '分针指向 6（正下方）→ 这表示「半时」', point: '分针指 6' });
    steps.push({ key: 'hour', label: '看时针', detail: '时针在 ' + h + ' 和 ' + h2 + ' 之间，刚走过 ' + h + ' → 读作 ' + h + '时半', point: '时针过 ' + h });
    steps.push({ key: 'ans', label: '答案', detail: timeText(hour, minute), point: '半时' });
  } else {
    var grid = minute / 5; // 第几大格
    var h2b = nextHour12(h);
    steps.push({ key: 'min', label: '看分针', detail: '分针指向第 ' + grid + ' 大格（每大格 = 5 分钟）', point: '第 ' + grid + ' 大格' });
    steps.push({ key: 'mincalc', label: '算分钟', detail: grid + ' × 5 = ' + minute + ' 分', point: minute + ' 分' });
    steps.push({ key: 'hour', label: '看时针', detail: '时针在 ' + h + ' 和 ' + h2b + ' 之间 → 读作 ' + h + '时多', point: '时针过 ' + h });
    steps.push({ key: 'ans', label: '答案', detail: timeText(hour, minute), point: '几时几分' });
  }
  return steps;
}

// 校验：pickedH(1-12) / pickedM 是否正确
function checkAnswer(pickedH, pickedM, quiz) {
  var correct = (pickedH === quiz.h12) && (pickedM === quiz.minute);
  return {
    correct: correct,
    pickedText: timeText(pickedH, pickedM),
    answerText: quiz.text,
    steps: explainTime(quiz.hour, quiz.minute)
  };
}

module.exports = {
  MINUTES_SET: MINUTES_SET,
  clockNumbers: clockNumbers,
  hourAngle: hourAngle,
  minuteAngle: minuteAngle,
  h12: h12,
  timeText: timeText,
  timeMode: timeMode,
  buildQuiz: buildQuiz,
  genQuiz: genQuiz,
  explainTime: explainTime,
  checkAnswer: checkAnswer
};
