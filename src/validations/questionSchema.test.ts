// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  SingleQuestionSchema,
  BulkQuestionSchema,
  selectedOptionSchema,
  questionEnFieldsSchema,
} from './questionSchema'

// ─── selectedOptionSchema (Exam Runtime answer-write boundary) ────────────────

describe('selectedOptionSchema', () => {
  it('accepts A through D', () => {
    for (const option of ['A', 'B', 'C', 'D'] as const) {
      expect(selectedOptionSchema.safeParse(option).success).toBe(true)
    }
  })

  it('rejects out-of-set values', () => {
    for (const bad of ['E', 'a', '', '1', null, undefined]) {
      expect(selectedOptionSchema.safeParse(bad).success).toBe(false)
    }
  })
})

// ─── questionEnFieldsSchema (single owner for required EN question fields) ───

describe('questionEnFieldsSchema', () => {
  const VALID = {
    question_text_en: 'What is 2+2?',
    option_a_en: '3',
    option_b_en: '4',
    option_c_en: '5',
    option_d_en: '6',
  }

  it('accepts a complete EN question', () => {
    expect(questionEnFieldsSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty question text', () => {
    expect(questionEnFieldsSchema.safeParse({ ...VALID, question_text_en: '' }).success).toBe(false)
  })

  it('rejects whitespace-only question text', () => {
    expect(questionEnFieldsSchema.safeParse({ ...VALID, question_text_en: '   ' }).success).toBe(false)
  })

  it('rejects a missing option', () => {
    const partial = {
      question_text_en: VALID.question_text_en,
      option_a_en: VALID.option_a_en,
      option_c_en: VALID.option_c_en,
      option_d_en: VALID.option_d_en,
    }
    expect(questionEnFieldsSchema.safeParse(partial).success).toBe(false)
  })

  it('trims whitespace before checking length', () => {
    expect(questionEnFieldsSchema.safeParse({ ...VALID, option_c_en: '  ' }).success).toBe(false)
  })

  it('ignores unknown extra fields (used against DB question rows)', () => {
    expect(questionEnFieldsSchema.safeParse({ ...VALID, correct_option: 'B', subject_name: 'Math' }).success).toBe(true)
  })
})

// ─── SingleQuestionSchema ────────────────────────────────────────────────────

describe('SingleQuestionSchema', () => {
  const VALID = {
    question_text_en: 'What is 2+2?',
    option_a_en: '3',
    option_b_en: '4',
    option_c_en: '5',
    option_d_en: '6',
    correct_option: 'B' as const,
    exam_id: 'GATE_CS',
    paper_id: 'paper-1',
    subject_name: 'Mathematics',
  }

  it('accepts a valid question', () => {
    expect(SingleQuestionSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty question text', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, question_text_en: '' }).success).toBe(false)
  })

  it('rejects empty option_a', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, option_a_en: '' }).success).toBe(false)
  })

  it('rejects invalid correct_option', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, correct_option: 'E' }).success).toBe(false)
  })

  it('rejects empty exam_id', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, exam_id: '' }).success).toBe(false)
  })

  it('rejects empty paper_id', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, paper_id: '' }).success).toBe(false)
  })

  it('rejects empty subject_name', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, subject_name: '' }).success).toBe(false)
  })

  it('accepts optional Telugu fields', () => {
    expect(SingleQuestionSchema.safeParse({
      ...VALID,
      question_text_te: '2+2 ఏమిటి?',
      option_a_te: '3',
    }).success).toBe(true)
  })

  it('defaults difficulty to medium', () => {
    const result = SingleQuestionSchema.safeParse(VALID)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.difficulty).toBe('medium')
  })

  it('accepts valid difficulty values', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, difficulty: 'easy' }).success).toBe(true)
    expect(SingleQuestionSchema.safeParse({ ...VALID, difficulty: 'hard' }).success).toBe(true)
  })

  it('rejects invalid difficulty', () => {
    expect(SingleQuestionSchema.safeParse({ ...VALID, difficulty: 'impossible' }).success).toBe(false)
  })
})

// ─── BulkQuestionSchema ──────────────────────────────────────────────────────

describe('BulkQuestionSchema', () => {
  const VALID = {
    question_text_en: 'What is 2+2?',
    option_a_en: '3',
    option_b_en: '4',
    option_c_en: '5',
    option_d_en: '6',
    correct_option: 'B',
    difficulty: 'medium',
  }

  it('accepts a valid bulk question', () => {
    expect(BulkQuestionSchema.safeParse(VALID).success).toBe(true)
  })

  it('normalizes legacy options array format', () => {
    const legacy = {
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correct: 'B',
    }
    expect(BulkQuestionSchema.safeParse(legacy).success).toBe(true)
  })

  it('normalizes lowercase correct_option', () => {
    const result = BulkQuestionSchema.safeParse({ ...VALID, correct_option: 'b' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.correct_option).toBe('B')
  })

  it('normalizes legacy field names', () => {
    const legacy = {
      question_text: 'What is 2+2?',
      option_a: '3',
      option_b: '4',
      option_c: '5',
      option_d: '6',
      correct: 'B',
    }
    expect(BulkQuestionSchema.safeParse(legacy).success).toBe(true)
  })

  it('rejects empty question text after normalization', () => {
    expect(BulkQuestionSchema.safeParse({
      ...VALID,
      question_text_en: '',
    }).success).toBe(false)
  })

  it('rejects invalid correct_option', () => {
    expect(BulkQuestionSchema.safeParse({ ...VALID, correct_option: 'E' }).success).toBe(false)
  })

  it('rejects a partial row missing options (CreateStepJsonPaste now validates via this schema)', () => {
    const partial = { question_text_en: 'Q?', option_a_en: '3' }
    const result = BulkQuestionSchema.safeParse(partial)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('option_b_en'))).toBe(true)
    }
  })

  it('produces stable per-field messages (CreateStepJsonPaste surfaces issues[0] per row)', () => {
    const result = BulkQuestionSchema.safeParse({ question_text_en: '', correct_option: 'E' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues[0].message).toBe('English question is required')
    }
  })
})
