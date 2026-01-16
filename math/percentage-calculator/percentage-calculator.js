'use strict';
function $(id){ return document.getElementById(id); }

function fmt(n){
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const d = abs >= 100 ? 2 : abs >= 10 ? 3 : 4;
  return n.toFixed(d).replace(/\.?0+$/,'');
}

function update(){
  const base = parseFloat($('base').value);
  const pct  = parseFloat($('pct').value);

  const out = $('out');
  const explain = $('explain');

  if (!Number.isFinite(base) || !Number.isFinite(pct)){
    out.textContent = '—';
    explain.textContent = 'Enter a base value and a percentage.';
    return;
  }

  const value = base * (pct / 100);
  const inc = base + value;
  const dec = base - value;

  out.innerHTML =
    `<div><strong>${fmt(pct)}%</strong> of <strong>${fmt(base)}</strong> = <strong>${fmt(value)}</strong></div>` +
    `<div class="small-note" style="margin-top:8px;">Increase: ${fmt(base)} + ${fmt(value)} = ${fmt(inc)} • Decrease: ${fmt(base)} - ${fmt(value)} = ${fmt(dec)}</div>`;

  explain.textContent = 'Percentage means "per 100". We multiply the base value by (percentage ÷ 100).';
}

function init(){
  ['base','pct'].forEach(id => $(id).addEventListener('input', update));
  update();
}
document.addEventListener('DOMContentLoaded', init);
