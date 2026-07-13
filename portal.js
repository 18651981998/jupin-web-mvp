/*
 * 聚品服饰 · 部门门户框架（SPA，hash 路由，零依赖）
 * ---------------------------------------------------------------
 * 路由：
 *   #/                -> 首页仪表盘
 *   #/dept/:deptId   -> 部门着陆页（功能模块网格）
 *   #/func/:funcId   -> 功能页（已实现的挂载真实组件，其余显示行业标准占位）
 */

(function () {
  'use strict';

  const MENU = window.JP_MENU;
  const view = document.getElementById('view');
  const sidebar = document.getElementById('sidebar-nav');

  // 建立 funcId -> {dept, group, item} 索引，便于面包屑与高亮
  const FUNC_INDEX = {};
  MENU.depts.forEach((dept) => {
    dept.groups.forEach((g) => {
      g.items.forEach((it) => {
        FUNC_INDEX[it.id] = { dept, group: g, item: it };
      });
    });
  });

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
              ${g.items.map((it) => `
                <a class="nav-leaf" data-func="${it.id}" href="#/func/${it.id}">${it.name}${it.impl ? '<span class="dot-live">●</span>' : ''}</a>
              `).join('')}
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

  // 展开当前部门、折叠其余，并高亮当前项
  function syncSidebar(route) {
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-route') === route || el.getAttribute('href') === route);
    });
    document.querySelectorAll('.nav-leaf').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('href') === route);
    });

    // 默认展开含 active 的部门
    const activeFunc = [...document.querySelectorAll('.nav-leaf.active')][0];
    document.querySelectorAll('.nav-children').forEach((c) => {
      const deptId = c.getAttribute('data-children');
      const open = activeFunc && FUNC_INDEX[activeFunc.getAttribute('data-func')]
        ? FUNC_INDEX[activeFunc.getAttribute('data-func')].dept.id === deptId
        : false;
      c.classList.toggle('open', open);
    });
    document.querySelectorAll('.nav-dept').forEach((d) => {
      const open = activeFunc && FUNC_INDEX[activeFunc.getAttribute('data-func')]
        ? FUNC_INDEX[activeFunc.getAttribute('data-func')].dept.id === d.getAttribute('data-dept')
        : false;
      d.classList.toggle('open', open);
      d.querySelector('.nav-caret').style.transform = open ? 'rotate(90deg)' : '';
    });

    // 部门着陆页时展开该部门
    const m = route.match(/^#\/dept\/(.+)$/);
    if (m) {
      const deptId = m[1];
      const child = sidebar.querySelector(`.nav-children[data-children="${deptId}"]`);
      if (child) child.classList.add('open');
      const deptEl = sidebar.querySelector(`.nav-dept[data-dept="${deptId}"]`);
      if (deptEl) { deptEl.classList.add('open'); deptEl.querySelector('.nav-caret').style.transform = 'rotate(90deg)'; }
    }
  }

  // 侧边栏点击：部门标题切换展开/折叠
  sidebar.addEventListener('click', (e) => {
    const dept = e.target.closest('.nav-dept');
    if (dept) {
      // 若点击的是部门本身（不是子项），切换展开
      if (e.target.closest('.nav-children')) return;
      const child = sidebar.querySelector(`.nav-children[data-children="${dept.getAttribute('data-dept')}"]`);
      const open = child.classList.toggle('open');
      dept.classList.toggle('open', open);
      dept.querySelector('.nav-caret').style.transform = open ? 'rotate(90deg)' : '';
    }
  });

  // ---------- 面包屑 ----------
  function breadcrumb(route) {
    if (route === '#/' || route === '' || route === '#') {
      return `<span class="bc-item">首页</span>`;
    }
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

  // ---------- 页面：首页 ----------
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

        <p class="hint">说明：本平台为原型演示，使用本地生成的模拟数据。生产环境将替换为 Supabase / Postgres 真实接口。</p>
      </div>`;
  }

  // ---------- 页面：部门着陆 ----------
  function renderDept(deptId) {
    const dept = MENU.depts.find((d) => d.id === deptId);
    if (!dept) { view.innerHTML = `<div class="empty-page">未找到该部门</div>`; return; }

    const groups = dept.groups.map((g) => `
      <div class="func-group">
        <div class="func-group-title">${g.name}</div>
        <div class="func-grid">
          ${g.items.map((it) => `
            <a class="func-card ${it.impl ? 'live' : ''}" href="#/func/${it.id}">
              <div class="func-name">${it.name} ${it.impl ? '<span class="tag-live">已上线</span>' : '<span class="tag-plan">规划中</span>'}</div>
              <div class="func-desc">${it.desc}</div>
            </a>`).join('')}
        </div>
      </div>`).join('');

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

  // ---------- 页面：功能页 ----------
  function renderFunc(funcId) {
    const idx = FUNC_INDEX[funcId];
    if (!idx) { view.innerHTML = `<div class="empty-page">未找到该功能</div>`; return; }
    const { dept, group, item } = idx;

    if (item.impl && funcId === 'ph-sample-query') {
      view.innerHTML = `
        <div class="page">
          <div class="func-page-head">
            <h1>${item.name}</h1>
            <p class="page-sub">${dept.name} · ${group.name} · 对应原 VBA 系统 UserForm9</p>
          </div>
          <div id="sample-query-root"></div>
        </div>`;
      window.JP_SampleQuery.mount(document.getElementById('sample-query-root'));
      return;
    }

    // 行业标准占位页
    view.innerHTML = `
      <div class="page">
        <div class="func-page-head">
          <h1>${item.name}</h1>
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

  // ---------- 启动 ----------
  renderSidebar();
  window.addEventListener('hashchange', router);
  router();
})();
