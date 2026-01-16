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
const bg = $("bg");
const q = $("q");
const downloadBtn = $("downloadBtn");

let sourceFile = null;
let bitmap = null;
let lastBlob = null;

function loadFile(file){
  if (!file) return;
  if (file.type !== "image/png"){
    setStatus("Please choose a PNG file.", "bad");
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
      bitmap = await createImageBitmap(file);
      origInfo.textContent = `Original: ${bitmap.width}×${bitmap.height} • ${bytesToSize(file.size)} • PNG`;
      setStatus("Loaded.", "ok");
    }catch{
      setStatus("Failed to decode PNG.", "bad");
    }
  };
  origImg.src = url;
  origImg.style.display = "";
}

function pick(){ fileInput.click(); }
drop.addEventListener("click", pick);
drop.addEventListener("dragover",(e)=>{e.preventDefault(); drop.style.opacity="0.8";});
drop.addEventListener("dragleave",()=>{drop.style.opacity="";});
drop.addEventListener("drop",(e)=>{e.preventDefault(); drop.style.opacity=""; loadFile(e.dataTransfer.files && e.dataTransfer.files[0]);});
fileInput.addEventListener("change",()=>loadFile(fileInput.files && fileInput.files[0]));

async function convert(){
  if (!sourceFile || !bitmap){ setStatus("Select a PNG first.", "bad"); return; }
  setStatus("Converting...", "");
  const canvas=document.createElement("canvas");
  canvas.width=bitmap.width;
  canvas.height=bitmap.height;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle = bg.value || "#ffffff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0);

  const quality = parseFloat(q.value);
  const blob = await new Promise((resolve)=>canvas.toBlob(resolve,"image/jpeg",quality));
  if (!blob){ setStatus("Failed to generate JPG.", "bad"); return; }
  lastBlob = blob;

  const url=URL.createObjectURL(blob);
  outImg.onload=()=>URL.revokeObjectURL(url);
  outImg.src=url;
  outImg.style.display="";
  outInfo.textContent = `Output: ${bitmap.width}×${bitmap.height} • ${bytesToSize(blob.size)} • JPG`;
  out.textContent = `Background: ${bg.value}
Quality: ${quality}

Tip: Lower quality reduces size more.`;
  downloadBtn.disabled=false;
  setStatus("Done.", "ok");
}

$("convertBtn").addEventListener("click", convert);

downloadBtn.addEventListener("click",()=>{
  if (!lastBlob) return;
  downloadBlob(lastBlob, "converted.jpg");
  setStatus("Downloaded.", "ok");
});

$("clearBtn").addEventListener("click",()=>{
  sourceFile=null; bitmap=null; lastBlob=null;
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
