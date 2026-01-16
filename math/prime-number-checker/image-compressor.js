(function(){
const $ = (id) => document.getElementById(id);
const status = $("status");
const out = $("out");

function setStatus(text, kind){
  status.textContent = text;
  status.classList.remove("ok","bad");
  if (kind) status.classList.add(kind);
}

function checkPrime(n){
  if (n <= 1) return {prime:false, reason:"Numbers ≤ 1 are not prime."};
  if (n === 2) return {prime:true};
  if (n % 2 === 0) return {prime:false, divisor:2, reason:"Even numbers > 2 are not prime."};
  const limit = Math.floor(Math.sqrt(n));
  for (let d = 3; d <= limit; d += 2){
    if (n % d === 0) return {prime:false, divisor:d, reason:`Divisible by ${d}.`};
  }
  return {prime:true};
}

function compute(){
  const n = parseInt($("n").value, 10);
  if (!Number.isFinite(n)){
    out.textContent = "—";
    setStatus("Enter an integer.", "");
    return;
  }
  const r = checkPrime(n);
  if (r.prime){
    out.textContent = `${n} is prime.

Explanation: no integer divisor exists between 2 and √n.`;
    setStatus("Prime.", "ok");
  }else{
    const extra = r.divisor ? `Divisor: ${r.divisor}` : "—";
    out.textContent = `${n} is NOT prime.
${extra}

Explanation: ${r.reason}`;
    setStatus("Not prime.", "bad");
  }
}

$("n").addEventListener("input", compute);

$("clearBtn").addEventListener("click", () => {
  $("n").value = "";
  out.textContent = "—";
  setStatus("Cleared.", "");
  $("n").focus();
});

setStatus("Ready.", "");

})();
