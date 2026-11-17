(function () {
  var C = window.MAC_CONFIG || {};

  // Config-driven links: demo / sign-in fall back to #start
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = a.dataset.link === 'demo' ? C.demoUrl : C.signInUrl;
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  });
  document.querySelectorAll('[data-cfg]').forEach(function (el) {
    var v = C[el.dataset.cfg];
    if (v) el.textContent = v; else if (el.tagName === 'P') el.hidden = true;
  });
  document.querySelectorAll('[data-cfg-link]').forEach(function (a) {
    var v = C[a.dataset.cfgLink];
    if (v) a.href = v; else a.hidden = true;
  });
  var prices = C.prices || {};
  document.querySelectorAll('[data-price]').forEach(function (el) {
    el.textContent = prices[el.dataset.price] || 'Talk to us';
  });

  // Demo email forms
  document.querySelectorAll('[data-demo-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = f.email.value.trim();
      if (C.supportEmail) {
        location.href = 'mailto:' + C.supportEmail + '?subject=' + encodeURIComponent('MAC demo request') +
          '&body=' + encodeURIComponent('Please contact me about a MAC demo: ' + email);
      } else if (C.demoUrl) {
        window.open(C.demoUrl, '_blank', 'noopener');
      }
      var note = f.nextElementSibling;
      if (note && note.classList.contains('form-note')) note.hidden = false;
      f.reset();
    });
  });

  // Step 02: tasks check off in a loop
  var items = document.querySelectorAll('[data-tasklist] li');
  var ti = 0;
  if (items.length) setInterval(function () {
    if (ti >= items.length) { items.forEach(function (li) { li.classList.remove('done'); }); ti = 0; return; }
    items[ti++].classList.add('done');
  }, 900);

  // Platform tabs
  var TABS = [
    { icon: 'i-upload', title: 'Intake', sub: 'Call in. Task out.', checks: ['Logs the call or walk-in', 'Hits all five intake checkpoints', 'Assigns the task with a due date'], subj: 'New intake logged', file: 'Intake-notes' },
    { icon: 'i-tag', title: 'Quoting', sub: 'Application in. Quotes out.', checks: ['Fills the ACORDs', 'Compares coverage and price', 'Builds the proposal'], subj: 'Quote comparison ready', file: 'Proposal' },
    { icon: 'i-renew', title: 'Renewals', sub: '60 days out. Never late.', checks: ['Flags renewals at 60/45/30 days', 'Compares expiring vs renewal', 'Drafts the client letter'], subj: 'Renewal options', file: 'Renewal-options' },
    { icon: 'i-headset', title: 'Servicing', sub: 'Request in. Done by lunch.', checks: ['Issues certificates (COIs)', 'Processes endorsements', 'Writes dated file notes'], subj: 'COI issued', file: 'Certificate' },
    { icon: 'i-shield', title: 'Claims', sub: 'First notice. First response.', checks: ['Captures the loss details', 'Tells the client what to do now', 'Drafts the carrier report'], subj: 'Claim reported', file: 'FNOL-report' }
  ];
  var tabs = document.querySelectorAll('[data-tab]');
  var P = function (k) { return document.querySelector('[data-p="' + k + '"]'); };
  var cur = 0, timer;
  function show(i) {
    cur = i;
    var t = TABS[i];
    tabs.forEach(function (b, j) { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
    P('icon').setAttribute('href', '#' + t.icon);
    P('title').textContent = t.title;
    P('sub').textContent = t.sub;
    P('subj').textContent = t.subj;
    P('file').textContent = t.file;
    P('checks').innerHTML = t.checks.map(function (c) { return '<li>' + c + '</li>'; }).join('');
    var card = document.querySelector('.email-card.big');
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  }
  function auto() { clearInterval(timer); timer = setInterval(function () { show((cur + 1) % TABS.length); }, 4500); }
  tabs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); auto(); }); });
  show(0); auto();

  // Hours calculator
  var tasks = document.querySelector('[data-calc="tasks"]');
  var mins = document.querySelector('[data-calc="mins"]');
  var out = document.querySelector('[data-hours]');
  function calc() {
    document.querySelector('[data-out="tasks"]').textContent = tasks.value;
    document.querySelector('[data-out="mins"]').textContent = mins.value;
    out.textContent = Math.round(tasks.value * mins.value * 50 / 60).toLocaleString();
  }
  tasks.addEventListener('input', calc); mins.addEventListener('input', calc); calc();
})();
