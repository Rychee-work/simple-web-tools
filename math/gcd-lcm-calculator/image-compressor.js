(function(){
const $ = (id) => document.getElementById(id);
const status = $("status");
const out = $("out");

function setStatus(text, kind){
  status.textContent = text;
  status.classList.remove("ok","bad");
  if (kind) status.classList.add(kind);
}

function gcd(x, y){
  x = Math.abs(x); y = Math.abs(y);
  while (y !== 0){
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function compute(){
  const a = parseInt($("a").value, 10);
  const b = parseInt($("b").value, 10);
  if (!Number.isFinite(a) || !Number.isFinite(b)){
    out.textContent = "—";
    setStatus("Enter two integers.", "");
    return;
  }
  const g = gcd(a,b);
  const l = (a === 0 || b === 0) ? 0 : Math.abs(a*b)/g;

  out.textContent =
    `GCD(${a}, ${b}) = ${g}
` +
    `LCM(${a}, ${b}) = ${l}

` +
    `Explanation: GCD uses Euclid's algorithm. LCM = |a×b| ÷ GCD.`;
  setStatus("Updated.", "ok");
}

["a","b"].forEach(id => $(id).addEventListener("input", compute));

$("clearBtn").addEventListener("click", () => {
  $("a").value = "";
  $("b").value = "";
  out.textContent = "—";
  setStatus("Cleared.", "");
  $("a").focus();
});

setStatus("Ready.", "");

})();
