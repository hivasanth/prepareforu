const WS = require('ws');
const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';

function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) { const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+86400 }); return `${HEADER}.${payload}.fakesig`; }
function sessionToken(userId) { return JSON.stringify({ access_token: jwt(userId), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+86400, refresh_token: jwt(userId+'_rt'), user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId+'@test.dev', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }); }

class CDP {
  constructor(wsUrl) { this.ws = new WS(wsUrl); this.id = 0; this.pending = new Map(); this.events = new Map(); }
  async open() { await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); }); this.ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } else if (m.method) { const ev = this.events.get(m.method); if (ev) ev.push(m.params); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  close() { try { this.ws.close(); } catch {} }
}

const CORS = [['Access-Control-Allow-Origin','*'],['Access-Control-Allow-Headers','authorization, content-type, apikey, x-client-info, x-supabase-api-version, prefer'],['Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, OPTIONS'],['Access-Control-Max-Age','86400']];
function respond(cdp, requestId, body, status = 200) {
  const headers = [...CORS, ['Content-Type','application/json']];
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch((e) => console.log('FULFILL ERR', e.message));
}

(async () => {
  const t = await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  cdp.events.set('Runtime.consoleAPICalled', []);
  const seen = [];
  cdp.events.set('Fetch.requestPaused', []);
  cdp.on2 = (fn) => { cdp.requestPausedFn = fn; };
  // register a simple handler
  let pendingPause = [];
  cdp.rawHandler = null;

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
    sessionStorage.clear();
    console.log('SEEDED');
  `});
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });

  // listen via a manual event push
  cdp.events.set('Fetch.requestPaused', []);
  const origSend = cdp.send.bind(cdp);
  // attach event loop
  const handle = async (p) => {
    const url = p.request.url;
    seen.push({ url: url.slice(0, 90), stage: p.responseStatusCode ? 'RESP' : 'REQ', method: p.request.method });
    let kind = 'other';
    if (url.includes('/auth/v1/user')) kind = 'user';
    else if (url.includes('/rest/v1/users')) kind = 'users';
    else if (url.includes('/rest/v1/attempts')) kind = 'attempts';
    else if (url.includes('/rest/v1/exam_configs')) kind = 'configs';
    else if (url.includes('/rest/v1/exam_papers')) kind = 'papers';
    console.log('PAUSED', kind, p.request.method, url.slice(0, 100));
    if (kind === 'user') return respond(cdp, p.requestId, { id: 'u_appsc', aud: 'authenticated', role: 'authenticated', email: 'u_appsc@test.dev' });
    if (kind === 'users') return respond(cdp, p.requestId, { id: 'u_appsc', email: 'u_appsc@test.dev', full_name: 'Test APPSC User', role: 'user', exam_selection: 'APPSC_GROUPS', sub_admin_id: null, educator_id: null, is_active: true, email_verified: true, coupon_code_used: false, created_at: '2026-01-01T00:00:00Z' });
    if (kind === 'attempts') return respond(cdp, p.requestId, []);
    if (kind === 'configs') return respond(cdp, p.requestId, []);
    if (kind === 'papers') return respond(cdp, p.requestId, []);
    await cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch((e) => console.log('CONT ERR', kind, e.message));
  };
  cdp.events.set('Fetch.requestPaused', []);
  // monkeypatch: poll the events array
  (async function drain() {
    while (true) {
      const q = cdp.events.get('Fetch.requestPaused');
      if (q && q.length) {
        const batch = q.splice(0, q.length);
        for (const p of batch) { try { await handle(p); } catch (e) { console.log('HANDLER ERR', e.message); } }
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  })();

  await cdp.send('Page.navigate', { url: `${APP}/history?v=dbg2` });
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const r = await cdp.send('Runtime.evaluate', { expression: `({ href: location.href, status: [...document.querySelectorAll('[role="status"]')].map(e=>e.getAttribute('aria-label')||e.textContent.trim().slice(0,50)), body: document.body.innerText.slice(0,120) })`, returnByValue: true });
    console.log(`t+${i+1}s`, JSON.stringify(r.result.value));
  }
  console.log('seen:', JSON.stringify(seen, null, 1));
  cdp.close();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
