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
import { QuestionVisualSchema } from '../../validations/questionVisualSchemas'
import type { CanonicalQuestionVisual } from '../../validations/questionVisualSchemas'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'

const FORBIDDEN_LEGACY_TOKENS = [
  'visual_engine',
  'render_type',
  'metadata',
  'title_en',
  'title_te',
  'headers_en',
  'rows_en',
  'visual_en',
  'visual_te',
  'english_visual',
  'telugu_visual',
  '"type": "marker"',
  '"options"',
  '"correct":',
  'diagram',
]

const TELUGU_RE = /[\u0C00-\u0C7F]/

describe('dynamic canonical output contract (Phases 3/4/8)', () => {
  it('ships as version 1.5', () => {
    expect(QUESTION_OUTPUT_CONTRACT_VERSION).toBe('1.5')
  })

  it('option values in the canonical example NEVER carry letter prefixes (en + te)', () => {
    const ex = buildCanonicalQuestionExample()
    for (const letter of ['a', 'b', 'c', 'd'] as const) {
      const en = ex[`option_${letter}_en`]
      const te = ex[`option_${letter}_te`]
      expect(typeof en, `${letter} en type`).toBe('string')
      expect(typeof te, `${letter} te type`).toBe('string')
      const enStr = en as string
      const teStr = te as string
      expect(enStr.trim()).toBe(enStr)
      expect(enStr, `${letter} en must carry no A./B./C./D. prefix`).not.toMatch(/^[A-D]\.\s/)
      expect(teStr.trim()).toBe(teStr)
      expect(teStr, `${letter} te must carry no ఎ./బి./సి./డి. prefix`).not.toMatch(/^[ఎబసడ]\u0C3F?\./)
    }
    expect(ex.correct_option).toBe('B')
  })

  it('teaches the OPTION VALUE RULE with a prefix-free fenced example', () => {
    const contract = buildCanonicalOutputContract()
    expect(contract).toContain('OPTION VALUE RULE — THE LETTER IS NEVER PART OF THE OPTION VALUE')
    expect(contract).toContain('"option_a_en": "Sydney"')
    expect(contract).toContain('"option_a_te": "సిడ్నీ"')
    expect(contract).toContain('"correct_option": "B"')
    expect(contract).toContain('Never write "A. Sydney", "ఎ. సిడ్నీ"')
    const fenced = [...contract.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g)].map(m => {
      try { return JSON.parse(m[1]) as Record<string, unknown> } catch { return null }
    })
    const example = fenced.find(f => !!f && 'correct_option' in f) as Record<string, unknown>
    expect(example.option_a_en).toBe('Sydney')
    expect(example.option_a_te).toBe('సిడ్నీ')
    expect(example.correct_option).toBe('B')
  })

  it('covers every production supported visual type', () => {
    expect(buildAllVisualExamples().map(v => v.type)).toEqual([...SUPPORTED_VISUAL_TYPES])
  })

  it.each(SUPPORTED_VISUAL_TYPES)('visual example "%s" passes the REAL normalizeVisualInput', (type) => {
    const example = buildVisualExample(type)
    const normalized = normalizeVisualInput(example)
    expect(normalized).toEqual({ ...example, title: example.title ?? null })
  })

  it('every visual example is ONE canonical bilingual visual: English / Telugu, no per-language siblings', () => {
    for (const type of SUPPORTED_VISUAL_TYPES) {
      const example = buildVisualExample(type)
      // Exactly one visual object — no english_visual/telugu_visual/visual_en/te keys anywhere.
      const flat = JSON.stringify(example)
      expect(flat).not.toContain('visual_en')
      expect(flat).not.toContain('visual_te')
      expect(flat).not.toContain('english_visual')
      expect(flat).not.toContain('telugu_visual')
      // Human-readable title is bilingual (Telugu is not ASCII).
      expect(example.title ?? '', `${type} title must be bilingual`).toContain(' / ')
      expect(TELUGU_RE.test(example.title ?? ''), `${type} title must carry Telugu`).toBe(true)
      // In-data bilingual text for every type EXCEPT latex, whose only
      // human-readable text is the (bilingual) title — the formula is syntax.
      const data = JSON.stringify(example.data)
      if (type === 'latex') {
        expect(TELUGU_RE.test(example.title ?? '')).toBe(true)
      } else {
        expect(data, `${type} data must carry " / " bilingual text`).toContain(' / ')
        expect(TELUGU_RE.test(data), `${type} data must carry Telugu`).toBe(true)
      }
    }
  })

  it.each(SUPPORTED_VISUAL_TYPES)(
    'bilingual visual example "%s" passes the FULL AI-to-DB write chain',
    (type) => {
      const question = buildCanonicalQuestionExample('Test Topic', 'టెస్ట్ అంశం', buildVisualExample(type))
      const r = BulkQuestionSchema.safeParse(question)
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
    }
  )

  it('teaches the VISUAL LANGUAGE RULE exactly once', () => {
    const contract = buildCanonicalOutputContract()
    expect((contract.match(/VISUAL LANGUAGE RULE/g) ?? []).length).toBe(1)
    expect(contract).toContain('ONE VISUAL, BILINGUAL TEXT')
    expect(contract).toContain('" / " (space-slash-space)')
    expect(contract).toContain('Population Growth / జనాభా పెరుగుదల')
  })

  it('rejects schema splits: no such thing as a separate Telugu visual', () => {
    // The contract must never suggest pairing question forms with language
    // split across key names — that would be the legacy title_en/rows_en shape.
    const contract = buildCanonicalOutputContract()
    expect(contract).not.toContain('language-split keys')
    for (const bad of ['visual_en', 'visual_te', 'english_visual', 'telugu_visual', '"headers_en"', '"rows_en"']) {
      expect(contract).not.toContain(bad)
    }
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

  it('teaches the EVIDENCE-NOT-ANSWER principle with ten mandatory rules', () => {
    const contract = buildCanonicalOutputContract()
    expect(contract).toContain('VISUAL QUESTION — EVIDENCE, NOT ANSWER')
    for (const rule of [
      '1. EVIDENCE FIRST',
      '2. THE VISUAL IS THE WORKSPACE',
      '3. THE VISUAL IS THE AUTHORITY',
      '4. THE QUESTION MUST REFERENCE THE VISUAL',
      '5. THE ANSWER MUST BE UNOBTAINABLE WITHOUT THE VISUAL',
      '6. THE ANSWER MUST BE OBTAINABLE FROM THE VISUAL ALONE',
      '7. THE VISUAL MUST NEVER REVEAL THE ANSWER',
      '8. THE VISUAL MUST NEVER CONTAIN THE ANSWER',
      '9. THE VISUAL MUST NEVER REPEAT THE QUESTION TEXT',
      '10. THE ANSWER MUST NEVER BE THE "OBVIOUS VISUAL READ"',
    ]) {
      expect(contract, `rule "${rule}" must be taught`).toContain(rule)
    }
  })

  it('teaches the VISUAL QUESTION SELF-CHECK A–I and the DO NOT OVERRESTRICT guard', () => {
    const contract = buildCanonicalOutputContract()
    for (const check of [
      'A. NECESSITY (REMOVE TEST)',
      'B. SUFFICIENCY',
      'C. NO DIRECT-ANSWER REVEAL',
      'D. MEANINGFUL REASONING (INTERPRETATION TEST)',
      'E. ANSWER-LEAK (ANSWER-LEAK TEST)',
      'F. NOT DECORATIVE',
      'G. CANONICAL SCHEMA',
      'H. BILINGUAL TEXT',
      'I. EXACTLY ONE VISUAL',
    ]) {
      expect(contract, `self-check "${check}" must be taught`).toContain(check)
    }
    expect(contract).toContain('DO NOT OVERRESTRICT VISUALS')
    expect(contract).toContain('A necessary visual is welcome, never penalized.')
  })

  it('teaches GOOD 1–4 and BAD 1–6 visual question examples with a DO NOT GENERATE marker', () => {
    const contract = buildCanonicalOutputContract()
    for (const n of ['GOOD 1', 'GOOD 2', 'GOOD 3', 'GOOD 4']) expect(contract).toContain(n)
    expect(contract).toContain('GOOD VISUAL QUESTION EXAMPLES')
    expect(contract).toContain('BAD VISUAL QUESTION EXAMPLES — DO NOT GENERATE')
    for (const n of ['BAD 1', 'BAD 2', 'BAD 3', 'BAD 4', 'BAD 5', 'BAD 6']) expect(contract).toContain(n)
  })

  it('every fenced GOOD example is a schema-valid visual with NO answer key inside', () => {
    const contract = buildCanonicalOutputContract()
    const fenced = Array.from(contract.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g))
      .map(m => {
        try { return JSON.parse(m[1]) as Record<string, unknown> } catch { return null }
      })
      .filter((f): f is Record<string, unknown> => f !== null)
    // The four GOOD examples are fenced visual objects; none may teach an answer.
    const goodTitles = [
      'Regional Population',
      'Rice Production',
      'Trade Route Towns',
      'Bill Passage Sequence',
    ]
    const goods = fenced.filter(f => {
      const title = typeof f.title === 'string' ? f.title : ''
      return goodTitles.some(t => title.includes(t))
    })
    expect(goods.length).toBe(4)
    for (const g of goods) {
      expect('correct_option' in g).toBe(false)
      const v = g as unknown as CanonicalQuestionVisual
      const s = QuestionVisualSchema.safeParse(v)
      expect(s.success, `${JSON.stringify(v.title)}: ${JSON.stringify(s.error?.issues)}`).toBe(true)
      const normalized = normalizeVisualInput(v)
      expect(normalized).not.toBeNull()
      const question = buildCanonicalQuestionExample('Test Topic', 'టెస్ట్ అంశం', v)
      const r = BulkQuestionSchema.safeParse(question)
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    }
    // And the contract still teaches exactly ONE answer-bearing fenced example.
    const withAnswer = fenced.filter(f => 'correct_option' in f)
    expect(withAnswer.length).toBe(1)
  })

  it('the new teaching stays free of every legacy token', () => {
    const contract = buildCanonicalOutputContract()
    for (const token of FORBIDDEN_LEGACY_TOKENS) {
      expect(contract, `forbidden token "${token}" must never be taught`).not.toContain(token)
    }
    expect(contract).not.toContain('VISUAL USE — NECESSITY GATE')
  })

  it('ships ONE iterative self-verification engine with exactly one closing tag', () => {
    const contract = buildCanonicalOutputContract()
    expect(contract.match(/## ITERATIVE SELF-VERIFICATION ENGINE/g)).toHaveLength(1)
    expect(contract.match(/<ITERATIVE_SELF_VERIFICATION_ENGINE>/g)).toHaveLength(1)
    expect(contract).toContain('## STRICT PASS CONDITION')
    expect(contract).toContain('## FAILURE HANDLING')
    expect(contract).toContain('## PRIORITY ORDER')
    expect(contract).toContain('## FINAL OUTPUT RULE')
  })

  it('runs the full 11-phase engine with iteration control', () => {
    const contract = buildCanonicalOutputContract()
    for (const phase of [
      'PHASE 1 — GENERATE',
      'PHASE 2 — INDEPENDENT FULL VERIFICATION',
      'PHASE 3 — STRUCTURE VALIDATION',
      'PHASE 4 — TOPIC IDENTITY VALIDATION',
      'PHASE 5 — DISTRIBUTION VALIDATION',
      'PHASE 6 — DUPLICATE VALIDATION',
      'PHASE 7 — VISUAL VALIDATION',
      'PHASE 8 — ERROR REPORT',
      'PHASE 9 — MINIMAL REFINEMENT',
      'PHASE 10 — COMPLETE RE-VERIFICATION',
      'PHASE 11 — ITERATE',
    ]) {
      expect(contract, `phase "${phase}" must be taught exactly once`).toContain(phase)
    }
    expect(contract).toContain('at most 5 iterations')
    expect(contract).toContain('a fresh generation does not reset the counter')
    expect(contract).toContain('NEVER use correct_option as evidence')
  })

  it('deduplicates the old validation rules into exactly one home each', () => {
    const text = buildCanonicalOutputContract()
    const occurrenceOf = (needle: string) => (text.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length
    // Each legacy rule surface must now appear exactly once in the merged contract.
    expect(occurrenceOf('Return ONLY a valid JSON array')).toBe(0)
    expect(occurrenceOf('no markdown code fences')).toBe(1)
    // Taught by the canonical-field tutorial AND re-gated in engine PHASE 1.
    expect(occurrenceOf('Topic GROUP, never a subtopic')).toBeGreaterThanOrEqual(1)
    expect(occurrenceOf('byte-identical across the entire batch')).toBe(1)
    expect(occurrenceOf('no null Telugu values')).toBe(1)
    expect(occurrenceOf('internal concept ledger')).toBe(1)
    expect(occurrenceOf('All of the above')).toBe(1)
    expect(occurrenceOf('exactly EASY, MEDIUM or HARD')).toBe(0)
    expect(occurrenceOf('difficulty is exactly easy, medium or hard')).toBe(1)
    expect(occurrenceOf('exam_id, paper_id, subject_name, created_by')).toBe(1)
    // The uncontracted VALIDATION RULES heading is gone — rules now live in the engine.
    expect(occurrenceOf('## VALIDATION RULES')).toBe(0)
  })

  it('leaves the taught EVIDENCE rules, GOOD/BAD examples and topic-neutrality intact', () => {
    const contract = buildCanonicalOutputContract()
    expect(contract).toContain('VISUAL QUESTION — EVIDENCE, NOT ANSWER')
    expect(contract).toContain('GOOD VISUAL QUESTION EXAMPLES')
    expect(contract).toContain('BAD VISUAL QUESTION EXAMPLES — DO NOT GENERATE')
    expect(contract).toContain('BAD 7')
    expect(contract).toContain('DO NOT OVERRESTRICT VISUALS')
    expect(contract).toContain('Population Growth / జనాభా పెరుగుదల')
    expect(contract).toContain('"topic_en": "<COPY topic_en VERBATIM>"')
  })
})