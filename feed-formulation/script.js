(function () {
  var cfg = window.FEED_PRO_CONFIG || {};

  // Prices
  document.querySelectorAll('[data-price="new"]').forEach(function (el) { if (cfg.priceNew) el.textContent = cfg.priceNew; });
  document.querySelectorAll('[data-price="old"]').forEach(function (el) { if (cfg.priceOld) el.textContent = cfg.priceOld; });

  // Checkout buttons: go to checkout when configured, otherwise scroll to the offer
  document.querySelectorAll('.checkout').forEach(function (a) {
    if (cfg.checkoutUrl) { a.href = cfg.checkoutUrl; a.rel = 'noopener'; }
    else { a.href = '#offer'; }
  });

  // Footer links + support email
  var links = { terms: cfg.termsUrl, privacy: cfg.privacyUrl, contact: cfg.contactUrl || (cfg.supportEmail ? 'mailto:' + cfg.supportEmail : '') };
  document.querySelectorAll('[data-link]').forEach(function (a) { var u = links[a.dataset.link]; if (u) a.href = u; });
  if (cfg.supportEmail) {
    document.getElementById('support').innerHTML = 'Customer support: <a href="mailto:' + cfg.supportEmail + '">' + cfg.supportEmail + '</a>';
  }
  document.getElementById('yr').textContent = new Date().getFullYear();

  // Carousel
  var car = document.getElementById('carousel');
  var pages = car.querySelectorAll('.page');
  var dots = car.querySelector('.dots');
  var idx = 0;
  pages.forEach(function (_, i) {
    var d = document.createElement('button');
    d.setAttribute('aria-label', 'Page ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dots.appendChild(d);
  });
  function go(i) {
    idx = (i + pages.length) % pages.length;
    pages.forEach(function (p, j) { p.classList.toggle('active', j === idx); });
    dots.querySelectorAll('button').forEach(function (d, j) { d.classList.toggle('on', j === idx); });
  }
  car.querySelector('.prev').addEventListener('click', function () { go(idx - 1); });
  car.querySelector('.next').addEventListener('click', function () { go(idx + 1); });
  go(0);

  // Pearson square calculator
  var ids = ['pa', 'pb', 'pt', 'pw', 'pa-name', 'pb-name'];
  function num(id) { return parseFloat(document.getElementById(id).value); }
  function calc() {
    var a = num('pa'), b = num('pb'), t = num('pt'), w = num('pw');
    var na = document.getElementById('pa-name').value || 'Ingredient A';
    var nb = document.getElementById('pb-name').value || 'Ingredient B';
    var out = document.getElementById('p-out');
    if ([a, b, t].some(isNaN)) { out.innerHTML = 'Enter protein values.'; return; }
    var lo = Math.min(a, b), hi = Math.max(a, b);
    if (t <= lo || t >= hi) {
      out.innerHTML = '<span class="err">The target must be between the two protein values (' + lo + '% and ' + hi + '%).</span>';
      return;
    }
    var partsA = Math.abs(b - t), partsB = Math.abs(a - t), total = partsA + partsB;
    var pctA = partsA / total * 100, pctB = partsB / total * 100;
    var wtxt = isNaN(w) || w <= 0 ? '' :
      ' · <b>' + (w * pctA / 100).toFixed(1) + ' lb</b> + <b>' + (w * pctB / 100).toFixed(1) + ' lb</b> per ' + w + ' lb batch';
    out.innerHTML =
      '<div class="res"><span>' + esc(na) + '</span><b>' + pctA.toFixed(1) + '%</b><small>' + partsA.toFixed(1) + ' parts</small></div>' +
      '<div class="res"><span>' + esc(nb) + '</span><b>' + pctB.toFixed(1) + '%</b><small>' + partsB.toFixed(1) + ' parts</small></div>' +
      '<p class="res-line">Mix gives <b>' + t + '% protein</b>' + wtxt + '</p>';
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  ids.forEach(function (id) { document.getElementById(id).addEventListener('input', calc); });
  calc();

  // FAQ: one open at a time
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  // Toast
  var toast = document.getElementById('toast');
  setTimeout(function () { toast.classList.add('show'); }, 4000);
  toast.querySelector('.toast-x').addEventListener('click', function () { toast.classList.remove('show'); toast.classList.add('gone'); });

  // Sticky CTA after hero
  var sticky = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero');
  window.addEventListener('scroll', function () {
    sticky.classList.toggle('show', window.scrollY > hero.offsetHeight);
  }, { passive: true });
})();
