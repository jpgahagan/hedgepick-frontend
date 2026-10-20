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
