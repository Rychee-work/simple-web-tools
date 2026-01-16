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
const origImg = $("origImg");
const outImg = $("outImg");
const origInfo = $("origInfo");
const outInfo = $("outInfo");
const wIn = $("w");
const hIn = $("h");
const keep = $("keep");
const asJpg = $("asJpg");
const qWrap = $("qWrap");
const q = $("q");
const downloadBtn = $("downloadBtn");

let sourceFile = null;
let sourceBitmap = null;
let lastBlob = null;
let lastName = "resized.png";

function showQuality(){
  qWrap.style.display = asJpg.checked ? "" : "none";
}
asJpg.addEventListener("change", showQuality);
showQuality();

function setOrigInfo(){
  if (!sourceFile || !sourceBitmap){
    origInfo.textContent = "—";
    return;
  }
  origInfo.textContent = `Original: ${sourceBitmap.width}×${sourceBitmap.height} • ${bytesToSize(sourceFile.size)} • ${sourceFile.type || "image"}`;
}

function loadFile(file){
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

  const url = URL.createObjectURL(file);
  origImg.onload = async () => {
    URL.revokeObjectURL(url);
    try {
sourceBitmap = await createImageBitmap(file);
wIn.value = sourceBitmap.width;
hIn.value = sourceBitmap.height;
setOrigInfo();
setStatus("Loaded.", "ok");
    } catch {
setStatus("Failed to decode image.", "bad");
    }
  };
  origImg.src = url;
  origImg.style.display = "";
}

function pick(){ fileInput.click(); }

drop.addEventListener("click", pick);
drop.addEventListener("dragover", (e)=>{ e.preventDefault(); drop.style.opacity = "0.8"; });
drop.addEventListener("dragleave", ()=>{ drop.style.opacity = ""; });
drop.addEventListener("drop", (e)=>{
  e.preventDefault();
  drop.style.opacity = "";
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  loadFile(f);
});
fileInput.addEventListener("change", ()=> loadFile(fileInput.files && fileInput.files[0]));

function syncAspect(changed){
  if (!sourceBitmap) return;
  if (!keep.checked) return;
  const ow = sourceBitmap.width;
  const oh = sourceBitmap.height;
  const w = parseInt(wIn.value, 10);
  const h = parseInt(hIn.value, 10);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return;
  if (changed === "w"){
    hIn.value = Math.max(1, Math.round((w/ow)*oh));
  } else if (changed === "h"){
    wIn.value = Math.max(1, Math.round((h/oh)*ow));
  }
}
wIn.addEventListener("input", ()=>syncAspect("w"));
hIn.addEventListener("input", ()=>syncAspect("h"));

async function resize(){
  if (!sourceFile || !sourceBitmap){
    setStatus("Select an image first.", "bad");
    return;
  }
  const w = parseInt(wIn.value, 10);
  const h = parseInt(hIn.value, 10);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w<1 || h<1){
    setStatus("Enter valid width and height.", "bad");
    return;
  }
  setStatus("Resizing...", "");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceBitmap, 0, 0, w, h);

  const type = asJpg.checked ? "image/jpeg" : "image/png";
  const quality = asJpg.checked ? parseFloat(q.value) : 1;

  const blob = await new Promise((resolve)=> canvas.toBlob(resolve, type, quality));
  if (!blob){
    setStatus("Failed to generate output.", "bad");
    return;
  }
  lastBlob = blob;
  lastName = asJpg.checked ? "resized.jpg" : "resized.png";

  const outUrl = URL.createObjectURL(blob);
  outImg.onload = () => URL.revokeObjectURL(outUrl);
  outImg.src = outUrl;
  outImg.style.display = "";
  outInfo.textContent = `Output: ${w}×${h} • ${bytesToSize(blob.size)} • ${type}`;
  out.textContent = "Tip: Use PNG for crisp graphics, JPG for photos.";
  downloadBtn.disabled = false;
  setStatus("Done.", "ok");
}

$("resizeBtn").addEventListener("click", resize);

downloadBtn.addEventListener("click", ()=>{
  if (!lastBlob) return;
  downloadBlob(lastBlob, lastName);
  setStatus("Downloaded.", "ok");
});

$("clearBtn").addEventListener("click", ()=>{
  sourceFile = null;
  sourceBitmap = null;
  lastBlob = null;
  fileInput.value = "";
  origImg.src = "";
  origImg.style.display = "none";
  outImg.src = "";
  outImg.style.display = "none";
  origInfo.textContent = "—";
  outInfo.textContent = "—";
  out.textContent = "—";
  $("w").value = "";
  $("h").value = "";
  downloadBtn.disabled = true;
  setStatus("Cleared.", "");
});

setStatus("Ready.", "");

})();
