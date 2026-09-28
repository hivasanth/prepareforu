import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { composeBulkUploadPrompt } from './promptComposer'
import { buildCanonicalOutputContract, QUESTION_OUTPUT_CONTRACT_VERSION } from './dynamicOutputContract'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'
import { sanitizeLegacyApplicationFormat, stripGenericVisualTeaching } from './promptContentSanitizer'
import { BulkQuestionSchema } from '../../validations/questionSchema'

// Project-wide prompt corpus enforcement (42-section FINAL HARDENING + Phase 2
// generic-visual normalization).
//
// Source of truth for ALL 171 Admin Bulk Upload prompt_templates rows (the
// 33 repo-shipped bodies AND the 138 live-only bodies): the LATEST canonical
// storage migration (20260928000000_prompts_generic_visual_removal.sql), whose
// UPDATE bodies are the final stored text a migrated database holds. On top of
// the Phase-1 guarantees (marker-bearing, token-free, single contract) this
// migration removed the GENERIC application-level visual teaching — the
// alternating heading families that duplicated the dynamic output contract:
// `# VISUAL QUALITY RULES`, the GOOD/BAD VISUAL EXAMPLE(S) sections, the
// `# SUPPORTED VISUAL TYPES` enum scaffold, the `# VISUAL GENERATION
// REQUIREMENT` opener/objective/target prose and the `VISUAL ENGINE RULES`
// renderer bans — while preserving every byte of topic-specific visual
// guidance. Because every corpus body is also assertable to be FIXED POINT of
// stripGenericVisualTeaching, a future edit that reintroduces any generic
// heading fails CI.

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260928000000_prompts_generic_visual_removal.sql'
)

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

interface CorpusPrompt {
  id: string
  body: string
  md5: string
}

function loadCorpus(): CorpusPrompt[] {
  const sql = readFileSync(MIGRATION_PATH, 'utf8')
  const parts = sql.split('$rem$')
  const out: CorpusPrompt[] = []
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const body = parts[i]
    const suffix = parts[i + 1]
    const idm = /WHERE id = '([0-9a-f-]+)'/.exec(suffix)
    const md5m = /AND md5\(prompt_text\) = '([0-9a-f]{32})'/.exec(suffix)
    if (idm) out.push({ id: idm[1], body, md5: md5m?.[1] ?? '' })
  }
  return out
}

function extractFenced(text: string): string[] {
  const re = /```(?:json)?\s*\n([\s\S]*?)\n```/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

function composedTokenFree(composed: string, label: string, tokens: string[]): void {
  for (const tok of tokens) {
    expect(composed, `${label}: composed prompt still contains "${tok}"`).not.toContain(tok)
  }
}

describe('Project-wide corpus: all 171 prompt_templates bodies', () => {
  let corpus: CorpusPrompt[]

  beforeAll(() => {
    corpus = loadCorpus()
  })

  it('loads exactly the 171 normalized bodies with md5 guards', () => {
    expect(corpus.length).toBe(171)
    expect(corpus.every(p => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(p.id))).toBe(true)
    expect(corpus.every(p => /^[0-9a-f]{32}$/.test(p.md5))).toBe(true)
  })

  it('the sanitizer fully cleanses every stored body of legacy tokens', () => {
    for (const p of corpus) {
      const clean = sanitizeLegacyApplicationFormat(p.body)
      composedTokenFree(clean, p.id, FORBIDDEN_LEGACY_TOKENS)
      // Academic content must survive the scrub — bodies are all multi-KB.
      expect(clean.length, `${p.id}: academic content must survive`).toBeGreaterThan(1000)
    }
  })

  it('the duplicated # VISUAL QUALITY EXAMPLES block is removed from every stored body', () => {
    // The dynamic contract owns that teaching EXACTLY ONCE; the stored topic
    // body must not repeat it (nor its closing # VISUAL VALIDATION checklist).
    for (const p of corpus) {
      expect(p.body, `${p.id}: duplicated # VISUAL QUALITY EXAMPLES must be gone`).not.toContain('# VISUAL QUALITY EXAMPLES')
      expect(p.body, `${p.id}: duplicated # VISUAL VALIDATION checklist must be gone`).not.toContain('# VISUAL VALIDATION')
    }
  })

  it('topic-specific visual guidance survives the cleanup', () => {
    // The per-topic VISUAL OPPORTUNITY MATRIX (maps/tables that genuinely aid
    // THAT topic) is topic content and stays; only the duplicated template
    // teaching was removed.
    const withMatrix = corpus.filter(b => b.body.includes('# VISUAL OPPORTUNITY MATRIX'))
    expect(withMatrix.length).toBe(50)
    // Unique topic-specific sections that once sat inside the removed span are
    // preserved verbatim.
    const cavr = corpus.filter(b => b.body.includes('# CURRENT AFFAIRS VALIDATION RULE'))
    const mur = corpus.filter(b => b.body.includes('# MAP USAGE RULES'))
    expect(cavr.length).toBe(1)
    expect(mur.length).toBe(1)
    expect(cavr[0]!.body).toContain('Event falls within the latest rolling 12–18 months')
    expect(mur[0]!.body).not.toContain('# VISUAL QUALITY EXAMPLES')
  })

  it('every stored body is a FIXED POINT of stripGenericVisualTeaching', () => {
    // The Phase-2 migration already converges the stored bytes; re-running the
    // canonical helper must be byte-idempotent on every one of the 171 bodies.
    for (const p of corpus) {
      expect(stripGenericVisualTeaching(p.body), `${p.id}: stored body must be a fixed point of stripGenericVisualTeaching`).toBe(p.body)
    }
  })

  it('the generic visual-teaching families are eliminated or contracted to their canonical headings', () => {
    const hasGenericQuality = corpus.filter(b => /^#\s+VISUAL QUALITY RULES\s*$/m.test(b.body))
    const hasExemplars = corpus.filter(b => /^#\s+(?:[✅❌]\uFE0F?\s*)?(?:GOOD|BAD) VISUAL EXAMPLE(?:S)?\s*$/mu.test(b.body))
    const hasSupported = corpus.filter(b => /^#\s+SUPPORTED VISUAL TYPES\s*$/m.test(b.body))
    const hasGenExact = corpus.filter(b => /^#\s+VISUAL GENERATION REQUIREMENT\s*$/m.test(b.body))
    const hasEngine = corpus.filter(b => /^#\s+(?:[🖼⚙]\uFE0F?\s*)?VISUAL ENGINE (?:RULES|REQUIREMENT)(?:\s*\(MANDATORY\))?\s*$/mu.test(b.body))
    expect(hasGenericQuality.length).toBe(0)
    expect(hasExemplars.length).toBe(0)
    expect(hasSupported.length).toBe(0)
    expect(hasGenExact.length).toBe(0)
    expect(hasEngine.length).toBe(1) // only the fully topic-specific (MANDATORY) visual-centric engine section survives verbatim
  })

  it('generic visual teaching exists EXACTLY ONCE — in the contract, not the stored bodies', () => {
    const countLines = (re: RegExp): number =>
      corpus.reduce((n, b) => n + b.body.split('\n').filter(l => re.test(l.trim())).length, 0)
    const coverageLines = countLines(/^#\s+VISUAL COVERAGE TARGET\s*$/mu)
    const usageLines = countLines(/^#\s+VISUAL USAGE GUIDANCE FOR THIS TOPIC\s*$/mu)
    const opportunityLines = countLines(/^#\s+VISUAL OPPORTUNITIES FOR THIS TOPIC\s*$/mu)
    expect(coverageLines).toBe(40)
    expect(usageLines).toBe(51)
    expect(opportunityLines).toBe(64)
    // The renamed section keeps the topic's per-type opportunities.
    const withUseFor = corpus.filter(b => /^# VISUAL OPPORTUNITIES FOR THIS TOPIC\s*$/m.test(b.body) && b.body.includes('Use for:'))
    expect(withUseFor.length).toBeGreaterThan(0)
  })

  it('the bespoke topic-specific visual sections survive verbatim', () => {
    // Data Interpretation "Visual Mandatory": zero generic lines, so the whole
    // section (heading included) passes through untouched.
    const mandatory = corpus.filter(b => b.body.includes('# VISUAL GENERATION REQUIREMENT (MANDATORY)'))
    expect(mandatory.length).toBe(1)
    expect(mandatory[0]!.body).toContain('Data Interpretation is inherently visual')
    expect(mandatory[0]!.body).not.toContain('The AI must intelligently')
    // The visual-centric engine section carries the topic's own chart list.
    const engine = corpus.filter(b => b.body.includes('# 🖼 VISUAL ENGINE RULES (MANDATORY)'))
    expect(engine.length).toBe(1)
    expect(engine[0]!.body).toContain('visual-centric')
    // Topic-specific coverage targets (e.g. the ~10%-20% banking family) kept.
    const coveragePercent = corpus.filter(b => /# VISUAL COVERAGE TARGET\s*$/m.test(b.body) && /\d{2}%–\d{2}%/.test(b.body))
    expect(coveragePercent.length).toBeGreaterThan(0)
  })

  it('stored bodies carry NO application-level validation checklists — the ONE engine is the contract', () => {
    // PART 12/14: application-level validation text belongs exclusively to the
    // dynamic output contract's engine (PHASE 7 A-I, bilingual, JSON validity).
    // Every generated tip stored in the migration agrees — none of the generic
    // checklists (## Visual / Bilingual / JSON Validation) that once sat under
    // # FINAL VALIDATION CHECKLIST survive in the stored bodies.
    for (const p of corpus) {
      expect(p.body, `${p.id}: ## Visual Validation / Bilingual Validation / JSON Validation must be stripped`).not.toMatch(
        /^## (?:Visual|Bilingual|JSON) Validation\s*$/m
      )
    }
    // Topic-specific distribution checklists inside the same sections stay —
    // they are the topic's own count/coverage/difficulty teaching.
    const kept = corpus.filter(b => /^## (?:Quantity|Coverage|Difficulty|Question Quality) Validation\s*$/m.test(b.body))
    expect(kept.length).toBeGreaterThan(0)
  })

  it('every FINAL COMPOSED prompt: EXACTLY one canonical contract, no marker, zero legacy tokens', () => {
    const contractHeader = `CANONICAL OUTPUT CONTRACT v${QUESTION_OUTPUT_CONTRACT_VERSION}`
    for (const p of corpus) {
      const composed = composeBulkUploadPrompt(p.body, { topic_en: 'Sample Topic', topic_te: 'నమూనా అంశం' }).text
      expect((composed.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length, `${p.id}: contract must appear exactly once`).toBe(1)
      expect(composed).toContain(contractHeader)
      expect(composed, `${p.id}: internal marker must never reach the AI`).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
      composedTokenFree(composed, p.id, FORBIDDEN_LEGACY_TOKENS)
    }
  })

  it('every composed prompt ships ONE self-verification engine: heading + closing tag exactly once, no legacy rule list', () => {
    for (const p of corpus) {
      const composed = composeBulkUploadPrompt(p.body, { topic_en: 'Sample Topic', topic_te: 'నమూనా అంశం' }).text
      expect((composed.match(/## ITERATIVE SELF-VERIFICATION ENGINE/g) ?? []).length,
        `${p.id}: one engine per composed prompt`).toBe(1)
      expect((composed.match(/<ITERATIVE_SELF_VERIFICATION_ENGINE>/g) ?? []).length,
        `${p.id}: one engine closing tag per composed prompt`).toBe(1)
      expect((composed.match(/## STRICT PASS CONDITION/g) ?? []).length,
        `${p.id}: one strict pass condition`).toBe(1)
      expect((composed.match(/## FINAL OUTPUT RULE/g) ?? []).length,
        `${p.id}: one final output rule`).toBe(1)
      expect(composed, `${p.id}: no legacy VALIDATION RULES list may survive composition`).not.toContain('## VALIDATION RULES')
    }
  })

  it('every composed prompt embeds the canonical contract BYTE-IDENTICAL exactly once', () => {
    const contractBlock = buildCanonicalOutputContract()
    for (const p of corpus) {
      const composed = composeBulkUploadPrompt(p.body).text
      expect(composed, `${p.id}: canonical contract bytes must be embedded verbatim`).toContain(contractBlock)
      expect((composed.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length, `${p.id}: contract header exactly once`).toBe(1)
    }
  })

  it('the single taught schema = the canonical example and it parses through BulkQuestionSchema', () => {
    // The byte-identity assertion above proves every composed prompt teaches
    // exactly the contract's schema set (1 question example, 8 visual examples,
    // 1 envelope). Parsing the contract directly is therefore equivalent to
    // parsing any composed corpus prompt, without nested-fence ambiguity.
    const contractBlock = buildCanonicalOutputContract()
    const blocks = extractFenced(contractBlock).map(b => {
      try { return JSON.parse(b) as Record<string, unknown> } catch { return null }
    })
    const examples = blocks.filter(b => !!b && 'correct_option' in b)
    expect(examples.length).toBe(1)
    const r = BulkQuestionSchema.safeParse(examples[0]!)
    expect(r.success).toBe(true)
  })
})

describe('Multi-topic composition: LOBE identity distinct, contract byte-identical', () => {
  // One representative topic per mandated family (ancient history, early
  // medieval south-India dynasties, science, polity, economy, language, other).
  const TOPICS = [
    { topic_en: 'Ancient Indian History', topic_te: 'ప్రాచీన భారతదేశ చరిత్ర' },
    { topic_en: 'Early Medieval India and South Indian Dynasties', topic_te: 'ప్రారంభ మధ్యయుగ భారతదేశం మరియు దక్షిణ భారత రాజవంశాలు' },
    { topic_en: 'Indian Space Programme, ISRO', topic_te: 'భారత అంతరిక్ష కార్యక్రమం, ఇస్రో' },
    { topic_en: 'Indian Constitution', topic_te: 'భారత రాజ్యాంగం' },
    { topic_en: 'Indian Economy', topic_te: 'భారతీయ ఆర్థిక వ్యవస్థ' },
    { topic_en: 'Telugu Synonyms and Antonyms', topic_te: 'పర్యాయపదాలు మరియు వ్యతిరేక పదాలు' },
    { topic_en: 'Computer Knowledge for Bank Exams', topic_te: 'బ్యాంకు పరీక్షలకు కంప్యూటర్ జ్ఞానం' },
  ]
  const BASE_BODY = '# Representative topic syllabus\nGenerate exactly 10 MCQs.'

  const composedFor = (t: { topic_en: string; topic_te: string }): string =>
    composeBulkUploadPrompt(BASE_BODY, t).text

  it('injects a distinct TOPIC IDENTITY block per topic', () => {
    for (const t of TOPICS) {
      const composed = composedFor(t)
      expect(composed).toContain('## TOPIC IDENTITY')
      expect(composed).toContain(`topic_en = "${t.topic_en}"`)
      expect(composed).toContain(`topic_te = "${t.topic_te}"`)
    }
    const identities = TOPICS.map(t => `topic_en = "${t.topic_en}"`)
    expect(new Set(identities).size).toBe(TOPICS.length)
  })

  it('produces a BYTE-IDENTICAL canonical contract across all topics', () => {
    const contracts = TOPICS.map(t => {
      const composed = composedFor(t)
      const at = composed.indexOf('CANONICAL OUTPUT CONTRACT v')
      expect(at).toBeGreaterThan(0)
      return composed.slice(at)
    })
    expect(new Set(contracts).size).toBe(1)
  })

  it('the polity topic composes WITHOUT the old cross-topic example bytes', () => {
    const pol = TOPICS[3]
    const composed = composedFor(pol)
    expect(composed).not.toContain('Polity Basics')
    expect(composed).not.toContain('Ambedkar')
    expect(composed).not.toContain('architect of the Indian Constitution')
  })

  it('the contract example is topic-neutral (placeholder topic names)', () => {
    const composed = composedFor(TOPICS[0])
    expect(composed).toContain('"topic_en": "<COPY topic_en VERBATIM>"')
    expect(composed).toContain('"topic_te": "<COPY topic_te VERBATIM>"')
    for (const t of TOPICS.slice(1)) {
      const c = composedFor(t)
      expect(c).toContain('"topic_en": "<COPY topic_en VERBATIM>"')
    }
  })
})