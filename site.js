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

  /* ---- all Web3Forms forms on the page ---- */
  document.querySelectorAll('form.w3f').forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.fmsg');
    var label = btn ? btn.textContent : 'Send';

    function say(text, good) {
      msg.textContent = text;
      msg.className = 'fmsg ' + (good ? 'ok' : 'bad');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var need = form.querySelectorAll('[required]');
      for (var i = 0; i < need.length; i++) {
        if (!need[i].value.trim()) {
          say('Please fill in the three fields above.', false);
          need[i].focus();
          return;
        }
      }
      var email = form.querySelector('input[type="email"]');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        say('That email address does not look right.', false);
        email.focus();
        return;
      }

      var data = new FormData(form);
      var picked = [];
      form.querySelectorAll('input[name="Channels"]:checked').forEach(function (c) { picked.push(c.value); });
      if (form.querySelector('input[name="Channels"]')) {
        data.delete('Channels');
        data.append('Channels', picked.length ? picked.join(', ') : 'Not specified');
      }
      data.append('Page', location.pathname);

      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Sending...';
      msg.className = 'fmsg';

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) throw new Error('rejected');
          form.reset();
          say('Thank you. We have got it and will reply within one working day.', true);
          btn.textContent = 'Sent';
          setTimeout(function () { btn.removeAttribute('aria-busy'); btn.textContent = label; }, 4000);
        })
        .catch(function () {
          btn.removeAttribute('aria-busy');
          btn.textContent = label;
          say('That did not send. Please email contact@marketfild.com instead.', false);
        });
    });
  });


  /* ---- currency toggle ---- */
  var curBtns = document.querySelectorAll('.curr button');
  if (curBtns.length) {
    var setCur = function (cur) {
      document.querySelectorAll('.m').forEach(function (el) {
        el.innerHTML = el.getAttribute('data-' + cur);
      });
      curBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-cur') === cur ? 'true' : 'false');
      });
      if (window.mfCalc) window.mfCalc(cur);
    };
    curBtns.forEach(function (b) {
      b.addEventListener('click', function () { setCur(b.getAttribute('data-cur')); });
    });
  }

  /* ---- rent vs own calculator ---- */
  var plan = document.getElementById('c-plan');
  if (plan) {
    var apps = document.getElementById('c-apps'),
        rev  = document.getElementById('c-rev'),
        fee  = document.getElementById('c-fee'),
        care = document.getElementById('c-care');
    var RATE = 88;                      // rough USD to INR, display only
    var BUILD = 4200, CARE = 95, SERVER = 3;
    var cur = 'usd';

    function fmt(n) {
      n = Math.round(n);
      if (cur === 'inr') return '\u20B9' + (n * RATE).toLocaleString('en-IN');
      return '$' + n.toLocaleString('en-US');
    }
    function run() {
      var rentM = (+plan.value) + (+apps.value) + ((+rev.value) * (+fee.value) / 100);
      var rent3 = rentM * 36;
      var carePer = care && care.checked ? CARE : 0;
      var ownM  = (carePer + SERVER) * 36;
      var own3  = BUILD + ownM;
      document.getElementById('c-plan-v').textContent = fmt(+plan.value);
      document.getElementById('c-apps-v').textContent = fmt(+apps.value);
      document.getElementById('c-rev-v').textContent  = fmt(+rev.value);
      document.getElementById('c-fee-v').textContent  = (+fee.value).toFixed(1) + '%';
      document.getElementById('o-rent-m').textContent = fmt(rentM);
      document.getElementById('o-rent-3').textContent = fmt(rent3);
      document.getElementById('o-own-1').textContent  = fmt(BUILD);
      document.getElementById('o-own-m').textContent  = fmt(ownM);
      document.getElementById('o-own-3').textContent  = fmt(own3);

      var v = document.getElementById('o-verdict');
      var diff = rent3 - own3;
      if (rentM <= 0) {
        v.innerHTML = 'Put in what you pay now and this will compare it against owning the store outright.';
      } else if (diff > 0) {
        var months = Math.ceil(BUILD / Math.max(rentM - (carePer + SERVER), 1));
        v.innerHTML = 'Owning costs <strong>' + fmt(diff) + ' less</strong> over three years. ' +
                      'The build pays for itself at around <strong>month ' + months + '</strong>.';
      } else {
        v.innerHTML = 'At these numbers renting is <strong>' + fmt(-diff) + ' cheaper</strong> over three years. ' +
                      'We would tell you to stay where you are. Owning starts winning once your platform and apps ' +
                      'cost more than about ' + fmt(BUILD / 36 + carePer + SERVER) + ' a month.';
      }
    }
    [plan, apps, rev, fee].forEach(function (el) { el.addEventListener('input', run); });
    if (care) care.addEventListener('change', run);
    window.mfCalc = function (c) { cur = c; run(); };
    run();
  }

  /* ---- Cal.com popup, loaded only when a booking button is on the page ---- */
  if (document.querySelector('[data-cal-link]')) {
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
    Cal('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  }
})();
