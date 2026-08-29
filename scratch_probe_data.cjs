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
  const consoleMsgs = [];
  const exceptions = [];
  let held = [];
  let released = false;
  cdp.on('Runtime.consoleAPICalled', (p) => { consoleMsgs.push({ type: p.type, args: p.args.map((a) => a.value ?? a.description ?? '').join(' ') }); });
  cdp.on('Runtime.exceptionThrown', (p) => { exceptions.push(p.exceptionDetails?.text + ' :: ' + (p.exceptionDetails?.exception?.description || '')); });

  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url;
    const method = (p.request.method || 'GET').toUpperCase();
    console.log('PAUSED:', method, url.slice(0, 140));
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    let kind = null;
    if (url.includes('/auth/v1/user')) kind = 'user';
    else if (url.includes('/rest/v1/users')) kind = 'users';
    else if (url.includes('/rest/v1/attempt_answers')) kind = 'answers';
    else if (url.includes('/rest/v1/attempts')) kind = url.includes('id=eq') ? 'attempt_single' : 'attempts';
    else if (url.includes('/rest/v1/exam_configs')) kind = 'configs';
    else if (url.includes('/rest/v1/exam_papers')) kind = 'papers';
    else if (url.includes('/rest/v1/exam_subjects')) kind = 'subjects';
    else return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    console.log('  -> kind', kind, released ? '(RELEASED serve)' : '(hold/serve)');
    if (kind === 'user') respond(cdp, p.requestId, { id: 'u_appsc', aud: 'authenticated', role: 'authenticated', email: 'u_appsc@test.dev' });
    else if (kind === 'users') respond(cdp, p.requestId, { id: 'u_appsc', email: 'u_appsc@test.dev', full_name: 'Test APPSC User', role: 'user', exam_selection: 'APPSC_GROUPS', sub_admin_id: null, educator_id: null, is_active: true, email_verified: true, coupon_code_used: false, created_at: '2026-01-01T00:00:00Z' });
    else if (kind === 'subjects') respond(cdp, p.requestId, []);
    else if (released) {
      if (kind === 'attempts') respond(cdp, p.requestId, ATTEMPTS);
      else if (kind === 'configs') respond(cdp, p.requestId, CONFIGS);
      else if (kind === 'papers') respond(cdp, p.requestId, PAPERS);
      else if (kind === 'attempt_single') respond(cdp, p.requestId, {});
      else if (kind === 'answers') respond(cdp, p.requestId, []);
    }
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
  await cdp.send('Page.navigate', { url: `${APP}/history?v=p4` });
  await new Promise((r) => setTimeout(r, 4100));

  console.log('HELD kinds before release:', held.map((h) => h.kind).join(','));
  released = true;
  for (const h of held) {
    if (h.kind === 'attempts') respond(cdp, h.requestId, ATTEMPTS);
    else if (h.kind === 'configs') respond(cdp, h.requestId, CONFIGS);
    else if (h.kind === 'papers') respond(cdp, h.requestId, PAPERS);
  }
  await new Promise((r) => setTimeout(r, 3000));

  const fin = await cdp.send('Runtime.evaluate', { expression: `(() => {
    const qc = Object.keys(sessionStorage).filter((k) => k.startsWith('qc_'));
    const cache = {};
    for (const k of qc) { try { const v = JSON.parse(sessionStorage.getItem(k)); cache[k] = Array.isArray(v) ? ('array len ' + v.length) : (typeof v === 'object' ? ('obj keys ' + Object.keys(v).join(',')) : String(v).slice(0,80)); } catch (e) { cache[k] = 'parse-fail'; } }
    const cards = [...document.querySelectorAll('[role="button"][aria-label*="View full review"]')].map((c) => c.getAttribute('aria-label'));
    const alerts = [...document.querySelectorAll('[role="alert"]')].map((e) => e.textContent.trim().slice(0, 200));
    const status = [...document.querySelectorAll('[role="status"]')].map((e) => e.getAttribute('aria-label') || '');
    const empty = [...document.querySelectorAll('*')].filter((e) => (e.textContent || '').includes('No official exam attempts yet'));
    const body = document.body.innerText.slice(0, 1200);
    return { qcKeys: qc, cache, cardCount: cards.length, cards, alerts, status, hasEmptyState: empty.length > 0, body };
  })()`, returnByValue: true });
  console.log('FINAL', JSON.stringify(fin.result.value, null, 1));
  console.log('CONSOLE (filtered):');
  for (const m of consoleMsgs) {
    const s = (m.type + ': ' + m.args).slice(0, 300);
    if (/getProfile|fetch|error|fail|attempt|config|paper|perf|queryCache|Loading|loaded/i.test(s)) console.log('  ', s);
  }
  console.log('EXCEPTIONS:', JSON.stringify(exceptions.slice(-5)));
  cdp.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
