/* HedgePick Trader dashboard panel. Loaded by dashboard.html. */
(function () {
  const TRADER_TIERS = ['trader', 'lifetime'];
  const TRADER_LINK = 'https://buy.stripe.com/dRm6oJ9gF31T1A7ef14AU05';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (x, d = 2) => (x == null || isNaN(x) ? '—' : (x < 0 ? '-$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const pct = (x) => (x == null || isNaN(x) ? '—' : (x > 0 ? '+' : '') + x.toFixed(1) + '%');
  const cls = (x) => (x == null ? '' : x > 0 ? 'tr-pos' : x < 0 ? 'tr-neg' : '');

  function api(path, opts = {}) {
    const token = localStorage.getItem('hp_session') || '';
    return fetch(BACKEND + path, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'Authorization': 'Bearer ' + token }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(async (r) => {
      let j = {};
      try { j = await r.json(); } catch (e) {}
      if (!r.ok) throw new Error(j.error || ('Request failed (' + r.status + ')'));
      return j;
    });
  }

  function toast(msg, bad) {
    const t = $('trToast');
    t.textContent = msg;
    t.className = 'tr-toast show' + (bad ? ' bad' : '');
    clearTimeout(t._h);
    t._h = setTimeout(() => (t.className = 'tr-toast'), 4200);
  }

  function teaser() {
    $('traderSection').innerHTML = `
      <div class="tr-teaser">
        <div class="tr-eyebrow">Trader &middot; $49/mo</div>
        <div class="tr-h">Turn the analysis into a plan you can act on.</div>
        <ul class="tr-list">
          <li><b>Positions</b> with live profit and loss, and how each one is doing against the S&amp;P 500 since you added it</li>
          <li><b>Price alerts</b> by email, including your stop and target levels</li>
          <li><b>Weekly thesis re-check</b>: every Monday the AI panel re-tests your reason for owning each position</li>
          <li><b>Order ticket</b>: send market or limit orders with a stop-loss and take-profit to your own Alpaca paper trading account</li>
          <li><b>10 analyses a day</b>, and you go first in the queue</li>
        </ul>
        <a class="tr-btn" href="${TRADER_LINK}?prefilled_email=${encodeURIComponent((typeof PLAN !== 'undefined' && PLAN.email) || '')}">Upgrade to Trader &rarr;</a>
        <div class="tr-fine">Cancel anytime. Orders go only to your own brokerage account and only when you confirm them.</div>
      </div>`;
  }

  function shell() {
    $('traderSection').innerHTML = `
      <div class="section-label" style="margin-top:0" id="trader">Trader</div>
      <div class="tr-sum" id="trSum"></div>
      <div class="tr-card">
        <div class="tr-card-h"><span>Positions</span><button class="tr-link" id="trAddToggle">+ Add position</button></div>
        <form class="tr-form" id="trAddForm" style="display:none" autocomplete="off">
          <div class="tr-grid">
            <label>Ticker<input name="ticker" required maxlength="10" placeholder="NVDA"></label>
            <label>Shares<input name="shares" required type="number" step="any" min="0" inputmode="decimal"></label>
            <label>Avg cost<input name="avg_cost" required type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
            <label>Stop <small>(optional)</small><input name="stop" type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
            <label>Target <small>(optional)</small><input name="target" type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
          </div>
          <label class="tr-full">Why you own it <small>(the AI re-tests this every Monday)</small>
            <textarea name="thesis" rows="2" maxlength="600" placeholder="e.g. Data-center demand keeps accelerating; I'd sell if margins fall two quarters in a row."></textarea></label>
          <button class="tr-btn" type="submit">Save position</button>
        </form>
        <div id="trPositions"><div class="tr-empty">Loading&hellip;</div></div>
      </div>
      <div class="tr-card">
        <div class="tr-card-h"><span>Price alerts</span></div>
        <form class="tr-form tr-inline" id="trAlertForm" autocomplete="off">
          <input name="ticker" required maxlength="10" placeholder="Ticker">
          <select name="direction"><option value="above">rises to</option><option value="below">falls to</option></select>
          <input name="level" required type="number" step="any" min="0" inputmode="decimal" placeholder="$ price">
          <button class="tr-btn sm" type="submit">Add alert</button>
        </form>
        <div id="trAlerts"></div>
        <div class="tr-fine">Checked every 5 minutes while the US market is open. Alerts are sent by email.</div>
      </div>
      <div class="tr-card">
        <div class="tr-card-h"><span>Brokerage &middot; Alpaca paper trading</span><span class="tr-tag">Paper</span></div>
        <div id="trBroker"><div class="tr-empty">Loading&hellip;</div></div>
      </div>
      <div class="tr-modal" id="trTicket" style="display:none">
        <div class="tr-modal-box">
          <div class="tr-card-h"><span id="trTicketTitle">Order ticket</span><button class="tr-x" type="button" onclick="document.getElementById('trTicket').style.display='none'">&#10005;</button></div>
          <form class="tr-form" id="trOrderForm" autocomplete="off">
            <div class="tr-grid">
              <label>Ticker<input name="ticker" required maxlength="10"></label>
              <label>Side<select name="side"><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
              <label>Shares<input name="qty" required type="number" step="any" min="0" inputmode="decimal"></label>
              <label>Type<select name="type"><option value="market">Market</option><option value="limit">Limit</option></select></label>
              <label>Limit price<input name="limit_price" type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
              <label>Stop-loss<input name="stop_loss" type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
              <label>Take-profit<input name="take_profit" type="number" step="any" min="0" inputmode="decimal" placeholder="$"></label>
            </div>
            <div class="tr-preview" id="trOrderPreview"></div>
            <label class="tr-check"><input type="checkbox" name="confirm"> I've reviewed this order and want to send it to my Alpaca paper account.</label>
            <button class="tr-btn" type="submit">Send order</button>
          </form>
        </div>
      </div>
      <div class="tr-toast" id="trToast"></div>`;

    $('trAddToggle').onclick = () => { const f = $('trAddForm'); f.style.display = f.style.display === 'none' ? 'block' : 'none'; };
    $('trAddForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      f.ticker = (f.ticker || '').trim().toUpperCase();
      try {
        await api('/api/trader/positions', { method: 'POST', body: f });
        e.target.reset(); e.target.style.display = 'none';
        toast('Position saved.'); loadPositions(); loadAlerts();
      } catch (err) { toast(err.message, true); }
    };
    $('trAlertForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      f.ticker = (f.ticker || '').trim().toUpperCase();
      try { await api('/api/trader/alerts', { method: 'POST', body: f }); e.target.reset(); toast('Alert added.'); loadAlerts(); }
      catch (err) { toast(err.message, true); }
    };
    $('trOrderForm').oninput = previewOrder;
    $('trOrderForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const f = Object.fromEntries(fd.entries());
      f.confirm = fd.get('confirm') === 'on';
      f.ticker = (f.ticker || '').trim().toUpperCase();
      if (!f.confirm) { toast('Tick the box to confirm the order.', true); return; }
      try {
        const r = await api('/api/trader/order', { method: 'POST', body: f });
        $('trTicket').style.display = 'none';
        toast('Order sent to Alpaca: ' + r.status + '.'); loadBroker();
      } catch (err) { toast(err.message, true); }
    };
  }

  let lastPrice = {};
  function previewOrder() {
    const f = Object.fromEntries(new FormData($('trOrderForm')).entries());
    const t = (f.ticker || '').toUpperCase();
    const px = f.type === 'limit' && f.limit_price ? parseFloat(f.limit_price) : lastPrice[t];
    const q = parseFloat(f.qty);
    let s = '';
    if (q && px) s += `${f.side === 'buy' ? 'Buy' : 'Sell'} ${q} ${esc(t)} &asymp; <b>${money(q * px)}</b>${f.type === 'market' ? ' at market' : ' at a limit of ' + money(px)}.`;
    if (f.stop_loss && px) s += ` Stop-loss ${money(+f.stop_loss)} (${pct((f.stop_loss / px - 1) * 100)}), risking about ${money(Math.abs(px - f.stop_loss) * (q || 0))}.`;
    if (f.take_profit && px) s += ` Take-profit ${money(+f.take_profit)} (${pct((f.take_profit / px - 1) * 100)}).`;
    if (f.stop_loss && f.take_profit && px) {
      const rr = Math.abs(f.take_profit - px) / Math.abs(px - f.stop_loss);
      if (isFinite(rr)) s += ` Reward-to-risk <b>${rr.toFixed(1)} : 1</b>.`;
    }
    $('trOrderPreview').innerHTML = s || 'Fill in the order to see its size, risk and reward.';
  }

  window.trOpenTicket = function (ticker, side, qty, stop, target) {
    const f = $('trOrderForm');
    f.reset();
    f.ticker.value = ticker || ''; f.side.value = side || 'buy'; f.qty.value = qty || '';
    if (stop) f.stop_loss.value = stop; if (target) f.take_profit.value = target;
    $('trTicketTitle').textContent = 'Order ticket' + (ticker ? ' · ' + ticker : '');
    $('trTicket').style.display = 'flex';
    previewOrder();
    if (ticker && !lastPrice[ticker]) api('/api/trader/quote?ticker=' + encodeURIComponent(ticker)).then((q) => { lastPrice[ticker] = q.price; previewOrder(); }).catch(() => {});
  };

  async function loadPositions() {
    try {
      const d = await api('/api/trader/positions');
      d.positions.forEach((p) => { if (p.price) lastPrice[p.ticker] = p.price; });
      $('trSum').innerHTML = d.positions.length ? `
        <div><span>Value</span><b>${money(d.total_value, 0)}</b></div>
        <div><span>Profit / loss</span><b class="${cls(d.total_pnl)}">${money(d.total_pnl, 0)}</b></div>
        <div><span>Positions</span><b>${d.positions.length}</b></div>` : '';
      if (!d.positions.length) { $('trPositions').innerHTML = '<div class="tr-empty">No positions yet. Add one to track it against the S&amp;P 500 and get a weekly thesis re-check.</div>'; return; }
      $('trPositions').innerHTML = d.positions.map((p) => `
        <div class="tr-pos-row">
          <div class="tr-pos-main">
            <div class="tr-tk">${esc(p.ticker)} ${p.verdict ? `<span class="tr-v ${esc(p.verdict)}" title="Latest AI verdict ${esc(p.verdict_date || '')}">${esc(p.verdict)}</span>` : ''}</div>
            <div class="tr-meta">${p.shares} sh @ ${money(p.avg_cost)} &middot; now ${money(p.price)}</div>
            ${p.thesis ? `<div class="tr-thesis">&ldquo;${esc(p.thesis)}&rdquo;</div>` : ''}
          </div>
          <div class="tr-pos-nums">
            <div class="${cls(p.pnl)}">${money(p.pnl, 0)} <small>${pct(p.pnl_pct)}</small></div>
            <div class="tr-meta">vs S&amp;P since added: <span class="${cls(p.vs_spy)}">${pct(p.vs_spy)}</span></div>
            <div class="tr-meta">${p.stop ? 'Stop ' + money(p.stop) : ''}${p.stop && p.target ? ' &middot; ' : ''}${p.target ? 'Target ' + money(p.target) : ''}</div>
          </div>
          <div class="tr-acts">
            <button class="tr-btn sm" onclick="trOpenTicket('${esc(p.ticker)}','sell',${p.shares})">Trade</button>
            <button class="tr-link" onclick="trRecheck(${p.id})">Re-check thesis</button>
            <button class="tr-link dim" onclick="trRemove(${p.id})">Remove</button>
          </div>
        </div>`).join('');
    } catch (err) { $('trPositions').innerHTML = `<div class="tr-empty">${esc(err.message)}</div>`; }
  }

  async function loadAlerts() {
    try {
      const d = await api('/api/trader/alerts');
      $('trAlerts').innerHTML = d.alerts.length ? d.alerts.map((a) => `
        <div class="tr-al ${a.active ? '' : 'done'}">
          <span><b>${esc(a.ticker)}</b> ${a.direction === 'above' ? 'rises to' : 'falls to'} ${money(a.level)}${a.note ? ` <small>${esc(a.note)}</small>` : ''}</span>
          <span class="tr-meta">${a.active ? 'now ' + money(a.price) : 'triggered at ' + money(a.triggered_price)}${a.active && !a.from_position ? ` <button class="tr-link dim" onclick="trDelAlert(${a.id})">&#10005;</button>` : ''}</span>
        </div>`).join('') : '<div class="tr-empty">No alerts yet.</div>';
    } catch (err) { $('trAlerts').innerHTML = `<div class="tr-empty">${esc(err.message)}</div>`; }
  }

  async function loadBroker() {
    try {
      const d = await api('/api/trader/broker');
      if (!d.connected || d.error) {
        $('trBroker').innerHTML = `
          ${d.error ? `<div class="tr-empty tr-neg">${esc(d.error)}</div>` : ''}
          <p class="tr-p">Connect a free <a href="https://app.alpaca.markets/signup" target="_blank" rel="noopener">Alpaca</a> paper trading account to send orders straight from HedgePick. In Alpaca, switch to <b>Paper Trading</b>, open <b>API Keys</b> on the right, click <b>Generate New Keys</b>, then paste both keys here. They are encrypted before they're saved.</p>
          <form class="tr-form tr-inline" id="trBrokerForm" autocomplete="off">
            <input name="key_id" required placeholder="API key ID (starts with PK)">
            <input name="secret" required type="password" placeholder="Secret key">
            <button class="tr-btn sm" type="submit">Connect</button>
          </form>`;
        $('trBrokerForm').onsubmit = async (e) => {
          e.preventDefault();
          try { await api('/api/trader/broker', { method: 'POST', body: Object.fromEntries(new FormData(e.target).entries()) }); toast('Alpaca paper account connected.'); loadBroker(); }
          catch (err) { toast(err.message, true); }
        };
        return;
      }
      const a = d.account || {};
      $('trBroker').innerHTML = `
        <div class="tr-sum in">
          <div><span>Equity</span><b>${money(+a.equity, 0)}</b></div>
          <div><span>Cash</span><b>${money(+a.cash, 0)}</b></div>
          <div><span>Buying power</span><b>${money(+a.buying_power, 0)}</b></div>
        </div>
        <div class="tr-acts left"><button class="tr-btn sm" onclick="trOpenTicket('','buy')">New order</button>
          <button class="tr-link dim" onclick="trDisconnect()">Disconnect</button></div>
        ${(d.positions || []).length ? '<div class="tr-sub">Alpaca positions</div>' + d.positions.map((p) => `
          <div class="tr-al"><span><b>${esc(p.symbol)}</b> ${esc(p.qty)} sh @ ${money(+p.avg_entry_price)}</span>
          <span class="${cls(+p.unrealized_pl)}">${money(+p.unrealized_pl, 0)} <small>${pct(+p.unrealized_plpc * 100)}</small></span></div>`).join('') : ''}
        ${(d.orders || []).length ? '<div class="tr-sub">Recent orders</div>' + d.orders.slice(0, 10).map((o) => `
          <div class="tr-al"><span><b>${esc(o.symbol)}</b> ${esc(o.side)} ${esc(o.qty)} &middot; ${esc(o.type)}${o.order_class && o.order_class !== 'simple' ? ' &middot; ' + esc(o.order_class) : ''}</span>
          <span class="tr-meta">${esc(o.status)}${o.filled_avg_price ? ' @ ' + money(+o.filled_avg_price) : ''}${['new', 'accepted', 'pending_new', 'held'].includes(o.status) ? ` <button class="tr-link dim" onclick="trCancel('${esc(o.id)}')">Cancel</button>` : ''}</span></div>`).join('') : ''}`;
    } catch (err) { $('trBroker').innerHTML = `<div class="tr-empty">${esc(err.message)}</div>`; }
  }

  window.trRecheck = async (id) => { try { const r = await api(`/api/trader/positions/${id}/recheck`, { method: 'POST' }); toast(r.message); } catch (e) { toast(e.message, true); } };
  window.trRemove = async (id) => { if (!confirm('Remove this position and its alerts?')) return; try { await api(`/api/trader/positions/${id}`, { method: 'DELETE' }); loadPositions(); loadAlerts(); } catch (e) { toast(e.message, true); } };
  window.trDelAlert = async (id) => { try { await api(`/api/trader/alerts/${id}`, { method: 'DELETE' }); loadAlerts(); } catch (e) { toast(e.message, true); } };
  window.trCancel = async (id) => { try { await api(`/api/trader/order/${id}`, { method: 'DELETE' }); toast('Cancel requested.'); setTimeout(loadBroker, 800); } catch (e) { toast(e.message, true); } };
  window.trDisconnect = async () => { if (!confirm('Disconnect your Alpaca account from HedgePick?')) return; await api('/api/trader/broker', { method: 'DELETE' }); loadBroker(); };

  window.initTrader = function (tier) {
    if (!$('traderSection')) return;
    if (!TRADER_TIERS.includes(tier)) { teaser(); return; }
    shell(); loadPositions(); loadAlerts(); loadBroker();
    clearInterval(window._trTimer);
    window._trTimer = setInterval(() => { if (!document.hidden) loadPositions(); }, 60000);
  };
  // dashboard may have loaded the user before this script arrived
  if (typeof PLAN !== 'undefined' && PLAN._loaded) window.initTrader(PLAN.tier);
})();
