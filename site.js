(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.textContent = 'Menu';
      }
    });
  }

  var h = document.querySelector('[data-split]');
  if (h && !reduce) {
    var words = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'word';
      s.textContent = w;
      s.style.animationDelay = (0.055 * i + 0.05).toFixed(2) + 's';
      h.appendChild(s);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  }

  var targets = [].slice.call(document.querySelectorAll('.rv'));
  function showAll() { targets.forEach(function (t) { t.classList.add('in'); }); }

  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    targets.forEach(function (t, i) {
      t.style.transitionDelay = ((i % 4) * 0.05).toFixed(2) + 's';
      io.observe(t);
    });
    // safety net: nothing stays hidden, whatever happens
    setTimeout(showAll, 2600);
    window.addEventListener('load', function () { setTimeout(showAll, 1200); });
  }

  /* lazy-load the booking calendar only when it scrolls into view */
  var wrap = document.getElementById('cal-wrap');
  if (!wrap) return;
  var started = false;
  function loadCal() {
    if (started) return;
    started = true;
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var ns = ar[1]; api.q = api.q || [];
          typeof ns === 'string' ? (cal.ns[ns] = api) && p(api, ar) : p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
    Cal('init', { origin: 'https://cal.com' });
    Cal('inline', { elementOrSelector: '#cal-inline', calLink: 'marketfild/strategy-call', layout: 'month_view' });
    Cal('ui', { hideEventTypeDetails: false, layout: 'month_view' });
    var done = setInterval(function () {
      if (wrap.querySelector('iframe')) { wrap.classList.add('ready'); clearInterval(done); }
    }, 300);
    setTimeout(function () { clearInterval(done); wrap.classList.add('ready'); }, 9000);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { loadCal(); co.disconnect(); }
    }, { rootMargin: '300px' });
    co.observe(wrap);
  } else { loadCal(); }
})();
