/*
 * gen.js —— 从前端确定性模拟数据导出 JSON 快照，供后端 JSON 回退模式使用。
 * 运行：node gen.js  （会生成 data/*.json）
 */
const fs = require('fs');
const path = require('path');

global.window = {};
require('../modules.js');
const data = global.window.JP_DATA || {};

const dir = path.join(__dirname, 'data');
fs.mkdirSync(dir, { recursive: true });

let count = 0;
for (const [k, v] of Object.entries(data)) {
  fs.writeFileSync(path.join(dir, k + '.json'), JSON.stringify(v, null, 2), 'utf8');
  count++;
  console.log('  → data/' + k + '.json  (' + (Array.isArray(v) ? v.length : 0) + ' 条)');
}
console.log('导出完成：' + count + ' 个数据集');
