// Netlify Edge Function: wraps backend-rendered pages (debates, track record) in the
// site's shared header and footer so navigation is identical everywhere.
// It steps aside automatically once the backend serves the new design itself.
const HEADER = "<header class=\"hdr\" id=\"hdr\">\n  <div class=\"hdr-in\">\n    <a href=\"/\" class=\"brand\" aria-label=\"HedgePick home\"><svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\"><rect width=\"28\" height=\"28\" rx=\"6\" fill=\"#0d0f13\"/><rect x=\".5\" y=\".5\" width=\"27\" height=\"27\" rx=\"5.5\" stroke=\"rgba(91,147,245,.35)\"/><path class=\"ln\" d=\"M6 20L11 13L15 16.5L19 10L22 13\" stroke=\"#5b93f5\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"22\" cy=\"13\" r=\"2\" fill=\"#e3a83a\"/></svg><span>HEDGE<em>PICK</em></span></a>\n    <nav class=\"nav\" aria-label=\"Primary\">\n      <a href=\"/#how\">How it works</a>\n      <a href=\"/analysis\" class=\"on\">Debates</a>\n      <a href=\"/sample\">Sample dashboard</a>\n      <a href=\"/#pricing\">Pricing</a>\n      <a href=\"/system\">Methodology</a>\n    </nav>\n    <div class=\"hdr-act\">\n      <button type=\"button\" class=\"btn btn-ghost\" data-out onclick=\"showSignIn()\">Sign in</button>\n      <a href=\"/start\" class=\"btn btn-pri\" data-out>Test a stock free</a>\n      <a href=\"/dashboard\" class=\"btn btn-pri\" data-in style=\"display:none\">Open dashboard</a>\n      <button class=\"ham\" id=\"ham\" onclick=\"toggleMenu()\" aria-label=\"Open menu\" aria-expanded=\"false\"><span></span><span></span><span></span></button>\n    </div>\n  </div>\n</header>\n<nav class=\"mmenu\" id=\"mmenu\" aria-label=\"Mobile\">\n  <a href=\"/#how\" onclick=\"closeMenu()\">How it works</a>\n  <a href=\"/analysis\">Debates</a>\n  <a href=\"/sample\">Sample dashboard</a>\n  <a href=\"/#pricing\" onclick=\"closeMenu()\">Pricing</a>\n  <a href=\"/system\">Methodology</a>\n  <a href=\"/partners\">Partners</a>\n  <a href=\"#\" data-out onclick=\"closeMenu();showSignIn();return false;\">Sign in</a>\n  <a href=\"/dashboard\" data-in style=\"display:none\">Dashboard</a>\n  <a href=\"/start\" class=\"btn btn-pri\" data-out>Test a stock free</a>\n  <a href=\"/dashboard\" class=\"btn btn-pri\" data-in style=\"display:none\">Open dashboard</a>\n</nav>\n";
const FOOTER = "<footer class=\"ft\">\n  <div class=\"wrap\">\n    <div class=\"ft-in\">\n      <div>\n        <a href=\"/\" class=\"brand\" aria-label=\"HedgePick home\"><svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\"><rect width=\"28\" height=\"28\" rx=\"6\" fill=\"#0d0f13\"/><rect x=\".5\" y=\".5\" width=\"27\" height=\"27\" rx=\"5.5\" stroke=\"rgba(91,147,245,.35)\"/><path class=\"ln\" d=\"M6 20L11 13L15 16.5L19 10L22 13\" stroke=\"#5b93f5\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"22\" cy=\"13\" r=\"2\" fill=\"#e3a83a\"/></svg><span>HEDGE<em>PICK</em></span></a>\n        <p class=\"ft-tag\">Adversarial AI research for US stocks. Hear the case against it before you buy.</p>\n      </div>\n      <div class=\"ft-cols\">\n        <div><h4>Product</h4><a href=\"/#how\">How it works</a><a href=\"/analysis\">Daily debates</a><a href=\"/sample\">Sample dashboard</a><a href=\"/start\">Test a stock free</a><a href=\"/#pricing\">Pricing</a><a href=\"/dashboard\">Dashboard</a></div>\n        <div><h4>Company</h4><a href=\"/system\">Methodology</a><a href=\"/partners\">Partners</a><a href=\"mailto:joseph@hedgepick.com\">Contact</a></div>\n        <div><h4>Legal</h4><a href=\"/terms\">Terms</a><a href=\"/privacy\">Privacy</a><a href=\"/terms#disclaimer\">Disclaimer</a></div>\n      </div>\n      <div class=\"ft-d\"><p>Not financial advice. For educational and informational purposes only. AI-generated research can be wrong. Past performance does not guarantee future results.</p><span>\u00a9 2026 HedgePick</span></div>\n    </div>\n  </div>\n</footer>\n";
const LINKS = "<link rel=\"icon\" type=\"image/x-icon\" href=\"/favicon.ico\"><link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\"><link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/favicon-32.png\"><link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/favicon-180.png\"><meta name=\"theme-color\" content=\"#07080a\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"/assets/hp.css?v=4\"><script src=\"/assets/hp.js?v=4\"></script>";
const COMPAT = ".lg{font-family:'Space Grotesk',var(--sans);line-height:1.65;color:#ECEAE4}.lg main{max-width:860px;margin:0 auto;padding:44px 24px 88px}.lg a{color:var(--blue-2,#7aa8f7)}.lg .chip{font-family:var(--mono)}.lg-cta{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;margin-top:36px;padding:22px 24px;border:1px solid var(--blue-bd);border-radius:var(--r3);background:radial-gradient(ellipse at top left,rgba(91,147,245,.14),rgba(91,147,245,0) 60%),var(--bg-1)}.lg-cta b{display:block;font-family:var(--display);font-size:1.25rem;letter-spacing:-.03em;color:var(--t1);font-weight:600}.lg-cta span{display:block;font-size:.9rem;color:var(--t2);margin-top:6px}.lg-cta form{display:flex;gap:8px}.lg-cta input{width:130px;background:var(--bg);border:1px solid var(--line-2);border-radius:var(--r2);padding:10px 12px;font-family:var(--mono);font-weight:600;text-transform:uppercase;color:var(--t1);font-size:.95rem}.lg-cta input:focus{outline:none;border-color:var(--blue)}.lg-cta .btn{border-radius:var(--r2);margin:0}@media(max-width:560px){.lg-cta form{width:100%}.lg-cta input{flex:1;width:auto}}.lg .eye,.lg th{font-family:var(--mono)}.lg .btn{white-space:normal;max-width:100%;height:auto;text-align:center}";

function block(css, ob) { let d = 1, j = ob + 1; while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } return j; }
export function scope(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const ob = css.indexOf('{', i); if (ob < 0) break;
    const sel = css.slice(i, ob).trim();
    if (/^@(media|supports)/.test(sel)) { const j = block(css, ob); out += sel + '{' + scope(css.slice(ob + 1, j - 1)) + '}'; i = j; continue; }
    if (sel.startsWith('@')) { const j = block(css, ob); out += css.slice(i, j); i = j; continue; }
    const cb = css.indexOf('}', ob); const body = css.slice(ob, cb + 1);
    const sels = sel.split(',').map(s => s.trim()).filter(Boolean)
      .filter(s => !/^(\*|html|body|footer|\.nav|\.logo)/.test(s))
      .map(s => '.lg ' + s);
    if (sels.length) out += sels.join(',') + body;
    i = cb + 1;
  }
  return out;
}
export function transform(html) {
  if (html.includes('/assets/hp.css') || !html.includes('<main')) return null;
  let h = html.replace(/<style>([\s\S]*?)<\/style>/, (m, c) => '<style>' + scope(c) + COMPAT + '</style>');
  h = h.replace(/<link rel="icon"[^>]*>/g, '');
  h = h.replace('</head>', LINKS + '</head>');
  h = h.replace(/<nav class="nav">[\s\S]*?<\/nav>/, HEADER);
  if (!h.includes('class="hdr"')) h = h.replace(/<body([^>]*)>/, '<body$1>' + HEADER);
  h = h.replace('<main>', '<div class="lg"><main id="main">').replace('</main>', '</main></div>');
  h = h.replace(/<footer>[\s\S]*?<\/footer>/, '');
  const tk = (h.match(/<link rel="canonical" href="[^"]*\/analysis\/([A-Z.\-]+)\//) || [])[1] || '';
  const CTA = '<div class="lg-cta"><div><b>Want this on a stock you’re considering?</b><span>Same twelve-agent debate on any ticker. Your first three are free, no card, no password.</span></div>'
    + '<form action="/start"><label class="sr" for="lgT">Ticker</label><input id="lgT" name="t" placeholder="Ticker" maxlength="10" autocomplete="off"' + (tk ? '' : '') + '><button class="btn btn-pri" type="submit">Debate it free</button></form></div>';
  h = h.replace('<div class="lock">', CTA + '<div class="lock">');
  h = h.replace('</body>', FOOTER + '</body>');
  h = h.replace(/nine-agent/g, 'twelve-agent').replace(/\bnine AI/g, 'twelve AI').replace(/\bNine AI/g, 'Twelve AI');
  return h;
}
export default async (request, context) => {
  const res = await context.next();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return res;
  const html = await res.text();
  const out = transform(html);
  const headers = new Headers(res.headers);
  headers.delete('content-length'); headers.delete('content-encoding');
  return new Response(out ?? html, { status: res.status, headers });
};
export const config = { path: ['/analysis/*', '/track-record'] };
