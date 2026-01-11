/* tools-ui.js
   Single source of UI truth:
   - Sidebar categories + counts
   - Home page sections (root)
   - Category pages tool list
   - Breadcrumbs for category & tool pages
   - Mobile drawer (<=420px)
*/
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

  function el(tag, cls){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    return e;
  }

  function getPathParts(){
    return location.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
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
    for(const [k, arr] of m.entries()){
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

  function ensureSupportCard(){
    const sidebar = document.querySelector('aside.sidebar');
    if(!sidebar) return;
    if(sidebar.querySelector('.ad-slot')) return;

    const card = el('div','card');
    card.style.marginTop = "14px";

    const h2 = el('h2'); h2.style.marginTop = "0"; h2.textContent = "Support";
    const p = el('p'); p.style.color = "var(--muted)"; p.style.margin = "8px 0 0";
    p.textContent = "This site is supported by ads.";

    const ad = el('div','ad-slot'); ad.style.marginTop = "12px"; ad.textContent = "Ad space";

    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(ad);
    sidebar.appendChild(card);
  }

  function renderToolRow(t){
    const row = el('div','tool');

    const left = el('div','left');
    const name = el('p','name'); name.textContent = t.title || t.slug || "Tool";
    const desc = el('p','desc'); desc.textContent = t.description || "";
    left.appendChild(name);
    left.appendChild(desc);

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
      st.appendChild(h2);
      st.appendChild(hint);

      const list = el('div','tool-list');
      for(const t of tools) list.appendChild(renderToolRow(t));

      card.appendChild(st);
      card.appendChild(list);
      grid.appendChild(card);
    }
  }

  function renderCategoryPage(categoriesMap){
    const target = document.getElementById('category-tools');
    if(!target) return;

    const metaCat = document.querySelector('meta[name="page-category"]')?.getAttribute('content') || "";
    const parts = getPathParts();
    const cat = metaCat || parts[0] || "";

    target.innerHTML = "";

    const tools = categoriesMap.get(cat) || [];
    if(tools.length === 0){
      const empty = el('div','tool');
      const left = el('div','left');
      const name = el('p','name'); name.textContent = "No tools yet";
      const desc = el('p','desc'); desc.textContent = "We’ll add more tools soon.";
      left.appendChild(name);
      left.appendChild(desc);

      const badge = el('span','btn disabled'); badge.textContent = "Soon";

      empty.appendChild(left);
      empty.appendChild(badge);
      target.appendChild(empty);
      return;
    }

    for(const t of tools){
      target.appendChild(renderToolRow(t));
    }
  }

  function renderBreadcrumbs(categoriesMap){
    const bc = document.getElementById('breadcrumbs');
    if(!bc) return;

    const parts = getPathParts();
    bc.innerHTML = "";

    const aHome = el('a');
    aHome.href = "/";
    aHome.textContent = "All tools";
    bc.appendChild(aHome);

    if(parts.length >= 1){
      const cat = parts[0];
      const catLabel = (CATEGORY_LABELS.find(x=>x.key===cat)?.label) || cat;
      bc.appendChild(document.createTextNode("  ›  "));

      const aCat = el('a');
      aCat.href = `/${cat}/`;
      aCat.textContent = catLabel;
      bc.appendChild(aCat);

      if(parts.length >= 2){
        const slug = parts[1];
        const t = (categoriesMap.get(cat) || []).find(x=>x.slug===slug);

        bc.appendChild(document.createTextNode("  ›  "));
        const cur = el('span');
        cur.textContent = (t && t.title) ? t.title : slug;
        bc.appendChild(cur);
      }
    }
  }

  /* ===== Mobile drawer (<=420px) =====
     IMPORTANT FIX:
     - If .menu-btn already exists in HTML, we still bind click handler.
  */
  function injectMobileMenu(){
    const headerInner = document.querySelector('.header-inner');
    const sidebar = document.querySelector('aside.sidebar');
    if(!headerInner || !sidebar) return;

    // overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    if(!overlay.dataset.bound){
      overlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
        setBtnExpanded(false);
      });
      overlay.dataset.bound = "1";
    }

    // button (use existing if present)
    let btn = headerInner.querySelector('.menu-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-btn';
      btn.setAttribute('aria-label', 'Open categories');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      headerInner.appendChild(btn);
    }

    function setBtnExpanded(v){
      if(!btn) return;
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    // bind click even if it already existed
    if(!btn.dataset.bound){
      btn.addEventListener('click', () => {
        const willOpen = !document.body.classList.contains('sidebar-open');
        document.body.classList.toggle('sidebar-open');
        setBtnExpanded(willOpen);
      });
      btn.dataset.bound = "1";
      setBtnExpanded(document.body.classList.contains('sidebar-open'));
    }

    // close when clicking a sidebar link (phone UX)
    if(!sidebar.dataset.bound){
      sidebar.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if(a){
          document.body.classList.remove('sidebar-open');
          setBtnExpanded(false);
        }
      });
      sidebar.dataset.bound = "1";
    }

    // ESC
    if(!window.__drawerEscBound){
      window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape'){
          document.body.classList.remove('sidebar-open');
          setBtnExpanded(false);
        }
      });
      window.__drawerEscBound = true;
    }

    // leaving phone width -> ensure closed so it never "sticks"
    if(!window.__drawerResizeBound){
      window.addEventListener('resize', () => {
        if(window.innerWidth > 420){
          document.body.classList.remove('sidebar-open');
          setBtnExpanded(false);
        }
      });
      window.__drawerResizeBound = true;
    }
  }

  // Boot
  document.addEventListener('DOMContentLoaded', async () => {
    injectMobileMenu();

    const tools = await loadTools();
    const categoriesMap = groupByCategory(tools);

    renderSidebar(categoriesMap);
    ensureSupportCard();
    renderBreadcrumbs(categoriesMap);

    renderHome(categoriesMap);
    renderCategoryPage(categoriesMap);
  });
})();
