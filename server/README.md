# 聚品服饰 · 采购部后端桥接服务

把本地 **Access 数据库（`数据存储.accdb`）** 通过 REST API 暴露给网页端，让部署在 GitHub Pages 上的前端（设置 `window.JP_API_BASE` 后）直接读写真实采购数据。

> 为什么需要它：网页（GitHub Pages）是纯静态站点，浏览器无法直连 Access 文件。必须由一个**运行在你本机/内网 Windows（能访问 `.accdb`）的后端**做桥接。

## 两种数据模式

| 模式 | 何时 | 说明 |
|------|------|------|
| **JSON 回退** | 默认 / 未配置 `DB_PATH` | 读取 `data/*.json` 快照，无需数据库即可跑通整条链路（适合演示、联调）。 |
| **Access 直连** | 设置 `DB_PATH` 且装好 `node-adodb` | 直连真实 `数据存储.accdb`，返回库内真实数据。需 **Windows + Access 数据库引擎**。 |

## 快速开始（JSON 回退，5 分钟跑通）

```bash
cd server
npm install
npm run gen          # 生成 data/*.json（来自前端确定性模拟数据）
npm start            # 监听 http://localhost:8787
```

浏览器打开前端 `index.html`，在文件顶部加入：

```html
<script>window.JP_API_BASE = 'http://localhost:8787';</script>
```

刷新后，采购部三个页面即自动从本服务拉取数据（不再用内置模拟数据）。

## 连接真实数据库（Access 直连）

1. 安装 Access 数据库引擎（ACE OLEDB 12.0，32/64 位需与 Node 匹配）。
2. 安装依赖（含可选 `node-adodb`）：
   ```bash
   npm install
   ```
3. 设置环境变量后启动：
   ```bash
   DB_PATH="X:/A返款登记/数据存储.accdb" node index.js
   ```
4. 按你的 `数据存储.accdb` 实际**表名 / 字段名**调整 `index.js` 中的 `TABLES` 与 SQL（当前表名 `供应商 / 入库记录 / 采购明细` 为推断值，请对照知识库 VBA 中的真实表名核对）。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/health` | 健康检查 + 当前数据模式 |
| GET  | `/api/pc/stockin` | 采购入库列表（对应 VBA「提交入库」） |
| GET  | `/api/pc/detail` | 采购明细台账 |
| GET  | `/api/pc/suppliers` | 供应商管理（含应付余额） |
| POST | `/api/pc/stockin` | 提交一条入库记录 |

> 公网部署时，请将 `ALLOW_ORIGIN` 设为你的 GitHub Pages 域名，并把服务用 pm2 / 反向代理（nginx）暴露出去。
