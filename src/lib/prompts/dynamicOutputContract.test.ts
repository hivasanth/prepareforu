import { describe, it, expect } from 'vitest'
import {
  buildCanonicalOutputContract,
  buildCanonicalQuestionExample,
  buildVisualExample,
  buildAllVisualExamples,
  QUESTION_OUTPUT_CONTRACT_VERSION,
  CANONICAL_QUESTION_FIELDS,
} from './dynamicOutputContract'
import { SUPPORTED_VISUAL_TYPES } from '../../types/exam.types'
import { normalizeVisualInput } from '../../services/questions/visualNormalizer'
import { BulkQuestionSchema, SingleQuestionSchema } from '../../validations/questionSchema'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'

const FORBIDDEN_LEGACY_TOKENS = [
  'visual_engine',
  'render_type',
  'metadata',
  'title_en',
  'title_te',
  'headers_en',
  'rows_en',
  '"type": "marker"',
  '"options"',
  '"correct":',
  'diagram',
]

describe('dynamic canonical output contract (Phases 3/4/8)', () => {
  it('ships as version 1.0', () => {
    expect(QUESTION_OUTPUT_CONTRACT_VERSION).toBe('1.0')
  })

  it('covers every production supported visual type', () => {
    expect(buildAllVisualExamples().map(v => v.type)).toEqual([...SUPPORTED_VISUAL_TYPES])
  })

  it.each(SUPPORTED_VISUAL_TYPES)('visual example "%s" passes the REAL normalizeVisualInput', (type) => {
    const example = buildVisualExample(type)
    const normalized = normalizeVisualInput(example)
    expect(normalized).toEqual({ ...example, title: example.title ?? null })
  })

  it('the canonical question example passes BulkQuestionSchema AND the DB write schema', () => {
    const example = buildCanonicalQuestionExample('Test Topic', null, buildVisualExample('chart'))
    const r = BulkQuestionSchema.safeParse(example)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    if (!r.success) return

    const d = r.data
    const dbPayload = {
      exam_id: 'exam', paper_id: 'paper', subject_name: 'subject',
      question_text_en: d.question_text_en,
      option_a_en: d.option_a_en,
      option_b_en: d.option_b_en,
      option_c_en: d.option_c_en,
      option_d_en: d.option_d_en,
      explanation_en: d.explanation_en ?? '',
      correct_option: d.correct_option,
      difficulty: d.difficulty,
      visual: d.visual,
      negative_marks: 0,
      topic_en: d.topic_en,
      topic_te: d.topic_te,
      question_text_te: d.question_text_te,
      option_a_te: d.option_a_te,
      option_b_te: d.option_b_te,
      option_c_te: d.option_c_te,
      option_d_te: d.option_d_te,
      explanation_te: d.explanation_te,
    }
    const w = SingleQuestionSchema.safeParse(dbPayload)
    expect(w.success, w.success ? '' : JSON.stringify(w.error.issues)).toBe(true)
  })

  it('documents exactly the canonical question keys (no aliases taught)', () => {
    const fields = CANONICAL_QUESTION_FIELDS.join('\n')
    expect(fields).toContain('question_text_en')
    expect(fields).toContain('correct_option')
    expect(fields).toContain('difficulty')
    expect(fields).not.toContain('"question"')
    expect(fields).not.toContain('"options"')
  })

  it('teaches NO legacy application-format structures', () => {
    const contract = buildCanonicalOutputContract()
    for (const token of FORBIDDEN_LEGACY_TOKENS) {
      expect(contract, `forbidden token "${token}" must never be taught`).not.toContain(token)
    }
  })

  it('never leaks the internal storage marker into the generated contract', () => {
    expect(buildCanonicalOutputContract()).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
  })

  it('the shared contract is TOPIC-NEUTRAL: no cross-topic polity example, placeholder topic identity', () => {
    // A shared contract must teach no real topic — the per-topic names live in
    // the composer's TOPIC IDENTITY block, and the example must carry the
    // VERBATIM-copy placeholder keys instead of any live topic bytes.
    const contract = buildCanonicalOutputContract()
    expect(contract).not.toContain('Polity Basics')
    expect(contract).not.toContain('పాలిటీ ప్రాథమికాలు')
    expect(contract).not.toContain('Ambedkar')
    expect(contract).not.toContain('architect of the Indian Constitution')
    expect(contract).toContain('"topic_en": "<COPY topic_en VERBATIM>"')
    expect(contract).toContain('"topic_te": "<COPY topic_te VERBATIM>"')

    // And the taught example is bilingual filler (capital-of-Australia trivia),
    // so no topic ever inherits another topic's content.
    const fenced = [...contract.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g)].map(m => {
      try { return JSON.parse(m[1]) as Record<string, unknown> } catch { return null }
    })
    const example = fenced.find(f => !!f && 'correct_option' in f) as Record<string, unknown>
    expect(example).toBeTruthy()
    expect(example.question_text_en).toContain('capital of Australia')
    expect(example.correct_option).toBe('B')
  })

  it('embeds the exact parse-able example of every visual type in its prose', () => {
    const contract = buildCanonicalOutputContract()
    const fenced = [...contract.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g)].map(m => {
      try { return JSON.parse(m[1]) } catch { return null }
    })
    for (const type of SUPPORTED_VISUAL_TYPES) {
      const example = buildVisualExample(type)
      expect(fenced.some(f => !!f && typeof f === 'object' && JSON.stringify(f) === JSON.stringify(example)),
        `contract must teach a parse-able ${type} example`).toBe(true)
    }
  })
})