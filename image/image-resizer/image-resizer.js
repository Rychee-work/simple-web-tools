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
  naturalW: 0,
  naturalH: 0,
  outBlob: null,
  outType: 'image/png'
};

function updateSizeFieldsFromNatural(){
  $('w').value = String(state.naturalW);
  $('h').value = String(state.naturalH);
  $('keepAR').checked = true;
  $('keepAR').dispatchEvent(new Event('change'));
}

function updateInfo(){
  $('inInfo').textContent = state.file
    ? `${state.file.name} • ${state.naturalW}×${state.naturalH} • ${bytesToHuman(state.file.size)}`
    : '—';
  $('outInfo').textContent = state.outBlob
    ? `${bytesToHuman(state.outBlob.size)} • ${$('format').value.toUpperCase()}`
    : '—';
}

function recomputeHeightFromWidth(){
  const keep = $('keepAR').checked;
  if (!keep || !state.naturalW || !state.naturalH) return;
  const w = Math.max(1, parseInt($('w').value || '1', 10));
  const h = Math.round(w * (state.naturalH / state.naturalW));
  $('h').value = String(h);
}

function recomputeWidthFromHeight(){
  const keep = $('keepAR').checked;
  if (!keep || !state.naturalW || !state.naturalH) return;
  const h = Math.max(1, parseInt($('h').value || '1', 10));
  const w = Math.round(h * (state.naturalW / state.naturalH));
  $('w').value = String(w);
}

async function render(){
  if (!state.img) return;
  const w = Math.max(1, parseInt($('w').value || '1', 10));
  const h = Math.max(1, parseInt($('h').value || '1', 10));
  const fmt = $('format').value;

  const canvas = $('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: fmt !== 'jpg' });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fmt === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,w,h);
  }
  ctx.drawImage(state.img, 0, 0, w, h);

  const type = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
  const q = fmt === 'jpg'
    ? Math.min(1, Math.max(0.1, parseFloat($('quality').value || '0.9')))
    : undefined;

  const blob = await canvasToBlob(canvas, type, q);
  if (!blob) throw new Error('Failed to export image');

  state.outBlob = blob;
  state.outType = type;

  $('preview').src = canvas.toDataURL(type, q);
  enable($('downloadBtn'), true);
  updateInfo();
  setStatus('Ready.');
}

function reset(){
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state = { file:null, img:null, objectUrl:null, naturalW:0, naturalH:0, outBlob:null, outType:'image/png' };
  $('origPreview').removeAttribute('src');
  $('preview').removeAttribute('src');
  $('inInfo').textContent = '—';
  $('outInfo').textContent = '—';
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
    state.naturalW = img.naturalWidth;
    state.naturalH = img.naturalHeight;

    $('origPreview').src = url;
    updateSizeFieldsFromNatural();
    updateInfo();

    setStatus('Loaded. Adjust size and download.');
    await render();
  } catch (e) {
    console.error(e);
    setStatus(e.message || 'Failed to load.');
  }
}

function init(){
  setupDrop($('drop'), $('file'), onFiles);

  $('keepAR').addEventListener('change', ()=>{
    if ($('keepAR').checked) recomputeHeightFromWidth();
  });

  $('w').addEventListener('input', ()=>{ recomputeHeightFromWidth(); render().catch(()=>{}); });
  $('h').addEventListener('input', ()=>{ recomputeWidthFromHeight(); render().catch(()=>{}); });

  $('format').addEventListener('change', ()=>{
    const isJpg = $('format').value === 'jpg';
    $('qualityWrap').style.display = isJpg ? 'block' : 'none';
    render().catch(()=>{});
  });

  $('quality').addEventListener('input', ()=>{
    $('qVal').textContent = String($('quality').value);
    render().catch(()=>{});
  });

  $('clearBtn').addEventListener('click', reset);

  $('downloadBtn').addEventListener('click', ()=>{
    if (!state.outBlob) return;
    const ext = state.outType === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = (state.file?.name || 'image').replace(/\.[^.]+$/, '');
    downloadBlob(state.outBlob, `${baseName}-resized.${ext}`);
  });

  setStatus('Ready.');
  enable($('downloadBtn'), false);
  $('qualityWrap').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);
