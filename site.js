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
  var cPlan = document.getElementById('c-plan');
  if (cPlan) {
    var RATE = 88, BUILD = 4200, CARE = 95, SERVER = 3, MONTHS = 36;
    var cur = 'usd';

    /* slider position 0-1000 maps to value on a curve, so small numbers stay controllable
       even when the top of the range is very large */
    var F = {
      'c-plan': { max: 2000,    pow: 2.2, money: true },
      'c-apps': { max: 2000,    pow: 2.2, money: true },
      'c-rev':  { max: 1000000, pow: 3.0, money: true },
      'c-fee':  { max: 100,     pow: 2.6, money: false }
    };
    var toVal = function (id, pos) {
      var f = F[id], v = f.max * Math.pow(pos / 1000, f.pow);
      if (!f.money) return Math.round(v * 10) / 10;
      return v < 1000 ? Math.round(v) : Math.round(v / 50) * 50;
    };
    var toPos = function (id, val) {
      var f = F[id];
      return Math.max(0, Math.min(1000, Math.round(1000 * Math.pow(Math.max(val, 0) / f.max, 1 / f.pow))));
    };

    var money = function (n) {
      n = Math.round(n);
      return cur === 'inr'
        ? '\u20B9' + (n * RATE).toLocaleString('en-IN')
        : '$' + n.toLocaleString('en-US');
    };
    var shortMoney = function (n) {
      n = Math.round(n);
      if (cur === 'inr') {
        var r = n * RATE;
        if (r >= 10000000) return '\u20B9' + (r / 10000000).toFixed(1) + 'Cr';
        if (r >= 100000) return '\u20B9' + (r / 100000).toFixed(1) + 'L';
        if (r >= 1000) return '\u20B9' + Math.round(r / 1000) + 'k';
        return '\u20B9' + r;
      }
      if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return '$' + Math.round(n / 1000) + 'k';
      return '$' + n;
    };

    var ids = ['c-plan', 'c-apps', 'c-rev', 'c-fee'];
    var care = document.getElementById('c-care');
    var vals = {};

    ids.forEach(function (id) {
      var rng = document.getElementById(id),
          num = document.getElementById(id + '-n');
      vals[id] = parseFloat(num.value) || 0;
      rng.value = toPos(id, vals[id]);
      document.getElementById(id + '-hi').textContent =
        F[id].money ? shortMoney(F[id].max) : F[id].max + '%';

      rng.addEventListener('input', function () {
        vals[id] = toVal(id, +rng.value);
        num.value = vals[id];
        paint(id); run();
      });
      num.addEventListener('input', function () {
        var v = parseFloat(num.value);
        if (isNaN(v) || v < 0) v = 0;
        if (v > F[id].max) { v = F[id].max; num.value = v; }
        vals[id] = v;
        rng.value = toPos(id, v);
        paint(id); run();
      });
    });
    if (care) care.addEventListener('change', run);

    function paint(id) {
      var rng = document.getElementById(id);
      rng.style.setProperty('--p', (rng.value / 10) + '%');
    }

    function series(rentM, ownStart, ownM) {
      var r = [], o = [];
      for (var m = 0; m <= MONTHS; m++) { r.push(rentM * m); o.push(ownStart + ownM * m); }
      return [r, o];
    }

    function chart(r, o) {
      var W = 560, H = 240, L = 46, R = 14, T = 14, B = 30;
      var max = Math.max(r[MONTHS], o[MONTHS], 1);
      var x = function (m) { return L + (W - L - R) * (m / MONTHS); };
      var y = function (v) { return T + (H - T - B) * (1 - v / max); };
      var p = [];
      for (var g = 0; g <= 4; g++) {
        var gy = T + (H - T - B) * (g / 4);
        p.push('<line class="grid" x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '"/>');
        p.push('<text class="tick" x="6" y="' + (gy + 4) + '">' + shortMoney(max * (1 - g / 4)) + '</text>');
      }
      p.push('<line class="axis" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '"/>');
      [0, 12, 24, 36].forEach(function (m) {
        p.push('<text class="tick" x="' + (x(m) - 8) + '" y="' + (H - B + 18) + '">' + m + 'm</text>');
      });
      var path = function (arr) {
        return arr.map(function (v, m) { return (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      };
      p.push('<path class="rentline" d="' + path(r) + '"/>');
      p.push('<path class="ownline" d="' + path(o) + '"/>');
      var cross = -1;
      for (var m = 1; m <= MONTHS; m++) { if (r[m] >= o[m]) { cross = m; break; } }
      if (cross > 0) {
        var cx = x(cross), cy = y(o[cross]);
        p.push('<circle class="xoring" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="9"/>');
        p.push('<circle class="xo" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4.5"/>');
        var tx = Math.min(cx + 10, W - 120);
        p.push('<text class="xolab" x="' + tx.toFixed(1) + '" y="' + Math.max(cy - 14, 22).toFixed(1) + '">pays for itself, month ' + cross + '</text>');
      }
      document.getElementById('ccv').innerHTML = p.join('');
      return cross;
    }

    function run() {
      var rentM = vals['c-plan'] + vals['c-apps'] + (vals['c-rev'] * vals['c-fee'] / 100);
      var carePer = (care && care.checked) ? CARE : 0;
      var ownM = carePer + SERVER;
      var rent3 = rentM * MONTHS, own3 = BUILD + ownM * MONTHS;
      var s = series(rentM, BUILD, ownM);
      var cross = chart(s[0], s[1]);

      document.getElementById('o-rent-3').textContent = money(rent3);
      document.getElementById('o-own-3').textContent = money(own3);
      var top = Math.max(rent3, own3, 1);
      document.getElementById('bar-rent').style.width = (rent3 / top * 100) + '%';
      document.getElementById('bar-own').style.width = (own3 / top * 100) + '%';

      var head = document.getElementById('o-head'),
          sub = document.getElementById('o-sub'),
          pay = document.getElementById('o-pay'),
          diff = rent3 - own3;

      if (rentM <= 0) {
        head.textContent = '\u2014'; head.className = 'big';
        sub.textContent = 'Put in what your platform and apps cost you each month.';
        pay.hidden = true; return;
      }
      if (diff > 0) {
        head.textContent = money(diff) + ' saved';
        head.className = 'big win';
        sub.textContent = 'That is what owning the store keeps in your business over three years, on the numbers you entered.';
        if (cross > 0) { pay.hidden = false; pay.textContent = 'Pays for itself in month ' + cross; }
        else pay.hidden = true;
      } else {
        head.textContent = money(-diff) + ' cheaper to rent';
        head.className = 'big lose';
        sub.textContent = 'At these numbers we would tell you to stay where you are. Owning starts winning once your platform and apps pass about ' + money(BUILD / MONTHS + ownM) + ' a month.';
        pay.hidden = true;
      }
    }

    ids.forEach(paint);
    window.mfCalc = function (c) { cur = c; ids.forEach(function (id) {
      document.getElementById(id + '-hi').textContent = F[id].money ? shortMoney(F[id].max) : F[id].max + '%';
    }); run(); };
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
