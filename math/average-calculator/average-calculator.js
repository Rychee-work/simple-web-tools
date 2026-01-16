'use strict';
function $(id){ return document.getElementById(id); }

function parseNumbers(text){
  // Split by commas, spaces, or new lines
  const parts = text.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean);
  const nums = [];
  for (const p of parts){
    const n = Number(p);
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

function fmt(n){
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const d = abs >= 100 ? 2 : abs >= 10 ? 3 : 4;
  return n.toFixed(d).replace(/\.?0+$/,'');
}

function update(){
  const nums = parseNumbers($('nums').value);
  const out = $('out');
  const explain = $('explain');

  if (!nums.length){
    out.textContent = '—';
    explain.textContent = 'Enter numbers separated by commas, spaces, or new lines.';
    return;
  }

  const sum = nums.reduce((a,b)=>a+b, 0);
  const avg = sum / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  out.innerHTML =
    `<div><strong>Average</strong> = ${fmt(avg)}</div>` +
    `<div class="small-note" style="margin-top:8px;">Count: ${nums.length} • Sum: ${fmt(sum)} • Min: ${fmt(min)} • Max: ${fmt(max)}</div>`;

  explain.textContent = 'The average (mean) is the sum of values divided by how many values you have.';
}

function init(){
  $('nums').addEventListener('input', update);
  $('clearBtn').addEventListener('click', ()=>{ $('nums').value=''; update(); });
  update();
}
document.addEventListener('DOMContentLoaded', init);
