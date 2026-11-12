(function () {
  var cfg = window.SHOW_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val)); return true;
    } catch (e) { return val === undefined ? null : false; }
  }

  // Config text
  document.querySelectorAll('[data-cfg]').forEach(function (el) { var v = cfg[el.dataset.cfg]; if (v != null) el.textContent = v; });
  document.querySelectorAll('[data-yt]').forEach(function (a) {
    if (cfg.youtubeUrl) { a.href = cfg.youtubeUrl; a.target = '_blank'; a.rel = 'noopener'; } else { a.href = '#dates'; }
  });
  document.querySelectorAll('[data-sponsor]').forEach(function (a) {
    if (cfg.sponsorUrl) { a.href = cfg.sponsorUrl; a.target = '_blank'; a.rel = 'noopener'; }
  });
  if (cfg.contactEmail) {
    $('#contactLine').innerHTML = 'Questions about entries, judging or sponsoring? Email <a href="mailto:' + esc(cfg.contactEmail) + '">' + esc(cfg.contactEmail) + '</a>';
  }

  // Dates, judges, awards
  $('#dateList').innerHTML = (cfg.dates || []).map(function (d) {
    return '<li><b>' + esc(d.date) + '</b><span>' + esc(d.text) + '</span></li>';
  }).join('');
  $('#judgeList').innerHTML = (cfg.judges || []).map(function (j) {
    return '<div class="judge"><div class="javatar">' + (j.name ? esc(j.name.charAt(0)) : '?') + '</div><div><b>' + esc(j.cls) + '</b><span>' +
      (j.name ? esc(j.name) : 'To be announced') + '</span>' + (j.bio ? '<p>' + esc(j.bio) + '</p>' : '') + '</div></div>';
  }).join('');
  $('#awardList').innerHTML = (cfg.awards || []).map(function (a) {
    return '<div class="award"><span class="rosette" aria-hidden="true">🎖️</span><b>' + esc(a.name) + '</b><span>' + esc(a.gets) + '</span><em>' + esc(a.price) + '</em></div>';
  }).join('');

  // Classes -> select + buttons
  var sel = $('#clsSelect');
  document.querySelectorAll('[data-class]').forEach(function (b) {
    var o = document.createElement('option'); o.value = o.textContent = b.dataset.class; sel.appendChild(o);
    b.addEventListener('click', function () {
      sel.value = b.dataset.class;
      $('#enter').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Scorecard (8 checkpoints)
  var POINTS = ['Toes', 'Feet', 'Hocks', 'Stance', 'Body', 'Wings', 'Head', 'Tail'];
  var LABELS = ['Toes & claws', 'Feet & shanks', 'Hocks & thighs', 'Stance & gait', 'Body & keel', 'Wings & shoulders', 'Neck, head & crest', 'Tail & tail set'];
  $('#sc-rows').innerHTML = LABELS.map(function (l, i) {
    var opts = '<option value="">not checked</option>';
    for (var n = 10; n >= 1; n--) opts += '<option>' + n + '</option>';
    return '<div class="sc-row"><span>' + (i + 1) + '. ' + l + '</span><div class="bar"><i id="bar' + i + '"></i></div><select data-i="' + i + '" aria-label="' + l + ' score">' + opts + '</select></div>';
  }).join('');
  function score() {
    var vals = [], parts = [];
    document.querySelectorAll('#sc-rows select').forEach(function (s) {
      var i = +s.dataset.i, v = s.value ? +s.value : null;
      var bar = document.getElementById('bar' + i);
      bar.style.width = v ? v * 10 + '%' : '0';
      bar.className = v == null ? '' : v >= 8 ? 'hi' : v >= 5 ? 'mid' : 'lo';
      if (v != null) vals.push(v);
      parts.push(POINTS[i] + ' ' + (v == null ? '–' : v));
    });
    var avg = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
    $('#sc-overall').textContent = avg == null ? '—' : avg.toFixed(1);
    $('#sc-note').textContent = avg == null ? 'Score at least one area' :
      (vals.length < 8 ? (8 - vals.length) + ' area(s) not checked · ' : '') +
      (avg >= 8 ? 'Contender' : avg >= 6 ? 'Solid entry' : avg >= 4 ? 'Needs work' : 'Not show-ready');
    var d = new Date(), day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    $('#sc-record').textContent = day + ' | ' + ($('#sc-band').value || 'band?') + ' | Overall ' + (avg == null ? '–' : avg.toFixed(1)) + ' | ' + parts.join(', ') + ' | Notes';
  }
  document.querySelectorAll('#sc-rows select').forEach(function (s) { s.addEventListener('change', score); });
  $('#sc-band').addEventListener('input', score);
  $('#sc-copy').addEventListener('click', function () {
    var t = $('#sc-record').textContent, btn = this;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { btn.textContent = 'Copied ✓'; }, function () { btn.textContent = 'Select & copy'; });
    setTimeout(function () { btn.textContent = 'Copy record'; }, 1800);
  });
  score();

  // Entries (preview mode: saved on this device)
  var ENTRY_KEY = 'gp-show-entries', VOTE_KEY = 'gp-show-votes';
  var photoData = '';
  var form = $('#entryForm');
  form.photo.addEventListener('change', function () {
    var f = form.photo.files[0]; photoData = '';
    $('#photoPreview').innerHTML = '';
    if (!f) return;
    var img = new Image(), r = new FileReader();
    r.onload = function () {
      img.onload = function () {
        var max = 700, s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        photoData = c.toDataURL('image/jpeg', 0.8);
        $('#photoPreview').innerHTML = '<img alt="Entry photo preview" src="' + photoData + '">';
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#formMsg');
    if (!photoData) { msg.textContent = 'Please wait for the photo to load, then submit again.'; return; }
    var entries = store(ENTRY_KEY) || [];
    entries.push({
      id: Date.now().toString(36), exhibitor: form.exhibitor.value.trim(), farm: form.farm.value.trim(),
      band: form.band.value.trim(), line: form.line.value.trim(), cls: form.cls.value, video: form.video.value.trim(), photo: photoData
    });
    if (!store(ENTRY_KEY, entries)) { msg.textContent = 'Could not save on this device (storage full or blocked).'; return; }
    msg.textContent = '✓ Entry received: ' + form.band.value + ' in ' + form.cls.value + '. It now shows in the Fan Show below.';
    form.reset(); photoData = ''; $('#photoPreview').innerHTML = '';
    renderGallery();
  });

  function renderGallery() {
    var entries = store(ENTRY_KEY) || [], votes = store(VOTE_KEY) || {};
    var g = $('#gallery');
    if (!entries.length) {
      g.innerHTML = [1, 2, 3].map(function () {
        return '<div class="card empty"><div class="cimg">🐓</div><b>Your bird here</b><span>Entries appear here once submitted</span></div>';
      }).join('');
      return;
    }
    g.innerHTML = entries.map(function (en) {
      var v = votes[en.id] ? 1 : 0;
      return '<div class="card"><img class="cimg" alt="' + esc(en.band) + '" src="' + en.photo + '"><b>' + esc(en.band) + '</b><span>' +
        esc(en.cls) + (en.line ? ' · ' + esc(en.line) : '') + '</span><small>' + esc(en.farm || en.exhibitor) + '</small>' +
        '<button class="vote' + (v ? ' on' : '') + '" data-id="' + en.id + '">' + (v ? '❤️ Voted' : '🤍 Vote') + '</button></div>';
    }).join('');
    g.querySelectorAll('.vote').forEach(function (b) {
      b.addEventListener('click', function () {
        var vs = store(VOTE_KEY) || {};
        if (vs[b.dataset.id]) delete vs[b.dataset.id]; else vs[b.dataset.id] = 1;
        store(VOTE_KEY, vs); renderGallery();
      });
    });
  }
  renderGallery();
})();
