/*
 * 聚品服饰 · 样版管理系统（网页版 MVP）
 * 模拟数据层
 * ---------------------------------------------------------------
 * 说明：MVP 阶段用本地生成的"模拟样版数据"替代原 VBA 系统中的
 *      Access 数据库（数据存储.accdb）。数据结构尽量贴近原系统
 *      业务字段，方便后续平滑替换为 Supabase / Postgres 真实接口。
 */

// 客户（服装品牌 / 厂商）
const JP_CUSTOMERS = [
  '优衣库', 'ZARA', '海澜之家', '森马', '太平鸟', '安踏', '李宁',
  '波司登', 'GAP', 'ONLY', 'VERO MODA', '美特斯邦威', '真维斯',
  '以纯', '柒牌', '七匹狼', '劲霸', '鸿星尔克', '特步', '361°'
];

// 摄影师（原系统按摄影师结算拍摄费）
const JP_PHOTOGRAPHERS = [
  '张伟', '李娜', '王芳', '刘强', '陈静', '杨洋',
  '赵磊', '孙丽', '周杰', '吴敏', '郑凯', '黄蓉'
];

// 样版类别
const JP_CATEGORIES = [
  '男装', '女装', '童装', '羽绒服', 'T恤', '衬衫',
  '裤装', '裙装', '外套', '针织'
];

// 季节 / 波段
const JP_SEASONS = ['2027春夏', '2026春夏', '2026秋冬', '2025春夏', '2025秋冬'];

// 样版状态（生命周期）
const JP_STATUSES = [
  '待入库', '已入库', '已分配', '拍摄中', '已交付', '已退版', '已结账'
];

// 可复现伪随机（同种子每次生成一致，便于演示/测试）
function jpRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// 生成模拟样版数据集
function generateSamples(count = 320) {
  const rnd = jpRand(20260713);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const data = [];
  const base = new Date(2025, 0, 1).getTime(); // 2025-01-01

  for (let i = 0; i < count; i++) {
    const customer = pick(JP_CUSTOMERS);
    const photographer = pick(JP_PHOTOGRAPHERS);
    const category = pick(JP_CATEGORIES);
    const season = pick(JP_SEASONS);

    // 入库日期：2025-01 起约 540 天内
    const inboundOffset = Math.floor(rnd() * 540);
    const inboundDate = new Date(base + inboundOffset * 86400000);

    const status = pick(JP_STATUSES);

    // 退版日期：仅"已退版 / 已结账"状态有
    let returnDate = '';
    if (status === '已退版' || status === '已结账') {
      const retOffset = inboundOffset + 20 + Math.floor(rnd() * 80);
      returnDate = new Date(base + retOffset * 86400000)
        .toISOString()
        .slice(0, 10);
    }

    // 费用：拍摄费 -> 结账额（部分）-> 欠款（差额）
    const shootFee = Math.round((200 + rnd() * 2800) * 100) / 100;
    const settleAmount = Math.round(shootFee * (0.6 + rnd() * 0.35) * 100) / 100;
    const debt = Math.round((shootFee - settleAmount) * 100) / 100;

    data.push({
      id: 'YP' + (2026000 + i + 1),
      customer,
      photographer,
      category,
      season,
      status,
      inboundDate: inboundDate.toISOString().slice(0, 10),
      returnDate,
      shootFee,
      settleAmount,
      debt
    });
  }
  return data;
}

// 暴露到全局，供 app.js 使用
window.JP_DATA = generateSamples();
window.JP_META = {
  CUSTOMERS: JP_CUSTOMERS,
  PHOTOGRAPHERS: JP_PHOTOGRAPHERS,
  CATEGORIES: JP_CATEGORIES,
  SEASONS: JP_SEASONS,
  STATUSES: JP_STATUSES
};

