function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function save() {
  const band = document.getElementById("band").value;
  const score = document.getElementById("score").value;

  if (!band) {
    alert("Enter Band ID");
    return;
  }

  const record = { band, score };

  let data = JSON.parse(localStorage.getItem("records") || "[]");
  data.push(record);

  localStorage.setItem("records", JSON.stringify(data));

  alert("Saved!");

  calculate(score);
  loadRecords();
}

function calculate(score) {
  let result = "";

  if (score >= 8) result = "ELITE - BREED";
  else if (score >= 6) result = "KEEP";
  else if (score >= 4) result = "HOLD";
  else result = "CULL";

  document.getElementById("result").innerText = result;
}

function loadRecords() {
  let data = JSON.parse(localStorage.getItem("records") || "[]");

  const list = document.getElementById("recordsList");

  list.innerHTML = data.map(r => 
    `<div>${r.band} - Score: ${r.score}</div>`
  ).join("");
}

window.onload = loadRecords;