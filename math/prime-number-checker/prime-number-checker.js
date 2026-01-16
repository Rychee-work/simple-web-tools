'use strict';
function $(id){ return document.getElementById(id); }

function isPrime(n){
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const r = Math.floor(Math.sqrt(n));
  for (let i=3; i<=r; i+=2){
    if (n % i === 0) return false;
  }
  return true;
}

function update(){
  const raw = $('n').value.trim();
  const n = Number(raw);
  const out = $('out');
  const explain = $('explain');

  if (raw === ''){
    out.textContent = '—';
    explain.textContent = 'Enter an integer ≥ 0.';
    return;
  }

  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0){
    out.textContent = '—';
    explain.textContent = 'Please enter a non-negative integer (0, 1, 2, 3…).';
    return;
  }

  if (n < 2){
    out.innerHTML = `<div><strong>${n}</strong> is <strong>not prime</strong>.</div>`;
    explain.textContent = 'Prime numbers are integers greater than 1 with exactly two divisors: 1 and itself.';
    return;
  }

  const ok = isPrime(n);
  out.innerHTML = `<div><strong>${n}</strong> is <strong>${ok ? 'prime' : 'not prime'}</strong>.</div>`;

  explain.textContent = ok
    ? 'It has no divisors other than 1 and itself (checked up to √n).'
    : 'It has at least one divisor other than 1 and itself.';
}

function init(){
  $('n').addEventListener('input', update);
  update();
}
document.addEventListener('DOMContentLoaded', init);
