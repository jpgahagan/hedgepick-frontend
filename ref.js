/* HedgePick partner attribution.
   ?ref=<code> on any page -> verified against registered partners -> stored 90 days.
   Every Stripe checkout link then carries client_reference_id=ref_<code>. */
(function () {
  var API = 'https://web-production-45241.up.railway.app';
  var KEY = 'hp_ref';
  var DAYS = 90;

  function current() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.c && (Date.now() - o.t) < DAYS * 864e5) return o.c;
    } catch (e) {}
    return null;
  }

  function tag(el) {
    var c = current();
    if (!c) return;
    var list = el ? [el] : document.querySelectorAll('a[href^="https://buy.stripe.com/"]');
    Array.prototype.forEach.call(list, function (a) {
      try {
        var u = new URL(a.href);
        u.searchParams.set('client_reference_id', 'ref_' + c);
        a.href = u.toString();
      } catch (e) {}
    });
  }

  var p = null;
  try { p = new URLSearchParams(location.search).get('ref'); } catch (e) {}
  if (p) {
    p = p.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    var seen = 'hp_refv_' + p;
    if (p.length >= 3 && !sessionStorage.getItem(seen)) {
      sessionStorage.setItem(seen, '1');
      fetch(API + '/api/ref-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: p, path: location.pathname })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.valid) {
          localStorage.setItem(KEY, JSON.stringify({ c: p, t: Date.now() }));
          tag();
        }
      }).catch(function () {});
    }
  }

  // Tag at click time so links rewritten later (billing toggle, prefilled email) still carry the code.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (a) tag(a);
  }, true);

  if (document.readyState !== 'loading') tag();
  else document.addEventListener('DOMContentLoaded', function () { tag(); });

  window.hpRef = current;
})();

/* Product Hunt launch offer: visitors from producthunt.com (or ?ref=producthunt) see a slim banner
   and get PRODUCTHUNT pre-applied on the Pro/Trader monthly checkout links. Ends Nov 10, 2026. */
(function () {
  var END = Date.UTC(2026, 10, 11, 4, 59); // Nov 10, 2026 23:59 ET
  if (Date.now() > END) return;
  var KEY = 'hp_ph';
  var MONTHLY = ['https://buy.stripe.com/9B6cN70K9gSJgv14Er4AU06', 'https://buy.stripe.com/dRmcN79gF7i9emTfj54AU08'];
  var fromPH = false;
  try {
    var q = new URLSearchParams(location.search);
    fromPH = /producthunt/i.test(q.get('ref') || '') || /producthunt/i.test(q.get('utm_source') || '') || /producthunt\.com/i.test(document.referrer || '');
    if (fromPH) localStorage.setItem(KEY, String(Date.now()));
    else fromPH = !!localStorage.getItem(KEY);
  } catch (e) {}
  if (!fromPH) return;

  function tagLinks(el) {
    var list = el ? [el] : document.querySelectorAll('a[href^="https://buy.stripe.com/"]');
    Array.prototype.forEach.call(list, function (a) {
      try {
        var u = new URL(a.href);
        if (MONTHLY.indexOf(u.origin + u.pathname) === -1) return;
        u.searchParams.set('prefilled_promo_code', 'PRODUCTHUNT');
        a.href = u.toString();
      } catch (e) {}
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (a) tagLinks(a);
  }, true);

  function banner() {
    tagLinks();
    try { if (sessionStorage.getItem('hp_ph_x')) return; } catch (e) {}
    var b = document.createElement('div');
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:relative;z-index:60;background:#111318;border-bottom:1px solid #2a2d35;color:#e8e6e1;font:500 13px/1.4 Inter,system-ui,sans-serif;padding:9px 44px 9px 16px;text-align:center';
    b.innerHTML = 'Product Hunt offer: <strong style="color:#e3b04b">40% off your first 3 months</strong> of Pro or Trader (monthly) with code <strong style="letter-spacing:.04em;color:#fff">PRODUCTHUNT</strong>, applied automatically at checkout. Ends Nov 10. <a href="/#pricing" style="color:#7aa2ff;margin-left:6px">See plans</a>';
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Dismiss offer'); x.textContent = '\u00d7';
    x.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:#9a9ca3;font-size:18px;cursor:pointer;padding:4px 8px';
    x.onclick = function () { b.remove(); try { sessionStorage.setItem('hp_ph_x', '1'); } catch (e) {} };
    b.appendChild(x);
    document.body.insertBefore(b, document.body.firstChild);
  }
  if (document.readyState !== 'loading') banner();
  else document.addEventListener('DOMContentLoaded', banner);
})();
