(function () {
  var KB = window.HealthKB, AI = window.HealthAI;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  var KEY_LOG = 'gpfh-log', KEY_MODE = 'gpfh-mode';
  var PHOTO_SLOTS = ['Whole bird', 'Head & face', 'Problem area', 'Droppings'];
  var state = { mode: load(KEY_MODE, 'backyard'), area: null, selected: [], photos: {}, sample: null, maxImages: 0, running: false, ctrl: null, last: null, chat: [] };

  // ---------- Mode & tabs ----------
  function setMode(m) {
    state.mode = m; save(KEY_MODE, m);
    $$('.mode button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    document.body.dataset.mode = m;
    $('#b-name').placeholder = m === 'gamefowl' ? 'e.g. RR-114' : 'e.g. Henrietta';
  }
  $$('.mode button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  setMode(state.mode);
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 'tab-' + b.dataset.tab); });
      if (b.dataset.tab === 'log') renderLog();
      window.scrollTo(0, 0);
    });
  });
  function goTab(n) { $('.tabs button[data-tab="' + n + '"]').click(); }

  // ---------- Symptom picker ----------
  $('#hotspots').innerHTML = KB.AREAS.map(function (a) {
    return '<button type="button" class="hot" data-area="' + a.id + '" style="left:' + a.x + '%;top:' + a.y + '%" aria-label="' + esc(a.label) + '"><span></span></button>';
  }).join('');
  $('#areaList').innerHTML = KB.AREAS.map(function (a) { return '<button type="button" class="achip" data-area="' + a.id + '">' + esc(a.label) + '<em></em></button>'; }).join('');
  $$('[data-area]').forEach(function (b) { b.addEventListener('click', function () { pickArea(b.dataset.area); }); });

  function pickArea(id) {
    state.area = id;
    $$('[data-area]').forEach(function (b) { b.classList.toggle('on', b.dataset.area === id); });
    var area = KB.AREAS.filter(function (a) { return a.id === id; })[0];
    $('#symList').innerHTML = '<h3>' + esc(area.label) + '</h3><div class="schips">' + KB.SYMPTOMS[id].map(function (s) {
      return '<button type="button" class="schip' + (state.selected.indexOf(s[0]) >= 0 ? ' on' : '') + '" data-sym="' + s[0] + '" aria-pressed="' + (state.selected.indexOf(s[0]) >= 0) + '">' + esc(s[1]) + '</button>';
    }).join('') + '</div>';
    $$('#symList [data-sym]').forEach(function (b) { b.addEventListener('click', function () { toggleSym(b.dataset.sym); }); });
  }
  function toggleSym(s) {
    var i = state.selected.indexOf(s);
    if (i >= 0) state.selected.splice(i, 1); else state.selected.push(s);
    if (state.area) pickArea(state.area);
    renderChosen(); renderLocal();
  }
  function areaCounts() {
    var c = {};
    Object.keys(KB.SYMPTOMS).forEach(function (a) { c[a] = KB.SYMPTOMS[a].filter(function (s) { return state.selected.indexOf(s[0]) >= 0; }).length; });
    return c;
  }
  function renderChosen() {
    var c = areaCounts();
    $$('.achip').forEach(function (b) { $('em', b).textContent = c[b.dataset.area] ? c[b.dataset.area] : ''; });
    $$('.hot').forEach(function (b) { b.classList.toggle('has', !!c[b.dataset.area]); });
    $('#chosen').innerHTML = state.selected.length ? '<b>Signs chosen:</b> ' + state.selected.map(function (s) {
      return '<button type="button" class="tag" data-rm="' + s + '">' + esc(KB.LABEL[s]) + ' ✕</button>';
    }).join('') : '';
    $$('#chosen [data-rm]').forEach(function (b) { b.addEventListener('click', function () { toggleSym(b.dataset.rm); }); });
  }

  function urgBadge(u) { return '<span class="urg u-' + u + '">' + esc(KB.URGENCY[u].label) + '</span>'; }

  function renderLocal() {
    var rf = KB.redFlags(state.selected), fb = $('#flagbox');
    fb.hidden = !rf.reportable;
    fb.innerHTML = rf.reportable ? '<b>🚨 Possible reportable disease warning:</b> ' + rf.flags.map(esc).join(' · ') +
      '. Keep birds and eggs on the property and call your vet, state veterinarian or USDA <a href="tel:18665367593">' + KB.USDA_LINE + '</a>.' : '';
    var m = KB.match(state.selected).slice(0, 5);
    $('#local').innerHTML = !state.selected.length ? '' : '<h3>Quick matches <small>(offline guide, by signs only)</small></h3>' + (m.length ? m.map(function (x) {
      return '<details class="match"><summary>' + urgBadge(x.c.urgency) + ' <b>' + esc(x.c.name) + '</b> <span class="muted">— matches ' + x.hit.length + ' sign' + (x.hit.length > 1 ? 's' : '') + '</span>' + (x.c.reportable ? ' <span class="rep">Reportable</span>' : '') + '</summary>' + condBody(x.c) + '</details>';
    }).join('') : '<p class="hint">No common condition matches these signs. Run the AI panel or call your vet.</p>') +
      '<p class="small muted">Matches show what fits, not what it is. Many conditions look alike.</p>';
  }
  function condBody(c) {
    return '<div class="cbody"><p>' + esc(c.summary) + '</p><p><b>What to do:</b></p><ul>' + c.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul><p><b>Prevention:</b> ' + esc(c.prevention) + '</p>' +
      '<p class="small muted">Signs: ' + c.signs.map(function (s) { return esc(KB.LABEL[s]); }).join(' · ') + '</p></div>';
  }

  // ---------- Photos ----------
  $('#slots').innerHTML = PHOTO_SLOTS.map(function (v) {
    return '<div class="slot" data-view="' + v + '"><label class="pick"><span class="sname">' + v + '</span><input type="file" accept="image/*"></label><button type="button" class="xbtn" hidden>Remove</button></div>';
  }).join('');
  $$('.slot').forEach(function (slot) {
    var view = slot.dataset.view, inp = $('input', slot);
    inp.addEventListener('change', async function () {
      var f = inp.files[0]; inp.value = ''; if (!f) return;
      try {
        var c = await fileToCanvas(f, 1400);
        state.photos[view] = { canvas: c, thumb: thumb(c, 360) };
        $('.pick', slot).style.backgroundImage = 'url(' + state.photos[view].thumb + ')'; slot.classList.add('has'); $('.xbtn', slot).hidden = false;
      } catch (e) { setStatus(e.message, 'err'); }
    });
    $('.xbtn', slot).addEventListener('click', function () { delete state.photos[view]; $('.pick', slot).style.backgroundImage = ''; slot.classList.remove('has'); this.hidden = true; });
  });
  function fileToCanvas(file, max) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), img = new Image();
      img.onload = function () { var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Could not read that image.')); };
      img.src = u;
    });
  }
  function thumb(c, n) { var s = Math.min(1, n / Math.max(c.width, c.height)), t = document.createElement('canvas'); t.width = Math.round(c.width * s); t.height = Math.round(c.height * s); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', 0.7); }
  function blob(c) { return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('encode failed')); }, 'image/jpeg', 0.85); }); }

  // ---------- Claude ----------
  function setStatus(m, k) { var el = $('#status'); el.textContent = m; el.className = 'status' + (k ? ' ' + k : ''); }
  async function connect() {
    if (!window.claude || typeof window.claude.use !== 'function') { setStatus('The AI panel runs in the Gamefowl Pro app on claude.ai. The symptom checker and disease guide work everywhere.', 'warn'); $('#run').disabled = true; return; }
    try { state.sample = await window.claude.use('sample'); } catch (e) { state.sample = null; }
    if (!state.sample) { setStatus('The AI panel is not available in this view. The symptom checker still works.', 'warn'); $('#run').disabled = true; return; }
    var lim = await state.sample.limits().catch(function () { return null; });
    state.maxImages = lim && lim.images ? Math.max(1, lim.images.maxCount || 1) : 0;
    setStatus('Ready — choose signs and/or add photos.');
  }
  function errText(e) {
    var c = e && e.code;
    return c === 'cancelled' ? 'Stopped.' : c === 'not_granted' ? 'Claude access was not allowed for this page.' : c === 'rate_limited' ? 'Usage limit reached — try again later.' :
      c === 'image_rejected' ? 'One photo could not be used. Try JPG or PNG.' : 'Could not finish: ' + ((e && e.message) || 'unknown error');
  }
  function history() { var h = {}; $$('[data-h]').forEach(function (el) { if (el.value) h[el.dataset.h.replace('_', ' ')] = el.value; }); return h; }

  $('#run').addEventListener('click', run);
  async function run() {
    if (state.running) { if (state.ctrl) state.ctrl.abort(); return; }
    var views = PHOTO_SLOTS.filter(function (v) { return state.photos[v]; }).slice(0, state.maxImages || 0);
    if (!state.selected.length && !views.length) { setStatus('Choose at least one sign or add a photo.', 'err'); return; }
    var bird = { name: $('#b-name').value.trim(), age: $('#b-age').value, sex: $('#b-sex').value, mode: state.mode };
    var hist = history(), symptoms = state.selected.slice();
    state.running = true; state.ctrl = new AbortController(); $('#run').textContent = 'Stop';
    $('#result').innerHTML = '<div class="card"><div class="exgrid">' + AI.EXAMINERS.map(function (x) { return '<div class="excard pending" id="ex-' + x.id + '"><h4>' + x.icon + ' ' + x.name + '</h4><p class="hint">Reviewing…</p></div>'; }).join('') + '</div></div>';
    try {
      var blobs = await Promise.all(views.map(function (v) { return blob(state.photos[v].canvas); }));
      var labels = views.map(function (v) { return v.toLowerCase() + ' photo'; });
      setStatus('The health panel is reviewing ' + (bird.name || 'your bird') + '…');
      var opts = function () { var o = { modelTier: 'complex', signal: state.ctrl.signal }; if (blobs.length) o.images = blobs; return o; };
      var cards = await Promise.all(AI.EXAMINERS.map(function (x) {
        return state.sample.json(AI.examinerPrompt(x, bird, symptoms, hist, labels), opts())
          .then(function (r) { var c = { ex: x, result: AI.normalize(r) }; renderEx(c); return c; })
          .catch(function (e) { if (e && e.code === 'cancelled') throw e; failEx(x, e); return null; });
      }));
      cards = cards.filter(Boolean);
      if (!cards.length) throw { message: 'No reviewer could answer.' };
      var merged = AI.merge(cards, symptoms);
      setStatus('Putting it together…');
      var head = null;
      try { head = await state.sample.json(AI.headPrompt(bird, symptoms, hist, cards, merged), { modelTier: 'default', signal: state.ctrl.signal }); } catch (e) { if (e && e.code === 'cancelled') throw e; }
      if (head && typeof head === 'object') {
        merged.urgency = AI.maxUrgency([merged.urgency, KB.URGENCY[head.urgency] ? head.urgency : 'normal']);
        if (head.reportable_concern === true) { merged.reportable = true; merged.urgency = 'emergency'; }
      }
      state.last = { id: Date.now().toString(36), date: today(), bird: bird, symptoms: symptoms, history: hist, merged: merged, head: head,
        panel: cards.map(function (c) { return { id: c.ex.id, name: c.ex.name, icon: c.ex.icon, result: c.result }; }),
        thumb: views.length ? state.photos[views[0]].thumb : '', status: 'open', notes: '' };
      state.chat = [];
      renderResult(state.last, $('#result'), true);
      setStatus('Done. This is guidance, not a diagnosis.', 'ok');
    } catch (e) { setStatus(errText(e), e && e.code === 'cancelled' ? '' : 'err'); }
    finally { state.running = false; state.ctrl = null; $('#run').textContent = 'Check My Bird'; }
  }

  function exHTML(c) {
    var r = c.result;
    return '<h4>' + c.icon + ' ' + esc(c.name) + '</h4>' + urgBadge(r.urgency) +
      (r.observations.length ? '<ul>' + r.observations.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' : '') +
      (r.possible_conditions.length ? '<p class="small"><b>Possible:</b> ' + r.possible_conditions.map(function (p) { return esc(p.name) + ' (' + p.likelihood + ')'; }).join(', ') + '</p>' : '') +
      (r.red_flags.length ? '<p class="flag">⚠️ ' + r.red_flags.map(esc).join('; ') + '</p>' : '') + '<p class="small muted">Confidence: ' + r.confidence + '</p>';
  }
  function renderEx(c) { var el = $('#ex-' + c.ex.id); el.className = 'excard'; el.innerHTML = exHTML({ icon: c.ex.icon, name: c.ex.name, result: c.result }); }
  function failEx(x, e) { var el = $('#ex-' + x.id); el.className = 'excard failed'; el.innerHTML = '<h4>' + x.icon + ' ' + x.name + '</h4><p class="hint">Could not review' + (e && e.code ? ' (' + esc(e.code) + ')' : '') + '.</p>'; }

  function kbFor(name) {
    var n = name.toLowerCase();
    return KB.CONDITIONS.filter(function (c) { var k = c.name.toLowerCase().split(/[(\/—]/)[0].trim(); return n.indexOf(k) >= 0 || k.indexOf(n.split(/[(\/]/)[0].trim()) >= 0; })[0];
  }

  function renderResult(a, host, fresh) {
    var m = a.merged, h = a.head && typeof a.head === 'object' ? a.head : null, U = KB.URGENCY[m.urgency];
    var conds = h && Array.isArray(h.top_conditions) && h.top_conditions.length ? h.top_conditions.slice(0, 5).map(function (c) { return { name: String(c.name || ''), likelihood: c.likelihood || 'low', why: String(c.why || '') }; }) :
      m.conditions.map(function (c) { return { name: c.name, likelihood: c.score >= 6 ? 'high' : c.score >= 3 ? 'moderate' : 'low', why: c.why }; });
    var list = function (t, x) { return Array.isArray(x) && x.length ? '<h3>' + t + '</h3><ul>' + x.slice(0, 6).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : ''; };
    var steps = h && h.steps ? h.steps : uniq(a.panel.reduce(function (s, p) { return s.concat(p.result.immediate_steps); }, []));
    var vet = h && h.tell_vet ? h.tell_vet : uniq(a.panel.reduce(function (s, p) { return s.concat(p.result.tell_vet); }, []));
    var photos = uniq(a.panel.reduce(function (s, p) { return s.concat(p.result.photos_needed); }, []));
    host.innerHTML = '<div class="card result">' +
      '<div class="ubanner u-' + m.urgency + '"><div><small>Urgency</small><b>' + esc(U.label) + '</b></div><p>' + esc(U.advice) + '</p></div>' +
      (m.reportable ? '<div class="flagbox">🚨 <b>Possible reportable disease.</b> ' + (m.ruleFlags.length ? esc(m.ruleFlags.join(' · ')) + '. ' : '') + 'Keep birds, eggs and equipment on the property, separate sick birds, and call your vet, state veterinarian or USDA <a href="tel:18665367593">' + KB.USDA_LINE + '</a>.</div>' : '') +
      (m.unclear ? '<div class="unclear">❓ <b>Unclear.</b> The panel couldn’t judge this well. Retake clearer photos, add more signs, or call your vet.</div>' : '') +
      '<div class="rhead">' + (a.thumb ? '<img alt="" src="' + a.thumb + '">' : '') + '<div><h2>' + esc(a.bird.name || 'Your bird') + '</h2><p class="small muted">' + esc([a.bird.age, a.bird.sex, a.bird.mode === 'gamefowl' ? 'Gamefowl' : 'Backyard', a.date].filter(Boolean).join(' · ')) + '</p></div></div>' +
      (h && h.summary ? '<p class="summary">' + esc(h.summary) + '</p>' : '') +
      '<h3>What it might be</h3><div class="conds">' + conds.map(function (c) {
        var k = kbFor(c.name);
        return '<details class="match"><summary><span class="lk lk-' + esc(c.likelihood) + '">' + esc(c.likelihood) + '</span> <b>' + esc(c.name) + '</b>' + (k && k.reportable ? ' <span class="rep">Reportable</span>' : '') + (c.why ? ' <span class="muted">— ' + esc(c.why) + '</span>' : '') + '</summary>' + (k ? condBody(k) : '<p class="cbody small muted">Not in the offline guide — ask your vet.</p>') + '</details>';
      }).join('') + '</div>' +
      list('Do this now', steps) + list('Get help right away if', h && h.watch_for) + list('Tell your vet', vet) +
      (photos.length ? '<p class="small muted">Photos that would help: ' + photos.map(esc).join(', ') + '</p>' : '') +
      '<details><summary>Panel details</summary><div class="exgrid">' + a.panel.map(function (p) { return '<div class="excard">' + exHTML(p) + '</div>'; }).join('') + '</div></details>' +
      '<div class="row-btns">' + (fresh ? '<button type="button" class="btn" data-act="save">Save to Health Log</button>' : '') +
      '<button type="button" class="btn ghost" data-act="report">Download vet report</button><button type="button" class="btn ghost" data-act="copy">Copy summary</button></div>' +
      (fresh ? '<div class="chat"><h3>💬 Ask a follow-up</h3><div class="msgs" id="msgs"></div><div class="ask"><input id="askBox" placeholder="e.g. Is it safe to eat her eggs? Should I separate her?"><button type="button" class="btn small" id="askBtn">Ask</button></div></div>' : '') +
      '<p class="small muted">Guidance only — not a veterinary diagnosis. No medication doses are given; your vet decides treatment and withdrawal times.</p></div>';
    $$('[data-act]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.act === 'save') { var log = load(KEY_LOG, []); if (!log.some(function (x) { return x.id === a.id; })) log.unshift(a); b.textContent = save(KEY_LOG, log) ? 'Saved ✓' : 'Storage full — export and delete old entries'; b.disabled = true; }
        if (b.dataset.act === 'report') downloadReport(a, b);
        if (b.dataset.act === 'copy') { var t = summaryText(a); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Copy blocked'; }); }
      });
    });
    if (fresh) { $('#askBtn').addEventListener('click', ask); $('#askBox').addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); }); host.scrollIntoView({ behavior: 'smooth' }); }
  }
  function uniq(a) { var s = {}; return a.filter(function (x) { var k = String(x).toLowerCase(); if (s[k]) return false; s[k] = 1; return true; }).slice(0, 6); }

  // ---------- Follow-up chat ----------
  async function ask() {
    var box = $('#askBox'), q = box.value.trim();
    if (!q || !state.sample || !state.last) return;
    box.value = '';
    state.chat.push({ role: 'user', content: q });
    var msgs = $('#msgs');
    msgs.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(q) + '</div><div class="msg bot">Thinking…</div>');
    var bubble = msgs.lastElementChild;
    var ctx = { merged: state.last.merged, head: state.last.head, symptoms: state.last.symptoms.map(function (s) { return KB.LABEL[s]; }) };
    try {
      var r = await state.sample([{ role: 'user', content: AI.chatRules(state.last.bird, ctx) }, { role: 'assistant', content: 'Understood. What would you like to know?' }].concat(state.chat.slice(-10)), {
        cache: false, modelTier: 'default', onText: function (e) { bubble.textContent = e.text; }
      });
      bubble.textContent = r.text; state.chat.push({ role: 'assistant', content: r.text });
    } catch (e) { bubble.textContent = (e && e.text) || errText(e); state.chat.pop(); }
  }

  // ---------- Reports ----------
  function summaryText(a) {
    var m = a.merged, h = a.head || {};
    return ['Flock health check — ' + (a.bird.name || 'bird') + ' — ' + a.date, 'Urgency: ' + KB.URGENCY[m.urgency].label + (m.reportable ? ' (possible reportable disease)' : ''),
      'Signs: ' + a.symptoms.map(function (s) { return KB.LABEL[s]; }).join('; '),
      'History: ' + Object.keys(a.history).map(function (k) { return k + ': ' + a.history[k]; }).join('; '),
      h.summary ? 'Summary: ' + h.summary : '', 'Possible: ' + (h.top_conditions || m.conditions).map(function (c) { return c.name; }).join('; ')].filter(Boolean).join('\n');
  }
  async function downloadReport(a, btn) {
    var h = a.head || {}, m = a.merged;
    var li = function (x) { return (x || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join(''); };
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Vet report — ' + esc(a.bird.name || 'bird') + '</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1d2b25}h1{color:#0f4c5c}td{padding:4px 8px;border-bottom:1px solid #ddd;vertical-align:top}.u{font-weight:bold;padding:6px 10px;background:#f3e9d8;display:inline-block}</style></head><body>' +
      '<h1>Flock Health Report</h1><p>' + esc(a.date) + ' · Prepared with Gamefowl Pro Flock Health (AI-assisted, not a diagnosis)</p>' +
      '<table><tr><td><b>Bird</b></td><td>' + esc([a.bird.name, a.bird.age, a.bird.sex, a.bird.mode].filter(Boolean).join(', ')) + '</td></tr>' +
      '<tr><td><b>Signs</b></td><td>' + esc(a.symptoms.map(function (s) { return KB.LABEL[s]; }).join('; ') || '—') + '</td></tr>' +
      '<tr><td><b>History</b></td><td>' + esc(Object.keys(a.history).map(function (k) { return k + ': ' + a.history[k]; }).join('; ') || '—') + '</td></tr></table>' +
      '<p class="u">Urgency: ' + esc(KB.URGENCY[m.urgency].label) + (m.reportable ? ' — possible reportable disease' : '') + '</p>' +
      (h.summary ? '<p>' + esc(h.summary) + '</p>' : '') +
      '<h2>Possible conditions (AI panel)</h2><ul>' + li((h.top_conditions || m.conditions).map(function (c) { return c.name + (c.likelihood ? ' — ' + c.likelihood : '') + (c.why ? ': ' + c.why : ''); })) + '</ul>' +
      '<h2>Questions / facts for the vet</h2><ul>' + li(h.tell_vet) + '</ul>' +
      (a.thumb ? '<h2>Photo</h2><img alt="Bird photo" src="' + a.thumb + '" style="max-width:360px">' : '') +
      '<h2>Owner notes</h2><p>' + esc(a.notes || '—') + '</p></body></html>';
    var name = 'health-report-' + (a.bird.name || 'bird').replace(/[^a-z0-9]+/gi, '-') + '-' + a.date + '.html';
    try { var dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename: name, data: html }); btn.textContent = 'Downloaded ✓'; return; } } catch (e) { /* fall back */ }
    var el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); el.download = name; el.click(); btn.textContent = 'Downloaded ✓';
  }

  // ---------- Log ----------
  function renderLog() {
    var log = load(KEY_LOG, []), box = $('#logList');
    if (!log.length) { box.innerHTML = '<div class="empty">No saved health checks yet.</div>'; return; }
    box.innerHTML = log.map(function (a, i) {
      return '<div class="logrow"><div class="lhead">' + (a.thumb ? '<img alt="" src="' + a.thumb + '">' : '<span class="noimg">🐔</span>') + '<div><b>' + esc(a.bird.name || 'Unnamed bird') + '</b><span>' + a.date + ' · ' + esc((a.symptoms || []).slice(0, 3).map(function (s) { return KB.LABEL[s]; }).join(', ')) + '</span></div>' + urgBadge(a.merged.urgency) + '</div>' +
        '<div class="lctl"><label>Status<select data-status="' + i + '"><option value="open">Open</option><option value="recovering">Recovering</option><option value="resolved">Resolved</option><option value="vet">With vet</option><option value="lost">Lost</option></select></label>' +
        '<label class="grow">Notes (treatment from vet, egg withdrawal until…)<input data-notes="' + i + '" value="' + esc(a.notes || '') + '"></label>' +
        '<button type="button" class="link" data-open="' + i + '">View</button><button type="button" class="del" data-del="' + i + '">🗑</button></div><div class="ldetail" id="ld-' + i + '"></div></div>';
    }).join('');
    $$('[data-status]').forEach(function (s) { var a = log[+s.dataset.status]; s.value = a.status || 'open'; s.addEventListener('change', function () { var l = load(KEY_LOG, []); l[+s.dataset.status].status = s.value; save(KEY_LOG, l); }); });
    $$('[data-notes]').forEach(function (s) { s.addEventListener('change', function () { var l = load(KEY_LOG, []); l[+s.dataset.notes].notes = s.value; save(KEY_LOG, l); }); });
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { var host = $('#ld-' + b.dataset.open); if (host.innerHTML) { host.innerHTML = ''; return; } renderResult(load(KEY_LOG, [])[+b.dataset.open], host, false); }); });
    $$('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Delete?'; b.classList.add('armed'); setTimeout(function () { if (b.isConnected) { delete b.dataset.armed; b.textContent = '🗑'; b.classList.remove('armed'); } }, 3000); return; }
        var l = load(KEY_LOG, []); l.splice(+b.dataset.del, 1); save(KEY_LOG, l); renderLog();
      });
    });
  }
  $('#exportBtn').addEventListener('click', async function () {
    var data = JSON.stringify({ app: 'gamefowl-pro-flock-health', version: 1, exported: today(), log: load(KEY_LOG, []) }), name = 'flock-health-backup-' + today() + '.json', btn = this;
    try { var dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename: name, data: data }); btn.textContent = 'Exported ✓'; return; } } catch (e) { /* fall back */ }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; a.click(); btn.textContent = 'Exported ✓';
  });
  $('#importFile').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { var j = JSON.parse(r.result); if (!Array.isArray(j.log)) throw 0; var l = load(KEY_LOG, []); j.log.forEach(function (x) { if (x && x.id && x.merged && !l.some(function (y) { return y.id === x.id; })) l.push(x); }); l.sort(function (a, b) { return a.date < b.date ? 1 : -1; }); save(KEY_LOG, l); renderLog(); }
      catch (e) { $('#logList').insertAdjacentHTML('afterbegin', '<p class="status err">That file is not a Flock Health backup.</p>'); }
    };
    r.readAsText(f);
  });

  // ---------- Disease guide ----------
  function renderDiseases() {
    var q = $('#dSearch').value.trim().toLowerCase(), f = $('#dFilter').value;
    var list = KB.CONDITIONS.filter(function (c) {
      if (f === 'reportable' && !c.reportable) return false;
      if (f === 'emergency' && c.urgency !== 'emergency') return false;
      if (f === 'contagious' && !c.contagious) return false;
      if (!q) return true;
      return (c.name + ' ' + c.summary + ' ' + c.signs.map(function (s) { return KB.LABEL[s]; }).join(' ')).toLowerCase().indexOf(q) >= 0;
    });
    $('#dList').innerHTML = list.length ? list.map(function (c) {
      return '<details class="match"><summary>' + urgBadge(c.urgency) + ' <b>' + esc(c.name) + '</b>' + (c.reportable ? ' <span class="rep">Reportable</span>' : '') + (c.contagious ? ' <span class="cont">Contagious</span>' : '') + '</summary>' + condBody(c) + '</details>';
    }).join('') : '<div class="empty">Nothing matches that search.</div>';
  }
  $('#dSearch').addEventListener('input', renderDiseases);
  $('#dFilter').addEventListener('change', renderDiseases);
  renderDiseases();

  pickArea('general');
  renderChosen();
  connect();
})();
