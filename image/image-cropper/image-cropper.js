'use strict';

function $(id){ return document.getElementById(id); }

function bytesToHuman(n){
  if (!Number.isFinite(n) || n <= 0) return '—';
  const units = ['B','KB','MB','GB'];
  let i = 0;
  while (n >= 1024 && i < units.length-1){ n /= 1024; i++; }
  const fixed = (i===0) ? 0 : (n < 10 ? 2 : 1);
  return `${n.toFixed(fixed)} ${units[i]}`;
}

function setStatus(msg){ const el = $('status'); if (el) el.textContent = msg; }

function enable(el, on){ if (!el) return; el.disabled = !on; el.setAttribute('aria-disabled', String(!on)); }

function setupDrop(dropEl, fileInput, onFiles){
  if (!dropEl || !fileInput) return;
  const prevent = (e)=>{ e.preventDefault(); e.stopPropagation(); };
  ['dragenter','dragover','dragleave','drop'].forEach(ev=> dropEl.addEventListener(ev, prevent));
  dropEl.addEventListener('dragenter', ()=> dropEl.classList.add('is-dragover'));
  dropEl.addEventListener('dragover', ()=> dropEl.classList.add('is-dragover'));
  dropEl.addEventListener('dragleave', ()=> dropEl.classList.remove('is-dragover'));
  dropEl.addEventListener('drop', (e)=>{
    dropEl.classList.remove('is-dragover');
    const files = e.dataTransfer?.files;
    if (files && files.length) onFiles(files);
  });
  dropEl.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', ()=> {
    if (fileInput.files && fileInput.files.length) onFiles(fileInput.files);
  });
}

async function readImageFile(file){
  if (!file) throw new Error('No file');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  await new Promise((resolve, reject)=>{
    img.onload = resolve;
    img.onerror = ()=> reject(new Error('Failed to load image'));
    img.src = url;
  });
  return { img, url };
}

function canvasToBlob(canvas, type, quality){
  return new Promise((resolve)=> canvas.toBlob(resolve, type, quality));
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1500);
}


let state = {
  file: null,
  img: null,
  objectUrl: null,
  iw: 0,
  ih: 0,
  // canvas mapping
  cw: 0,
  ch: 0,
  scale: 1,
  offX: 0,
  offY: 0,
  // selection in image space
  sel: null, // {x,y,w,h}
  dragging: false,
  dragMode: null, // 'new' | 'move'
  startPt: null, // in image space
  outBlob: null,
};

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

function canvasToImagePoint(cx, cy){
  const x = (cx - state.offX) / state.scale;
  const y = (cy - state.offY) / state.scale;
  return { x, y };
}

function imageToCanvasRect(r){
  return {
    x: state.offX + r.x * state.scale,
    y: state.offY + r.y * state.scale,
    w: r.w * state.scale,
    h: r.h * state.scale,
  };
}

function computeFit(){
  const canvas = $('canvas');
  const maxW = canvas.parentElement.clientWidth;
  const targetW = Math.min(900, Math.max(320, maxW));
  const ratio = state.ih ? (state.iw / state.ih) : 1;
  const targetH = Math.round(targetW / ratio);

  canvas.width = targetW;
  canvas.height = targetH;

  state.cw = canvas.width;
  state.ch = canvas.height;

  const s = Math.min(state.cw / state.iw, state.ch / state.ih);
  state.scale = s;
  state.offX = Math.round((state.cw - state.iw * s) / 2);
  state.offY = Math.round((state.ch - state.ih * s) / 2);
}

function draw(){
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // background
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(state.img, state.offX, state.offY, state.iw * state.scale, state.ih * state.scale);

  // selection overlay
  if (state.sel){
    const r = imageToCanvasRect(state.sel);
    // dim outside
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.rect(0,0,canvas.width,canvas.height);
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.fill('evenodd');
    ctx.restore();

    // border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, Math.max(0, r.w - 2), Math.max(0, r.h - 2));
    ctx.restore();
  }
}

function setStatusText(){
  if (!state.img){
    setStatus('Ready.');
    return;
  }
  if (!state.sel){
    setStatus('Drag on the image to select a crop area.');
  } else {
    setStatus('Crop area selected. Download the cropped image.');
  }
}

function updateInfo(){
  $('inInfo').textContent = state.file ? `${state.file.name} • ${state.iw}×${state.ih} • ${bytesToHuman(state.file.size)}` : '—';
  if (state.sel){
    $('selInfo').textContent = `${Math.round(state.sel.w)}×${Math.round(state.sel.h)} px`;
  } else {
    $('selInfo').textContent = '—';
  }
}

function normalizeSel(r){
  let x = r.x, y = r.y, w = r.w, h = r.h;
  if (w < 0){ x += w; w = -w; }
  if (h < 0){ y += h; h = -h; }
  x = clamp(x, 0, state.iw);
  y = clamp(y, 0, state.ih);
  w = clamp(w, 0, state.iw - x);
  h = clamp(h, 0, state.ih - y);
  if (w < 1 || h < 1) return null;
  return { x, y, w, h };
}

function onPointerDown(e){
  if (!state.img) return;
  const rect = $('canvas').getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const p = canvasToImagePoint(cx, cy);

  // If click inside current selection => move
  if (state.sel){
    const s = state.sel;
    if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h){
      state.dragMode = 'move';
      state.startPt = { x: p.x, y: p.y };
      state.dragging = true;
      $('canvas').setPointerCapture(e.pointerId);
      return;
    }
  }

  // Start new selection
  state.dragMode = 'new';
  state.startPt = { x: p.x, y: p.y };
  state.sel = { x: p.x, y: p.y, w: 0, h: 0 };
  state.dragging = true;
  $('canvas').setPointerCapture(e.pointerId);
  draw();
  updateInfo();
  setStatusText();
}

function onPointerMove(e){
  if (!state.dragging || !state.img) return;
  const rect = $('canvas').getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const p = canvasToImagePoint(cx, cy);

  if (state.dragMode === 'new'){
    state.sel = normalizeSel({ x: state.startPt.x, y: state.startPt.y, w: p.x - state.startPt.x, h: p.y - state.startPt.y }) || null;
  } else if (state.dragMode === 'move' && state.sel){
    const dx = p.x - state.startPt.x;
    const dy = p.y - state.startPt.y;
    state.startPt = { x: p.x, y: p.y };
    const s = state.sel;
    const nx = clamp(s.x + dx, 0, state.iw - s.w);
    const ny = clamp(s.y + dy, 0, state.ih - s.h);
    state.sel = { ...s, x: nx, y: ny };
  }

  draw();
  updateInfo();
  setStatusText();
}

function onPointerUp(e){
  if (!state.dragging) return;
  state.dragging = false;
  state.dragMode = null;
  state.startPt = null;
  draw();
  updateInfo();
  setStatusText();
  enable($('downloadBtn'), !!state.sel);
}

function reset(){
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state = { file:null, img:null, objectUrl:null, iw:0, ih:0, cw:0, ch:0, scale:1, offX:0, offY:0, sel:null, dragging:false, dragMode:null, startPt:null, outBlob:null };
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  $('origPreview').removeAttribute('src');
  $('inInfo').textContent = '—';
  $('selInfo').textContent = '—';
  enable($('downloadBtn'), false);
  setStatus('Ready.');
}

async function onFiles(files){
  const file = files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    setStatus('Please drop an image file.');
    return;
  }
  reset();
  setStatus('Loading image…');
  try {
    const { img, url } = await readImageFile(file);
    state.file = file;
    state.img = img;
    state.objectUrl = url;
    state.iw = img.naturalWidth;
    state.ih = img.naturalHeight;

    $('origPreview').src = url;

    computeFit();
    state.sel = null;
    draw();
    updateInfo();
    setStatusText();
  } catch (e) {
    console.error(e);
    setStatus(e.message || 'Failed to load.');
  }
}

async function exportCrop(){
  if (!state.img || !state.sel) return;

  const fmt = $('format').value; // png/jpg
  const type = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
  const q = fmt === 'jpg'
    ? Math.min(1, Math.max(0.1, parseFloat($('quality').value || '0.92')))
    : undefined;

  const s = state.sel;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.round(s.w);
  outCanvas.height = Math.round(s.h);
  const ctx = outCanvas.getContext('2d', { alpha: type !== 'image/jpeg' });

  if (type === 'image/jpeg'){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,outCanvas.width,outCanvas.height);
  }
  ctx.drawImage(state.img, s.x, s.y, s.w, s.h, 0, 0, outCanvas.width, outCanvas.height);

  const blob = await canvasToBlob(outCanvas, type, q);
  if (!blob) throw new Error('Failed to export');
  return { blob, type };
}

function init(){
  setupDrop($('drop'), $('file'), onFiles);

  const canvas = $('canvas');
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  window.addEventListener('resize', ()=>{
    if (!state.img) return;
    computeFit();
    draw();
  });

  $('format').addEventListener('change', ()=>{
    $('qualityWrap').style.display = ($('format').value === 'jpg') ? 'block' : 'none';
  });

  $('quality').addEventListener('input', ()=>{ $('qVal').textContent = String($('quality').value); });

  $('resetBtn').addEventListener('click', ()=>{
    state.sel = null;
    draw();
    updateInfo();
    setStatusText();
    enable($('downloadBtn'), false);
  });

  $('clearBtn').addEventListener('click', reset);

  $('downloadBtn').addEventListener('click', async ()=>{
    if (!state.sel) return;
    setStatus('Exporting…');
    try {
      const out = await exportCrop();
      const ext = out.type === 'image/jpeg' ? 'jpg' : 'png';
      const baseName = (state.file?.name || 'image').replace(/\.[^.]+$/, '');
      downloadBlob(out.blob, `${baseName}-crop.${ext}`);
      setStatus('Downloaded.');
      setTimeout(setStatusText, 800);
    } catch (e){
      console.error(e);
      setStatus(e.message || 'Export failed.');
    }
  });

  $('qualityWrap').style.display = 'none';
  $('qVal').textContent = String($('quality').value);
  setStatus('Ready.');
  enable($('downloadBtn'), false);
}

document.addEventListener('DOMContentLoaded', init);
