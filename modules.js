/*
 * 聚品服饰 · 部门门户 · 功能模块配置与模拟数据
 * ---------------------------------------------------------------
 * 为每个「规划中」的功能页提供行业标准界面配置：
 *   - columns：表格列（支持 text / badge / money / num / progress / date / action）
 *   - filters：筛选栏（search / select / daterange）
 *   - stats：顶部 KPI 卡片（函数，从数据实时计算）
 *   - data：确定性模拟数据（同种子每次一致）
 * 由 portal.js 的通用模块渲染器消费。摄影部「样版查询」为独立实现，不在此列。
 */
(function () {
  'use strict';
  const M = window.JP_META || {};
  const CUST = M.CUSTOMERS || [];
  const PHOT = M.PHOTOGRAPHERS || [];

  // ---------- 工具 ----------
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const NOW = new Date(2026, 6, 10).getTime();
  const DAY = 86400000;
  function dstr(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function ago(r, maxD) { return dstr(NOW - Math.floor(r() * maxD) * DAY); }
  function fut(r, maxD) { return dstr(NOW + Math.floor(r() * maxD) * DAY); }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function money(n) { return Math.round(n * 100) / 100; }
  function rows(n, seed, fn) { const r = rng(seed); const a = []; for (let i = 0; i < n; i++) a.push(fn(i, r)); return a; }

  // KPI 辅助
  function sum(arr, k) { return arr.reduce((s, x) => s + (Number(x[k]) || 0), 0); }
  function fmtMoney(n) { return '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtInt(n) { return Number(n).toLocaleString('zh-CN'); }

  // ---------- 通用数据池 ----------
  const NAMES = ['张伟','李娜','王芳','刘强','陈静','杨洋','赵磊','孙丽','周杰','吴敏','郑凯','黄蓉',
    '徐峰','马琳','朱涛','胡斌','郭静','林涛','何雪','高鹏','罗丹','梁爽','宋佳','唐宇',
    '韩磊','冯雪','董浩','萧雅','潘磊','杜娟','钟伟','汪洋','范冰','石磊','谭明','邹婷'];
  const CATS = M.CATEGORIES || ['男装','女装','童装','羽绒服','T恤','衬衫','裤装','裙装','外套','针织'];
  const SEAS = M.SEASONS || ['2027春夏','2026春夏','2026秋冬','2025春夏','2025秋冬'];
  const DEPTS = ['摄影部','财务部','人事部','仓库','运营部'];
  const POS = ['摄影助理','摄影师','修图师','财务专员','会计','人事专员','HRBP','库管员','运营专员','部门主管'];
  const GRADE = ['S级','A级','B级','C级'];
  const LOC = ['A-01','A-02','B-03','B-05','C-01','C-04','D-02','D-06'];
  const MONTHS = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];

  // 徽章色彩常量（对应 styles.css 的 .tag.<c>）
  const G = 'green', B = 'blue', C = 'cyan', A = 'amber', R = 'red', Y = 'gray', P = 'purple', O = 'orange';

  // ============================================================
  //  摄影部（7 个规划页）
  // ============================================================
  const phAssign = rows(36, 101, (i, r) => ({
    id: 'YP' + (2026100 + i), customer: pick(r, CUST), category: pick(r, CATS),
    planDate: fut(r, 35), photographer: pick(r, PHOT),
    status: pick(r, ['待分配', '已分配', '拍摄中'])
  }));
  const phProgress = rows(38, 102, (i, r) => {
    const stage = pick(r, ['待拍', '拍摄中', '待修', '已交付']);
    const prog = stage === '待拍' ? 0 : stage === '拍摄中' ? ri(r, 20, 70) : stage === '待修' ? ri(r, 75, 92) : 100;
    return { id: 'YP' + (2026200 + i), customer: pick(r, CUST), photographer: pick(r, PHOT), stage, progress: prog, due: fut(r, 20) };
  });
  const phDeliver = rows(34, 103, (i, r) => ({
    batch: 'PL' + (2026000 + i), customer: pick(r, CUST), count: ri(r, 6, 60),
    method: pick(r, ['网盘', '邮件', '系统']), deliverDate: ago(r, 120),
    confirm: pick(r, ['待确认', '已确认'])
  }));
  const phInbound = rows(40, 104, (i, r) => ({
    id: 'RK' + (2026000 + i), customer: pick(r, CUST), category: pick(r, CATS), season: pick(r, SEAS),
    qty: ri(r, 1, 20), arriveDate: ago(r, 120), status: pick(r, ['待签收', '已签收', '已上架'])
  }));
  const phReturn = rows(34, 105, (i, r) => ({
    id: 'TB' + (2026000 + i), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), customer: pick(r, CUST),
    returnDate: ago(r, 90), logistics: 'SF' + ri(r, 100000, 999999), status: pick(r, ['待退版', '已退版', '已发还'])
  }));
  const phStatVol = rows(36, 106, (i, r) => {
    const rate = ri(r, 80, 100), cnt = ri(r, 20, 130);
    return { month: MONTHS[i % MONTHS.length], customer: pick(r, CUST), count: cnt, rate, trend: pick(r, ['增长', '下滑']) };
  });
  const phStatPerf = rows(12, 107, (i, r) => {
    const shoot = ri(r, 40, 160), onTime = ri(r, 82, 100), rework = ri(r, 0, 12);
    return { photographer: PHOT[i % PHOT.length], shootCount: shoot, onTime, rework, fee: money(shoot * ri(r, 25, 60)), grade: pick(r, GRADE) };
  });

  // ============================================================
  //  财务部（8 个）
  // ============================================================
  const fiSettle = rows(36, 201, (i, r) => ({
    id: 'JS' + (2026000 + i), customer: pick(r, CUST), month: pick(r, MONTHS), count: ri(r, 8, 90),
    amount: money(ri(r, 3000, 60000)), status: pick(r, ['待结算', '已结算'])
  }));
  const fiRefund = rows(30, 202, (i, r) => ({
    id: 'FK' + (2026000 + i), target: pick(r, CUST.concat(PHOT)), type: pick(r, ['客户返款', '摄影师补偿', '重拍补偿']),
    amount: money(ri(r, 200, 8000)), status: pick(r, ['待返款', '已返款']), regDate: ago(r, 100)
  }));
  const fiCustSettle = rows(30, 203, (i, r) => {
    const payable = money(ri(r, 5000, 80000)), paid = money(payable * (r() < 0.4 ? 0 : r() * 0.9));
    return { customer: pick(r, CUST), month: pick(r, MONTHS), payable, paid, debt: money(payable - paid), status: paid === 0 ? '未结' : (paid >= payable ? '已结' : '部分结') };
  });
  const fiReconcile = rows(30, 204, (i, r) => {
    const receivable = money(ri(r, 8000, 90000)), received = money(receivable * r() * 0.95), debt = money(receivable - received), aging = ri(r, 1, 120);
    return { customer: pick(r, CUST), receivable, received, debt, aging, status: aging > 90 ? '超期' : aging > 60 ? '预警' : '正常' };
  });
  const fiReceive = rows(34, 205, (i, r) => ({
    id: 'SK' + (2026000 + i), customer: pick(r, CUST), date: ago(r, 110), method: pick(r, ['银行', '微信', '支付宝']),
    amount: money(ri(r, 2000, 50000)), status: pick(r, ['待核销', '已核销'])
  }));
  const fiDetail = rows(40, 206, (i, r) => {
    const shootFee = money(ri(r, 200, 3000));
    return { id: 'MX' + (2026000 + i), settleId: 'JS' + (2026000 + ri(r, 1, 36)), customer: pick(r, CUST), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), shootFee, settleAmount: money(shootFee * (0.7 + r() * 0.25)), date: ago(r, 90) };
  });
  const fiProfit = rows(36, 207, (i, r) => {
    const revenue = money(ri(r, 20000, 200000)), cost = money(revenue * (0.4 + r() * 0.35));
    const gross = money(revenue - cost); const rate = ((gross / revenue) * 100);
    return { month: MONTHS[i % MONTHS.length], customer: pick(r, CUST), revenue, cost, gross, rate: Math.round(rate * 10) / 10 };
  });

  // ============================================================
  //  人事部（8 个）
  // ============================================================
  const hrEmployee = rows(40, 301, (i, r) => ({
    id: 'YG' + (2026000 + i), name: pick(r, NAMES), dept: pick(r, DEPTS), position: pick(r, POS),
    hireDate: ago(r, 1500), status: pick(r, ['在职', '试用', '离职'])
  }));
  const hrPhotographer = rows(24, 302, (i, r) => ({
    id: 'SY' + (2026000 + i), name: pick(r, PHOT), grade: pick(r, GRADE), specialty: pick(r, CATS),
    price: money(ri(r, 80, 400)), status: pick(r, ['在职', '休假', '停用'])
  }));
  const hrSalary = rows(36, 303, (i, r) => {
    const base = ri(r, 4000, 9000), piece = ri(r, 0, 5000), perf = ri(r, 0, 3000), deduct = ri(r, 0, 800);
    return { month: MONTHS[i % MONTHS.length], name: pick(r, NAMES), base, piece, perf, deduct, total: base + piece + perf - deduct, status: pick(r, ['草稿', '已核算', '已发放']) };
  });
  const hrBonus = rows(30, 304, (i, r) => {
    const b = ri(r, 500, 5000), f = Math.round((0.8 + r() * 0.7) * 100) / 100;
    return { month: MONTHS[i % MONTHS.length], name: pick(r, NAMES), project: pick(r, ['春季大片', '夏季上新', '秋冬企划', '电商特辑', '直播专场']), base: b, factor: f, bonus: money(b * f), status: pick(r, ['待审批', '已通过', '已驳回']) };
  });
  const hrAttendance = rows(36, 305, (i, r) => {
    const should = ri(r, 21, 23), late = ri(r, 0, 3), actual = should - late - ri(r, 0, 2);
    return { month: MONTHS[i % MONTHS.length], name: pick(r, NAMES), should, actual: Math.max(0, actual), late, absent: Math.max(0, should - actual - late), status: (late + (should - actual) > 4) ? '异常' : '正常' };
  });
  const hrLeave = rows(30, 306, (i, r) => {
    const s = NOW - ri(r, 0, 60) * DAY, days = ri(r, 1, 10);
    return { id: 'QJ' + (2026000 + i), name: pick(r, NAMES), type: pick(r, ['事假', '病假', '调休', '年假']), start: dstr(s), end: dstr(s + days * DAY), days, status: pick(r, ['待审批', '已通过', '已驳回']) };
  });

  // ============================================================
  //  仓库（9 个）
  // ============================================================
  const whInbound = rows(38, 401, (i, r) => ({
    id: 'WRK' + (2026000 + i), customer: pick(r, CUST), sampleId: 'YP' + (2026000 + ri(r, 1, 320)),
    category: pick(r, CATS), qty: ri(r, 1, 20), location: pick(r, LOC), status: pick(r, ['待上架', '已上架'])
  }));
  const whReturn = rows(32, 402, (i, r) => ({
    id: 'WTB' + (2026000 + i), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), customer: pick(r, CUST),
    qty: ri(r, 1, 12), returnDate: ago(r, 90), status: pick(r, ['待退版', '已退版'])
  }));
  const whQuery = rows(40, 403, (i, r) => ({
    sampleId: 'YP' + (2026000 + i), customer: pick(r, CUST), category: pick(r, CATS),
    status: pick(r, ['在库', '借出', '待退']), location: pick(r, LOC), days: ri(r, 1, 120)
  }));
  const whOut = rows(34, 404, (i, r) => ({
    id: 'WCK' + (2026000 + i), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), photographer: pick(r, PHOT),
    outDate: ago(r, 40), dueDate: fut(r, 20), status: pick(r, ['已出库', '已归还'])
  }));
  const whBack = rows(30, 405, (i, r) => ({
    id: 'WBH' + (2026000 + i), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), photographer: pick(r, PHOT),
    backDate: ago(r, 50), condition: pick(r, ['完好', '轻微磨损', '破损'])
  }));
  const whCheck = rows(26, 406, (i, r) => {
    const prog = ri(r, 0, 100);
    return { id: 'PD' + (2026000 + i), scope: pick(r, ['全库', 'A区', 'B区', 'C区', 'D区', '季节样版']), planDate: fut(r, 30), checker: pick(r, NAMES), progress: prog, status: prog === 0 ? '未开始' : prog === 100 ? '已完成' : '进行中' };
  });
  const whDiff = rows(28, 407, (i, r) => {
    const book = ri(r, 1, 30), actual = book + (r() < 0.5 ? -ri(r, 1, 5) : ri(r, 1, 5));
    const diff = actual - book;
    return { id: 'PC' + (2026000 + i), sampleId: 'YP' + (2026000 + ri(r, 1, 320)), book, actual, diff, type: diff >= 0 ? '盘盈' : '盘亏', status: pick(r, ['待处理', '已处理']) };
  });

  // ============================================================
  //  运营部（8 个）
  // ============================================================
  const opCustomer = rows(34, 501, (i, r) => ({
    id: 'KH' + (2026000 + i), name: pick(r, CUST), brand: pick(r, ['男装', '女装', '童装', '全品类', '运动']),
    contact: pick(r, NAMES) + ' 经理', grade: pick(r, ['战略', '重要', '普通']), status: pick(r, ['合作中', '潜在', '暂停'])
  }));
  const opOrder = rows(38, 502, (i, r) => ({
    id: 'DD' + (2026000 + i), customer: pick(r, CUST), category: pick(r, CATS), qty: ri(r, 10, 300),
    due: fut(r, 45), amount: money(ri(r, 5000, 120000)), status: pick(r, ['待排期', '拍摄中', '交付中', '已完成'])
  }));
  const opOrderInput = rows(34, 503, (i, r) => ({
    id: 'LR' + (2026000 + i), customer: pick(r, CUST), category: pick(r, CATS), qty: ri(r, 10, 300),
    quote: money(ri(r, 5000, 120000)), inputDate: ago(r, 80), status: pick(r, ['待审核', '已通过', '已驳回'])
  }));
  const opOrderTrack = rows(36, 504, (i, r) => {
    const stage = pick(r, ['待拍摄', '拍摄中', '交付中', '已完成']);
    const prog = stage === '待拍摄' ? ri(r, 0, 15) : stage === '拍摄中' ? ri(r, 20, 60) : stage === '交付中' ? ri(r, 65, 95) : 100;
    return { id: 'TK' + (2026000 + i), customer: pick(r, CUST), stage, progress: prog, due: fut(r, 30) };
  });
  const opDash = rows(12, 505, (i, r) => ({
    month: MONTHS[i % MONTHS.length], orders: ri(r, 30, 120), shoots: ri(r, 40, 150), onTime: ri(r, 80, 100), revenue: money(ri(r, 50000, 300000))
  }));
  const opAnalysis = rows(36, 506, (i, r) => {
    const revenue = money(ri(r, 30000, 250000)), cost = money(revenue * (0.45 + r() * 0.3));
    const gross = money(revenue - cost);
    return { month: MONTHS[i % MONTHS.length], customer: pick(r, CUST), orders: ri(r, 20, 110), revenue, cost, gross, margin: Math.round((gross / revenue) * 1000) / 10 };
  });

  // ============================================================
  //  模块配置（UI 规格）
  // ============================================================
  function badge(map) { return { type: 'badge', map }; }
  const ACT = { type: 'action', actions: ['查看', '导出'] };

  // ============================================================
  //  采购部（采购明细 / 采购录入 / 供应商管理）
  // ============================================================
  const SUP = ['锦绣纺织品', '华艺服装', '星光道具', '恒达包装', '锐影器材', '云裳面料', '金石五金', '博雅文化', '天工制衣', '佳美辅料'];
  const PITEMS = ['拍摄道具-复古椅', '样衣-真丝衬衫', '背景布-纯色', '包装盒-礼盒', '灯架-碳纤维', '服装-羊毛大衣', '首饰-项链', '鞋履-高跟', '面料-棉麻', '彩妆套盒', '假发-短卷', '耳环-珍珠'];
  const PCATS = ['服装', '道具', '包装', '器材', '面料', '辅料'];

  const pcDetail = rows(42, 401, (i, r) => {
    const qty = ri(r, 5, 200), price = money(ri(r, 8, 600));
    const arrive = pick(r, ['已到货', '部分到货', '未到货', '已取消']);
    return {
      id: 'CG' + (2026000 + i), supplier: pick(r, SUP), item: pick(r, PITEMS), category: pick(r, PCATS),
      qty, price, amount: money(qty * price), orderDate: ago(r, 150),
      arriveDate: (arrive === '未到货' || arrive === '已取消') ? '—' : fut(r, 30),
      status: arrive
    };
  });
  const pcInput = rows(34, 402, (i, r) => {
    const qty = ri(r, 5, 150), est = money(qty * ri(r, 8, 500));
    return {
      id: 'LR' + (2026000 + i), supplier: pick(r, SUP), item: pick(r, PITEMS), category: pick(r, PCATS),
      qty, estAmount: est, applicant: pick(r, NAMES), inputDate: ago(r, 60),
      status: pick(r, ['待审核', '已通过', '已驳回', '已下单'])
    };
  });
  const pcSupplier = rows(28, 403, (i, r) => ({
    id: 'GYS' + (2026000 + i), name: SUP[i % SUP.length], contact: pick(r, NAMES),
    phone: '1' + ri(r, 3000000000, 3999999999), category: pick(r, PCATS),
    rating: pick(r, ['A', 'B', 'C']), status: pick(r, ['合作中', '潜在', '暂停']),
    totalPurchase: money(ri(r, 20000, 600000))
  }));

  window.JP_MODULES = {
    // ---------- 摄影部 ----------
    'ph-assign': {
      title: '样版分配', desc: '将新入库样版分配给摄影师，记录分配时间、负责人与计划拍摄日。',
      filters: [
        { type: 'search', key: 'kw', placeholder: '搜索样版编号 / 客户' },
        { type: 'select', field: 'status', label: '状态', options: ['全部', '待分配', '已分配', '拍摄中'] },
        { type: 'select', field: 'photographer', label: '摄影师', options: ['全部'].concat(PHOT) }
      ],
      columns: [
        { key: 'id', label: '样版编号' }, { key: 'customer', label: '客户' }, { key: 'category', label: '类别' },
        { key: 'planDate', label: '计划拍摄日' }, { key: 'photographer', label: '摄影师' },
        Object.assign({ key: 'status', label: '分配状态' }, badge({ '待分配': Y, '已分配': B, '拍摄中': A })), ACT
      ],
      stats: (d) => [{ k: '待分配', v: d.filter(r => r.status === '待分配').length }, { k: '已分配', v: d.filter(r => r.status === '已分配').length }, { k: '拍摄中', v: d.filter(r => r.status === '拍摄中').length }, { k: '合计样版', v: d.length }],
      data: () => phAssign
    },
    'ph-progress': {
      title: '拍摄进度跟踪', desc: '以看板形式展示各样版拍摄状态，监控拍摄周期并超时预警。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索样版 / 客户 / 摄影师' }, { type: 'select', field: 'stage', label: '阶段', options: ['全部', '待拍', '拍摄中', '待修', '已交付'] }],
      columns: [
        { key: 'id', label: '样版编号' }, { key: 'customer', label: '客户' }, { key: 'photographer', label: '摄影师' },
        Object.assign({ key: 'stage', label: '阶段' }, badge({ '待拍': Y, '拍摄中': A, '待修': B, '已交付': G })),
        { key: 'progress', label: '进度', type: 'progress' }, { key: 'due', label: '预计完成' }, ACT
      ],
      stats: (d) => [{ k: '待拍', v: d.filter(r => r.stage === '待拍').length }, { k: '拍摄中', v: d.filter(r => r.stage === '拍摄中').length }, { k: '待修', v: d.filter(r => r.stage === '待修').length }, { k: '已交付', v: d.filter(r => r.stage === '已交付').length }],
      data: () => phProgress
    },
    'ph-deliver': {
      title: '图片交付', desc: '上传并管理成片，记录交付批次、交付方式与客户签收确认。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索批次 / 客户' }, { type: 'select', field: 'confirm', label: '确认状态', options: ['全部', '待确认', '已确认'] }],
      columns: [
        { key: 'batch', label: '交付批次' }, { key: 'customer', label: '客户' }, { key: 'count', label: '样版数', type: 'num' },
        Object.assign({ key: 'method', label: '交付方式' }, badge({ '网盘': B, '邮件': P, '系统': C })),
        { key: 'deliverDate', label: '交付日期' }, Object.assign({ key: 'confirm', label: '客户确认' }, badge({ '待确认': A, '已确认': G })), ACT
      ],
      stats: (d) => [{ k: '交付批次', v: d.length }, { k: '待确认', v: d.filter(r => r.confirm === '待确认').length }, { k: '已确认', v: d.filter(r => r.confirm === '已确认').length }, { k: '交付样版数', v: fmtInt(sum(d, 'count')) }],
      data: () => phDeliver
    },
    'ph-inbound': {
      title: '样版入库登记', desc: '登记客户寄来的样版，生成样版编号并打印签收单。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索入库单 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待签收', '已签收', '已上架'] }],
      columns: [
        { key: 'id', label: '入库单号' }, { key: 'customer', label: '客户' }, { key: 'category', label: '类别' }, { key: 'season', label: '季节' },
        { key: 'qty', label: '数量', type: 'num' }, { key: 'arriveDate', label: '到货日期' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '待签收': A, '已签收': B, '已上架': G })), ACT
      ],
      stats: (d) => [{ k: '待签收', v: d.filter(r => r.status === '待签收').length }, { k: '已签收', v: d.filter(r => r.status === '已签收').length }, { k: '已上架', v: d.filter(r => r.status === '已上架').length }, { k: '到货总数', v: fmtInt(sum(d, 'qty')) }],
      data: () => phInbound
    },
    'ph-return': {
      title: '拍完退版', desc: '拍摄完成并经客户确认后，登记退版日期、物流单号，归档退版记录。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索退版单 / 样版 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待退版', '已退版', '已发还'] }],
      columns: [
        { key: 'id', label: '退版单号' }, { key: 'sampleId', label: '样版编号' }, { key: 'customer', label: '客户' },
        { key: 'returnDate', label: '退版日期' }, { key: 'logistics', label: '物流单号' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '待退版': A, '已退版': Y, '已发还': C })), ACT
      ],
      stats: (d) => [{ k: '待退版', v: d.filter(r => r.status === '待退版').length }, { k: '已退版', v: d.filter(r => r.status === '已退版').length }, { k: '已发还', v: d.filter(r => r.status === '已发还').length }],
      data: () => phReturn
    },
    'ph-stat-volume': {
      title: '拍摄量统计', desc: '按客户、月份统计拍摄样版数量与完成率，生成趋势。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户 / 月份' }, { type: 'select', field: 'trend', label: '趋势', options: ['全部', '增长', '下滑'] }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'customer', label: '客户' }, { key: 'count', label: '拍摄数', type: 'num' },
        { key: 'rate', label: '完成率(%)', type: 'num' }, Object.assign({ key: 'trend', label: '趋势' }, badge({ '增长': G, '下滑': R })), ACT
      ],
      stats: (d) => [{ k: '总拍摄数', v: fmtInt(sum(d, 'count')) }, { k: '平均完成率', v: Math.round(d.reduce((s, r) => s + r.rate, 0) / d.length) + '%' }, { k: '增长月份', v: d.filter(r => r.trend === '增长').length }, { k: '下滑月份', v: d.filter(r => r.trend === '下滑').length }],
      data: () => phStatVol
    },
    'ph-stat-perf': {
      title: '摄影师绩效', desc: '按摄影师统计拍摄量、交付及时率、返修率与拍摄费，用于绩效核算。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索摄影师' }, { type: 'select', field: 'grade', label: '等级', options: ['全部'].concat(GRADE) }],
      columns: [
        { key: 'photographer', label: '摄影师' }, { key: 'shootCount', label: '拍摄量', type: 'num' },
        { key: 'onTime', label: '及时率(%)', type: 'num' }, { key: 'rework', label: '返修率(%)', type: 'num' },
        { key: 'fee', label: '拍摄费', type: 'money' }, Object.assign({ key: 'grade', label: '等级' }, badge({ 'S级': P, 'A级': B, 'B级': G, 'C级': Y })), ACT
      ],
      stats: (d) => [{ k: '摄影师数', v: d.length }, { k: '总拍摄量', v: fmtInt(sum(d, 'shootCount')) }, { k: '平均及时率', v: Math.round(d.reduce((s, r) => s + r.onTime, 0) / d.length) + '%' }, { k: '拍摄费合计', v: fmtMoney(sum(d, 'fee')) }],
      data: () => phStatPerf
    },

    // ---------- 财务部 ----------
    'fi-settle': {
      title: '拍摄费用结算', desc: '按客户 / 月份汇总拍摄费，生成结算单并与样版交付记录核对。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索结算单 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待结算', '已结算'] }],
      columns: [
        { key: 'id', label: '结算单号' }, { key: 'customer', label: '客户' }, { key: 'month', label: '月份' }, { key: 'count', label: '样版数', type: 'num' },
        { key: 'amount', label: '结算金额', type: 'money' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待结算': A, '已结算': G })), ACT
      ],
      stats: (d) => [{ k: '结算单数', v: d.length }, { k: '待结算', v: d.filter(r => r.status === '待结算').length }, { k: '结算总额', v: fmtMoney(sum(d, 'amount')) }, { k: '已结算金额', v: fmtMoney(d.filter(r => r.status === '已结算').reduce((s, r) => s + r.amount, 0)) }],
      data: () => fiSettle
    },
    'fi-refund': {
      title: '返款登记', desc: '登记应向客户或摄影师返还的款项，跟踪返款状态。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索返款单 / 对象' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待返款', '已返款'] }],
      columns: [
        { key: 'id', label: '返款单号' }, { key: 'target', label: '返款对象' }, Object.assign({ key: 'type', label: '类型' }, badge({ '客户返款': B, '摄影师补偿': C, '重拍补偿': A })),
        { key: 'amount', label: '金额', type: 'money' }, { key: 'regDate', label: '登记日期' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待返款': A, '已返款': G })), ACT
      ],
      stats: (d) => [{ k: '返款笔数', v: d.length }, { k: '待返款', v: d.filter(r => r.status === '待返款').length }, { k: '已返款', v: d.filter(r => r.status === '已返款').length }, { k: '待返款金额', v: fmtMoney(d.filter(r => r.status === '待返款').reduce((s, r) => s + r.amount, 0)) }],
      data: () => fiRefund
    },
    'fi-customer-settle': {
      title: '客户结账', desc: '按客户生成对账单，记录已结 / 未结金额与结账方式。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '未结', '部分结', '已结'] }],
      columns: [
        { key: 'customer', label: '客户' }, { key: 'month', label: '月份' }, { key: 'payable', label: '应结金额', type: 'money' },
        { key: 'paid', label: '已结金额', type: 'money' }, { key: 'debt', label: '欠款', type: 'money' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '未结': R, '部分结': A, '已结': G })), ACT
      ],
      stats: (d) => [{ k: '客户数', v: d.length }, { k: '未结', v: d.filter(r => r.status === '未结').length }, { k: '应结总额', v: fmtMoney(sum(d, 'payable')) }, { k: '欠款总额', v: fmtMoney(sum(d, 'debt')) }],
      data: () => fiCustSettle
    },
    'fi-reconcile': {
      title: '欠款对账', desc: '按客户汇总拍摄费、已结金额与欠款，自动生成对账差异明细。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户' }, { type: 'select', field: 'status', label: '账龄', options: ['全部', '正常', '预警', '超期'] }],
      columns: [
        { key: 'customer', label: '客户' }, { key: 'receivable', label: '应收总额', type: 'money' }, { key: 'received', label: '已收', type: 'money' },
        { key: 'debt', label: '欠款', type: 'money' }, { key: 'aging', label: '账期(天)', type: 'num' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '正常': G, '预警': A, '超期': R })), ACT
      ],
      stats: (d) => [{ k: '客户数', v: d.length }, { k: '超期', v: d.filter(r => r.status === '超期').length }, { k: '应收总额', v: fmtMoney(sum(d, 'receivable')) }, { k: '欠款总额', v: fmtMoney(sum(d, 'debt')) }],
      data: () => fiReconcile
    },
    'fi-receive': {
      title: '收款管理', desc: '登记客户回款，核销应收账款并更新欠款余额。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索收款单 / 客户' }, { type: 'select', field: 'status', label: '核销', options: ['全部', '待核销', '已核销'] }],
      columns: [
        { key: 'id', label: '收款单号' }, { key: 'customer', label: '客户' }, { key: 'date', label: '收款日期' },
        Object.assign({ key: 'method', label: '方式' }, badge({ '银行': B, '微信': G, '支付宝': C })), { key: 'amount', label: '金额', type: 'money' },
        Object.assign({ key: 'status', label: '核销' }, badge({ '待核销': A, '已核销': G })), ACT
      ],
      stats: (d) => [{ k: '收款笔数', v: d.length }, { k: '待核销', v: d.filter(r => r.status === '待核销').length }, { k: '已核销', v: d.filter(r => r.status === '已核销').length }, { k: '收款总额', v: fmtMoney(sum(d, 'amount')) }],
      data: () => fiReceive
    },
    'fi-detail': {
      title: '结算明细表', desc: '按任意维度导出结算明细，支持分页、筛选与打印。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索明细 / 结算单 / 客户' }],
      columns: [
        { key: 'id', label: '明细单号' }, { key: 'settleId', label: '结算单号' }, { key: 'customer', label: '客户' }, { key: 'sampleId', label: '样版编号' },
        { key: 'shootFee', label: '拍摄费', type: 'money' }, { key: 'settleAmount', label: '结账额', type: 'money' }, { key: 'date', label: '日期' }, ACT
      ],
      stats: (d) => [{ k: '明细条数', v: d.length }, { k: '拍摄费合计', v: fmtMoney(sum(d, 'shootFee')) }, { k: '结账额合计', v: fmtMoney(sum(d, 'settleAmount')) }],
      data: () => fiDetail
    },
    'fi-profit': {
      title: '利润核算', desc: '按客户 / 月份核算收入、拍摄成本与外部费用，输出毛利与净利率。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户 / 月份' }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'customer', label: '客户' }, { key: 'revenue', label: '收入', type: 'money' },
        { key: 'cost', label: '成本', type: 'money' }, { key: 'gross', label: '毛利', type: 'money' },
        Object.assign({ key: 'rate', label: '净利率(%)', type: 'num' }, badge({})), ACT
      ],
      stats: (d) => [{ k: '总收入', v: fmtMoney(sum(d, 'revenue')) }, { k: '总成本', v: fmtMoney(sum(d, 'cost')) }, { k: '总毛利', v: fmtMoney(sum(d, 'gross')) }, { k: '平均净利率', v: Math.round(d.reduce((s, r) => s + r.rate, 0) / d.length) + '%' }],
      data: () => fiProfit
    },

    // ---------- 人事部 ----------
    'hr-employee': {
      title: '员工档案', desc: '维护员工基本信息、合同、岗位与在职状态，支持入职 / 离职流程。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索工号 / 姓名' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '在职', '试用', '离职'] }],
      columns: [
        { key: 'id', label: '工号' }, { key: 'name', label: '姓名' }, { key: 'dept', label: '部门' }, { key: 'position', label: '岗位' },
        { key: 'hireDate', label: '入职日期' }, Object.assign({ key: 'status', label: '状态' }, badge({ '在职': G, '试用': A, '离职': Y })), ACT
      ],
      stats: (d) => [{ k: '员工总数', v: d.length }, { k: '在职', v: d.filter(r => r.status === '在职').length }, { k: '试用', v: d.filter(r => r.status === '试用').length }, { k: '离职', v: d.filter(r => r.status === '离职').length }],
      data: () => hrEmployee
    },
    'hr-photographer': {
      title: '摄影师管理', desc: '维护摄影师专长、档期、结算单价与等级，作为分配与计费依据。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索工号 / 姓名' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '在职', '休假', '停用'] }],
      columns: [
        { key: 'id', label: '工号' }, { key: 'name', label: '姓名' }, Object.assign({ key: 'grade', label: '等级' }, badge({ 'S级': P, 'A级': B, 'B级': G, 'C级': Y })),
        { key: 'specialty', label: '专长' }, { key: 'price', label: '结算单价', type: 'money' }, Object.assign({ key: 'status', label: '状态' }, badge({ '在职': G, '休假': A, '停用': Y })), ACT
      ],
      stats: (d) => [{ k: '摄影师数', v: d.length }, { k: '在职', v: d.filter(r => r.status === '在职').length }, { k: '休假', v: d.filter(r => r.status === '休假').length }, { k: '停用', v: d.filter(r => r.status === '停用').length }],
      data: () => hrPhotographer
    },
    'hr-salary': {
      title: '薪资核算', desc: '按月汇总基本工资、拍摄计件、绩效与扣款，生成薪资表。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索姓名 / 月份' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '草稿', '已核算', '已发放'] }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'name', label: '姓名' }, { key: 'base', label: '基本工资', type: 'money' }, { key: 'piece', label: '计件', type: 'money' },
        { key: 'perf', label: '绩效', type: 'money' }, { key: 'deduct', label: '扣款', type: 'money' }, { key: 'total', label: '应发', type: 'money' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '草稿': Y, '已核算': B, '已发放': G })), ACT
      ],
      stats: (d) => [{ k: '应发总额', v: fmtMoney(sum(d, 'total')) }, { k: '基本工资', v: fmtMoney(sum(d, 'base')) }, { k: '计件工资', v: fmtMoney(sum(d, 'piece')) }, { k: '已发放', v: d.filter(r => r.status === '已发放').length }],
      data: () => hrSalary
    },
    'hr-bonus': {
      title: '绩效奖金', desc: '依据摄影师绩效与项目贡献计算奖金，支持自定义方案与审批。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索姓名 / 项目' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待审批', '已通过', '已驳回'] }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'name', label: '姓名' }, { key: 'project', label: '项目' }, { key: 'base', label: '奖金基数', type: 'money' },
        { key: 'factor', label: '系数' }, { key: 'bonus', label: '奖金', type: 'money' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待审批': A, '已通过': G, '已驳回': R })), ACT
      ],
      stats: (d) => [{ k: '奖金总额', v: fmtMoney(sum(d, 'bonus')) }, { k: '待审批', v: d.filter(r => r.status === '待审批').length }, { k: '已通过', v: d.filter(r => r.status === '已通过').length }, { k: '已驳回', v: d.filter(r => r.status === '已驳回').length }],
      data: () => hrBonus
    },
    'hr-attendance': {
      title: '考勤记录', desc: '记录员工上下班、外拍出勤，自动统计出勤天数与异常。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索姓名 / 月份' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '正常', '异常'] }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'name', label: '姓名' }, { key: 'should', label: '应出勤', type: 'num' }, { key: 'actual', label: '实际', type: 'num' },
        { key: 'late', label: '迟到', type: 'num' }, { key: 'absent', label: '缺勤', type: 'num' }, Object.assign({ key: 'status', label: '状态' }, badge({ '正常': G, '异常': R })), ACT
      ],
      stats: (d) => [{ k: '记录数', v: d.length }, { k: '异常', v: d.filter(r => r.status === '异常').length }, { k: '迟到总次数', v: fmtInt(sum(d, 'late')) }, { k: '缺勤总天数', v: fmtInt(sum(d, 'absent')) }],
      data: () => hrAttendance
    },
    'hr-leave': {
      title: '请假审批', desc: '处理事假 / 病假 / 调休申请，记录审批流与剩余额度。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索申请单 / 姓名' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待审批', '已通过', '已驳回'] }],
      columns: [
        { key: 'id', label: '申请单号' }, { key: 'name', label: '姓名' }, Object.assign({ key: 'type', label: '类型' }, badge({ '事假': B, '病假': R, '调休': C, '年假': G })),
        { key: 'start', label: '开始' }, { key: 'end', label: '结束' }, { key: 'days', label: '天数', type: 'num' },
        Object.assign({ key: 'status', label: '审批' }, badge({ '待审批': A, '已通过': G, '已驳回': R })), ACT
      ],
      stats: (d) => [{ k: '申请数', v: d.length }, { k: '待审批', v: d.filter(r => r.status === '待审批').length }, { k: '已通过', v: d.filter(r => r.status === '已通过').length }, { k: '已驳回', v: d.filter(r => r.status === '已驳回').length }],
      data: () => hrLeave
    },

    // ---------- 仓库 ----------
    'wh-inbound': {
      title: '样版入库', desc: '接收摄影部 / 客户送来的样版，扫码登记上架，更新库存可用量。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索入库单 / 客户 / 样版' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待上架', '已上架'] }],
      columns: [
        { key: 'id', label: '入库单号' }, { key: 'customer', label: '客户' }, { key: 'sampleId', label: '样版编号' }, { key: 'category', label: '类别' },
        { key: 'qty', label: '数量', type: 'num' }, { key: 'location', label: '库位' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待上架': A, '已上架': G })), ACT
      ],
      stats: (d) => [{ k: '入库单数', v: d.length }, { k: '待上架', v: d.filter(r => r.status === '待上架').length }, { k: '已上架', v: d.filter(r => r.status === '已上架').length }, { k: '入库总数', v: fmtInt(sum(d, 'qty')) }],
      data: () => whInbound
    },
    'wh-return': {
      title: '样版退版', desc: '登记拍摄完成后的退版样版，核验数量与状态后归库或发还客户。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索退版单 / 样版 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待退版', '已退版'] }],
      columns: [
        { key: 'id', label: '退版单号' }, { key: 'sampleId', label: '样版编号' }, { key: 'customer', label: '客户' }, { key: 'qty', label: '数量', type: 'num' },
        { key: 'returnDate', label: '退版日期' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待退版': A, '已退版': G })), ACT
      ],
      stats: (d) => [{ k: '退版单数', v: d.length }, { k: '待退版', v: d.filter(r => r.status === '待退版').length }, { k: '已退版', v: d.filter(r => r.status === '已退版').length }, { k: '退版总数', v: fmtInt(sum(d, 'qty')) }],
      data: () => whReturn
    },
    'wh-query': {
      title: '库存查询', desc: '按编号 / 客户 / 状态实时查询样版库存位置与流转历史。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索样版编号 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '在库', '借出', '待退'] }],
      columns: [
        { key: 'sampleId', label: '样版编号' }, { key: 'customer', label: '客户' }, { key: 'category', label: '类别' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '在库': G, '借出': A, '待退': B })), { key: 'location', label: '库位' }, { key: 'days', label: '在库天数', type: 'num' }, ACT
      ],
      stats: (d) => [{ k: '库存样版', v: d.length }, { k: '在库', v: d.filter(r => r.status === '在库').length }, { k: '借出', v: d.filter(r => r.status === '借出').length }, { k: '待退', v: d.filter(r => r.status === '待退').length }],
      data: () => whQuery
    },
    'wh-out': {
      title: '分配出库', desc: '样版下发给摄影师拍摄时出库登记，记录领取人与预计归还日。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索出库单 / 样版 / 摄影师' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '已出库', '已归还'] }],
      columns: [
        { key: 'id', label: '出库单号' }, { key: 'sampleId', label: '样版编号' }, { key: 'photographer', label: '摄影师' }, { key: 'outDate', label: '出库日期' },
        { key: 'dueDate', label: '预计归还' }, Object.assign({ key: 'status', label: '状态' }, badge({ '已出库': A, '已归还': G })), ACT
      ],
      stats: (d) => [{ k: '出库单数', v: d.length }, { k: '已出库', v: d.filter(r => r.status === '已出库').length }, { k: '已归还', v: d.filter(r => r.status === '已归还').length }],
      data: () => whOut
    },
    'wh-back': {
      title: '归还入库', desc: '摄影师交回样版时归还登记，核验完好度并更新库存。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索归还单 / 样版 / 摄影师' }, { type: 'select', field: 'condition', label: '完好度', options: ['全部', '完好', '轻微磨损', '破损'] }],
      columns: [
        { key: 'id', label: '归还单号' }, { key: 'sampleId', label: '样版编号' }, { key: 'photographer', label: '摄影师' }, { key: 'backDate', label: '归还日期' },
        Object.assign({ key: 'condition', label: '完好度' }, badge({ '完好': G, '轻微磨损': A, '破损': R })), ACT
      ],
      stats: (d) => [{ k: '归还单数', v: d.length }, { k: '完好', v: d.filter(r => r.condition === '完好').length }, { k: '轻微磨损', v: d.filter(r => r.condition === '轻微磨损').length }, { k: '破损', v: d.filter(r => r.condition === '破损').length }],
      data: () => whBack
    },
    'wh-check': {
      title: '定期盘点', desc: '按周期对样版库存全面盘点，生成盘点单并记录盘点人。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索盘点单 / 盘点人' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '未开始', '进行中', '已完成'] }],
      columns: [
        { key: 'id', label: '盘点单号' }, { key: 'scope', label: '盘点范围' }, { key: 'planDate', label: '计划日期' }, { key: 'checker', label: '盘点人' },
        { key: 'progress', label: '进度', type: 'progress' }, Object.assign({ key: 'status', label: '状态' }, badge({ '未开始': Y, '进行中': A, '已完成': G })), ACT
      ],
      stats: (d) => [{ k: '盘点单', v: d.length }, { k: '未开始', v: d.filter(r => r.status === '未开始').length }, { k: '进行中', v: d.filter(r => r.status === '进行中').length }, { k: '已完成', v: d.filter(r => r.status === '已完成').length }],
      data: () => whCheck
    },
    'wh-diff': {
      title: '盘盈盘亏', desc: '对比账实差异，登记盘盈 / 盘亏原因与处理意见。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索差异单 / 样版' }, { type: 'select', field: 'type', label: '类型', options: ['全部', '盘盈', '盘亏'] }],
      columns: [
        { key: 'id', label: '差异单号' }, { key: 'sampleId', label: '样版编号' }, { key: 'book', label: '账面数', type: 'num' }, { key: 'actual', label: '实盘数', type: 'num' },
        { key: 'diff', label: '差异', type: 'num' }, Object.assign({ key: 'type', label: '类型' }, badge({ '盘盈': G, '盘亏': R })), Object.assign({ key: 'status', label: '状态' }, badge({ '待处理': A, '已处理': G })), ACT
      ],
      stats: (d) => [{ k: '差异单数', v: d.length }, { k: '盘盈', v: d.filter(r => r.type === '盘盈').length }, { k: '盘亏', v: d.filter(r => r.type === '盘亏').length }, { k: '待处理', v: d.filter(r => r.status === '待处理').length }],
      data: () => whDiff
    },

    // ---------- 运营部 ----------
    'op-customer': {
      title: '客户档案', desc: '维护客户基本信息、品牌、对接人与合作条款，建立客户分级。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户编号 / 名称' }, { type: 'select', field: 'grade', label: '等级', options: ['全部', '战略', '重要', '普通'] }],
      columns: [
        { key: 'id', label: '客户编号' }, { key: 'name', label: '客户名称' }, { key: 'brand', label: '品类' }, { key: 'contact', label: '对接人' },
        Object.assign({ key: 'grade', label: '等级' }, badge({ '战略': P, '重要': B, '普通': Y })), Object.assign({ key: 'status', label: '合作' }, badge({ '合作中': G, '潜在': A, '暂停': R })), ACT
      ],
      stats: (d) => [{ k: '客户数', v: d.length }, { k: '战略', v: d.filter(r => r.grade === '战略').length }, { k: '重要', v: d.filter(r => r.grade === '重要').length }, { k: '合作中', v: d.filter(r => r.status === '合作中').length }],
      data: () => opCustomer
    },
    'op-order': {
      title: '客户订单', desc: '管理客户拍摄需求订单，记录品类、数量、交期与报价。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索订单 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待排期', '拍摄中', '交付中', '已完成'] }],
      columns: [
        { key: 'id', label: '订单号' }, { key: 'customer', label: '客户' }, { key: 'category', label: '品类' }, { key: 'qty', label: '数量', type: 'num' },
        { key: 'due', label: '交期' }, { key: 'amount', label: '金额', type: 'money' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待排期': Y, '拍摄中': A, '交付中': C, '已完成': G })), ACT
      ],
      stats: (d) => [{ k: '订单数', v: d.length }, { k: '待排期', v: d.filter(r => r.status === '待排期').length }, { k: '进行中', v: d.filter(r => r.status === '拍摄中' || r.status === '交付中').length }, { k: '已完成', v: d.filter(r => r.status === '已完成').length }],
      data: () => opOrder
    },
    'op-order-input': {
      title: '订单录入', desc: '录入新拍摄订单，关联客户与样版，生成内部工单推送摄影部。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索录入单 / 客户' }, { type: 'select', field: 'status', label: '状态', options: ['全部', '待审核', '已通过', '已驳回'] }],
      columns: [
        { key: 'id', label: '录入单号' }, { key: 'customer', label: '客户' }, { key: 'category', label: '品类' }, { key: 'qty', label: '数量', type: 'num' },
        { key: 'quote', label: '报价', type: 'money' }, { key: 'inputDate', label: '录入日期' }, Object.assign({ key: 'status', label: '审核' }, badge({ '待审核': A, '已通过': G, '已驳回': R })), ACT
      ],
      stats: (d) => [{ k: '录入数', v: d.length }, { k: '待审核', v: d.filter(r => r.status === '待审核').length }, { k: '已通过', v: d.filter(r => r.status === '已通过').length }, { k: '已驳回', v: d.filter(r => r.status === '已驳回').length }],
      data: () => opOrderInput
    },
    'op-order-track': {
      title: '订单跟踪', desc: '跟踪订单从录入、拍摄到交付的全流程状态与里程碑。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索订单 / 客户' }, { type: 'select', field: 'stage', label: '阶段', options: ['全部', '待拍摄', '拍摄中', '交付中', '已完成'] }],
      columns: [
        { key: 'id', label: '订单号' }, { key: 'customer', label: '客户' }, Object.assign({ key: 'stage', label: '阶段' }, badge({ '待拍摄': Y, '拍摄中': A, '交付中': C, '已完成': G })),
        { key: 'progress', label: '进度', type: 'progress' }, { key: 'due', label: '预计完成' }, ACT
      ],
      stats: (d) => [{ k: '跟踪订单', v: d.length }, { k: '待拍摄', v: d.filter(r => r.stage === '待拍摄').length }, { k: '拍摄中', v: d.filter(r => r.stage === '拍摄中').length }, { k: '已完成', v: d.filter(r => r.stage === '已完成').length }],
      data: () => opOrderTrack
    },
    'op-dashboard': {
      title: '业务看板', desc: '实时展示接单量、拍摄量、交付及时率与营收核心指标。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索月份' }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'orders', label: '接单量', type: 'num' }, { key: 'shoots', label: '拍摄量', type: 'num' },
        { key: 'onTime', label: '及时率(%)', type: 'num' }, { key: 'revenue', label: '营收', type: 'money' }, ACT
      ],
      stats: (d) => [{ k: '总接单', v: fmtInt(sum(d, 'orders')) }, { k: '总拍摄', v: fmtInt(sum(d, 'shoots')) }, { k: '平均及时率', v: Math.round(d.reduce((s, r) => s + r.onTime, 0) / d.length) + '%' }, { k: '总营收', v: fmtMoney(sum(d, 'revenue')) }],
      data: () => opDash
    },
    'op-analysis': {
      title: '经营分析', desc: '按客户 / 品类 / 月份分析营收结构与产能，辅助经营决策。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索客户 / 月份' }],
      columns: [
        { key: 'month', label: '月份' }, { key: 'customer', label: '客户' }, { key: 'orders', label: '接单量', type: 'num' }, { key: 'revenue', label: '营收', type: 'money' },
        { key: 'cost', label: '成本', type: 'money' }, { key: 'gross', label: '毛利', type: 'money' },
        Object.assign({ key: 'margin', label: '毛利率(%)', type: 'num' }, badge({})), ACT
      ],
      stats: (d) => [{ k: '总营收', v: fmtMoney(sum(d, 'revenue')) }, { k: '总成本', v: fmtMoney(sum(d, 'cost')) }, { k: '总毛利', v: fmtMoney(sum(d, 'gross')) }, { k: '平均毛利率', v: Math.round(d.reduce((s, r) => s + r.margin, 0) / d.length) + '%' }],
      data: () => opAnalysis
    },

    // ---------- 采购部 ----------
    'pc-detail': {
      title: '采购明细', desc: '查看采购订单明细，跟踪物料到货状态与金额，支持按供应商、商品、到货状态筛选与导出。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索采购单 / 供应商 / 商品' }, { type: 'select', field: 'status', label: '到货状态', options: ['全部', '已到货', '部分到货', '未到货', '已取消'] }],
      columns: [
        { key: 'id', label: '采购单号' }, { key: 'supplier', label: '供应商' }, { key: 'item', label: '商品' }, { key: 'category', label: '类别' },
        { key: 'qty', label: '数量', type: 'num' }, { key: 'price', label: '单价', type: 'money' }, { key: 'amount', label: '金额', type: 'money' },
        { key: 'orderDate', label: '下单日期' }, { key: 'arriveDate', label: '到货日期' },
        Object.assign({ key: 'status', label: '状态' }, badge({ '已到货': G, '部分到货': A, '未到货': B, '已取消': Y })), ACT
      ],
      stats: (d) => [{ k: '采购单数', v: d.length }, { k: '已到货', v: d.filter(r => r.status === '已到货').length }, { k: '未到货', v: d.filter(r => r.status === '未到货').length }, { k: '采购总额', v: fmtMoney(sum(d, 'amount')) }],
      data: () => pcDetail
    },
    'pc-input': {
      title: '采购录入', desc: '录入新采购需求，关联供应商与商品，提交审核后生成采购单并推送仓库。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索录入单 / 供应商 / 商品' }, { type: 'select', field: 'status', label: '审核状态', options: ['全部', '待审核', '已通过', '已驳回', '已下单'] }],
      columns: [
        { key: 'id', label: '录入单号' }, { key: 'supplier', label: '供应商' }, { key: 'item', label: '商品' }, { key: 'category', label: '类别' },
        { key: 'qty', label: '数量', type: 'num' }, { key: 'estAmount', label: '预估金额', type: 'money' }, { key: 'applicant', label: '申请人' },
        { key: 'inputDate', label: '录入日期' }, Object.assign({ key: 'status', label: '状态' }, badge({ '待审核': A, '已通过': B, '已驳回': R, '已下单': G })), ACT
      ],
      stats: (d) => [{ k: '录入单数', v: d.length }, { k: '待审核', v: d.filter(r => r.status === '待审核').length }, { k: '已通过', v: d.filter(r => r.status === '已通过').length }, { k: '已下单', v: d.filter(r => r.status === '已下单').length }, { k: '预估总额', v: fmtMoney(sum(d, 'estAmount')) }],
      data: () => pcInput
    },
    'pc-supplier': {
      title: '供应商管理', desc: '维护供应商档案、联系人、合作类别与评级，支撑采购寻源、比价与对账。',
      filters: [{ type: 'search', key: 'kw', placeholder: '搜索供应商编号 / 名称 / 联系人' }, { type: 'select', field: 'status', label: '合作状态', options: ['全部', '合作中', '潜在', '暂停'] }],
      columns: [
        { key: 'id', label: '供应商编号' }, { key: 'name', label: '供应商名称' }, { key: 'contact', label: '联系人' }, { key: 'phone', label: '联系电话' },
        Object.assign({ key: 'category', label: '类别' }, badge({ '服装': B, '道具': C, '包装': O, '器材': P, '面料': A, '辅料': Y })),
        Object.assign({ key: 'rating', label: '评级' }, badge({ 'A': G, 'B': A, 'C': Y })), { key: 'totalPurchase', label: '累计采购', type: 'money' },
        Object.assign({ key: 'status', label: '合作' }, badge({ '合作中': G, '潜在': A, '暂停': R })), ACT
      ],
      stats: (d) => [{ k: '供应商数', v: d.length }, { k: '合作中', v: d.filter(r => r.status === '合作中').length }, { k: '潜在', v: d.filter(r => r.status === '潜在').length }, { k: '累计采购额', v: fmtMoney(sum(d, 'totalPurchase')) }],
      data: () => pcSupplier
    }
  };
})();
