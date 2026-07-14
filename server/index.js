/*
 * 聚品服饰 · 采购部后端桥接服务
 * ---------------------------------------------------------------
 * 作用：把本地 Access 数据库（数据存储.accdb）通过 REST API 暴露给网页端，
 *       让 GitHub Pages 上的前端（设置 window.JP_API_BASE 后）直接读写真实数据。
 *
 * 两种数据模式：
 *   1) Access 模式（生产推荐）：设置环境变量 DB_PATH 指向 数据存储.accdb，
 *      服务通过 node-adodb（需 Windows + Access 引擎）直连真实库。
 *   2) JSON 回退模式（默认/测试）：未设置 DB_PATH 时，读取 data/*.json 快照，
 *      无需任何数据库依赖即可本地跑通整条链路。
 *
 * 启动：
 *   npm install
 *   npm run gen            # 首次生成 data/*.json（仅回退模式需要）
 *   node index.js          # 或 npm start
 *
 * 前端对接：在 index.html 中设置 window.JP_API_BASE = 'http://<本机IP>:8787'
 *           （或部署后端后的公网地址），前端即自动从真实库拉取数据。
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const DB_PATH = process.env.DB_PATH || '';            // 例：X:/A返款登记/数据存储.accdb
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'; // 生产建议设为你的 Pages 域名

// Access 表名（请按你的 数据存储.accdb 实际表名调整）
const TABLES = {
  suppliers: process.env.TABLE_SUPPLIERS || '供应商',
  stockin: process.env.TABLE_STOCKIN || '入库记录',
  detail: process.env.TABLE_DETAIL || '采购明细'
};

const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json());

// ---------- 数据访问层 ----------
const DATA_DIR = path.join(__dirname, 'data');
function readJSON(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name + '.json'), 'utf8'));
  } catch (e) {
    return [];
  }
}

// 内存中的回退数据（写入时同步落盘，便于演示）
const mem = {
  pcStockin: readJSON('pcStockin'),
  pcDetail: readJSON('pcDetail'),
  pcSupplier: readJSON('pcSupplier')
};
function persist(name) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name + '.json'), JSON.stringify(mem[name], null, 2), 'utf8');
}

// node-adodb 懒加载（仅 Access 模式需要，且必须在 Windows + Access 引擎环境下）
let adodbEnabled = false;
function getConn() {
  if (!DB_PATH) return null;
  try {
    const ADODB = require('node-adodb');
    adodbEnabled = true;
    return ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${DB_PATH};Persist Security Info=False;`);
  } catch (e) {
    console.warn('[warn] 未启用 Access 模式（DB_PATH 未设置或 node-adodb 不可用）：', e.message);
    return null;
  }
}
async function queryAccess(sql) {
  const conn = getConn();
  if (!conn) return null;
  try {
    const rows = await conn.query(sql);
    return Array.isArray(rows) ? rows : (rows && rows.recordset) || [];
  } catch (e) {
    console.error('[Access 查询失败]', sql, e.message);
    return null;
  }
}

// 取数：优先 Access，失败/未配置则回退 JSON
async function getSuppliers() {
  const rows = await queryAccess(`SELECT * FROM [${TABLES.suppliers}]`);
  return rows || mem.pcSupplier;
}
async function getStockin() {
  const rows = await queryAccess(`SELECT * FROM [${TABLES.stockin}]`);
  return rows || mem.pcStockin;
}
async function getDetail() {
  const rows = await queryAccess(`SELECT * FROM [${TABLES.detail}]`);
  return rows || mem.pcDetail;
}

// ---------- 路由 ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: DB_PATH && adodbEnabled ? 'access' : 'json-fallback', dbPath: DB_PATH || null });
});

app.get('/api/pc/stockin', async (req, res) => {
  res.json({ data: await getStockin() });
});
app.get('/api/pc/detail', async (req, res) => {
  res.json({ data: await getDetail() });
});
app.get('/api/pc/suppliers', async (req, res) => {
  res.json({ data: await getSuppliers() });
});

// 提交入库（对应 VBA「提交入库」）：回退模式下追加到内存与 JSON，
// Access 模式下应改为 INSERT（见下方注释）。
app.post('/api/pc/stockin', async (req, res) => {
  const body = req.body || {};
  const rec = Object.assign({ id: 'RK' + Date.now(), status: '待入库' }, body);
  mem.pcStockin.unshift(rec);
  persist('pcStockin');
  // Access 模式示例（按需启用）：
  // const conn = getConn();
  // if (conn) await conn.execute(`INSERT INTO [${TABLES.stockin}] (供应商,物料,数量,单价,金额,入库日期,经手人,状态) VALUES (...)`);
  res.json({ ok: true, data: rec });
});

app.listen(PORT, () => {
  console.log(`聚品采购桥接服务已启动：http://localhost:${PORT}`);
  console.log(`数据模式：${DB_PATH ? 'Access (' + DB_PATH + ')' : 'JSON 回退 (data/*.json)'}`);
  console.log(`前端对接：在 index.html 设置 window.JP_API_BASE = 'http://<本机IP>:${PORT}'`);
});
