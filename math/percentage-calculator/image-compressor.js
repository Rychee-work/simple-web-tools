(function(){
const $ = (id) => document.getElementById(id);
const status = $("status");
const out = $("out");

function setStatus(text, kind){
  status.textContent = text;
  status.classList.remove("ok","bad");
  if (kind) status.classList.add(kind);
}

function fmt(n){
  if (!isFinite(n)) return "—";
  return (Math.abs(n) >= 1e6) ? n.toPrecision(6) : n.toString();
}

function compute(){
  const base = parseFloat($("base").value);
  const pct = parseFloat($("pct").value);
  if (!isFinite(base) || !isFinite(pct)){
    out.textContent = "—";
    setStatus("Enter base and percent.", "");
    return;
  }
  const value = base * (pct / 100);
  const inc = base + value;
  const dec = base - value;

  out.textContent =
    `${pct}% of ${base} = ${fmt(value)}
` +
    `Increase: ${base} + ${fmt(value)} = ${fmt(inc)}
` +
    `Decrease: ${base} - ${fmt(value)} = ${fmt(dec)}

` +
    `Explanation: ${pct}% means ${pct}/100. We multiply the base by ${pct}/100.`;
  setStatus("Updated.", "ok");
}

["base","pct"].forEach(id => $(id).addEventListener("input", compute));

$("clearBtn").addEventListener("click", () => {
  $("base").value = "";
  $("pct").value = "";
  out.textContent = "—";
  setStatus("Cleared.", "");
  $("base").focus();
});

setStatus("Ready.", "");

})();
