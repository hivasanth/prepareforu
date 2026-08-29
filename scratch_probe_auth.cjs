const WS = require('ws');
const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';

function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) {
  const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 });
  return `${HEADER}.${payload}.fakesig`;
}
function sessionToken(userId) {
  return JSON.stringify({
    access_token: jwt(userId), token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: jwt(userId + '_rt'),
    user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev',
      app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  });
}

class CDP {
  constructor(wsUrl) { this.ws = new WS(wsUrl); this.id = 0; this.pending = new Map(); this.events = new Map(); }
  async open() {
    await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); });
    this.ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } }
      else if (m.method) { const ev = this.events.get(m.method); if (ev) ev.push(m.params); }
    });
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  close() { try { this.ws.close(); } catch {} }
}

(async () => {
  const t = await (await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const logs = [];
  cdp.events.set('Runtime.consoleAPICalled', []);
  cdp.events.set('Runtime.exceptionThrown', []);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
      sessionStorage.clear();
    `,
  });
  await cdp.send('Page.navigate', { url: `${APP}/history?v=dbg` });
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const r = await cdp.send('Runtime.evaluate', {
      expression: `({ href: location.href, status: [...document.querySelectorAll('[role="status"]')].map(e=>e.getAttribute('aria-label')||e.textContent.trim().slice(0,50)), body: document.body.innerText.slice(0,200) })`,
      returnByValue: true,
    });
    console.log(`t+${i + 1}s`, JSON.stringify(r.result.value));
  }
  const exc = cdp.events.get('Runtime.exceptionThrown').slice(-3).map((e) => e.exceptionDetails?.text);
  console.log('exceptions', JSON.stringify(exc));
  cdp.close();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
