'use strict';
function $(id){ return document.getElementById(id); }

function gcd(a,b){
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0){
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lcm(a,b){
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a,b) * b);
}

function update(){
  const a = parseInt($('a').value, 10);
  const b = parseInt($('b').value, 10);
  const out = $('out');
  const explain = $('explain');

  if (!Number.isFinite(a) || !Number.isFinite(b)){
    out.textContent = '—';
    explain.textContent = 'Enter two integers (positive, negative, or zero).';
    return;
  }

  const g = gcd(a,b);
  const l = lcm(a,b);

  out.innerHTML =
    `<div><strong>GCD</strong>(${a}, ${b}) = <strong>${g}</strong></div>` +
    `<div style="margin-top:6px;"><strong>LCM</strong>(${a}, ${b}) = <strong>${l}</strong></div>`;

  explain.textContent = 'GCD is the largest integer that divides both numbers. LCM is the smallest positive integer that is a multiple of both numbers.';
}

function init(){
  ['a','b'].forEach(id=> $(id).addEventListener('input', update));
  update();
}
document.addEventListener('DOMContentLoaded', init);
