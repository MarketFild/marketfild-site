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



  /* contact form */
  var form = document.getElementById('cform');
  if (form) {
    var btn = document.getElementById('fbtn');
    var msg = document.getElementById('fmsg');

    var say = function (text, good) {
      msg.textContent = text;
      msg.className = 'fmsg ' + (good ? 'ok' : 'bad');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = ['fn', 'fe', 'fb', 'fh'];
      for (var i = 0; i < required.length; i++) {
        var el = document.getElementById(required[i]);
        if (!el.value.trim()) {
          say('Please fill in every field that is not marked optional.', false);
          el.focus();
          return;
        }
      }
      var email = document.getElementById('fe');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        say('That email address does not look right. Please check it.', false);
        email.focus();
        return;
      }

      var data = new FormData(form);
      var picked = [];
      form.querySelectorAll('input[name="Channels"]:checked').forEach(function (c) { picked.push(c.value); });
      data.delete('Channels');
      data.append('Channels', picked.length ? picked.join(', ') : 'Not specified');

      var key = data.get('access_key');
      if (!key || key === 'WEB3FORMS_ACCESS_KEY') {
        say('This form is not connected yet. Please email contact@marketfild.com instead.', false);
        return;
      }

      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Sending...';
      msg.className = 'fmsg';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            form.reset();
            say('Thank you. We have got it and will reply within one working day.', true);
            btn.textContent = 'Sent';
            setTimeout(function () {
              btn.removeAttribute('aria-busy');
              btn.textContent = 'Send message';
            }, 4000);
          } else {
            throw new Error('rejected');
          }
        })
        .catch(function () {
          btn.removeAttribute('aria-busy');
          btn.textContent = 'Send message';
          say('Something went wrong sending that. Please email contact@marketfild.com directly.', false);
        });
    });
  }

  /* sticky call-to-action bar: appears once you're past the hero */
  var dock = document.getElementById('dock');
  if (dock) {
    var shown = false;
    var onScroll = function () {
      var past = window.scrollY > 620;
      if (past !== shown) { shown = past; dock.classList.toggle('on', past); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
