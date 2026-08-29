#!/usr/bin/env node
/**
 * Phase 6.XB — Foundation Enforcement Audit (Task 32 / D-18x)
 *
 * Static guard that enforces the Foundation-first FINAL RULE: a problem that
 * can be solved once in the Foundation must NOT be re-implemented in consuming
 * component/page code.
 *
 * Findings are reported as:
 *   - ERROR  : breaks a certified contract / color-system rule → exit 1
 *   - WARNING: non-conformant but not a hard violation → exit 0
 *   - CLEAN  : no findings
 *
 * The audit is intentionally conservative: it only flags patterns that are
 * unambiguous duplicates or prevent Foundation reuse. Foundation-owned source
 * files (styles, tokens, the Foundation components themselves) are excluded.
 *
 * Run:  node scripts/foundation-audit.mjs        (default src)
 *       node scripts/foundation-audit.mjs <dir>  (audit another directory)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const IGNORE = new Set(['node_modules', 'dist']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

// Owned by the Foundation — never report on these.
const FOUNDATION_OWNED = [
  'src/styles/',
  'src/index.css',
  'src/components/common/',
  'src/components/ui/',
  'src/canonical/',
];

// Arbitrary Tailwind value that bakes a raw color/shadow/spacing into a page.
// NOTE: var(--…*) references ARE the token system and are always allowed.
// Only bare literals (hex, rgb, bare px) violate the color-system contract.
const ARBITRARY_VALUE = /(?:bg|text|border|ring|shadow|fill|stroke|outline)-\[(?:#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|(?!var\(--)[a-z-]+)\]/;
// Solid hex colors used directly as classnames or inline styles — must come
// from semantic tokens, not hardcoded names.
const HARD_CODED_HEX = /\b(?:bg|text|border|ring|shadow)-\[#[0-9A-Fa-f]{3,8}\]/;
// Arbitrary radius/spacing (px-based) that should use the token ladder.
const ARBITRARY_EUCLIDEAN = /(?:rounded|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap)-\[[0-9]+px\]/;
// Loose shadow definitions duplicating --shadow-card-shadow / --elevation-*.
const LOCAL_SHADOW = /shadow-(default|raised|card):|drop-shadow\(0 (?:1|2|4|8|16)px/;

function isFoundation(file) {
  return FOUNDATION_OWNED.some((p) => file.startsWith(join(ROOT, p)) || file.startsWith(p));
}

function walk(dir, findings) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, findings);
      continue;
    }
    if (!IGNORE.has(entry) && EXT.has(entry.slice(entry.lastIndexOf('.')))) {
      auditFile(full, findings);
    }
  }
}

function auditFile(file, findings) {
  const contents = readFileSync(file, 'utf8');
  const lines = contents.split('\n');
  const check = (re, kind, message, isError) => {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(re);
      if (!match) continue;
      findings.push({ file, line: i + 1, kind, message, isError, raw: match[0].slice(0, 90) });
    }
  };

  const foundation = isFoundation(file);

  // Arbitrary Tailwind — worst in consumers, still flagged in Foundation as WARN.
  check(ARBITRARY_VALUE, 'arbitrary', 'arbitrary Tailwind value (should resolve to a semantic token)', !foundation);

  // Hard-coded hex class — always an ERROR.
  if (!foundation) {
    check(HARD_CODED_HEX, 'hex', 'hard-coded color in classname (must use semantic token)', true);
  }

  // Local shadow definitions duplicating the elevation ladder.
  if (!foundation) {
    check(LOCAL_SHADOW, 'shadow', 'local shadow value (use shadow-card-shadow / elevation tokens)', true);
  }

  // Non-semantic spacing/radius used wholesale.
  if (!foundation) {
    check(ARBITRARY_EUCLIDEAN, 'spacing', 'arbitrary px radius/spacing (use the token ladder)', false);
  }
}

let findings = [];
const target = process.argv[2] ? resolve(ROOT, process.argv[2]) : join(ROOT, 'src');
walk(target, findings);

const errors = findings.filter((f) => f.isError);
const warnings = findings.filter((f) => !f.isError);

for (const f of findings) {
  const tag = f.isError ? 'ERROR' : 'WARN ';
  console.log(`[${tag}] ${f.kind.padEnd(9)} ${f.file.replace(ROOT + '\\', '')}:${f.line}  ${f.message}`);
  if (f.raw) console.log(`          └ ${f.raw}`);
}

console.log('');
console.log(`Foundation audit ${errors.length > 0 ? 'FAILED' : warnings.length > 0 ? 'passed with warnings' : 'CLEAN'} — ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);