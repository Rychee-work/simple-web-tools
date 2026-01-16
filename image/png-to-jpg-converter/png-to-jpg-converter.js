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
  outBlob: null
};

function updateInfo(){
  $('inInfo').textContent = state.file
    ? `${state.file.name} • ${state.naturalW}×${state.naturalH} • ${bytesToHuman(state.file.size)}`
    : '—';
  $('outInfo').textContent = state.outBlob ? `${bytesToHuman(state.outBlob.size)} • JPG` : '—';
}

async function render(){
  if (!state.img) return;

  const bg = $('bg').value || '#ffffff';
  const q = Math.min(1, Math.max(0.1, parseFloat($('quality').value || '0.9')));

  const canvas = $('canvas');
  canvas.width = state.naturalW;
  canvas.height = state.naturalH;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.img, 0, 0);

  const blob = await canvasToBlob(canvas, 'image/jpeg', q);
  if (!blob) throw new Error('Failed to export JPG');
  state.outBlob = blob;

  $('preview').src = canvas.toDataURL('image/jpeg', q);
  enable($('downloadBtn'), true);
  updateInfo();
  setStatus('Ready.');
}

function reset(){
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state = { file:null, img:null, objectUrl:null, naturalW:0, naturalH:0, outBlob:null };
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

  // Many PNGs have type image/png, but some browsers may show image/x-png.
  const isPng = (file.type === 'image/png') || (file.name.toLowerCase().endsWith('.png'));
  if (!isPng) {
    setStatus('Please drop a PNG file.');
    return;
  }

  reset();
  setStatus('Loading PNG…');
  try {
    const { img, url } = await readImageFile(file);
    state.file = file;
    state.img = img;
    state.objectUrl = url;
    state.naturalW = img.naturalWidth;
    state.naturalH = img.naturalHeight;

    $('origPreview').src = url;
    updateInfo();

    setStatus('Loaded. Choose background and download.');
    await render();
  } catch (e) {
    console.error(e);
    setStatus(e.message || 'Failed to load.');
  }
}

function init(){
  setupDrop($('drop'), $('file'), onFiles);

  $('bg').addEventListener('input', ()=>{ render().catch(()=>{}); });
  $('quality').addEventListener('input', ()=>{
    $('qVal').textContent = String($('quality').value);
    render().catch(()=>{});
  });

  $('clearBtn').addEventListener('click', reset);

  $('downloadBtn').addEventListener('click', ()=>{
    if (!state.outBlob) return;
    const baseName = (state.file?.name || 'image').replace(/\.[^.]+$/, '');
    downloadBlob(state.outBlob, `${baseName}.jpg`);
  });

  setStatus('Ready.');
  enable($('downloadBtn'), false);
  $('qVal').textContent = String($('quality').value);
}

document.addEventListener('DOMContentLoaded', init);
