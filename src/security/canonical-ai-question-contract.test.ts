import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { BulkQuestionSchema } from '../validations/questionSchema'
import { generateQuestionHash } from '../utils/hashUtils'

/**
 * CANONICAL AI QUESTION CONTRACT (F-01/AI-CONTRACT)
 * -----------------------------------------------------------------------------
 * The AI question-generation prompt is the SOURCE OF TRUTH for the bulk upload
 * JSON contract: array of question objects with topic_en/topic_te,
 * question_text_en/te, option_*_en/te, correct_option, explanation_en/te,
 * difficulty and an OPTIONAL visual_engine { render_type, title, headers,
 * rows }. This suite feeds the EXACT AI-generated fixture through the real
 * JSON.parse → BulkQuestionSchema (validate → normalize) pipeline and asserts
 * nothing is discarded. If a developer later changes the upload schema and
 * breaks the AI contract, this test (and the fixture) fail — by design.
 */

const FIXTURE_PATH = join(__dirname, '..', '..', 'tests', 'fixtures', 'canonical-ai-question.json')

function loadCanonicalFixture(): unknown {
  // Stage 1 — the real syntax stage: JSON.parse, not an import transform.
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'))
}

describe('canonical AI question contract (§27/§28)', () => {
  it('the fixture is a valid JSON array', () => {
    const parsed = loadCanonicalFixture()
    expect(Array.isArray(parsed)).toBe(true)
    expect((parsed as unknown[]).length).toBe(2)
  })

  it('every EXACT AI question parses → validates → normalizes with nothing discarded', () => {
    const data = loadCanonicalFixture() as unknown[]
    for (const row of data) {
      const result = BulkQuestionSchema.safeParse(row)
      expect(result.success, JSON.stringify((result as { error?: { issues: unknown[] } }).error?.issues)).toBe(true)
    }
  })

  it('preserves all English fields byte-for-byte', () => {
    const data = loadCanonicalFixture() as unknown[]
    const r = BulkQuestionSchema.safeParse(data[0])
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.question_text_en).toContain('She is the mother of my daughter')
      expect(r.data.option_a_en).toBe('She is Rajesh\'s sister')
      expect(r.data.option_b_en).toBe('She is Rajesh\'s wife')
      expect(r.data.option_c_en).toBe('She is Rajesh\'s mother-in-law')
      expect(r.data.option_d_en).toBe('She is Rajesh\'s daughter')
      expect(r.data.explanation_en).toContain('Rajesh\'s wife')
    }
  })

  it('preserves Telugu Unicode fields (no transliteration/stripping)', () => {
    const data = loadCanonicalFixture() as unknown[]
    const r = BulkQuestionSchema.safeParse(data[0])
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.topic_te).toBe('ఆధునిక ఆంధ్ర చరిత్ర')
      expect(r.data.question_text_te).toContain('రాజేష్')
      expect(r.data.option_b_te).toContain('భార్య')
      expect(r.data.explanation_te).toBe('ఆమె రాజేష్ కుమార్తెకు తల్లి కాబట్టి ఆమె రాజేష్ భార్య.')
    }
  })

  it('normalizes the canonical AI visual_engine table into the DB storage shape', () => {
    const data = loadCanonicalFixture() as unknown[]
    const r = BulkQuestionSchema.safeParse(data[0])
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.visual).toEqual({
        type: 'table',
        title: 'Family Relations',
        data: {
          headers: ['Person', 'Relation'],
          rows: [['Photograph woman', 'Mother'], ['Daughter', 'Child'], ['Rajesh', 'Father']],
        },
      })
    }
  })

  it('keeps rows/questions without visual_engine valid with a null visual', () => {
    const data = loadCanonicalFixture() as unknown[]
    const r = BulkQuestionSchema.safeParse(data[1])
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.visual).toBeNull()
  })

  it('honors escaped quotes and \\n escapes (already valid JSON in the fixture)', () => {
    const raw = readFileSync(FIXTURE_PATH, 'utf8')
    expect(raw).toContain('\\"She is the mother of my daughter.\\"')
    expect(raw).toContain('\\n')
  })

  it('assigns deterministic content_hashes (duplicate protection preserved)', async () => {
    const data = loadCanonicalFixture() as unknown[]
    const parsed0 = BulkQuestionSchema.safeParse(data[0])
    const parsed1 = BulkQuestionSchema.safeParse(data[0])
    expect(parsed0.success && parsed1.success).toBe(true)
    if (parsed0.success && parsed1.success) {
      const h1 = await generateQuestionHash(parsed0.data as unknown as Parameters<typeof generateQuestionHash>[0])
      const h2 = await generateQuestionHash(parsed1.data as unknown as Parameters<typeof generateQuestionHash>[0])
      expect(h1).toBe(h2)
    }
  })
})

describe('canonical AI contract — distinct failure modes stay distinct (§23)', () => {
  it('invalid JSON syntax is rejected at the parse stage (not by the schema)', () => {
    expect(() => JSON.parse('[{"question_text_en":"She said, "hello" to him."}]')).toThrow()
  })

  it('missing required field yields a row-level schema issue', () => {
    const r = BulkQuestionSchema.safeParse({
      question_text_en: 'Q?',
      option_a_en: 'A',
      option_b_en: 'B',
      option_c_en: 'C',
      // option_d_en missing
      correct_option: 'A',
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.join('.') === 'option_d_en')).toBe(true)
    }
  })

  it('invalid correct_option is rejected', () => {
    const r = BulkQuestionSchema.safeParse({
      question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
      correct_option: 'E',
    })
    expect(r.success).toBe(false)
  })

  it('invalid difficulty is rejected', () => {
    const r = BulkQuestionSchema.safeParse({
      question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
      correct_option: 'A', difficulty: 'expert',
    })
    expect(r.success).toBe(false)
  })

  it('invalid visual_engine is rejected at row level (throws out of safeParse, app catches)', () => {
    // The visual transform THROWS out of BulkQuestionSchema.safeParse — the
    // uploader catches this at useBulkUpload.ts:527-533 and reports it as
    // `Row N (visual): ...` — which is why validation can never silently
    // downgrade or drop a visual.
    expect(() => BulkQuestionSchema.safeParse({
      question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
      correct_option: 'A',
      visual_engine: { render_type: 'hologram', title: 'T', headers: [], rows: [] },
    })).toThrow()
  })

  it('a visual_engine whose render keys are absent still fails (no silent empty visual)', () => {
    expect(() => BulkQuestionSchema.safeParse({
      question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
      correct_option: 'A',
      visual_engine: { render_type: 'table', title: 'Empty' },
    })).toThrow()
  })

  it('lowercase correct_option is normalized to uppercase (documented behavior)', () => {
    const r = BulkQuestionSchema.safeParse({
      question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
      correct_option: 'b',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.correct_option).toBe('B')
  })
})