/*
 * 聚品服饰 · 样版管理系统（网页版 MVP）
 * 摄影部「样版查询 / 交付」功能模块（对应原 VBA 系统 UserForm9）
 * ---------------------------------------------------------------
 * 以可挂载组件形式提供：window.JP_SampleQuery.mount(container)
 * 由门户 portal.js 在路由到 #/func/ph-sample-query 时调用。
 * 能力：客户/摄影师/状态多条件模糊查询、入库日期区间、列表+表头排序、
 *      汇总统计（入库量/退版量/拍摄费/结账额/累计欠款）、CSV 导出。
 */

window.JP_SampleQuery = (function () {
  'use strict';

  const state = {
    data: [],
    filters: { customer: '', photographer: '', status: '', dateFrom: '', dateTo: '' },
    sort: { key: 'id', dir: 'asc' }
  };

  const fmtMoney = (n) =>
    '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const TPL = `
    <div class="panel">
      <div class="filters">
        <div class="field">
          <label>客户</label>
          <select id="f-customer"><option value="">全部客户</option></select>
        </div>
        <div class="field">
          <label>摄影师</label>
          <select id="f-photographer"><option value="">全部摄影师</option></select>
        </div>
        <div class="field">
          <label>状态</label>
          <select id="f-status"><option value="">全部状态</option></select>
        </div>
        <div class="field">
          <label>入库日期起</label>
          <input type="date" id="f-dateFrom" />
        </div>
        <div class="field">
          <label>入库日期止</label>
          <input type="date" id="f-dateTo" />
        </div>
        <button class="btn" id="btn-reset">重置</button>
      </div>
    </div>

    <section class="summary">
      <div class="stat"><div class="k">入库量</div><div class="v" id="stat-inbound">0</div></div>
      <div class="stat"><div class="k">退版量</div><div class="v" id="stat-return">0</div></div>
      <div class="stat"><div class="k">拍摄费合计</div><div class="v money" id="stat-shoot">¥0.00</div></div>
      <div class="stat"><div class="k">结账额合计</div><div class="v money" id="stat-settle">¥0.00</div></div>
      <div class="stat"><div class="k">累计欠款</div><div class="v warn" id="stat-debt">¥0.00</div></div>
    </section>

    <div class="toolbar">
      <div class="count" id="count"></div>
      <button class="btn primary" id="btn-export">导出 CSV</button>
    </div>

    <div class="table-scroll">
      <table>
        <thead><tr id="head-row"></tr></thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
  `;

  function $(sel, root) { return (root || document).querySelector(sel); }

  function initSelects(root) {
    const m = window.JP_META;
    const fill = (sel, arr) => arr.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      $(sel, root).appendChild(opt);
    });
    fill('#f-status', m.STATUSES);
    fill('#f-customer', m.CUSTOMERS);
    fill('#f-photographer', m.PHOTOGRAPHERS);
  }

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

  function renderSummary(rows, root) {
    const sum = (k) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    $('#stat-inbound', root).textContent = rows.length;
    $('#stat-return', root).textContent = rows.filter((r) => r.status === '已退版').length;
    $('#stat-shoot', root).textContent = fmtMoney(sum('shootFee'));
    $('#stat-settle', root).textContent = fmtMoney(sum('settleAmount'));
    $('#stat-debt', root).textContent = fmtMoney(sum('debt'));
  }

  function renderHead(root) {
    const tr = $('#head-row', root);
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
      if (c.sortable) th.addEventListener('click', () => onSort(c.key, root));
      tr.appendChild(th);
    });
  }

  function renderBody(rows, root) {
    const tb = $('#tbody', root);
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

  function onSort(key, root) {
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sort.key = key;
      state.sort.dir = 'asc';
    }
    renderAll(root);
  }

  function renderAll(root) {
    let rows = applyFilters();
    renderSummary(rows, root);
    rows = applySort(rows);
    renderHead(root);
    renderBody(rows, root);
    $('#count', root).innerHTML = '共 <b>' + rows.length + '</b> 条记录（总库 ' + state.data.length + ' 条）';
  }

  function exportCSV(root) {
    const rows = applySort(applyFilters());
    if (rows.length === 0) { alert('当前没有可导出的数据'); return; }
    const headers = COLUMNS.map((c) => c.label);
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const line = COLUMNS.map((c) => {
        let v = r[c.key];
        if (c.num) v = Number(r[c.key]).toFixed(2);
        v = (v === '' || v == null) ? '' : String(v);
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

  function bind(root) {
    $('#f-customer', root).addEventListener('change', (e) => { state.filters.customer = e.target.value; renderAll(root); });
    $('#f-photographer', root).addEventListener('change', (e) => { state.filters.photographer = e.target.value; renderAll(root); });
    $('#f-status', root).addEventListener('change', (e) => { state.filters.status = e.target.value; renderAll(root); });
    $('#f-dateFrom', root).addEventListener('change', (e) => { state.filters.dateFrom = e.target.value; renderAll(root); });
    $('#f-dateTo', root).addEventListener('change', (e) => { state.filters.dateTo = e.target.value; renderAll(root); });
    $('#btn-reset', root).addEventListener('click', () => {
      state.filters = { customer: '', photographer: '', status: '', dateFrom: '', dateTo: '' };
      ['#f-customer', '#f-photographer', '#f-status', '#f-dateFrom', '#f-dateTo']
        .forEach((s) => { $(s, root).value = ''; });
      renderAll(root);
    });
    $('#btn-export', root).addEventListener('click', () => exportCSV(root));
  }

  function mount(container) {
    state.data = window.JP_DATA || [];
    container.innerHTML = TPL;
    initSelects(container);
    bind(container);
    renderAll(container);
  }

  return { mount };
})();
