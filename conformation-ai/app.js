(function () {
  var C = window.GPCore;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function cls(v) { return v == null ? '' : v >= 8 ? 'hi' : v >= 5 ? 'mid' : 'lo'; }

  var KEY_DB = 'gpca-birds', KEY_STD = 'gpca-standard';
  var VIEWS = ['Side profile', 'Other side', 'Front', 'Rear', 'Top', 'Feet close-up'];
  var state = { photos: {}, frames: [], measures: [], sample: null, maxImages: 0, running: false, ctrl: null, last: null };

  // ---------- Tabs ----------
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 'tab-' + b.dataset.tab); });
      if (b.dataset.tab === 'birds') renderBirds();
      if (b.dataset.tab === 'compare') renderPickers();
      window.scrollTo(0, 0);
    });
  });
  function goTab(name) { $('.tabs button[data-tab="' + name + '"]').click(); }

  // ---------- Image helpers ----------
  function fileToCanvas(file, max) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ canvas: c, w: img.width, h: img.height });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
      img.src = url;
    });
  }
  function canvasBlob(c, q) { return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('encode failed')); }, 'image/jpeg', q || 0.85); }); }
  function thumbOf(c, size) {
    var s = Math.min(1, size / Math.max(c.width, c.height)), t = document.createElement('canvas');
    t.width = Math.round(c.width * s); t.height = Math.round(c.height * s);
    t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
    return t.toDataURL('image/jpeg', 0.7);
  }

  // Photo quality: size, brightness, sharpness (variance of a Laplacian on a small grayscale copy)
  function quality(c, w, h) {
    var s = Math.min(1, 320 / Math.max(c.width, c.height)), t = document.createElement('canvas');
    t.width = Math.max(3, Math.round(c.width * s)); t.height = Math.max(3, Math.round(c.height * s));
    var g = t.getContext('2d'); g.drawImage(c, 0, 0, t.width, t.height);
    var d = g.getImageData(0, 0, t.width, t.height).data, W = t.width, H = t.height, gray = new Float32Array(W * H), sum = 0;
    for (var i = 0; i < W * H; i++) { gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; sum += gray[i]; }
    var mean = sum / (W * H), lsum = 0, lsq = 0, n = 0;
    for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
      var k = y * W + x, l = gray[k - 1] + gray[k + 1] + gray[k - W] + gray[k + W] - 4 * gray[k];
      lsum += l; lsq += l * l; n++;
    }
    var sharp = n ? lsq / n - Math.pow(lsum / n, 2) : 0, issues = [];
    if (Math.min(w, h) < 500) issues.push('low resolution');
    if (mean < 55) issues.push('too dark');
    if (mean > 215) issues.push('overexposed');
    if (sharp < 40) issues.push('looks blurry');
    return { ok: !issues.length, issues: issues };
  }

  // ---------- Photo slots ----------
  var slots = $('#slots');
  slots.innerHTML = VIEWS.map(function (v, i) {
    return '<div class="slot" data-view="' + v + '"><label class="pick"><span class="sname">' + v + (i === 0 ? ' *' : '') + '</span>' +
      '<span class="sil sil-' + i + '" aria-hidden="true"></span><input type="file" accept="image/*"></label>' +
      '<div class="qbadge"></div><div class="sacts"><button type="button" class="mbtn" hidden>📐 Measure</button><button type="button" class="xbtn" hidden aria-label="Remove photo">✕</button></div></div>';
  }).join('');
  $$('.slot').forEach(function (slot) {
    var view = slot.dataset.view, inp = $('input', slot);
    inp.addEventListener('change', async function () {
      var f = inp.files[0]; if (!f) return;
      try {
        var r = await fileToCanvas(f, 1400), q = quality(r.canvas, r.w, r.h);
        state.photos[view] = { canvas: r.canvas, thumb: thumbOf(r.canvas, 360), q: q };
        $('.pick', slot).style.backgroundImage = 'url(' + state.photos[view].thumb + ')';
        slot.classList.add('has');
        $('.qbadge', slot).className = 'qbadge ' + (q.ok ? 'good' : 'warn');
        $('.qbadge', slot).textContent = q.ok ? '✓ Good photo' : '⚠ ' + q.issues.join(', ');
        $('.mbtn', slot).hidden = false; $('.xbtn', slot).hidden = false;
      } catch (e) { setStatus(e.message, 'err'); }
      inp.value = '';
    });
    $('.xbtn', slot).addEventListener('click', function () {
      delete state.photos[view];
      state.measures = state.measures.filter(function (m) { return m.view !== view; });
      $('.pick', slot).style.backgroundImage = ''; slot.classList.remove('has');
      $('.qbadge', slot).textContent = ''; $('.qbadge', slot).className = 'qbadge';
      $('.mbtn', slot).hidden = true; this.hidden = true;
    });
    $('.mbtn', slot).addEventListener('click', function () { openMeasure(view); });
  });

  // ---------- Video frames ----------
  $('#f-video').addEventListener('change', async function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    var box = $('#frames');
    box.innerHTML = '<p class="hint">Pulling key frames…</p>';
    try {
      state.frames = await extractFrames(f, 6);
      box.innerHTML = state.frames.map(function (fr, i) {
        return '<figure><img alt="Frame ' + (i + 1) + '" src="' + fr.thumb + '"><figcaption>' + fr.t.toFixed(1) + 's</figcaption></figure>';
      }).join('') + '<button type="button" class="btn small ghost" id="clearVid">Remove video</button>';
      $('#clearVid').addEventListener('click', function () { state.frames = []; box.innerHTML = ''; });
    } catch (e) {
      state.frames = [];
      box.innerHTML = '<p class="status err">' + esc(e.message) + '</p>';
    }
  });
  function extractFrames(file, n) {
    return new Promise(function (resolve, reject) {
      var v = document.createElement('video'), url = URL.createObjectURL(file), out = [], times = [], i = 0, done = false;
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      var fail = setTimeout(function () { finish(new Error('That video could not be read here. Try an MP4 or MOV under 30 seconds.')); }, 20000);
      function finish(err) {
        if (done) return; done = true; clearTimeout(fail); URL.revokeObjectURL(url);
        err ? reject(err) : resolve(out);
      }
      v.onerror = function () { finish(new Error('That video format is not supported in this browser.')); };
      v.onloadedmetadata = function () {
        var dur = Math.min(isFinite(v.duration) ? v.duration : 0, 30);
        if (!dur || !v.videoWidth) return finish(new Error('Could not read the video length.'));
        for (var k = 0; k < n; k++) times.push(dur * (k + 0.5) / n);
        v.currentTime = times[0];
      };
      v.onseeked = function () {
        var s = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        out.push({ canvas: c, thumb: thumbOf(c, 200), t: times[i] });
        i++;
        if (i < times.length) v.currentTime = times[i]; else finish();
      };
    });
  }

  // ---------- Status ----------
  function setStatus(msg, kind) { var el = $('#status'); el.textContent = msg; el.className = 'status' + (kind ? ' ' + kind : ''); }

  // ---------- Claude connection ----------
  async function connect() {
    if (!window.claude || typeof window.claude.use !== 'function') {
      setStatus('AI analysis runs in the Gamefowl Pro app on claude.ai. Your website version will connect to the Gamefowl Pro analysis server.', 'warn');
      $('#run').disabled = true; return;
    }
    try { state.sample = await window.claude.use('sample'); } catch (e) { state.sample = null; }
    if (!state.sample) { setStatus('AI analysis is not available in this view.', 'warn'); $('#run').disabled = true; return; }
    var lim = await state.sample.limits().catch(function () { return null; });
    if (!lim || !lim.images) { setStatus('Photo analysis is not available in this view.', 'warn'); $('#run').disabled = true; return; }
    state.maxImages = Math.max(1, lim.images.maxCount || 1);
    setStatus('Ready — add at least a side profile photo.');
  }

  // Choose which images to send within the per-call limit
  function pickMedia() {
    var photos = VIEWS.filter(function (v) { return state.photos[v]; }).map(function (v) { return { label: v.toLowerCase() + ' photo', canvas: state.photos[v].canvas }; });
    var frames = state.frames.map(function (f, i) { return { label: 'walking video frame ' + (i + 1) + ' of ' + state.frames.length + ' (' + f.t.toFixed(1) + 's)', canvas: f.canvas }; });
    var max = state.maxImages, reserve = frames.length ? Math.min(frames.length, Math.max(2, Math.floor(max / 3))) : 0;
    var p = photos.slice(0, Math.max(1, max - reserve)), f = frames.slice(0, max - p.length);
    // keep frames evenly spread if trimmed
    if (frames.length > f.length && f.length > 1) {
      f = []; var step = (frames.length - 1) / (max - p.length - 1 || 1);
      for (var k = 0; k < max - p.length; k++) f.push(frames[Math.round(k * step)]);
    }
    return { items: p.concat(f), droppedPhotos: photos.length - p.length, droppedFrames: frames.length - f.length };
  }

  // ---------- Run analysis ----------
  $('#run').addEventListener('click', run);
  async function run() {
    if (state.running) { if (state.ctrl) state.ctrl.abort(); return; }
    if (!state.photos['Side profile']) { setStatus('Add the side profile photo first.', 'err'); return; }
    var bird = { band: $('#f-band').value.trim(), cls: $('#f-cls').value, line: $('#f-line').value.trim(), crest: $('#f-crest').value };
    if (!bird.band) { setStatus('Give the bird a band or name so it can be saved.', 'err'); $('#f-band').focus(); return; }
    var media = pickMedia(), std = load(KEY_STD, {});
    state.running = true; state.ctrl = new AbortController(); $('#run').textContent = 'Stop';
    $('#result').innerHTML = '<div class="card"><div class="jgrid">' + C.JUDGES.map(function (j) {
      return '<div class="jcard pending" id="j-' + j.id + '"><h4>' + j.icon + ' ' + j.name + '</h4><p class="hint">Analyzing…</p></div>';
    }).join('') + '</div></div>';
    try {
      setStatus('Preparing ' + media.items.length + ' image' + (media.items.length > 1 ? 's' : '') + '…');
      var blobs = await Promise.all(media.items.map(function (m) { return canvasBlob(m.canvas); }));
      var labels = media.items.map(function (m) { return m.label; });
      setStatus('Three judges are analyzing ' + bird.band + '…' + (media.droppedPhotos + media.droppedFrames ? ' (' + (media.droppedPhotos + media.droppedFrames) + ' image(s) over the limit were left out)' : ''));
      var cards = await Promise.all(C.JUDGES.map(function (j) {
        return state.sample.json(C.judgePrompt(j, bird, labels, std), { images: blobs, modelTier: 'complex', signal: state.ctrl.signal })
          .then(function (r) { var c = { judge: j, result: C.normalize(r) }; renderJudge(c); return c; })
          .catch(function (e) { if (e && e.code === 'cancelled') throw e; renderJudgeFail(j, e); return null; });
      }));
      cards = cards.filter(Boolean);
      if (!cards.length) throw { message: 'No judge could analyze these photos.' };
      var cons = C.consensus(cards);
      setStatus('Head judge is writing the analysis…');
      var head = null;
      try { head = await state.sample.json(C.headPrompt(bird, cards, cons, state.measures), { modelTier: 'default', signal: state.ctrl.signal }); } catch (e) { if (e && e.code === 'cancelled') throw e; }
      state.last = {
        id: Date.now().toString(36), date: today(), bird: bird, cons: cons, overall: C.overall(cons), head: head,
        judges: cards.map(function (c) { return { id: c.judge.id, name: c.judge.name, icon: c.judge.icon, result: c.result }; }),
        measures: state.measures.slice(), thumb: state.photos['Side profile'].thumb, video: state.frames.length > 0, images: labels.length
      };
      renderResult(state.last, true);
      setStatus('Done. Review it, then save it to ' + bird.band + '’s history.', 'ok');
    } catch (e) {
      var code = e && e.code;
      setStatus(code === 'cancelled' ? 'Stopped.' : code === 'not_granted' ? 'Claude access was not allowed for this page.' :
        code === 'rate_limited' ? 'Usage limit reached — try again later.' : code === 'image_rejected' ? 'One image could not be used. Try JPG or PNG.' :
        'The analysis could not finish: ' + ((e && e.message) || 'unknown error'), 'err');
    } finally {
      state.running = false; state.ctrl = null; $('#run').textContent = 'Analyze Bird';
    }
  }

  function scoreCell(v) { return v == null ? '<span class="nc">not checked</span>' : '<b class="' + cls(v) + '">' + v + '</b>'; }

  function judgeHTML(j) {
    var r = j.result, o = C.overall(r.points);
    return '<h4>' + j.icon + ' ' + esc(j.name) + '<span class="jt">' + (o == null ? '—' : o.toFixed(1)) + '</span></h4><table>' +
      C.POINTS.map(function (p) { var pt = r.points[p.key]; return '<tr><td>' + p.label + '</td><td>' + scoreCell(pt.score) + '</td><td class="note">' + esc(pt.note) + '</td></tr>'; }).join('') +
      '</table>' + (r.gait && !/no video/i.test(r.gait) ? '<p class="small">🚶 ' + esc(r.gait) + '</p>' : '') +
      (r.line_fit ? '<p class="small">🧬 ' + esc(r.line_fit) + '</p>' : '') +
      (r.soundness_flags.length ? '<p class="flag">⚠️ ' + r.soundness_flags.map(esc).join('; ') + '</p>' : '') +
      (r.not_judgeable ? '<p class="flag dq">⛔ ' + esc(r.not_judgeable_reason || 'Not judgeable') + '</p>' : '') +
      '<p class="small muted">Confidence: ' + r.confidence + '</p>';
  }
  function renderJudge(c) { var el = $('#j-' + c.judge.id); el.className = 'jcard'; el.innerHTML = judgeHTML({ name: c.judge.name, icon: c.judge.icon, result: c.result }); }
  function renderJudgeFail(j, e) { var el = $('#j-' + j.id); el.className = 'jcard failed'; el.innerHTML = '<h4>' + j.icon + ' ' + j.name + '</h4><p class="hint">Could not analyze' + (e && e.code ? ' (' + esc(e.code) + ')' : '') + '.</p>'; }

  function verdictClass(v) { return /Strong/.test(v) ? 'v-good' : /Keep/.test(v) ? 'v-mid' : /Not a/.test(v) ? 'v-bad' : 'v-na'; }

  function renderResult(a, fresh) {
    var h = a.head && typeof a.head === 'object' ? a.head : null, flags = [], nj = [], missing = {};
    a.judges.forEach(function (j) {
      j.result.soundness_flags.forEach(function (f) { flags.push(j.name + ': ' + f); });
      if (j.result.not_judgeable) nj.push(j.name + ': ' + j.result.not_judgeable_reason);
      j.result.missing_photos.forEach(function (m) { missing[m.toLowerCase()] = m; });
    });
    var rec = C.recordLine(a.date, a.bird.band, a.cons, a.judges.length);
    var html = '<div class="card result">' +
      '<div class="rhead"><img alt="" src="' + a.thumb + '"><div><h2>' + esc(a.bird.band) + '</h2><p class="small">' + esc(a.bird.cls) + (a.bird.line ? ' · ' + esc(a.bird.line) : '') + ' · ' + a.date + '</p>' +
      (h && h.verdict ? '<span class="verdict ' + verdictClass(h.verdict) + '">' + esc(h.verdict) + '</span>' : '') + '</div>' +
      '<div class="big"><b>' + (a.overall == null ? '—' : a.overall.toFixed(1)) + '</b><span>overall</span></div></div>' +
      '<div class="cbars">' + C.POINTS.map(function (p) {
        var c = a.cons[p.key];
        return '<div class="cbar"><span>' + p.label + '</span><div class="bar"><i class="' + cls(c.score) + '" style="width:' + (c.score == null ? 0 : c.score * 10) + '%"></i></div><em>' +
          (c.score == null ? 'not checked' : c.score + (c.spread >= 3 ? ' · judges split' : '')) + '</em></div>';
      }).join('') + '</div>' +
      (nj.length ? '<p class="flag dq">⛔ Not judgeable: ' + nj.map(esc).join(' · ') + '</p>' : '') +
      (flags.length ? '<p class="flag">⚠️ Soundness flags — check hands-on, see a vet if serious: ' + flags.map(esc).join(' · ') + '</p>' : '') +
      (h ? '<div class="head"><h3>🧑‍⚖️ Head Judge</h3><p>' + esc(h.summary) + '</p>' + li('Strengths', h.top_strengths) + li('To improve', h.improve) +
        (h.pairing_tip ? '<p><b>Pairing tip:</b> ' + esc(h.pairing_tip) + '</p>' : '') + li('Photo tips', h.photo_tips) +
        (h.needs_hands_on_check ? '<p class="flag">Hands-on check: ' + esc(h.check_reason) + '</p>' : '') + '</div>' : '') +
      (a.measures && a.measures.length ? '<p class="small">📐 Your measurements: ' + a.measures.map(function (m) { return esc(m.kind) + ' ' + m.value + '° (' + esc(m.view) + ')'; }).join(' · ') + '</p>' : '') +
      (Object.keys(missing).length ? '<p class="small muted">Missing photos: ' + Object.keys(missing).map(function (k) { return esc(missing[k]); }).join(', ') + '</p>' : '') +
      '<details><summary>Judges’ scorecards</summary><div class="jgrid">' + a.judges.map(function (j) { return '<div class="jcard">' + judgeHTML(j) + '</div>'; }).join('') + '</div></details>' +
      '<div class="rec"><code>' + esc(rec) + '</code><button type="button" class="btn small ghost" data-copy>Copy record</button></div>' +
      (fresh ? '<div class="row-btns"><button type="button" class="btn" id="saveBtn">Save to ' + esc(a.bird.band) + '’s history</button><button type="button" class="btn ghost" id="newBtn">New analysis</button></div>' : '') +
      '<p class="small muted">AI analysis from photos — an assistant’s opinion, not a veterinary exam.</p></div>';
    var host = fresh ? $('#result') : $('#birdDetail');
    host.innerHTML = html;
    $('[data-copy]', host).addEventListener('click', function () {
      var b = this; (navigator.clipboard ? navigator.clipboard.writeText(rec) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Select & copy'; });
    });
    if (fresh) {
      $('#saveBtn').addEventListener('click', function () {
        var db = load(KEY_DB, {}), k = a.bird.band.toLowerCase();
        db[k] = db[k] || { band: a.bird.band, analyses: [] };
        db[k].band = a.bird.band; db[k].line = a.bird.line; db[k].cls = a.bird.cls;
        if (!db[k].analyses.some(function (x) { return x.id === a.id; })) db[k].analyses.push(a);
        if (save(KEY_DB, db)) { this.textContent = 'Saved ✓'; this.disabled = true; }
        else { this.textContent = 'Storage full — export a backup and delete old entries'; }
      });
      $('#newBtn').addEventListener('click', resetForm);
      host.scrollIntoView({ behavior: 'smooth' });
    }
    function li(t, x) { return Array.isArray(x) && x.length ? '<p><b>' + t + ':</b> ' + x.slice(0, 3).map(esc).join(' · ') + '</p>' : ''; }
  }

  function resetForm() {
    state.photos = {}; state.frames = []; state.measures = []; state.last = null;
    $$('.slot').forEach(function (s) { s.classList.remove('has'); $('.pick', s).style.backgroundImage = ''; $('.qbadge', s).textContent = ''; $('.qbadge', s).className = 'qbadge'; $('.mbtn', s).hidden = true; $('.xbtn', s).hidden = true; });
    $('#frames').innerHTML = ''; $('#result').innerHTML = ''; $('#f-band').value = '';
    setStatus(state.sample ? 'Ready — add at least a side profile photo.' : $('#status').textContent);
    window.scrollTo(0, 0);
  }

  // ---------- Measure tool ----------
  var M = { view: null, pts: [], scale: 1 };
  function openMeasure(view) {
    var p = state.photos[view]; if (!p) return;
    M.view = view; M.pts = [];
    $('#measure').hidden = false;
    drawMeasure(); renderMeasureList();
  }
  function need() { return +$('#m-kind').value.split('|')[1]; }
  function drawMeasure() {
    var src = state.photos[M.view].canvas, cv = $('#m-canvas'), box = $('.mcanvas');
    var maxW = Math.min(box.clientWidth || 600, 900), maxH = Math.max(240, window.innerHeight * 0.6);
    var s = Math.min(maxW / src.width, maxH / src.height, 1.5);
    cv.width = Math.round(src.width * s); cv.height = Math.round(src.height * s); M.scale = s;
    var g = cv.getContext('2d'); g.drawImage(src, 0, 0, cv.width, cv.height);
    g.lineWidth = 3; g.strokeStyle = '#f2c94c'; g.fillStyle = '#f2c94c';
    if (M.pts.length > 1) { g.beginPath(); M.pts.forEach(function (p, i) { var x = p.x * s, y = p.y * s; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    M.pts.forEach(function (p) { g.beginPath(); g.arc(p.x * s, p.y * s, 6, 0, Math.PI * 2); g.fill(); });
    var n = need(), val = value();
    $('#m-read').textContent = val == null ? 'Tap ' + (n - M.pts.length) + ' more point' + (n - M.pts.length === 1 ? '' : 's') + ' on the photo.' : $('#m-kind').value.split('|')[0] + ': ' + val + '°';
    $('#m-save').disabled = val == null;
  }
  function value() {
    var n = need(); if (M.pts.length < n) return null;
    return n === 3 ? C.angle3(M.pts[0], M.pts[1], M.pts[2]) : C.slope2(M.pts[0], M.pts[1]);
  }
  $('#m-canvas').addEventListener('pointerdown', function (e) {
    var r = this.getBoundingClientRect(), n = need();
    if (M.pts.length >= n) M.pts = [];
    M.pts.push({ x: (e.clientX - r.left) * (this.width / r.width) / M.scale, y: (e.clientY - r.top) * (this.height / r.height) / M.scale });
    drawMeasure();
  });
  $('#m-kind').addEventListener('change', function () { M.pts = []; drawMeasure(); });
  $('#m-undo').addEventListener('click', function () { M.pts.pop(); drawMeasure(); });
  $('#m-save').addEventListener('click', function () {
    var v = value(); if (v == null) return;
    state.measures.push({ kind: $('#m-kind').value.split('|')[0], value: v, view: M.view });
    M.pts = []; drawMeasure(); renderMeasureList();
  });
  $('#m-close').addEventListener('click', function () { $('#measure').hidden = true; });
  function renderMeasureList() {
    $('#m-list').innerHTML = state.measures.map(function (m, i) {
      return '<li>' + esc(m.kind) + ': <b>' + m.value + '°</b> <span class="muted">(' + esc(m.view) + ')</span> <button type="button" data-del="' + i + '" aria-label="Delete">✕</button></li>';
    }).join('');
    $$('#m-list [data-del]').forEach(function (b) { b.addEventListener('click', function () { state.measures.splice(+b.dataset.del, 1); renderMeasureList(); }); });
  }

  // ---------- My Birds ----------
  function spark(vals) {
    var v = vals.filter(function (x) { return x != null; });
    if (v.length < 2) return '';
    var w = 120, h = 30, min = Math.min.apply(null, v.concat([5])), max = Math.max.apply(null, v.concat([10]));
    var pts = v.map(function (x, i) { return (i * w / (v.length - 1)).toFixed(1) + ',' + (h - (x - min) / (max - min || 1) * h).toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="-2 -2 ' + (w + 4) + ' ' + (h + 4) + '" aria-label="Score trend"><polyline points="' + pts + '"/></svg>';
  }
  function renderBirds() {
    var db = load(KEY_DB, {}), keys = Object.keys(db).sort(), box = $('#birdList');
    if (!keys.length) { box.innerHTML = '<div class="empty">No saved birds yet. Analyze a bird and tap “Save to history”.</div><div id="birdDetail"></div>'; return; }
    box.innerHTML = keys.map(function (k) {
      var b = db[k], an = b.analyses, last = an[an.length - 1];
      return '<div class="bird"><button type="button" class="bhead" data-bird="' + esc(k) + '"><img alt="" src="' + last.thumb + '"><div><b>' + esc(b.band) + '</b><span>' + esc(b.cls || '') + (b.line ? ' · ' + esc(b.line) : '') + '</span><span>' + an.length + ' analys' + (an.length > 1 ? 'es' : 'is') + ' · last ' + last.date + '</span></div>' +
        spark(an.map(function (x) { return x.overall; })) + '<strong class="' + cls(last.overall) + '">' + (last.overall == null ? '—' : last.overall.toFixed(1)) + '</strong></button>' +
        '<div class="hist" hidden>' + an.slice().reverse().map(function (x) {
          return '<div class="hrow"><button type="button" class="link" data-open="' + esc(k) + '|' + x.id + '">' + x.date + ' — ' + (x.overall == null ? '—' : x.overall.toFixed(1)) + (x.head && x.head.verdict ? ' · ' + esc(x.head.verdict) : '') + '</button><button type="button" class="del" data-delete="' + esc(k) + '|' + x.id + '" aria-label="Delete analysis">🗑</button></div>';
        }).join('') + '</div></div>';
    }).join('') + '<div id="birdDetail"></div>';
    $$('[data-bird]', box).forEach(function (b) { b.addEventListener('click', function () { var h = b.nextElementSibling; h.hidden = !h.hidden; }); });
    $$('[data-open]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.open.split('|'), a = load(KEY_DB, {})[p[0]].analyses.filter(function (x) { return x.id === p[1]; })[0];
        if (a) { renderResult(a, false); $('#birdDetail').scrollIntoView({ behavior: 'smooth' }); }
      });
    });
    $$('[data-delete]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirmDelete(b)) return;
        var p = b.dataset.delete.split('|'), d = load(KEY_DB, {});
        d[p[0]].analyses = d[p[0]].analyses.filter(function (x) { return x.id !== p[1]; });
        if (!d[p[0]].analyses.length) delete d[p[0]];
        save(KEY_DB, d); renderBirds();
      });
    });
  }
  // two-tap delete (no browser dialogs, which some embeds block)
  function confirmDelete(b) {
    if (b.dataset.armed) return true;
    b.dataset.armed = '1'; b.textContent = 'Delete?'; b.classList.add('armed');
    setTimeout(function () { if (b.isConnected) { delete b.dataset.armed; b.textContent = '🗑'; b.classList.remove('armed'); } }, 3000);
    return false;
  }

  // Export / import
  $('#exportBtn').addEventListener('click', async function () {
    var data = JSON.stringify({ app: 'gamefowl-pro-conformation', version: 1, exported: today(), birds: load(KEY_DB, {}), standard: load(KEY_STD, {}) });
    var name = 'gamefowl-conformation-backup-' + today() + '.json', btn = this;
    try {
      var dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (dl) { await dl.save({ filename: name, data: data }); btn.textContent = 'Exported ✓'; return; }
    } catch (e) { /* fall back to a link */ }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; a.click();
    btn.textContent = 'Exported ✓';
  });
  $('#importFile').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var j = JSON.parse(r.result); if (!j || typeof j.birds !== 'object') throw 0;
        var db = load(KEY_DB, {});
        Object.keys(j.birds).forEach(function (k) {
          var inc = j.birds[k]; if (!inc || !Array.isArray(inc.analyses)) return;
          db[k] = db[k] || { band: inc.band, line: inc.line, cls: inc.cls, analyses: [] };
          inc.analyses.forEach(function (x) { if (x && x.id && !db[k].analyses.some(function (y) { return y.id === x.id; })) db[k].analyses.push(x); });
          db[k].analyses.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        });
        if (j.standard && !Object.keys(load(KEY_STD, {})).length) save(KEY_STD, j.standard);
        save(KEY_DB, db); renderBirds();
      } catch (e) { $('#birdList').insertAdjacentHTML('afterbegin', '<p class="status err">That file is not a Gamefowl Pro backup.</p>'); }
    };
    r.readAsText(f);
  });

  // ---------- Compare ----------
  function allAnalyses() {
    var db = load(KEY_DB, {}), out = [];
    Object.keys(db).forEach(function (k) { db[k].analyses.forEach(function (a) { out.push({ key: k + '|' + a.id, a: a }); }); });
    return out.sort(function (x, y) { return x.a.bird.band.localeCompare(y.a.bird.band) || (x.a.date < y.a.date ? 1 : -1); });
  }
  function renderPickers() {
    var list = allAnalyses(), box = $('#pickers');
    if (list.length < 2) { box.innerHTML = '<div class="empty">Save at least two analyses to compare birds.</div>'; $('#compareOut').innerHTML = ''; return; }
    var opts = '<option value="">—</option>' + list.map(function (x) { return '<option value="' + esc(x.key) + '">' + esc(x.a.bird.band) + ' · ' + x.a.date + ' · ' + (x.a.overall == null ? '—' : x.a.overall.toFixed(1)) + '</option>'; }).join('');
    box.innerHTML = [0, 1, 2].map(function (i) { return '<label>Bird ' + (i + 1) + '<select data-pick="' + i + '">' + opts + '</select></label>'; }).join('');
    var sels = $$('[data-pick]', box);
    sels[0].value = list[0].key; sels[1].value = list[1].key;
    sels.forEach(function (s) { s.addEventListener('change', drawCompare); });
    drawCompare();
    function drawCompare() {
      var picked = sels.map(function (s) { return list.filter(function (x) { return x.key === s.value; })[0]; }).filter(Boolean).map(function (x) { return x.a; });
      if (picked.length < 2) { $('#compareOut').innerHTML = '<p class="hint">Pick at least two.</p>'; return; }
      function best(vals) { var v = vals.filter(function (x) { return x != null; }); return v.length ? Math.max.apply(null, v) : null; }
      var rows = C.POINTS.map(function (p) {
        var vals = picked.map(function (a) { return a.cons[p.key].score; }), b = best(vals);
        return '<tr><td>' + p.label + '</td>' + vals.map(function (v) { return '<td class="' + (v != null && v === b && vals.filter(function (x) { return x === b; }).length < vals.length ? 'win' : '') + '">' + scoreCell(v) + '</td>'; }).join('') + '</tr>';
      }).join('');
      var ov = picked.map(function (a) { return a.overall; }), bo = best(ov);
      $('#compareOut').innerHTML = '<div class="card"><table class="cmp"><thead><tr><th></th>' + picked.map(function (a) {
        return '<th><img alt="" src="' + a.thumb + '"><b>' + esc(a.bird.band) + '</b><span>' + a.date + '</span></th>';
      }).join('') + '</tr></thead><tbody>' + rows + '<tr class="tot"><td>Overall</td>' + ov.map(function (v) { return '<td class="' + (v === bo ? 'win' : '') + '">' + (v == null ? '—' : v.toFixed(1)) + '</td>'; }).join('') + '</tr>' +
        '<tr><td>Verdict</td>' + picked.map(function (a) { return '<td class="small">' + esc(a.head && a.head.verdict || '—') + '</td>'; }).join('') + '</tr>' +
        '<tr><td>Flags</td>' + picked.map(function (a) { var n = a.judges.reduce(function (s, j) { return s + j.result.soundness_flags.length; }, 0); return '<td class="small">' + (n ? '⚠️ ' + n : '✓ none') + '</td>'; }).join('') + '</tr>' +
        '</tbody></table><p class="small muted">Gold = highest on that checkpoint. Strengths in one bird that cover another’s weak points make a good pairing.</p></div>';
    }
  }

  // ---------- Guide ----------
  $('#pointList').innerHTML = C.POINTS.map(function (p) { return '<li><b>' + p.label + '</b> — ' + p.rule + '</li>'; }).join('');
  var std = load(KEY_STD, {});
  $$('[data-std]').forEach(function (inp) {
    inp.value = std[inp.dataset.std] || '';
    inp.addEventListener('change', function () {
      var s = load(KEY_STD, {}); s[inp.dataset.std] = inp.value.trim();
      $('#stdSaved').textContent = save(KEY_STD, s) ? 'Line standard saved ✓' : 'Could not save on this device.';
    });
  });

  connect();
})();
