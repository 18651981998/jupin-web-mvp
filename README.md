# 聚品服饰 · 样版管理系统（网页版 MVP）

服装企业「样版全生命周期管理」系统的网页版原型，对应原 VBA 系统中的核心窗体 **UserForm9**（样版查询 / 交付）。

> 本项目是 **MVP 原型**：用本地生成的模拟数据还原原系统的核心交互与业务逻辑，验证"网页版可行、长什么样"。生产环境需接入真实数据库与登录权限（见文末方案）。

---

## ✨ MVP 已实现功能（对应 UserForm9）

| 能力 | 说明 |
|------|------|
| 多条件查询 | 客户 / 摄影师 / 状态 下拉筛选 + 入库日期区间 |
| 样版列表 | 11 列全字段展示，状态彩色徽章 |
| 表头排序 | 点击任意列头切换 升序 / 降序 |
| 汇总统计 | 入库量、退版量、拍摄费合计、结账额合计、累计欠款 |
| CSV 导出 | 一键导出当前筛选结果为 CSV（带 BOM，Excel 中文不乱码） |

模拟数据规模：**320 条样版记录**，含 20 个客户、12 位摄影师、7 种状态。

---

## 📁 文件结构

```
jupin-web-mvp/
├── index.html   # 页面结构
├── styles.css   # 浅色专业主题样式
├── data.js      # 模拟数据层（生成器，可替换为真实 API）
├── app.js       # 查询 / 列表 / 汇总 / 排序 / CSV 核心逻辑
└── README.md
```

零外部依赖、零构建步骤，纯原生 HTML/CSS/JS，浏览器直接打开即可运行。

---

## 🚀 本地运行

直接用浏览器打开 `index.html` 即可；或起一个本地静态服务器（推荐，避免个别浏览器对本地文件的限制）：

```bash
# 任选其一
python -m http.server 8080
# 然后访问 http://localhost:8080

# 或使用 Node
npx serve .
```

---

## 🔌 后续接入真实数据层（替换 Access）

原 VBA 系统后台是 `X:\A返款登记\数据存储.accdb`（Access + ADODB）。网页版建议改为云数据库，最小改动替换 `data.js` 中的数据获取逻辑：

**推荐方案：Supabase（Postgres，免费层够用）**
- 把 `.accdb` 表结构迁移为 Postgres 表（样版表、客户表、摄影师表、权限表）
- `data.js` 改为调用 Supabase REST API 拉取样版列表
- 用 Supabase Auth 实现原系统的 8 位功能权限位
- 用 Supabase Storage 存放样版图（替代原系统的图片交付/退版流程）

**字段映射参考（已对齐原系统业务字段）**

| 网页字段 | 含义 |
|----------|------|
| `id` | 样版编号 |
| `customer` | 客户 |
| `photographer` | 摄影师（按人结算拍摄费） |
| `category` / `season` | 类别 / 季节 |
| `status` | 生命周期状态 |
| `inboundDate` / `returnDate` | 入库 / 退版日期 |
| `shootFee` / `settleAmount` / `debt` | 拍摄费 / 结账额 / 欠款 |

---

## 🌐 部署到 GitHub Pages

1. 在本仓库创建 GitHub 仓库（如 `jupin-web`）。
2. 推送 `jupin-web-mvp/` 下的全部文件到 `main` 分支。
3. 仓库 **Settings → Pages → Source** 选择 `main` 分支根目录，保存。
4. 等待 1–2 分钟，访问 `https://<你的用户名>.github.io/jupin-web/` 即可。

> 纯静态站点无需后端；接入 Supabase 后数据库与鉴权走云服务，前端仍由 GitHub Pages 托管。

---

## 📌 下一步建议

1. 导出原 `数据存储.accdb` 的表结构，生成 Postgres DDL。
2. 用 Supabase 替换 `data.js`，接通真实样版数据。
3. 补齐权限登录、样版入库/退版/结算等写操作（对应原系统其余窗体与模块）。
