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
const asWebp = $("asWebp");
const q = $("q");
const maxW = $("maxW");
const maxH = $("maxH");
const keep = $("keep");
const downloadBtn = $("downloadBtn");

let sourceFile = null;
let sourceBitmap = null;
let lastBlob = null;
let lastName = "compressed.jpg";

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
    try{
      sourceBitmap = await createImageBitmap(file);
      origInfo.textContent = `Original: ${sourceBitmap.width}×${sourceBitmap.height} • ${bytesToSize(file.size)} • ${file.type}`;
      setStatus("Loaded.", "ok");
    }catch{
      setStatus("Failed to decode image.", "bad");
    }
  };
  origImg.src = url;
  origImg.style.display = "";
}

function pick(){ fileInput.click(); }
drop.addEventListener("click", pick);
drop.addEventListener("dragover", (e)=>{ e.preventDefault(); drop.style.opacity="0.8"; });
drop.addEventListener("dragleave", ()=>{ drop.style.opacity=""; });
drop.addEventListener("drop", (e)=>{ e.preventDefault(); drop.style.opacity=""; loadFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
fileInput.addEventListener("change", ()=> loadFile(fileInput.files && fileInput.files[0]));

function fitSize(w,h,mw,mh){
  mw = mw || 0; mh = mh || 0;
  if (!mw && !mh) return {w,h};
  if (!keep.checked){
    return {w: mw||w, h: mh||h};
  }
  let nw=w, nh=h;
  if (mw && nw>mw){ nh=Math.round(nh*(mw/nw)); nw=mw; }
  if (mh && nh>mh){ nw=Math.round(nw*(mh/nh)); nh=mh; }
  return {w:Math.max(1,nw), h:Math.max(1,nh)};
}

async function compress(){
  if (!sourceFile || !sourceBitmap){
    setStatus("Select an image first.", "bad"); return;
  }
  const quality = parseFloat(q.value);
  const mw = parseInt(maxW.value,10) || 0;
  const mh = parseInt(maxH.value,10) || 0;
  const target = fitSize(sourceBitmap.width, sourceBitmap.height, mw, mh);

  setStatus("Compressing...", "");
  const canvas=document.createElement("canvas");
  canvas.width=target.w;
  canvas.height=target.h;
  const ctx=canvas.getContext("2d");
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(sourceBitmap,0,0,target.w,target.h);

  const type = asWebp.checked ? "image/webp" : "image/jpeg";
  const blob = await new Promise((resolve)=> canvas.toBlob(resolve, type, quality));
  if (!blob){ setStatus("Failed to generate output.", "bad"); return; }

  lastBlob=blob;
  lastName = asWebp.checked ? "compressed.webp" : "compressed.jpg";

  const ratio = sourceFile.size ? (blob.size/sourceFile.size) : 0;
  out.textContent = `Quality: ${quality}
Resize: ${target.w}×${target.h}
Compression ratio: ${(ratio*100).toFixed(1)}%

Tip: Lower quality reduces size more.`;
  outInfo.textContent = `Output: ${target.w}×${target.h} • ${bytesToSize(blob.size)} • ${type}`;

  const outUrl=URL.createObjectURL(blob);
  outImg.onload=()=>URL.revokeObjectURL(outUrl);
  outImg.src=outUrl;
  outImg.style.display="";
  downloadBtn.disabled=false;
  setStatus("Done.", "ok");
}

$("compressBtn").addEventListener("click", compress);

downloadBtn.addEventListener("click", ()=>{
  if (!lastBlob) return;
  downloadBlob(lastBlob, lastName);
  setStatus("Downloaded.", "ok");
});

$("clearBtn").addEventListener("click", ()=>{
  sourceFile=null; sourceBitmap=null; lastBlob=null;
  fileInput.value="";
  origImg.src=""; origImg.style.display="none";
  outImg.src=""; outImg.style.display="none";
  origInfo.textContent="—"; outInfo.textContent="—";
  out.textContent="—";
  downloadBtn.disabled=true;
  setStatus("Cleared.", "");
});

setStatus("Ready.", "");

})();
