(function(){
  const CATEGORY_LABELS = [
    { key: "pdf",     label: "PDF" },
    { key: "image",   label: "Image" },
    { key: "text",    label: "Text" },
    { key: "math",    label: "Math" },
    { key: "utility", label: "Utility" },
    { key: "developer", label: "Developer" },
    { key: "ai-fun",  label: "AI / Fun" },
  ];

  function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
  function getPathParts(){
    const parts = location.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
    return parts;
  }

  async function loadTools(){
    try{
      const r = await fetch('/data/tools.json', { cache: "no-store" });
      if(!r.ok) throw new Error("tools.json not found");
      const tools = await r.json();
      return Array.isArray(tools) ? tools : [];
    }catch(e){
      console.warn(e);
      return [];
    }
  }

  function groupByCategory(tools){
    const m = new Map();
    for(const c of CATEGORY_LABELS) m.set(c.key, []);
    for(const t of tools){
      if(!t || !t.category) continue;
      if(!m.has(t.category)) m.set(t.category, []);
      m.get(t.category).push(t);
    }
    for(const [k,arr] of m.entries()){
      arr.sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""), undefined, { sensitivity: "base" }));
    }
    return m;
  }

  function toolHref(t){
    if(!t) return "#";
    return `/${t.category}/${t.slug}/`;
  }

  function renderSidebar(categoriesMap){
    const host = document.getElementById('sidebar-categories');
    if(!host) return;

    host.innerHTML = "";

    const counts = {};
    for(const c of CATEGORY_LABELS){
      counts[c.key] = (categoriesMap.get(c.key) || []).length;
    }

    const parts = getPathParts();
    const currentCat = parts[0] || "";

    for(const c of CATEGORY_LABELS){
      const a = el('a','cat');
      a.href = `/${c.key}/`;
      a.innerHTML = `${c.label} <small>${counts[c.key] || 0}</small>`;
      if(currentCat === c.key) a.classList.add('active');
      host.appendChild(a);
    }
  }

  function renderToolRow(t){
    const row = el('div','tool');

    const left = el('div','left');
    const name = el('p','name'); name.textContent = t.title || t.slug || "Tool";
    const desc = el('p','desc'); desc.textContent = t.description || "";
    left.appendChild(name); left.appendChild(desc);

    const status = (t.status || "live").toLowerCase();
    let action;
    if(status === "soon"){
      action = el('span','btn disabled');
      action.textContent = "Soon";
    }else{
      action = el('a','btn primary');
      action.href = toolHref(t);
      action.textContent = "Open";
    }

    row.appendChild(left);
    row.appendChild(action);
    return row;
  }

  function renderHome(categoriesMap){
    const grid = document.getElementById('home-grid');
    if(!grid) return;
    grid.innerHTML = "";

    for(const c of CATEGORY_LABELS){
      const tools = categoriesMap.get(c.key) || [];
      if(tools.length === 0) continue;

      const card = el('div','card');
      card.id = c.key;

      const st = el('div','section-title');
      const h2 = el('h2'); h2.textContent = c.label;
      const hint = el('div','hint'); hint.textContent = "Quick utilities";
      st.appendChild(h2); st.appendChild(hint);

      const list = el('div','tool-list');
      for(const t of tools) list.appendChild(renderToolRow(t));

      card.appendChild(st);
      card.appendChild(list);
      grid.appendChild(card);
    }
  }

  /* ===== Drawer logic (420px and below) ===== */
  function injectMobileMenu(){
    const headerInner = document.querySelector('.header-inner');
    const sidebar = document.querySelector('aside.sidebar');
    if(!headerInner || !sidebar) return;

    // overlay
    if(!document.querySelector('.sidebar-overlay')){
      const ov = document.createElement('div');
      ov.className = 'sidebar-overlay';
      ov.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
      document.body.appendChild(ov);
    }

    // button
    if(!headerInner.querySelector('.menu-btn')){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-btn';
      btn.setAttribute('aria-label', 'Open categories');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      btn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
      });
      headerInner.appendChild(btn);
    }

    // close when clicking a sidebar link (phone UX)
    sidebar.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) document.body.classList.remove('sidebar-open');
    });

    // ESC
    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') document.body.classList.remove('sidebar-open');
    });

    // IMPORTANT: if leaving drawer width, ensure closed so it never "sticks"
    window.addEventListener('resize', () => {
      if(window.innerWidth > 420) document.body.classList.remove('sidebar-open');
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    injectMobileMenu();

    const tools = await loadTools();
    const categoriesMap = groupByCategory(tools);

    renderSidebar(categoriesMap);
    renderHome(categoriesMap);
  });
})();
