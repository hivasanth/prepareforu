const WS = require('ws');

const CDP_HTTP = 'http://127.0.0.1:9222';
const APP = 'http://localhost:5173';

// ─── base64url helpers ────────────────────────────────────────────────────────
function b64u(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

const HEADER = b64u({ alg: 'HS256', typ: 'JWT' });
function jwt(sub) {
  const payload = b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 });
  return `${HEADER}.${payload}.fakesig`;
}

function sessionToken(userId) {
  return JSON.stringify({
    access_token: jwt(userId),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: jwt(userId + '_rt'),
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: userId + '@test.dev',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
    },
  });
}
function refreshBody(userId) {
  return {
    access_token: jwt(userId),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: jwt(userId + '_rt'),
    user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev', app_metadata: {}, user_metadata: {} },
  };
}

// ─── payloads ─────────────────────────────────────────────────────────────────
const isAttemptSingle = (url) => /[?&]id=eq\./.test(url);
const APPSC_GROUPS = ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4'];
const PAPERS = [
  { id: 'P1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper I' },
  { id: 'P2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper II' },
  { id: 'P3', exam_id: 'APPSC_GROUP_2', paper_name: 'Paper I' },
  { id: 'P4', exam_id: 'APPSC_GROUP_3', paper_name: 'Paper I' },
  { id: 'P5', exam_id: 'APPSC_GROUP_4', paper_name: 'Paper I' },
];
const CONFIGS = APPSC_GROUPS.map((g) => ({ exam_id: g, name: g.replace('_', ' '), exam_selection: 'APPSC_GROUPS' }));
const BANK_CONFIGS = [{ exam_id: 'BANK_EXAMS', name: 'Bank Exams', exam_selection: 'BANK_EXAMS' }];

const ATTEMPTS = [
  { id: 'ATT_1', exam_id: 'APPSC_GROUP_1', paper_id: 'P1', score: 42, accuracy: 84, correct_count: 21, wrong_count: 4, skipped_count: 0, submitted_at: '2026-08-10T10:00:00Z', exam_papers: { paper_name: 'Paper I' } },
  { id: 'ATT_2', exam_id: 'APPSC_GROUP_1', paper_id: 'P2', score: 38, accuracy: 76, correct_count: 19, wrong_count: 6, skipped_count: 0, submitted_at: '2026-08-09T10:00:00Z', exam_papers: { paper_name: 'Paper II' } },
  { id: 'ATT_3', exam_id: 'APPSC_GROUP_2', paper_id: 'P3', score: 35, accuracy: 70, correct_count: 17, wrong_count: 7, skipped_count: 1, submitted_at: '2026-08-08T10:00:00Z', exam_papers: { paper_name: 'Paper I' } },
  { id: 'ATT_4', exam_id: 'APPSC_GROUP_1', paper_id: 'P1', score: 40, accuracy: 80, correct_count: 20, wrong_count: 5, skipped_count: 0, submitted_at: '2026-08-07T10:00:00Z', exam_papers: { paper_name: 'Paper I' } },
  { id: 'ATT_5', exam_id: 'APPSC_GROUP_3', paper_id: 'P4', score: 30, accuracy: 60, correct_count: 15, wrong_count: 10, skipped_count: 0, submitted_at: '2026-08-06T10:00:00Z', exam_papers: { paper_name: 'Paper I' } },
  { id: 'ATT_6', exam_id: 'APPSC_GROUP_4', paper_id: 'P5', score: 33, accuracy: 66, correct_count: 16, wrong_count: 8, skipped_count: 1, submitted_at: '2026-08-05T10:00:00Z', exam_papers: { paper_name: 'Paper I' } },
];
const BANK_ATTEMPTS = [
  { id: 'B_ATT_1', exam_id: 'BANK_EXAMS', paper_id: 'BP1', score: 50, accuracy: 90, correct_count: 25, wrong_count: 2, skipped_count: 1, submitted_at: '2026-08-04T10:00:00Z', exam_papers: { paper_name: 'Quantitative Aptitude' } },
  { id: 'B_ATT_2', exam_id: 'BANK_EXAMS', paper_id: 'BP1', score: 44, accuracy: 82, correct_count: 22, wrong_count: 4, skipped_count: 2, submitted_at: '2026-08-03T10:00:00Z', exam_papers: { paper_name: 'Quantitative Aptitude' } },
];

const QS = (id, subject, text) => ({
  id,
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'P1',
  subject_name: subject,
  question_text_en: text,
  option_a_en: 'Option A of ' + text,
  option_b_en: 'Option B of ' + text,
  option_c_en: 'Option C of ' + text,
  option_d_en: 'Option D of ' + text,
  correct_option: 'A',
  difficulty: 'easy',
  negative_marks: 0,
  explanation_en: 'Rationale for ' + text,
});

const REVIEW_ATTEMPT = {
  id: 'ATT_1',
  user_id: 'u_appsc',
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'P1',
  status: 'completed',
  score: 42,
  accuracy: 84,
  correct_count: 21,
  wrong_count: 4,
  skipped_count: 0,
  submitted_at: '2026-08-10T10:00:00Z',
  duration_seconds: 3600,
  review_accessed: false,
  source: 'exam_tab',
  questions_snapshot: [
    QS('Q1', 'Aptitude', 'What is the capital of France?'),
    QS('Q2', 'Reasoning', 'Which number completes the series?'),
    QS('Q3', 'General Studies', 'Who wrote the Constitution?'),
  ],
};

const REVIEW_ANSWERS = [
  { id: 'ANS_1', attempt_id: 'ATT_1', question_id: 'Q1', selected_option: 'A', correct_option: 'A', is_correct: true },
  { id: 'ANS_2', attempt_id: 'ATT_1', question_id: 'Q2', selected_option: 'B', correct_option: 'A', is_correct: false },
  { id: 'ANS_3', attempt_id: 'ATT_1', question_id: 'Q3', selected_option: 'A', correct_option: 'A', is_correct: true },
];

// ─── tiny CDP client ──────────────────────────────────────────────────────────
class CDP {
  constructor(wsUrl) {
    this.ws = new WS(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.events = new Map();
  }
  async open() {
    await new Promise((res, rej) => { this.ws.on('open', res); this.ws.on('error', rej); });
    this.ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.id) {
        const p = this.pending.get(m.id);
        if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
      } else if (m.method) {
        const h = this.handlers.get(m.method);
        if (h) h(m.params);
        const ev = this.events.get(m.method);
        if (ev) ev.push(m.params);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) { this.handlers.set(method, fn); }
  close() { try { this.ws.close(); } catch {} }
}

async function newTarget(url) {
  const res = await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent(url || 'about:blank')}`, { method: 'PUT' });
  return res.json();
}
async function closeTarget(id) {
  try { await fetch(`${CDP_HTTP}/json/close/${id}`, { method: 'GET' }); } catch {}
}

const CORS = [
  ['Access-Control-Allow-Origin', '*'],
  ['Access-Control-Allow-Headers', '*'],
  ['Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS'],
  ['Access-Control-Max-Age', '86400'],
];
function hdrs(list) { return list.map(([name, value]) => ({ name, value })); }
function respond(cdp, requestId, body, status = 200, contentType = 'application/json') {
  const headers = hdrs([...CORS, ['Content-Type', contentType]]);
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(() => {});
}
function respondRaw(cdp, requestId, text, status = 200, contentType = 'application/json') {
  const headers = hdrs([...CORS, ['Content-Type', contentType]]);
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(text).toString('base64') }).catch(() => {});
}
function respondEmpty(cdp, requestId, status = 204) {
  const headers = hdrs(CORS);
  cdp.send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers }).catch(() => {});
}

// ─── scenario runner ──────────────────────────────────────────────────────────
async function runScenario(spec) {
  const {
    width, height = 900, theme = 'dark', exam = 'appsc', reducedMotion = false,
    route = '/history', hold = ['attempts', 'configs', 'papers'], warm = false,
    userCount = 1,
  } = spec;

  const userId = exam === 'appsc' ? 'u_appsc' : 'u_bank';
  const t = await newTarget();
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.open();
  const targetId = t.id;

  let held = []; // {requestId, kind}
  let released = false;
  const consoleLogs = [];
  cdp.on('Runtime.consoleAPICalled', (p) => { consoleLogs.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); });

  cdp.on('Fetch.requestPaused', async (p) => {
    const url = p.request.url;
    const method = (p.request.method || 'GET').toUpperCase();
    const isSupabase = url.includes('supabase.co');
    if (!isSupabase) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    if (p.resourceType === 'preflight' || (p.request.headers && p.request.headers['access-control-request-method'])) {
      return respondEmpty(cdp, p.requestId, 204);
    }

    let kind = null;
    if (url.includes('/auth/v1/token')) kind = 'token';
    else if (url.includes('/auth/v1/user')) kind = 'user';
    else if (url.includes('/rest/v1/users')) kind = 'users';
    else if (url.includes('/rest/v1/attempt_answers')) kind = 'answers';
    else if (url.includes('/rest/v1/attempts')) {
      if (method === 'PATCH') kind = 'attempt_patch';
      else if (isAttemptSingle(url)) kind = 'attempt_single';
      else kind = 'attempts';
    }
    else if (url.includes('/rest/v1/exam_configs')) kind = 'configs';
    else if (url.includes('/rest/v1/exam_papers')) kind = 'papers';
    else if (url.includes('/rest/v1/exam_subjects')) kind = 'subjects';
    else return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});

    if (warm) {
      // warm: serve everything immediately; data endpoints still hit cache in app but serve anyway
      if (kind === 'token') respond(cdp, p.requestId, refreshBody(userId));
      else if (kind === 'user') respond(cdp, p.requestId, { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev' });
      else if (kind === 'users') respond(cdp, p.requestId, makeUser(userId, exam));
      else if (kind === 'attempts') respond(cdp, p.requestId, exam === 'appsc' ? ATTEMPTS : BANK_ATTEMPTS);
      else if (kind === 'configs') respond(cdp, p.requestId, exam === 'appsc' ? CONFIGS : BANK_CONFIGS);
      else if (kind === 'papers') respond(cdp, p.requestId, exam === 'appsc' ? PAPERS : [{ id: 'BP1', exam_id: 'BANK_EXAMS', paper_name: 'Quantitative Aptitude' }]);
      else if (kind === 'attempt_single') respond(cdp, p.requestId, REVIEW_ATTEMPT);
      else if (kind === 'answers') respond(cdp, p.requestId, REVIEW_ANSWERS);
      else if (kind === 'attempt_patch') respondEmpty(cdp, p.requestId);
      else if (kind === 'subjects') respond(cdp, p.requestId, []);
      return;
    }

    // cold: auth + profile resolve immediately; data endpoints hold until released
    if (kind === 'token') respond(cdp, p.requestId, refreshBody(userId));
    else if (kind === 'user') respond(cdp, p.requestId, { id: userId, aud: 'authenticated', role: 'authenticated', email: userId + '@test.dev' });
    else if (kind === 'users') respond(cdp, p.requestId, makeUser(userId, exam));
    else if (kind === 'attempt_patch') respondEmpty(cdp, p.requestId);
    else if (kind === 'subjects') respond(cdp, p.requestId, []);
    else if (released) serveData(cdp, p.requestId, kind, exam);
    else if (kind === 'attempts') held.push({ requestId: p.requestId, kind: 'attempts' });
    else if (kind === 'configs') held.push({ requestId: p.requestId, kind: 'configs' });
    else if (kind === 'papers') held.push({ requestId: p.requestId, kind: 'papers' });
    else if (kind === 'attempt_single') held.push({ requestId: p.requestId, kind: 'attempt_single' });
    else if (kind === 'answers') held.push({ requestId: p.requestId, kind: 'answers' });
  });

  // serve data endpoints immediately (used both for warm and after release)
  function serveData(cdp2, requestId, kind, exam2) {
    if (kind === 'attempts') respond(cdp2, requestId, exam2 === 'appsc' ? ATTEMPTS : BANK_ATTEMPTS);
    else if (kind === 'configs') respond(cdp2, requestId, exam2 === 'appsc' ? CONFIGS : BANK_CONFIGS);
    else if (kind === 'papers') respond(cdp2, requestId, exam2 === 'appsc' ? PAPERS : [{ id: 'BP1', exam_id: 'BANK_EXAMS', paper_name: 'Quantitative Aptitude' }]);
    else if (kind === 'attempt_single') respond(cdp2, requestId, REVIEW_ATTEMPT);
    else if (kind === 'answers') respond(cdp2, requestId, REVIEW_ANSWERS);
    else return cdp2.send('Fetch.continueRequest', { requestId }).catch(() => {});
  }

  // seed + metrics + fetch interception
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' });
  await cdp.send('Emulation.setEmulatedMedia', {
    media: '',
    features: reducedMotion ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
  });
  await cdp.send('Fetch.enable', {
    patterns: [
      { urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' },
      { urlPattern: 'http://localhost:5173/*', requestStage: 'Response' },
    ],
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      localStorage.setItem('theme', ${JSON.stringify(theme)});
      localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken(userId))});
      if (${warm ? 'false' : 'true'}) sessionStorage.clear();
    `,
  });

  const v = Date.now() + Math.floor(Math.random() * 100000);
  await cdp.send('Page.navigate', { url: `${APP}${route}?v=${v}` });

  // poll until the history skeleton appears (auth may take a few seconds; data stays held so the skeleton persists).
  // Auth occasionally flakes to guest mode (a network-layer race in the harness mock); re-navigate once to self-heal.
  let skeleton = null;
  let polled = false;
  for (let attempt = 0; attempt < 2 && !polled; attempt++) {
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const probe = await evaluate(cdp, hasHistorySkeleton);
      if (probe && probe.has) { polled = true; break; }
    }
    if (!polled && attempt === 0) {
      const nav = Date.now() + Math.floor(Math.random() * 100000);
      await cdp.send('Page.navigate', { url: `${APP}${route}?v=${nav}` });
    }
  }
  skeleton = await evaluate(cdp, measureSkeleton);
  if (!polled) {
    const debug = await evaluate(cdp, `(() => { const s = [...document.querySelectorAll('[role="status"]')].map((e) => ({ label: e.getAttribute('aria-label') || '', text: e.textContent.trim().slice(0, 40) })); return { body: document.body.innerText.slice(0, 300), statuses: s }; })`);
    console.log('SKELETON NEVER APPEARED', JSON.stringify(debug), 'console:', JSON.stringify(consoleLogs.filter((l) => /error|fail|lost|profile|boot/i.test(l)).slice(-10)));
  }
  const release = () => {
    if (released) return Promise.resolve();
    released = true;
    return Promise.all(held.map((h) => serveData(cdp, h.requestId, h.kind, exam)));
  };

  const out = { spec: { width, theme, exam, reducedMotion, route, warm }, skeleton };
  await release();
  await new Promise((r) => setTimeout(r, 2500));
  const final = await evaluate(cdp, measureFinal);
  out.final = final;

  cdp.close();
  await closeTarget(targetId);
  return out;
}

function makeUser(userId, exam) {
  return {
    id: userId,
    email: userId + '@test.dev',
    full_name: exam === 'appsc' ? 'Test APPSC User' : 'Test Bank User',
    role: 'user',
    exam_selection: exam === 'appsc' ? 'APPSC_GROUPS' : 'BANK_EXAMS',
    sub_admin_id: null,
    educator_id: null,
    is_active: true,
    email_verified: true,
    coupon_code_used: false,
    created_at: '2026-01-01T00:00:00Z',
  };
}

async function evaluate(cdp, fn) {
  const res = await cdp.send('Runtime.evaluate', { expression: `(${fn.toString()})()`, returnByValue: true });
  if (res.exceptionDetails) return { error: res.exceptionDetails.text };
  return res.result.value;
}

const hasHistorySkeleton = () => {
  const s = [...document.querySelectorAll('[role="status"]')];
  return { has: s.some((e) => (e.getAttribute('aria-label') || '').includes('Loading history')) };
};

const measureSkeleton = () => {
  const status = [...document.querySelectorAll('[role="status"]')].map((e) => ({
    label: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 40),
  }));
  const region = document.querySelector('[role="status"]');
  const selection = region ? region.querySelector('.selection-surface') : null;
  const selectionInfo = selection
    ? (() => {
        const r = selection.getBoundingClientRect();
        const pills = [...selection.querySelectorAll('.shrink-0')];
        const rows = [...selection.querySelectorAll('div.overflow-x-auto')].map((o) => {
          const pr = o.getBoundingClientRect();
          return { h: pr.height };
        });
        return { height: Math.round(r.height), width: Math.round(r.width), radius: getComputedStyle(selection).borderRadius, pillCount: pills.length, rows };
      })()
    : null;

  const cards = region
    ? [...region.querySelectorAll('div[aria-hidden="true"]')].filter((e) => e.parentElement && e.parentElement.className === 'h-full')
    : [];
  const grid = cards[0] ? cards[0].parentElement.parentElement : null;
  const gridInfo = grid
    ? (() => {
        const cs = getComputedStyle(grid);
        return { cols: cs.gridTemplateColumns.split(' ').length, gap: cs.columnGap };
      })()
    : null;

  const cardInfo = cards.slice(0, 2).map((c) => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    const headerRow = c.children[0];
    const badge = headerRow ? headerRow.children[0] : null;
    const icon = headerRow ? headerRow.children[1] : null;
    const footer = c.lastElementChild;
    const fcs = footer ? getComputedStyle(footer) : null;
    return {
      height: Math.round(r.height),
      radius: cs.borderRadius,
      padTop: cs.paddingTop,
      padLeft: cs.paddingLeft,
      bg: cs.backgroundColor,
      borderColor: cs.borderColor,
      borderWidth: cs.borderTopWidth,
      animation: cs.animationDuration,
      badge: badge ? { w: badge.getBoundingClientRect().width, h: badge.getBoundingClientRect().height, r: getComputedStyle(badge).borderRadius } : null,
      icon: icon ? { w: icon.getBoundingClientRect().width, h: icon.getBoundingClientRect().height, r: getComputedStyle(icon).borderRadius } : null,
      footerDivider: fcs ? { color: fcs.borderTopColor, width: fcs.borderTopWidth } : null,
    };
  });

  return { status, selection: selectionInfo, grid: gridInfo, cards: cardInfo, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
};

const measureFinal = () => {
  const status = [...document.querySelectorAll('[role="status"]')].map((e) => ({
    label: e.getAttribute('aria-label') || '',
  }));
  const selection = [...document.querySelectorAll('.selection-surface')].find((el) => el.querySelector('[role="tab"]'));
  const selectionInfo = selection
    ? (() => {
        const r = selection.getBoundingClientRect();
        const pills = [...selection.querySelectorAll('[role="tab"]')];
        const rows = [...selection.querySelectorAll('div.overflow-x-auto')].map((o) => ({ h: o.getBoundingClientRect().height }));
        return { height: Math.round(r.height), pillCount: pills.length, rows };
      })()
    : null;

  const cards = [...document.querySelectorAll('[role="button"]')].filter((e) => (e.getAttribute('aria-label') || '').includes('View full review'));
  const cardInfo = cards.slice(0, 2).map((c) => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    const headerRow = c.children[0];
    const badge = headerRow ? headerRow.children[0] : null;
    const icon = headerRow ? headerRow.children[1] : null;
    const footer = c.lastElementChild;
    const fcs = footer ? getComputedStyle(footer) : null;
    return {
      height: Math.round(r.height),
      radius: cs.borderRadius,
      padTop: cs.paddingTop,
      bg: cs.backgroundColor,
      borderColor: cs.borderColor,
      badge: badge ? { w: Math.round(badge.getBoundingClientRect().width), h: badge.getBoundingClientRect().height, r: getComputedStyle(badge).borderRadius } : null,
      icon: icon ? { w: icon.getBoundingClientRect().width, h: icon.getBoundingClientRect().height, r: getComputedStyle(icon).borderRadius } : null,
      footerDivider: fcs ? { color: fcs.borderTopColor, width: fcs.borderTopWidth } : null,
    };
  });

  const grid = cards[0] ? cards[0].parentElement : null;
  const gridInfo = grid ? (() => { const cs = getComputedStyle(grid); return { cols: cs.gridTemplateColumns.split(' ').length, gap: cs.columnGap }; })() : null;

  return { status, selection: selectionInfo, grid: gridInfo, cards: cardInfo, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
};

const measureReview = () => {
  const status = [...document.querySelectorAll('[role="status"]')].map((e) => ({ label: e.getAttribute('aria-label') || '' }));
  const spinners = document.querySelectorAll('.animate-spin').length;
  const header = document.querySelector('.rounded-\\[32px\\]');
  const headerInfo = header
    ? (() => {
        const r = header.getBoundingClientRect();
        const cs = getComputedStyle(header);
        return { height: Math.round(r.height), width: Math.round(r.width), radius: cs.borderRadius, bg: cs.backgroundColor };
      })()
    : null;
  const statBlocks = header ? [...header.querySelectorAll('[class*="grid-cols"]')].map((g) => ({ children: g.children.length, cls: g.className })) : null;
  const group = document.querySelector('[role="group"]');
  const pills = group ? group.children.length : 0;
  const questionRows = document.querySelectorAll('div.sm\\:ml-16.p-8').length;
  return { status, spinners, header: headerInfo, statBlocks, pills, questionRows, totalSkeletonDivs: questionRows };
};

async function clickReviewCard(cdp) {
  const res = await cdp.send('Runtime.evaluate', {
    expression: `(() => { const c = document.querySelector('[role="button"][aria-label*="View full review"]'); if (!c) return false; c.click(); return true; })()`,
    returnByValue: true,
  });
  return res.result.value;
}

// ─── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const which = process.argv[2] || 'all';
  const results = {};

  async function historyScenario(w, theme, exam, rm, warm) {
    const key = `${w}x${theme}${exam === 'appsc' ? '' : '-nonappsc'}${rm ? '-rm' : ''}${warm ? '-warm' : ''}`;
    const out = await runScenario({ width: w, theme, exam, reducedMotion: rm, warm, route: '/history' });
    results['history-' + key] = out;
    console.log('DONE history-' + key);
  }

  async function reviewScenario(w, theme, rm) {
    const key = `${w}x${theme}${rm ? '-rm' : ''}`;
    // load history first (cold, released), then click card; hold review endpoints via a second phase
    const out = await runScenario({ width: w, theme, reducedMotion: rm, route: '/history' });
    // The runScenario above released and closed. For review we need a persisted tab; instead re-open and go straight to /review.
    const t = await newTarget();
    const cdp = new CDP(t.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await cdp.send('Emulation.setEmulatedMedia', { media: '', features: rm ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      localStorage.setItem('theme', ${JSON.stringify(theme)});
      localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
      sessionStorage.clear();
    `});
    let held = [];
    let released = false;
    cdp.on('Fetch.requestPaused', async (p) => {
      const url = p.request.url;
      if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      if (p.resourceType === 'preflight' || (p.request.headers && p.request.headers['access-control-request-method'])) {
        return respondEmpty(cdp, p.requestId, 204);
      }
      let kind = null;
      if (url.includes('/auth/v1/token')) kind = 'token';
      else if (url.includes('/auth/v1/user')) kind = 'user';
      else if (url.includes('/rest/v1/users')) kind = 'users';
      else if (url.includes('/rest/v1/attempt_answers')) kind = 'answers';
      else if (url.includes('/rest/v1/attempts')) kind = isAttemptSingle(url) ? 'attempt_single' : 'attempts';
      else if (url.includes('/rest/v1/exam_configs')) kind = 'configs';
      else if (url.includes('/rest/v1/exam_papers')) kind = 'papers';
      else return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      if (kind === 'token') respond(cdp, p.requestId, refreshBody('u_appsc'));
      else if (kind === 'user') respond(cdp, p.requestId, { id: 'u_appsc', aud: 'authenticated', role: 'authenticated', email: 'u_appsc@test.dev' });
      else if (kind === 'users') respond(cdp, p.requestId, makeUser('u_appsc', 'appsc'));
      else if (kind === 'attempts') respond(cdp, p.requestId, ATTEMPTS);
      else if (kind === 'configs') respond(cdp, p.requestId, CONFIGS);
      else if (kind === 'papers') respond(cdp, p.requestId, PAPERS);
      else if (kind === 'attempt_single') { if (released) respond(cdp, p.requestId, REVIEW_ATTEMPT); else held.push({ requestId: p.requestId, kind: 'attempt_single' }); }
      else if (kind === 'answers') { if (released) respond(cdp, p.requestId, REVIEW_ANSWERS); else held.push({ requestId: p.requestId, kind: 'answers' }); }
    });
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
    const v = Date.now() + Math.floor(Math.random() * 100000);
    await cdp.send('Page.navigate', { url: `${APP}/history?v=${v}` });
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const ready = await evaluate(cdp, `(() => { const t = document.querySelector('[role="tab"]'); return { has: !!t }; })`);
      if (ready && ready.has) break;
    }
    await new Promise((r) => setTimeout(r, 500)); // let final content settle
    const clicked = await clickReviewCard(cdp);
    await new Promise((r) => setTimeout(r, 1500)); // route chunk + review mount, held => ReviewSkeleton
    const skel = await evaluate(cdp, measureReview);
    if (!released) {
      released = true;
      await Promise.all(held.map((h) => {
        if (h.kind === 'attempt_single') respond(cdp, h.requestId, REVIEW_ATTEMPT);
        else respond(cdp, h.requestId, REVIEW_ANSWERS);
      }));
    }
    await new Promise((r) => setTimeout(r, 2500));
    const fin = await evaluate(cdp, measureReviewFinal);
    cdp.close();
    await closeTarget(t.id);
    results['review-' + key] = { skeleton: skel, final: fin };
    console.log('DONE review-' + key);
  }

  const measureReviewFinal = () => {
    const status = [...document.querySelectorAll('[role="status"]')].map((e) => ({ label: e.getAttribute('aria-label') || '' }));
    const spinners = document.querySelectorAll('.animate-spin').length;
    const header = document.querySelector('.rounded-\\[32px\\]');
    const headerInfo = header ? (() => { const r = header.getBoundingClientRect(); return { height: Math.round(r.height), text: header.textContent.trim().slice(0, 30) }; })() : null;
    const statBlocks = header ? [...header.querySelectorAll('[class*="grid-cols"]')].map((g) => ({ children: g.children.length })) : null;
    const pills = document.querySelectorAll('[role="group"] button').length;
    const questions = [...document.querySelectorAll('h4')].filter((h) => (h.textContent || '').includes('?')).length;
    return { status, spinners, header: headerInfo, statBlocks, pills, questions, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  };

  try {
    if (which === 'all' || which === 'history') {
      for (const w of [390, 640, 768, 1024, 1280, 1440]) await historyScenario(w, 'dark', 'appsc', false, false);
      await historyScenario(1280, 'light', 'appsc', false, false);
      await historyScenario(390, 'light', 'appsc', false, false);
      await historyScenario(1280, 'dark', 'bank', false, false);
      await historyScenario(390, 'dark', 'bank', false, false);
      await historyScenario(1280, 'dark', 'appsc', true, false);
    }
    if (which === 'all' || which === 'warm') {
      // warm: open a tab, let history fully load, then reload (cache persists)
      const t = await newTarget();
      const cdp = new CDP(t.webSocketDebuggerUrl);
      await cdp.open();
      const warmTargetId = t.id;
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('sb-xbjhlfwqmcyatblsrhxn-auth-token', ${JSON.stringify(sessionToken('u_appsc'))});
        if (sessionStorage.getItem('__warmTrack') === '1') {
          sessionStorage.setItem('__warmSk', 'none');
          const m = () => {
            const s = [...document.querySelectorAll('[role="status"]')].map((e) => e.getAttribute('aria-label') || '');
            if (s.some((x) => x.includes('Loading history'))) sessionStorage.setItem('__warmSk', 'skeleton');
            else if (!s.length) sessionStorage.setItem('__warmSk', 'none');
          };
          m();
          setInterval(m, 50);
          try { new MutationObserver(m).observe(document.body, { childList: true, subtree: true }); } catch {}
        }
      `});
      cdp.on('Fetch.requestPaused', async (p) => {
        const url = p.request.url;
        if (!url.includes('supabase.co')) return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
        if (p.resourceType === 'preflight' || (p.request.headers && p.request.headers['access-control-request-method'])) {
          return respondEmpty(cdp, p.requestId, 204);
        }
        if (url.includes('/auth/v1/token')) return respond(cdp, p.requestId, refreshBody('u_appsc'));
        if (url.includes('/auth/v1/user')) return respond(cdp, p.requestId, { id: 'u_appsc', aud: 'authenticated', role: 'authenticated', email: 'u_appsc@test.dev' });
        if (url.includes('/rest/v1/users')) return respond(cdp, p.requestId, makeUser('u_appsc', 'appsc'));
        if (url.includes('/rest/v1/attempts') && !isAttemptSingle(url)) return respond(cdp, p.requestId, ATTEMPTS);
        if (url.includes('/rest/v1/attempt_answers')) return respond(cdp, p.requestId, REVIEW_ANSWERS);
        if (url.includes('/rest/v1/attempts') && isAttemptSingle(url)) return respond(cdp, p.requestId, REVIEW_ATTEMPT);
        if (url.includes('/rest/v1/exam_configs')) return respond(cdp, p.requestId, CONFIGS);
        if (url.includes('/rest/v1/exam_papers')) return respond(cdp, p.requestId, PAPERS);
        return cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      });
      await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*://xbjhlfwqmcyatblsrhxn.supabase.co/*', requestStage: 'Request' }] });
      const v = Date.now() + 1;
      await cdp.send('Page.navigate', { url: `${APP}/history?v=${v}` });
      for (let i = 0; i < 50; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const ready = await evaluate(cdp, `(() => { const t = document.querySelector('[role="tab"]'); return { has: !!t }; })`);
        if (ready && ready.has) break;
      }
      await new Promise((r) => setTimeout(r, 500)); // fully loaded, cache populated
      await evaluate(cdp, `(() => { sessionStorage.setItem('__warmTrack', '1'); return true; })`);
      await cdp.send('Page.navigate', { url: `${APP}/history?v=${v + 1}` }); // SPA reload, cache warm
      await new Promise((r) => setTimeout(r, 3000));
      const warmFlash = await evaluate(cdp, `(() => sessionStorage.getItem('__warmSk'))`);
      const warm = await evaluate(cdp, measureSkeleton);
      // also grab final
      const fin = await evaluate(cdp, measureFinal);
      results['history-warm-1280'] = { skeleton: warm, final: fin, warmFlash }; // warmFlash: 'skeleton' if a skeleton ever appeared on warm reload, else 'none'
      console.log('DONE history-warm-1280');
      cdp.close();
      await closeTarget(warmTargetId);
    }
    if (which === 'all' || which === 'review') {
      await reviewScenario(1280, 'dark', false);
      await reviewScenario(390, 'dark', false);
      await reviewScenario(768, 'light', false);
      await reviewScenario(1280, 'dark', true);
    }
  } catch (e) {
    console.error('FATAL', e);
  }

  console.log('\n===== RESULTS =====');
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
