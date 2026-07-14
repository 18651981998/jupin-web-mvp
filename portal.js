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
  const APP_VERSION = 'V26.0410';

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
      const today = new Date().toISOString().slice(0, 10);
      openFormModal('提交入库 · 新增采购记录', [
        { name: 'date', label: '日期', type: 'date', value: today, required: true },
        { name: 'supplier', label: '供应商', type: 'select', options: PC_SUP_LIST, required: true },
        { name: 'batchNo', label: '批次号', type: 'number', required: true },
        { name: 'pickQty', label: '拿货件数', type: 'number', value: 0 },
        { name: 'returnQty', label: '退货件数', type: 'number', value: 0 },
        { name: 'amount', label: '金额（负数=退货）', type: 'number', step: '0.01', required: true },
        { name: 'settled', label: '已结货款', type: 'number', step: '0.01', value: 0 },
        { name: 'memo', label: '助记符', type: 'select', options: ['', '补', '退', '结'] },
        { name: 'remark', label: '备注', type: 'text' }
      ], (v) => {
        const rec = {
          date: (v.date || today).replace(/-/g, '/'),
          supplier: v.supplier, batchNo: Number(v.batchNo) || 0,
          pickQty: Number(v.pickQty) || 0, returnQty: Number(v.returnQty) || 0,
          amount: Number(v.amount) || 0, settled: v.settled ? Number(v.settled) : 0,
          memo: v.memo || '', remark: v.remark || ''
        };
        all.unshift(rec);
        if (isDetail) computeRunningDebt(all);
        renderStats(); renderRows();
        toast('已提交入库：' + rec.supplier + ' ' + fmtMoney(rec.amount));
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
