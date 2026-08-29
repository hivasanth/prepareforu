const WS = require('ws');
const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';
function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) { const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+86400 }); return `${HEADER}.${payload}.fakesig`; }
function sessionToken(userId) { return JSON.stringify({ access_token: jwt(userId), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+86400, refresh_token: jwt(userId+'_rt'), user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId+'@test.dev', app_metadata: {}, user_metadata: {} } }); }
const CONFIGS = [{ exam_id: 'BANK_EXAMS', name: 'Bank Exams', exam_selection: 'BANK_EXAMS' }];
const PAPERS = [{ id: 'BP1', exam_id: 'BANK_EXAMS', paper_name: 'Quantitative Aptitude' }];
const ATTEMPTS = [
  { id: 'B_ATT_1', exam_id: 'BANK_EXAMS', paper_id: 'BP1', score: 50, accuracy: 90, correct_count: 25, wrong_count: 2, skipped_count: 1, submitted_at: '2026-08-04T10:00:00Z', exam_papers: { paper_name: 'Quantitative Aptitude' } },
  { id: 'B_ATT_2', exam_id: 'BANK_EXAMS', paper_id: 'BP1', score: 44, accuracy: 82, correct_count: 22, wrong_count: 4, skipped_count: 2, submitted_at: '2026-08-03T10:00:00Z', exam_papers: { paper_name: 'Quantitative Aptitude' } },
];
class CDP {
  constructor(wsUrl) { this.ws = new WS(wsUrl); this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  async open() { await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); }); this.ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } else if (m.method && this.handlers.has(m.method)) { this.handlers.get(m.method)(m.params); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { this.handlers.set(method, fn); }
  close() { try { this.ws.close(); } catch {} }
}
const CORS = [['Access-Control-Allow-Origin','*'],['Access-Control-Allow-Headers','*'],['Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, OPTIONS'],['Access-Control-Max-Age','86400']];
function hdrs(l) { return l.map(([n, v]) => ({ name: n, value: v })); }
function respond(cdp, requestId, body, status = 200) { cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: hdrs([...CORS, ['Content-Type','application/json']]), body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch((e) => console.log('RESPOND FAIL:', e.message)); }
(async () => {
  const t = await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  let held = [];
  let released = false;
  const logs = [];
  cdp.on('Runtime.consoleAPICalled', (p) => { logs.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 250)); });
  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url;
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if ((p.request.method || '').toUpperCase() === 'OPTIONS' || p.resourceType === 'Preflight') {
      console.log('PREFLIGHT FULFILL:', url.slice(0, 60));
      return respond(cdp, p.requestId, {}, 204);
    }
    console.log('PAUSED:', url.slice(0, 110));
    if (url.includes('/auth/v1/user')) return respond(cdp, p.requestId, { id: 'u_bank', aud: 'authenticated', role: 'authenticated', email: 'u_bank@test.dev' });
    if (url.includes('/rest/v1/users')) return respond(cdp, p.requestId, { id: 'u_bank', email: 'u_bank@test.dev', full_name: 'Test Bank User', role: 'user', exam_selection: 'BANK_EXAMS', sub_admin_id: null, educator_id: null, is_active: true, email_verified: true, coupon_code_used: false, created_at: '2026-01-01T00:00:00Z' });
    if (url.includes('/rest/v1/attempts')) { if (released) respond(cdp, p.requestId, ATTEMPTS); else held.push({ requestId: p.requestId, kind: 'attempts' }); return; }
    if (url.includes('/rest/v1/exam_configs')) { if (released) respond(cdp, p.requestId, CONFIGS); else held.push({ requestId: p.requestId, kind: 'configs' }); return; }
    if (url.includes('/rest/v1/exam_papers')) { if (released) respond(cdp, p.requestId, PAPERS); else held.push({ requestId: p.requestId, kind: 'papers' }); return; }
    if (url.includes('/rest/v1/exam_subjects')) return respond(cdp, p.requestId, []);
    return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_bank'))});
    sessionStorage.clear();
  `});
  await cdp.send('Page.navigate', { url: `${APP}/history?v=b1` });
  await new Promise((r) => setTimeout(r, 2500));
  const raw = await cdp.send('Runtime.evaluate', { expression: `(async () => {
    const r = await fetch('https://xbjhlfwqmcyatblsrhxn.supabase.co/rest/v1/users?select=id,email&id=eq.u_bank', { headers: { apikey: 'k', Authorization: 'Bearer x', Accept: 'application/vnd.pgrst.object+json', 'Content-Type': 'application/json' } });
    const text = await r.text();
    return { status: r.status, body: text.slice(0, 300) };
  })()`, awaitPromise: true, returnByValue: true });
  console.log('RAW FETCH:', JSON.stringify(raw.result.value));
  const imp = await cdp.send('Runtime.evaluate', { expression: `(async () => {
    try {
      const m = await import('/src/lib/supabase.ts');
      const s = m.supabase;
      const { data, error } = await s.from('users').select('id,email').eq('id', 'u_bank').maybeSingle();
      return { viaClient: { data, error: error ? (error.message || error) : null } };
    } catch (e) { return { threw: String(e) }; }
  })()`, awaitPromise: true, returnByValue: true });
  console.log('CLIENT QUERY:', JSON.stringify(imp.result.value));
  let seen = null;
  for (let i = 0; i < 14; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const s = await cdp.send('Runtime.evaluate', { expression: `(() => { const r = document.querySelector('[role="status"]'); const region = document.querySelector('[role="status"][aria-label="Loading history"]'); const sel = region ? region.querySelector('.selection-surface') : null; const cards = region ? region.querySelectorAll('div[aria-hidden="true"]').length : 0; return { label: r ? (r.getAttribute('aria-label')||'') : 'none', region: !!region, selection: !!sel, cards }; })()`, returnByValue: true });
    seen = s.result.value;
    if (seen.region) break;
  }
  console.log('BANK SKELETON FOUND AT:', JSON.stringify(seen));
  released = true;
  for (const h of held) {
    if (h.kind === 'attempts') respond(cdp, h.requestId, ATTEMPTS);
    else if (h.kind === 'configs') respond(cdp, h.requestId, CONFIGS);
    else if (h.kind === 'papers') respond(cdp, h.requestId, PAPERS);
  }
  await new Promise((r) => setTimeout(r, 2500));
  const fin = await cdp.send('Runtime.evaluate', { expression: `(() => { const cards = [...document.querySelectorAll('[role="button"][aria-label*="View full review"]')]; const status = [...document.querySelectorAll('[role="status"]')].map(e=>e.getAttribute('aria-label')||''); const grid = cards[0] ? cards[0].parentElement : null; const cs = grid ? getComputedStyle(grid) : null; return { cards: cards.length, status, cols: cs ? cs.gridTemplateColumns : null, selTabs: document.querySelectorAll('[role="tab"]').length }; })()`, returnByValue: true });
  console.log('BANK FINAL:', JSON.stringify(fin.result.value));
  const body = await cdp.send('Runtime.evaluate', { expression: `(() => { const s = [...document.querySelectorAll('[role="status"]')]; const statusHtml = s.map(e => e.outerHTML.slice(0, 300)); return { body: document.body.innerText.slice(0, 1100), statusHtml }; })()`, returnByValue: true });
  console.log('BANK BODY:', JSON.stringify(body.result.value, null, 1));
  console.log('BANK CONSOLE:', JSON.stringify(logs.filter((l) => /profile|session|auth|user/i.test(l)).slice(-12), null, 1));
  cdp.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
