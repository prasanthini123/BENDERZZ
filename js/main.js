/* BENDERZ Design & Consultants — behaviour (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isHome = !!$('.hero');

  /* ---------- 1. Tile loader: page appears block by block ---------- */
  var tiles = $('#tiles'), intro = $('#intro');
  function ready() { document.documentElement.classList.add('ready'); document.body.classList.add('ready'); }
  if (intro && !reduce) {
    document.body.classList.add('has-intro');
    var num = $('#inNum'), barI = $('#inBar'), iT0 = null, DUR = 2000;
    var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
    var introRun = function (ts) {
      iT0 = iT0 || ts; var k = Math.min((ts - iT0) / DUR, 1), v = Math.round(ease(k) * 100);
      num.textContent = ('00' + v).slice(-3); barI.style.transform = 'scaleX(' + (v / 100) + ')';
      if (k < 1) requestAnimationFrame(introRun);
      else setTimeout(function () { intro.classList.add('open'); setTimeout(ready, 380); setTimeout(function () { intro.remove(); }, 1500); }, 250);
    };
    requestAnimationFrame(introRun);
    setTimeout(function () { if (intro.parentNode) { intro.classList.add('open'); ready(); } }, 6000);
  } else if (intro) { intro.remove(); ready(); }
  else if (tiles && !reduce) {
    var cols = Math.ceil(window.innerWidth / 120), rows = Math.ceil(window.innerHeight / 120), span = isHome ? 1100 : 600, html = '';
    tiles.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    tiles.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    for (var t = 0; t < cols * rows; t++) html += '<i style="--d:' + Math.round(Math.random() * span) + 'ms"></i>';
    tiles.innerHTML = html; tiles.classList.add('built');
    setTimeout(ready, isHome ? 650 : 250);
    setTimeout(function () { if (tiles.parentNode) tiles.parentNode.removeChild(tiles); }, span + 150);
  } else { if (tiles && tiles.parentNode) tiles.parentNode.removeChild(tiles); ready(); }

  /* ---------- 2. Menu overlay ---------- */
  var menu = $('#menu'), btn = $('#menuBtn'), bar = $('.bar');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('open', open); document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open; document.body.style.overflow = open ? 'hidden' : '';
  }
  if (menu && btn) {
    menu.inert = true;
    btn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- 3. Bar hide/show + progress ---------- */
  var prog = document.createElement('div'); prog.className = 'progress'; document.body.appendChild(prog);
  var lastY = window.scrollY;

  /* ---------- 4. Fit big wordmarks to the page width ---------- */
  function fit(el) {
    var cs = getComputedStyle(el), avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!avail) return;
    var keep = [el.style.fontSize, el.style.width, el.style.justifyContent, el.style.right];
    el.style.fontSize = '100px'; el.style.width = 'max-content'; el.style.right = 'auto'; el.style.justifyContent = 'flex-start';
    var w = el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.width = keep[1]; el.style.justifyContent = keep[2]; el.style.right = keep[3];
    el.style.fontSize = (100 * avail / w).toFixed(2) + 'px';
  }
  function fitAll() { $$('[data-fit]').forEach(fit); }
  fitAll(); window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------- 5. Hero rotating line ---------- */
  var lines = $$('.hero-line span');
  if (lines.length > 1) {
    var li = 0; lines[0].classList.add('on');
    setInterval(function () { lines[li].classList.remove('on'); li = (li + 1) % lines.length; lines[li].classList.add('on'); }, 3600);
  } else if (lines[0]) lines[0].classList.add('on');

  /* ---------- 6. Split text helpers ---------- */
  var scrubs = [];
  function splitWords(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim(); el.setAttribute('aria-label', label);
    el.innerHTML = label.split(' ').map(function (w) { return '<span class="sw" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
    return $$('.sw', el);
  }
  function splitChars(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim(); el.setAttribute('aria-label', label);
    el.innerHTML = label.split(' ').map(function (w) {
      return '<span style="display:inline-block;white-space:nowrap" aria-hidden="true">' + w.split('').map(function (c) { return '<span class="sc">' + esc(c) + '</span>'; }).join('') + '</span>';
    }).join(' ');
    return $$('.sc', el);
  }
  $$('.scrub').forEach(function (el) { scrubs.push({ el: el, units: splitWords(el), blur: true }); });
  $$('[data-chars]').forEach(function (el) { scrubs.push({ el: el, units: splitChars(el), blur: false }); });
  function updScrub(vh) {
    scrubs.forEach(function (s) {
      var r = s.el.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh) return;
      var p = reduce ? 1 : clamp((vh * 0.9 - r.top) / (vh * 0.5), 0, 1), n = s.units.length;
      s.units.forEach(function (u, i) {
        var k = clamp((p * (n + 4) - i) / 4, 0, 1);
        u.style.opacity = (0.13 + 0.87 * k).toFixed(3);
        
      });
    });
  }

  /* inner page hero heading: masked word rise */
  $$('.page-hero h1').forEach(function (h) {
    var label = h.textContent.trim(); h.setAttribute('aria-label', label);
    h.innerHTML = label.split(/\s+/).map(function (w, i) { return '<span class="hw" aria-hidden="true"><span style="--wi:' + i + '">' + esc(w) + '</span></span>'; }).join(' ');
  });

  /* masked word-rise for section headings */
  var riseEls = $$('.about-top h2,.svc-head h2,.trades-head h2,.work-head h2,.section-head h2,.proc-h-x').map(function (h) {
    var label = h.textContent.replace(/\s+/g, ' ').trim(); h.setAttribute('aria-label', label); h.classList.remove('reveal'); h.classList.add('rise');
    h.innerHTML = label.split(' ').map(function (w, i) { return '<span class="hw" aria-hidden="true"><span style="--wi:' + i + '">' + esc(w) + '</span></span>'; }).join(' ');
    return h;
  });
  /* ---------- 7. Reveal, tile-pop, bars, counters ---------- */
  $$('.tilein').forEach(function (el) {
    var r = el.getBoundingClientRect(), c = 6, rw = Math.max(4, Math.round(c * (r.height || 400) / (r.width || 300))), h = '';
    for (var i = 0; i < c * rw; i++) h += '<i style="--d:' + Math.round(Math.random() * 750) + 'ms"></i>';
    var d = document.createElement('div'); d.className = 'tl'; d.setAttribute('aria-hidden', 'true');
    d.style.gridTemplateColumns = 'repeat(' + c + ',1fr)'; d.style.gridTemplateRows = 'repeat(' + rw + ',1fr)'; d.innerHTML = h; el.appendChild(d);
  });
  $$('[data-stagger]').forEach(function (g) { Array.prototype.slice.call(g.children).forEach(function (c, i) { c.style.setProperty('--i', i); }); });
  function count(root) {
    $$('[data-count]', root).forEach(function (el) {
      var end = +el.getAttribute('data-count'), t0 = null;
      if (reduce) { el.textContent = end; return; }
      (function step(ts) { t0 = t0 || ts; var p = Math.min((ts - t0) / 1700, 1); el.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    });
  }
  var revealSel = '.reveal,.blur-in,.tilein,.step,.bars,.foot-mark,.rise,.rail';
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (!e.target.__c && e.target.querySelector('[data-count]')) { e.target.__c = 1; count(e.target); }
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    $$(revealSel).forEach(function (el) { io.observe(el); });
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }); }, { threshold: 0.4 });
    $$('.numbers,.stats').forEach(function (el) { if (!el.querySelector('.reveal')) cio.observe(el); });
  } else { $$(revealSel).forEach(function (el) { el.classList.add('in'); }); count(document); }

  /* ---------- 8. Horizontal project rail ---------- */
  $$('.rail-wrap').forEach(function (w) {
    var rail = $('.rail', w), nx = $('.rail-btn.next', w), pv = $('.rail-btn.prev', w);
    if (!rail) return;
    var step = function () { var c = $('.pc', rail); return c ? c.getBoundingClientRect().width + 16 : 320; };
    var sync = function () {
      if (pv) pv.style.display = rail.scrollLeft > 30 ? 'grid' : 'none';
      if (nx) nx.style.display = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 30 ? 'grid' : 'none';
    };
    if (nx) nx.addEventListener('click', function () { rail.scrollBy({ left: step() * 1.5, behavior: 'smooth' }); });
    if (pv) pv.addEventListener('click', function () { rail.scrollBy({ left: -step() * 1.5, behavior: 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
    var down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { rail.classList.add('drag'); rail.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', function () { down = false; setTimeout(function () { rail.classList.remove('drag'); }, 0); });
    rail.addEventListener('click', function (e) { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    $$('img', rail).forEach(function (i) { i.draggable = false; });
  });

  /* ---------- 9. One scroll loop: expand, parallax, scrub, progress ---------- */
  var expand = $('.expand'), stick = expand && $('.ex-stick', expand), exMain = stick && $('.ex-main', stick);
  var heroPhoto = $('.hero-photo'), pars = $$('[data-par]'), wm = $('.hero .wordmark');
  var speeds = [['.collage .c1', -0.07], ['.collage .c2', 0.1], ['.duo figure:nth-child(1)', 0.05], ['.duo figure:nth-child(2)', -0.06], ['.trades .t:nth-child(1)', 0.04], ['.trades .t:nth-child(3)', -0.05]].map(function (a) { var el = $(a[0]); return el ? { el: el, host: el.parentElement, k: a[1] } : null; }).filter(Boolean);
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.scrollY, max = document.documentElement.scrollHeight - vh;
    prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    if (bar && !document.body.classList.contains('menu-open')) bar.classList.toggle('hide', y > lastY && y > 420);
    lastY = y;
    updScrub(vh);
    if (stick && !reduce) {
      var r = expand.getBoundingClientRect(), p = clamp(-r.top / (r.height - vh), 0, 1);
      p = clamp((p - 0.04) / 0.74, 0, 1); p = p * p * (3 - 2 * p);
      stick.style.setProperty('--p', p.toFixed(4)); stick.style.setProperty('--q', (1 - p).toFixed(4));
      var q = 1 - p, W = window.innerWidth, Hh = vh, cp = 'inset(' + (q * Hh * 0.2).toFixed(1) + 'px ' + (q * W * 0.35).toFixed(1) + 'px ' + (q * Hh * 0.16).toFixed(1) + 'px ' + (q * W * 0.35).toFixed(1) + 'px round ' + (q * Math.min(W, Hh) * 0.5).toFixed(1) + 'px)';
      exMain.style.clipPath = cp; exMain.style.webkitClipPath = cp;
    }
    if (wm && !reduce && y < vh * 1.3) { var hp = clamp(y / vh, 0, 1); wm.style.translate = '0 ' + (-hp * 16).toFixed(2) + 'vh'; wm.style.opacity = (1 - hp * 1.15).toFixed(3); }
    if (!reduce) speeds.forEach(function (s) {
      var r = s.host.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      s.el.style.translate = '0 ' + (((r.top + r.height / 2) - vh / 2) * s.k).toFixed(1) + 'px';
    });
    if (heroPhoto && !reduce && y < vh * 1.2) heroPhoto.style.transform = 'translateY(' + (y * 0.16).toFixed(1) + 'px)';
    pars.forEach(function (el) {
      var host = el.parentElement, r = host.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var lim = r.height * 0.14, v = clamp(((r.top + r.height / 2) - vh / 2) * -0.14, -lim, lim);
      el.style.transform = 'translateY(' + v.toFixed(1) + 'px)';
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); frame();

  /* ---------- 10. Tabs (service + project pages) ---------- */
  var tabs = $$('.tab[data-target]');
  if (tabs.length) {
    var activate = function (id, push) {
      var found = false; tabs.forEach(function (t) { if (t.getAttribute('data-target') === id) found = true; });
      if (!found) return;
      tabs.forEach(function (t) { var on = t.getAttribute('data-target') === id; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      $$('.panel').forEach(function (p) { p.classList.toggle('active', p.id === id); });
      if (push && history.replaceState) history.replaceState(null, '', '#' + id);
      var act = $('.tab.active'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
      $$('.panel.active .reveal,.panel.active .tilein').forEach(function (el) { el.classList.add('in'); });
      $$('.panel.active [data-count]').forEach(function (el) { count(el.parentNode); });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { activate(t.getAttribute('data-target'), true); }); });
    var h0 = location.hash.slice(1); if (h0) activate(h0, false);
    window.addEventListener('hashchange', function () { activate(location.hash.slice(1), false); });
  }

  /* ---------- 11. Project details modal ---------- */
  var dataEl = $('#projData'), modal = $('#modal');
  if (dataEl && modal) {
    var data = JSON.parse(dataEl.textContent), mBody = $('#modalBody'), mTitle = $('#modalTitle'), lastFocus;
    var find = function (arr, keys) { for (var i = 0; i < arr.length; i++) for (var k = 0; k < keys.length; k++) if (arr[i].title.indexOf(keys[k]) > -1) return arr[i].value; return 'N/A'; };
    var close = function () { modal.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    var open = function (id) {
      var p = data[id]; if (!p || !p.detail) return; var d = p.detail; lastFocus = document.activeElement;
      mTitle.textContent = d.title;
      mBody.innerHTML =
        '<div class="m-top"><img src="' + esc(d.image) + '" alt="' + esc(d.title) + '">' +
        '<div class="m-info"><h4>Project Information</h4><ul>' +
        '<li><i class="fas fa-map-marker-alt"></i><span><strong>Location:</strong> ' + esc(d.location) + '</span></li>' +
        '<li><i class="fas fa-user-tie"></i><span><strong>Engineer / Client:</strong> ' + esc(find(d.features, ['Engineer', 'Client'])) + '</span></li>' +
        '<li><i class="fas fa-calendar-alt"></i><span><strong>Completed:</strong> ' + esc(find(d.features, ['Date'])) + '</span></li>' +
        '<li><i class="fas fa-ruler-combined"></i><span><strong>Area:</strong> ' + esc(find(d.features, ['Area'])) + '</span></li></ul></div></div>' +
        '<div class="m-sec"><h4>Project Description</h4><p>' + esc(d.description) + '</p></div>' +
        '<div class="m-sec"><h4>Technical Specifications</h4><div class="specs">' +
        d.features.map(function (f) { return '<div class="spec"><h5>' + esc(f.title) + '</h5><p>' + esc(f.value) + '</p></div>'; }).join('') + '</div></div>' +
        '<div class="m-sec"><h4>Scope of Work</h4><p>' + esc(d.scope) + '</p></div>' +
        '<div class="m-actions">' + (p.pdf ? '<a class="btn btn-primary btn-sm" href="' + encodeURI(p.pdf) + '" target="_blank" rel="noopener"><i class="far fa-file-pdf"></i> View PDF</a>' : '') +
        '<button class="btn btn-ghost btn-sm" data-close><i class="fas fa-times"></i> Close</button></div>';
      modal.classList.add('open'); document.body.style.overflow = 'hidden'; $('.modal-x', modal).focus();
    };
    $$('[data-project]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(b.getAttribute('data-project')); }); });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]') || e.target.closest('.modal-x')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }

  /* ---------- 12. Contact form: validation + email / WhatsApp send ---------- */
  var form = $('#contactForm');
  if (form) {
    var svcIn = $('#service');
    $$('.pick button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        $$('.pick button', form).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', on); svcIn.value = on ? b.textContent : '';
      });
    });
    var val = function (id) { return ($('#' + id).value || '').trim(); };
    var bad = function (id, msg) { var f = $('#' + id).closest('.field'); f.classList.add('bad'); $('.err', f).textContent = msg; $('#' + id).setAttribute('aria-invalid', 'true'); };
    var check = function () {
      $$('.field', form).forEach(function (f) { f.classList.remove('bad'); });
      var ok = true;
      if (val('name').length < 2) { bad('name', 'Please enter your name.'); ok = false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email'))) { bad('email', 'Enter a valid email address, for example name@company.com.'); ok = false; }
      if (val('message').length < 10) { bad('message', 'Tell us a little about the project (at least 10 characters).'); ok = false; }
      if (!ok) { var f = $('.field.bad input,.field.bad textarea', form); if (f) f.focus(); }
      return ok;
    };
    var compose = function () {
      return 'Name: ' + val('name') + '\nEmail: ' + val('email') + '\nPhone: ' + val('phone') + '\nCompany: ' + val('company') + '\nService: ' + (svcIn.value || 'Not specified') + '\n\nProject details:\n' + val('message');
    };
    var done = function (html) { var n = $('#formNotice'); n.innerHTML = html; n.classList.add('show'); };
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!check()) return;
      var to = form.getAttribute('data-to'), subj = 'Project Enquiry from ' + val('name') + (svcIn.value ? ' - ' + svcIn.value : '');
      done('<strong><i class="fas fa-check-circle"></i> Thank you, ' + esc(val('name')) + '!</strong> Your email app is opening with the message ready to send. If nothing opens, write to <a href="mailto:' + esc(to) + '">' + esc(to) + '</a>.');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(compose());
    });
    var wa = $('#waSend');
    if (wa) wa.addEventListener('click', function () {
      if (!check()) return;
      done('<strong><i class="fas fa-check-circle"></i> Opening WhatsApp, ' + esc(val('name')) + '.</strong> Press send in WhatsApp to share your project details.');
      window.open('https://wa.me/919597500808?text=' + encodeURIComponent('Hello BENDERZ Team,\n' + compose()), '_blank', 'noopener');
    });
    $$('input,textarea', form).forEach(function (el) { el.addEventListener('input', function () { el.closest('.field').classList.remove('bad'); el.removeAttribute('aria-invalid'); }); });
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); var v = b.getAttribute('data-copy'), t = b.textContent;
      var ok = function () { b.classList.add('done'); b.textContent = 'Copied'; setTimeout(function () { b.classList.remove('done'); b.textContent = t; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(ok, ok); else ok();
    });
  });
  var ob = $('#openNow');
  if (ob) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()), g = {};
    parts.forEach(function (p) { g[p.type] = p.value; });
    var hr = +g.hour + (+g.minute) / 60, wk = ['Sat', 'Sun'].indexOf(g.weekday) < 0, open = wk && hr >= 9 && hr < 18;
    ob.classList.toggle('is-open', open);
    ob.textContent = open ? 'Open now, closes at 6.00 pm IST' : 'Closed now, back Mon - Fri from 9.00 am IST';
  }

  /* ---------- 13. Cursor ring, magnetic buttons, page-exit tiles ---------- */
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduce) {
    var cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
    var mx = 0, my = 0, cx = 0, cy = 0, run = false;
    var loop = function () { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(loop); else run = false; };
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; cur.classList.add('on'); if (!run) { run = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) { cur.classList.toggle('hot', !!e.target.closest('a,button,summary,.pc,input,textarea')); });
    $$('.btn,.bar-cta,.orb,.burger').forEach(function (el) {
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px)'; });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
  if (!reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank' || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin && u.protocol !== 'file:') return;
      if (u.protocol !== 'http:' && u.protocol !== 'https:' && u.protocol !== 'file:') return;
      if (u.pathname === location.pathname || /\.pdf$/i.test(u.pathname)) return;
      e.preventDefault();
      var o = document.createElement('div'), c = Math.ceil(innerWidth / 120), r = Math.ceil(innerHeight / 120), h = '';
      o.className = 'tiles tiles-out built'; o.style.gridTemplateColumns = 'repeat(' + c + ',1fr)'; o.style.gridTemplateRows = 'repeat(' + r + ',1fr)';
      for (var i = 0; i < c * r; i++) h += '<i style="--d:' + Math.round(Math.random() * 380) + 'ms"></i>';
      o.innerHTML = h; document.body.appendChild(o); setMenu(false);
      setTimeout(function () { location.href = a.href; }, 520);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) $$('.tiles-out').forEach(function (t) { t.remove(); }); });
  }

  /* ---------- 14. Inertial smooth scrolling (wheel) + smooth anchors ---------- */
  var sTgt = window.scrollY, sCur = sTgt, sAct = false;
  var maxY = function () { return document.documentElement.scrollHeight - window.innerHeight; };
  var sTick = function () {
    sCur += (sTgt - sCur) * 0.1;
    if (Math.abs(sTgt - sCur) < 0.5) { sCur = sTgt; sAct = false; }
    window.scrollTo(0, sCur);
    if (sAct) requestAnimationFrame(sTick);
  };
  var go = function (y) { sTgt = clamp(y, 0, maxY()); if (!sAct) { sAct = true; sCur = window.scrollY; requestAnimationFrame(sTick); } };
  window.addEventListener('scroll', function () { if (!sAct) { sTgt = sCur = window.scrollY; } }, { passive: true });
  if (fine && !reduce) {
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || document.body.classList.contains('menu-open') || (e.target.closest && e.target.closest('.modal,.menu,textarea,iframe'))) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      go((sAct ? sTgt : window.scrollY) + (e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY));
    }, { passive: false });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || a.target === '_blank') return;
    var u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname || !u.hash || u.hash.length < 2 || $$('.tab[data-target]').length) return;
    var el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!el) return;
    e.preventDefault(); history.replaceState(null, '', u.hash);
    var y = el.getBoundingClientRect().top + window.scrollY - (el.classList.contains('sec') || el.classList.contains('work') ? 0 : 80);
    go(y);
  });

  /* ---------- 15. Hero mouse parallax + velocity marquee ---------- */
  var heroEl = $('.hero'), bpEl = heroEl && $('.hero .bp');
  if (heroEl && bpEl && fine && !reduce) {
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      bpEl.style.translate = (x * -34).toFixed(1) + 'px ' + (y * -26).toFixed(1) + 'px';
    });
    heroEl.addEventListener('mouseleave', function () { bpEl.style.translate = '0 0'; });
  }
  var mq = $('.mq-track');
  if (mq && !reduce) {
    var mqX = 0, prevY = window.scrollY, sm = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(mq.parentElement);
    (function mqLoop() {
      var y = window.scrollY, v = y - prevY; prevY = y; sm += (v - sm) * 0.12;
      if (vis) {
        var half = mq.scrollWidth / 2; mqX -= 0.7 + Math.abs(sm) * 0.35; if (-mqX >= half) mqX += half;
        mq.style.transform = 'translate3d(' + mqX.toFixed(1) + 'px,0,0) skewX(' + clamp(-sm * 0.35, -9, 9).toFixed(2) + 'deg)';
      }
      requestAnimationFrame(mqLoop);
    })();
  }
})();
