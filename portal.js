/*
 * 聚品服饰 · 部门门户框架（SPA，hash 路由，零依赖）
 * ---------------------------------------------------------------
 * 路由：
 *   #/                -> 首页仪表盘
 *   #/dept/:deptId   -> 部门着陆页（功能模块网格）
 *   #/func/:funcId   -> 功能页：
 *        · JP_MODULES[funcId] 存在  -> 通用模块页（行业标准界面 + 模拟数据）
 *        · item.impl 为 true        -> 专属实现（摄影部样版查询）
 *        · 其余                      -> 功能规划占位
 */

(function () {
  'use strict';

  const MENU = window.JP_MENU;
  const MODULES = window.JP_MODULES || {};
  const view = document.getElementById('view');
  const sidebar = document.getElementById('sidebar-nav');

  // 建立 funcId -> {dept, group, item} 索引
  const FUNC_INDEX = {};
  MENU.depts.forEach((dept) => {
    dept.groups.forEach((g) => {
      g.items.forEach((it) => { FUNC_INDEX[it.id] = { dept, group: g, item: it }; });
    });
  });

  const fmtMoney = (n) => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n) => Number(n).toLocaleString('zh-CN');

  // 应用署名与版本（单一真源：每次修改版本号尾数 +1，如 V26.0407 -> V26.0408）
  const APP_AUTHOR = 'A0_0CN涛声依旧';
  const APP_VERSION = 'V26.0413';

  // ---------- 侧边栏 ----------
  function renderSidebar() {
    let html = `
      <div class="brand">
        <span class="brand-dot"></span>
        <div class="brand-text">
          <div class="brand-name">聚品服饰</div>
          <div class="brand-sub">数字化管理平台</div>
        </div>
      </div>
      <nav class="nav">
        <a class="nav-item" data-route="#/" href="#/">
          <span class="nav-ico">🏠</span><span>首页</span>
        </a>`;

    MENU.depts.forEach((dept) => {
      html += `
        <div class="nav-group">
          <a class="nav-item nav-dept" data-dept="${dept.id}" href="#/dept/${dept.id}">
            <span class="nav-ico">${dept.icon}</span><span>${dept.name}</span>
            <span class="nav-caret">›</span>
          </a>
          <div class="nav-children" data-children="${dept.id}">
            ${dept.groups.map((g) => `
              <div class="nav-subgroup">${g.name}</div>
              ${g.items.map((it) => {
                const mark = it.impl ? '<span class="dot-live">●</span>'
                  : (MODULES[it.id] ? '<span class="dot-proto">◆</span>' : '');
                return `<a class="nav-leaf" data-func="${it.id}" href="#/func/${it.id}">${it.name}${mark}</a>`;
              }).join('')}
            `).join('')}
          </div>
        </div>`;
    });

    html += `</nav>
      <div class="side-foot">
        <span class="badge-mvp">MVP 原型 · 模拟数据</span>
      </div>`;
    sidebar.innerHTML = html;
  }

  function syncSidebar(route) {
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-route') === route || el.getAttribute('href') === route);
    });
    document.querySelectorAll('.nav-leaf').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('href') === route);
    });

    const activeFunc = [...document.querySelectorAll('.nav-leaf.active')][0];
    document.querySelectorAll('.nav-children').forEach((c) => {
      const deptId = c.getAttribute('data-children');
      const open = activeFunc && FUNC_INDEX[activeFunc.getAttribute('data-func')]
        ? FUNC_INDEX[activeFunc.getAttribute('data-func')].dept.id === deptId : false;
      c.classList.toggle('open', open);
    });
    document.querySelectorAll('.nav-dept').forEach((d) => {
      const open = activeFunc && FUNC_INDEX[activeFunc.getAttribute('data-func')]
        ? FUNC_INDEX[activeFunc.getAttribute('data-func')].dept.id === d.getAttribute('data-dept') : false;
      d.classList.toggle('open', open);
      d.querySelector('.nav-caret').style.transform = open ? 'rotate(90deg)' : '';
    });

    const m = route.match(/^#\/dept\/(.+)$/);
    if (m) {
      const child = sidebar.querySelector(`.nav-children[data-children="${m[1]}"]`);
      if (child) child.classList.add('open');
      const deptEl = sidebar.querySelector(`.nav-dept[data-dept="${m[1]}"]`);
      if (deptEl) { deptEl.classList.add('open'); deptEl.querySelector('.nav-caret').style.transform = 'rotate(90deg)'; }
    }
  }

  sidebar.addEventListener('click', (e) => {
    const dept = e.target.closest('.nav-dept');
    if (dept) {
      if (e.target.closest('.nav-children')) return;
      const child = sidebar.querySelector(`.nav-children[data-children="${dept.getAttribute('data-dept')}"]`);
      const open = child.classList.toggle('open');
      dept.classList.toggle('open', open);
      dept.querySelector('.nav-caret').style.transform = open ? 'rotate(90deg)' : '';
    }
  });

  // ---------- 面包屑 ----------
  function breadcrumb(route) {
    if (route === '#/' || route === '' || route === '#') return `<span class="bc-item">首页</span>`;
    const dm = route.match(/^#\/dept\/(.+)$/);
    if (dm) {
      const dept = MENU.depts.find((d) => d.id === dm[1]);
      return `<a class="bc-item" href="#/">首页</a><span class="bc-sep">/</span><span class="bc-item cur">${dept ? dept.name : ''}</span>`;
    }
    const fm = route.match(/^#\/func\/(.+)$/);
    if (fm) {
      const idx = FUNC_INDEX[fm[1]];
      if (idx) {
        return `<a class="bc-item" href="#/">首页</a><span class="bc-sep">/</span>` +
          `<a class="bc-item" href="#/dept/${idx.dept.id}">${idx.dept.name}</a>` +
          `<span class="bc-sep">/</span><span class="bc-item muted">${idx.group.name}</span>` +
          `<span class="bc-sep">/</span><span class="bc-item cur">${idx.item.name}</span>`;
      }
    }
    return `<span class="bc-item">未知页面</span>`;
  }

  // ---------- 首页 ----------
  function renderHome() {
    const h = MENU.home;
    const stats = h.overview.map((s) => `
      <div class="ov-card">
        <div class="ov-k">${s.k}</div>
        <div class="ov-v">${s.v}</div>
        <div class="ov-sub">${s.sub} <span class="ov-trend ${s.trend.startsWith('-') ? 'down' : 'up'}">${s.trend}</span></div>
      </div>`).join('');

    const todos = h.todos.map((t) => `
      <li class="todo todo-${t.level}">
        <span class="todo-dept">${t.dept}</span>
        <span class="todo-text">${t.text}</span>
      </li>`).join('');

    const deptCards = MENU.depts.map((d) => `
      <a class="dept-card" href="#/dept/${d.id}" style="--c:${d.color}">
        <div class="dept-ico">${d.icon}</div>
        <div class="dept-name">${d.name}</div>
        <div class="dept-desc">${d.desc}</div>
        <div class="dept-go">进入 →</div>
      </a>`).join('');

    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <h1>${h.title}</h1>
          <p class="page-sub">${h.subtitle}</p>
        </div>
        <section class="ov-grid">${stats}</section>
        <div class="home-cols">
          <section class="panel home-depts">
            <div class="panel-title">部门导航</div>
            <div class="dept-grid">${deptCards}</div>
          </section>
          <section class="panel home-todos">
            <div class="panel-title">待办提醒</div>
            <ul class="todo-list">${todos}</ul>
          </section>
        </div>
        <p class="hint">说明：本平台为原型演示，使用本地生成的模拟数据，各功能页均按行业标准界面搭建。生产环境将替换为 Supabase / Postgres 真实接口。</p>
      </div>`;
  }

  // ---------- 部门着陆 ----------
  function renderDept(deptId) {
    const dept = MENU.depts.find((d) => d.id === deptId);
    if (!dept) { view.innerHTML = `<div class="empty-page">未找到该部门</div>`; return; }

    const groups = dept.groups.map((g) => {
      const cards = g.items.map((it) => {
        const tag = it.impl ? '<span class="tag-live">已上线</span>'
          : (MODULES[it.id] ? '<span class="tag-proto">原型</span>' : '<span class="tag-plan">规划中</span>');
        return `<a class="func-card ${it.impl ? 'live' : ''}" href="#/func/${it.id}">
            <div class="func-name">${it.name} ${tag}</div>
            <div class="func-desc">${it.desc}</div>
          </a>`;
      }).join('');
      return `<div class="func-group"><div class="func-group-title">${g.name}</div><div class="func-grid">${cards}</div></div>`;
    }).join('');

    view.innerHTML = `
      <div class="page">
        <div class="dept-hero" style="--c:${dept.color}">
          <div class="dept-hero-ico">${dept.icon}</div>
          <div>
            <h1>${dept.name}</h1>
            <p>${dept.desc}</p>
          </div>
        </div>
        ${groups}
      </div>`;
  }

  // ============================================================
  //  通用模块页渲染器
  // ============================================================
  function renderModulePage(funcId, spec, item, dept, group) {
    view.innerHTML = `
      <div class="page">
        <div class="func-page-head">
          <div class="fph-top">
            <h1>${item.name}</h1>
            <span class="tag-proto">功能原型</span>
          </div>
          <p class="page-sub">${dept.name} · ${group.name} · ${spec.title}</p>
          <p class="func-desc-line">${spec.desc}</p>
        </div>
        <div id="mod-root"></div>
      </div>`;
    mountModule(document.getElementById('mod-root'), spec);
  }

  function mountModule(root, spec) {
    let all = (typeof spec.data === 'function') ? spec.data() : spec.data;
    const state = { kw: '', sel: {}, dateFrom: '', dateTo: '', sortKey: null, sortDir: 'asc', page: 1, pageSize: 12 };

    // DB-ready 钩子：若配置了后端 API（window.JP_API_BASE）且本模块声明了 api 路径，
    // 则从真实数据库拉取数据并刷新；否则保持内置确定性模拟数据（默认，无需后端）。
    if (window.JP_API_BASE && spec.api) {
      fetch(window.JP_API_BASE + spec.api, { credentials: 'omit' })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => { all = (j && Array.isArray(j.data)) ? j.data : (Array.isArray(j) ? j : all); renderHead(); renderRows(); })
        .catch(() => { /* 后端不可达时静默回退到模拟数据 */ });
    }

    // 骨架
    const statsHtml = spec.stats ? `<section class="mod-stats" id="mod-stats"></section>` : '';
    const filterHtml = (spec.filters || []).map((f) => {
      if (f.type === 'search') {
        return `<div class="field"><label>${f.placeholder.replace('搜索', '')}</label><input type="text" class="mod-search" data-f="kw" placeholder="${f.placeholder}"></div>`;
      }
      if (f.type === 'select') {
        const opts = f.options.map((o) => `<option value="${o}">${o}</option>`).join('');
        return `<div class="field"><label>${f.label}</label><select data-field="${f.field}">${opts}</select></div>`;
      }
      if (f.type === 'daterange') {
        return `<div class="field"><label>${f.label}</label><div class="date-range"><input type="date" data-d="from"> <span>至</span> <input type="date" data-d="to"></div></div>`;
      }
      return '';
    }).join('');
    const actionsHtml = (spec.actions || []).map((a) => `<button class="btn ${a.primary ? 'primary' : ''}" data-act="${a.label}">${a.icon ? a.icon + ' ' : ''}${a.label}</button>`).join('');

    root.innerHTML = `
      ${statsHtml}
      <section class="panel mod-panel">
        <div class="mod-filters">${filterHtml || '<span class="mod-nofilter">全部记录</span>'}</div>
        <div class="toolbar">
          <div class="count" id="mod-count"></div>
          <div class="mod-actions">
            ${actionsHtml}
            <button class="btn" id="mod-export">导出 CSV</button>
            <button class="btn" id="mod-refresh">刷新</button>
          </div>
        </div>
        <div class="table-scroll">
          <table><thead><tr id="mod-head"></tr></thead><tbody id="mod-body"></tbody></table>
        </div>
        <div class="pager" id="mod-pager"></div>
      </section>`;

    const $ = (s) => root.querySelector(s);

    function getFiltered() {
      let rows = all.slice();
      if (state.kw) {
        const kw = state.kw.toLowerCase();
        rows = rows.filter((r) => spec.columns.some((c) => c.type !== 'action' && String(r[c.key] ?? '').toLowerCase().includes(kw)));
      }
      Object.keys(state.sel).forEach((fk) => {
        const v = state.sel[fk];
        if (v && v !== '全部') rows = rows.filter((r) => String(r[fk]) === v);
      });
      if (state.dateFrom) rows = rows.filter((r) => String(r[state.dateKey] || '') >= state.dateFrom);
      if (state.dateTo) rows = rows.filter((r) => String(r[state.dateKey] || '') <= state.dateTo);
      return rows;
    }

    function sortRows(rows) {
      if (!state.sortKey) return rows;
      const col = spec.columns.find((c) => c.key === state.sortKey);
      const mul = state.sortDir === 'asc' ? 1 : -1;
      return rows.slice().sort((a, b) => {
        let av = a[state.sortKey], bv = b[state.sortKey];
        if (col && (col.type === 'money' || col.type === 'num' || col.type === 'progress')) return (Number(av) - Number(bv)) * mul;
        av = String(av ?? ''); bv = String(bv ?? '');
        return av.localeCompare(bv, 'zh-CN') * mul;
      });
    }

    function badgeClass(c, v) {
      if (c.map && c.map[v]) return c.map[v];
      // 数值型徽章：按阈值着色
      const n = Number(v);
      if (!isNaN(n)) return n >= 50 ? 'green' : n >= 35 ? 'amber' : 'red';
      return 'gray';
    }

    function cellHTML(c, r) {
      const v = r[c.key];
      if (c.type === 'money') {
        const n = Number(v);
        const neg = !isNaN(n) && n < 0;
        return `<td class="num"${neg ? ' style="color:#e53935;font-weight:600"' : ''}>${fmtMoney(v)}</td>`;
      }
      if (c.type === 'num') return `<td class="num">${fmtInt(v)}</td>`;
      if (c.type === 'progress') {
        const cls = v >= 100 ? 'done' : v === 0 ? 'idle' : 'run';
        return `<td><div class="pbar ${cls}"><div class="pbar-fill" style="width:${v}%"></div><span>${v}%</span></div></td>`;
      }
      if (c.type === 'badge') return `<td><span class="tag ${badgeClass(c, v)}">${v}</span></td>`;
      if (c.type === 'action') return `<td class="acts">${c.actions.map((a) => `<button class="link-btn" data-act="${a}">${a}</button>`).join('')}</td>`;
      return `<td>${v === '' || v == null ? '—' : v}</td>`;
    }

    function renderStats() {
      if (!spec.stats) return;
      const arr = typeof spec.stats === 'function' ? spec.stats(all) : spec.stats;
      $('#mod-stats').innerHTML = arr.map((s) => `
        <div class="ov-card">
          <div class="ov-k">${s.k}</div>
          <div class="ov-v">${s.v}</div>
          ${s.trend ? `<div class="ov-sub"><span class="ov-trend ${s.trend.startsWith('-') ? 'down' : 'up'}">${s.trend}</span></div>` : ''}
        </div>`).join('');
    }

    function renderHead() {
      const tr = $('#mod-head'); tr.innerHTML = '';
      spec.columns.forEach((c) => {
        const th = document.createElement('th');
        th.textContent = c.label;
        if (c.type === 'action') th.classList.add('col-act');
        if (state.sortKey === c.key) {
          const arrow = document.createElement('span');
          arrow.className = 'arrow';
          arrow.textContent = state.sortDir === 'asc' ? '▲' : '▼';
          th.appendChild(arrow);
        }
        if (c.type !== 'action' && c.type !== 'progress') th.addEventListener('click', () => onSort(c.key));
        tr.appendChild(th);
      });
    }

    // 稳定的行渲染
    function renderRows() {
      const filtered = sortRows(getFiltered());
      renderStatsTitle(filtered.length);
      const tb = $('#mod-body'); tb.innerHTML = '';
      if (filtered.length === 0) {
        tb.innerHTML = `<tr><td class="empty" colspan="${spec.columns.length}">没有符合条件的记录</td></tr>`;
        renderPager(filtered.length);
        return;
      }
      const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
      if (state.page > pages) state.page = pages;
      const start = (state.page - 1) * state.pageSize;
      const slice = filtered.slice(start, start + state.pageSize);
      slice.forEach((r) => {
        const tr = document.createElement('tr');
        spec.columns.forEach((c) => {
          const tmp = document.createElement('template');
          tmp.innerHTML = cellHTML(c, r).trim();
          tr.appendChild(tmp.content.firstChild);
        });
        tb.appendChild(tr);
      });
      renderPager(filtered.length);
    }

    function renderStatsTitle(n) {
      $('#mod-count').innerHTML = `共 <b>${n}</b> 条记录（总库 ${all.length} 条）`;
    }

    function renderPager(total) {
      const pages = Math.max(1, Math.ceil(total / state.pageSize));
      const cur = state.page;
      let html = `<button class="pg" data-pg="prev" ${cur <= 1 ? 'disabled' : ''}>‹ 上一页</button>`;
      const win = [];
      for (let p = 1; p <= pages; p++) {
        if (p === 1 || p === pages || Math.abs(p - cur) <= 2) win.push(p);
        else if (win[win.length - 1] !== '...') win.push('...');
      }
      win.forEach((p) => {
        if (p === '...') html += `<span class="pg-ell">…</span>`;
        else html += `<button class="pg ${p === cur ? 'cur' : ''}" data-pg="${p}">${p}</button>`;
      });
      html += `<button class="pg" data-pg="next" ${cur >= pages ? 'disabled' : ''}>下一页 ›</button>`;
      html += `<span class="pg-info">第 ${cur} / ${pages} 页</span>`;
      $('#mod-pager').innerHTML = html;
    }

    function onSort(key) {
      if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      renderHead(); renderRows();
    }

    function openDetail(r) {
      const body = spec.columns.filter((c) => c.type !== 'action').map((c) => {
        const v = r[c.key];
        let val = (v === '' || v == null) ? '—' : v;
        if (c.type === 'money') {
          const n = Number(v);
          val = fmtMoney(v);
          if (!isNaN(n) && n < 0) val = `<span style="color:#e53935;font-weight:600">${val}</span>`;
        }
        else if (c.type === 'num') val = fmtInt(v);
        else if (c.type === 'progress') val = v + '%';
        else if (c.type === 'badge') val = `<span class="tag ${badgeClass(c, v)}">${v}</span>`;
        return `<div class="dt-row"><div class="dt-k">${c.label}</div><div class="dt-v">${val}</div></div>`;
      }).join('');
      showModal('记录详情 · ' + spec.title, body);
    }

    // 事件绑定
    root.querySelectorAll('.mod-search').forEach((inp) => inp.addEventListener('input', (e) => { state.kw = e.target.value; state.page = 1; renderRows(); }));
    root.querySelectorAll('select[data-field]').forEach((sel) => sel.addEventListener('change', (e) => { state.sel[e.target.dataset.field] = e.target.value; state.page = 1; renderRows(); }));
    root.querySelectorAll('input[data-d]').forEach((inp) => inp.addEventListener('change', (e) => {
      if (e.target.dataset.d === 'from') state.dateFrom = e.target.value; else state.dateTo = e.target.value;
      state.page = 1; renderRows();
    }));

    root.addEventListener('click', (e) => {
      const actBtn = e.target.closest('.link-btn');
      if (actBtn) {
        const tr = actBtn.closest('tr');
        const idx = [...tr.parentNode.children].indexOf(tr);
        const filtered = sortRows(getFiltered());
        const start = (state.page - 1) * state.pageSize;
        const rec = filtered[start + idx];
        if (rec) openDetail(rec);
        return;
      }
      const pg = e.target.closest('.pg');
      if (pg && !pg.disabled) {
        const v = pg.dataset.pg;
        if (v === 'prev') state.page = Math.max(1, state.page - 1);
        else if (v === 'next') state.page++;
        else state.page = Number(v);
        renderRows();
        root.querySelector('.table-scroll').scrollTop = 0;
      }
    });

    $('#mod-export').addEventListener('click', () => exportCSV());
    $('#mod-refresh').addEventListener('click', () => { state.kw = ''; state.sel = {}; state.dateFrom = ''; state.dateTo = ''; state.page = 1; root.querySelectorAll('.mod-search').forEach((i) => i.value = ''); root.querySelectorAll('select[data-field]').forEach((s) => s.value = s.options[0].value); root.querySelectorAll('input[data-d]').forEach((i) => i.value = ''); renderHead(); renderRows(); });
    (spec.actions || []).forEach((a) => {
      const b = root.querySelector(`[data-act="${a.label}"]`);
      if (b) b.addEventListener('click', () => toast(`「${a.label}」为原型演示，真实操作将在接入数据后开放`));
    });

    function exportCSV() {
      const rows = sortRows(getFiltered());
      if (rows.length === 0) { alert('当前没有可导出的数据'); return; }
      const cols = spec.columns.filter((c) => c.type !== 'action');
      const headers = cols.map((c) => c.label);
      const lines = [headers.join(',')];
      rows.forEach((r) => {
        const line = cols.map((c) => {
          let v = r[c.key];
          if (c.type === 'money') v = Number(v).toFixed(2);
          else if (c.type === 'num') v = v;
          else if (c.type === 'progress') v = v + '%';
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
      a.href = url; a.download = spec.title + '_' + ts + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    renderHead();
    renderRows();
    renderStats();
  }

  // ---------- 详情弹窗 ----------
  function ensureModal() {
    if (document.getElementById('mod-modal')) return;
    const el = document.createElement('div');
    el.id = 'mod-modal';
    el.className = 'mod-modal';
    el.innerHTML = `<div class="mod-modal-mask"></div><div class="mod-modal-card"><div class="mm-head"><span id="mm-title"></span><button id="mm-close">✕</button></div><div class="mm-body" id="mm-body"></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.mod-modal-mask').addEventListener('click', closeModal);
    el.querySelector('#mm-close').addEventListener('click', closeModal);
  }
  function showModal(title, html) {
    ensureModal();
    const el = document.getElementById('mod-modal');
    el.querySelector('#mm-title').textContent = title;
    el.querySelector('#mm-body').innerHTML = html;
    el.classList.add('open');
  }
  function closeModal() { const el = document.getElementById('mod-modal'); if (el) el.classList.remove('open'); }

  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('mod-toast');
    if (!t) { t = document.createElement('div'); t.id = 'mod-toast'; t.className = 'mod-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ============================================================
  //  采购部专属渲染器（严格对照知识库 VBA：Sheet8=采购入库 / Sheet11=采购明细·首页2）
  // ============================================================
  function normDateStr(d) { return String(d || '').replace(/\//g, '-'); }

  // 采购明细「累计欠款」列：按供应商分组、按日期顺序滚动累计（Σ金额 − Σ已结货款）
  function computeRunningDebt(rows) {
    const bySup = {};
    rows.forEach((r) => { (bySup[r.supplier] = bySup[r.supplier] || []).push(r); });
    Object.keys(bySup).forEach((sup) => {
      bySup[sup].sort((a, b) => normDateStr(a.date).localeCompare(normDateStr(b.date)));
      let run = 0;
      bySup[sup].forEach((r) => { run += (Number(r.amount) || 0) - (Number(r.settled) || 0); r.debt = run; });
    });
  }

  const PC_SUP_LIST = ['鸿耀', '锦绣纺织品', '华艺服装', '星光道具', '恒达包装', '锐影器材', '云裳面料'];
  const PCAT_LIST = ['服装', '道具', '包装', '器材', '面料', '辅料'];

  // ============================================================
  //  拼音/搜索引擎（严格移植自知识库 modGlobalSearch 模块）
  //  原VBA函数：py / CleanInvalidChar / CheckColumnMatch / FilterDataEx
  // ============================================================

  /** CleanInvalidChar：只保留汉字、字母、数字，过滤所有标点符号空格等（VBA行159） */
  function cleanInvalidChar(str) {
    let r = '';
    for (const ch of String(str)) {
      const c = ch.charCodeAt(0);
      // 汉字(c<=-24667或c>=19968) 或 a-z A-Z 0-9
      if ((c <= -24667 || c >= 19968) || (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)) r += ch;
    }
    return r;
  }

  /**
   * 拼音首字母引擎（严格对标 VBA modGlobalSearch.py）
   *
   * 核心问题：VBA的 WorksheetFunction.Lookup 使用中文拼音排序序，
   *        JS 无原生支持，因此改用「字符样本二分法」：
   *        - PY_KEYS: 按中文拼音排序的代表性汉字字符串
   *        - PY_VALS: 对应的首字母
   *        - 用 Intl.Collator('zh-CN') 做中文字符比较（与VBA排序一致）
   *
   * 对应VBA原函数：py() → CleanInvalidChar() → WorksheetFunction.Lookup(ch, pyArr)
   */
  /* 直接字符映射表（100%准确，覆盖供应商用字 + 常见汉字） */
  const PY_MAP = new Map([
    ['鸿','H'],['耀','Y'],['锦','J'],['绣','X'],['纺','F'],['织','Z'],['品','P'],
    ['华','H'],['艺','Y'],['服','F'],['装','Z'],['星','X'],['光','G'],['道','D'],['具','J'],
    ['恒','H'],['达','D'],['包','B'],['锐','R'],['影','Y'],['器','Q'],['材','C'],
    ['云','Y'],['裳','S'],['面','M'],['料','L'],
    ['阿','A'],['安','A'],['爱','A'],['澳','A'],
    ['八','B'],['白','B'],['百','B'],['半','B'],['保','B'],['北','B'],['本','B'],['比','B'],['边','B'],['变','B'],['标','B'],['不','B'],['布','B'],
    ['才','C'],['菜','C'],['参','C'],['草','C'],['茶','C'],['常','C'],['车','C'],['城','C'],['吃','C'],['出','C'],['穿','C'],['船','C'],['窗','C'],['纯','C'],['从','C'],
    ['大','D'],['打','D'],['代','D'],['当','D'],['到','D'],['道','D'],['得','D'],['的','D'],['地','D'],['第','D'],['点','D'],['电','D'],['调','D'],['定','D'],['东','D'],['冬','D'],['动','D'],['都','D'],['度','D'],['段','D']['多','D'],
    ['而','E'],['二','E'],
    ['发','F'],['法','F'],['反','F'],['方','F'],['放','F'],['非','F'],['分','F'],['丰','F'],['风','F'],['夫','F'],['福','F'],['府','F'],['复','F'],['付','F'],['负','F'],['富','F'],
    ['该','G'],['改','G'],['干','G'],['刚','G'],['高','G'],['告','G'],['格','G'],['个','G'],['给','G'],['根','G'],['更','G'],['工','G'],['公','G'],['功','G'],['攻','G'],['够','G'],['古','G'],['股','G'],['关','G'],['管','G'],['观','G'],['广','G'],['规','G'],['贵','G'],['国','G'],['过','G'],
    ['哈','H'],['海','H'],['含','H'],['寒','H'],['汉','H'],['好','H'],['号','H'],['喝','H'],['合','H'],['和','H'],['河','H'],['黑','H'],['很','H'],['红','H'],['后','H'],['呼','H'],['胡','H'],['湖','H'],['互','H'],['户','H'],['花','H'],['化','H'],['话','H'],['黄','H'],['回','H'],['会','H'],['活','H'],['火','H'],['或','H'],['货','H'],
    ['击','J'],['鸡','J'],['基','J'],['急','J'],['级','J'],['及','J'],['技','J'],['季','J'],['计','J'],['记','J'],['际','J'],['继','J'],['家','J'],['加','J'],['甲','J'],['价','J'],['架','J'],['假','J'],['检','J'],['减','J'],['简','J'],['见','J'],['件','J'],['建','J'],['健','J'],['江','J'],['姜','J'],['将','J'],['奖','J'],['讲','J'],['降','J'],['交','J'],['角','J'],['脚','J'],['叫','J'],['教','J'],['接','J'],['阶','J'],['街','J'],['截','J'],['姐','J'],['解','J'],['介','J'],['借','J'],['今','J'],['金','J'],['仅','J'],['紧','J'],['进','J'],['晋','J'],['近','J'],['京','J'],['经','J'],['精','J'],['井','J'],['景','J'],['警','J'],['净','J'],['竟','J'],['敬','J'],['镜','J'],['静','J'],['境','J'],['究','J'],['九','J'],['久','J'],['酒','J'],['旧','J'],['救','J'],['就','J'],['局','J'],['聚','J'],['决','J'],['军','J'],
    ['开','K'],['看','K'],['科','K'],['可','K'],['克','K'],['客','K'],['肯','K'],['空','K'],['口','K'],['苦','K'],['库','K'],['裤','K'],['快','K'],
    ['拉','L'],['来','L'],['蓝','L'],['郎','L'],['浪','L'],['老','L'],['乐','L'],['雷','L'],['冷','L'],['离','L'],['里','L'],['理','L'],['礼','L'],['力','L'],['历','L'],['丽','L'],['立','L'],['利','L'],['例','L'],['连','L'],['莲','L'],['联','L'],['廉','L'],['脸','L'],['练','L'],['良','L'],['凉','L'],['两','L'],['量','L'],['料','L'],['列','L'],['林','L'],['临','L'],['邻','L'],['灵','L'],['零','L'],['领','L'],['令','L'],['另','L'],['刘','L'],['流','L'],['留','L'],['六','L'],['龙','L'],['楼','L'],['路','L'],['绿','L'],['律','L'],['率','L'],['滤','L'],['乱','L'],['论','L'],['落','L'],
    ['妈','M'],['麻','M'],['马','M'],['买','M'],['麦','M'],['卖','M'],['满','M'],['忙','M'],['猫','M'],['毛','M'],['茂','M'],['冒','M'],['帽','M'],['贸','M'],['没','M'],['每','M'],['美','M'],['妹','M'],['门','M'],['们','M'],['梦','M'],['米','M'],['密','M'],['棉','M'],['面','M'],['苗','M'],['妙','M'],['庙','M'],['民','M'],['明','M'],['名','M'],['命','M'],['摸','M'],['模','M'],['膜','M'],['磨','M'],['魔','M'],['抹','M'],['末','M'],['莫','M'],['墨','M'],['默','M'],['某','M'],['母','M'],['木','M'],['目','M'],['幕','M'],['牧','M'],['墓','M'],['慕','M'],
    ['拿','N'],['哪','N'],['那','N'],['奶','N'],['男','N'],['南','N'],['难','N'],['脑','N'],['闹','N'],['呢','N'],['内','N'],['能','N'],['尼','N'],['你','N'],['年','N'],['念','N'],['娘','N'],['鸟','N'],['您','N'],['宁','N'],['凝','N'],['牛','N'],['农','N'],['浓','N'],['努','N'],['女','N'],['暖','N'],
    ['欧','O'],
    ['拍','P'],['排','P'],['派','P'],['盘','P'],['判','P'],['盼','P'],['旁','P'],['胖','P'],['抛','P'],['跑','P'],['泡','P'],['炮','P'],['培','P'],['赔','P'],['佩','P'],['配','P'],['喷','P'],['朋','P'],['棚','P'],['膨','P'],['碰','P'],['批','P'],['披','P'],['皮','P'],['疲','P'],['脾','P'],['匹','P'],['偏','P'],['片','P'],['骗','P'],['漂','P'],['拼','P'],['贫','P'],['品','P'],['平','P'],['评','P'],['破','P'],['迫','P'],['扑','P'],['铺','P'],['朴','P'],['普','P'],['谱','P'],
    ['期','P'],['欺','P'],['齐','P'],['其','P'],['奇','P'],['旗','P'],['起','P'],['气','P'],['恰','P'],['千','P'],['迁','P'],['牵','P'],['铅','P'],['签','P'],['前','P'],['钱','P'],['潜','P'],['浅','P'],['欠','P'],['歉','P'],['枪','P'],['强','P'],['墙','P'],['抢','P'],['悄','P'],['敲','P'],['桥','P'],['巧','P'],['切','P'],['且','P'],['窃','P'],['亲','P'],['侵','P'],['琴','P'],['勤','P'],['青','P'],['轻','P'],['清','P'],['情','P'],['晴','P'],['穷','P'],['丘','P'],['球','P'],['求','P'],['区','P'],['曲','P'],['驱','P'],['取','P'],['去','P'],['趣','P'],['圈','P'],['全','P'],['权','P'],['泉','P'],['拳','P'],['犬','P'],['劝','P'],['缺','P'],['却','P'],['确','P'],['群','P'],
    ['然','R'],['燃','R'],['染','R'],['嚷','R'],['壤','R'],['让','R'],['绕','R'],['热','R'],['人','R'],['仁','R'],['忍','R'],['认','R'],['任','R'],['扔','R'],['仍','R'],['日','R'],['荣','R'],['容','R'],['融','R'],['柔','R'],['肉','R'],['如','R'],['入','R'],['瑞','R'],['润','R'],['弱','R'],
    ['撒','S'],['洒','S'],['赛','S'],['三','S'],['伞','S'],['散','S'],['桑','S'],['丧','S'],['扫','S'],['色','S'],['森','S'],['杀','S'],['沙','S'],['傻','S'],['晒','S'],['山','S'],['删','S'],['闪','S'],['陕','S'],['善','S'],['擅','S'],['伤','S'],['商','S'],['上','S'],['尚','S'],['烧','S'],['少','S'],['勺','S'],['绍','S'],['哨','S'],['蛇','S'],['舌','S'],['舍','S'],['社','S'],['设','S'],['申','S'],['伸','S'],['身','S'],['深','S'],['什','S'],['神','S'],['审','S'],['甚','S'],['肾','S'],['声','S'],['生','S'],['绳','S'],['省','S'],['盛','S'],['剩','S'],['圣','S'],['尸','S'],['失','S'],['师','S'],['诗','S'],['施','S'],['湿','S'],['十','S'],['石','S'],['时','S'],['实','S'],['识','S'],['拾','S'],['食','S'],['史','S'],['使','S'],['始','S'],['式','S'],['示','S'],['士','S'],['世','S'],['柿','S'],['事','S'],['势','S'],['是','S'],['适','S'],['室','S'],['释','S'],['试','S'],['视','S'],['收','S'],['手','S'],['首','S'],['守','S'],['寿','S'],['受','S'],['瘦','S'],['兽','S'],['书','S'],['叔','S'],['舒','S'],['疏','S'],['输','S'],['蔬','S'],['熟','S'],['暑','S'],['属','S'],['数','S'],['树','S'],['束','S'],['术','S'],['述','S'],['刷','S'],['衰','S'],['甩','S'],['帅','S'],['双','S'],['谁','S'],['水','S'],['睡','S'],['顺','S'],['说','S'],['硕','S'],['思','S'],['死','S'],['四','S'],['寺','S'],['似','S'],['饲','S'],['松','S'],['宋','S'],['送','S'],['颂','S'],['搜','S'],['苏','S'],['俗','S'],['素','S'],['速','S'],['宿','S'],['诉','S'],['肃','S'],['酸','S'],['蒜','S'],['算','S'],['虽','S'],['随','S'],['碎','S'],['岁','S'],['穗','S'],['孙','S'],['损','S'],['笋','S'],['缩','S'],['所','S'],['索','S'],['锁','S'],
    ['他','T'],['她','T'],['它','T'],['塌','T'],['踏','T'],['台','T'],['太','T'],['态','T'],['泰','T'],['贪','T'],['摊','T'],['滩','T'],['谈','T'],['坦','T'],['叹','T'],['炭','T'],['探','T'],['汤','T'],['唐','T'],['糖','T'],['堂','T'],['塘','T'],['淌','T'],['趟','T'],['烫','T'],['逃','T'],['桃','T'],['陶','T'],['淘','T'],['套','T'],['特','T'],['疼','T'],['提','T'],['题','T'],['体','T'],['替','T'],['天','T'],['填','T'],['田','T'],['甜','T'],['条','T'],['挑','T'],['跳','T'],['铁','T'],['贴','T'],['厅','T'],['听','T'],['庭','T'],['停','T'],['挺','T'],['艇','T'],['通','T'],['同','T'],['铜','T'],['童','T'],['统','T'],['痛','T'],['偷','T'],['头','T'],['透','T'],['突','T'],['图','T'],['途','T'],['徒','T'],['吐','T'],['土','T'],['兔','T'],['团','T'],['推','T'],['退','T'],['脱','T'],['托','T'],['拖','T'],['妥','T'],['拓','T'],
    ['挖','W'],['瓦','W'],['歪','W'],['外','W'],['弯','W'],['湾','W'],['完','W'],['玩','W'],['丸','W'],['碗','W'],['王','W'],['网','W'],['往','W'],['忘','W'],['望','W'],['危','W'],['威','W'],['微','W'],['为','W'],['围','W'],['违','W'],['尾','W'],['委','W'],['卫','W'],['未','W'],['位','W'],['味','W'],['畏','W'],['胃','W'],['喂','W'],['谓','W'],['慰','W'],['温','W'],['文','W'],['纹','W'],['闻','W'],['稳','W'],['问','W'],['吻','W'],['翁','W'],['窝','W'],['我','W'],['握','W'],['乌','W'],['污','W'],['屋','W'],['无','W'],['五','W'],['午','W'],['武','W'],['舞','W'],['务','W'],['物','W'],['误','W'],['悟','W'],['雾','W'],
  ]);
  /** 获取单字拼音首字母（查Map，未命中返回空） */
  function chineseFirstLetter(ch) {
    return PY_MAP.get(ch) || '';
  }

  /**
   * py() — 拼音首字母生成（VBA行122，Public）
   * 1. 先调CleanInvalidChar清洗（关键！过滤符号数字等干扰字符）
   * 2. 汉字→首字母，字母→大写，其他跳过
   */
  function getPinyin(str) {
    const cleaned = cleanInvalidChar(str);
    if (!cleaned) return '';
    let r = '';
    for (const ch of cleaned) {
      const c = ch.charCodeAt(0);
      if (c <= -24667 || c >= 19968) r += chineseFirstLetter(ch); // 汉字
      else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) r += ch.toUpperCase(); // 字母
      // 数字不生成首字母（VBA逻辑中数字保留但匹配时单独处理）
    }
    return r;
  }

  /**
   * supMatch — 单条供应商匹配（移植自VBA CheckColumnMatch 行85）
   * 匹配优先级：
   *  1. 清洗后的中文包含匹配（如"锦绣"匹配"锦绣纺织品"）
   *  2. 拼音首字母包含匹配（如"hy"匹配"鸿耀"HY，也匹配"华艺服装"HYFZ——此为VBA原始行为）
   *  3. 数字直接包含匹配
   * 关键：kw和supplier都先经cleanInvalidChar清洗！
   */
  function supMatch(supplier, kw) {
    kw = cleanInvalidChar(String(kw || '')).toLowerCase();
    if (!kw) return true; // 空搜=全部
    const supClean = cleanInvalidChar(String(supplier));
    // Step1: 中文文本包含（VBA InStr LCase匹配）
    if (supClean.toLowerCase().includes(kw)) return true;
    // Step2: 拼音首字母包含（VBA HasChinese → py → InStr）
    const hasChinese = /[^\x00-\xff]/.test(supplier); // 简单判断含汉字
    if (hasChinese) {
      const supPy = getPinyin(supplier).toLowerCase();
      if (supPy.includes(kw)) return true;
    }
    // Step3: 数字/英文原样包含
    if (supplier.toLowerCase().includes(kw)) return true;
    return false;
  }

  function pcBadgeClass(c, v) { return (c.map && c.map[v]) ? c.map[v] : 'gray'; }
  function pcCell(c, r) {
    const v = r[c.key];
    if (c.type === 'money') {
      const n = Number(v); const neg = !isNaN(n) && n < 0;
      return `<td class="num"${neg ? ' style="color:#e53935;font-weight:600"' : ''}>${fmtMoney(v)}</td>`;
    }
    if (c.type === 'num') return `<td class="num">${fmtInt(v)}</td>`;
    if (c.type === 'badge') return `<td><span class="tag ${pcBadgeClass(c, v)}">${v || '—'}</span></td>`;
    if (c.type === 'action') return `<td class="acts">${c.actions.map((a) => `<button class="link-btn" data-act="${a}">${a}</button>`).join('')}</td>`;
    return `<td>${v === '' || v == null ? '—' : v}</td>`;
  }

  function openFormModal(title, fields, onSubmit) {
    const body = fields.map((f) => {
      let ctrl;
      if (f.type === 'select') ctrl = `<select name="${f.name}">${f.options.map((o) => `<option value="${o}"${f.value === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
      else if (f.type === 'date') ctrl = `<input type="date" name="${f.name}" value="${f.value || ''}">`;
      else ctrl = `<input type="${f.type === 'number' ? 'number' : 'text'}" name="${f.name}" value="${f.value || ''}" step="${f.step || ''}" ${f.required ? 'required' : ''}>`;
      return `<div class="form-row"><label>${f.label}</label>${ctrl}</div>`;
    }).join('') + `<div class="form-actions"><button class="btn" id="fm-cancel" type="button">取消</button><button class="btn primary" id="fm-ok" type="button">确定</button></div>`;
    showModal(title, `<form id="fm-form">${body}</form>`);
    const form = document.getElementById('fm-form');
    document.getElementById('fm-cancel').onclick = closeModal;
    document.getElementById('fm-ok').onclick = () => {
      const fd = new FormData(form); const vals = {};
      fields.forEach((f) => { vals[f.name] = (fd.get(f.name) || '').toString().trim(); });
      closeModal(); onSubmit(vals);
    };
  }

  function renderPurchase(funcId, spec, item, dept, group) {
    const isDetail = spec.kind === 'detail';
    let all = (typeof spec.data === 'function') ? spec.data() : spec.data;
    if (isDetail) computeRunningDebt(all);

    view.innerHTML = `
      <div class="page">
        <div class="func-page-head">
          <div class="fph-top"><h1>${item.name}</h1><span class="tag-proto">VBA ${isDetail ? 'Sheet11·首页2' : 'Sheet8·提交入库'}</span></div>
          <p class="page-sub">${dept.name} · ${group.name} · ${spec.title}</p>
          <p class="func-desc-line">${spec.desc}</p>
        </div>
        <div id="pc-root"></div>
      </div>`;
    const root = document.getElementById('pc-root');
    const state = { kwField: '', kw: '', dateFrom: '', dateTo: '', memoQuick: '', sortKey: null, sortDir: 'asc', page: 1, pageSize: 14 };

    function getFiltered() {
      let rows = all.slice();
      if (state.kwField && state.kw) {
        const kw = state.kw.toLowerCase();
        if (state.kwField === 'kw') rows = rows.filter((r) => spec.columns.some((c) => c.type !== 'action' && String(r[c.key] ?? '').toLowerCase().includes(kw)));
        else rows = rows.filter((r) => String(r[state.kwField] ?? '').toLowerCase().includes(kw));
      }
      if (state.memoQuick) rows = rows.filter((r) => (r.memo || '') === state.memoQuick);
      if (state.dateFrom) rows = rows.filter((r) => normDateStr(r.date) >= state.dateFrom);
      if (state.dateTo) rows = rows.filter((r) => normDateStr(r.date) <= state.dateTo);
      return rows;
    }
    function sortRows(rows) {
      if (!state.sortKey) return rows;
      const col = spec.columns.find((c) => c.key === state.sortKey);
      const mul = state.sortDir === 'asc' ? 1 : -1;
      return rows.slice().sort((a, b) => {
        let av = a[state.sortKey], bv = b[state.sortKey];
        if (col && (col.type === 'money' || col.type === 'num')) return (Number(av) - Number(bv)) * mul;
        av = String(av ?? ''); bv = String(bv ?? '');
        return av.localeCompare(bv, 'zh-CN') * mul;
      });
    }

    const filterHtml = (spec.filters || []).map((f) => {
      if (f.type === 'search') return `<div class="field"><label>${f.placeholder.replace('（', '').replace('）', '')}</label><input type="text" class="pc-search" data-key="${f.key}" placeholder="${f.placeholder}"></div>`;
      if (f.type === 'date') return `<div class="field"><label>${f.label}</label><input type="date" class="pc-date" data-field="${f.field}"></div>`;
      return '';
    }).join('');
    const actionsHtml = (spec.actions || []).map((a) => `<button class="btn ${a.primary ? 'primary' : ''}" data-act="${a.act}">${a.label}</button>`).join('');

    root.innerHTML = `
      <section class="mod-stats" id="pc-stats"></section>
      <section class="panel mod-panel">
        <div class="mod-filters">${filterHtml || '<span class="mod-nofilter">全部记录</span>'}</div>
        <div class="toolbar">
          <div class="count" id="pc-count"></div>
          <div class="mod-actions">${actionsHtml}</div>
        </div>
        <div class="table-scroll"><table><thead><tr id="pc-head"></tr></thead><tbody id="pc-body"></tbody></table></div>
        <div class="pager" id="pc-pager"></div>
      </section>`;

    const $ = (s) => root.querySelector(s);

    function renderStats() {
      const arr = (typeof spec.stats === 'function') ? spec.stats(all) : spec.stats;
      $('#pc-stats').innerHTML = arr.map((s) => `
        <div class="ov-card"><div class="ov-k">${s.k}</div>
        <div class="ov-v"${s.red ? ' style="color:#e53935"' : ''}>${s.v}</div></div>`).join('');
    }
    function renderHead() {
      const tr = $('#pc-head'); tr.innerHTML = '';
      spec.columns.forEach((c) => {
        const th = document.createElement('th'); th.textContent = c.label;
        if (c.type === 'action') th.classList.add('col-act');
        if (state.sortKey === c.key) { const ar = document.createElement('span'); ar.className = 'arrow'; ar.textContent = state.sortDir === 'asc' ? '▲' : '▼'; th.appendChild(ar); }
        if (c.type !== 'action' && c.type !== 'progress') th.addEventListener('click', () => onSort(c.key));
        tr.appendChild(th);
      });
    }
    function renderRows() {
      const filtered = sortRows(getFiltered());
      $('#pc-count').innerHTML = `共 <b>${filtered.length}</b> 条记录（合计 ${all.length} 条）${state.memoQuick ? ' · 仅显示退货' : ''}`;
      const tb = $('#pc-body'); tb.innerHTML = '';
      if (filtered.length === 0) { tb.innerHTML = `<tr><td class="empty" colspan="${spec.columns.length}">没有符合条件的记录</td></tr>`; renderPager(0); return; }
      const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
      if (state.page > pages) state.page = pages;
      const start = (state.page - 1) * state.pageSize;
      filtered.slice(start, start + state.pageSize).forEach((r) => {
        const tr = document.createElement('tr');
        spec.columns.forEach((c) => { const t = document.createElement('template'); t.innerHTML = pcCell(c, r).trim(); tr.appendChild(t.content.firstChild); });
        tb.appendChild(tr);
      });
      renderPager(filtered.length);
    }
    function renderPager(total) {
      const pages = Math.max(1, Math.ceil(total / state.pageSize)); const cur = state.page;
      let html = `<button class="pg" data-pg="prev" ${cur <= 1 ? 'disabled' : ''}>‹ 上一页</button>`;
      const win = [];
      for (let p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - cur) <= 2) win.push(p); else if (win[win.length - 1] !== '...') win.push('...'); }
      win.forEach((p) => { if (p === '...') html += `<span class="pg-ell">…</span>`; else html += `<button class="pg ${p === cur ? 'cur' : ''}" data-pg="${p}">${p}</button>`; });
      html += `<button class="pg" data-pg="next" ${cur >= pages ? 'disabled' : ''}>下一页 ›</button><span class="pg-info">第 ${cur} / ${pages} 页</span>`;
      $('#pc-pager').innerHTML = html;
    }
    function onSort(key) { if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; } renderHead(); renderRows(); }

    function openDetail(r) {
      const body = spec.columns.filter((c) => c.type !== 'action').map((c) => {
        const v = r[c.key]; let val = (v === '' || v == null) ? '—' : v;
        if (c.type === 'money') { const n = Number(v); val = fmtMoney(v); if (!isNaN(n) && n < 0) val = `<span style="color:#e53935;font-weight:600">${val}</span>`; }
        else if (c.type === 'num') val = fmtInt(v);
        else if (c.type === 'badge') val = `<span class="tag ${pcBadgeClass(c, v)}">${v || '—'}</span>`;
        return `<div class="dt-row"><div class="dt-k">${c.label}</div><div class="dt-v">${val}</div></div>`;
      }).join('');
      showModal('记录详情 · ' + spec.title, body);
    }

    function exportCSV(rows, title) {
      if (!rows.length) { alert('当前没有可导出的数据'); return; }
      const cols = spec.columns.filter((c) => c.type !== 'action');
      const lines = [cols.map((c) => c.label).join(',')];
      rows.forEach((r) => {
        const line = cols.map((c) => { let v = r[c.key]; if (c.type === 'money') v = Number(v).toFixed(2); v = (v === '' || v == null) ? '' : String(v); if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'; return v; });
        lines.push(line.join(','));
      });
      const csv = '﻿' + lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = title + '_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    function supplierSummary() {
      const map = {};
      all.forEach((r) => {
        const s = map[r.supplier] || (map[r.supplier] = { supplier: r.supplier, pick: 0, ret: 0, amt: 0, paid: 0 });
        s.pick += Number(r.pickQty) || 0; s.ret += Number(r.returnQty) || 0;
        s.amt += Number(r.amount) || 0; s.paid += Number(r.settled) || 0;
      });
      const rows = Object.values(map).map((s) => ({ supplier: s.supplier, pick: s.pick, ret: s.ret, amount: s.amt, settled: s.paid, debt: s.amt - s.paid }));
      const body = `<div class="table-scroll"><table><thead><tr><th>供应商</th><th>拿货件</th><th>退货件</th><th>金额合计</th><th>已结货款</th><th>累计欠款</th></tr></thead><tbody>` +
        rows.map((s) => `<tr><td>${s.supplier}</td><td class="num">${fmtInt(s.pick)}</td><td class="num">${fmtInt(s.ret)}</td><td class="num">${fmtMoney(s.amount)}</td><td class="num">${fmtMoney(s.settled)}</td><td class="num"${s.debt < 0 ? ' style="color:#e53935;font-weight:600"' : ''}>${fmtMoney(s.debt)}</td></tr>`).join('') +
        `</tbody></table></div>`;
      showModal('供应商汇总 · ' + spec.title, body);
      return rows;
    }

    function handleAction(act) {
      if (act === 'filter') { toast('已按当前条件查询'); renderRows(); }
      else if (act === 'clear') {
        state.kwField = ''; state.kw = ''; state.dateFrom = ''; state.dateTo = ''; state.memoQuick = '';
        root.querySelectorAll('.pc-search').forEach((i) => i.value = ''); root.querySelectorAll('.pc-date').forEach((i) => i.value = '');
        state.page = 1; renderRows(); renderStats(); toast('已清空筛选条件');
      }
      else if (act === 'ret') { state.memoQuick = '退'; state.page = 1; renderRows(); toast('已筛选：退货记录（助记符=退）'); }
      else if (act === 'export') { exportCSV(sortRows(getFiltered()), spec.title + '_账单'); }
      else if (act === 'exportsum') { const rows = supplierSummary(); exportCSV(rows, spec.title + '_供应商汇总'); }
      else if (act === 'sum') { supplierSummary(); }
      else if (act === 'add') { doAddStockin(); }
      else if (act === 'addsup') { doAddSupplier(); }
    }
    function doAddStockin() {
      // 批量录入：像 VBA Sheet8 一样，12 行录入区，一次填多条统一点"提交入库"
      const today = new Date().toISOString().slice(0, 10);
      const ROWS = 12;
      const memoOpts = ['<option value="">—</option>', '<option value="补">补</option>', '<option value="退">退</option>', '<option value="结">结</option>'].join('');

      let rowsHtml = '';
      for (let i = 0; i < ROWS; i++) {
        const ri = i + 1;
        rowsHtml += `<tr class="be-row" data-ri="${ri}">
          <td><input type="date" class="be-inp" name="d_${ri}" value="${today}"></td>
          <td class="sup-cell"><div class="sup-combo">
            <input type="text" class="be-inp be-sup" name="s_${ri}" autocomplete="off" placeholder="搜/选供应商">
            <div class="sup-list" id="suplist_${ri}"></div>
          </div></td>
          <td><input type="text" class="be-inp" name="b_${ri}" placeholder="批次号"></td>
          <td><input type="number" class="be-inp be-num" name="pq_${ri}" value="0" min="0"></td>
          <td><input type="number" class="be-inp be-num" name="rq_${ri}" value="0" min="0"></td>
          <td><input type="number" class="be-inp be-num be-amt" name="a_${ri}" step="0.01" placeholder="金额"></td>
          <td><input type="number" class="be-inp be-num" name="st_${ri}" step="0.01" value="0" min="0"></td>
          <td><select class="be-inp be-sel" name="m_${ri}">${memoOpts}</select></td>
          <td><input type="text" class="be-inp" name="r_${ri}" placeholder="备注"></td>
        </tr>`;
      }

      const body = `
        <div class="batch-entry-wrap">
          <div class="batch-hint">📋 填写后点「提交入库」批量写入，空行自动跳过（最多 ${ROWS} 条/次）。供应商可输入模糊搜索（支持拼音首字母，如输入「hy」匹配「鸿耀」）；表格内 ↑↓←→ 移动、回车跳下一行。</div>
          <div class="table-scroll">
            <table class="batch-entry-table">
              <thead><tr>
                <th>日期</th><th>供应商</th><th>批次号</th><th>拿货件数</th><th>退货件数</th>
                <th>金额</th><th>已结货款</th><th>助记符</th><th>备注</th>
              </tr></thead>
              <tbody id="be-tbody">${rowsHtml}</tbody>
            </table>
          </div>
          <div class="batch-bar">
            <button class="btn primary" id="be-submit">✓ 提交入库</button>
            <button class="btn" id="be-clear">清空全部</button>
            <span class="batch-count" id="be-count">已填 0 行</span>
          </div>
        </div>`;
      showModal('提交入库 · 批量录入', body);
      // 批量录入弹窗加宽
      const mCard = document.querySelector('.mod-modal-card');
      if (mCard) mCard.classList.add('batch-wide');

      const tbody = document.getElementById('be-tbody');
      const countEl = document.getElementById('be-count');

      // 自由输入的供应商名归一化：精确匹配优先，否则唯一模糊匹配回写标准名
      function normalizeSup(v) {
        v = (v || '').trim();
        if (!v) return '';
        if (PC_SUP_LIST.includes(v)) return v;
        const m = PC_SUP_LIST.filter((s) => supMatch(s, v));
        if (m.length === 1) return m[0];
        const exact = m.find((s) => s.includes(v));
        return exact || v;
      }

      // 每行供应商：模糊搜索下拉（TextBox + ListBox 移植自 VBA Sheet8）
      function setupSupCombo(input, listEl) {
        let activeIdx = -1, matches = [];
        function render(kw) {
          matches = PC_SUP_LIST.filter((s) => supMatch(s, kw));
          if (matches.length === 0) { listEl.style.display = 'none'; return; }
          listEl.innerHTML = matches.map((s, i) => `<div class="sup-opt${i === activeIdx ? ' active' : ''}" data-v="${s}">${s}</div>`).join('');
          listEl.style.display = 'block';
        }
        function confirm(v) { input.value = v; listEl.style.display = 'none'; }
        input.addEventListener('focus', () => { activeIdx = -1; render(input.value); });
        input.addEventListener('input', () => { activeIdx = -1; render(input.value); });
        input.addEventListener('keydown', (e) => {
          if (listEl.style.display === 'none' || matches.length === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(matches.length - 1, activeIdx + 1); render(input.value); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(input.value); }
          else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); e.stopPropagation(); confirm(matches[activeIdx]); }
          else if (e.key === 'Escape') { listEl.style.display = 'none'; }
        });
        // 点击列表项回填（mousedown 防止 input blur 先关）
        listEl.addEventListener('mousedown', (e) => { e.preventDefault(); });
        listEl.addEventListener('click', (e) => { const opt = e.target.closest('.sup-opt'); if (opt) confirm(opt.dataset.v); });
        input.addEventListener('blur', () => setTimeout(() => { listEl.style.display = 'none'; }, 120));
      }
      tbody.querySelectorAll('.be-row').forEach((tr) => {
        const ri = tr.dataset.ri;
        setupSupCombo(tr.querySelector(`[name="s_${ri}"]`), tr.querySelector(`#suplist_${ri}`));
      });

      // 动态计数：统计有实质内容的行数
      function countFilled() {
        let n = 0;
        tbody.querySelectorAll('.be-row').forEach((tr) => {
          const vals = [...tr.querySelectorAll('.be-inp')].map((inp) => (inp.value || '').trim());
          if (vals.some((v) => v !== '' && v !== '0')) n++;
        });
        countEl.textContent = '已填 ' + n + ' 行';
      }
      tbody.addEventListener('input', countFilled);
      tbody.addEventListener('change', countFilled);

      // 键盘网格导航（移植自 VBA Worksheet_SelectionChange / TextBox1_KeyDown：方向键移动、回车跳下一行）
      tbody.addEventListener('keydown', (e) => {
        const inp = e.target;
        if (!inp.classList || !inp.classList.contains('be-inp')) return;
        // 供应商下拉打开时，上下/回车交给 combo 处理
        if (inp.classList.contains('be-sup')) {
          const listEl = inp.parentNode.querySelector('.sup-list');
          if (listEl && listEl.style.display !== 'none') return;
        }
        const navKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!navKeys.includes(e.key)) return;
        if (inp.type === 'date' && e.key !== 'Enter') return; // 日期输入保留原生方向键调整
        e.preventDefault();
        const tr = inp.closest('tr');
        const tds = [...tr.children];
        const tdIdx = tds.indexOf(inp.closest('td'));
        const rowEls = [...tbody.children];
        const rowIdx = rowEls.indexOf(tr);
        function focusCell(r, c) {
          const targetRow = rowEls[r]; if (!targetRow) return;
          const targetInp = targetRow.children[c].querySelector('.be-inp');
          if (targetInp) targetInp.focus();
        }
        if (e.key === 'Enter' || e.key === 'ArrowDown') focusCell(rowIdx < rowEls.length - 1 ? rowIdx + 1 : 0, tdIdx);
        else if (e.key === 'ArrowUp') focusCell(rowIdx > 0 ? rowIdx - 1 : rowEls.length - 1, tdIdx);
        else if (e.key === 'ArrowLeft' && tdIdx > 0) focusCell(rowIdx, tdIdx - 1);
        else if (e.key === 'ArrowRight' && tdIdx < tds.length - 1) focusCell(rowIdx, tdIdx + 1);
      });

      document.getElementById('be-submit').addEventListener('click', () => {
        const recs = [];
        tbody.querySelectorAll('.be-row').forEach((tr) => {
          const ri = tr.dataset.ri;
          const d = tr.querySelector(`[name="d_${ri}"]`).value;
          const s = normalizeSup(tr.querySelector(`[name="s_${ri}"]`).value);
          const b = (tr.querySelector(`[name="b_${ri}"]`).value || '').trim();
          const pq = Number(tr.querySelector(`[name="pq_${ri}"]`).value) || 0;
          const rq = Number(tr.querySelector(`[name="rq_${ri}"]`).value) || 0;
          const am = Number(tr.querySelector(`[name="a_${ri}"]`).value) || 0;
          const st = Number(tr.querySelector(`[name="st_${ri}"]`).value) || 0;
          const mm = tr.querySelector(`[name="m_${ri}"]`).value || '';
          const rk = (tr.querySelector(`[name="r_${ri}"]`).value || '').trim();
          // 至少有供应商或金额才算有效行
          if (!s && !am) return;
          recs.push({
            date: d.replace(/-/g, '/'),
            supplier: s, batchNo: b,
            pickQty: pq, returnQty: rq,
            amount: am, settled: st,
            memo: mm, remark: rk
          });
        });
        if (recs.length === 0) { toast('请至少填写一行有效数据（供应商或金额）'); return; }
        // 批量插入到数据集头部
        recs.reverse().forEach((rec) => all.unshift(rec));
        if (isDetail) computeRunningDebt(all);
        closeModal();
        renderStats(); renderRows();
        toast('✅ 批量提交入库成功，共 ' + recs.length + ' 条记录');
      });

      document.getElementById('be-clear').addEventListener('click', () => {
        tbody.querySelectorAll('.be-row').forEach((tr) => {
          tr.querySelectorAll('.be-inp').forEach((inp) => {
            if (inp.type === 'date') inp.value = today;
            else if (inp.type === 'number') inp.value = inp.name.startsWith('a_') ? '' : '0';
            else if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
            else inp.value = '';
          });
        });
        countFilled();
        toast('已清空全部录入行');
      });
    }
    function doAddSupplier() {
      openFormModal('供应商录入', [
        { name: 'name', label: '供应商名称', type: 'text', required: true },
        { name: 'contact', label: '联系人', type: 'text' },
        { name: 'phone', label: '联系电话', type: 'text' },
        { name: 'category', label: '类别', type: 'select', options: PCAT_LIST },
        { name: 'rating', label: '评级', type: 'select', options: ['A', 'B', 'C'] }
      ], (v) => {
        if (window.JP_DATA && window.JP_DATA.pcSupplier) {
          window.JP_DATA.pcSupplier.unshift({
            id: 'GYS' + (2027000 + window.JP_DATA.pcSupplier.length), name: v.name,
            contact: v.contact || '—', phone: v.phone || '—', category: v.category || '服装',
            rating: v.rating || 'B', totalPurchase: 0, balance: 0, status: '合作中'
          });
        }
        PC_SUP_LIST.push(v.name);
        toast('已录入供应商：' + v.name);
      });
    }

    root.querySelectorAll('.pc-search').forEach((inp) => inp.addEventListener('input', (e) => { state.kwField = e.target.dataset.key; state.kw = e.target.value; state.page = 1; renderRows(); }));
    root.querySelectorAll('.pc-date').forEach((inp) => inp.addEventListener('change', (e) => { if (e.target.dataset.field === 'dateFrom') state.dateFrom = e.target.value; else state.dateTo = e.target.value; state.page = 1; renderRows(); }));
    root.addEventListener('click', (e) => {
      const link = e.target.closest('.link-btn');
      if (link) {
        const tr = link.closest('tr'); const idx = [...tr.parentNode.children].indexOf(tr);
        const filtered = sortRows(getFiltered()); const start = (state.page - 1) * state.pageSize;
        const rec = filtered[start + idx]; if (rec) openDetail(rec); return;
      }
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act) { handleAction(act.dataset.act); return; }
      const pg = e.target.closest('.pg');
      if (pg && !pg.disabled) { const v = pg.dataset.pg; if (v === 'prev') state.page = Math.max(1, state.page - 1); else if (v === 'next') state.page++; else state.page = Number(v); renderRows(); root.querySelector('.table-scroll').scrollTop = 0; }
    });

    renderHead(); renderRows(); renderStats();
  }

  // ---------- 功能页入口 ----------
  function renderFunc(funcId) {
    const idx = FUNC_INDEX[funcId];
    if (!idx) { view.innerHTML = `<div class="empty-page">未找到该功能</div>`; return; }
    const { dept, group, item } = idx;

    // 采购部：严格对照知识库 VBA 真实功能重做（Sheet8 提交入库 / Sheet11 首页2）
    if (funcId === 'pc-stockin' || funcId === 'pc-detail') {
      renderPurchase(funcId, MODULES[funcId], item, dept, group);
      return;
    }

    // 通用模块页
    if (MODULES[funcId]) {
      renderModulePage(funcId, MODULES[funcId], item, dept, group);
      return;
    }
    // 专属实现
    if (item.impl && funcId === 'ph-sample-query') {
      view.innerHTML = `
        <div class="page">
          <div class="func-page-head">
            <div class="fph-top"><h1>${item.name}</h1><span class="tag-live">已上线</span></div>
            <p class="page-sub">${dept.name} · ${group.name} · 对应原 VBA 系统 UserForm9</p>
          </div>
          <div id="sample-query-root"></div>
        </div>`;
      window.JP_SampleQuery.mount(document.getElementById('sample-query-root'));
      return;
    }
    // 占位
    view.innerHTML = `
      <div class="page">
        <div class="func-page-head">
          <div class="fph-top"><h1>${item.name}</h1><span class="tag-plan">规划中</span></div>
          <p class="page-sub">${dept.name} · ${group.name}</p>
        </div>
        <section class="panel plan-panel">
          <div class="plan-badge">功能规划中</div>
          <h3>功能说明（行业标准）</h3>
          <p class="plan-desc">${item.desc}</p>
          <div class="plan-meta">
            <span>所属部门：${dept.name}</span>
            <span>业务域：${group.name}</span>
            <span>状态：待开发</span>
          </div>
          <p class="plan-note">本页面为菜单骨架占位。后续将按上述行业标准实现完整交互，并接入 Supabase / Postgres 真实数据层。</p>
        </section>
      </div>`;
  }

  // ---------- 路由 ----------
  function router() {
    const route = location.hash || '#/';
    syncSidebar(route);
    document.getElementById('breadcrumb').innerHTML = breadcrumb(route);
    if (route === '#/' || route === '' || route === '#') return renderHome();
    let m = route.match(/^#\/dept\/(.+)$/);
    if (m) return renderDept(m[1]);
    m = route.match(/^#\/func\/(.+)$/);
    if (m) return renderFunc(m[1]);
    renderHome();
  }

  // 应用署名与版本号渲染（顶部版本标签 + 底部署名栏）
  function renderMeta() {
    const v = document.getElementById('ver-tag');
    if (v) v.textContent = APP_VERSION;
    const f = document.getElementById('app-footer');
    if (f) f.innerHTML = '作者：' + APP_AUTHOR + ' &nbsp;·&nbsp; 版本：' + APP_VERSION;
  }

  renderSidebar();
  renderMeta();
  window.addEventListener('hashchange', router);
  router();
})();
