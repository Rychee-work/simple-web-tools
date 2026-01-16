(function(){
const $ = (id) => document.getElementById(id);
const status = $("status");
const out = $("out");

function setStatus(text, kind){
  status.textContent = text;
  status.classList.remove("ok","bad");
  if (kind) status.classList.add(kind);
}

function parseNumbers(text){
  return (text || "")
    .split(/[^0-9eE+\-.]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => Number.isFinite(n));
}

function compute(){
  const nums = parseNumbers($("in").value);
  if (!nums.length){
    out.textContent = "—";
    setStatus("Paste some numbers.", "");
    return;
  }
  const sum = nums.reduce((a,b)=>a+b,0);
  const avg = sum / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  out.textContent =
    `Count: ${nums.length}
`+
    `Sum: ${sum}
`+
    `Average: ${avg}
`+
    `Min: ${min}
`+
    `Max: ${max}

`+
    `Explanation: average = sum ÷ count.`;
  setStatus("Updated.", "ok");
}

$("in").addEventListener("input", compute);

$("clearBtn").addEventListener("click", () => {
  $("in").value = "";
  out.textContent = "—";
  setStatus("Cleared.", "");
  $("in").focus();
});

setStatus("Ready.", "");

})();
