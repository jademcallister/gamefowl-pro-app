// Health Check: symptom checker, per-bird photo log and treatment tracker.
// Photos and entries are stored on this device in IndexedDB.

(function () {
  const state = { area: "all", query: "", selected: new Set() };
  const DB_NAME = "gamefowl-health";
  let dbPromise = null;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const symptomById = Object.fromEntries(HEALTH_SYMPTOMS.map((s) => [s.id, s]));
  const today = () => new Date().toISOString().slice(0, 10);
  const LEVELS = {
    home: { label: "Home care OK", cls: "lv-home" },
    vet: { label: "See a vet soon", cls: "lv-vet" },
    urgent: { label: "Vet now", cls: "lv-urgent" },
  };

  // ---------- storage ----------
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const store = req.result.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
          store.createIndex("band", "band");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction("entries", mode);
      const out = fn(t.objectStore("entries"));
      t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
      t.onerror = () => reject(t.error);
    });
  }
  const addEntry = (e) => tx("readwrite", (s) => s.add({ ...e, created: Date.now() }));
  const putEntry = (e) => tx("readwrite", (s) => s.put(e));
  const deleteEntry = (id) => tx("readwrite", (s) => s.delete(id));
  const allEntries = () => tx("readonly", (s) => s.getAll());

  async function knownBands() {
    const bands = new Set();
    try { JSON.parse(localStorage.getItem("records") || "[]").forEach((r) => r.band && bands.add(r.band)); } catch (e) {}
    try { (await allEntries()).forEach((e) => bands.add(e.band)); } catch (e) {}
    return [...bands].sort();
  }
  async function refreshBandList() {
    const bands = await knownBands();
    $("hBandList").innerHTML = bands.map((b) => `<option value="${esc(b)}">`).join("");
  }

  // ---------- checker ----------
  function renderAreas() {
    const counts = {};
    state.selected.forEach((id) => { const a = symptomById[id].area; counts[a] = (counts[a] || 0) + 1; });
    const chips = [{ id: "all", name: "All areas", icon: "🔎" }, ...HEALTH_AREAS].map((a) => `
      <button type="button" class="area-chip ${state.area === a.id ? "on" : ""}" data-area="${a.id}">
        <span class="area-ic">${a.icon}</span><span>${esc(a.name)}</span>${counts[a.id] ? `<b class="area-count">${counts[a.id]}</b>` : ""}
      </button>`).join("");
    $("hAreas").innerHTML = chips;
  }

  function renderSymptoms() {
    const q = state.query.trim().toLowerCase();
    const list = HEALTH_SYMPTOMS.filter((s) =>
      (state.area === "all" || s.area === state.area) && (!q || s.name.toLowerCase().includes(q)));
    $("hSymptoms").innerHTML = list.length ? list.map((s) => `
      <label class="sym ${state.selected.has(s.id) ? "on" : ""}">
        <input type="checkbox" data-sym="${s.id}" ${state.selected.has(s.id) ? "checked" : ""}>
        <span>${esc(s.name)}</span>${s.red ? '<em class="red-dot" title="Warning sign">!</em>' : ""}
      </label>`).join("") : `<p class="muted">No symptoms match “${esc(state.query)}”.</p>`;
    const sel = [...state.selected].map((id) => `<button type="button" class="pill" data-unsel="${id}">${esc(symptomById[id].name)} ✕</button>`).join("");
    $("hSelected").innerHTML = sel || '<span class="muted">No symptoms picked yet.</span>';
    $("hCheckBtn").disabled = state.selected.size === 0;
    $("hCheckBtn").textContent = state.selected.size ? `Check ${state.selected.size} symptom${state.selected.size > 1 ? "s" : ""}` : "Pick symptoms to check";
  }

  function score() {
    const picked = state.selected;
    return HEALTH_CONDITIONS.map((c) => {
      const entries = Object.entries(c.signs);
      const total = entries.reduce((n, [, w]) => n + w, 0);
      const matched = entries.filter(([id]) => picked.has(id));
      const got = matched.reduce((n, [, w]) => n + w, 0);
      // Blend: how much of the condition is explained, and how much of what you saw it explains.
      const coverage = got / total;
      const explains = matched.length / picked.size;
      return { c, matched: matched.map(([id]) => id), pct: Math.round((coverage * 0.6 + explains * 0.4) * 100), got };
    }).filter((r) => r.got > 0).sort((a, b) => b.pct - a.pct || b.got - a.got).slice(0, 6);
  }

  function resultCard(r, i) {
    const c = r.c, lv = LEVELS[c.level];
    return `
      <article class="cond ${i === 0 ? "open" : ""}">
        <button type="button" class="cond-head" data-toggle>
          <span class="cond-rank">${i + 1}</span>
          <span class="cond-title">${esc(c.name)}
            <span class="cond-tags"><span class="lv ${lv.cls}">${lv.label}</span>${c.contagious ? '<span class="tag-cont">Contagious</span>' : ""}</span>
          </span>
          <span class="match"><span class="match-bar"><i style="width:${r.pct}%"></i></span>${r.pct}%</span>
        </button>
        <div class="cond-body">
          <p class="matched">Matches: ${r.matched.map((id) => esc(symptomById[id].name)).join(" · ")}</p>
          <h4>What it is</h4><p>${esc(c.about)}</p>
          <h4>What to look for</h4><p>${esc(c.check)}</p>
          <h4>What to do</h4><ol>${c.care.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          <h4>Call a vet if</h4><p>${esc(c.vet)}</p>
          ${imagesHtml(c.id)}
          ${refsHtml(c.id)}
        </div>
      </article>`;
  }

  function imagesHtml(id) {
    const imgs = (typeof HEALTH_IMAGES !== "undefined" && HEALTH_IMAGES[id]) || [];
    if (!imgs.length) return "";
    return `<h4>Photos</h4><div class="cond-imgs">${imgs.map((im) => `
      <figure>
        <a href="${esc(im.remote || im.src)}" target="_blank" rel="noopener"><img src="${esc(im.src)}" alt="${esc(im.caption)}" loading="lazy"${im.remote ? ` onerror="this.onerror=null;this.src='${esc(im.remote)}'"` : ""}></a>
        <figcaption>${esc(im.caption)}<br><span class="credit">Photo: <a href="${esc(im.sourceUrl)}" target="_blank" rel="noopener">${esc(im.credit || "Wikimedia Commons")}</a>, <a href="${esc(im.licenseUrl || im.sourceUrl)}" target="_blank" rel="noopener">${esc(im.license)}</a></span></figcaption>
      </figure>`).join("")}</div>`;
  }

  function refsHtml(id) {
    const links = typeof healthRefLinks === "function" ? healthRefLinks(id) : [];
    if (!links.length) return "";
    const icon = { merck: "📘", forum: "💬", pdvm: "🩺", extension: "🎓", images: "🖼️" };
    return `<h4>References &amp; real cases</h4><ul class="refs">${links.map((l) =>
      `<li>${icon[l.kind] || "🔗"} <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a></li>`).join("")}</ul>
      <button type="button" class="ghost sm" data-ask="${esc(id)}">Ask the expert about this</button>`;
  }

  function runCheck() {
    const results = score();
    const reds = [...state.selected].filter((id) => symptomById[id].red);
    const urgentTop = results.slice(0, 3).some((r) => r.c.level === "urgent");
    let banner = "";
    if (reds.length || urgentTop) {
      banner = `<div class="alert"><strong>Warning signs picked.</strong> ${reds.map((id) => esc(symptomById[id].name)).join(", ") || "A top match needs a vet now."} — isolate the bird and contact an avian vet. For several sudden deaths, call your state vet or USDA at 1-866-536-7593.</div>`;
    }
    $("hResults").innerHTML = `
      <div class="res-head"><h3>Possible causes</h3><button type="button" class="ghost" id="hSaveCheck">Save to bird log</button></div>
      ${banner}
      ${results.length ? results.map(resultCard).join("") : '<p class="muted">No close matches. Add more symptoms, or talk to a vet.</p>'}
      <p class="disclaimer">Guidance only, not a diagnosis. A vet exam, culture or necropsy is the only way to confirm. Follow label directions and withdrawal times for any medication.</p>`;
    $("hResults").hidden = false;
    $("hResults").scrollIntoView({ behavior: "smooth", block: "start" });
    $("hSaveCheck").onclick = () => saveCheck(results);
  }

  async function saveCheck(results) {
    const band = $("hBand").value.trim();
    if (!band) { alert("Enter the bird's Band ID at the top first."); $("hBand").focus(); return; }
    await addEntry({
      band, type: "check", date: today(),
      data: { symptoms: [...state.selected], top: results.slice(0, 3).map((r) => ({ id: r.c.id, name: r.c.name, pct: r.pct })) },
    });
    await refreshBandList();
    alert(`Saved to ${band}'s log.`);
  }

  // ---------- bird log ----------
  async function resizeImage(file, max = 1280) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
    cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
    return new Promise((r) => cv.toBlob(r, "image/jpeg", 0.82));
  }

  function logBand() {
    const b = $("hLogBand").value.trim();
    if (!b) { alert("Enter a Band ID."); $("hLogBand").focus(); }
    return b;
  }

  async function addPhotos() {
    const band = logBand(); if (!band) return;
    const files = [...$("hPhotoFile").files];
    if (!files.length) { alert("Choose one or more photos."); return; }
    const note = $("hPhotoNote").value.trim();
    const date = $("hPhotoDate").value || today();
    for (const f of files) {
      let blob = f;
      try { blob = await resizeImage(f); } catch (e) {}
      await addEntry({ band, type: "photo", date, data: { note }, blob });
    }
    $("hPhotoFile").value = ""; $("hPhotoNote").value = "";
    await refreshBandList(); renderLog();
  }

  async function addTreatment() {
    const band = logBand(); if (!band) return;
    const drug = $("hTxDrug").value.trim();
    if (!drug) { alert("Enter what you gave."); $("hTxDrug").focus(); return; }
    await addEntry({
      band, type: "treatment", date: $("hTxStart").value || today(),
      data: {
        drug, dose: $("hTxDose").value.trim(), route: $("hTxRoute").value,
        days: parseInt($("hTxDays").value, 10) || 1,
        withdrawal: parseInt($("hTxWd").value, 10) || 0,
        reason: $("hTxReason").value.trim(), given: [],
      },
    });
    ["hTxDrug", "hTxDose", "hTxDays", "hTxWd", "hTxReason"].forEach((id) => ($(id).value = ""));
    await refreshBandList(); renderLog();
  }

  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
  const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  function treatmentHtml(e) {
    const t = e.data, end = addDays(e.date, t.days - 1), wdUntil = addDays(end, t.withdrawal);
    const day = daysBetween(e.date, today()) + 1;
    let status;
    if (day < 1) status = `<span class="lv lv-vet">Starts ${fmt(e.date)}</span>`;
    else if (day <= t.days) status = `<span class="lv lv-urgent">Day ${day} of ${t.days}</span>`;
    else if (t.withdrawal && today() <= wdUntil) status = `<span class="lv lv-vet">Withdrawal until ${fmt(wdUntil)}</span>`;
    else status = `<span class="lv lv-home">Done</span>`;
    const givenToday = (t.given || []).includes(today());
    const canDose = day >= 1 && day <= t.days;
    return `
      <div class="tx-row">
        <div><strong>${esc(t.drug)}</strong> ${t.dose ? `· ${esc(t.dose)}` : ""} · ${esc(t.route)}
          <div class="muted">${fmt(e.date)} → ${fmt(end)}${t.withdrawal ? ` · ${t.withdrawal}-day withdrawal` : ""}${t.reason ? ` · ${esc(t.reason)}` : ""}</div>
          <div class="muted">Doses logged: ${(t.given || []).length}</div>
        </div>
        <div class="tx-actions">${status}
          ${canDose ? `<button type="button" class="ghost sm" data-dose="${e.id}" ${givenToday ? "disabled" : ""}>${givenToday ? "Given today ✓" : "Mark given today"}</button>` : ""}
        </div>
      </div>`;
  }

  let objectUrls = [];
  async function renderLog() {
    objectUrls.forEach((u) => URL.revokeObjectURL(u)); objectUrls = [];
    const band = $("hLogBand").value.trim();
    const box = $("hLog");
    if (!band) { box.innerHTML = '<p class="muted">Enter or pick a Band ID to see that bird’s photos, checks and treatments.</p>'; return; }
    const entries = (await allEntries()).filter((e) => e.band === band)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
    if (!entries.length) { box.innerHTML = `<p class="muted">Nothing logged for ${esc(band)} yet.</p>`; return; }

    const tx = entries.filter((e) => e.type === "treatment");
    let html = "";
    if (tx.length) html += `<h3>Treatments</h3><div class="tx-list">${tx.map(treatmentHtml).join("")}</div>`;
    html += `<h3>Timeline</h3><div class="timeline">`;
    let lastDate = "";
    for (const e of entries) {
      if (e.date !== lastDate) { html += `<div class="tl-date">${fmt(e.date)}</div>`; lastDate = e.date; }
      let body = "";
      if (e.type === "photo") {
        const url = e.blob ? URL.createObjectURL(e.blob) : "";
        if (url) objectUrls.push(url);
        body = `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="Photo of ${esc(band)}"></a>${e.data.note ? `<p>${esc(e.data.note)}</p>` : ""}`;
      } else if (e.type === "check") {
        body = `<p><strong>Symptom check:</strong> ${e.data.symptoms.map((id) => esc(symptomById[id]?.name || id)).join(", ")}</p>
          <p class="muted">Top matches: ${e.data.top.map((t) => `${esc(t.name)} (${t.pct}%)`).join(" · ") || "none"}</p>`;
      } else if (e.type === "expert") {
        body = `<p><strong>Asked the expert:</strong> ${esc(e.data.question)}</p><div class="tl-answer">${esc(e.data.answer).replace(/\n/g, "<br>")}</div>`;
      } else if (e.type === "treatment") {
        body = `<p><strong>Started:</strong> ${esc(e.data.drug)} for ${e.data.days} day${e.data.days > 1 ? "s" : ""}</p>`;
      }
      html += `<div class="tl-item tl-${e.type}">${body}<button type="button" class="link-del" data-del="${e.id}">Delete</button></div>`;
    }
    box.innerHTML = html + "</div>";
  }

  // ---------- wiring ----------
  function wire() {
    $("hAreas").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-area]"); if (!b) return;
      state.area = b.dataset.area; renderAreas(); renderSymptoms();
    });
    $("hSearch").addEventListener("input", (ev) => { state.query = ev.target.value; renderSymptoms(); });
    $("hSymptoms").addEventListener("change", (ev) => {
      const id = ev.target.dataset.sym; if (!id) return;
      ev.target.checked ? state.selected.add(id) : state.selected.delete(id);
      renderAreas(); renderSymptoms();
    });
    $("hSelected").addEventListener("click", (ev) => {
      const id = ev.target.closest("[data-unsel]")?.dataset.unsel; if (!id) return;
      state.selected.delete(id); renderAreas(); renderSymptoms();
    });
    $("hClear").addEventListener("click", () => { state.selected.clear(); $("hResults").hidden = true; renderAreas(); renderSymptoms(); });
    $("hCheckBtn").addEventListener("click", runCheck);
    $("hResults").addEventListener("click", (ev) => {
      const h = ev.target.closest("[data-toggle]"); if (h) h.parentElement.classList.toggle("open");
      const ask = ev.target.closest("[data-ask]");
      if (ask && window.ExpertUI) {
        const c = HEALTH_CONDITIONS.find((x) => x.id === ask.dataset.ask);
        const seen = [...state.selected].map((id) => symptomById[id].name).join(", ");
        window.ExpertUI.open({
          focus: c.id,
          band: $("hBand").value.trim(),
          question: `The symptom checker suggested "${c.name}". What I'm seeing: ${seen}. How do I confirm it, and what should I do next?`,
        });
      }
    });

    document.querySelectorAll("[data-hview]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-hview]").forEach((x) => x.classList.toggle("on", x === b));
      document.querySelectorAll(".hview").forEach((v) => (v.hidden = v.id !== b.dataset.hview));
      if (b.dataset.hview === "hLogView") {
        if (!$("hLogBand").value && $("hBand").value) $("hLogBand").value = $("hBand").value;
        renderLog();
      }
    }));

    $("hLogBand").addEventListener("change", renderLog);
    $("hLogBand").addEventListener("input", () => { clearTimeout(wire.t); wire.t = setTimeout(renderLog, 300); });
    $("hPhotoAdd").addEventListener("click", addPhotos);
    $("hTxAdd").addEventListener("click", addTreatment);
    $("hLog").addEventListener("click", async (ev) => {
      const del = ev.target.closest("[data-del]");
      if (del && confirm("Delete this entry?")) { await deleteEntry(Number(del.dataset.del)); renderLog(); return; }
      const dose = ev.target.closest("[data-dose]");
      if (dose) {
        const e = (await allEntries()).find((x) => x.id === Number(dose.dataset.dose));
        e.data.given = [...new Set([...(e.data.given || []), today()])];
        await putEntry(e); renderLog();
      }
    });
    $("hPhotoDate").value = today();
    $("hTxStart").value = today();
  }

  // Shared with the Ask an Expert tab.
  window.HealthDB = { allEntries, addEntry, resizeImage, refreshBandList, renderLog, symptomById };

  document.addEventListener("DOMContentLoaded", () => {
    if (!$("health")) return;
    wire(); renderAreas(); renderSymptoms(); refreshBandList().catch(() => {});
  });
})();
