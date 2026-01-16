(function(){
const $ = (id) => document.getElementById(id);
const status = $("status");
const out = $("out");

function setStatus(text, kind){
  status.textContent = text;
  status.classList.remove("ok","bad");
  if (kind) status.classList.add(kind);
}

function bytesToSize(bytes){
  if (!bytes && bytes !== 0) return "—";
  const units = ["B","KB","MB","GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length-1){ v /= 1024; i++; }
  return `${v.toFixed(i===0?0:1)} ${units[i]}`;
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

const fileInput = $("file");
const drop = $("drop");
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const origInfo = $("origInfo");
const selInfo = $("selInfo");
const asJpg = $("asJpg");
const qWrap = $("qWrap");
const q = $("q");
const cropBtn = $("cropBtn");
const resetBtn = $("resetBtn");
const outImg = $("outImg");
const outInfo = $("outInfo");
const downloadBtn = $("downloadBtn");

let sourceFile = null;
let bitmap = null;
let imgW = 0, imgH = 0;
let sel = null; // {x,y,w,h}
let dragging = false;
let dragMode = null; // "new" or "move"
let startX = 0, startY = 0;
let moveOffX = 0, moveOffY = 0;
let lastBlob = null;
let lastName = "cropped.png";

function showQuality(){
  qWrap.style.display = asJpg.checked ? "" : "none";
}
asJpg.addEventListener("change", showQuality);
showQuality();

function withinSel(x,y){
  return sel && x>=sel.x && y>=sel.y && x<=sel.x+sel.w && y<=sel.y+sel.h;
}

function clampSel(){
  if (!sel) return;
  sel.w = Math.max(1, sel.w);
  sel.h = Math.max(1, sel.h);
  sel.x = Math.max(0, Math.min(sel.x, imgW - sel.w));
  sel.y = Math.max(0, Math.min(sel.y, imgH - sel.h));
}

function draw(){
  if (!bitmap) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0);

  if (sel){
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.clearRect(sel.x, sel.y, sel.w, sel.h);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sel.x+0.5, sel.y+0.5, sel.w, sel.h);
    ctx.restore();

    selInfo.textContent = `Selection: x=${sel.x}, y=${sel.y}, w=${sel.w}, h=${sel.h}`;
    cropBtn.disabled = false;
    resetBtn.disabled = false;
  } else {
    selInfo.textContent = "Selection: —";
    cropBtn.disabled = true;
    resetBtn.disabled = true;
  }
}

function setOrigInfo(){
  if (!sourceFile || !bitmap){ origInfo.textContent="—"; return; }
  origInfo.textContent = `Original: ${bitmap.width}×${bitmap.height} • ${bytesToSize(sourceFile.size)} • ${sourceFile.type || "image"}`;
}

async function loadFile(file){
  if (!file) return;
  if (!file.type.startsWith("image/")){
    setStatus("Please choose an image file.", "bad");
    return;
  }
  sourceFile = file;
  lastBlob = null;
  downloadBtn.disabled = true;
  out.textContent = "—";
  outInfo.textContent = "—";
  outImg.style.display = "none";
  sel = null;

  try{
    bitmap = await createImageBitmap(file);
    imgW = bitmap.width; imgH = bitmap.height;
    canvas.width = imgW; canvas.height = imgH;
    canvas.style.display = "";
    setOrigInfo();
    draw();
    setStatus("Loaded. Drag to select a crop area.", "ok");
  }catch{
    setStatus("Failed to decode image.", "bad");
  }
}

function pick(){ fileInput.click(); }
drop.addEventListener("click", pick);
drop.addEventListener("dragover",(e)=>{e.preventDefault(); drop.style.opacity="0.8";});
drop.addEventListener("dragleave",()=>{drop.style.opacity="";});
drop.addEventListener("drop",(e)=>{e.preventDefault(); drop.style.opacity=""; loadFile(e.dataTransfer.files && e.dataTransfer.files[0]);});
fileInput.addEventListener("change",()=>loadFile(fileInput.files && fileInput.files[0]));

function canvasPos(e){
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return {
    x: Math.round((e.clientX - r.left) * scaleX),
    y: Math.round((e.clientY - r.top) * scaleY),
  };
}

canvas.addEventListener("mousedown",(e)=>{
  if (!bitmap) return;
  const p = canvasPos(e);
  dragging = true;
  startX = p.x; startY = p.y;

  if (withinSel(p.x,p.y)){
    dragMode = "move";
    moveOffX = p.x - sel.x;
    moveOffY = p.y - sel.y;
  } else {
    dragMode = "new";
    sel = {x:p.x, y:p.y, w:1, h:1};
  }
  draw();
});

window.addEventListener("mousemove",(e)=>{
  if (!dragging || !bitmap) return;
  const p = canvasPos(e);

  if (dragMode === "new"){
    const x1 = startX, y1 = startY;
    const x2 = p.x, y2 = p.y;
    sel.x = Math.min(x1,x2);
    sel.y = Math.min(y1,y2);
    sel.w = Math.abs(x2-x1);
    sel.h = Math.abs(y2-y1);
    clampSel();
  } else if (dragMode === "move" && sel){
    sel.x = p.x - moveOffX;
    sel.y = p.y - moveOffY;
    clampSel();
  }
  draw();
});

window.addEventListener("mouseup",()=>{
  if (!dragging) return;
  dragging = false;
  dragMode = null;
  draw();
});

resetBtn.addEventListener("click",()=>{
  sel = null;
  draw();
  setStatus("Selection cleared.", "");
});

async function crop(){
  if (!bitmap || !sel){ setStatus("Select a crop area first.", "bad"); return; }
  setStatus("Cropping...", "");
  const c = document.createElement("canvas");
  c.width = sel.w;
  c.height = sel.h;
  const cctx = c.getContext("2d");
  cctx.drawImage(bitmap, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);

  const type = asJpg.checked ? "image/jpeg" : "image/png";
  const quality = asJpg.checked ? parseFloat(q.value) : 1;
  const blob = await new Promise((resolve)=> c.toBlob(resolve, type, quality));
  if (!blob){ setStatus("Failed to generate output.", "bad"); return; }

  lastBlob = blob;
  lastName = asJpg.checked ? "cropped.jpg" : "cropped.png";

  const url = URL.createObjectURL(blob);
  outImg.onload = ()=>URL.revokeObjectURL(url);
  outImg.src = url;
  outImg.style.display = "";
  outInfo.textContent = `Output: ${sel.w}×${sel.h} • ${bytesToSize(blob.size)} • ${type}`;
  out.textContent = `Crop: x=${sel.x}, y=${sel.y}, w=${sel.w}, h=${sel.h}`;
  downloadBtn.disabled = false;
  setStatus("Done.", "ok");
}

cropBtn.addEventListener("click", crop);

downloadBtn.addEventListener("click",()=>{
  if (!lastBlob) return;
  downloadBlob(lastBlob, lastName);
  setStatus("Downloaded.", "ok");
});

$("clearBtn").addEventListener("click",()=>{
  sourceFile=null; bitmap=null; sel=null; lastBlob=null;
  fileInput.value="";
  canvas.style.display="none";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  outImg.src=""; outImg.style.display="none";
  origInfo.textContent="—"; selInfo.textContent="Selection: —";
  outInfo.textContent="—"; out.textContent="—";
  downloadBtn.disabled=true;
  cropBtn.disabled=true;
  resetBtn.disabled=true;
  setStatus("Cleared.", "");
});

setStatus("Ready.", "");

})();
