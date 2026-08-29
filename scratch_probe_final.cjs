const WS = require('ws');
const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';

function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) { const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+86400 }); return `${HEADER}.${payload}.fakesig`; }
function sessionToken(userId) { return JSON.stringify({ access_token: jwt(userId), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+86400, refresh_token: jwt(userId+'_rt'), user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId+'@test.dev', app_metadata: {}, user_metadata: {} } }); }

const APPSC_GROUPS = ['APPSC_GROUP_1','APPSC_GROUP_2','APPSC_GROUP_3','APPSC_GROUP_4'];
const PAPERS = [ { id:'P1', exam_id:'APPSC_GROUP_1', paper_name:'Paper I' }, { id:'P2', exam_id:'APPSC_GROUP_1', paper_name:'Paper II' }, { id:'P3', exam_id:'APPSC_GROUP_2', paper_name:'Paper I' }, { id:'P4', exam_id:'APPSC_GROUP_3', paper_name:'Paper I' }, { id:'P5', exam_id:'APPSC_GROUP_4', paper_name:'Paper I' } ];
const CONFIGS = APPSC_GROUPS.map((g) => ({ exam_id: g, name: g.replace('_', ' '), exam_selection: 'APPSC_GROUPS' }));
const ATTEMPTS = [
  { id:'ATT_1', exam_id:'APPSC_GROUP_1', paper_id:'P1', score:42, accuracy:84, correct_count:21, wrong_count:4, skipped_count:0, submitted_at:'2026-08-10T10:00:00Z', exam_papers:{ paper_name:'Paper I' } },
  { id:'ATT_2', exam_id:'APPSC_GROUP_1', paper_id:'P2', score:38, accuracy:76, correct_count:19, wrong_count:6, skipped_count:0, submitted_at:'2026-08-09T10:00:00Z', exam_papers:{ paper_name:'Paper II' } },
  { id:'ATT_3', exam_id:'APPSC_GROUP_2', paper_id:'P3', score:35, accuracy:70, correct_count:17, wrong_count:7, skipped_count:1, submitted_at:'2026-08-08T10:00:00Z', exam_papers:{ paper_name:'Paper I' } },
  { id:'ATT_4', exam_id:'APPSC_GROUP_1', paper_id:'P1', score:40, accuracy:80, correct_count:20, wrong_count:5, skipped_count:0, submitted_at:'2026-08-07T10:00:00Z', exam_papers:{ paper_name:'Paper I' } },
  { id:'ATT_5', exam_id:'APPSC_GROUP_3', paper_id:'P4', score:30, accuracy:60, correct_count:15, wrong_count:10, skipped_count:0, submitted_at:'2026-08-06T10:00:00Z', exam_papers:{ paper_name:'Paper I' } },
  { id:'ATT_6', exam_id:'APPSC_GROUP_4', paper_id:'P5', score:33, accuracy:66, correct_count:16, wrong_count:8, skipped_count:1, submitted_at:'2026-08-05T10:00:00Z', exam_papers:{ paper_name:'Paper I' } },
];

class CDP {
  constructor(wsUrl) { this.ws = new WS(wsUrl); this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  async open() { await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); }); this.ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } else if (m.method && this.handlers.has(m.method)) { this.handlers.get(m.method)(m.params); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { this.handlers.set(method, fn); }
  close() { try { this.ws.close(); } catch {} }
}

const CORS = [['Access-Control-Allow-Origin','*'],['Access-Control-Allow-Headers','authorization, content-type, apikey, x-client-info, x-supabase-api-version, prefer'],['Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, OPTIONS'],['Access-Control-Max-Age','86400']];
function hdrs(l) { return l.map(([n, v]) => ({ name: n, value: v })); }
function respond(cdp, requestId, body, status = 200) { cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: hdrs([...CORS, ['Content-Type','application/json']]), body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(() => {}); }

(async () => {
  const t = await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const logs = [];
  let held = [];
  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url;
    const method = (p.request.method || 'GET').toUpperCase();
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    let kind = null;
    if (url.includes('/auth/v1/user')) kind = 'user';
    else if (url.includes('/rest/v1/users')) kind = 'users';
    else if (url.includes('/rest/v1/attempts')) kind = url.includes('id=eq') ? 'attempt_single' : 'attempts';
    else if (url.includes('/rest/v1/exam_configs')) kind = 'configs';
    else if (url.includes('/rest/v1/exam_papers')) kind = 'papers';
    else return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if (kind === 'user') respond(cdp, p.requestId, { id: 'u_appsc', aud: 'authenticated', role: 'authenticated', email: 'u_appsc@test.dev' });
    else if (kind === 'users') respond(cdp, p.requestId, { id: 'u_appsc', email: 'u_appsc@test.dev', full_name: 'Test APPSC User', role: 'user', exam_selection: 'APPSC_GROUPS', sub_admin_id: null, educator_id: null, is_active: true, email_verified: true, coupon_code_used: false, created_at: '2026-01-01T00:00:00Z' });
    else held.push({ requestId: p.requestId, kind });
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
    sessionStorage.clear();
  `});
  await cdp.send('Page.navigate', { url: `${APP}/history?v=p3` });
  await new Promise((r) => setTimeout(r, 4100));

  const sk = await cdp.send('Runtime.evaluate', { expression: `(() => {
    const region = document.querySelector('[role="status"][aria-label="Loading history"]');
    if (!region) return { found: false };
    const sel = region.querySelector('.selection-surface');
    const overflowRows = sel ? [...sel.querySelectorAll('div.overflow-x-auto')] : [];
    const pillDivs = sel ? [...sel.querySelectorAll('.shrink-0')] : [];
    const pills = pillDivs.map((p) => { const r = p.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), r: getComputedStyle(p).borderRadius, border: getComputedStyle(p).borderColor }; });
    const pillBars = pillDivs.map((p) => { const b = p.querySelector('div'); return b ? { w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), r: getComputedStyle(b).borderRadius, bg: getComputedStyle(b).backgroundColor } : null; });
    const selRect = sel ? (() => { const r = sel.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), r: getComputedStyle(sel).borderRadius, bg: getComputedStyle(sel).backgroundColor, border: getComputedStyle(sel).borderColor }; })() : null;
    const stack = region.querySelector('.selection-surface > div');
    const divider = stack ? stack.querySelector('.border-subtle, .bg-border-subtle') : null;
    const cards = [...region.querySelectorAll('div[aria-hidden="true"]')].filter((e) => e.parentElement && e.parentElement.className === 'h-full');
    const grid = cards[0] ? cards[0].parentElement.parentElement : null;
    const gcs = grid ? getComputedStyle(grid) : null;
    const cardSizes = cards.slice(0, 2).map((c) => { const r = c.getBoundingClientRect(); return { h: Math.round(r.height), pad: getComputedStyle(c).padding, border: getComputedStyle(c).borderColor }; });
    return { found: true, sel: selRect, overflowRows: overflowRows.length, rows: overflowRows.map((o) => Math.round(o.getBoundingClientRect().height)), pillCount: pills.length, pills, pillBars, divider: divider ? { cls: divider.className, w: Math.round(divider.getBoundingClientRect().width) } : null, gridCols: gcs ? gcs.gridTemplateColumns : null, gridGap: gcs ? gcs.columnGap : null, cardCount: cards.length, cardSizes };
  })()`, returnByValue: true });
  console.log('SKELETON', JSON.stringify(sk.result.value, null, 1));

  // release
  for (const h of held) {
    if (h.kind === 'attempts') respond(cdp, h.requestId, ATTEMPTS);
    else if (h.kind === 'configs') respond(cdp, h.requestId, CONFIGS);
    else if (h.kind === 'papers') respond(cdp, h.requestId, PAPERS);
  }
  await new Promise((r) => setTimeout(r, 3000));
  const fin = await cdp.send('Runtime.evaluate', { expression: `(() => {
    const cards = [...document.querySelectorAll('[role="button"][aria-label*="View full review"]')];
    const alerts = [...document.querySelectorAll('[role="alert"]')].map((e) => e.textContent.trim().slice(0, 120));
    const status = [...document.querySelectorAll('[role="status"]')].map((e) => e.getAttribute('aria-label') || '');
    const sel = document.querySelector('[aria-live="polite"][aria-label*="Showing"]');
    const body = document.body.innerText.slice(0, 700);
    return { cardCount: cards.length, cards: cards.slice(0,2).map((c) => c.getAttribute('aria-label')), alerts, status, sel: sel ? sel.getAttribute('aria-label') : null, body };
  })()`, returnByValue: true });
  console.log('FINAL', JSON.stringify(fin.result.value, null, 1));
  cdp.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
