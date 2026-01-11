/* /assets/js/layout.js */

const CATEGORIES = [
  { key: "pdf",       label: "PDF",       href: "/pdf/" },
  { key: "image",     label: "Image",     href: "/image/" },
  { key: "text",      label: "Text",      href: "/text/" },
  { key: "math",      label: "Math",      href: "/math/" },
  { key: "utility",   label: "Utility",   href: "/utility/" },
  { key: "developer", label: "Developer", href: "/developer/" },
  { key: "ai-fun",    label: "AI-Fun",    href: "/ai-fun/" },
];

const TOOLS = {
  pdf: [
    { key:"merge",    label:"Merge PDF",    href:"/pdf/merge/",    p0:true },
    { key:"split",    label:"Split PDF",    href:"/pdf/split/",    p0:true },
    { key:"rotate",   label:"Rotate PDF",   href:"/pdf/rotate/",   p0:true },
    { key:"compress", label:"Compress PDF", href:"/pdf/compress/", p0:true },
    // soon
    { label:"PDF to JPG", soon:true },
    { label:"JPG to PDF", soon:true },
    { label:"Delete PDF Pages", soon:true },
    { label:"Reorder PDF Pages", soon:true },
    { label:"Add Watermark", soon:true },
    { label:"Extract Pages", soon:true },
    { label:"PDF Page Numbers", soon:true },
    { label:"PDF Protect (Password)", soon:true },
    { label:"PDF Metadata Viewer", soon:true },
  ],
  image: [
    { key:"resize",   label:"Image Resizer",    href:"/image/resize/",   p0:true },
    { key:"compress", label:"Image Compressor", href:"/image/compress/", p0:true },
    { key:"png-jpg",  label:"PNG ↔ JPG",        href:"/image/png-jpg/",  p0:true },
    { key:"crop",     label:"Image Cropper",    href:"/image/crop/",     p0:true },
    // soon
    { label:"WebP Converter", soon:true },
    { label:"Image Rotator / Flipper", soon:true },
    { label:"Background Color Changer", soon:true },
    { label:"EXIF Viewer", soon:true },
    { label:"Image Metadata Remover", soon:true },
    { label:"Image to Base64", soon:true },
    { label:"Meme Generator", soon:true },
    { label:"Image Filter Playground", soon:true },
  ],
  text: [
    { key:"word-counter",        label:"Word Counter",         href:"/text/word-counter/",        p0:true },
    { key:"char-counter",        label:"Character Counter",    href:"/text/char-counter/",        p0:true },
    { key:"case-converter",      label:"Case Converter",       href:"/text/case-converter/",      p0:true },
    { key:"remove-line-breaks",  label:"Remove Line Breaks",   href:"/text/remove-line-breaks/",  p0:true },
    { key:"text-sorter",         label:"Text Sorter",          href:"/text/text-sorter/",         p0:true },
    // soon
    { label:"JSON Formatter", soon:true },
    { label:"JSON Validator", soon:true },
    { label:"URL Encoder / Decoder", soon:true },
    { label:"HTML Escape / Unescape", soon:true },
    { label:"Lorem Ipsum Generator", soon:true },
    { label:"Text Compare (Diff)", soon:true },
    { label:"Regex Tester", soon:true },
    { label:"Markdown Previewer", soon:true },
    { label:"Text Randomizer", soon:true },
  ],
  math: [
    { key:"percentage",    label:"Percentage Calculator", href:"/math/percentage/", p0:true },
    { key:"average",       label:"Average Calculator",    href:"/math/average/",    p0:true },
    { key:"gcd-lcm",       label:"GCD / LCM",             href:"/math/gcd-lcm/",    p0:true },
    { key:"prime-checker", label:"Prime Checker",         href:"/math/prime-checker/", p0:true },
    // soon
    { label:"Fraction Calculator", soon:true },
    { label:"Unit Converter", soon:true },
    { label:"BMI Calculator", soon:true },
    { label:"Equation Solver", soon:true },
    { label:"Number Base Converter", soon:true },
    { label:"Formula Visualizer", soon:true },
    { label:"Graph Plotter", soon:true },
  ],

  // ✅ ここが今回の修正対象（新slug＆分かりやすいキーに統一）
  utility: [
    { key:"uuid-generator",               label:"UUID Generator",           href:"/utility/uuid-generator/",               p0:true },
    { key:"unix-timestamp-converter",     label:"Unix Timestamp Converter", href:"/utility/unix-timestamp-converter/",     p0:true },
    { key:"password-generator",           label:"Password Generator",       href:"/utility/password-generator/",           p0:true },
    { key:"qr-code-generator",            label:"QR Code Generator",        href:"/utility/qr-code-generator/",            p0:true },
    // soon
    { label:"Color Picker", soon:true },
    { label:"HEX ↔ RGB", soon:true },
    { label:"Random Number Generator", soon:true },
    { label:"File Size Converter", soon:true },
    { label:"Time Zone Converter", soon:true },
    { label:"Clipboard Tools", soon:true },
    { label:"Simple Notepad", soon:true },
  ],

  developer: [
    { key:"json-formatter", label:"JSON Formatter",        href:"/developer/json-formatter/", p0:true },
    { key:"base64",         label:"Base64 Encode/Decode",  href:"/developer/base64/",        p0:true },
    { key:"url-encode",     label:"URL Encode/Decode",     href:"/developer/url-encode/",    p0:true },
    { key:"hash",           label:"Hash Generator",        href:"/developer/hash/",          p0:true },
    // soon
    { label:"JWT Decoder", soon:true },
    { label:"Cron Expression Helper", soon:true },
    { label:"Regex Tester", soon:true },
    { label:"HTTP Status Code List", soon:true },
    { label:"MIME Type Finder", soon:true },
    { label:"API Tester", soon:true },
    { label:"Code Minifier", soon:true },
  ],
  "ai-fun": [
    { label:"AI Prompt Generator", soon:true },
    { label:"Random Idea Generator", soon:true },
    { label:"Drawing Guess Tool", soon:true },
    { label:"Personality Test", soon:true },
    { label:"AI Fortune Teller", soon:true },
    { label:"AI Name Generator", soon:true },
  ],
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function logoSvg() {
  return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z" stroke="currentColor" stroke-width="2"/>
      <path d="M14 2v5h5" stroke="currentColor" stroke-width="2"/>
      <path d="M8 13h8M8 17h8M8 9h4" stroke="currentColor" stroke-width="2"/>
    </svg>`;
}

function renderSidebar(activeCategoryKey, activeToolKey) {
  const catLinks = CATEGORIES.map(c => {
    const cls = (c.key === activeCategoryKey) ? "side-link active" : "side-link";
    return `<a class="${cls}" href="${c.href}">${escapeHtml(c.label)}</a>`;
  }).join("");

  const tools = (TOOLS[activeCategoryKey] || []);
  const p0 = tools.filter(t => t.p0);
  const soon = tools.filter(t => t.soon);

  const toolLinks = p0.map(t => {
    const cls = (t.key === activeToolKey) ? "side-link active" : "side-link";
    return `<a class="${cls}" href="${t.href}">${escapeHtml(t.label)}</a>`;
  }).join("");

  const soonLinks = soon.map(t => `<span class="side-link disabled">${escapeHtml(t.label)}</span>`).join("");

  return `
    <aside class="sidebar" aria-label="Categories">
      <div class="sidebar-section">
        <div class="sidebar-title">Categories</div>
        ${catLinks}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-title">${escapeHtml((CATEGORIES.find(c=>c.key===activeCategoryKey)||{}).label || "Tools")}</div>
        ${toolLinks}
        ${soon.length ? `<div class="sidebar-subtitle">Soon</div>${soonLinks}` : ""}
      </div>
    </aside>
  `;
}

export function mountLayout({
  activeCategory,
  activeTool,
  pageTitle,
  pageDescription,
  mainHtml
}) {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app not found");

  document.title = pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", pageDescription);

  root.innerHTML = `
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="/" aria-label="Home">
          <div class="logo">${logoSvg()}</div>
          <div class="brand-text">
            <div class="brand-title">Simple Web Tools</div>
          </div>
        </a>
        <nav class="nav" aria-label="Legal">
          <a href="/legal/privacy.html">Privacy</a>
          <a href="/legal/terms.html">Terms</a>
        </nav>
      </div>
    </header>

    <main class="layout">
      ${renderSidebar(activeCategory, activeTool)}
      <section class="content" aria-label="Tool">
        ${mainHtml}
      </section>
    </main>
  `;
}
