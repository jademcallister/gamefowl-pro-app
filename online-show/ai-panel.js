// Gamefowl Pro AI Judging Panel
// Three AI judges score the same photos on the 8-point conformation checklist,
// the page builds a consensus (median per checkpoint), and a head judge writes
// the final comments. AI scores are advisory: a human judge confirms placings.
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var POINTS = [
    { key: 'toes', label: 'Toes & claws', rule: 'Toes straight, fully formed, similar side to side (three forward, one back). Claws do not curl into the foot. Pads free of sores or swelling.' },
    { key: 'feet', label: 'Feet & shanks', rule: 'Stands comfortably on both feet, legs support the bird evenly. No swelling, twisting, or feet turning markedly in or out. Healthy scales; shanks similar in size.' },
    { key: 'hocks', label: 'Hocks & thighs', rule: 'Joints even on both sides, no obvious enlargement or stiffness. Thighs proportionate to the body.' },
    { key: 'stance', label: 'Stance & gait', rule: 'Stable stance from side and front. Gait needs video; from photos score stance only.' },
    { key: 'body', label: 'Body & keel', rule: 'Balanced and symmetrical. Back straight and well supported. Breastbone not crooked or sharply prominent.' },
    { key: 'wings', label: 'Wings & shoulders', rule: 'Both wings sit evenly against the body, no persistent droop or side-to-side difference. Feathers reasonably complete.' },
    { key: 'head', label: 'Neck, head & crest', rule: 'Neck moves freely, head held normally. For a crested bird the crest must not block vision. Non-crested: judge neck and head only.' },
    { key: 'tail', label: 'Tail & tail set', rule: 'Tail balanced with the back and carried naturally, no persistent droop or twist. Feather wear is condition, not conformation, and lowers the score only slightly.' }
  ];

  var JUDGES = [
    { id: 'soundness', icon: '🦶', name: 'Soundness Judge', focus: 'You look hardest at toes, claws, pads, feet, shanks, hocks and stance. You are strict about anything that may be a soundness problem.' },
    { id: 'type', icon: '⚖️', name: 'Type & Balance Judge', focus: 'You look hardest at body, keel, back, wings, shoulders, tail set and overall balance and symmetry.' },
    { id: 'eye', icon: '👁️', name: "Breeder's Eye Judge", focus: 'You judge the whole bird as a breeder would: overall build, neck, head and crest, and you separate feather condition from conformation.' }
  ];

  function judgePrompt(j, entry) {
    return [
      'You are the ' + j.name + ' on a three-judge panel at the Gamefowl Pro Online Conformation Show, an exhibition of gamefowl conformation, soundness and breed type.',
      j.focus,
      '',
      'Entry: band/name "' + (entry.band || 'unknown') + '", class "' + (entry.cls || 'unspecified') + '".',
      'Attached photos, in order: ' + entry.views.join(', ') + '.',
      '',
      'Score each of these 8 checkpoints 1-10 (10 = ideal) from what the photos actually show:',
      POINTS.map(function (p, i) { return (i + 1) + '. ' + p.key + ' (' + p.label + '): ' + p.rule; }).join('\n'),
      '',
      'Rules:',
      '- If an area cannot be clearly seen in the photos, give score null and note "not visible". Never guess.',
      '- Each note is 8 words or fewer.',
      '- Soundness flags are separate from scores: pad sores or swelling, swollen joints, limping posture, persistent wing droop, twisted keel. List only what you can see.',
      '- Set disqualify true only if a photo shows sparring, attached gaffs or artificial spurs, fresh wounds, or the subject is not a chicken. This show judges conformation only; never comment on fighting ability.',
      '- Do not state a bloodline as fact.',
      '- If the photos are too poor to judge, score everything null and say what photo is needed.',
      '',
      'Reply with JSON only, exactly this shape:',
      '{"points":{"toes":{"score":<1-10 or null>,"note":"..."},"feet":{...},"hocks":{...},"stance":{...},"body":{...},"wings":{...},"head":{...},"tail":{...}},',
      ' "strengths":["..."],"watch":["..."],"soundness_flags":["..."],"missing_photos":["..."],',
      ' "disqualify":false,"disqualify_reason":"","confidence":"low|medium|high"}'
    ].join('\n');
  }

  function headPrompt(entry, cards, consensus) {
    return [
      'You are the Head Judge of the Gamefowl Pro Online Conformation Show. Three panel judges scored the same bird on an 8-point conformation checklist (1-10, null = not visible).',
      'Entry: "' + (entry.band || 'unknown') + '" in ' + (entry.cls || 'unspecified class') + '.',
      'Panel scorecards (JSON): ' + JSON.stringify(cards.map(function (c) { return { judge: c.judge.name, result: c.result }; })),
      'Consensus (median per checkpoint): ' + JSON.stringify(consensus),
      '',
      'Write the judge\'s comments an exhibitor would hear on a live judging stream: plain, encouraging, specific. Mention where the judges disagreed. Conformation and soundness only; never comment on fighting ability.',
      'Reply with JSON only: {"summary":"2-3 sentences","top_strengths":["max 3"],"improve":["max 3"],"photo_tips":["max 2"],"needs_human_review":true|false,"review_reason":"..."}'
    ].join('\n');
  }

  function median(nums) {
    if (!nums.length) return null;
    var s = nums.slice().sort(function (a, b) { return a - b; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function normalize(r) {
    r = r && typeof r === 'object' ? r : {};
    var pts = r.points || {};
    var out = { points: {}, strengths: arr(r.strengths), watch: arr(r.watch), soundness_flags: arr(r.soundness_flags),
      missing_photos: arr(r.missing_photos), disqualify: r.disqualify === true, disqualify_reason: String(r.disqualify_reason || ''),
      confidence: ['low', 'medium', 'high'].indexOf(r.confidence) >= 0 ? r.confidence : 'medium' };
    POINTS.forEach(function (p) {
      var v = pts[p.key] || {}, n = Number(v.score);
      out.points[p.key] = { score: v.score == null || !isFinite(n) ? null : Math.max(1, Math.min(10, Math.round(n))), note: String(v.note || '').slice(0, 80) };
    });
    return out;
    function arr(a) { return Array.isArray(a) ? a.map(String).slice(0, 6) : []; }
  }

  // Resize photos to JPEG blobs before sending
  function toBlob(file, max) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onerror = reject;
      r.onload = function () {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { b ? resolve({ blob: b, url: c.toDataURL('image/jpeg', 0.7) }) : reject(new Error('resize failed')); }, 'image/jpeg', 0.85);
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  var VIEWS = ['side profile', 'other side', 'front view', 'rear view', 'feet close-up'];
  var sample = null, maxImages = 5, running = false, ctrl = null;

  function setStatus(msg, kind) { var el = $('#ai-status'); el.textContent = msg; el.className = 'ai-status' + (kind ? ' ' + kind : ''); }

  async function init() {
    var box = $('#ai-panel');
    if (!box) return;
    var slots = $('#ai-slots');
    slots.innerHTML = VIEWS.map(function (v, i) {
      return '<label class="ai-slot"><span>' + v + (i === 0 ? ' *' : '') + '</span><input type="file" accept="image/*" data-view="' + v + '"><div class="ai-thumb"></div></label>';
    }).join('');
    slots.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var t = inp.nextElementSibling; t.innerHTML = '';
        if (inp.files[0]) { var u = URL.createObjectURL(inp.files[0]); t.innerHTML = '<img alt="" src="' + u + '">'; }
      });
    });
    var cls = $('#ai-class'), main = $('#clsSelect');
    if (main) Array.prototype.forEach.call(main.options, function (o) { if (o.value) cls.appendChild(o.cloneNode(true)); });

    if (!window.claude || typeof window.claude.use !== 'function') {
      $('#ai-run').disabled = true;
      setStatus('The AI panel runs inside the Gamefowl Pro preview on claude.ai. On the public website it will connect to the show’s judging server.', 'warn');
      return;
    }
    setStatus('Connecting to the judging panel…');
    try { sample = await window.claude.use('sample'); } catch (e) { sample = null; }
    if (!sample) { $('#ai-run').disabled = true; setStatus('The AI panel is not available in this view.', 'warn'); return; }
    var lim = await sample.limits().catch(function () { return null; });
    if (!lim || !lim.images) { $('#ai-run').disabled = true; setStatus('Photo judging is not available in this view.', 'warn'); return; }
    maxImages = Math.max(1, Math.min(VIEWS.length, lim.images.maxCount || 1));
    setStatus('Ready. Add at least a side profile photo, then run the panel.');
    $('#ai-run').addEventListener('click', run);
  }

  async function run() {
    if (running) { if (ctrl) ctrl.abort(); return; }
    var files = [], views = [];
    $('#ai-slots').querySelectorAll('input').forEach(function (inp) { if (inp.files[0] && files.length < maxImages) { files.push(inp.files[0]); views.push(inp.dataset.view); } });
    if (!files.length || views[0] !== 'side profile') { setStatus('Add the side profile photo first.', 'err'); return; }
    var entry = { band: $('#ai-band').value.trim(), cls: $('#ai-class').value, views: views };
    running = true; ctrl = new AbortController();
    $('#ai-run').textContent = 'Stop';
    $('#ai-results').innerHTML = JUDGES.map(function (j) {
      return '<div class="jcard pending" id="j-' + j.id + '"><h4>' + j.icon + ' ' + j.name + '</h4><p class="small">Judging…</p></div>';
    }).join('') + '<div class="consensus" id="ai-consensus"></div>';
    setStatus('Preparing photos…');
    try {
      var imgs = await Promise.all(files.map(function (f) { return toBlob(f, 1400); }));
      var blobs = imgs.map(function (x) { return x.blob; });
      setStatus('Three judges are scoring the bird…');
      var cards = await Promise.all(JUDGES.map(function (j) {
        return sample.json(judgePrompt(j, entry), { images: blobs, modelTier: 'complex', signal: ctrl.signal })
          .then(function (r) { var c = { judge: j, result: normalize(r) }; renderJudge(c); return c; })
          .catch(function (e) { renderJudgeError(j, e); return null; });
      }));
      cards = cards.filter(Boolean);
      if (!cards.length) throw { code: 'no_judges', message: 'No judge could score this entry.' };
      var consensus = buildConsensus(cards);
      renderConsensus(entry, cards, consensus, null);
      setStatus('Head judge is writing comments…');
      var head = null;
      try { head = await sample.json(headPrompt(entry, cards, consensus), { modelTier: 'default', signal: ctrl.signal }); } catch (e) { head = null; }
      renderConsensus(entry, cards, consensus, head);
      setStatus('Done. AI scores are advisory — a human judge confirms final placings.', 'ok');
    } catch (e) {
      var code = e && e.code;
      setStatus(code === 'cancelled' ? 'Stopped.' :
        code === 'not_granted' ? 'Claude access was not allowed for this page.' :
        code === 'rate_limited' ? 'Usage limit reached — try again later.' :
        code === 'image_rejected' ? 'One photo could not be used. Try a JPG or PNG.' :
        'The panel could not finish: ' + ((e && e.message) || 'unknown error'), 'err');
    } finally {
      running = false; ctrl = null; $('#ai-run').textContent = 'Run AI Judging Panel';
    }
  }

  function scoreCell(v) {
    if (v == null) return '<span class="nc">not checked</span>';
    return '<b class="' + (v >= 8 ? 'hi' : v >= 5 ? 'mid' : 'lo') + '">' + v + '</b>';
  }

  function avg(points) {
    var v = POINTS.map(function (p) { return points[p.key].score; }).filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }

  function renderJudge(c) {
    var r = c.result, el = document.getElementById('j-' + c.judge.id), o = avg(r.points);
    el.className = 'jcard';
    el.innerHTML = '<h4>' + c.judge.icon + ' ' + esc(c.judge.name) + '<span class="jtotal">' + (o == null ? '—' : o.toFixed(1)) + '</span></h4>' +
      '<table>' + POINTS.map(function (p) {
        var pt = r.points[p.key];
        return '<tr><td>' + p.label + '</td><td>' + scoreCell(pt.score) + '</td><td class="note">' + esc(pt.note) + '</td></tr>';
      }).join('') + '</table>' +
      (r.soundness_flags.length ? '<p class="flag">⚠️ ' + r.soundness_flags.map(esc).join('; ') + '</p>' : '') +
      (r.disqualify ? '<p class="flag dq">⛔ Possible DQ: ' + esc(r.disqualify_reason) + '</p>' : '') +
      '<p class="small">Confidence: ' + r.confidence + '</p>';
  }

  function renderJudgeError(j, e) {
    var el = document.getElementById('j-' + j.id);
    el.className = 'jcard failed';
    el.innerHTML = '<h4>' + j.icon + ' ' + j.name + '</h4><p class="small">This judge could not score the entry' + (e && e.code ? ' (' + esc(e.code) + ')' : '') + '.</p>';
  }

  function buildConsensus(cards) {
    var out = {};
    POINTS.forEach(function (p) {
      var vals = cards.map(function (c) { return c.result.points[p.key].score; }).filter(function (v) { return v != null; });
      var m = median(vals);
      out[p.key] = { score: m == null ? null : Math.round(m * 10) / 10, spread: vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0, judges: vals.length };
    });
    return out;
  }

  function renderConsensus(entry, cards, cons, head) {
    var scored = POINTS.filter(function (p) { return cons[p.key].score != null; });
    var overall = scored.length ? scored.reduce(function (a, p) { return a + cons[p.key].score; }, 0) / scored.length : null;
    var flags = [], dq = [], missing = {};
    cards.forEach(function (c) {
      c.result.soundness_flags.forEach(function (f) { flags.push(c.judge.name + ': ' + f); });
      if (c.result.disqualify) dq.push(c.judge.name + ': ' + c.result.disqualify_reason);
      c.result.missing_photos.forEach(function (m) { missing[m.toLowerCase()] = m; });
    });
    var d = new Date(), day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var names = { toes: 'Toes', feet: 'Feet', hocks: 'Hocks', stance: 'Stance', body: 'Body', wings: 'Wings', head: 'Head', tail: 'Tail' };
    var record = day + ' | ' + (entry.band || 'band?') + ' | Overall ' + (overall == null ? '–' : overall.toFixed(1)) + ' | ' +
      POINTS.map(function (p) { return names[p.key] + ' ' + (cons[p.key].score == null ? '–' : cons[p.key].score); }).join(', ') + ' | AI panel (' + cards.length + ' judges)';
    var h = head && typeof head === 'object' ? head : null;
    $('#ai-consensus').innerHTML =
      '<h3>Panel Consensus <span class="ctotal">' + (overall == null ? '—' : overall.toFixed(1)) + '</span></h3>' +
      '<div class="cbars">' + POINTS.map(function (p) {
        var c = cons[p.key];
        return '<div class="cbar"><span>' + p.label + '</span><div class="bar"><i class="' + (c.score == null ? '' : c.score >= 8 ? 'hi' : c.score >= 5 ? 'mid' : 'lo') + '" style="width:' + (c.score == null ? 0 : c.score * 10) + '%"></i></div>' +
          '<em>' + (c.score == null ? 'not checked' : c.score + (c.spread >= 3 ? ' · judges split' : '')) + '</em></div>';
      }).join('') + '</div>' +
      (dq.length ? '<p class="flag dq">⛔ Human review required — possible disqualification. ' + dq.map(esc).join(' · ') + '</p>' : '') +
      (flags.length ? '<p class="flag">⚠️ Soundness flags (check hands-on; see a vet if serious): ' + flags.map(esc).join(' · ') + '</p>' : '') +
      (h ? '<div class="head"><h4>🧑‍⚖️ Head Judge</h4><p>' + esc(h.summary) + '</p>' +
        list('Strengths', h.top_strengths) + list('To improve', h.improve) + list('Photo tips', h.photo_tips) +
        (h.needs_human_review ? '<p class="flag">Human review: ' + esc(h.review_reason) + '</p>' : '') + '</div>'
        : '<p class="small">Head judge comments are being written…</p>') +
      (Object.keys(missing).length ? '<p class="small">Missing photos: ' + Object.keys(missing).map(function (k) { return esc(missing[k]); }).join(', ') + '</p>' : '') +
      '<div class="sc-record"><code>' + esc(record) + '</code><button type="button" id="ai-copy">Copy record</button></div>';
    var btn = document.getElementById('ai-copy');
    btn.addEventListener('click', function () {
      (navigator.clipboard ? navigator.clipboard.writeText(record) : Promise.reject()).then(function () { btn.textContent = 'Copied ✓'; }, function () { btn.textContent = 'Select & copy'; });
    });
    function list(t, a) { return Array.isArray(a) && a.length ? '<p><b>' + t + ':</b> ' + a.slice(0, 3).map(esc).join(' · ') + '</p>' : ''; }
  }

  init();
})();
