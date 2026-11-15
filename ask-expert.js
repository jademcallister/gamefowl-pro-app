// Ask an Expert tab: chat with Claude, grounded in the app's knowledge base,
// trusted poultry/vet sites, and the selected bird's log and photos.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MAX_PHOTOS_PER_CHAT = 8;

  const store = {
    get(k, d = "") { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const chat = { history: [], busy: false, abort: null, pending: [], photosUsed: 0, sentPhotoIds: new Set(),
    sample: null, imageLimit: 0, turns: [] };

  // Built-in Claude (inside a Claude artifact): no key, no browsing.
  const SAMPLE_NOTE = `

You are running inside the Gamefowl Pro artifact on the keeper's own Claude account. You cannot search or open web pages here, so rely on the knowledge base below and your own veterinary knowledge. In the Sources list, prefer the Merck and reference URLs given in the knowledge base and source library; only give another URL when you are confident it exists, and otherwise name the source without a link.`;
  let rulesText = null;
  const rules = () => rulesText || (rulesText = ExpertCore.INSTRUCTIONS + SAMPLE_NOTE + "\n\n" +
    ExpertCore.knowledgeBase(HEALTH_CONDITIONS, healthRefLinks, HEALTH_SOURCES));
  const SAMPLE_ERRORS = {
    not_granted: "Claude access was declined for this page. Reload the page to be asked again.",
    sampling_disabled: "Claude isn't available on this account here.",
    rate_limited: "Too many questions in a row, or you've reached your Claude usage limit. Wait a bit and try again.",
    session_expired: "Your Claude session expired. Sign in again, then retry.",
    refused: "Claude declined that question. Try rewording it.",
    image_rejected: "One of the photos couldn't be used. Try a different photo.",
    prompt_too_large: "This conversation got too long. Start a new chat.",
    empty_completion: "No answer came back. Try rewording the question.",
  };
  const linksIn = (text) => {
    const seen = new Map();
    for (const m of text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) if (!seen.has(m[2])) seen.set(m[2], m[1]);
    for (const m of text.matchAll(/(?<![(\["])https?:\/\/[^\s)<>\]]+/g)) { const u = m[0].replace(/[.,;:]+$/, ""); if (!seen.has(u)) seen.set(u, u); }
    return [...seen].map(([url, title]) => ({ url, title }));
  };

  async function sendSampleMode(question, record, blobs, handlers) {
    let content = question;
    if (record) content += "\n\n" + record;
    const imgs = blobs.slice(0, chat.imageLimit);
    if (imgs.length) content += `\n\n${imgs.length} photo(s) of the bird are attached.`;
    else if (blobs.length) content += "\n\n(The keeper has photos, but they couldn't be attached here.)";
    const input = [{ role: "user", content: rules() }, ...chat.turns.slice(-16), { role: "user", content }];
    try {
      const res = await chat.sample(input, {
        cache: false, signal: handlers.signal, images: imgs.length ? imgs : undefined,
        onText: ({ text }) => handlers.onText(text, true),
      });
      chat.turns.push({ role: "user", content: question + (imgs.length ? ` [${imgs.length} photo(s) attached]` : "") }, { role: "assistant", content: res.text });
      return { text: res.text, truncated: res.truncated, sources: linksIn(res.text) };
    } catch (e) {
      const err = new Error(e && e.code === "cancelled" ? "Stopped." : (SAMPLE_ERRORS[e && e.code] || "Couldn't reach Claude. Try again in a moment."));
      err.partial = e && e.code !== "refused" ? e.text : "";
      throw err;
    }
  }

  // ---------- tiny, safe markdown ----------
  function md(src) {
    const lines = esc(src).split("\n");
    let html = "", list = null;
    const inline = (t) => t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const close = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^#{1,4}\s+(.*)/))) { close(); html += `<h4>${inline(m[1])}</h4>`; }
      else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== "ul") { close(); html += "<ul>"; list = "ul"; } html += `<li>${inline(m[1])}</li>`; }
      else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); html += "<ol>"; list = "ol"; } html += `<li>${inline(m[1])}</li>`; }
      else if (!line.trim()) { close(); }
      else { close(); html += `<p>${inline(line)}</p>`; }
    }
    close();
    return html;
  }

  // ---------- settings ----------
  function loadSettings() {
    $("xMode").value = store.get("expert.mode", "key");
    $("xKey").value = store.get("expert.key");
    $("xServer").value = store.get("expert.server", "/api/ask");
    $("xPass").value = store.get("expert.pass");
    syncMode();
  }
  function saveSettings() {
    store.set("expert.mode", $("xMode").value);
    store.set("expert.key", $("xKey").value.trim());
    store.set("expert.server", $("xServer").value.trim() || "/api/ask");
    store.set("expert.pass", $("xPass").value);
    syncMode();
    $("xSettingsMsg").textContent = "Saved on this device.";
    setTimeout(() => ($("xSettingsMsg").textContent = ""), 2000);
  }
  function syncMode() {
    const key = $("xMode").value === "key";
    $("xKeyRow").hidden = !key;
    $("xServerRow").hidden = key;
    const ready = key ? !!store.get("expert.key") : !!store.get("expert.server");
    if (!chat.sample) $("xSetupHint").hidden = ready;
  }

  // ---------- bird context ----------
  async function birdRecord(band) {
    const entries = (await HealthDB.allEntries()).filter((e) => e.band === band)
      .sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created);
    let evalRecs = [];
    try { evalRecs = JSON.parse(localStorage.getItem("records") || "[]").filter((r) => r.band === band); } catch (e) {}
    const lines = [`Bird record from the keeper's Gamefowl Pro log. Band ID: ${band}. Today: ${new Date().toISOString().slice(0, 10)}.`];
    if (evalRecs.length) lines.push(`Breeding evaluation scores: ${evalRecs.map((r) => r.score).join(", ")} (1–10).`);
    for (const e of entries) {
      if (e.type === "check") {
        lines.push(`${e.date} symptom check: ${e.data.symptoms.map((id) => HealthDB.symptomById[id]?.name || id).join("; ")}. App's top matches: ${e.data.top.map((t) => `${t.name} ${t.pct}%`).join(", ")}.`);
      } else if (e.type === "treatment") {
        const t = e.data;
        lines.push(`${e.date} treatment started: ${t.drug}${t.dose ? `, ${t.dose}` : ""}, ${t.route}, ${t.days} day(s), withdrawal ${t.withdrawal} day(s)${t.reason ? `, for ${t.reason}` : ""}. Doses logged on: ${(t.given || []).join(", ") || "none"}.`);
      } else if (e.type === "photo") {
        lines.push(`${e.date} photo logged${e.data.note ? `: "${e.data.note}"` : ""}.`);
      } else if (e.type === "expert") {
        lines.push(`${e.date} earlier expert question: "${e.data.question}".`);
      }
    }
    if (entries.length === 0 && !evalRecs.length) lines.push("No log entries yet for this bird.");
    const photos = entries.filter((e) => e.type === "photo" && e.blob).slice(-3);
    return { text: lines.join("\n"), photos };
  }

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  async function imageBlock(blob) {
    let b = blob;
    try { b = await HealthDB.resizeImage(blob, 1024); } catch (e) {}
    return { type: "image", source: { type: "base64", media_type: b.type || "image/jpeg", data: await blobToBase64(b) } };
  }

  // ---------- transport ----------
  async function sendKeyMode(params, handlers) {
    const key = store.get("expert.key");
    if (!key) throw new Error("Add your Anthropic API key in Settings first.");
    let Anthropic = window.AnthropicSDK && window.AnthropicSDK.default;
    if (!Anthropic) {
      // Hosted site: load the same pinned SDK version from the CDN.
      try { Anthropic = (await import("https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm")).default; } catch (e) {}
    }
    if (!Anthropic) throw new Error("The Claude SDK didn't load. Check your connection and try again.");
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    try {
      return await ExpertCore.runTurn(client, params, handlers);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new Error("Your API key was rejected. Check it in Settings.");
      if (err instanceof Anthropic.RateLimitError) throw new Error("Rate limited. Wait a minute and try again.");
      if (err instanceof Anthropic.APIUserAbortError) throw new Error("Stopped.");
      if (err instanceof Anthropic.APIError) throw new Error(`Claude API error ${err.status ?? ""}: ${err.message}`);
      throw err;
    }
  }

  async function sendServerMode(history, handlers) {
    const res = await fetch(store.get("expert.server", "/api/ask"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-passcode": store.get("expert.pass") },
      body: JSON.stringify({ messages: history }),
      signal: handlers.signal,
    });
    if (!res.ok) {
      let msg = `Server error ${res.status}.`;
      try { msg = (await res.json()).error || msg; } catch (e) {}
      throw new Error(msg);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", done = null;
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        const ev = JSON.parse(line);
        if (ev.t === "text") handlers.onText(ev.d);
        else if (ev.t === "status") handlers.onStatus(ev.d);
        else if (ev.t === "error") throw new Error(ev.message);
        else if (ev.t === "done") done = ev;
      }
    }
    if (!done) throw new Error("The server closed the connection early.");
    return done;
  }

  // ---------- chat ----------
  function renderPending() {
    $("xAttach").innerHTML = chat.pending.map((p, i) =>
      `<span class="x-thumb"><img src="${p.url}" alt="Attached photo"><button type="button" data-rm="${i}" aria-label="Remove photo">✕</button></span>`).join("");
  }

  function addBubble(role, html) {
    const el = document.createElement("div");
    el.className = `x-msg x-${role}`;
    el.innerHTML = html;
    $("xChat").appendChild(el);
    el.scrollIntoView({ behavior: "smooth", block: "end" });
    $("xEmpty").hidden = true;
    return el;
  }

  async function ask() {
    if (chat.busy) return;
    const q = $("xInput").value.trim();
    if (!q && !chat.pending.length) return;
    const question = q || "What do you see in these photos?";
    const band = $("xBand").value.trim();
    const useLog = band && $("xUseLog").checked;
    const mode = chat.sample ? "claude" : store.get("expert.mode", "key");
    if (mode === "key" && !store.get("expert.key")) { $("xSettings").open = true; $("xKey").focus(); return; }

    chat.busy = true; $("xSend").disabled = true; $("xStop").hidden = false;
    $("xInput").value = "";
    const attached = chat.pending.splice(0);
    renderPending();

    addBubble("user", `${attached.map((p) => `<img class="x-uimg" src="${p.url}" alt="Your photo">`).join("")}<p>${esc(question)}</p>${band ? `<span class="x-band">🐓 ${esc(band)}${useLog ? " · log included" : ""}</span>` : ""}`);
    const out = addBubble("assistant", '<div class="x-status">Thinking…</div><div class="x-body"></div>');
    const statusEl = out.querySelector(".x-status"), bodyEl = out.querySelector(".x-body");

    let text = "";
    const handlers = {
      onText: (d, whole) => { text = whole ? d : text + d; bodyEl.innerHTML = md(text); statusEl.textContent = ""; },
      onStatus: (s) => { statusEl.textContent = s; },
    };
    chat.abort = new AbortController();
    handlers.signal = chat.abort.signal;

    // Build this turn's messages, appended to history only once the turn succeeds.
    const turn = [];
    try {
      const content = [];
      let logPhotos = [];
      let record = null;
      if (useLog) {
        record = await birdRecord(band);
        // Each logged photo goes to Claude once per chat; later turns already have it in history.
        logPhotos = record.photos.filter((e) => !chat.sentPhotoIds.has(e.id));
      }
      const allPhotos = [...attached.map((p) => p.blob), ...logPhotos.map((e) => e.blob)];
      if (mode === "claude") {
        const result = await sendSampleMode(question, record && record.text, allPhotos, handlers);
        logPhotos.forEach((e) => chat.sentPhotoIds.add(e.id));
        statusEl.textContent = "";
        bodyEl.innerHTML = md(result.text) + (result.truncated ? '<p class="muted">The answer was cut short. Ask for less at a time.</p>' : "");
        finish(out, band, question, result.text, result.sources);
        return;
      }
      const room = Math.max(0, MAX_PHOTOS_PER_CHAT - chat.photosUsed);
      for (const blob of allPhotos.slice(0, room)) content.push(await imageBlock(blob));
      chat.photosUsed += Math.min(allPhotos.length, room);
      content.push({ type: "text", text: question });
      turn.push({ role: "user", content });
      if (record) turn.push({ role: "system", content: record.text + (logPhotos.length ? `\n${logPhotos.length} logged photo(s) of this bird are attached to the keeper's message.` : "") });

      const history = [...chat.history, ...turn];
      const result = mode === "key"
        ? await sendKeyMode(ExpertCore.buildParams({ history, conditions: HEALTH_CONDITIONS, refLinks: healthRefLinks, sources: HEALTH_SOURCES }), handlers)
        : await sendServerMode(history, handlers);

      chat.history = [...history, { role: "assistant", content: result.content }];
      logPhotos.forEach((e) => chat.sentPhotoIds.add(e.id));
      statusEl.textContent = "";
      if (result.stop_reason === "refusal") bodyEl.innerHTML += '<p class="muted">Claude declined to answer this one. Try rephrasing the question.</p>';
      if (!text) bodyEl.innerHTML = md(result.content.filter((b) => b.type === "text").map((b) => b.text).join("")) || '<p class="muted">No answer came back.</p>';
      const finalText = result.content.filter((b) => b.type === "text").map((b) => b.text).join("") || text;
      finish(out, band, question, finalText, result.sources);
    } catch (err) {
      statusEl.textContent = "";
      const keep = err.partial != null ? err.partial : text;
      bodyEl.innerHTML = (keep ? md(keep) : "") + `<p class="x-err">${esc(err.message || String(err))}</p>`;
      // The turn didn't complete, so it isn't added to history; let them retry.
      $("xInput").value = question;
    } finally {
      chat.busy = false; chat.abort = null;
      $("xSend").disabled = false; $("xStop").hidden = true;
    }
  }

  function finish(out, band, question, finalText, sources) {
      const foot = document.createElement("div");
      foot.className = "x-foot";
      foot.innerHTML = `${sources && sources.length ? `<details class="x-sources"><summary>Sources (${sources.length})</summary><ul>${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("")}</ul></details>` : ""}
        ${band ? `<button type="button" class="ghost sm">Save to ${esc(band)}'s log</button>` : ""}`;
      out.appendChild(foot);
      const saveBtn = foot.querySelector("button");
      if (saveBtn) saveBtn.onclick = async () => {
        await HealthDB.addEntry({ band, type: "expert", date: new Date().toISOString().slice(0, 10), data: { question, answer: finalText, sources: sources || [] } });
        saveBtn.textContent = "Saved ✓"; saveBtn.disabled = true;
        HealthDB.refreshBandList().catch(() => {});
      };
  }

  function newChat() {
    if (chat.busy) return;
    chat.history = []; chat.turns = []; chat.photosUsed = 0; chat.sentPhotoIds.clear();
    $("xChat").innerHTML = "";
    $("xEmpty").hidden = false;
  }

  // No-key option: package the question with the bird's log and matching condition notes,
  // copy it, and open Claude (the keeper's own Claude subscription).
  async function askInClaude() {
    const question = $("xInput").value.trim();
    if (!question) { $("xInput").focus(); return; }
    const band = $("xBand").value.trim();
    const parts = [
      "I keep gamefowl for breeding and need poultry health advice. Please act as an experienced poultry vet adviser: give the most likely causes ranked, what to do today, red flags that need a vet, and drug classes with a reminder to confirm doses and withdrawal times with a vet. Search Merck Veterinary Manual, university extension sites and USDA where helpful, and end with a Sources list with links.",
      "",
      "My question: " + question,
    ];
    let conditionIds = new Set(chat.focus ? [chat.focus] : []);
    if (band && $("xUseLog").checked) {
      const rec = await birdRecord(band);
      parts.push("", rec.text);
      const checks = (await HealthDB.allEntries()).filter((e) => e.band === band && e.type === "check");
      const last = checks.sort((a, b) => b.created - a.created)[0];
      if (last) last.data.top.slice(0, 2).forEach((t) => conditionIds.add(t.id));
      if (rec.photos.length) parts.push(`(I have ${rec.photos.length} photo(s) of this bird and will attach them.)`);
    }
    const notes = [...conditionIds].map((id) => HEALTH_CONDITIONS.find((c) => c.id === id)).filter(Boolean).map((c) => {
      const refs = healthRefLinks(c.id).filter((l) => l.kind === "merck").map((l) => l.url).join(" ");
      return `- ${c.name}: ${c.about} Signs: ${c.check} Vet if: ${c.vet}${refs ? " Ref: " + refs : ""}`;
    });
    if (notes.length) parts.push("", "My app's notes on the likely conditions:", ...notes);
    const text = parts.join("\n");
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (e) {}
    const url = "https://claude.ai/new?q=" + encodeURIComponent(text);
    $("xClaudeMsg").innerHTML = (copied ? "Copied. " : "") + (url.length < 7000
      ? `Claude is opening with your question filled in${copied ? " (if not, paste it)" : ""}. Attach your photos there.`
      : "Your question is long, so paste it into a new Claude chat and attach your photos.");
    if (url.length < 7000) window.open(url, "_blank", "noopener");
    else window.open("https://claude.ai/new", "_blank", "noopener");
  }

  function open({ band, question, focus } = {}) {
    chat.focus = focus || null;
    if (typeof showTab === "function") showTab("expert");
    if (band) $("xBand").value = band;
    if (question) $("xInput").value = question;
    $("xInput").focus();
  }

  function wire() {
    $("xMode").addEventListener("change", syncMode);
    $("xSave").addEventListener("click", saveSettings);
    $("xSend").addEventListener("click", ask);
    $("xInClaude").addEventListener("click", askInClaude);
    $("xStop").addEventListener("click", () => chat.abort && chat.abort.abort());
    $("xNew").addEventListener("click", newChat);
    $("xInput").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(); } });
    $("xPhotoBtn").addEventListener("click", () => $("xPhoto").click());
    $("xPhoto").addEventListener("change", () => {
      for (const f of $("xPhoto").files) {
        if (chat.pending.length >= 4) break;
        chat.pending.push({ blob: f, url: URL.createObjectURL(f) });
      }
      $("xPhoto").value = "";
      renderPending();
    });
    $("xAttach").addEventListener("click", (e) => {
      const i = e.target.closest("[data-rm]")?.dataset.rm;
      if (i !== undefined) { URL.revokeObjectURL(chat.pending[i].url); chat.pending.splice(Number(i), 1); renderPending(); }
    });
    $("xSuggest").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (b) { $("xInput").value = b.textContent; $("xInput").focus(); }
    });
  }

  function renderLibrary() {
    const groups = typeof HEALTH_SOURCES !== "undefined" ? HEALTH_SOURCES : [];
    const n = typeof HEALTH_CONDITIONS !== "undefined" ? HEALTH_CONDITIONS.length : 0;
    $("xLibraryList").innerHTML = `<h4>Gamefowl Pro condition library</h4><p class="muted">${n} conditions, each with Merck references, forum cases, extension guides and photos where available. Open them from Health → Symptom Checker.</p>` +
      groups.map((g) => `<h4>${esc(g.group)}</h4><ul class="refs">${g.items.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul>`).join("") +
      `<h4>Searched by the expert</h4><p class="muted">${esc(ExpertCore.TRUSTED_DOMAINS.join(", "))}</p>`;
  }

  window.ExpertUI = { open };
  document.addEventListener("DOMContentLoaded", () => {
    if (!$("expert")) return;
    wire(); loadSettings(); renderLibrary();
    initBuiltInClaude();
  });

  async function initBuiltInClaude() {
    let sample = null;
    try { sample = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch (e) {}
    if (!sample) return;
    chat.sample = sample;
    try { const lim = await sample.limits(); chat.imageLimit = (lim.images && lim.images.maxCount) || 0; } catch (e) {}
    $("xSettings").hidden = true;
    $("xInClaude").hidden = true;
    const hint = $("xSetupHint");
    hint.className = "muted x-mode-note";
    hint.textContent = `Answers come from Claude on your own Claude account, using the app's ${HEALTH_CONDITIONS.length}-condition library and Merck references. Claude can't browse the web here, so open the source links to double-check.`;
    hint.hidden = false;
    if (!chat.imageLimit) $("xPhotoBtn").title = "Photos can't be sent to Claude in this view";
  }
})();
