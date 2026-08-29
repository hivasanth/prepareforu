const WS = require('ws');

const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';

function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) { const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 }); return `${HEADER}.${payload}.fakesig`; }
function sessionToken(userId) { return JSON.stringify({ access_token: jwt(userId), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: jwt(userId + '_rt'), user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev', app_metadata: {}, user_metadata: {} } }); }
function refreshBody(userId) { return { access_token: jwt(userId), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: jwt(userId + '_rt'), user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev', app_metadata: {}, user_metadata: {} } }; }
function makeUser(userId, exam) { return { id: userId, email: userId + '@test.dev', full_name: exam === 'appsc' ? 'Test APPSC User' : 'Test Bank User', role: 'user', exam_selection: exam === 'appsc' ? 'APPSC_GROUPS' : 'BANK_EXAMS', sub_admin_id: null, educator_id: null, is_active: true, email_verified: true, coupon_code_used: false, created_at: '2026-01-01T00:00:00Z' }; }

// ─── mock data ────────────────────────────────────────────────────────────────
const PAPERS = [
  { id: 'P1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper I' },
  { id: 'P2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper II' },
  { id: 'P3', exam_id: 'APPSC_GROUP_2', paper_name: 'Paper I' },
  { id: 'P4', exam_id: 'APPSC_GROUP_3', paper_name: 'Paper I' },
  { id: 'P5', exam_id: 'APPSC_GROUP_4', paper_name: 'Paper I' },
];
const P1_SUBJECTS = ['POLITY', 'HISTORY', 'GEOGRAPHY', 'ECONOMY'].map(subject_name => ({ subject_name }));
const P2_SUBJECTS = ['POLITY', 'ENVIRONMENT', 'SCIENCE & TECH'].map(subject_name => ({ subject_name }));
const P1_COUNTS = [
  { subject_name: 'POLITY', count: 120 }, { subject_name: 'HISTORY', count: 150 },
  { subject_name: 'GEOGRAPHY', count: 90 }, { subject_name: 'ECONOMY', count: 60 },
];
const P2_COUNTS = [
  { subject_name: 'POLITY', count: 120 }, { subject_name: 'ENVIRONMENT', count: 50 },
  { subject_name: 'SCIENCE & TECH', count: 40 },
];
const BANK_SUBJECTS = ['QUANTITATIVE APTITUDE', 'REASONING', 'ENGLISH', 'GENERAL AWARENESS'].map(subject_name => ({ subject_name }));
const BANK_COUNTS = [
  { subject_name: 'QUANTITATIVE APTITUDE', count: 200 }, { subject_name: 'REASONING', count: 150 },
  { subject_name: 'ENGLISH', count: 120 }, { subject_name: 'GENERAL AWARENESS', count: 80 },
];
const BANK_PAPERS = [{ id: 'BP1', exam_id: 'BANK_EXAMS', paper_name: 'Quantitative Aptitude' }];
const MIN_QUESTIONS = [{ exam_id: 'APPSC_GROUP_1', min_questions: 20 }];

// ─── CDP plumbing (reused from history harness) ───────────────────────────────
class CDP {
  constructor(wsUrl) { this.ws = new WS(wsUrl); this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  async open() { await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); }); this.ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } else if (m.method) { const h = this.handlers.get(m.method); if (h) h(m.params); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { this.handlers.set(method, fn); }
  close() { try { this.ws.close(); } catch {} }
}
async function newTarget(url) { const res = await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent(url || 'about:blank')}`, { method: 'PUT' }); return res.json(); }
async function closeTarget(id) { try { await fetch(`${CDP_HTTP}/json/close/${id}`); } catch {} }

const CORS = [['Access-Control-Allow-Origin', '*'], ['Access-Control-Allow-Headers', '*'], ['Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS'], ['Access-Control-Max-Age', '86400']];
function hdrs(list) { return list.map(([name, value]) => ({ name, value })); }
function respond(cdp, requestId, body, status = 200, contentType = 'application/json') {
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: hdrs([...CORS, ['Content-Type', contentType]]), body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(() => {});
}
function respondEmpty(cdp, requestId, status = 204) {
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: hdrs(CORS) }).catch(() => {});
}

function classify(url) {
  if (url.includes('/auth/v1/token')) return 'token';
  if (url.includes('/auth/v1/user')) return 'user';
  if (url.includes('/rest/v1/users')) return 'users';
  if (url.includes('/rest/v1/notifications')) return 'notifications';
  if (url.includes('/rest/v1/exam_configs')) return 'configs';
  if (url.includes('/rest/v1/exam_papers')) return 'papers';
  if (url.includes('/rest/v1/exam_subjects')) return 'subjects';
  if (url.includes('/rest/v1/question_counts')) return 'counts';
  return null;
}
const paperOf = (url) => { const m = url.match(/paper_id=eq\.([^&]+)/); return m ? decodeURIComponent(m[1]) : null; };

function serve(cdp, requestId, kind, url, exam) {
  if (kind === 'token') return respond(cdp, requestId, refreshBody(exam === 'appsc' ? 'u_appsc' : 'u_bank'));
  if (kind === 'user') return respond(cdp, requestId, { id: exam === 'appsc' ? 'u_appsc' : 'u_bank', aud: 'authenticated', role: 'authenticated', email: (exam === 'appsc' ? 'u_appsc' : 'u_bank') + '@test.dev' });
  if (kind === 'users') return respond(cdp, requestId, makeUser(exam === 'appsc' ? 'u_appsc' : 'u_bank', exam));
  if (kind === 'notifications') return respond(cdp, requestId, []);
  if (kind === 'configs') return respond(cdp, requestId, MIN_QUESTIONS);
  if (kind === 'papers') return respond(cdp, requestId, exam === 'appsc' ? PAPERS : BANK_PAPERS);
  if (kind === 'subjects') {
    const pid = paperOf(url);
    if (exam === 'appsc') { if (pid === 'P1') return respond(cdp, requestId, P1_SUBJECTS); if (pid === 'P2') return respond(cdp, requestId, P2_SUBJECTS); return respond(cdp, requestId, []); }
    return respond(cdp, requestId, BANK_SUBJECTS);
  }
  if (kind === 'counts') {
    const pid = paperOf(url);
    if (exam === 'appsc') { if (pid === 'P1') return respond(cdp, requestId, P1_COUNTS); if (pid === 'P2') return respond(cdp, requestId, P2_COUNTS); return respond(cdp, requestId, []); }
    return respond(cdp, requestId, BANK_COUNTS);
  }
  return cdp.send('Fetch.continueRequest', { requestId }).catch(() => {});
}

// ─── measurement functions ────────────────────────────────────────────────────
const hasPortalSkel = () => {
  const region = document.querySelector('[role="status"][aria-label="Loading subject tests"]');
  return { has: !!region && !!region.querySelector('.selection-surface'), selHas: !!region };
};

const measurePortalSkel = () => {
  const region = document.querySelector('[role="status"][aria-label="Loading subject tests"]');
  if (!region) return { found: false };
  const sel = region.querySelector('.selection-surface');
  const selInfo = sel ? (() => {
    const r = sel.getBoundingClientRect();
    const cs = getComputedStyle(sel);
    const primary = sel.querySelector('.h-\\[44px\\]');
    const papers = sel.querySelector('.h-\\[40px\\]');
    const divider = sel.querySelector('.bg-border-subtle');
    const selInner = sel.querySelector(':scope > div');
    return {
      h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, bg: cs.backgroundColor,
      borderWidth: cs.borderTopWidth, primaryRow: primary ? Math.round(primary.getBoundingClientRect().height) : null,
      papersRow: papers ? Math.round(papers.getBoundingClientRect().height) : null, divider: !!divider,
    };
  })() : null;
  const grid = region.querySelector('[class*="grid-cols-2"]');
  const gridInfo = grid ? (() => { const cs = getComputedStyle(grid); return { top: Math.round(grid.getBoundingClientRect().top), cols: cs.gridTemplateColumns.split(' ').length, gap: cs.columnGap }; })() : null;
  const cards = grid ? [...grid.children] : [];
  const cardInfo = cards.slice(0, 2).map((c) => {
    const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, padTop: cs.paddingTop, bg: cs.backgroundColor, borderWidth: cs.borderTopWidth, animation: cs.animationDuration };
  });
  return { found: true, sel: selInfo, grid: gridInfo, cardCount: cards.length, cards: cardInfo, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
};

const measurePortalFinal = () => {
  const sel = [...document.querySelectorAll('.selection-surface')].find((el) => el.querySelector('[role="tab"]'));
  const selInfo = sel ? (() => {
    const r = sel.getBoundingClientRect(); const cs = getComputedStyle(sel);
    const rows = [...sel.querySelectorAll('div.overflow-x-auto')].map((o) => Math.round(o.getBoundingClientRect().height));
    return { h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, tabs: sel.querySelectorAll('[role="tab"]').length, rows };
  })() : null;
  const grid = document.querySelector('[aria-live="polite"][class*="grid-cols-2"]') || [...document.querySelectorAll('[class*="grid-cols-2"]')].find((g) => g.querySelector('button'));
  const gridInfo = grid ? (() => { const cs = getComputedStyle(grid); return { top: Math.round(grid.getBoundingClientRect().top), cols: cs.gridTemplateColumns.split(' ').length, gap: cs.columnGap }; })() : null;
  const cards = grid ? [...grid.children] : [];
  const cardInfo = cards.slice(0, 2).map((c) => {
    const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, padTop: cs.paddingTop, bg: cs.backgroundColor, borderWidth: cs.borderTopWidth };
  });
  const texts = cards.map((c) => (c.querySelector('div[title]') || c).textContent.trim().slice(0, 40));
  return { sel: selInfo, grid: gridInfo, cardCount: cards.length, cards: cardInfo, cardTexts: texts, statuses: [...document.querySelectorAll('[role="status"]')].map((e) => e.getAttribute('aria-label') || ''), overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
};

const measureConfigSkel = () => {
  const region = document.querySelector('[role="status"][aria-label="Loading session configuration"]');
  if (!region) return { found: false };
  const card = region.firstElementChild;
  const cs = getComputedStyle(card); const r = card.getBoundingClientRect();
  const opts = [...card.querySelectorAll('[class*="grid-cols-3"] > div')].map((o) => ({ h: Math.round(o.getBoundingClientRect().height), r: getComputedStyle(o).borderRadius }));
  return {
    found: true, h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, padTop: cs.paddingTop,
    opts, hasHint: !!card.querySelector('[style*="width: 62%"]'), infoPanel: !!card.querySelector('[class*="bg-hover-bg/30"]'),
    infoRows: card.querySelectorAll('[class*="bg-hover-bg/30"] > div').length, ctaH: (() => { const c = card.querySelector('[style*="height: 56px"]'); return c ? Math.round(c.getBoundingClientRect().height) : null; })(),
    headerIcon: (() => { const h = card.querySelector('.border-b'); return h ? { childCount: h.children.length, h: Math.round(h.getBoundingClientRect().height) } : null; })(),
  };
};

const measureConfigFinal = () => {
  const container = document.querySelector('[class*="max-w-[800px]"]');
  const card = container ? container.firstElementChild : null;
  if (!card) return { found: false };
  const cs = getComputedStyle(card); const r = card.getBoundingClientRect();
  const opts = [...card.querySelectorAll('[role="radio"]')].map((o) => ({ h: Math.round(o.getBoundingClientRect().height), r: getComputedStyle(o).borderRadius, text: o.textContent.trim().split('\n')[0] }));
  const infoRows = [...card.querySelectorAll('[class*="bg-hover-bg/30"] > div')].map((d) => d.textContent.trim().split('\n')[0]);
  const cta = card.querySelector('button');
  return {
    found: true, h: Math.round(r.height), w: Math.round(r.width), radius: cs.borderRadius, padTop: cs.paddingTop,
    opts, infoRows, hint: card.textContent.includes('only select up to'), cta: cta ? cta.textContent.trim().slice(0, 30) : null, ctaH: cta ? Math.round(cta.getBoundingClientRect().height) : null,
    headerTitle: card.querySelector('h2') ? card.querySelector('h2').textContent : null,
  };
};

async function evaluate(cdp, fn) {
  const res = await cdp.send('Runtime.evaluate', { expression: `(${fn.toString()})()`, returnByValue: true });
  if (res.exceptionDetails) return { error: res.exceptionDetails.text };
  return res.result.value;
}
async function evalRaw(cdp, expr) {
  const res = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (res.exceptionDetails) return { error: res.exceptionDetails.text };
  return res.result.value;
}

// ─── scenario: cold portal ────────────────────────────────────────────────────
async function coldPortal(spec) {
  const { width, height = 900, theme = 'dark', exam = 'appsc', rm = false, holdKinds = ['subjects', 'counts'], delayConfigChunk = false } = spec;
  const userId = exam === 'appsc' ? 'u_appsc' : 'u_bank';
  const t = await newTarget();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const targetId = t.id;

  let held = [];
  let released = false;
  let subjectsFailed = false;
  const consoleLogs = [];
  cdp.on('Runtime.consoleAPICalled', (p) => { consoleLogs.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); });

  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url;
    const method = (p.request.method || 'GET').toUpperCase();
    if (url.includes('supabase.co')) {
      if (method === 'OPTIONS') return respondEmpty(cdp, p.requestId);
      const kind = classify(url);
      if (!kind) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      if (kind === 'subjects' && spec.failSubjectsFirst && !subjectsFailed) { subjectsFailed = true; return respond(cdp, p.requestId, { message: 'connection lost' }, 503); }
      if (released || !holdKinds.includes(kind)) return serve(cdp, p.requestId, kind, url, exam);
      held.push({ requestId: p.requestId, kind, url });
      return;
    }
    if (delayConfigChunk && url.includes('subject-tests/SubjectConfigView')) {
      setTimeout(() => cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {}), 2500);
      return;
    }
    return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' });
  await cdp.send('Emulation.setEmulatedMedia', { media: '', features: rm ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] });
  const patterns = [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }];
  if (delayConfigChunk) patterns.push({ urlPattern: 'http://localhost:5173/*', requestStage: 'Response' });
  await cdp.send('Fetch.enable', { patterns });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('theme', ${JSON.stringify(theme)}); localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken(userId))}); sessionStorage.clear();`,
  });

  const v = Date.now() + Math.floor(Math.random() * 100000);
  await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${v}` });

  const release = () => {
    if (released) return Promise.resolve();
    released = true;
    return Promise.all(held.map((h) => serve(cdp, h.requestId, h.kind, h.url, exam)));
  };

  const out = { spec: { width, theme, exam, rm, delayConfigChunk } };

  // wait for portal skeleton (with selection surface for APPSC)
  let polled = false;
  for (let attempt = 0; attempt < 2 && !polled; attempt++) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const probe = await evaluate(cdp, hasPortalSkel);
      if (probe && probe.selHas) { polled = true; break; }
    }
    if (!polled && attempt === 0) {
      const nav = Date.now() + Math.floor(Math.random() * 100000);
      await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${nav}` });
    }
  }
  if (!polled) {
    const debug = await evalRaw(cdp, `(() => ({ body: document.body.innerText.slice(0, 400), statuses: [...document.querySelectorAll('[role="status"]')].map(e => e.getAttribute('aria-label') || '') }))()`);
    console.log('PORTAL SKELETON NEVER APPEARED', JSON.stringify(debug), 'console:', JSON.stringify(consoleLogs.filter((l) => /error|fail|lost/i.test(l)).slice(-10)));
  }

  if (delayConfigChunk) {
    // config flow: portal already released? No — for config we release first, wait for final, then click.
    await release();
    await new Promise((r) => setTimeout(r, 8000));
    const portalFinal = await evaluate(cdp, measurePortalFinal);
    const clicked = await evalRaw(cdp, `(() => { const g = [...document.querySelectorAll('[class*="grid-cols-2"]')].find(g2 => g2.querySelector('button')); if (!g) return false; const b = g.querySelector('button'); b.click(); return true; })()`);
    if (!clicked) return { out: { ...out, error: 'could not click card' } };
    let cfgSkel = null;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 200));
      cfgSkel = await evaluate(cdp, measureConfigSkel);
      if (cfgSkel && cfgSkel.found) break;
    }
    await new Promise((r) => setTimeout(r, 4000)); // chunk continues after 2.5s + render
    const cfgFinal = await evaluate(cdp, measureConfigFinal);
    out.portalFinal = portalFinal;
    out.configSkel = cfgSkel;
    out.configFinal = cfgFinal;
    out.statusesDuringConfig = await evalRaw(cdp, `(() => [...document.querySelectorAll('[role="status"]')].map(e => e.getAttribute('aria-label') || ''))()`);
  } else {
    if (!polled) { cdp.close(); await closeTarget(targetId); return { out }; }
    out.skeleton = await evaluate(cdp, measurePortalSkel);
    await release();
    await new Promise((r) => setTimeout(r, 8000));
    out.final = await evaluate(cdp, measurePortalFinal);
  }

  cdp.close();
  await closeTarget(targetId);
  return out;
}

// ─── scenario: warm reload ────────────────────────────────────────────────────
async function warmPortal() {
  const t = await newTarget();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const targetId = t.id;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
      if (sessionStorage.getItem('__warmTrack') === '1') {
        sessionStorage.setItem('__warmSk', 'none');
        sessionStorage.setItem('__warmSkStart', '0');
        sessionStorage.setItem('__warmSkEnd', '0');
        let lastSeen = 0;
        const m = () => {
          const s = [...document.querySelectorAll('[role="status"]')].map((e) => e.getAttribute('aria-label') || '');
          if (s.some((x) => x.includes('Loading subject tests'))) {
            if (!lastSeen) sessionStorage.setItem('__warmSkStart', String(Date.now()));
            lastSeen = Date.now();
            sessionStorage.setItem('__warmSk', 'skeleton');
          } else if (lastSeen && sessionStorage.getItem('__warmSkEnd') === '0') {
            sessionStorage.setItem('__warmSkEnd', String(Date.now()));
          }
        };
        m(); setInterval(m, 40); try { new MutationObserver(m).observe(document.body, { childList: true, subtree: true }); } catch {}
      }
    `,
  });
  let released = true;
  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url; const method = (p.request.method || 'GET').toUpperCase();
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if (method === 'OPTIONS') return respondEmpty(cdp, p.requestId);
    const kind = classify(url);
    if (!kind) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    serve(cdp, p.requestId, kind, url, 'appsc');
  });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
  const v = Date.now();
  await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${v}` });
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const ready = await evalRaw(cdp, `(() => { const s = [...document.querySelectorAll('[class*="grid-cols-2"]')].find(g => g.querySelector('button')); return { has: !!s }; })()`);
    if (ready && ready.has) break;
  }
  await new Promise((r) => setTimeout(r, 800));
  await evalRaw(cdp, `(() => { sessionStorage.setItem('__warmTrack', '1'); return true; })()`);
  await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${v + 1}` });
  await new Promise((r) => setTimeout(r, 8000));
  const warmFlash = await evalRaw(cdp, `(() => sessionStorage.getItem('__warmSk'))()`);
  const warmStart = await evalRaw(cdp, `(() => Number(sessionStorage.getItem('__warmSkStart')) || 0)()`);
  const warmEnd = await evalRaw(cdp, `(() => Number(sessionStorage.getItem('__warmSkEnd')) || 0)()`);
  const final = await evaluate(cdp, measurePortalFinal);
  cdp.close();
  await closeTarget(targetId);
  return { warmFlash, warmDuration: warmEnd && warmStart ? Math.round(warmEnd - warmStart) : 0, final };
}

// ─── scenario: paper switch ───────────────────────────────────────────────────
async function paperSwitch() {
  const t = await newTarget();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const targetId = t.id;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme', 'dark'); localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))}); sessionStorage.clear();` });
  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url; const method = (p.request.method || 'GET').toUpperCase();
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if (method === 'OPTIONS') return respondEmpty(cdp, p.requestId);
    const kind = classify(url);
    if (!kind) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    serve(cdp, p.requestId, kind, url, 'appsc');
  });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
  const v = Date.now();
  await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${v}` });
  let ready = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 300));
    ready = await evalRaw(cdp, `(() => { const t2 = [...document.querySelectorAll('[role="tab"]')]; const paper2 = t2.find(x => x.textContent.trim().toUpperCase().includes('PAPER II')); return { has: !!paper2, tabs: t2.map(x => x.textContent.trim()) }; })()`);
    if (ready && ready.has) break;
  }
  if (!ready || !ready.has) { cdp.close(); await closeTarget(targetId); return { error: 'paper II tab not found', ready }; }
  await new Promise((r) => setTimeout(r, 500));
  const before = await evalRaw(cdp, `(() => { const g = document.querySelector('[aria-live="polite"][class*="grid-cols-2"]') || [...document.querySelectorAll('[class*="grid-cols-2"]')].find(x => x.querySelector('button')); return { count: g ? g.children.length : 0, texts: g ? [...g.children].map(c => (c.querySelector('div[title]') || c).textContent.trim().slice(0, 30)) : [] }; })()`);
  await evalRaw(cdp, `(() => { const t2 = [...document.querySelectorAll('[role="tab"]')].find(x => x.textContent.trim().toUpperCase().includes('PAPER II')); t2.click(); return true; })()`);
  let during = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 50));
    during = await evalRaw(cdp, `(() => { const skel = !!document.querySelector('[aria-label="Loading subject tests"]'); const g = document.querySelector('[aria-live="polite"][class*="grid-cols-2"]') || [...document.querySelectorAll('[class*="grid-cols-2"]')].find(x => x.querySelector('button')); return { skel, cards: g ? g.children.length : 0, activeTab: (document.querySelector('[role="tab"][aria-selected="true"]') || {}).textContent || '' }; })()`);
    if (during && during.cards > 0) break;
  }
  await new Promise((r) => setTimeout(r, 2000));
  const after = await evalRaw(cdp, `(() => { const g = document.querySelector('[aria-live="polite"][class*="grid-cols-2"]') || [...document.querySelectorAll('[class*="grid-cols-2"]')].find(x => x.querySelector('button')); return { count: g ? g.children.length : 0, texts: g ? [...g.children].map(c => (c.querySelector('div[title]') || c).textContent.trim().slice(0, 30)) : [], activeTab: (document.querySelector('[role="tab"][aria-selected="true"]') || {}).textContent || '' }; })()`);
  cdp.close();
  await closeTarget(targetId);
  return { before, during, after };
}

// ─── scenario: error + retry ──────────────────────────────────────────────────
async function errorRetry() {
  const t = await newTarget();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const targetId = t.id;
  let held = [];
  let released = false;
  let subjectsFailed = false;
  const consoleLogs = [];
  cdp.on('Runtime.consoleAPICalled', (p) => { consoleLogs.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); });
  cdp.on('Fetch.requestPaused', (p) => {
    const url = p.request.url; const method = (p.request.method || 'GET').toUpperCase();
    console.log('FETCH:', method, url.slice(-100));
    if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if (method === 'OPTIONS') return respondEmpty(cdp, p.requestId);
    const kind = classify(url);
    console.log('FETCH CLASSIFY:', kind, url.slice(-100));
    if (!kind) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    console.log('HANDLER ENTRY:', kind, { subjectsFailed, released });
    if (kind === 'subjects') {
      console.log('SUBJECTS HANDLER:', { subjectsFailed, released, url: url.slice(-80) });
      if (!subjectsFailed) { subjectsFailed = true; return respond(cdp, p.requestId, { message: 'connection lost' }, 503); }
      if (released) return serve(cdp, p.requestId, kind, url, 'appsc');
      held.push({ requestId: p.requestId, kind, url });
      console.log('SUBJECTS HELD, total held:', held.length);
      return;
    }
    if (kind === 'counts') {
      if (released) return serve(cdp, p.requestId, kind, url, 'appsc');
      held.push({ requestId: p.requestId, kind, url });
      return;
    }
    serve(cdp, p.requestId, kind, url, 'appsc');
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme', 'dark'); localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))}); sessionStorage.clear();` });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
  const v = Date.now();
  await cdp.send('Page.navigate', { url: `${APP}/subject-tests?v=${v}` });
  // wait for error UI
  let errorUi = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 300));
    errorUi = await evalRaw(cdp, `(() => { const a = document.querySelector('[role="alert"]'); const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 30)); return { alert: a ? a.textContent.trim().slice(0, 120) : null, btns }; })()`);
    if (errorUi && (errorUi.alert || errorUi.btns.some((b) => /try again/i.test(b)))) break;
  }
  // click Try Again
  await evalRaw(cdp, `(() => { const b = [...document.querySelectorAll('button')].find(x => /try again/i.test(x.textContent)); if (b) b.click(); return !!b; })()`);
  // expect skeleton while held
  let retrySkel = null;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 300));
    retrySkel = await evaluate(cdp, measurePortalSkel);
    if (retrySkel && retrySkel.found) break;
  }
  released = true;
  console.log('RELEASING HELD REQUESTS:', held.map(h => ({ kind: h.kind, url: h.url.slice(-80) })));
  await Promise.all(held.map((h) => serve(cdp, h.requestId, h.kind, h.url, 'appsc')));
  await new Promise((r) => setTimeout(r, 8000));
  // DEBUG: check console logs for errors
  console.log('CONSOLE LOGS:', JSON.stringify(consoleLogs.filter(l => /error|fail|warn|subject|count/i.test(l)).slice(-20), null, 2));
  const final = await evaluate(cdp, measurePortalFinal);
  cdp.close();
  await closeTarget(targetId);
  return { errorUi, retrySkel, final };
}

// ─── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const which = process.argv[2] || 'all';
  const results = {};
  try {
    if (which === 'all' || which === 'cold') {
      for (const w of [390, 640, 768, 1024, 1280, 1440]) {
        results[`appsc-${w}`] = await coldPortal({ width: w, exam: 'appsc' });
        console.log('DONE appsc', w);
      }
      results['appsc-1280-light'] = await coldPortal({ width: 1280, theme: 'light', exam: 'appsc' });
      results['appsc-390-light'] = await coldPortal({ width: 390, theme: 'light', exam: 'appsc' });
      results['appsc-1280-rm'] = await coldPortal({ width: 1280, rm: true, exam: 'appsc' });
      console.log('DONE appsc light/rm');
    }
    if (which === 'all' || which === 'bank') {
      results['bank-1280'] = await coldPortal({ width: 1280, exam: 'bank' });
      results['bank-390'] = await coldPortal({ width: 390, exam: 'bank' });
      results['bank-1280-light'] = await coldPortal({ width: 1280, theme: 'light', exam: 'bank' });
      results['bank-1280-rm'] = await coldPortal({ width: 1280, rm: true, exam: 'bank' });
      console.log('DONE bank');
    }
    if (which === 'all' || which === 'warm') {
      results['appsc-warm'] = await warmPortal();
      console.log('DONE warm');
    }
    if (which === 'all' || which === 'switch') {
      results['appsc-paper-switch'] = await paperSwitch();
      console.log('DONE switch');
    }
    if (which === 'all' || which === 'retry') {
      results['appsc-error-retry'] = await errorRetry();
      console.log('DONE retry');
    }
    if (which === 'all' || which === 'config') {
      results['config-1280'] = await coldPortal({ width: 1280, delayConfigChunk: true });
      results['config-390'] = await coldPortal({ width: 390, delayConfigChunk: true });
      console.log('DONE config');
    }
  } catch (e) {
    console.error('FATAL', e);
  }
  console.log('\n===== RESULTS =====');
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
