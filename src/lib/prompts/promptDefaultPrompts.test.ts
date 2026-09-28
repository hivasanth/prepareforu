import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { composeBulkUploadPrompt } from './promptComposer'
import { QUESTION_OUTPUT_CONTRACT_VERSION } from './dynamicOutputContract'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'
import { sanitizeLegacyApplicationFormat, stripGenericVisualTeaching } from './promptContentSanitizer'

// Default prompt tests: the 33 `is_default` rows (the prompts a workspace sees
// when topic prompts are filtered or absent) must satisfy the same composition
// contract as the full corpus: exactly one canonical contract, no internal
// marker leak, zero legacy tokens in the final composed prompt, and zero
// legacy tokens in the STORED at-rest bytes after the consolidated migrations.
// The is_default flag is read from the committed live snapshot
// (scripts/data/prompt_templates_live_v1.jsonl) and the stored bodies from the
// latest canonical migration SQL (Phase 2 — generic visual teaching removed).

const ROOT = process.cwd()
const SEED_PATH = join(ROOT, 'scripts', 'data', 'prompt_templates_live_v1.jsonl')
const MIGRATION_PATH = join(ROOT, 'supabase', 'migrations', '20260928000000_prompts_generic_visual_removal.sql')

const FORBIDDEN_LEGACY_TOKENS = [
  'visual_engine',
  'render_type',
  'headers_en',
  'rows_en',
  'title_en',
  'title_te',
  'metadata',
  'diagram',
]

interface SeedRow {
  id: string
  live_md5: string
  md5: string
  is_default: boolean
  prompt_text: string
}

function md5(text: string): string {
  return createHash('md5').update(text, 'utf8').digest('hex')
}

function loadSeed(): SeedRow[] {
  return readFileSync(SEED_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l) as SeedRow)
}

function loadStoredBodies(): Map<string, string> {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')
  const parts = sql.split('$rem$')
  const out = new Map<string, string>()
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const body = parts[i]
    const idm = /WHERE id = '([0-9a-f-]+)'/.exec(parts[i + 1])
    if (idm) out.set(idm[1], body)
  }
  return out
}

describe('Default prompts (is_default): seed definition', () => {
  let rows: SeedRow[]

  beforeAll(() => {
    rows = loadSeed()
  })

  it('the live snapshot carries exactly 33 default prompts of 171', () => {
    expect(rows.length).toBe(171)
    const defaults = rows.filter(r => r.is_default)
    expect(defaults.length).toBe(33)
    expect(new Set(defaults.map(r => r.id)).size).toBe(33)
  })

  it('default rows are self-consistent snapshot records', () => {
    for (const r of rows.filter(x => x.is_default)) {
      expect(md5(r.prompt_text), `${r.id}: md5 must match stored bytes`).toBe(r.md5)
      expect(r.live_md5, `${r.id}: live_md5 fingerprint valid`).toMatch(/^[0-9a-f]{32}$/)
      expect(r.prompt_text.length, `${r.id}: default body is unexpectedly short`).toBeGreaterThan(1000)
    }
  })
})

describe('Default prompts (is_default): stored at-rest cleanliness', () => {
  let bodyBy: Map<string, string>
  let defaults: SeedRow[]

  beforeAll(() => {
    bodyBy = loadStoredBodies()
    defaults = loadSeed().filter(r => r.is_default)
  })

  it('every default prompt has a stored body in the consolidated migration', () => {
    expect(bodyBy.size).toBe(171)
    for (const r of defaults) {
      expect(bodyBy.has(r.id), `${r.id}: default prompt missing from migration corpus`).toBe(true)
    }
  })

  it('default stored bodies contain zero legacy tokens at rest', () => {
    for (const r of defaults) {
      const body = bodyBy.get(r.id)!
      for (const tok of FORBIDDEN_LEGACY_TOKENS) {
        expect(body, `${r.id}: stored body still contains "${tok}"`).not.toContain(tok)
      }
    }
  })

  it('default stored bodies are stable under the runtime sanitizer (idempotent)', () => {
    for (const r of defaults) {
      const body = bodyBy.get(r.id)!
      const resanitized = sanitizeLegacyApplicationFormat(body)
      expect(resanitized, `${r.id}: sanitizing an already-clean stored body must not change it`).toBe(body)
    }
  })

  it('default stored bodies are fixed points of the Phase-2 generic-visual strip', () => {
    for (const r of defaults) {
      const body = bodyBy.get(r.id)!
      expect(stripGenericVisualTeaching(body), `${r.id}: stored body must be a fixed point of stripGenericVisualTeaching`).toBe(body)
    }
  })
})

describe('Default prompts (is_default): composition contract', () => {
  let defaults: SeedRow[]
  let bodyBy: Map<string, string>

  beforeAll(() => {
    bodyBy = loadStoredBodies()
    defaults = loadSeed().filter(r => r.is_default)
  })

  it('each composed default prompt carries EXACTLY ONE canonical contract and no marker/legacy tokens', () => {
    for (const r of defaults) {
      const body = bodyBy.get(r.id)!
      const composed = composeBulkUploadPrompt(body, { topic_en: 'Sample Topic', topic_te: 'నమూనా అంశం' }).text
      expect(
        (composed.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length,
        `${r.id}: contract must appear exactly once`
      ).toBe(1)
      expect(composed).toContain(`CANONICAL OUTPUT CONTRACT v${QUESTION_OUTPUT_CONTRACT_VERSION}`)
      expect(composed, `${r.id}: internal marker must never reach the AI`).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
      for (const tok of FORBIDDEN_LEGACY_TOKENS) {
        expect(composed, `${r.id}: composed prompt still contains "${tok}"`).not.toContain(tok)
      }
    }
  })

  it('each default body allows marker replacement (injectable) when composed bare', () => {
    for (const r of defaults) {
      const body = bodyBy.get(r.id)!
      const composed = composeBulkUploadPrompt(body).text
      expect((composed.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length, `${r.id}: even bare composition yields one contract`).toBe(1)
    }
  })
})