(function () {
  var R = window.AgentRoster;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var byId = {}; R.AGENTS.forEach(function (a) { byId[a.id] = a; });

  var KEY_CHATS = 'gpai-chats', KEY_PREFS = 'gpai-prefs', MAX_KEEP = 40, MAX_SEND = 16;
  var prefs = load(KEY_PREFS, { mode: 'both', lang: 'English', agent: 'concierge' });
  var chats = load(KEY_CHATS, {});
  var state = { agent: byId[prefs.agent] || byId.concierge, sample: null, maxImages: 0, files: [], busy: false, ctrl: null };

  // ---------- Markdown (safe: escape first, then a small subset) ----------
  function inline(s) {
    return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function md(src) {
    var lines = esc(src).split('\n'), out = [], list = null, table = null, code = null;
    function closeList() { if (list) { out.push('</' + list + '>'); list = null; } }
    function closeTable() { if (table) { out.push('<div class="tw"><table>' + table.join('') + '</table></div>'); table = null; } }
    lines.forEach(function (l) {
      if (/^```/.test(l)) { if (code) { out.push('<pre>' + code.join('\n') + '</pre>'); code = null; } else { closeList(); closeTable(); code = []; } return; }
      if (code) { code.push(l); return; }
      if (/^\s*\|.*\|\s*$/.test(l)) {
        closeList(); if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) return;
        table = table || []; var cells = l.trim().replace(/^\||\|$/g, '').split('|');
        var tag = table.length ? 'td' : 'th'; table.push('<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>'); return;
      }
      closeTable();
      var h = l.match(/^(#{1,4})\s+(.*)/), ul = l.match(/^\s*[-*•]\s+(.*)/), ol = l.match(/^\s*\d+[.)]\s+(.*)/);
      if (h) { closeList(); out.push('<h4>' + inline(h[2]) + '</h4>'); }
      else if (ul || ol) { var t = ul ? 'ul' : 'ol'; if (list !== t) { closeList(); out.push('<' + t + '>'); list = t; } out.push('<li>' + inline((ul || ol)[1]) + '</li>'); }
      else if (!l.trim()) { closeList(); }
      else { closeList(); out.push('<p>' + inline(l) + '</p>'); }
    });
    if (code) out.push('<pre>' + code.join('\n') + '</pre>');
    closeList(); closeTable();
    return out.join('');
  }
  function splitHandoff(t) {
    var m = t.match(/\n?\s*HANDOFF:\s*([a-z]+)\s*$/i);
    return m && byId[m[1].toLowerCase()] && m[1].toLowerCase() !== state.agent.id ? { text: t.slice(0, m.index).trim(), to: m[1].toLowerCase() } : { text: t.replace(/\n?\s*HANDOFF:\s*\S*\s*$/i, '').trim(), to: null };
  }

  // ---------- Roster ----------
  function renderRoster() {
    $('#roster').innerHTML = R.GROUPS.map(function (g) {
      var list = R.AGENTS.filter(function (a) { return a.group === g.id; });
      return '<h3>' + esc(g.label) + '</h3>' + list.map(function (a) {
        var n = (chats[a.id] || []).length;
        return '<button type="button" class="agent' + (a.id === state.agent.id ? ' on' : '') + '" data-agent="' + a.id + '"><span class="aicon">' + a.icon + '</span><span class="atext"><b>' + esc(a.name) + '</b><small>' + esc(a.tagline) + '</small></span>' + (n ? '<em>' + n + '</em>' : '') + '</button>';
      }).join('');
    }).join('') + '<p class="note">Agents give guidance, not veterinary or legal advice. Chats are saved on this device.</p>';
    $$('[data-agent]').forEach(function (b) { b.addEventListener('click', function () { selectAgent(b.dataset.agent, true); }); });
  }
  function selectAgent(id, open) {
    state.agent = byId[id] || byId.concierge; prefs.agent = state.agent.id; save(KEY_PREFS, prefs);
    $$('[data-agent]').forEach(function (b) { b.classList.toggle('on', b.dataset.agent === state.agent.id); });
    $('#cicon').textContent = state.agent.icon; $('#cname').textContent = state.agent.name; $('#ctag').textContent = state.agent.tagline;
    $('#box').placeholder = 'Message ' + state.agent.name + '…';
    $('#clip').hidden = !(state.agent.images && state.maxImages);
    state.files = []; renderAttached();
    renderMsgs();
    if (open) document.body.classList.add('chatting');
  }
  $('#back').addEventListener('click', function () { document.body.classList.remove('chatting'); });

  // ---------- Messages ----------
  function renderMsgs() {
    var list = chats[state.agent.id] || [], box = $('#msgs');
    if (!list.length) {
      box.innerHTML = '<div class="welcome"><div class="wicon">' + state.agent.icon + '</div><h2>' + esc(state.agent.name) + '</h2><p>' + esc(state.agent.tagline) + '</p><div class="starters">' +
        state.agent.starters.map(function (s) { return '<button type="button" class="starter">' + esc(s) + '</button>'; }).join('') + '</div></div>';
      $$('.starter', box).forEach(function (b) { b.addEventListener('click', function () { $('#box').value = b.textContent; $('#box').focus(); autosize(); }); });
      return;
    }
    box.innerHTML = list.map(msgHTML).join('');
    bindMsgButtons(box);
    box.scrollTop = box.scrollHeight;
  }
  function msgHTML(m) {
    if (m.role === 'user') return '<div class="msg me">' + (m.thumbs && m.thumbs.length ? '<div class="mthumbs">' + m.thumbs.map(function (t) { return '<img alt="Attached photo" src="' + t + '">'; }).join('') + '</div>' : '') + '<div>' + esc(m.content).replace(/\n/g, '<br>') + '</div></div>';
    var h = splitHandoff(m.content);
    return '<div class="msg bot"><div class="md">' + md(h.text) + '</div><div class="mfoot"><button type="button" class="mini" data-copy>Copy</button>' +
      (h.to ? '<button type="button" class="handoff" data-handoff="' + h.to + '">Talk to ' + byId[h.to].icon + ' ' + esc(byId[h.to].name) + ' →</button>' : '') + '</div></div>';
  }
  function bindMsgButtons(root) {
    $$('[data-copy]', root).forEach(function (b) {
      if (b.dataset.bound) return; b.dataset.bound = 1;
      b.addEventListener('click', function () { var t = b.closest('.msg').querySelector('.md').innerText; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Copy blocked'; }); });
    });
    $$('[data-handoff]', root).forEach(function (b) {
      if (b.dataset.bound) return; b.dataset.bound = 1;
      b.addEventListener('click', function () {
        var from = state.agent, list = chats[from.id] || [], lastQ = list.filter(function (m) { return m.role === 'user'; }).pop();
        selectAgent(b.dataset.handoff, true);
        if (lastQ && !(chats[state.agent.id] || []).length) { $('#box').value = lastQ.content; autosize(); setStatus('Your question from ' + from.name + ' is ready — tap Send.'); }
      });
    });
  }

  // ---------- Attachments ----------
  $('#files').addEventListener('change', async function () {
    var fl = Array.prototype.slice.call(this.files); this.value = '';
    var room = Math.min(4, state.maxImages) - state.files.length;
    for (var i = 0; i < fl.length && i < room; i++) {
      try { state.files.push(await prep(fl[i])); } catch (e) { setStatus('Could not read one photo.', 'err'); }
    }
    if (fl.length > room) setStatus('Up to ' + Math.min(4, state.maxImages) + ' photos per message.', 'warn');
    renderAttached();
  });
  function prep(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var t = document.createElement('canvas'), ts = Math.min(1, 160 / Math.max(c.width, c.height)); t.width = Math.round(c.width * ts); t.height = Math.round(c.height * ts); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
        c.toBlob(function (b) { b ? res({ blob: b, thumb: t.toDataURL('image/jpeg', 0.6) }) : rej(new Error('encode')); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('read')); };
      img.src = u;
    });
  }
  function renderAttached() {
    $('#attached').innerHTML = state.files.map(function (f, i) { return '<span class="att"><img alt="" src="' + f.thumb + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo">✕</button></span>'; }).join('');
    $$('#attached [data-rm]').forEach(function (b) { b.addEventListener('click', function () { state.files.splice(+b.dataset.rm, 1); renderAttached(); }); });
  }

  // ---------- Send ----------
  function setStatus(m, k) { var el = $('#status'); el.textContent = m || ''; el.className = 'status' + (k ? ' ' + k : ''); }
  function autosize() { var b = $('#box'); b.style.height = 'auto'; b.style.height = Math.min(160, b.scrollHeight) + 'px'; }
  $('#box').addEventListener('input', autosize);
  $('#box').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  $('#send').addEventListener('click', function () { if (state.busy) { if (state.ctrl) state.ctrl.abort(); } else send(); });

  async function send() {
    var text = $('#box').value.trim();
    if (!text && !state.files.length) return;
    if (!state.sample) { setStatus('Agents run in the Gamefowl Pro app on claude.ai.', 'warn'); return; }
    var agent = state.agent, files = state.files.slice();
    if (!text) text = 'Please look at ' + (files.length > 1 ? 'these photos' : 'this photo') + '.';
    var list = chats[agent.id] = chats[agent.id] || [];
    var userMsg = { role: 'user', content: text, thumbs: files.map(function (f) { return f.thumb; }) };
    list.push(userMsg);
    $('#box').value = ''; autosize(); state.files = []; renderAttached();
    renderMsgs();
    var box = $('#msgs');
    box.insertAdjacentHTML('beforeend', '<div class="msg bot pending"><div class="md"><p class="thinking">' + agent.icon + ' Thinking…</p></div></div>');
    var bubble = box.lastElementChild; box.scrollTop = box.scrollHeight;
    state.busy = true; state.ctrl = new AbortController(); $('#send').textContent = 'Stop'; setStatus('');
    var history = list.slice(-MAX_SEND).map(function (m, i, arr) {
      var c = m.content + (m.role === 'user' && m.thumbs && m.thumbs.length && i < arr.length - 1 ? '\n[The user attached ' + m.thumbs.length + ' photo(s) earlier; they are not shown again.]' : '');
      return { role: m.role, content: c };
    });
    var input = [{ role: 'user', content: R.ruleText(agent, prefs.mode, prefs.lang) }, { role: 'assistant', content: 'Understood. I’m ready to help.' }].concat(history);
    var opts = { cache: false, signal: state.ctrl.signal, modelTier: files.length ? 'complex' : 'default', onText: function (e) { bubble.querySelector('.md').innerHTML = md(splitHandoff(e.text).text); box.scrollTop = box.scrollHeight; } };
    if (files.length) opts.images = files.map(function (f) { return f.blob; });
    try {
      var r = await state.sample(input, opts);
      list.push({ role: 'assistant', content: r.text + (r.truncated ? '\n\n*(Answer cut short — ask me to continue.)*' : '') });
    } catch (e) {
      var keep = e && e.text;
      if (keep) list.push({ role: 'assistant', content: keep + '\n\n*(Stopped.)*' });
      else list.pop();
      setStatus(e && e.code === 'cancelled' ? 'Stopped.' : e && e.code === 'not_granted' ? 'Claude access was not allowed for this page.' : e && e.code === 'rate_limited' ? 'Usage limit reached — try again later.' : e && e.code === 'image_rejected' ? 'A photo could not be used. Try JPG or PNG.' : 'Something went wrong: ' + ((e && e.message) || 'unknown'), e && e.code === 'cancelled' ? '' : 'err');
    } finally {
      state.busy = false; state.ctrl = null; $('#send').textContent = 'Send';
      if (list.length > MAX_KEEP) list.splice(0, list.length - MAX_KEEP);
      if (!save(KEY_CHATS, chats)) { list.forEach(function (m) { delete m.thumbs; }); save(KEY_CHATS, chats); }
      renderMsgs(); renderRoster();
    }
  }

  // ---------- Chat actions ----------
  $('#clearChat').addEventListener('click', function () {
    var b = this;
    if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Clear?'; setTimeout(function () { delete b.dataset.armed; b.textContent = '🗑'; }, 3000); return; }
    delete b.dataset.armed; b.textContent = '🗑'; delete chats[state.agent.id]; save(KEY_CHATS, chats); renderMsgs(); renderRoster();
  });
  $('#exportChat').addEventListener('click', async function () {
    var list = chats[state.agent.id] || []; if (!list.length) { setStatus('Nothing to download yet.'); return; }
    var txt = state.agent.name + ' — Gamefowl Pro AI Agents\n\n' + list.map(function (m) { return (m.role === 'user' ? 'You' : state.agent.name) + ':\n' + splitHandoff(m.content).text; }).join('\n\n---\n\n');
    var name = 'chat-' + state.agent.id + '-' + new Date().toISOString().slice(0, 10) + '.txt';
    try { var dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename: name, data: txt }); setStatus('Chat downloaded.', 'ok'); return; } } catch (e) { /* fall back */ }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = name; a.click(); setStatus('Chat downloaded.', 'ok');
  });

  // ---------- Prefs ----------
  $('#mode').value = prefs.mode; $('#lang').value = prefs.lang;
  $('#mode').addEventListener('change', function () { prefs.mode = this.value; save(KEY_PREFS, prefs); });
  $('#lang').addEventListener('change', function () { prefs.lang = this.value; save(KEY_PREFS, prefs); });

  // ---------- Connect ----------
  async function connect() {
    if (!window.claude || typeof window.claude.use !== 'function') { setStatus('The agents run in the Gamefowl Pro app on claude.ai.', 'warn'); $('#send').disabled = true; return; }
    try { state.sample = await window.claude.use('sample'); } catch (e) { state.sample = null; }
    if (!state.sample) { setStatus('The agents are not available in this view.', 'warn'); $('#send').disabled = true; return; }
    var lim = await state.sample.limits().catch(function () { return null; });
    state.maxImages = lim && lim.images ? Math.max(1, lim.images.maxCount || 1) : 0;
    $('#clip').hidden = !(state.agent.images && state.maxImages);
  }

  renderRoster();
  selectAgent(state.agent.id, false);
  connect();
})();
