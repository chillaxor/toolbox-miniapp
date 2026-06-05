function circle(cx, cy, r, n) {
  n = n || 24;
  var pts = [];
  for (var i = 0; i < n; i++) {
    var a = Math.PI * 2 * i / n - Math.PI / 2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function ellipse(cx, cy, rx, ry, n) {
  n = n || 24;
  var pts = [];
  for (var i = 0; i < n; i++) {
    var a = Math.PI * 2 * i / n - Math.PI / 2;
    pts.push([Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function heart(cx, cy, size) {
  var pts = [];
  var n = 32;
  for (var i = 0; i < n; i++) {
    var t = Math.PI * 2 * i / n;
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([Math.round((cx + x * size) * 10) / 10, Math.round((cy + y * size) * 10) / 10]);
  }
  return pts;
}

function star(cx, cy, ro, ri, points) {
  points = points || 5;
  var pts = [];
  for (var i = 0; i < points * 2; i++) {
    var r = i % 2 === 0 ? ro : ri;
    var a = Math.PI * 2 * i / (points * 2) - Math.PI / 2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function wave(yBase, amp, cx, width, n) {
  n = n || 20;
  var pts = [];
  for (var i = 0; i <= n; i++) {
    var x = cx - width / 2 + width * i / n;
    var y = yBase + amp * Math.sin(Math.PI * 2 * i / n * 2);
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return pts;
}

function roundedRect(x, y, w, h, r) {
  var n = 6;
  var pts = [];
  var corners = [
    [x + w - r, y + r],
    [x + r, y + r],
    [x + r, y + h - r],
    [x + w - r, y + h - r]
  ];
  var centers = [
    [x + w - r, y + r],
    [x + r, y + r],
    [x + r, y + h - r],
    [x + w - r, y + h - r]
  ];
  var starts = [-Math.PI / 2, Math.PI, Math.PI / 2, 0];
  for (var c = 0; c < 4; c++) {
    for (var i = 0; i <= n; i++) {
      var a = starts[c] + (Math.PI / 2) * i / n;
      pts.push([
        Math.round((centers[c][0] + r * Math.cos(a)) * 10) / 10,
        Math.round((centers[c][1] + r * Math.sin(a)) * 10) / 10
      ]);
    }
  }
  return pts;
}

var categories = [
  { id: 'animals', name: '动物世界', icon: '🐾', color: '#FF6B6B' },
  { id: 'plants', name: '花草植物', icon: '🌸', color: '#FF9FF3' },
  { id: 'scenery', name: '风景场景', icon: '🏔️', color: '#54A0FF' },
  { id: 'cartoon', name: '可爱卡通', icon: '🦄', color: '#C56CF0' },
  { id: 'culture', name: '文化艺术', icon: '🎭', color: '#FECA57' },
  { id: 'food', name: '美食甜品', icon: '🧁', color: '#FF9F43' }
];

var templates = {
  animals: [
    {
      id: 'giraffe', name: '长颈鹿', difficulty: 1,
      regions: [
        { id: 'head', points: ellipse(50, 24, 12, 10) },
        { id: 'ear_l', points: [[40, 16], [36, 10], [42, 10]] },
        { id: 'ear_r', points: [[58, 10], [64, 10], [60, 16]] },
        { id: 'horn_l', points: [[44, 14], [42, 4], [46, 4]] },
        { id: 'horn_r', points: [[54, 4], [58, 4], [56, 14]] },
        { id: 'eye_l', points: circle(46, 22, 3) },
        { id: 'eye_r', points: circle(54, 22, 3) },
        { id: 'spot_1', points: circle(44, 26, 4) },
        { id: 'spot_2', points: circle(56, 22, 3) },
        { id: 'neck', points: [[44, 34], [44, 64], [56, 64], [56, 34]] },
        { id: 'body', points: ellipse(50, 74, 24, 16) },
        { id: 'body_spot_1', points: circle(44, 70, 5) },
        { id: 'body_spot_2', points: circle(58, 76, 4) },
        { id: 'body_spot_3', points: circle(38, 78, 4) },
        { id: 'leg_fl', points: [[40, 86], [38, 98], [42, 98], [44, 86]] },
        { id: 'leg_fr', points: [[48, 86], [50, 98], [54, 98], [52, 86]] },
        { id: 'leg_bl', points: [[56, 86], [58, 98], [62, 98], [60, 86]] },
        { id: 'leg_br', points: [[64, 86], [66, 98], [70, 98], [68, 86]] },
        { id: 'tail', points: [[72, 68], [80, 64], [82, 68], [78, 72], [72, 72]] }
      ]
    },
    {
      id: 'dolphin', name: '海豚', difficulty: 1,
      regions: [
        { id: 'body', points: [[14, 44], [24, 30], [44, 26], [66, 30], [82, 38], [86, 46], [82, 52], [66, 58], [44, 60], [24, 56], [14, 50]] },
        { id: 'belly', points: [[30, 50], [42, 56], [64, 52], [76, 44], [64, 48], [42, 52], [30, 50]] },
        { id: 'nose', points: [[10, 44], [6, 42], [6, 46], [14, 44]] },
        { id: 'eye', points: circle(22, 40, 3) },
        { id: 'mouth', points: [[14, 44], [18, 46], [14, 48]] },
        { id: 'fin_dorsal', points: [[46, 26], [50, 10], [56, 28]] },
        { id: 'fin_left', points: [[36, 56], [28, 72], [44, 60]] },
        { id: 'fin_right', points: [[64, 52], [56, 68], [72, 56]] },
        { id: 'tail_1', points: [[82, 38], [94, 26], [96, 36], [86, 42]] },
        { id: 'tail_2', points: [[86, 46], [96, 52], [94, 62], [82, 50]] },
        { id: 'water_1', points: [[20, 80], [28, 72], [36, 80]] },
        { id: 'water_2', points: [[50, 82], [58, 74], [66, 82]] },
        { id: 'water_3', points: [[74, 78], [80, 70], [86, 78]] }
      ]
    },
    {
      id: 'lion', name: '狮子', difficulty: 2,
      regions: [
        { id: 'mane', points: circle(50, 36, 28) },
        { id: 'mane_inner', points: circle(50, 36, 22) },
        { id: 'head', points: circle(50, 36, 18) },
        { id: 'face', points: ellipse(50, 40, 12, 10) },
        { id: 'eye_l', points: ellipse(42, 34, 4, 5) },
        { id: 'eye_r', points: ellipse(58, 34, 4, 5) },
        { id: 'nose', points: [[50, 40], [46, 44], [54, 44]] },
        { id: 'mouth', points: [[44, 48], [50, 52], [56, 48]] },
        { id: 'whisker_l_1', points: [[36, 44], [24, 40], [24, 44]] },
        { id: 'whisker_l_2', points: [[36, 46], [24, 46], [24, 50]] },
        { id: 'whisker_r_1', points: [[64, 40], [76, 40], [64, 44]] },
        { id: 'whisker_r_2', points: [[64, 46], [76, 50], [64, 46]] },
        { id: 'body', points: ellipse(50, 68, 22, 20) },
        { id: 'leg_fl', points: [[34, 80], [32, 96], [40, 96], [40, 80]] },
        { id: 'leg_fr', points: [[60, 80], [60, 96], [68, 96], [66, 80]] },
        { id: 'tail', points: [[72, 60], [84, 52], [90, 48], [88, 44], [82, 48], [74, 56]] },
        { id: 'tail_tip', points: circle(88, 44, 5) }
      ]
    },
    {
      id: 'cat', name: '可爱猫咪', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[38, 24], [40, 8], [46, 6], [48, 22], [42, 16]] },
        { id: 'ear_r', points: [[52, 22], [54, 6], [60, 8], [62, 24], [58, 16]] },
        { id: 'head', points: circle(50, 34, 20) },
        { id: 'face', points: ellipse(50, 38, 12, 10) },
        { id: 'eye_l', points: ellipse(42, 32, 4, 5) },
        { id: 'eye_r', points: ellipse(58, 32, 4, 5) },
        { id: 'nose', points: [[50, 40], [47, 44], [53, 44]] },
        { id: 'body', points: ellipse(50, 70, 20, 22) },
        { id: 'paw_l', points: ellipse(38, 90, 7, 5) },
        { id: 'paw_r', points: ellipse(62, 90, 7, 5) },
        { id: 'tail', points: [[68, 60], [78, 48], [84, 38], [88, 32], [86, 30], [82, 36], [76, 46], [70, 56]] },
        { id: 'belly', points: ellipse(50, 74, 10, 10) }
      ]
    },
    {
      id: 'fish', name: '热带鱼', difficulty: 1,
      regions: [
        { id: 'top_fin', points: [[40, 38], [48, 18], [56, 22], [60, 38]] },
        { id: 'bottom_fin', points: [[40, 62], [48, 82], [56, 78], [60, 62]] },
        { id: 'tail', points: [[74, 50], [92, 30], [92, 70]] },
        { id: 'body', points: ellipse(48, 50, 28, 20) },
        { id: 'stripe_u', points: [[28, 40], [68, 38], [68, 44], [28, 46]] },
        { id: 'stripe_l', points: [[28, 54], [68, 56], [68, 62], [28, 60]] },
        { id: 'eye', points: circle(34, 46, 5) },
        { id: 'pupil', points: circle(33, 46, 2.5) }
      ]
    },
    {
      id: 'butterfly', name: '花蝴蝶', difficulty: 2,
      regions: [
        { id: 'wing_lu', points: [[46, 50], [36, 28], [18, 18], [8, 30], [14, 48], [32, 52]] },
        { id: 'wing_ll', points: [[32, 52], [12, 54], [6, 70], [18, 80], [38, 68], [46, 56]] },
        { id: 'wing_ru', points: [[54, 50], [64, 28], [82, 18], [92, 30], [86, 48], [68, 52]] },
        { id: 'wing_rl', points: [[68, 52], [88, 54], [94, 70], [82, 80], [62, 68], [54, 56]] },
        { id: 'body', points: ellipse(50, 54, 5, 18) },
        { id: 'head', points: circle(50, 34, 6) },
        { id: 'spot_lu', points: circle(26, 36, 6) },
        { id: 'spot_ru', points: circle(74, 36, 6) },
        { id: 'spot_ll', points: circle(22, 64, 5) },
        { id: 'spot_rl', points: circle(78, 64, 5) },
        { id: 'antenna_l', points: [[46, 30], [36, 16], [34, 14], [38, 16], [44, 28]] },
        { id: 'antenna_r', points: [[54, 30], [64, 16], [66, 14], [62, 16], [56, 28]] }
      ]
    },
    {
      id: 'panda', name: '大熊猫', difficulty: 1,
      regions: [
        { id: 'ear_l', points: circle(32, 16, 10) },
        { id: 'ear_r', points: circle(68, 16, 10) },
        { id: 'head', points: circle(50, 32, 22) },
        { id: 'eye_patch_l', points: ellipse(40, 30, 9, 7) },
        { id: 'eye_patch_r', points: ellipse(60, 30, 9, 7) },
        { id: 'eye_l', points: circle(40, 30, 3) },
        { id: 'eye_r', points: circle(60, 30, 3) },
        { id: 'nose', points: ellipse(50, 40, 4, 3) },
        { id: 'body', points: ellipse(50, 70, 22, 22) },
        { id: 'arm_l', points: [[26, 58], [18, 72], [24, 78], [32, 64]] },
        { id: 'arm_r', points: [[68, 64], [76, 78], [82, 72], [74, 58]] },
        { id: 'leg_l', points: ellipse(38, 90, 8, 6) },
        { id: 'leg_r', points: ellipse(62, 90, 8, 6) }
      ]
    },
    {
      id: 'dog', name: '萌犬', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[30, 28], [24, 10], [32, 6], [38, 22]] },
        { id: 'ear_r', points: [[62, 22], [68, 6], [76, 10], [70, 28]] },
        { id: 'head', points: circle(50, 30, 20) },
        { id: 'snout', points: ellipse(50, 40, 12, 8) },
        { id: 'nose', points: ellipse(50, 36, 4, 3) },
        { id: 'eye_l', points: circle(42, 28, 4) },
        { id: 'eye_r', points: circle(58, 28, 4) },
        { id: 'tongue', points: [[46, 48], [44, 56], [50, 58], [56, 56], [54, 48]] },
        { id: 'body', points: ellipse(50, 68, 22, 22) },
        { id: 'paw_l', points: ellipse(36, 90, 7, 5) },
        { id: 'paw_r', points: ellipse(64, 90, 7, 5) },
        { id: 'tail', points: [[70, 56], [80, 42], [84, 34], [82, 32], [78, 40], [72, 52]] },
        { id: 'collar', points: (function() { var b = [[34, 52], [34, 56], [66, 56], [66, 52]]; var e = ellipse(50, 52, 18, 2); return b.concat(e); })() }
      ]
    },
    {
      id: 'rabbit', name: '小兔子', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[42, 32], [38, 4], [44, 2], [48, 30]] },
        { id: 'ear_l_inner', points: [[43, 28], [40, 8], [44, 6], [46, 26]] },
        { id: 'ear_r', points: [[52, 30], [56, 2], [62, 4], [58, 32]] },
        { id: 'ear_r_inner', points: [[54, 26], [57, 6], [61, 8], [57, 28]] },
        { id: 'head', points: circle(50, 40, 18) },
        { id: 'eye_l', points: circle(44, 36, 4) },
        { id: 'eye_r', points: circle(56, 36, 4) },
        { id: 'nose', points: [[50, 44], [48, 46], [52, 46]] },
        { id: 'cheek_l', points: circle(38, 44, 5) },
        { id: 'cheek_r', points: circle(62, 44, 5) },
        { id: 'body', points: ellipse(50, 72, 20, 18) },
        { id: 'paw_l', points: [[34, 82], [30, 94], [42, 96], [42, 82]] },
        { id: 'paw_r', points: [[58, 82], [58, 96], [70, 94], [66, 82]] },
        { id: 'tail', points: circle(70, 78, 7) }
      ]
    },
    {
      id: 'owl', name: '猫头鹰', difficulty: 2,
      regions: [
        { id: 'ear_l', points: [[30, 20], [24, 8], [34, 16]] },
        { id: 'ear_r', points: [[70, 20], [76, 8], [66, 16]] },
        { id: 'head', points: ellipse(50, 32, 24, 20) },
        { id: 'eye_l', points: circle(40, 30, 9) },
        { id: 'eye_r', points: circle(60, 30, 9) },
        { id: 'pupil_l', points: circle(40, 30, 5) },
        { id: 'pupil_r', points: circle(60, 30, 5) },
        { id: 'beak', points: [[50, 38], [46, 44], [54, 44]] },
        { id: 'body', points: ellipse(50, 68, 22, 24) },
        { id: 'wing_l', points: [[26, 50], [16, 66], [22, 82], [34, 70]] },
        { id: 'wing_r', points: [[74, 70], [78, 82], [84, 66], [74, 50]] },
        { id: 'chest', points: ellipse(50, 66, 12, 14) },
        { id: 'foot_l', points: [[38, 90], [32, 96], [44, 96]] },
        { id: 'foot_r', points: [[56, 96], [68, 96], [62, 90]] }
      ]
    },
    {
      id: 'zodiac_rat', name: '生肖鼠', difficulty: 1,
      regions: [
        { id: 'ear_l', points: circle(36, 18, 12) },
        { id: 'ear_r', points: circle(64, 18, 12) },
        { id: 'ear_l_inner', points: circle(36, 18, 7) },
        { id: 'ear_r_inner', points: circle(64, 18, 7) },
        { id: 'head', points: circle(50, 34, 20) },
        { id: 'eye_l', points: circle(42, 30, 4) },
        { id: 'eye_r', points: circle(58, 30, 4) },
        { id: 'nose', points: circle(50, 38, 4) },
        { id: 'whisker_l_1', points: [[36, 38], [20, 34], [20, 38]] },
        { id: 'whisker_l_2', points: [[36, 40], [20, 42], [20, 46]] },
        { id: 'whisker_r_1', points: [[64, 34], [80, 34], [64, 38]] },
        { id: 'whisker_r_2', points: [[64, 40], [80, 46], [64, 42]] },
        { id: 'body', points: ellipse(50, 68, 22, 20) },
        { id: 'leg_l', points: ellipse(38, 88, 8, 6) },
        { id: 'leg_r', points: ellipse(62, 88, 8, 6) },
        { id: 'tail', points: [[72, 60], [84, 48], [88, 40], [86, 38], [82, 46], [74, 56]] }
      ]
    },
    {
      id: 'zodiac_ox', name: '生肖牛', difficulty: 2,
      regions: [
        { id: 'head', points: circle(50, 32, 18) },
        { id: 'ear_l', points: [[34, 18], [28, 8], [36, 14]] },
        { id: 'ear_r', points: [[64, 8], [72, 18], [66, 14]] },
        { id: 'horn_l', points: [[32, 16], [24, 2], [30, 12]] },
        { id: 'horn_r', points: [[68, 2], [76, 16], [70, 12]] },
        { id: 'face', points: ellipse(50, 38, 12, 8) },
        { id: 'eye_l', points: circle(42, 28, 4) },
        { id: 'eye_r', points: circle(58, 28, 4) },
        { id: 'nose', points: ellipse(50, 42, 6, 4) },
        { id: 'nose_ring', points: circle(50, 46, 4) },
        { id: 'body', points: ellipse(50, 68, 22, 18) },
        { id: 'leg_fl', points: [[34, 80], [32, 96], [40, 96], [40, 80]] },
        { id: 'leg_fr', points: [[60, 80], [60, 96], [68, 96], [66, 80]] },
        { id: 'tail', points: [[72, 60], [82, 52], [86, 48], [84, 56], [78, 62], [74, 64]] },
        { id: 'bell', points: circle(50, 54, 5) }
      ]
    },
    {
      id: 'zodiac_tiger', name: '生肖虎', difficulty: 2,
      regions: [
        { id: 'ear_l', points: [[30, 22], [24, 8], [36, 16]] },
        { id: 'ear_r', points: [[64, 8], [76, 22], [70, 16]] },
        { id: 'head', points: circle(50, 34, 22) },
        { id: 'face', points: ellipse(50, 38, 14, 12) },
        { id: 'eye_l', points: ellipse(42, 32, 4, 5) },
        { id: 'eye_r', points: ellipse(58, 32, 4, 5) },
        { id: 'nose', points: [[50, 40], [46, 44], [54, 44]] },
        { id: 'mouth', points: [[44, 48], [50, 52], [56, 48]] },
        { id: 'stripe_1', points: [[42, 20], [38, 16], [46, 16]] },
        { id: 'stripe_2', points: [[58, 16], [62, 16], [54, 20]] },
        { id: 'stripe_3', points: [[34, 28], [30, 24], [38, 24]] },
        { id: 'stripe_4', points: [[62, 24], [70, 24], [66, 28]] },
        { id: 'body', points: ellipse(50, 70, 24, 20) },
        { id: 'stripe_b1', points: [[42, 64], [38, 60], [46, 60]] },
        { id: 'stripe_b2', points: [[58, 60], [62, 60], [54, 64]] },
        { id: 'leg_fl', points: [[32, 82], [30, 96], [40, 96], [40, 82]] },
        { id: 'leg_fr', points: [[60, 82], [60, 96], [70, 96], [68, 82]] },
        { id: 'tail', points: [[74, 62], [84, 52], [90, 48], [88, 56], [80, 64]] }
      ]
    },
    {
      id: 'zodiac_rabbit', name: '生肖兔', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[42, 32], [38, 2], [44, 0], [48, 30]] },
        { id: 'ear_l_inner', points: [[43, 28], [40, 6], [44, 4], [46, 26]] },
        { id: 'ear_r', points: [[52, 30], [56, 0], [62, 2], [58, 32]] },
        { id: 'ear_r_inner', points: [[54, 26], [57, 4], [61, 6], [57, 28]] },
        { id: 'head', points: circle(50, 40, 18) },
        { id: 'eye_l', points: circle(44, 36, 4) },
        { id: 'eye_r', points: circle(56, 36, 4) },
        { id: 'nose', points: [[50, 44], [48, 46], [52, 46]] },
        { id: 'cheek_l', points: circle(38, 44, 5) },
        { id: 'cheek_r', points: circle(62, 44, 5) },
        { id: 'body', points: ellipse(50, 72, 20, 18) },
        { id: 'paw_l', points: [[34, 82], [30, 94], [42, 96], [42, 82]] },
        { id: 'paw_r', points: [[58, 82], [58, 96], [70, 94], [66, 82]] },
        { id: 'tail', points: circle(70, 78, 7) }
      ]
    },
    {
      id: 'zodiac_dragon', name: '生肖龙', difficulty: 3,
      regions: [
        { id: 'head', points: ellipse(36, 28, 16, 14) },
        { id: 'horn_l', points: [[28, 16], [22, 4], [30, 12]] },
        { id: 'horn_r', points: [[42, 16], [48, 4], [44, 12]] },
        { id: 'eye', points: circle(32, 26, 4) },
        { id: 'nose', points: circle(26, 30, 3) },
        { id: 'whisker_l', points: [[20, 34], [10, 30], [10, 34], [20, 38]] },
        { id: 'whisker_r', points: [[20, 38], [10, 42], [10, 46], [20, 42]] },
        { id: 'body_1', points: [[44, 34], [58, 28], [66, 36], [52, 42]] },
        { id: 'body_2', points: [[58, 38], [72, 32], [80, 40], [68, 46]] },
        { id: 'body_3', points: [[74, 42], [86, 38], [92, 48], [82, 52]] },
        { id: 'tail', points: [[88, 50], [96, 44], [98, 54], [92, 62], [90, 56]] },
        { id: 'leg_fl', points: [[48, 44], [40, 58], [48, 62], [54, 50]] },
        { id: 'leg_fr', points: [[66, 46], [60, 62], [68, 66], [72, 52]] },
        { id: 'scale_1', points: [[52, 34], [50, 30], [56, 30]] },
        { id: 'scale_2', points: [[66, 36], [64, 32], [70, 32]] },
        { id: 'flame_1', points: [[22, 32], [12, 26], [16, 36]] },
        { id: 'flame_2', points: [[22, 36], [10, 36], [16, 46]] }
      ]
    },
    {
      id: 'zodiac_snake', name: '生肖蛇', difficulty: 2,
      regions: [
        { id: 'head', points: ellipse(36, 22, 14, 10) },
        { id: 'eye_l', points: circle(30, 20, 3) },
        { id: 'eye_r', points: circle(42, 20, 3) },
        { id: 'tongue', points: [[22, 24], [14, 20], [14, 28], [22, 24]] },
        { id: 'body_1', points: [[48, 24], [62, 20], [70, 28], [56, 32], [48, 28]] },
        { id: 'body_2', points: [[68, 30], [82, 28], [88, 36], [78, 40], [66, 36]] },
        { id: 'body_3', points: [[84, 42], [90, 50], [82, 58], [72, 52], [78, 44]] },
        { id: 'body_4', points: [[76, 56], [68, 64], [56, 68], [62, 58], [72, 52]] },
        { id: 'body_5', points: [[58, 66], [48, 74], [36, 76], [42, 66], [52, 62]] },
        { id: 'tail', points: [[38, 78], [28, 82], [22, 78], [30, 72], [36, 74]] },
        { id: 'pattern_1', points: circle(56, 26, 4) },
        { id: 'pattern_2', points: circle(76, 36, 4) },
        { id: 'pattern_3', points: circle(76, 52, 3) },
        { id: 'pattern_4', points: circle(54, 64, 3) }
      ]
    },
    {
      id: 'zodiac_horse', name: '生肖马', difficulty: 2,
      regions: [
        { id: 'ear_l', points: [[38, 16], [34, 6], [42, 12]] },
        { id: 'ear_r', points: [[46, 6], [54, 16], [50, 12]] },
        { id: 'head', points: ellipse(44, 28, 16, 14) },
        { id: 'eye', points: circle(38, 26, 4) },
        { id: 'nose', points: ellipse(32, 34, 6, 4) },
        { id: 'mane_1', points: [[46, 14], [52, 8], [56, 18], [48, 22]] },
        { id: 'mane_2', points: [[48, 22], [56, 18], [60, 30], [50, 32]] },
        { id: 'mane_3', points: [[50, 32], [60, 30], [62, 44], [52, 42]] },
        { id: 'body', points: ellipse(56, 62, 24, 18) },
        { id: 'leg_fl', points: [[38, 72], [36, 96], [44, 96], [44, 72]] },
        { id: 'leg_fr', points: [[50, 72], [50, 96], [58, 96], [56, 72]] },
        { id: 'leg_bl', points: [[64, 74], [62, 96], [70, 96], [70, 74]] },
        { id: 'leg_br', points: [[76, 72], [76, 96], [84, 96], [82, 72]] },
        { id: 'tail', points: [[80, 54], [92, 42], [96, 48], [90, 58], [82, 60]] }
      ]
    },
    {
      id: 'zodiac_goat', name: '生肖羊', difficulty: 2,
      regions: [
        { id: 'horn_l', points: [[32, 18], [24, 4], [30, 2], [38, 14]] },
        { id: 'horn_r', points: [[62, 4], [76, 18], [70, 14], [68, 2]] },
        { id: 'head', points: circle(50, 30, 18) },
        { id: 'face', points: ellipse(50, 36, 10, 8) },
        { id: 'eye_l', points: circle(42, 28, 4) },
        { id: 'eye_r', points: circle(58, 28, 4) },
        { id: 'nose', points: ellipse(50, 36, 4, 3) },
        { id: 'beard', points: [[46, 44], [44, 58], [50, 60], [56, 58], [54, 44]] },
        { id: 'body', points: ellipse(50, 68, 24, 20) },
        { id: 'wool_1', points: circle(40, 62, 8) },
        { id: 'wool_2', points: circle(54, 58, 8) },
        { id: 'wool_3', points: circle(64, 66, 7) },
        { id: 'leg_fl', points: [[34, 82], [32, 96], [40, 96], [40, 82]] },
        { id: 'leg_fr', points: [[60, 82], [60, 96], [68, 96], [66, 82]] },
        { id: 'tail', points: circle(76, 68, 6) }
      ]
    },
    {
      id: 'zodiac_monkey', name: '生肖猴', difficulty: 2,
      regions: [
        { id: 'ear_l', points: circle(30, 28, 10) },
        { id: 'ear_r', points: circle(70, 28, 10) },
        { id: 'ear_l_inner', points: circle(30, 28, 6) },
        { id: 'ear_r_inner', points: circle(70, 28, 6) },
        { id: 'head', points: circle(50, 32, 20) },
        { id: 'face', points: ellipse(50, 38, 14, 12) },
        { id: 'eye_l', points: circle(42, 30, 4) },
        { id: 'eye_r', points: circle(58, 30, 4) },
        { id: 'nose', points: [[50, 38], [47, 42], [53, 42]] },
        { id: 'mouth', points: [[44, 46], [50, 50], [56, 46]] },
        { id: 'body', points: ellipse(50, 70, 20, 20) },
        { id: 'arm_l', points: [[30, 60], [18, 76], [24, 82], [34, 68]] },
        { id: 'arm_r', points: [[66, 68], [76, 82], [82, 76], [70, 60]] },
        { id: 'leg_l', points: [[38, 86], [34, 96], [44, 96], [44, 86]] },
        { id: 'leg_r', points: [[56, 86], [56, 96], [66, 96], [62, 86]] },
        { id: 'tail', points: [[68, 62], [82, 50], [90, 38], [92, 42], [86, 54], [72, 66]] }
      ]
    },
    {
      id: 'zodiac_rooster', name: '生肖鸡', difficulty: 2,
      regions: [
        { id: 'comb', points: [[44, 10], [42, 2], [48, 0], [52, 4], [56, 0], [58, 6], [54, 12]] },
        { id: 'head', points: circle(50, 22, 14) },
        { id: 'eye', points: circle(46, 20, 3) },
        { id: 'beak', points: [[36, 26], [30, 22], [30, 30]] },
        { id: 'body', points: ellipse(52, 58, 22, 20) },
        { id: 'wing', points: [[52, 44], [68, 50], [76, 64], [64, 72], [52, 62]] },
        { id: 'wing_pattern', points: [[56, 50], [66, 54], [72, 64], [62, 68], [54, 58]] },
        { id: 'tail_1', points: [[72, 50], [88, 32], [92, 38], [80, 56]] },
        { id: 'tail_2', points: [[74, 56], [92, 42], [94, 50], [82, 62]] },
        { id: 'tail_3', points: [[72, 62], [86, 52], [90, 60], [78, 68]] },
        { id: 'leg_l', points: [[44, 76], [40, 92], [44, 94], [48, 78]] },
        { id: 'leg_r', points: [[56, 78], [56, 94], [60, 92], [60, 76]] },
        { id: 'foot_l_1', points: [[36, 92], [32, 98], [38, 98]] },
        { id: 'foot_l_2', points: [[44, 94], [42, 100], [48, 100]] },
        { id: 'foot_r_1', points: [[52, 94], [50, 100], [56, 100]] },
        { id: 'foot_r_2', points: [[60, 92], [58, 98], [64, 98]] }
      ]
    },
    {
      id: 'zodiac_dog', name: '生肖狗', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[30, 28], [24, 10], [32, 6], [38, 22]] },
        { id: 'ear_r', points: [[62, 22], [68, 6], [76, 10], [70, 28]] },
        { id: 'head', points: circle(50, 30, 20) },
        { id: 'snout', points: ellipse(50, 40, 12, 8) },
        { id: 'nose', points: ellipse(50, 36, 4, 3) },
        { id: 'eye_l', points: circle(42, 28, 4) },
        { id: 'eye_r', points: circle(58, 28, 4) },
        { id: 'tongue', points: [[46, 48], [44, 56], [50, 58], [56, 56], [54, 48]] },
        { id: 'body', points: ellipse(50, 68, 22, 22) },
        { id: 'paw_l', points: ellipse(36, 90, 7, 5) },
        { id: 'paw_r', points: ellipse(64, 90, 7, 5) },
        { id: 'tail', points: [[70, 56], [80, 42], [84, 34], [82, 32], [78, 40], [72, 52]] },
        { id: 'collar', points: (function() { var b = [[34, 52], [34, 56], [66, 56], [66, 52]]; var e = ellipse(50, 52, 18, 2); return b.concat(e); })() }
      ]
    },
    {
      id: 'zodiac_pig', name: '生肖猪', difficulty: 1,
      regions: [
        { id: 'ear_l', points: [[30, 22], [24, 10], [36, 16]] },
        { id: 'ear_r', points: [[64, 10], [76, 22], [70, 16]] },
        { id: 'head', points: circle(50, 34, 22) },
        { id: 'face', points: ellipse(50, 38, 14, 12) },
        { id: 'eye_l', points: circle(42, 30, 4) },
        { id: 'eye_r', points: circle(58, 30, 4) },
        { id: 'nose', points: ellipse(50, 42, 8, 5) },
        { id: 'nostril_l', points: circle(47, 42, 2) },
        { id: 'nostril_r', points: circle(53, 42, 2) },
        { id: 'body', points: ellipse(50, 70, 24, 20) },
        { id: 'leg_fl', points: [[34, 82], [32, 96], [40, 96], [40, 82]] },
        { id: 'leg_fr', points: [[60, 82], [60, 96], [68, 96], [66, 82]] },
        { id: 'tail', points: [[74, 62], [84, 56], [88, 52], [86, 58], [80, 64], [76, 66]] }
      ]
    },
    {
      id: 'elephant', name: '大象', difficulty: 2,
      regions: [
        { id: 'head', points: circle(50, 30, 20) },
        { id: 'ear_l', points: ellipse(28, 32, 14, 16) },
        { id: 'ear_r', points: ellipse(72, 32, 14, 16) },
        { id: 'ear_l_inner', points: ellipse(28, 32, 8, 10) },
        { id: 'ear_r_inner', points: ellipse(72, 32, 8, 10) },
        { id: 'trunk', points: [[46, 42], [42, 58], [38, 72], [34, 80], [38, 82], [44, 74], [48, 60], [50, 44], [54, 44], [52, 60], [56, 74], [62, 82], [66, 80], [62, 72], [58, 58], [54, 42]] },
        { id: 'eye_l', points: circle(42, 26, 4) },
        { id: 'eye_r', points: circle(58, 26, 4) },
        { id: 'body', points: ellipse(50, 68, 24, 20) },
        { id: 'leg_fl', points: [[32, 78], [30, 96], [40, 96], [40, 78]] },
        { id: 'leg_fr', points: [[60, 78], [60, 96], [70, 96], [68, 78]] },
        { id: 'tail', points: [[74, 60], [82, 54], [86, 58], [84, 62], [76, 64]] }
      ]
    }
  ],

  plants: [
    {
      id: 'bamboo', name: '竹子', difficulty: 1,
      regions: [
        { id: 'stem_1', points: [[42, 8], [42, 36], [50, 36], [50, 8]] },
        { id: 'stem_2', points: [[42, 36], [42, 64], [50, 64], [50, 36]] },
        { id: 'stem_3', points: [[42, 64], [42, 92], [50, 92], [50, 64]] },
        { id: 'node_1', points: [[40, 34], [40, 38], [52, 38], [52, 34]] },
        { id: 'node_2', points: [[40, 62], [40, 66], [52, 66], [52, 62]] },
        { id: 'leaf_l1', points: [[42, 20], [22, 14], [16, 20], [30, 26]] },
        { id: 'leaf_l2', points: [[42, 28], [24, 30], [18, 36], [34, 34]] },
        { id: 'leaf_r1', points: [[50, 48], [70, 42], [76, 48], [62, 54]] },
        { id: 'leaf_r2', points: [[50, 56], [68, 60], [74, 66], [58, 64]] },
        { id: 'leaf_l3', points: [[42, 76], [20, 70], [14, 78], [28, 82]] },
        { id: 'leaf_r3', points: [[50, 82], [72, 78], [78, 86], [62, 88]] }
      ]
    },
    {
      id: 'bonsai', name: '盆景', difficulty: 2,
      regions: [
        { id: 'pot_rim', points: [[20, 70], [20, 76], [80, 76], [80, 70]] },
        { id: 'pot', points: [[24, 76], [28, 96], [72, 96], [76, 76]] },
        { id: 'pot_decoration', points: [[34, 82], [34, 90], [66, 90], [66, 82]] },
        { id: 'trunk', points: [[44, 70], [46, 40], [54, 40], [56, 70]] },
        { id: 'branch_l', points: [[46, 44], [24, 30], [22, 34], [44, 46]] },
        { id: 'branch_r', points: [[54, 48], [76, 36], [78, 40], [56, 50]] },
        { id: 'branch_t', points: [[48, 40], [44, 20], [56, 20], [52, 40]] },
        { id: 'foliage_l', points: circle(28, 28, 14) },
        { id: 'foliage_r', points: circle(72, 34, 12) },
        { id: 'foliage_t', points: circle(50, 18, 14) },
        { id: 'moss_1', points: [[30, 96], [26, 100], [36, 100]] },
        { id: 'moss_2', points: [[64, 96], [70, 100], [74, 100]] }
      ]
    },
    {
      id: 'lavender', name: '薰衣草', difficulty: 1,
      regions: [
        { id: 'stem_1', points: [[32, 40], [30, 96], [34, 96], [36, 40]] },
        { id: 'stem_2', points: [[46, 36], [44, 96], [48, 96], [50, 36]] },
        { id: 'stem_3', points: [[62, 42], [60, 96], [64, 96], [66, 42]] },
        { id: 'flower_1a', points: circle(33, 32, 4) },
        { id: 'flower_1b', points: circle(33, 24, 4) },
        { id: 'flower_1c', points: circle(33, 16, 4) },
        { id: 'flower_1d', points: circle(33, 10, 3) },
        { id: 'flower_2a', points: circle(47, 28, 4) },
        { id: 'flower_2b', points: circle(47, 20, 4) },
        { id: 'flower_2c', points: circle(47, 12, 4) },
        { id: 'flower_2d', points: circle(47, 5, 3) },
        { id: 'flower_3a', points: circle(63, 34, 4) },
        { id: 'flower_3b', points: circle(63, 26, 4) },
        { id: 'flower_3c', points: circle(63, 18, 4) },
        { id: 'flower_3d', points: circle(63, 11, 3) },
        { id: 'leaf_l', points: [[30, 58], [16, 50], [14, 56], [28, 62]] },
        { id: 'leaf_r', points: [[64, 62], [78, 56], [80, 62], [66, 68]] },
        { id: 'ground', points: [[0, 92], [100, 92], [100, 100], [0, 100]] }
      ]
    },
    {
      id: 'sunflower', name: '向日葵', difficulty: 1,
      regions: [
        { id: 'center', points: circle(50, 36, 12) },
        { id: 'center_inner', points: circle(50, 36, 7) },
        { id: 'petal_t', points: [[46, 24], [44, 8], [50, 6], [56, 8], [54, 24]] },
        { id: 'petal_tr', points: [[56, 26], [66, 14], [72, 20], [66, 30]] },
        { id: 'petal_r', points: [[62, 34], [76, 30], [78, 38], [76, 46], [62, 42]] },
        { id: 'petal_br', points: [[56, 48], [68, 48], [70, 58], [62, 52]] },
        { id: 'petal_b', points: [[54, 50], [58, 64], [50, 66], [42, 64], [46, 50]] },
        { id: 'petal_bl', points: [[44, 48], [38, 52], [30, 58], [32, 48]] },
        { id: 'petal_l', points: [[38, 42], [24, 46], [22, 38], [24, 30], [38, 34]] },
        { id: 'petal_tl', points: [[44, 26], [34, 30], [28, 20], [34, 14]] },
        { id: 'stem', points: [[47, 54], [47, 94], [53, 94], [53, 54]] },
        { id: 'leaf_l', points: [[47, 74], [28, 62], [24, 68], [38, 80]] },
        { id: 'leaf_r', points: [[53, 80], [62, 68], [76, 66], [58, 84]] }
      ]
    },
    {
      id: 'rose', name: '玫瑰花', difficulty: 2,
      regions: [
        { id: 'center', points: circle(50, 36, 6) },
        { id: 'petal_1', points: [[44, 30], [36, 20], [44, 18], [50, 30]] },
        { id: 'petal_2', points: [[50, 30], [56, 18], [64, 20], [56, 30]] },
        { id: 'petal_3', points: [[56, 36], [66, 32], [66, 42], [56, 42]] },
        { id: 'petal_4', points: [[56, 46], [64, 56], [54, 56], [50, 46]] },
        { id: 'petal_5', points: [[44, 46], [46, 56], [36, 56], [44, 42]] },
        { id: 'petal_6', points: [[44, 36], [34, 42], [34, 32], [44, 30]] },
        { id: 'petal_outer_l', points: [[34, 28], [24, 22], [26, 36], [34, 34]] },
        { id: 'petal_outer_r', points: [[66, 34], [74, 36], [76, 22], [66, 28]] },
        { id: 'stem', points: [[47, 56], [47, 90], [53, 90], [53, 56]] },
        { id: 'leaf_l', points: [[47, 70], [30, 58], [26, 64], [40, 76]] },
        { id: 'leaf_r', points: [[53, 76], [62, 64], [76, 62], [58, 82]] },
        { id: 'thorn_1', points: [[47, 64], [42, 60], [47, 62]] },
        { id: 'thorn_2', points: [[53, 80], [58, 76], [53, 78]] }
      ]
    },
    {
      id: 'cherry_blossom', name: '樱花', difficulty: 1,
      regions: [
        { id: 'petal_1', points: [[50, 20], [40, 10], [36, 24], [50, 36]] },
        { id: 'petal_2', points: [[50, 36], [64, 24], [72, 28], [64, 42]] },
        { id: 'petal_3', points: [[64, 50], [74, 58], [66, 68], [54, 58]] },
        { id: 'petal_4', points: [[46, 58], [34, 68], [26, 58], [36, 50]] },
        { id: 'petal_5', points: [[36, 42], [28, 28], [36, 24], [50, 36]] },
        { id: 'center', points: circle(50, 42, 7) },
        { id: 'stamen_1', points: [[48, 36], [46, 28], [48, 30]] },
        { id: 'stamen_2', points: [[56, 38], [62, 32], [60, 34]] },
        { id: 'stem', points: [[48, 58], [44, 90], [48, 92], [52, 58]] },
        { id: 'leaf_l', points: [[44, 72], [28, 64], [26, 70], [40, 78]] },
        { id: 'leaf_r', points: [[52, 68], [60, 60], [72, 62], [56, 74]] }
      ]
    },
    {
      id: 'mushroom', name: '小蘑菇', difficulty: 1,
      regions: [
        { id: 'cap_l', points: [[50, 26], [38, 28], [22, 38], [18, 50], [30, 52], [50, 52]] },
        { id: 'cap_r', points: [[50, 52], [70, 52], [82, 50], [78, 38], [62, 28], [50, 26]] },
        { id: 'spot_1', points: circle(36, 36, 6) },
        { id: 'spot_2', points: circle(54, 32, 5) },
        { id: 'spot_3', points: circle(68, 40, 5) },
        { id: 'spot_4', points: circle(46, 46, 4) },
        { id: 'stem', points: [[40, 52], [38, 84], [62, 84], [60, 52]] },
        { id: 'stem_ring', points: [[38, 66], [38, 70], [62, 70], [62, 66]] },
        { id: 'grass_l', points: [[18, 90], [28, 72], [34, 90]] },
        { id: 'grass_r', points: [[66, 90], [72, 72], [82, 90]] },
        { id: 'ground', points: [[10, 90], [10, 96], [90, 96], [90, 90]] }
      ]
    },
    {
      id: 'tulip', name: '郁金香', difficulty: 1,
      regions: [
        { id: 'petal_l', points: [[50, 16], [34, 20], [32, 38], [40, 48], [50, 48]] },
        { id: 'petal_c', points: [[46, 12], [50, 6], [54, 12], [54, 48], [46, 48]] },
        { id: 'petal_r', points: [[50, 48], [60, 48], [68, 38], [66, 20], [50, 16]] },
        { id: 'stem', points: [[47, 48], [47, 88], [53, 88], [53, 48]] },
        { id: 'leaf_l', points: [[47, 62], [28, 52], [24, 58], [36, 70]] },
        { id: 'leaf_r', points: [[53, 68], [64, 58], [76, 56], [58, 76]] }
      ]
    },
    {
      id: 'cactus', name: '仙人掌', difficulty: 1,
      regions: [
        { id: 'pot_rim', points: [[24, 66], [24, 72], [76, 72], [76, 66]] },
        { id: 'pot', points: [[28, 70], [28, 94], [72, 94], [72, 70]] },
        { id: 'pot_pattern', points: [[34, 78], [34, 88], [66, 88], [66, 78]] },
        { id: 'body', points: roundedRect(38, 16, 24, 52, 12) },
        { id: 'arm_l', points: [[38, 34], [22, 34], [22, 18], [28, 14], [28, 28], [38, 28]] },
        { id: 'arm_l_tip', points: circle(25, 14, 6) },
        { id: 'arm_r', points: [[62, 28], [78, 28], [78, 14], [72, 10], [72, 22], [62, 22]] },
        { id: 'arm_r_tip', points: circle(75, 10, 6) },
        { id: 'flower', points: circle(50, 10, 6) },
        { id: 'flower_center', points: circle(50, 10, 3) },
        { id: 'spine_1', points: [[44, 24], [42, 20], [46, 20]] },
        { id: 'spine_2', points: [[54, 30], [56, 26], [58, 30]] }
      ]
    },
    {
      id: 'tree', name: '大树', difficulty: 1,
      regions: [
        { id: 'crown_l', points: circle(32, 28, 18) },
        { id: 'crown_r', points: circle(68, 28, 18) },
        { id: 'crown_c', points: circle(50, 20, 20) },
        { id: 'trunk', points: [[42, 48], [40, 90], [60, 90], [58, 48]] },
        { id: 'branch_l', points: [[42, 58], [28, 50], [26, 54], [40, 62]] },
        { id: 'branch_r', points: [[58, 54], [72, 46], [74, 50], [60, 58]] },
        { id: 'root_l', points: [[40, 88], [30, 94], [34, 96], [42, 92]] },
        { id: 'root_r', points: [[60, 92], [66, 96], [70, 94], [60, 88]] },
        { id: 'nest', points: circle(60, 36, 6) }
      ]
    },
    {
      id: 'lotus', name: '荷花', difficulty: 2,
      regions: [
        { id: 'petal_1', points: [[50, 16], [40, 20], [38, 36], [50, 40]] },
        { id: 'petal_2', points: [[50, 40], [62, 36], [60, 20], [50, 16]] },
        { id: 'petal_3', points: [[38, 36], [28, 32], [26, 44], [38, 46]] },
        { id: 'petal_4', points: [[62, 46], [74, 44], [72, 32], [62, 36]] },
        { id: 'petal_5', points: [[38, 46], [30, 52], [34, 60], [42, 52]] },
        { id: 'petal_6', points: [[62, 52], [66, 60], [70, 52], [62, 46]] },
        { id: 'center', points: circle(50, 38, 8) },
        { id: 'pad_1', points: ellipse(30, 82, 20, 8) },
        { id: 'pad_2', points: ellipse(70, 84, 18, 7) },
        { id: 'water', points: [[0, 74], [100, 74], [100, 100], [0, 100]] }
      ]
    }
  ],

  scenery: [
    {
      id: 'underwater', name: '美人鱼', difficulty: 2,
      regions: [
        { id: 'head', points: circle(50, 26, 14) },
        { id: 'hair_l', points: [[36, 22], [26, 10], [30, 6], [34, 16]] },
        { id: 'hair_r', points: [[64, 22], [74, 10], [70, 6], [66, 16]] },
        { id: 'hair_flow', points: [[30, 30], [18, 50], [22, 62], [32, 48], [36, 38]] },
        { id: 'eye_l', points: circle(44, 24, 3) },
        { id: 'eye_r', points: circle(56, 24, 3) },
        { id: 'tail_1', points: [[46, 40], [46, 58], [54, 58], [54, 40]] },
        { id: 'tail_2', points: [[44, 58], [40, 74], [50, 76], [60, 74], [56, 58]] },
        { id: 'tail_fin_l', points: [[40, 74], [30, 88], [44, 82]] },
        { id: 'tail_fin_r', points: [[60, 74], [70, 88], [56, 82]] },
        { id: 'shell_top', points: circle(46, 42, 4) },
        { id: 'shell_bottom', points: circle(54, 42, 4) },
        { id: 'bubble_1', points: circle(78, 20, 4) },
        { id: 'bubble_2', points: circle(84, 32, 3) },
        { id: 'bubble_3', points: circle(16, 40, 3) },
        { id: 'starfish', points: star(20, 80, 6, 3) },
        { id: 'seaweed', points: [[12, 84], [8, 60], [14, 56], [18, 84]] }
      ]
    },
    {
      id: 'campfire', name: '篝火露营', difficulty: 2,
      regions: [
        { id: 'sky', points: [[0, 0], [100, 0], [100, 60], [0, 60]] },
        { id: 'ground', points: [[0, 60], [100, 60], [100, 100], [0, 100]] },
        { id: 'tent', points: [[20, 60], [40, 24], [60, 60]] },
        { id: 'tent_door', points: [[34, 60], [40, 38], [46, 60]] },
        { id: 'log_l', points: [[36, 72], [30, 80], [38, 80], [44, 72]] },
        { id: 'log_r', points: [[56, 72], [50, 80], [58, 80], [64, 72]] },
        { id: 'flame_1', points: [[42, 72], [46, 50], [50, 42], [54, 50], [58, 72]] },
        { id: 'flame_2', points: [[44, 72], [48, 56], [50, 48], [52, 56], [56, 72]] },
        { id: 'flame_inner', points: [[48, 72], [50, 60], [52, 72]] },
        { id: 'star_1', points: star(76, 14, 4, 2) },
        { id: 'star_2', points: star(88, 26, 3, 1.5) },
        { id: 'star_3', points: star(68, 8, 3, 1.5) },
        { id: 'moon', points: circle(82, 10, 6) },
        { id: 'tree_1', points: [[72, 60], [78, 28], [84, 60]] },
        { id: 'tree_2', points: [[86, 60], [92, 32], [98, 60]] },
        { id: 'grass_1', points: [[4, 60], [10, 50], [16, 60]] },
        { id: 'grass_2', points: [[88, 60], [94, 52], [100, 60]] }
      ]
    },
    {
      id: 'volcano', name: '火山爆发', difficulty: 2,
      regions: [
        { id: 'sky', points: [[0, 0], [100, 0], [100, 60], [0, 60]] },
        { id: 'ground', points: [[0, 60], [100, 60], [100, 100], [0, 100]] },
        { id: 'volcano', points: [[20, 60], [50, 8], [80, 60]] },
        { id: 'crater', points: [[42, 14], [50, 8], [58, 14]] },
        { id: 'lava_flow', points: [[46, 14], [44, 36], [40, 58], [48, 56], [50, 14], [52, 56], [60, 58], [56, 36], [54, 14]] },
        { id: 'smoke_1', points: circle(44, 4, 6) },
        { id: 'smoke_2', points: circle(54, 2, 5) },
        { id: 'fireball_1', points: circle(38, 2, 4) },
        { id: 'fireball_2', points: circle(62, 4, 3) },
        { id: 'palm_1', points: [[8, 60], [12, 38], [16, 60]] },
        { id: 'palm_leaf', points: [[8, 40], [2, 32], [6, 38], [4, 44]] },
        { id: 'ocean', points: [[0, 84], [100, 84], [100, 100], [0, 100]] }
      ]
    },
    {
      id: 'castle', name: '童话城堡', difficulty: 2,
      regions: [
        { id: 'tower_l', points: [[10, 28], [10, 80], [30, 80], [30, 28]] },
        { id: 'tower_l_roof', points: [[8, 28], [20, 6], [32, 28]] },
        { id: 'tower_r', points: [[70, 28], [70, 80], [90, 80], [90, 28]] },
        { id: 'tower_r_roof', points: [[68, 28], [80, 6], [92, 28]] },
        { id: 'wall', points: [[30, 44], [30, 80], [70, 80], [70, 44]] },
        { id: 'battlement', points: [[30, 44], [34, 36], [40, 44], [46, 36], [52, 44], [58, 36], [64, 44], [70, 36], [70, 44]] },
        { id: 'window_l', points: [[38, 50], [38, 66], [48, 66], [48, 50]] },
        { id: 'window_r', points: [[52, 50], [52, 66], [62, 66], [62, 50]] },
        { id: 'door', points: roundedRect(44, 60, 12, 20, 6) },
        { id: 'flag_l', points: [[18, 6], [18, 0], [28, 4]] },
        { id: 'flag_r', points: [[78, 6], [78, 0], [88, 4]] },
        { id: 'cloud_1', points: ellipse(22, 14, 10, 4) },
        { id: 'cloud_2', points: ellipse(78, 12, 8, 3) }
      ]
    },
    {
      id: 'mountain', name: '雪山风景', difficulty: 1,
      regions: [
        { id: 'sky', points: [[0, 0], [100, 0], [100, 58], [0, 58]] },
        { id: 'ground', points: [[0, 58], [100, 58], [100, 100], [0, 100]] },
        { id: 'mountain_l', points: [[0, 58], [28, 16], [56, 58]] },
        { id: 'mountain_r', points: [[38, 58], [72, 10], [100, 58]] },
        { id: 'snow_l', points: [[28, 16], [20, 30], [36, 30]] },
        { id: 'snow_r', points: [[72, 10], [64, 24], [80, 24]] },
        { id: 'sun', points: circle(85, 14, 10) },
        { id: 'sun_ray', points: star(85, 14, 14, 10, 8) },
        { id: 'cloud_1', points: ellipse(28, 14, 12, 5) },
        { id: 'tree_1', points: [[12, 58], [18, 34], [24, 58]] },
        { id: 'tree_2', points: [[84, 58], [90, 38], [96, 58]] },
        { id: 'lake', points: ellipse(50, 80, 20, 7) },
        { id: 'path', points: [[46, 58], [44, 70], [48, 80], [52, 80], [56, 70], [54, 58]] }
      ]
    },
    {
      id: 'ocean', name: '海底世界', difficulty: 2,
      regions: [
        { id: 'water', points: [[0, 0], [100, 0], [100, 82], [0, 82]] },
        { id: 'sand', points: [[0, 82], [100, 82], [100, 100], [0, 100]] },
        { id: 'coral_1', points: [[10, 82], [6, 60], [14, 54], [20, 60], [18, 82]] },
        { id: 'coral_2', points: [[78, 82], [74, 64], [80, 58], [86, 64], [84, 82]] },
        { id: 'seaweed_1', points: [[34, 82], [30, 50], [36, 46], [40, 82]] },
        { id: 'seaweed_2', points: [[62, 82], [58, 56], [64, 52], [68, 82]] },
        { id: 'fish_1', points: ellipse(50, 34, 14, 10) },
        { id: 'fish_1_tail', points: [[64, 34], [78, 24], [78, 44]] },
        { id: 'fish_1_eye', points: circle(42, 32, 3) },
        { id: 'fish_2', points: ellipse(26, 56, 10, 6) },
        { id: 'fish_2_tail', points: [[36, 56], [46, 50], [46, 62]] },
        { id: 'starfish', points: star(88, 90, 7, 3) },
        { id: 'bubble_1', points: circle(56, 20, 4) },
        { id: 'bubble_2', points: circle(64, 12, 3) },
        { id: 'bubble_3', points: circle(50, 10, 2) }
      ]
    },
    {
      id: 'garden', name: '美丽花园', difficulty: 1,
      regions: [
        { id: 'sky', points: [[0, 0], [100, 0], [100, 52], [0, 52]] },
        { id: 'ground', points: [[0, 52], [100, 52], [100, 100], [0, 100]] },
        { id: 'fence_1', points: [[4, 32], [4, 56], [10, 56], [10, 32]] },
        { id: 'fence_2', points: [[18, 32], [18, 56], [24, 56], [24, 32]] },
        { id: 'fence_3', points: [[32, 32], [32, 56], [38, 56], [38, 32]] },
        { id: 'fence_bar_1', points: [[4, 40], [38, 40], [38, 44], [4, 44]] },
        { id: 'fence_bar_2', points: [[4, 50], [38, 50], [38, 54], [4, 54]] },
        { id: 'flower_1', points: circle(52, 38, 8) },
        { id: 'flower_1_stem', points: [[50, 46], [50, 64], [54, 64], [54, 46]] },
        { id: 'flower_2', points: circle(68, 34, 6) },
        { id: 'flower_2_stem', points: [[66, 40], [66, 58], [70, 58], [70, 40]] },
        { id: 'tree', points: ellipse(84, 30, 14, 16) },
        { id: 'trunk', points: [[80, 46], [80, 64], [88, 64], [88, 46]] },
        { id: 'path', points: [[42, 100], [52, 100], [56, 70], [60, 52], [46, 52], [38, 70]] },
        { id: 'sun', points: circle(12, 10, 8) }
      ]
    },
    {
      id: 'house', name: '小房子', difficulty: 1,
      regions: [
        { id: 'roof', points: [[10, 40], [50, 10], [90, 40]] },
        { id: 'wall', points: [[18, 40], [18, 82], [82, 82], [82, 40]] },
        { id: 'door', points: roundedRect(42, 56, 16, 26, 3) },
        { id: 'window_l', points: [[24, 48], [24, 62], [38, 62], [38, 48]] },
        { id: 'window_r', points: [[62, 48], [62, 62], [76, 62], [76, 48]] },
        { id: 'chimney', points: [[70, 18], [70, 38], [80, 38], [80, 24]] },
        { id: 'smoke_1', points: circle(75, 14, 4) },
        { id: 'smoke_2', points: circle(78, 8, 3) },
        { id: 'ground', points: [[0, 82], [100, 82], [100, 100], [0, 100]] },
        { id: 'grass_1', points: [[4, 82], [10, 72], [16, 82]] },
        { id: 'grass_2', points: [[84, 82], [90, 72], [96, 82]] }
      ]
    },
    {
      id: 'moon_night', name: '月夜', difficulty: 1,
      regions: [
        { id: 'sky', points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
        { id: 'moon', points: circle(30, 28, 18) },
        { id: 'moon_crater_1', points: circle(24, 24, 4) },
        { id: 'moon_crater_2', points: circle(34, 32, 3) },
        { id: 'star_1', points: star(70, 14, 4, 2) },
        { id: 'star_2', points: star(85, 28, 3, 1.5) },
        { id: 'star_3', points: star(60, 8, 3, 1.5) },
        { id: 'star_4', points: star(78, 42, 2.5, 1.2) },
        { id: 'cloud_1', points: ellipse(55, 20, 14, 5) },
        { id: 'ground', points: [[0, 75], [100, 75], [100, 100], [0, 100]] },
        { id: 'hill_1', points: [[0, 75], [25, 55], [50, 75]] },
        { id: 'hill_2', points: [[40, 75], [70, 50], [100, 75]] },
        { id: 'tree', points: [[72, 75], [76, 48], [80, 75]] }
      ]
    }
  ],

  cartoon: [
    {
      id: 'koala', name: '考拉', difficulty: 1,
      regions: [
        { id: 'ear_l', points: circle(30, 22, 14) },
        { id: 'ear_r', points: circle(70, 22, 14) },
        { id: 'ear_l_inner', points: circle(30, 22, 8) },
        { id: 'ear_r_inner', points: circle(70, 22, 8) },
        { id: 'head', points: circle(50, 36, 24) },
        { id: 'eye_l', points: circle(40, 32, 4) },
        { id: 'eye_r', points: circle(60, 32, 4) },
        { id: 'nose', points: ellipse(50, 42, 6, 4) },
        { id: 'mouth', points: [[46, 46], [50, 50], [54, 46]] },
        { id: 'body', points: ellipse(50, 74, 22, 20) },
        { id: 'arm_l', points: [[28, 64], [18, 78], [24, 84], [34, 70]] },
        { id: 'arm_r', points: [[66, 70], [76, 84], [82, 78], [72, 64]] },
        { id: 'leg_l', points: ellipse(38, 92, 8, 6) },
        { id: 'leg_r', points: ellipse(62, 92, 8, 6) },
        { id: 'tummy', points: ellipse(50, 76, 12, 10) }
      ]
    },
    {
      id: 'penguin', name: '小企鹅', difficulty: 1,
      regions: [
        { id: 'body_outer', points: ellipse(50, 56, 26, 30) },
        { id: 'belly', points: ellipse(50, 62, 16, 22) },
        { id: 'head', points: circle(50, 26, 18) },
        { id: 'eye_l', points: circle(42, 24, 4) },
        { id: 'eye_r', points: circle(58, 24, 4) },
        { id: 'beak_top', points: [[50, 30], [44, 36], [56, 36]] },
        { id: 'beak_bottom', points: [[46, 36], [50, 40], [54, 36]] },
        { id: 'wing_l', points: [[24, 44], [14, 64], [22, 78], [30, 60]] },
        { id: 'wing_r', points: [[70, 60], [78, 78], [86, 64], [76, 44]] },
        { id: 'foot_l', points: [[36, 84], [30, 94], [44, 94], [42, 84]] },
        { id: 'foot_r', points: [[58, 84], [56, 94], [70, 94], [64, 84]] },
        { id: 'bow', points: [[42, 40], [36, 36], [36, 44]] }
      ]
    },
    {
      id: 'unicorn', name: '独角兽', difficulty: 2,
      regions: [
        { id: 'ear', points: [[42, 20], [38, 8], [46, 6], [48, 18]] },
        { id: 'horn', points: [[46, 6], [43, -4], [50, -4]] },
        { id: 'horn_spiral_1', points: [[45, -2], [44, 0], [47, 0]] },
        { id: 'mane_1', points: [[30, 24], [20, 14], [16, 24], [24, 34]] },
        { id: 'mane_2', points: [[28, 34], [14, 28], [10, 38], [22, 42]] },
        { id: 'mane_3', points: [[26, 44], [12, 42], [10, 52], [24, 52]] },
        { id: 'mane_4', points: [[28, 52], [16, 54], [14, 62], [26, 60]] },
        { id: 'head', points: circle(42, 32, 16) },
        { id: 'eye', points: ellipse(38, 28, 4, 5) },
        { id: 'body', points: ellipse(54, 64, 24, 18) },
        { id: 'leg_fl', points: [[36, 74], [36, 94], [44, 94], [44, 74]] },
        { id: 'leg_fr', points: [[48, 74], [48, 94], [56, 94], [56, 74]] },
        { id: 'leg_bl', points: [[62, 74], [62, 94], [70, 94], [70, 74]] },
        { id: 'tail', points: [[76, 56], [88, 46], [92, 40], [88, 44], [84, 52], [78, 58]] }
      ]
    },
    {
      id: 'cupcake', name: '杯子蛋糕', difficulty: 1,
      regions: [
        { id: 'wrapper', points: roundedRect(26, 50, 48, 42, 4) },
        { id: 'wrapper_line_1', points: [[28, 60], [26, 68], [74, 68], [72, 60]] },
        { id: 'wrapper_line_2', points: [[26, 76], [26, 84], [74, 84], [74, 76]] },
        { id: 'frosting', points: [[28, 50], [22, 36], [32, 26], [40, 34], [48, 20], [56, 32], [64, 24], [72, 36], [72, 50]] },
        { id: 'cherry', points: circle(50, 16, 8) },
        { id: 'cherry_stem', points: [[49, 8], [49, 2], [51, 2], [51, 8]] },
        { id: 'cherry_highlight', points: circle(48, 14, 2) },
        { id: 'sprinkle_1', points: [[36, 36], [38, 34], [40, 36], [38, 38]] },
        { id: 'sprinkle_2', points: [[56, 30], [58, 28], [60, 30], [58, 32]] },
        { id: 'sprinkle_3', points: [[46, 28], [48, 26], [50, 28], [48, 30]] }
      ]
    },
    {
      id: 'icecream', name: '冰淇淋', difficulty: 1,
      regions: [
        { id: 'cone', points: [[30, 50], [50, 96], [70, 50]] },
        { id: 'cone_pattern_1', points: [[36, 58], [50, 88], [44, 58]] },
        { id: 'cone_pattern_2', points: [[56, 58], [50, 88], [64, 58]] },
        { id: 'scoop_b', points: ellipse(50, 42, 20, 16) },
        { id: 'scoop_l', points: circle(36, 26, 14) },
        { id: 'scoop_r', points: circle(64, 26, 14) },
        { id: 'cherry', points: circle(50, 10, 7) },
        { id: 'cherry_stem', points: [[49, 3], [49, 0], [51, 0], [51, 3]] },
        { id: 'drip_1', points: [[34, 46], [32, 56], [38, 56], [36, 46]] },
        { id: 'drip_2', points: [[54, 46], [52, 58], [58, 58], [56, 46]] }
      ]
    },
    {
      id: 'crown', name: '皇冠', difficulty: 1,
      regions: [
        { id: 'band', points: [[6, 50], [6, 74], [94, 74], [94, 50]] },
        { id: 'band_inner', points: [[12, 54], [12, 70], [88, 70], [88, 54]] },
        { id: 'point_1', points: [[6, 50], [16, 18], [30, 50]] },
        { id: 'point_2', points: [[30, 50], [42, 10], [58, 50]] },
        { id: 'point_3', points: [[58, 50], [70, 10], [84, 50]] },
        { id: 'point_4', points: [[84, 50], [88, 18], [94, 50]] },
        { id: 'gem_1', points: circle(28, 62, 6) },
        { id: 'gem_2', points: circle(50, 62, 7) },
        { id: 'gem_3', points: circle(72, 62, 6) },
        { id: 'top_gem_1', points: star(23, 34, 5, 2.5) },
        { id: 'top_gem_2', points: star(50, 30, 5, 2.5) },
        { id: 'top_gem_3', points: star(77, 34, 5, 2.5) }
      ]
    },
    {
      id: 'heart', name: '爱心图案', difficulty: 1,
      regions: [
        { id: 'heart', points: heart(50, 46, 2.2) },
        { id: 'heart_inner', points: heart(50, 44, 1.5) },
        { id: 'arrow', points: [[6, 48], [94, 28], [94, 34], [6, 54]] },
        { id: 'arrow_head', points: [[94, 22], [100, 32], [94, 42]] },
        { id: 'arrow_tail', points: [[6, 42], [0, 46], [0, 56], [6, 60]] },
        { id: 'star_1', points: star(22, 24, 5, 2.5) },
        { id: 'star_2', points: star(78, 24, 5, 2.5) },
        { id: 'star_3', points: star(50, 8, 6, 3) },
        { id: 'sparkle_1', points: star(30, 16, 3, 1.5) },
        { id: 'sparkle_2', points: star(70, 16, 3, 1.5) }
      ]
    },
    {
      id: 'teddy', name: '泰迪熊', difficulty: 1,
      regions: [
        { id: 'ear_l', points: circle(30, 14, 10) },
        { id: 'ear_r', points: circle(70, 14, 10) },
        { id: 'ear_l_inner', points: circle(30, 14, 5) },
        { id: 'ear_r_inner', points: circle(70, 14, 5) },
        { id: 'head', points: circle(50, 30, 20) },
        { id: 'face', points: ellipse(50, 36, 12, 10) },
        { id: 'eye_l', points: circle(42, 26, 4) },
        { id: 'eye_r', points: circle(58, 26, 4) },
        { id: 'nose', points: ellipse(50, 34, 4, 3) },
        { id: 'mouth', points: [[46, 38], [50, 42], [54, 38]] },
        { id: 'body', points: ellipse(50, 66, 22, 22) },
        { id: 'arm_l', points: [[26, 56], [16, 68], [20, 76], [30, 66]] },
        { id: 'arm_r', points: [[70, 66], [80, 76], [84, 68], [74, 56]] },
        { id: 'leg_l', points: ellipse(36, 88, 10, 7) },
        { id: 'leg_r', points: ellipse(64, 88, 10, 7) },
        { id: 'belly', points: ellipse(50, 68, 12, 12) }
      ]
    },
    {
      id: 'rainbow', name: '彩虹', difficulty: 1,
      regions: [
        { id: 'arc_1', points: (function() {
          var outer = circle(50, 70, 44, 24);
          var inner = circle(50, 70, 38, 24);
          return outer.slice(0, 13).concat(inner.slice(0, 13).reverse());
        })() },
        { id: 'arc_2', points: (function() {
          var outer = circle(50, 70, 38, 24);
          var inner = circle(50, 70, 32, 24);
          return outer.slice(0, 13).concat(inner.slice(0, 13).reverse());
        })() },
        { id: 'arc_3', points: (function() {
          var outer = circle(50, 70, 32, 24);
          var inner = circle(50, 70, 26, 24);
          return outer.slice(0, 13).concat(inner.slice(0, 13).reverse());
        })() },
        { id: 'arc_4', points: (function() {
          var outer = circle(50, 70, 26, 24);
          var inner = circle(50, 70, 20, 24);
          return outer.slice(0, 13).concat(inner.slice(0, 13).reverse());
        })() },
        { id: 'arc_5', points: (function() {
          var outer = circle(50, 70, 20, 24);
          var inner = circle(50, 70, 14, 24);
          return outer.slice(0, 13).concat(inner.slice(0, 13).reverse());
        })() },
        { id: 'cloud_l', points: ellipse(10, 68, 12, 8) },
        { id: 'cloud_r', points: ellipse(90, 68, 12, 8) },
        { id: 'star_1', points: star(30, 20, 5, 2.5) },
        { id: 'star_2', points: star(50, 12, 6, 3) },
        { id: 'star_3', points: star(70, 20, 5, 2.5) },
        { id: 'ground', points: [[0, 88], [100, 88], [100, 100], [0, 100]] }
      ]
    },
    {
      id: 'rocket', name: '小火箭', difficulty: 1,
      regions: [
        { id: 'nose', points: [[50, 4], [40, 24], [60, 24]] },
        { id: 'body', points: [[40, 24], [40, 72], [60, 72], [60, 24]] },
        { id: 'window', points: circle(50, 40, 8) },
        { id: 'window_inner', points: circle(50, 40, 5) },
        { id: 'stripe_1', points: [[40, 54], [40, 60], [60, 60], [60, 54]] },
        { id: 'stripe_2', points: [[40, 64], [40, 72], [60, 72], [60, 64]] },
        { id: 'fin_l', points: [[40, 60], [28, 80], [40, 72]] },
        { id: 'fin_r', points: [[60, 60], [72, 80], [60, 72]] },
        { id: 'flame_1', points: [[44, 72], [50, 96], [56, 72]] },
        { id: 'flame_2', points: [[46, 72], [50, 90], [54, 72]] },
        { id: 'star_bg_1', points: star(20, 20, 3, 1.5) },
        { id: 'star_bg_2', points: star(80, 30, 3, 1.5) },
        { id: 'star_bg_3', points: star(15, 60, 2.5, 1.2) }
      ]
    }
  ],

  culture: [
    {
      id: 'chinese_knot', name: '中国结', difficulty: 2,
      regions: [
        { id: 'ring_top', points: circle(50, 10, 8) },
        { id: 'ring_top_inner', points: circle(50, 10, 5) },
        { id: 'knot_main', points: [[36, 18], [36, 36], [44, 36], [44, 26], [56, 26], [56, 36], [64, 36], [64, 18]] },
        { id: 'knot_center', points: [[44, 30], [44, 36], [56, 36], [56, 30]] },
        { id: 'knot_side_l', points: [[30, 20], [30, 40], [36, 40], [36, 20]] },
        { id: 'knot_side_r', points: [[64, 20], [64, 40], [70, 40], [70, 20]] },
        { id: 'knot_bottom', points: [[42, 36], [42, 50], [50, 50], [58, 50], [58, 36]] },
        { id: 'tassel_1', points: [[44, 50], [42, 60], [46, 70], [44, 80], [46, 90], [44, 100]] },
        { id: 'tassel_2', points: [[50, 50], [50, 60], [50, 70], [50, 80], [50, 90], [50, 100]] },
        { id: 'tassel_3', points: [[56, 50], [58, 60], [54, 70], [56, 80], [54, 90], [56, 100]] },
        { id: 'bead_1', points: circle(44, 50, 3) },
        { id: 'bead_2', points: circle(50, 50, 3) },
        { id: 'bead_3', points: circle(56, 50, 3) }
      ]
    },
    {
      id: 'peacock', name: '孔雀', difficulty: 3,
      regions: [
        { id: 'head', points: circle(30, 22, 8) },
        { id: 'body', points: ellipse(30, 46, 14, 18) },
        { id: 'eye', points: circle(28, 20, 2) },
        { id: 'beak', points: [[22, 24], [18, 28], [24, 28]] },
        { id: 'crown', points: [[28, 14], [26, 6], [30, 4], [34, 6], [32, 14]] },
        { id: 'tail_1', points: circle(56, 24, 12) },
        { id: 'tail_2', points: circle(70, 20, 12) },
        { id: 'tail_3', points: circle(78, 32, 12) },
        { id: 'tail_4', points: circle(70, 44, 12) },
        { id: 'tail_5', points: circle(56, 48, 12) },
        { id: 'tail_eye_1', points: circle(56, 24, 6) },
        { id: 'tail_eye_2', points: circle(70, 20, 6) },
        { id: 'tail_eye_3', points: circle(78, 32, 6) },
        { id: 'tail_eye_4', points: circle(70, 44, 6) },
        { id: 'tail_eye_5', points: circle(56, 48, 6) },
        { id: 'tail_center_1', points: circle(56, 24, 3) },
        { id: 'tail_center_2', points: circle(70, 20, 3) },
        { id: 'tail_center_3', points: circle(78, 32, 3) },
        { id: 'tail_center_4', points: circle(70, 44, 3) },
        { id: 'tail_center_5', points: circle(56, 48, 3) },
        { id: 'wing', points: [[18, 36], [12, 56], [30, 60], [40, 44]] },
        { id: 'feet', points: [[26, 64], [20, 80], [24, 82], [28, 68], [32, 82], [36, 80], [30, 64]] },
        { id: 'ground', points: [[0, 88], [100, 88], [100, 100], [0, 100]] }
      ]
    },
    {
      id: 'mandala', name: '曼陀罗', difficulty: 3,
      regions: (function () {
        var r = [
          { id: 'center', points: circle(50, 50, 8) },
          { id: 'center_dot', points: circle(50, 50, 4) }
        ];
        for (var i = 0; i < 8; i++) {
          var a = Math.PI * 2 * i / 8 - Math.PI / 2;
          var inner = [50 + 10 * Math.cos(a), 50 + 10 * Math.sin(a)];
          var tip = [50 + 24 * Math.cos(a), 50 + 24 * Math.sin(a)];
          var ha = 0.3;
          var left = [50 + 18 * Math.cos(a - ha), 50 + 18 * Math.sin(a - ha)];
          var right = [50 + 18 * Math.cos(a + ha), 50 + 18 * Math.sin(a + ha)];
          r.push({
            id: 'ip_' + i,
            points: [inner, left, tip, right].map(function (p) {
              return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
            })
          });
        }
        for (var i = 0; i < 8; i++) {
          var a = Math.PI * 2 * i / 8 - Math.PI / 2 + Math.PI / 8;
          var inner = [50 + 20 * Math.cos(a), 50 + 20 * Math.sin(a)];
          var tip = [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)];
          var ha = 0.2;
          var left = [50 + 32 * Math.cos(a - ha), 50 + 32 * Math.sin(a - ha)];
          var right = [50 + 32 * Math.cos(a + ha), 50 + 32 * Math.sin(a + ha)];
          r.push({
            id: 'op_' + i,
            points: [inner, left, tip, right].map(function (p) {
              return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
            })
          });
        }
        for (var i = 0; i < 16; i++) {
          var a = Math.PI * 2 * i / 16 - Math.PI / 2;
          r.push({
            id: 'dot_' + i,
            points: circle(50 + 44 * Math.cos(a), 50 + 44 * Math.sin(a), 3)
          });
        }
        return r;
      })()
    },
    {
      id: 'dragon', name: '中国龙', difficulty: 3,
      regions: [
        { id: 'head', points: ellipse(28, 28, 16, 14) },
        { id: 'horn_l', points: [[20, 16], [14, 4], [22, 12]] },
        { id: 'horn_r', points: [[34, 16], [40, 4], [36, 12]] },
        { id: 'eye', points: circle(24, 26, 4) },
        { id: 'nose', points: circle(18, 30, 3) },
        { id: 'whisker_l', points: [[12, 34], [2, 30], [2, 34], [12, 38]] },
        { id: 'whisker_r', points: [[12, 38], [2, 42], [2, 46], [12, 42]] },
        { id: 'body_1', points: [[36, 34], [50, 28], [58, 36], [44, 42]] },
        { id: 'body_2', points: [[50, 36], [66, 30], [74, 38], [60, 44]] },
        { id: 'body_3', points: [[66, 40], [80, 36], [86, 46], [74, 50]] },
        { id: 'tail', points: [[82, 48], [94, 42], [98, 52], [90, 60], [84, 54]] },
        { id: 'belly_1', points: [[38, 42], [50, 36], [58, 44], [48, 50]] },
        { id: 'belly_2', points: [[58, 46], [70, 40], [78, 48], [68, 54]] },
        { id: 'leg_fl', points: [[40, 44], [32, 58], [40, 62], [46, 50]] },
        { id: 'leg_fr', points: [[58, 44], [52, 60], [60, 64], [64, 50]] },
        { id: 'flame_1', points: [[14, 32], [4, 26], [8, 36]] },
        { id: 'flame_2', points: [[14, 36], [2, 36], [8, 46]] },
        { id: 'scale_1', points: [[44, 34], [42, 30], [48, 30]] },
        { id: 'scale_2', points: [[58, 34], [56, 30], [62, 30]] }
      ]
    },
    {
      id: 'lantern', name: '红灯笼', difficulty: 1,
      regions: [
        { id: 'top_hook', points: [[44, 6], [44, 14], [56, 14], [56, 6]] },
        { id: 'top_bar', points: [[30, 14], [30, 22], [70, 22], [70, 14]] },
        { id: 'body_top', points: ellipse(50, 38, 26, 18) },
        { id: 'body_mid', points: [[24, 38], [24, 64], [76, 64], [76, 38]] },
        { id: 'body_bottom', points: ellipse(50, 64, 26, 18) },
        { id: 'band_top', points: [[28, 26], [28, 32], [72, 32], [72, 26]] },
        { id: 'band_bottom', points: [[28, 70], [28, 76], [72, 76], [72, 70]] },
        { id: 'tassel_1', points: [[44, 80], [44, 96], [48, 96], [48, 80]] },
        { id: 'tassel_2', points: [[50, 80], [50, 98], [54, 98], [54, 80]] },
        { id: 'tassel_3', points: [[56, 80], [56, 96], [60, 96], [60, 80]] },
        { id: 'char_area', points: [[40, 38], [40, 60], [60, 60], [60, 38]] }
      ]
    },
    {
      id: 'dreamcatcher', name: '捕梦网', difficulty: 2,
      regions: (function () {
        var outer = circle(50, 42, 30, 24);
        var inner = circle(50, 42, 26, 24);
        return [
          { id: 'ring', points: outer.concat(inner.reverse()) },
          { id: 'web_1', points: [[50, 12], [46, 26], [54, 26]] },
          { id: 'web_2', points: [[74, 24], [58, 30], [62, 36]] },
          { id: 'web_3', points: [[80, 42], [64, 42], [64, 48]] },
          { id: 'web_4', points: [[74, 60], [62, 50], [58, 56]] },
          { id: 'web_5', points: [[50, 72], [54, 54], [46, 54]] },
          { id: 'web_6', points: [[26, 60], [38, 56], [42, 50]] },
          { id: 'web_7', points: [[20, 42], [36, 48], [36, 42]] },
          { id: 'web_8', points: [[26, 24], [42, 36], [38, 30]] },
          { id: 'feather_1', points: [[34, 72], [30, 90], [34, 94], [38, 90]] },
          { id: 'feather_2', points: [[50, 72], [48, 92], [52, 96], [54, 90]] },
          { id: 'feather_3', points: [[66, 72], [62, 90], [66, 94], [70, 90]] },
          { id: 'bead_1', points: circle(34, 68, 3) },
          { id: 'bead_2', points: circle(50, 68, 3) },
          { id: 'bead_3', points: circle(66, 68, 3) }
        ];
      })()
    },
    {
      id: 'pagoda', name: '宝塔', difficulty: 2,
      regions: [
        { id: 'spire', points: [[48, 2], [50, 0], [52, 2], [52, 8], [48, 8]] },
        { id: 'roof_1', points: [[36, 8], [50, 4], [64, 8], [60, 12], [40, 12]] },
        { id: 'floor_1', points: [[40, 12], [40, 22], [60, 22], [60, 12]] },
        { id: 'roof_2', points: [[32, 22], [50, 16], [68, 22], [64, 26], [36, 26]] },
        { id: 'floor_2', points: [[36, 26], [36, 38], [64, 38], [64, 26]] },
        { id: 'roof_3', points: [[28, 38], [50, 30], [72, 38], [68, 42], [32, 42]] },
        { id: 'floor_3', points: [[32, 42], [32, 56], [68, 56], [68, 42]] },
        { id: 'roof_4', points: [[24, 56], [50, 46], [76, 56], [72, 60], [28, 60]] },
        { id: 'floor_4', points: [[28, 60], [28, 76], [72, 76], [72, 60]] },
        { id: 'door', points: roundedRect(42, 62, 16, 14, 4) },
        { id: 'ground', points: [[16, 76], [16, 82], [84, 82], [84, 76]] },
        { id: 'steps', points: [[36, 82], [36, 90], [64, 90], [64, 82]] }
      ]
    },
    {
      id: 'fan', name: '折扇', difficulty: 1,
      regions: (function () {
        var r = [];
        var cx = 50, cy = 82;
        var innerR = 8, outerR = 42;
        var startAngle = -Math.PI * 0.85;
        var endAngle = -Math.PI * 0.15;
        var count = 10;
        for (var i = 0; i < count; i++) {
          var a1 = startAngle + (endAngle - startAngle) * i / count;
          var a2 = startAngle + (endAngle - startAngle) * (i + 1) / count;
          var p1 = [cx + innerR * Math.cos(a1), cy + innerR * Math.sin(a1)];
          var p2 = [cx + outerR * Math.cos(a1), cy + outerR * Math.sin(a1)];
          var p3 = [cx + outerR * Math.cos(a2), cy + outerR * Math.sin(a2)];
          var p4 = [cx + innerR * Math.cos(a2), cy + innerR * Math.sin(a2)];
          r.push({
            id: 'panel_' + i,
            points: [p1, p2, p3, p4].map(function (p) {
              return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
            })
          });
        }
        r.push({ id: 'pivot', points: circle(cx, cy, 5) });
        return r;
      })()
    }
  ],

  food: [
    {
      id: 'sushi', name: '寿司拼盘', difficulty: 1,
      regions: [
        { id: 'plate', points: ellipse(50, 76, 42, 14) },
        { id: 'plate_inner', points: ellipse(50, 74, 36, 10) },
        { id: 'nigiri_1_rice', points: roundedRect(16, 52, 22, 14, 4) },
        { id: 'nigiri_1_fish', points: [[14, 50], [18, 42], [34, 42], [40, 48], [38, 54], [16, 54]] },
        { id: 'nigiri_2_rice', points: roundedRect(42, 50, 22, 14, 4) },
        { id: 'nigiri_2_fish', points: [[40, 48], [44, 40], [60, 40], [66, 46], [64, 52], [42, 52]] },
        { id: 'nigiri_3_rice', points: roundedRect(64, 52, 22, 14, 4) },
        { id: 'nigiri_3_fish', points: [[62, 50], [66, 42], [82, 42], [88, 48], [86, 54], [64, 54]] },
        { id: 'maki_1', points: circle(24, 32, 10) },
        { id: 'maki_1_inner', points: circle(24, 32, 6) },
        { id: 'maki_1_center', points: circle(24, 32, 3) },
        { id: 'maki_2', points: circle(50, 28, 10) },
        { id: 'maki_2_inner', points: circle(50, 28, 6) },
        { id: 'maki_2_center', points: circle(50, 28, 3) },
        { id: 'maki_3', points: circle(76, 32, 10) },
        { id: 'maki_3_inner', points: circle(76, 32, 6) },
        { id: 'maki_3_center', points: circle(76, 32, 3) },
        { id: 'wasabi', points: [[44, 66], [46, 60], [52, 60], [54, 66]] },
        { id: 'ginger', points: [[62, 64], [64, 56], [72, 56], [70, 64]] }
      ]
    },
    {
      id: 'hamburger', name: '汉堡包', difficulty: 1,
      regions: [
        { id: 'top_bun', points: [[18, 24], [18, 14], [50, 6], [82, 14], [82, 24]] },
        { id: 'sesame_1', points: circle(34, 14, 2) },
        { id: 'sesame_2', points: circle(50, 10, 2) },
        { id: 'sesame_3', points: circle(66, 14, 2) },
        { id: 'sesame_4', points: circle(42, 18, 2) },
        { id: 'sesame_5', points: circle(58, 16, 2) },
        { id: 'lettuce', points: [[14, 28], [20, 22], [28, 28], [36, 20], [44, 28], [52, 20], [60, 28], [68, 20], [76, 28], [82, 22], [88, 28], [86, 34], [16, 34]] },
        { id: 'cheese', points: [[14, 34], [88, 34], [92, 44], [10, 44]] },
        { id: 'patty', points: [[16, 44], [84, 44], [84, 56], [16, 56]] },
        { id: 'tomato', points: [[18, 56], [82, 56], [82, 64], [18, 64]] },
        { id: 'tomato_slice_1', points: circle(38, 60, 4) },
        { id: 'tomato_slice_2', points: circle(62, 60, 4) },
        { id: 'bottom_bun', points: [[18, 64], [18, 78], [50, 82], [82, 78], [82, 64]] }
      ]
    },
    {
      id: 'ramen', name: '拉面', difficulty: 2,
      regions: [
        { id: 'bowl_outer', points: [[14, 32], [14, 72], [50, 86], [86, 72], [86, 32]] },
        { id: 'bowl_inner', points: [[18, 36], [82, 36], [82, 68], [50, 82], [18, 68]] },
        { id: 'broth', points: [[20, 40], [80, 40], [80, 64], [50, 78], [20, 64]] },
        { id: 'noodle_1', points: [[30, 44], [26, 56], [34, 60], [42, 48], [38, 44]] },
        { id: 'noodle_2', points: [[50, 42], [46, 58], [54, 62], [62, 46], [56, 42]] },
        { id: 'noodle_3', points: [[64, 44], [60, 52], [68, 58], [72, 48]] },
        { id: 'egg', points: circle(36, 50, 8) },
        { id: 'egg_yolk', points: circle(36, 50, 4) },
        { id: 'pork', points: [[54, 52], [50, 48], [58, 44], [68, 48], [66, 54], [56, 56]] },
        { id: 'nori', points: [[24, 40], [24, 56], [32, 56], [32, 40]] },
        { id: 'green_onion_1', points: [[46, 46], [44, 42], [48, 42], [50, 46]] },
        { id: 'green_onion_2', points: [[58, 42], [56, 38], [60, 38], [62, 42]] },
        { id: 'chopstick_1', points: [[60, 20], [58, 72], [60, 72], [62, 20]] },
        { id: 'chopstick_2', points: [[66, 18], [64, 68], [66, 68], [68, 18]] }
      ]
    },
    {
      id: 'cake', name: '生日蛋糕', difficulty: 1,
      regions: [
        { id: 'plate', points: ellipse(50, 88, 42, 6) },
        { id: 'layer_bottom', points: [[14, 60], [14, 86], [86, 86], [86, 60]] },
        { id: 'layer_top', points: [[24, 36], [24, 62], [76, 62], [76, 36]] },
        { id: 'frosting_bottom', points: [[14, 56], [18, 48], [26, 56], [34, 48], [42, 56], [50, 48], [58, 56], [66, 48], [74, 56], [82, 48], [86, 56], [86, 60], [14, 60]] },
        { id: 'frosting_top', points: [[24, 32], [28, 24], [36, 32], [44, 24], [50, 32], [56, 24], [64, 32], [72, 24], [76, 32], [76, 36], [24, 36]] },
        { id: 'candle_1', points: [[38, 12], [38, 36], [42, 36], [42, 12]] },
        { id: 'candle_2', points: [[48, 8], [48, 36], [52, 36], [52, 8]] },
        { id: 'candle_3', points: [[58, 12], [58, 36], [62, 36], [62, 12]] },
        { id: 'flame_1', points: circle(40, 8, 4) },
        { id: 'flame_2', points: circle(50, 4, 4) },
        { id: 'flame_3', points: circle(60, 8, 4) },
        { id: 'cherry_1', points: circle(30, 28, 4) },
        { id: 'cherry_2', points: circle(70, 28, 4) }
      ]
    },
    {
      id: 'pizza', name: '美味披萨', difficulty: 1,
      regions: [
        { id: 'crust', points: [[50, 6], [8, 84], [92, 84]] },
        { id: 'sauce', points: [[50, 16], [18, 78], [82, 78]] },
        { id: 'cheese_1', points: [[50, 16], [42, 30], [58, 30]] },
        { id: 'cheese_2', points: [[28, 44], [38, 44], [34, 56]] },
        { id: 'cheese_3', points: [[62, 40], [72, 40], [68, 52]] },
        { id: 'pepperoni_1', points: circle(42, 48, 7) },
        { id: 'pepperoni_2', points: circle(62, 42, 6) },
        { id: 'pepperoni_3', points: circle(50, 64, 7) },
        { id: 'pepperoni_4', points: circle(34, 66, 6) },
        { id: 'pepperoni_5', points: circle(66, 62, 6) },
        { id: 'olive_1', points: circle(48, 32, 4) },
        { id: 'olive_2', points: circle(56, 56, 4) },
        { id: 'olive_3', points: circle(40, 58, 3) },
        { id: 'mushroom_1', points: [[54, 48], [50, 44], [56, 42], [58, 48]] },
        { id: 'mushroom_2', points: [[30, 54], [26, 50], [32, 48], [34, 54]] }
      ]
    },
    {
      id: 'fruit', name: '水果拼盘', difficulty: 1,
      regions: [
        { id: 'plate', points: ellipse(50, 74, 40, 14) },
        { id: 'plate_inner', points: ellipse(50, 72, 34, 10) },
        { id: 'apple', points: circle(30, 50, 16) },
        { id: 'apple_leaf', points: [[36, 34], [32, 24], [42, 28]] },
        { id: 'apple_stem', points: [[35, 34], [35, 28], [37, 28], [37, 34]] },
        { id: 'apple_highlight', points: circle(26, 46, 4) },
        { id: 'orange', points: circle(66, 52, 14) },
        { id: 'orange_highlight', points: circle(62, 48, 3) },
        { id: 'grape_1', points: circle(48, 36, 6) },
        { id: 'grape_2', points: circle(56, 34, 6) },
        { id: 'grape_3', points: circle(52, 42, 6) },
        { id: 'grape_4', points: circle(44, 42, 5) },
        { id: 'grape_5', points: circle(50, 30, 5) },
        { id: 'strawberry', points: [[76, 34], [72, 50], [80, 50]] },
        { id: 'strawberry_leaf', points: [[74, 34], [76, 28], [78, 34]] },
        { id: 'banana', points: [[16, 42], [8, 30], [14, 22], [26, 34], [22, 44]] }
      ]
    },
    {
      id: 'lollipop', name: '棒棒糖', difficulty: 1,
      regions: [
        { id: 'candy', points: circle(50, 30, 24) },
        { id: 'swirl_1', points: [[50, 6], [58, 8], [56, 30], [50, 30], [42, 10]] },
        { id: 'swirl_2', points: [[64, 14], [72, 22], [64, 42], [56, 38], [62, 18]] },
        { id: 'swirl_3', points: [[36, 14], [28, 22], [36, 42], [44, 38], [38, 18]] },
        { id: 'swirl_4', points: [[70, 30], [74, 40], [66, 52], [60, 46], [68, 34]] },
        { id: 'swirl_5', points: [[30, 30], [26, 40], [34, 52], [40, 46], [32, 34]] },
        { id: 'highlight', points: circle(42, 20, 5) },
        { id: 'stick', points: [[47, 54], [47, 96], [53, 96], [53, 54]] }
      ]
    },
    {
      id: 'donut', name: '甜甜圈', difficulty: 1,
      regions: [
        { id: 'outer', points: circle(50, 50, 36, 24) },
        { id: 'inner', points: circle(50, 50, 14, 24) },
        { id: 'hole', points: [[0, 0]] },
        { id: 'frosting', points: (function() {
          var outer = circle(50, 50, 36, 24);
          var inner = circle(50, 50, 14, 24);
          var top = outer.slice(6, 19).concat(inner.slice(6, 19).reverse());
          return top;
        })() },
        { id: 'sprinkle_1', points: [[30, 32], [32, 30], [34, 32], [32, 34]] },
        { id: 'sprinkle_2', points: [[44, 24], [46, 22], [48, 24], [46, 26]] },
        { id: 'sprinkle_3', points: [[58, 26], [60, 24], [62, 26], [60, 28]] },
        { id: 'sprinkle_4', points: [[68, 34], [70, 32], [72, 34], [70, 36]] },
        { id: 'sprinkle_5', points: [[36, 40], [38, 38], [40, 40], [38, 42]] },
        { id: 'sprinkle_6', points: [[54, 36], [56, 34], [58, 36], [56, 38]] }
      ]
    },
    {
      id: 'boba', name: '珍珠奶茶', difficulty: 1,
      regions: [
        { id: 'cup', points: [[30, 24], [34, 88], [66, 88], [70, 24]] },
        { id: 'lid', points: [[28, 20], [28, 28], [72, 28], [72, 20]] },
        { id: 'straw', points: [[56, 4], [54, 48], [58, 48], [60, 4]] },
        { id: 'tea', points: [[32, 36], [34, 78], [66, 78], [68, 36]] },
        { id: 'foam', points: ellipse(50, 36, 18, 6) },
        { id: 'boba_1', points: circle(40, 72, 4) },
        { id: 'boba_2', points: circle(50, 74, 4) },
        { id: 'boba_3', points: circle(60, 72, 4) },
        { id: 'boba_4', points: circle(45, 78, 4) },
        { id: 'boba_5', points: circle(55, 78, 4) },
        { id: 'boba_6', points: circle(50, 82, 4) }
      ]
    },
    {
      id: 'watermelon', name: '西瓜', difficulty: 1,
      regions: [
        { id: 'rind', points: [[10, 80], [50, 10], [90, 80]] },
        { id: 'flesh', points: [[16, 76], [50, 18], [84, 76]] },
        { id: 'rind_stripe', points: [[16, 76], [10, 80], [50, 10], [16, 76]] },
        { id: 'seed_1', points: [[40, 50], [38, 46], [42, 46]] },
        { id: 'seed_2', points: [[54, 44], [52, 40], [56, 40]] },
        { id: 'seed_3', points: [[46, 62], [44, 58], [48, 58]] },
        { id: 'seed_4', points: [[60, 58], [58, 54], [62, 54]] },
        { id: 'seed_5', points: [[38, 64], [36, 60], [40, 60]] },
        { id: 'seed_6', points: [[56, 66], [54, 62], [58, 62]] }
      ]
    }
  ]
};

var defaultPalette = [
  '#E74C3C', '#FF6B35', '#F39C12', '#F1C40F', '#2ECC71', '#27AE60',
  '#1ABC9C', '#3498DB', '#2980B9', '#9B59B6', '#8E44AD', '#E91E63',
  '#FF5722', '#795548', '#607D8B', '#000000', '#FFFFFF', '#FFCDD2',
  '#FFE0B2', '#FFF9C4', '#C8E6C9', '#B3E5FC', '#D1C4E9', '#F8BBD0'
];

var difficultyText = {
  1: '★ 简单',
  2: '★★ 中等',
  3: '★★★ 复杂'
};

module.exports = {
  categories: categories,
  templates: templates,
  defaultPalette: defaultPalette,
  difficultyText: difficultyText
};
