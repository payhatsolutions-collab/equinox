/* Equinox Quantitative — research library */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- theme */
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  $$('.theme-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = t;
      try { localStorage.setItem('eq-theme', t); } catch (_) {}
    });
  });

  /* ---------------- top bar over the hero */
  var bar = $('.home .topbar'), hero = $('.hero');
  if (bar) {
    var onScroll = function () {
      var lim = hero ? hero.offsetHeight - 70 : 10;
      bar.classList.toggle('solid', window.scrollY > lim);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- toast */
  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = doc.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); doc.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  /* ---------------- library filters */
  var grid = $('#grid');
  if (grid) {
    var cards = $$('.card', grid);
    var state = { kind: 'all', stance: {}, market: {}, q: '', sort: 'new' };
    var count = $('#count'), empty = $('#empty');
    var apply = function () {
      var anyS = Object.keys(state.stance).length, anyM = Object.keys(state.market).length, q = state.q, n = 0;
      cards.forEach(function (c) {
        var ok = (state.kind === 'all' || c.dataset.kind === state.kind) &&
          (!anyS || state.stance[c.dataset.stance]) &&
          (!anyM || state.market[c.dataset.market]) &&
          (!q || q.split(/\s+/).every(function (w) { return c.dataset.q.indexOf(w) > -1; }));
        c.hidden = !ok; if (ok) n++;
      });
      var key = state.sort, sorted = cards.slice().sort(function (a, b) {
        var ma = a.dataset.move === '' ? null : +a.dataset.move, mb = b.dataset.move === '' ? null : +b.dataset.move;
        if (key === 'old') return a.dataset.date < b.dataset.date ? -1 : a.dataset.date > b.dataset.date ? 1 : 0;
        if (key === 'up' || key === 'down') {
          if (ma === null) return 1; if (mb === null) return -1;
          return key === 'up' ? mb - ma : ma - mb;
        }
        if (key === 'az') return a.dataset.name.localeCompare(b.dataset.name);
        return a.dataset.date < b.dataset.date ? 1 : a.dataset.date > b.dataset.date ? -1 : 0;
      });
      sorted.forEach(function (c) { grid.appendChild(c); });
      if (count) count.textContent = n;
      if (empty) empty.hidden = n > 0;
    };
    $$('[data-f-kind]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-f-kind]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        state.kind = b.dataset.fKind; apply();
      });
    });
    [['stance', 'fStance'], ['market', 'fMarket']].forEach(function (p) {
      $$('[data-f-' + p[0] + ']').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.dataset[p[1]], on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (on) state[p[0]][v] = 1; else delete state[p[0]][v];
          apply();
        });
      });
    });
    var qi = $('#q'), si = $('#sort');
    if (qi) qi.addEventListener('input', function () { state.q = qi.value.trim().toLowerCase(); apply(); });
    if (si) si.addEventListener('change', function () { state.sort = si.value; apply(); });
    var reset = $('#reset');
    if (reset) reset.addEventListener('click', function () {
      state = { kind: 'all', stance: {}, market: {}, q: '', sort: state.sort };
      if (qi) qi.value = '';
      $$('[data-f-kind]').forEach(function (x) { x.setAttribute('aria-selected', x.dataset.fKind === 'all' ? 'true' : 'false'); });
      $$('.chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      apply();
    });
  }

  /* ---------------- orbit */
  var orbit = $('#orbit');
  if (orbit && window.EQ_DATA) drawOrbit(orbit, window.EQ_DATA.slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }));

  function drawOrbit(host, data) {
    var NS = 'http://www.w3.org/2000/svg', S = 640, C = S / 2;
    var R0 = 178, K = 104, RMIN = 86, RMAX = 300;
    var rOf = function (m) { return m === null ? R0 : Math.max(RMIN, Math.min(RMAX, R0 + K * m)); };
    var A0 = -66, A1 = 246; // leave a gap at the top for ring labels
    var el = function (n, a, p) { var x = doc.createElementNS(NS, n); for (var k in a) x.setAttribute(k, a[k]); if (p) p.appendChild(x); return x; };
    var svg = el('svg', { viewBox: '0 0 ' + S + ' ' + S, 'aria-hidden': 'true' });
    var defs = el('defs', {}, svg);
    var gl = el('radialGradient', { id: 'oglow' }, defs);
    el('stop', { offset: '0', 'stop-color': '#E3C887', 'stop-opacity': '.38' }, gl);
    el('stop', { offset: '1', 'stop-color': '#E3C887', 'stop-opacity': '0' }, gl);
    var day = el('radialGradient', { id: 'oday', cx: '.35', cy: '.32', r: '.85' }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFF4D8' }, day);
    el('stop', { offset: '.55', 'stop-color': '#E6CB8C' }, day);
    el('stop', { offset: '1', 'stop-color': '#A9843F' }, day);
    var night = el('radialGradient', { id: 'onight', cx: '.7', cy: '.7', r: '.9' }, defs);
    el('stop', { offset: '0', 'stop-color': '#2B3C66' }, night);
    el('stop', { offset: '1', 'stop-color': '#0C1328' }, night);
    var clip = el('clipPath', { id: 'ohalf' }, defs);
    el('rect', { x: -80, y: -80, width: 80, height: 160 }, clip);

    var g = el('g', { transform: 'translate(' + C + ',' + C + ')' }, svg);
    // rings
    [[-0.5, '−50%'], [0, 'PRICE'], [0.5, '+50%'], [1, '+100%']].forEach(function (r) {
      var rr = rOf(r[0]);
      el('circle', { r: rr, 'class': 'o-ring' + (r[0] === 0 ? ' zero' : '') }, g);
      var t = el('text', { x: 6, y: -rr - 6, 'class': 'o-lab' + (r[0] === 0 ? ' zero' : '') }, g);
      t.textContent = r[1];
    });
    // ticks (slow spin)
    var spin = el('g', { 'class': 'o-spin' }, g);
    for (var i = 0; i < 120; i++) {
      var a = i / 120 * Math.PI * 2, r1 = RMAX + 14, r2 = RMAX + (i % 10 === 0 ? 22 : 18);
      el('line', { x1: r1 * Math.cos(a), y1: r1 * Math.sin(a), x2: r2 * Math.cos(a), y2: r2 * Math.sin(a), stroke: 'rgba(241,235,221,' + (i % 10 === 0 ? .35 : .14) + ')', 'stroke-width': 1 }, spin);
    }
    // sun: day/night split, tilted by the obliquity of the ecliptic
    var sun = el('g', { 'class': 'o-sun' }, g);
    el('circle', { r: 120, fill: 'url(#oglow)' }, sun);
    var body = el('g', { transform: 'rotate(23.44)' }, sun);
    el('circle', { r: 58, fill: 'url(#onight)' }, body);
    var lit = el('g', { 'clip-path': 'url(#ohalf)' }, body);
    el('circle', { r: 58, fill: 'url(#oday)' }, lit);
    el('line', { x1: 0, y1: -70, x2: 0, y2: 70, stroke: 'rgba(241,235,221,.35)', 'stroke-width': 1 }, body);
    el('circle', { r: 58, fill: 'none', stroke: 'rgba(241,235,221,.25)', 'stroke-width': 1 }, body);
    var lab = el('text', { y: 92, 'text-anchor': 'middle', 'class': 'o-lab' }, sun);
    lab.textContent = data.length + ' CALLS';

    var tip = doc.createElement('div'); tip.className = 'o-tip'; host.appendChild(tip);
    var pts = [];
    data.forEach(function (d, i) {
      var ang = (A0 + (A1 - A0) * (data.length === 1 ? .5 : i / (data.length - 1))) * Math.PI / 180;
      var r = rOf(d.m), x = r * Math.cos(ang), y = r * Math.sin(ang);
      var st = d.st;
      var stem = null;
      if (d.m !== null) stem = el('line', { x1: R0 * Math.cos(ang), y1: R0 * Math.sin(ang), x2: x, y2: y, 'class': 'o-stem ' + st, style: '--i:' + i }, g);
      var p;
      if (d.k === 'report') p = el('rect', { x: x - 5.5, y: y - 5.5, width: 11, height: 11, transform: 'rotate(45 ' + x + ' ' + y + ')', 'class': 'o-pt ' + st, style: '--i:' + i, tabindex: 0 }, g);
      else p = el('circle', { cx: x, cy: y, r: 6.2, 'class': 'o-pt ' + st, style: '--i:' + i, tabindex: 0 }, g);
      p.setAttribute('role', 'link');
      p.setAttribute('aria-label', d.n + ', ' + d.r);
      pts.push({ p: p, stem: stem, d: d, x: x, y: y });
    });
    host.appendChild(svg);

    var fmt = function (iso) { var p = iso.split('-'); return +p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + p[0]; };
    var show = function (o) {
      pts.forEach(function (q) { q.p.classList.toggle('on', q === o); if (q.stem) q.stem.classList.toggle('on', q === o); });
      host.classList.add('dim');
      var m = o.d.m, mv = m === null ? '<em class="mv nr">No target</em>' : '<em class="mv ' + o.d.st + '">' + (m > 0 ? '+' : m < 0 ? '−' : '') + Math.abs(Math.round(m * 100)) + '% to target</em>';
      tip.innerHTML = '<b></b><span></span><span>' + mv + '</span>';
      tip.querySelector('b').textContent = o.d.n;
      tip.querySelectorAll('span')[0].textContent = o.d.r + ' · ' + (o.d.k === 'note' ? 'Note' : 'Report') + ' · ' + fmt(o.d.d);
      var box = host.getBoundingClientRect(), sc = box.width / S;
      var px = (o.x + C) * sc, py = (o.y + C) * sc;
      tip.classList.add('show');
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = px + 16, top = py - th - 12;
      if (left + tw > box.width) left = px - tw - 16;
      if (top < 0) top = py + 16;
      tip.style.left = Math.max(0, left) + 'px'; tip.style.top = top + 'px';
    };
    var hide = function () { host.classList.remove('dim'); tip.classList.remove('show'); pts.forEach(function (q) { q.p.classList.remove('on'); if (q.stem) q.stem.classList.remove('on'); }); };
    var touched = null;
    pts.forEach(function (o) {
      o.p.addEventListener('mouseenter', function () { show(o); });
      o.p.addEventListener('focus', function () { show(o); });
      o.p.addEventListener('mouseleave', hide);
      o.p.addEventListener('blur', hide);
      o.p.addEventListener('click', function (ev) {
        if (ev.pointerType === 'touch' || ('ontouchstart' in window && touched !== o)) {
          if (touched !== o) { touched = o; show(o); ev.preventDefault(); return; }
        }
        location.href = o.d.s + '/';
      });
      o.p.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') location.href = o.d.s + '/'; });
    });
    doc.addEventListener('click', function (ev) { if (!host.contains(ev.target)) { touched = null; hide(); } });
  }

  /* ---------------- reader: view switch */
  var tabs = $$('.r-actions .seg button');
  var views = { web: $('#view-web'), pages: $('#view-pages') };
  function setView(v, push) {
    if (!views.web) v = 'pages';
    tabs.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.view === v ? 'true' : 'false'); });
    if (views.web) views.web.hidden = v !== 'web';
    if (views.pages) views.pages.hidden = v !== 'pages';
    if (push) history.replaceState(null, '', v === 'pages' ? '#original' : location.pathname + location.search);
    if (v === 'pages') primeText();
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view, true); }); });
  if (views.pages) setView(location.hash === '#original' || !views.web ? 'pages' : 'web', false);

  /* ---------------- reader: selectable text over each page */
  var pagesEl = $('.pages'), textData = null, textReq = null;
  function loadText() {
    if (!textReq) textReq = fetch(pagesEl.dataset.text).then(function (r) { return r.json(); }).then(function (j) { textData = j; return j; }).catch(function () { textData = { pages: [] }; });
    return textReq;
  }
  function fit(fig) {
    var spans = fig._spans; if (!spans || !fig.clientWidth) return;
    var W = fig.clientWidth, i, s, nat = [];
    for (i = 0; i < spans.length; i++) { spans[i].el.style.transform = 'none'; }
    for (i = 0; i < spans.length; i++) { nat.push(spans[i].el.getBoundingClientRect().width); }
    for (i = 0; i < spans.length; i++) {
      s = spans[i]; var want = s.w / 100 * W;
      if (nat[i] > 0) s.el.style.transform = 'scaleX(' + (want / nat[i]).toFixed(4) + ')';
    }
    fig._fitW = W;
  }
  function build(fig) {
    if (fig._built) return; fig._built = true;
    loadText().then(function (j) {
      var pg = j.pages[+fig.dataset.i]; if (!pg) return;
      var tl = $('.tl', fig), frag = doc.createDocumentFragment(), list = [];
      pg.s.forEach(function (a) {
        var sp = doc.createElement('span');
        sp.textContent = a[5];
        sp.style.left = a[0] + '%'; sp.style.top = a[1] + '%';
        sp.style.fontSize = a[4] + 'cqw'; sp.style.height = a[3] + 'cqw'; sp.style.lineHeight = a[3] + 'cqw';
        frag.appendChild(sp); list.push({ el: sp, w: a[2] });
      });
      tl.appendChild(frag); fig._spans = list;
      var go = function () { requestAnimationFrame(function () { fit(fig); }); };
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go); else go();
    });
  }
  var io = null;
  function primeText() {
    if (!pagesEl || io) return;
    var figs = $$('.pg', pagesEl);
    if (!('IntersectionObserver' in window)) { figs.forEach(build); return; }
    io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) build(en.target); }); }, { rootMargin: '900px 0px' });
    figs.forEach(function (f) { io.observe(f); });
  }
  if (pagesEl && views.pages && !views.pages.hidden) primeText();
  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT); rT = setTimeout(function () { $$('.pg').forEach(function (f) { if (f._spans && f.clientWidth !== f._fitW) fit(f); }); }, 160);
  });

  /* ---------------- reader: zoom */
  var Z = [0, 1.25, 1.5, 2, 2.5], zi = 0;
  $$('.zoom button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = +b.dataset.zoom;
      zi = d === 0 ? 0 : Math.max(0, Math.min(Z.length - 1, zi + d));
      if (!pagesEl) return;
      if (zi === 0) { pagesEl.classList.remove('zoomed'); pagesEl.style.removeProperty('--pw'); }
      else {
        var base = Math.min(pagesEl.clientWidth, 920);
        pagesEl.classList.add('zoomed'); pagesEl.style.setProperty('--pw', Math.round(base * Z[zi]) + 'px');
      }
      setTimeout(function () { $$('.pg').forEach(function (f) { if (f._spans) fit(f); }); }, 30);
    });
  });

  /* ---------------- share */
  $$('.share-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.href.split('#')[0], title = b.dataset.title || doc.title;
      if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { toast(url); });
      else toast(url);
    });
  });

  /* ---------------- reveal */
  if (!reduce && 'IntersectionObserver' in window) {
    var rv = $$('.card, .m, .dcard, .sec-h');
    rv.forEach(function (x) { x.classList.add('rv'); });
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target; t.classList.add('in'); ro.unobserve(t);
        setTimeout(function () { t.classList.remove('rv', 'in'); }, 900); // hand transforms back to :hover
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (x) { ro.observe(x); });
  }
})();
