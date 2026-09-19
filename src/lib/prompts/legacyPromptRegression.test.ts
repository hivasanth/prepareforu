import { describe, it, expect } from 'vitest'
import { composeBulkUploadPrompt, DYNAMIC_OUTPUT_CONTRACT_MARKER } from './promptComposer'
import { buildCanonicalQuestionExample, buildVisualExample, QUESTION_OUTPUT_CONTRACT_VERSION } from './dynamicOutputContract'
import { BulkQuestionSchema } from '../../validations/questionSchema'
import { normalizeVisualInput } from '../../services/questions/visualNormalizer'
import { SUPPORTED_VISUAL_TYPES } from '../../types/exam.types'

// ─── Phase 19 regression coverage ────────────────────────────────────────────
// Every Admin Bulk Upload category is exercised with REPRESENTATIVE legacy
// prompt snippets that mirror the structural patterns the forensic audit found
// in the stored DB prompt bodies (bilingual visual engines, empty visual_engine
// placeholders, obsolete map `marker` examples, Telugu output structures). The
// assertion contract for every category:
//   1. topic academic content survives byte-for-byte,
//   2. legacy format structures are ABSENT from the final prompt,
//   3. the canonical contract appears EXACTLY once, versioned,
//   4. the internal marker never reaches the AI.

type Flavor = 'map' | 'bilingual' | 'chart' | 'visual-mandatory' | 'telugu'

interface LegacyCategory {
  name: string
  contentMarker: string
  flavor: Flavor
}

const LEGACY_CATEGORIES: LegacyCategory[] = [
  { name: 'Ancient Indian History', contentMarker: 'Indus Valley Civilization; Vedic Age; Mahajanapadas; Jainism and Buddhism; Mauryan and Gupta empires.', flavor: 'map' },
  { name: 'Medieval Indian History', contentMarker: 'Delhi Sultanate; Vijayanagara Empire; Mughal Empire; Bhakti and Sufi movements.', flavor: 'bilingual' },
  { name: 'Modern Indian History', contentMarker: 'European trading companies; 1857 War of Independence; Indian freedom movement; Mahatma Gandhi.', flavor: 'chart' },
  { name: 'Polity', contentMarker: 'Indian Constitution; Fundamental Rights; Parliament; Judiciary; Union and State government.', flavor: 'telugu' },
  { name: 'Economy', contentMarker: 'Basic concepts of economics; economic systems; national income; economic development.', flavor: 'chart' },
  { name: 'Geography', contentMarker: 'Physical features of India; rivers; climate; monsoons; agriculture.', flavor: 'map' },
  { name: 'Science', contentMarker: 'General science; physics, chemistry and biology fundamentals; everyday applications.', flavor: 'bilingual' },
  { name: 'Current Affairs', contentMarker: 'National and international current events; awards; sports; appointments.', flavor: 'visual-mandatory' },
  { name: 'Banking', contentMarker: 'Quantitative aptitude; data interpretation; caselets; numerical ability.', flavor: 'chart' },
  { name: 'Telugu', contentMarker: 'తెలుగు సాహిత్యం; పద్యాలు; అలంకారాలు; ప్రాచీన కవులు; వ్యాకరణం.', flavor: 'telugu' },
]

function fenced(...lines: string[]): string {
  return ['```json', ...lines, '```'].join('\n')
}

function legacyMapExample(): string {
  return fenced('{', '  "type": "marker",', '  "lat": 17.385,', '  "lng": 78.4867,', '  "label": "Hyderabad"', '}')
}

function bilingualVisualEngineExample(): string {
  return fenced(
    '[',
    '  { "question_text_en": "Q?",',
    '    "visual_engine": { "render_type": "table", "title": "T", "title_en": "T", "headers_en": ["A"], "rows_en": [["x"]] }',
    '  }',
    ']'
  )
}

function chartVisualEngineExample(): string {
  return fenced(
    '{"visual_engine": { "render_type": "chart", "title": "Trend", "chartType": "line", "labels": ["2019","2020"], "data_rate": [10, 20] }}'
  )
}

function emptyPlaceholderExample(): string {
  return fenced('{ "topic_en": "Current Affairs", "visual_engine": {} }')
}

function teluguOutputStructure(): string {
  return [
    '## ప్రశ్న నిర్మాణం',
    'ప్రతి ప్రశ్న ఈ నిర్మాణం ప్రకారం ఉండాలి:',
    fenced('{ "question_text_en": "Q?", "question_text_te": "ప్రశ్న?" }'),
  ].join('\n')
}

function buildLegacyPrompt(category: LegacyCategory): string {
  const blocks = [
    `# Prompt (pre-canonical template) - ${category.name}`,
    '# ROLE',
    'You are an expert competitive examination question paper setter for APPSC, UPSC and Banking.',
    '# OBJECTIVE',
    `Generate exactly 25 high-quality MCQs covering: ${category.contentMarker}`,
    '# OUTPUT JSON STRUCTURE',
    'Output must be a valid JSON array of question objects with bilingual fields.',
  ]
  if (category.flavor === 'map' || category.flavor === 'bilingual') blocks.push(legacyMapExample())
  blocks.push(bilingualVisualEngineExample())
  if (category.flavor === 'chart') blocks.push(chartVisualEngineExample())
  if (category.flavor === 'visual-mandatory') blocks.push(emptyPlaceholderExample())
  if (category.flavor === 'telugu') blocks.push(teluguOutputStructure())
  blocks.push('# VISUAL QUALITY REQUIREMENT', 'Use realistic data close to exam patterns.')
  return blocks.join('\n\n')
}

describe('Phase 19: regression across Admin Bulk Upload topic categories', () => {
  for (const category of LEGACY_CATEGORIES) {
    it(`${category.name}: content preserved, legacy format gone, one canonical contract`, () => {
      const raw = buildLegacyPrompt(category)
      const out = composeBulkUploadPrompt(raw).text

      for (const token of ['visual_engine', 'render_type', '"title_en"', '"headers_en"', '"rows_en"', '"type": "marker"']) {
        expect(out, `${category.name}: legacy token "${token}" must be absent`).not.toContain(token)
      }
      expect(out).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
      expect(category.contentMarker.split(';')[0]).toBeTruthy()
      expect(out, `${category.name}: academic content must survive`).toContain(category.contentMarker)
      expect((out.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length).toBe(1)
      expect(out).toContain(`v${QUESTION_OUTPUT_CONTRACT_VERSION}`)
    })
  }
})

// ─── Phase 20: real-output simulation ────────────────────────────────────────
// No live AI is invoked. Instead we prove the strongest simulation available:
// if a model LITERALLY copies the examples the prompt teaches, the resulting
// JSON passes the REAL production parser chain (JSON.parse → normalizeVisualInput
// → BulkQuestionSchema → DB write schema covered in dynamicOutputContract.test).

function extractFencedBlocks(text: string): string[] {
  const out: string[] = []
  const re = /```(?:json)?\s*\n([\s\S]*?)\n```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

describe('Phase 20: taught examples survive the real parser', () => {
  it('every visual example taught by the contract passes normalizeVisualInput', () => {
    const composed = composeBulkUploadPrompt('# Polity\nGenerate 10 MCQs.').text
    const examples = extractFencedBlocks(composed).map(b => {
      try { return JSON.parse(b) } catch { return null }
    }).filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v))

    for (const block of examples) {
      if (typeof block.type === 'string' && (SUPPORTED_VISUAL_TYPES as readonly string[]).includes(block.type)) {
        expect(() => normalizeVisualInput(block), `visual example ${JSON.stringify(block.type)} must parse`).not.toThrow()
      }
    }
  })

  it.each(SUPPORTED_VISUAL_TYPES)('a question echoing the "%s" taught example parses via BulkQuestionSchema', (type) => {
    const taught = buildVisualExample(type)
    const question = buildCanonicalQuestionExample('Polity Basics', null, taught)
    const r = BulkQuestionSchema.safeParse(question)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    if (r.success) expect(r.data.visual?.type).toBe(type)
  })

  it('the canonical question example taught in the contract parses through BulkQuestionSchema', () => {
    const composed = composeBulkUploadPrompt('# Polity\nGenerate 10 MCQs.').text
    const blocks = extractFencedBlocks(composed).map(b => {
      try { return JSON.parse(b) } catch { return null }
    })
    const question = blocks.find((v): v is Record<string, unknown> => !!v && typeof v === 'object' && 'question_text_en' in v)
    expect(question).toBeTruthy()
    const r = BulkQuestionSchema.safeParse(question!)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('composing the 10 legacy categories yields output whose taught examples still parse', () => {
    for (const category of LEGACY_CATEGORIES) {
      const composed = composeBulkUploadPrompt(buildLegacyPrompt(category)).text
      const vis = extractFencedBlocks(composed).map(b => {
        try { return JSON.parse(b) } catch { return null }
      }).filter((v): v is { type: string; data: unknown } => !!v && typeof v === 'object' && typeof (v as { type?: unknown }).type === 'string')
      for (const block of vis) {
        if ((SUPPORTED_VISUAL_TYPES as readonly string[]).includes(block.type)) {
          expect(() => normalizeVisualInput(block), `${category.name}: parsed visual must be valid`).not.toThrow()
        }
      }
    }
  })
})