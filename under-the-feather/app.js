(function () {
  const C = window.UTF_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const screen = $("#screen"), sheet = $("#sheet"), tip = $("#tip"), toastEl = $("#toast"), app = $("#app");
  const byId = Object.fromEntries(STRUCTURES.map(s => [s.id, s]));

  // ---------- saved progress (this browser only) ----------
  const KEY = "utf_state_v1";
  const fresh = () => ({ name: "", xp: 0, days: [], lessons: {}, explored: {}, lastCourse: "anatomy", daily: {} });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
  const dayNum = () => Math.floor(Date.now() / 864e5);
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = s => esc(s).replace(/\[\[([^\]]+)\]\]/g, (_, t) => `<span class="term" data-t="${t.toLowerCase()}" tabindex="0">${t}</span>`);
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove("show"), 2200); }
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
  const statsHTML = () => `<div class="stats"><div class="stat"><b>${S.xp}</b><small>XP</small></div><div class="stat"><b><span class="flame">🔥</span> ${streak()}</b><small>Streak</small></div></div>`;
  const courseProgress = c => c.lessons.filter(l => S.lessons[l.id]).length;
  const locked = c => c.pro && C.lockProContent && !S.pro;

  // ---------- routing ----------
  let tab = "home";
  const views = { home, explore, courses, account };
  function go(t, fn) {
    tab = t; closeSheet(); hideTip();
    document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
    screen.classList.toggle("explore", t === "explore" && !fn);
    screen.scrollTop = 0;
    (fn || views[t])();
  }
  document.querySelectorAll(".tabbar button").forEach(b => b.onclick = () => go(b.dataset.tab));

  // ---------- HOME ----------
  function home() {
    const di = dayNum() % DAILY.length, q = DAILY[di], answered = S.daily[dayKey()];
    const fact = FACTS[dayNum() % FACTS.length];
    const c = COURSES.find(x => x.id === S.lastCourse) || COURSES[0];
    const pct = Math.round(courseProgress(c) / c.lessons.length * 100);
    screen.innerHTML = `
      <div class="top"><div><div class="hello">${greeting()}</div><h2>${esc(S.name || "Breeder")}</h2></div>
        <div class="stats">${statsHTML()}<button class="iconbtn" data-go="account" aria-label="Settings"><svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4l-2.1-.6a7 7 0 0 0-.7-1.7l1-2-1.9-1.9-2 1a7 7 0 0 0-1.7-.7L13 3h-2l-.6 2.1a7 7 0 0 0-1.7.7l-2-1-1.9 1.9 1 2a7 7 0 0 0-.7 1.7L3 11v2l2.1.6c.2.6.4 1.2.7 1.7l-1 2 1.9 1.9 2-1c.5.3 1.1.5 1.7.7L11 21h2l.6-2.1c.6-.2 1.2-.4 1.7-.7l2 1 1.9-1.9-1-2c.3-.5.5-1.1.7-1.7L21 13z"/></svg></button></div></div>
      <div class="card gold" id="daily">${answered === undefined ? dailyQ(q) : dailyDone(q, answered)}</div>
      <div class="card fact"><div class="bulb">💡</div><div><div class="label">Did you know?</div><div style="margin-top:4px">${esc(fact)}</div></div></div>
      <div class="label" style="margin:18px 2px 8px;color:var(--muted)">Pick up where you left off</div>
      <div class="card resume" data-course="${c.id}" style="cursor:pointer">
        <div class="ic">📖</div><div><div class="small muted">Continue · ${pct}%</div><div class="serif" style="font-size:17px">${esc(c.title)}</div></div><button class="play" aria-label="Continue"></button></div>
      <div class="card live" data-go="explore">
        <div style="display:flex;justify-content:space-between"><span class="pill">LIVE EXPLORER</span><span class="label" style="color:var(--muted)">Zoom · Flip · Tap</span></div>
        ${BirdSVG.mini()}
      </div>`;
    bindDaily(q);
  }
  function dailyQ(q) {
    return `<div class="label">Daily challenge</div><h3>${esc(q.q)}</h3>
      <div class="opts">${q.a.map((a, i) => `<button class="opt" data-i="${i}">${esc(a)}</button>`).join("")}</div>`;
  }
  function weekDots() {
    const set = new Set(S.days), d = new Date(), names = "SMTWTFS";
    const start = new Date(d); start.setDate(d.getDate() - d.getDay());
    let h = '<div class="week">';
    for (let i = 0; i < 7; i++) {
      const x = new Date(start); x.setDate(start.getDate() + i);
      const k = dayKey(x);
      h += `<div class="day">${names[i]}<div class="dot ${set.has(k) ? "on" : ""} ${k === dayKey() ? "today" : ""}"></div></div>`;
    }
    return h + "</div>";
  }
  function dailyDone(q, ans) {
    const ok = ans === q.c, s = streak();
    return `<div class="done-head"><h3>${ok ? "✅ Challenge Complete!" : "Challenge done"}</h3>
      <div class="xp">${ok ? "+2 XP earned" : "+1 XP for trying"}</div>
      <div class="small" style="color:#ff9a55">🔥 ${s}-day streak!</div>
      <div class="small muted" style="margin-top:6px">${ok ? "" : `Answer: <b>${esc(q.a[q.c])}</b>. `}${esc(q.why)}</div>
      <div class="small muted" style="margin-top:4px">Come back tomorrow for your next question.</div></div>${weekDots()}`;
  }
  function bindDaily(q) {
    document.querySelectorAll("#daily .opt").forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      S.daily[dayKey()] = i;
      if (!S.days.includes(dayKey())) S.days.push(dayKey());
      S.xp += i === q.c ? 2 : 1; save();
      document.querySelectorAll("#daily .opt").forEach((x, j) => x.classList.add(j === q.c ? "right" : j === i ? "wrong" : "x"));
      setTimeout(() => { $("#daily").innerHTML = dailyDone(q, i); $(".top .stats .stats") && ($(".top .stats .stats").outerHTML = statsHTML()); }, 900);
    });
  }

  // ---------- EXPLORER ----------
  const EX = { system: "muscles", layer: "superficial", zoom: 1, flip: false, x: 0, y: 0, sel: null };
  const LAYERS = ["superficial", "intermediate", "deep"];
  function explore() {
    screen.innerHTML = `
      <div class="ex-top"><div class="seg">${["skeleton", "muscles", "exterior"].map(s =>
        `<button data-sys="${s}" class="${EX.system === s ? "on" : ""}">${s === "skeleton" ? "Skeleton" : s === "muscles" ? "Muscles" : "Exterior"}</button>`).join("")}</div>
        <button class="iconbtn" id="find" aria-label="Search structures"><svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg></button></div>
      <div class="layers">${EX.system === "muscles" ? `<div class="layer-dots">${LAYERS.map((l, i) =>
        `${i ? "<em></em>" : ""}<button data-layer="${l}" class="${EX.layer === l ? "on" : ""}" aria-label="${l}"><i></i></button>`).join("")}</div>
        <div class="layer-name">${EX.layer[0].toUpperCase() + EX.layer.slice(1)}</div>` : ""}</div>
      <div class="viewer" id="viewer">
        <div class="tools">
          <button class="iconbtn" id="flip" aria-label="Flip view"><svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8zm8 8a8 8 0 0 1-15.4 3H7v-2H1v6h2v-2.3A10 10 0 0 0 22 12z"/></svg></button>
          <button class="iconbtn" id="zin" aria-label="Zoom in"><svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg></button>
          <button class="iconbtn" id="zout" aria-label="Zoom out"><svg viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg></button>
        </div>
        ${BirdSVG.render(EX.system, EX.layer)}
      </div>
      <div class="hint">Zoom · Flip · Tap to discover</div>`;
    const svg = $("#viewer svg");
    const apply = () => svg.style.transform = `translate(${EX.x}px,${EX.y}px) scale(${EX.flip ? -EX.zoom : EX.zoom},${EX.zoom})`;
    apply();
    if (EX.sel) markSel(EX.sel);
    screen.querySelectorAll("[data-sys]").forEach(b => b.onclick = () => { EX.system = b.dataset.sys; EX.sel = null; closeSheet(); explore(); });
    screen.querySelectorAll("[data-layer]").forEach(b => b.onclick = () => { EX.layer = b.dataset.layer; EX.sel = null; closeSheet(); explore(); });
    $("#flip").onclick = () => { EX.flip = !EX.flip; apply(); };
    $("#zin").onclick = () => { EX.zoom = Math.min(3, EX.zoom + .4); apply(); };
    $("#zout").onclick = () => { EX.zoom = Math.max(1, EX.zoom - .4); if (EX.zoom === 1) EX.x = EX.y = 0; apply(); };
    $("#find").onclick = openSearch;

    // drag to pan when zoomed; tap to select
    const v = $("#viewer"); let start = null, moved = false;
    v.addEventListener("pointerdown", e => { if (e.target.closest(".tools")) return; start = { x: e.clientX, y: e.clientY, ox: EX.x, oy: EX.y }; moved = false; });
    v.addEventListener("pointermove", e => {
      if (!start || EX.zoom === 1) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) { moved = true; v.classList.add("dragging"); EX.x = start.ox + dx; EX.y = start.oy + dy; apply(); }
    });
    v.addEventListener("pointerup", e => {
      v.classList.remove("dragging");
      if (start && !moved) { const p = e.target.closest(".part"); if (p) selectStructure(p.dataset.id); }
      start = null;
    });
    v.addEventListener("wheel", e => { e.preventDefault(); EX.zoom = Math.min(3, Math.max(1, EX.zoom - e.deltaY * .002)); if (EX.zoom === 1) EX.x = EX.y = 0; apply(); }, { passive: false });
  }
  function markSel(id) {
    document.querySelectorAll("#viewer .part").forEach(p => p.classList.toggle("sel", p.dataset.id === id));
  }
  function selectStructure(id) {
    const s = byId[id]; if (!s) return;
    EX.sel = id; markSel(id);
    if (!S.explored[id]) { S.explored[id] = 1; S.xp += 1; save(); }
    openSheet(`<div class="grab"></div><button class="iconbtn close" aria-label="Close">✕</button>
      <h3>${esc(s.name)}</h3><div class="latin">${esc(s.latin)}</div>
      <div class="sys">${s.system === "muscles" ? "Muscular system · " + s.layer : s.system === "skeleton" ? "Skeletal system" : "Exterior"} · ${esc(s.region)}</div>
      <h5>Description</h5><p>${fmt(s.desc)}</p>
      <h5>Function</h5><p>${fmt(s.fn)}</p>
      ${s.details.length ? `<h5>${s.system === "muscles" ? "Origin & insertion" : "Details"}</h5><table>${s.details.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${fmt(v)}</td></tr>`).join("")}</table>` : ""}
      ${s.notes ? `<h5>Breeder notes</h5><p>${fmt(s.notes)}</p>` : ""}`);
  }
  function openSearch() {
    openSheet(`<div class="grab"></div><button class="iconbtn close" aria-label="Close">✕</button>
      <h3>Find a structure</h3><input class="search" id="q" placeholder="e.g. keel, spur, pectoralis" autocomplete="off"><div id="res"></div>`);
    const draw = t => {
      t = t.toLowerCase();
      $("#res").innerHTML = STRUCTURES.filter(s => !t || (s.name + s.latin + s.region).toLowerCase().includes(t)).map(s =>
        `<button class="result" data-id="${s.id}">${esc(s.name)}<small>${esc(s.latin)} · ${s.system}${s.layer ? " · " + s.layer : ""}</small></button>`).join("");
      document.querySelectorAll("#res .result").forEach(b => b.onclick = () => {
        const s = byId[b.dataset.id]; EX.system = s.system; if (s.layer) EX.layer = s.layer; EX.sel = s.id;
        if (tab !== "explore") go("explore"); else explore();
        selectStructure(s.id);
      });
    };
    $("#q").oninput = e => draw(e.target.value); draw("");
  }

  // ---------- COURSES ----------
  let filter = "all";
  function courses() {
    const c = COURSES.find(x => x.id === S.lastCourse) || COURSES[0];
    const done = courseProgress(c), pct = Math.round(done / c.lessons.length * 100);
    const next = c.lessons.find(l => !S.lessons[l.id]) || c.lessons[0];
    const list = COURSES.filter(x => { const p = courseProgress(x); return filter === "all" || (filter === "progress" ? p > 0 && p < x.lessons.length : filter === "new" ? p === 0 : p === x.lessons.length); });
    screen.innerHTML = `
      <div class="top"><h2>Courses</h2>${statsHTML()}</div>
      <div class="card gold"><div class="label">Continue learning</div><h3>${esc(c.title)}</h3>
        <div style="display:flex;align-items:center;gap:10px"><div class="bar" style="flex:1"><i style="width:${pct}%"></i></div><span class="small" style="color:var(--gold)">${pct}%</span></div>
        <div class="small muted" style="margin-bottom:12px">Up next · <b style="color:var(--text)">${esc(next.title)}</b></div>
        <button class="btn" data-lesson="${c.id}|${next.id}">Continue →</button></div>
      <div class="chips">${[["all", "All"], ["progress", "In progress"], ["new", "Not started"], ["done", "Completed"]].map(([k, l]) =>
        `<button class="chip ${filter === k ? "on" : ""}" data-filter="${k}">${l}</button>`).join("")}</div>
      <div class="section-title"><h3>Core Courses</h3><span class="small muted">${COURSES.length} topics</span></div>
      ${list.map(courseCard).join("") || '<p class="muted small">Nothing here yet.</p>'}
      <div class="section-title"><h3>Breed Library</h3><span class="small muted">${BREEDS.length} breeds</span></div>
      <div class="breed-grid">${BREEDS.map(b => `<button class="breed" data-breed="${b.id}"><b>${esc(b.name)}</b><small>${esc(b.origin)}</small></button>`).join("")}</div>`;
    screen.querySelectorAll("[data-filter]").forEach(b => b.onclick = () => { filter = b.dataset.filter; courses(); });
  }
  function ring(done, total) {
    const r = 18, cir = 2 * Math.PI * r, f = total ? done / total : 0;
    return `<div class="ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="${r}" fill="none" stroke="#2f2c26" stroke-width="3"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${cir}" stroke-dashoffset="${cir * (1 - f)}"/></svg><span>${done}/${total}</span></div>`;
  }
  function courseCard(c) {
    return `<div class="card course" data-course="${c.id}"><div><h4>${esc(c.title)}${c.pro ? '<span class="pro">PRO</span>' : ""}</h4><p>${esc(c.blurb)}</p>
      <div class="meta">${c.lessons.length} lessons · ~${c.minutes} min</div></div>${ring(courseProgress(c), c.lessons.length)}</div>`;
  }
  function course(id) {
    const c = COURSES.find(x => x.id === id);
    if (locked(c)) return openPro();
    S.lastCourse = id; save();
    go("courses", () => {
      screen.innerHTML = `<button class="back" data-go="courses">‹ Courses</button>
        <div class="label">${c.pro ? "Pro course" : "Course"}</div><h2 style="font-size:28px;margin:4px 0 6px">${esc(c.title)}</h2>
        <p class="muted" style="margin-top:0">${esc(c.blurb)}</p>
        <div class="card">${c.lessons.map((l, i) => `<div class="lesson-row" data-lesson="${c.id}|${l.id}">
          <div class="check ${S.lessons[l.id] ? "ok" : ""}">${S.lessons[l.id] ? "✓" : i + 1}</div><div>${esc(l.title)}<div class="small muted">${l.quiz.length} quiz question${l.quiz.length > 1 ? "s" : ""}</div></div></div>`).join("")}</div>`;
    });
  }
  function lesson(cid, lid) {
    const c = COURSES.find(x => x.id === cid); if (locked(c)) return openPro();
    const l = c.lessons.find(x => x.id === lid);
    S.lastCourse = cid; save();
    go("courses", () => {
      screen.innerHTML = `<button class="back" data-course="${cid}">‹ ${esc(c.title)}</button>
        <div class="label">Lesson</div><h2 style="font-size:27px;margin:4px 0 14px">${esc(l.title)}</h2>
        <div class="lesson">${l.body.map(p => `<p>${fmt(p)}</p>`).join("")}</div>
        <div class="section-title"><h3>Quiz</h3><span class="small muted" id="qscore"></span></div>
        ${l.quiz.map((q, qi) => `<div class="card" data-q="${qi}"><div style="font-weight:600">${esc(q.q)}</div><div class="opts">${q.a.map((a, i) => `<button class="opt" data-i="${i}">${esc(a)}</button>`).join("")}</div></div>`).join("")}
        <button class="btn" id="finish" disabled style="opacity:.5">Answer the quiz to finish</button>`;
      const got = {};
      screen.querySelectorAll("[data-q]").forEach(card => {
        const q = l.quiz[+card.dataset.q];
        card.querySelectorAll(".opt").forEach(b => b.onclick = () => {
          if (card.dataset.q in got) return;
          const i = +b.dataset.i; got[card.dataset.q] = i === q.c;
          card.querySelectorAll(".opt").forEach((x, j) => x.classList.add(j === q.c ? "right" : j === i ? "wrong" : "x"));
          if (Object.keys(got).length === l.quiz.length) {
            const right = Object.values(got).filter(Boolean).length;
            $("#qscore").textContent = `${right}/${l.quiz.length} correct`;
            const f = $("#finish"); f.disabled = false; f.style.opacity = 1;
            f.textContent = right === l.quiz.length ? "Complete lesson · +10 XP" : "Retry the quiz";
            f.onclick = () => {
              if (right !== l.quiz.length) return lesson(cid, lid);
              if (!S.lessons[lid]) { S.lessons[lid] = 1; S.xp += 10; save(); toast("Lesson complete · +10 XP"); }
              const nx = c.lessons[c.lessons.indexOf(l) + 1];
              nx ? lesson(cid, nx.id) : course(cid);
            };
          }
        });
      });
    });
  }
  function breed(id) {
    const b = BREEDS.find(x => x.id === id);
    go("courses", () => {
      screen.innerHTML = `<button class="back" data-go="courses">‹ Breed Library</button>
        <div class="label">Breed</div><h2 style="font-size:30px;margin:4px 0 2px">${esc(b.name)}</h2>
        <div class="muted small">${esc(b.origin)} · ${esc(b.weight)}</div>
        <dl class="kv"><dt>History</dt><dd>${fmt(b.history)}</dd><dt>Characteristics</dt><dd>${fmt(b.traits)}</dd>
        <dt>Conformation</dt><dd>${fmt(b.conformation)}</dd><dt>Keeper's notes</dt><dd>${fmt(b.notes)}</dd></dl>
        <p class="small muted">Weights are typical large-fowl figures; standards differ between countries and clubs.</p>`;
    });
  }

  // ---------- ACCOUNT ----------
  function account() {
    const lessonsDone = Object.keys(S.lessons).length, total = COURSES.reduce((n, c) => n + c.lessons.length, 0);
    const link = (u, t) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : "";
    screen.innerHTML = `<div class="top"><h2>Account</h2>${statsHTML()}</div>
      <div class="card"><div class="label">Your name</div><input class="field" id="nm" style="margin-top:8px" placeholder="Breeder" value="${esc(S.name)}"></div>
      <div class="card"><div class="label" style="margin-bottom:10px">Progress</div><div class="statgrid">
        <div><b>${S.xp}</b><span class="small muted">XP</span></div><div><b>${streak()}</b><span class="small muted">Day streak</span></div>
        <div><b>${lessonsDone}/${total}</b><span class="small muted">Lessons</span></div><div><b>${Object.keys(S.explored).length}/${STRUCTURES.length}</b><span class="small muted">Structures explored</span></div></div></div>
      ${proCard()}
      <div class="card"><div class="label">About</div><p class="small muted">${esc(C.appName || "Under The Feather")} ${esc(C.byline || "")}. Educational content for gamefowl breeders, exhibitors and students. It is not veterinary advice: for a sick or injured bird, contact a poultry vet or your state animal diagnostic lab. This app does not support or promote animal fighting, which is illegal across the United States.</p>
        <div class="links">${link(C.termsUrl, "Terms")}${link(C.privacyUrl, "Privacy")}${link(C.contactUrl, "Contact")}${C.supportEmail ? `<a href="mailto:${esc(C.supportEmail)}">Support</a>` : ""}</div></div>
      <button class="btn ghost" id="reset">Reset progress</button>`;
    $("#nm").oninput = e => { S.name = e.target.value.slice(0, 30); save(); };
    $("#reset").onclick = () => { if (confirm("Reset all XP, streaks and lesson progress on this device?")) { S = fresh(); save(); account(); } };
    bindPro();
  }
  function proCard() {
    return `<div class="card gold"><div class="label">${esc(C.appName || "Under The Feather")} Pro</div><h3>Unlock every course</h3>
      <p class="small muted" style="margin-top:0">Health & conditions, nutrition, breeding and records, plus new content as it's added. ${esc(C.proPriceMonthly || "")}/month${C.trialDays ? ` with a ${C.trialDays}-day free trial` : ""}.</p>
      <button class="btn" data-pro>${C.checkoutUrl ? "Start free trial" : "Pro checkout coming soon"}</button></div>`;
  }
  function bindPro() { document.querySelectorAll("[data-pro]").forEach(b => b.onclick = () => C.checkoutUrl ? window.open(C.checkoutUrl, "_blank", "noopener") : toast("Checkout link not set yet")); }
  function openPro() { openSheet(`<div class="grab"></div><button class="iconbtn close" aria-label="Close">✕</button>${proCard()}`); bindPro(); }

  // ---------- sheet + tooltips + delegation ----------
  function openSheet(html) { sheet.innerHTML = html; sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); sheet.scrollTop = 0; }
  function closeSheet() { sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); }
  function hideTip() { tip.classList.remove("show"); }
  function showTip(el) {
    const e = ETYMOLOGY[el.dataset.t]; if (!e) return;
    tip.innerHTML = `<b>${esc(el.textContent)}</b><span>${esc(e[1])}</span><small>${esc(e[0])}</small>`;
    tip.classList.add("show");
    const a = app.getBoundingClientRect(), r = el.getBoundingClientRect();
    let left = r.left - a.left, top = r.bottom - a.top + 8;
    left = Math.max(10, Math.min(left, a.width - tip.offsetWidth - 10));
    if (top + tip.offsetHeight > a.height - 70) top = r.top - a.top - tip.offsetHeight - 8;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  app.addEventListener("click", e => {
    const t = e.target;
    const term = t.closest(".term"); if (term) { showTip(term); return; } else hideTip();
    if (t.closest(".close")) { closeSheet(); EX.sel = null; markSel(null); return; }
    const g = t.closest("[data-go]"); if (g) return go(g.dataset.go);
    const l = t.closest("[data-lesson]"); if (l) { const [c, id] = l.dataset.lesson.split("|"); return lesson(c, id); }
    const c = t.closest("[data-course]"); if (c) return course(c.dataset.course);
    const b = t.closest("[data-breed]"); if (b) return breed(b.dataset.breed);
  });
  app.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("term")) showTip(e.target); if (e.key === "Escape") { hideTip(); closeSheet(); } });
  screen.addEventListener("scroll", hideTip);
  sheet.addEventListener("scroll", hideTip);

  // allow deep links: index.html#explore, #courses, #account
  const start = location.hash.slice(1);
  go(views[start] ? start : "home");
})();
