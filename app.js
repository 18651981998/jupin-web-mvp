/*
 * 聚品服饰 · 样版管理系统（网页版 MVP）
 * 应用逻辑：查询 / 列表 / 汇总 / 排序 / CSV 导出
 * ---------------------------------------------------------------
 * 对应原 VBA 系统 UserForm9 的核心能力：
 *   - 客户 / 摄影师 / 状态 多条件模糊查询
 *   - 入库日期区间过滤
 *   - 列表展示 + 表头排序
 *   - 汇总统计（入库量 / 退版量 / 拍摄费 / 结账额 / 累计欠款）
 *   - CSV 导出（明细）
 */

(function () {
  'use strict';

  const state = {
    data: window.JP_DATA || [],
    filters: { customer: '', photographer: '', status: '', dateFrom: '', dateTo: '' },
    sort: { key: 'id', dir: 'asc' }
  };

  const $ = (sel) => document.querySelector(sel);
  const fmtMoney = (n) =>
    '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 列定义（key 对应数据字段；sortable 是否可排序；num 是否数字列）
  const COLUMNS = [
    { key: 'id', label: '样版编号', sortable: true },
    { key: 'customer', label: '客户', sortable: true },
    { key: 'photographer', label: '摄影师', sortable: true },
    { key: 'category', label: '类别', sortable: true },
    { key: 'season', label: '季节', sortable: true },
    { key: 'status', label: '状态', sortable: true },
    { key: 'inboundDate', label: '入库日期', sortable: true },
    { key: 'returnDate', label: '退版日期', sortable: true },
    { key: 'shootFee', label: '拍摄费', sortable: true, num: true },
    { key: 'settleAmount', label: '结账额', sortable: true, num: true },
    { key: 'debt', label: '欠款', sortable: true, num: true }
  ];

  // 初始化下拉选项
  function initSelects() {
    const statusSel = $('#f-status');
    window.JP_META.STATUSES.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      statusSel.appendChild(opt);
    });
    const custSel = $('#f-customer');
    window.JP_META.CUSTOMERS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      custSel.appendChild(opt);
    });
    const phSel = $('#f-photographer');
    window.JP_META.PHOTOGRAPHERS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      phSel.appendChild(opt);
    });
  }

  // 应用筛选条件
  function applyFilters() {
    const f = state.filters;
    const cust = f.customer.trim().toLowerCase();
    const phot = f.photographer.trim().toLowerCase();
    return state.data.filter((r) => {
      if (cust && !r.customer.toLowerCase().includes(cust)) return false;
      if (phot && !r.photographer.toLowerCase().includes(phot)) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.dateFrom && r.inboundDate < f.dateFrom) return false;
      if (f.dateTo && r.inboundDate > f.dateTo) return false;
      return true;
    });
  }

  // 排序
  function applySort(rows) {
    const { key, dir } = state.sort;
    const mul = dir === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => {
      let av = a[key], bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      av = (av || '').toString();
      bv = (bv || '').toString();
      return av.localeCompare(bv, 'zh-CN') * mul;
    });
  }

  // 汇总统计
  function renderSummary(rows) {
    const sum = (k) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const inbound = rows.length;
    const returned = rows.filter((r) => r.status === '已退版').length;
    const shoot = sum('shootFee');
    const settle = sum('settleAmount');
    const debt = sum('debt');

    $('#stat-inbound').textContent = inbound;
    $('#stat-return').textContent = returned;
    $('#stat-shoot').textContent = fmtMoney(shoot);
    $('#stat-settle').textContent = fmtMoney(settle);
    $('#stat-debt').textContent = fmtMoney(debt);
  }

  // 渲染表头
  function renderHead() {
    const tr = $('#head-row');
    tr.innerHTML = '';
    COLUMNS.forEach((c) => {
      const th = document.createElement('th');
      th.textContent = c.label;
      if (state.sort.key === c.key) {
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = state.sort.dir === 'asc' ? '▲' : '▼';
        th.appendChild(arrow);
      }
      if (c.sortable) {
        th.addEventListener('click', () => onSort(c.key));
      }
      tr.appendChild(th);
    });
  }

  // 渲染表体
  function renderBody(rows) {
    const tb = $('#tbody');
    tb.innerHTML = '';
    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = COLUMNS.length;
      td.className = 'empty';
      td.textContent = '没有符合条件的样版记录';
      tr.appendChild(td); tb.appendChild(tr);
      return;
    }
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      COLUMNS.forEach((c) => {
        const td = document.createElement('td');
        let v = r[c.key];
        if (c.num) {
          td.className = 'num';
          v = c.key === 'debt' && Number(r[c.key]) === 0
            ? '0.00'
            : Number(r[c.key]).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        if (c.key === 'status') {
          const span = document.createElement('span');
          span.className = 'tag ' + v;
          span.textContent = v;
          td.appendChild(span);
        } else {
          td.textContent = v === '' ? '—' : v;
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  }

  // 排序切换
  function onSort(key) {
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sort.key = key;
      state.sort.dir = 'asc';
    }
    render();
  }

  // 主渲染
  function render() {
    let rows = applyFilters();
    renderSummary(rows);
    rows = applySort(rows);
    renderHead();
    renderBody(rows);
    $('#count').innerHTML = '共 <b>' + rows.length + '</b> 条记录（总库 ' + state.data.length + ' 条）';
  }

  // CSV 导出（带 BOM，避免中文乱码）
  function exportCSV() {
    const rows = applySort(applyFilters());
    if (rows.length === 0) { alert('当前没有可导出的数据'); return; }
    const headers = COLUMNS.map((c) => c.label);
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const line = COLUMNS.map((c) => {
        let v = r[c.key];
        if (c.num) v = Number(r[c.key]).toFixed(2);
        v = (v === '' || v == null) ? '' : String(v);
        // 转义：含逗号/引号/换行的用引号包裹
        if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
        return v;
      });
      lines.push(line.join(','));
    });
    const csv = '﻿' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = '样版明细_' + ts + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 事件绑定
  function bind() {
    $('#f-customer').addEventListener('change', (e) => { state.filters.customer = e.target.value; render(); });
    $('#f-photographer').addEventListener('change', (e) => { state.filters.photographer = e.target.value; render(); });
    $('#f-status').addEventListener('change', (e) => { state.filters.status = e.target.value; render(); });
    $('#f-dateFrom').addEventListener('change', (e) => { state.filters.dateFrom = e.target.value; render(); });
    $('#f-dateTo').addEventListener('change', (e) => { state.filters.dateTo = e.target.value; render(); });
    $('#btn-reset').addEventListener('click', () => {
      state.filters = { customer: '', photographer: '', status: '', dateFrom: '', dateTo: '' };
      ['#f-customer', '#f-photographer', '#f-status', '#f-dateFrom', '#f-dateTo']
        .forEach((s) => { $(s).value = ''; });
      render();
    });
    $('#btn-export').addEventListener('click', exportCSV);
  }

  // 启动
  document.addEventListener('DOMContentLoaded', () => {
    initSelects();
    bind();
    render();
  });
})();
