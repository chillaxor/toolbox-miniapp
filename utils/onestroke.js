/**
 * 一笔画互动工具函数
 * 包含关卡数据和互动逻辑
 */

/**
 * 关卡数据：每个关卡包含节点坐标和边连接
 * 节点坐标使用归一化 0-1 范围，绘制时按画布尺寸缩放
 * 所有关卡均保证存在欧拉路径（0个或2个奇数度节点）
 */
var LEVELS = {
  easy: [
    {
      name: '正方形',
      nodes: [
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.8 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,0]]
    },
    {
      name: '十字',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.9 },
        { x: 0.1, y: 0.5 },
        { x: 0.9, y: 0.5 }
      ],
      edges: [[0,1],[1,2],[1,3],[1,4],[0,3],[2,4]]
    },
    {
      name: '三角形',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 }
      ],
      edges: [[0,1],[1,2],[2,0]]
    },
    {
      name: 'Z字形',
      nodes: [
        { x: 0.15, y: 0.2 },
        { x: 0.85, y: 0.2 },
        { x: 0.15, y: 0.8 },
        { x: 0.85, y: 0.8 }
      ],
      edges: [[0,1],[1,3],[3,2],[2,0]]
    },
    {
      name: '钻石',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.5 },
        { x: 0.5, y: 0.9 },
        { x: 0.1, y: 0.5 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,0]]
    }
  ],
  medium: [
    {
      name: '五角星',
      nodes: [
        { x: 0.5, y: 0.08 },
        { x: 0.98, y: 0.38 },
        { x: 0.82, y: 0.95 },
        { x: 0.18, y: 0.95 },
        { x: 0.02, y: 0.38 }
      ],
      edges: [[0,2],[2,4],[4,1],[1,3],[3,0]]
    },
    {
      name: '房子',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.15, y: 0.45 },
        { x: 0.85, y: 0.45 },
        { x: 0.15, y: 0.9 },
        { x: 0.85, y: 0.9 },
        { x: 0.5, y: 0.45 }
      ],
      edges: [[0,1],[0,2],[1,3],[2,4],[1,5],[2,5],[3,4]]
    },
    {
      name: '六边形',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.85, y: 0.25 },
        { x: 0.85, y: 0.75 },
        { x: 0.5, y: 0.9 },
        { x: 0.15, y: 0.75 },
        { x: 0.15, y: 0.25 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]
    },
    {
      name: '菱形花',
      nodes: [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.5 },
        { x: 0.5, y: 0.9 },
        { x: 0.1, y: 0.5 }
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1],[1,3]]
    },
    {
      name: '箭头',
      nodes: [
        { x: 0.5, y: 0.08 },
        { x: 0.85, y: 0.4 },
        { x: 0.65, y: 0.4 },
        { x: 0.65, y: 0.92 },
        { x: 0.35, y: 0.92 },
        { x: 0.35, y: 0.4 },
        { x: 0.15, y: 0.4 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[5,2]]
    }
  ],
  hard: [
    {
      name: '立方体',
      nodes: [
        { x: 0.15, y: 0.2 },
        { x: 0.6, y: 0.2 },
        { x: 0.6, y: 0.7 },
        { x: 0.15, y: 0.7 },
        { x: 0.35, y: 0.05 },
        { x: 0.8, y: 0.05 },
        { x: 0.8, y: 0.55 },
        { x: 0.35, y: 0.55 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],[0,2],[4,6],[1,7]]
    },
    {
      name: '蝴蝶',
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.15, y: 0.25 },
        { x: 0.15, y: 0.7 },
        { x: 0.5, y: 0.9 },
        { x: 0.35, y: 0.5 },
        { x: 0.85, y: 0.25 },
        { x: 0.85, y: 0.7 },
        { x: 0.65, y: 0.5 }
      ],
      edges: [[0,1],[1,2],[2,3],[0,4],[4,3],[0,5],[5,6],[6,3],[0,7],[7,3],[0,3]]
    },
    {
      name: '八卦',
      nodes: [
        { x: 0.5, y: 0.08 },
        { x: 0.85, y: 0.25 },
        { x: 0.92, y: 0.5 },
        { x: 0.85, y: 0.75 },
        { x: 0.5, y: 0.92 },
        { x: 0.15, y: 0.75 },
        { x: 0.08, y: 0.5 },
        { x: 0.15, y: 0.25 },
        { x: 0.5, y: 0.5 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[2,8],[4,8],[6,8],[0,4],[2,6],[1,5]]
    },
    {
      name: '雪花',
      nodes: [
        { x: 0.5, y: 0.08 },
        { x: 0.75, y: 0.25 },
        { x: 0.92, y: 0.5 },
        { x: 0.75, y: 0.75 },
        { x: 0.5, y: 0.92 },
        { x: 0.25, y: 0.75 },
        { x: 0.08, y: 0.5 },
        { x: 0.25, y: 0.25 },
        { x: 0.5, y: 0.5 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[0,4],[1,5],[2,6],[3,7]]
    },
    {
      name: '八角星',
      nodes: [
        { x: 0.5, y: 0.05 },
        { x: 0.75, y: 0.15 },
        { x: 0.92, y: 0.35 },
        { x: 0.92, y: 0.65 },
        { x: 0.75, y: 0.85 },
        { x: 0.5, y: 0.95 },
        { x: 0.25, y: 0.85 },
        { x: 0.08, y: 0.65 }
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,2],[2,4],[4,6],[6,0],[1,3],[3,5],[5,7],[7,1]]
    }
  ]
};

/**
 * 获取难度配置
 */
function getDifficultyConfig(level) {
  var configs = {
    easy: { label: '简单', nodeSize: 20, lineWidth: 4 },
    medium: { label: '中等', nodeSize: 16, lineWidth: 3 },
    hard: { label: '困难', nodeSize: 14, lineWidth: 3 }
  };
  return configs[level] || configs.easy;
}

/**
 * 获取指定难度的关卡列表
 */
function getLevels(level) {
  return LEVELS[level] || LEVELS.easy;
}

/**
 * 计算图中每个节点的度数
 */
function getDegrees(nodes, edges) {
  var degrees = [];
  for (var i = 0; i < nodes.length; i++) {
    degrees.push(0);
  }
  for (var i = 0; i < edges.length; i++) {
    degrees[edges[i][0]]++;
    degrees[edges[i][1]]++;
  }
  return degrees;
}

/**
 * 检查图是否有一笔画路径（欧拉路径）
 * 0个奇数度节点 = 欧拉回路（任意起点）
 * 2个奇数度节点 = 欧拉路径（必须从奇数度节点开始）
 */
function hasEulerPath(nodes, edges) {
  var degrees = getDegrees(nodes, edges);
  var oddCount = 0;
  for (var i = 0; i < degrees.length; i++) {
    if (degrees[i] % 2 !== 0) oddCount++;
  }
  return oddCount === 0 || oddCount === 2;
}

/**
 * 获取建议起始节点
 */
function getSuggestedStart(nodes, edges) {
  var degrees = getDegrees(nodes, edges);
  var oddNodes = [];
  for (var i = 0; i < degrees.length; i++) {
    if (degrees[i] % 2 !== 0) oddNodes.push(i);
  }
  if (oddNodes.length === 2) return oddNodes[0];
  if (oddNodes.length === 0) return 0;
  return 0;
}

/**
 * 查找两点之间的边索引
 */
function findEdge(edges, a, b) {
  for (var i = 0; i < edges.length; i++) {
    if ((edges[i][0] === a && edges[i][1] === b) || (edges[i][0] === b && edges[i][1] === a)) {
      return i;
    }
  }
  return -1;
}

module.exports = {
  LEVELS: LEVELS,
  getDifficultyConfig: getDifficultyConfig,
  getLevels: getLevels,
  getDegrees: getDegrees,
  hasEulerPath: hasEulerPath,
  getSuggestedStart: getSuggestedStart,
  findEdge: findEdge
};
