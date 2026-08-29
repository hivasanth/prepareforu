import { describe, it, expect } from 'vitest'
import { topicRequiredQuestionsSchema, examSubjectSchema, examCreationSchema } from './securitySchemas'

// ─── Topic Required Questions Schema ──────────────────────────────────────────

describe('topicRequiredQuestionsSchema', () => {
  it('accepts 1', () => {
    expect(topicRequiredQuestionsSchema.safeParse(1).success).toBe(true)
  })

  it('accepts 10', () => {
    expect(topicRequiredQuestionsSchema.safeParse(10).success).toBe(true)
  })

  it('accepts 100', () => {
    expect(topicRequiredQuestionsSchema.safeParse(100).success).toBe(true)
  })

  it('rejects 0', () => {
    expect(topicRequiredQuestionsSchema.safeParse(0).success).toBe(false)
  })

  it('rejects -1', () => {
    expect(topicRequiredQuestionsSchema.safeParse(-1).success).toBe(false)
  })

  it('rejects 1.5 (non-integer)', () => {
    expect(topicRequiredQuestionsSchema.safeParse(1.5).success).toBe(false)
  })

  it('rejects NaN', () => {
    expect(topicRequiredQuestionsSchema.safeParse(NaN).success).toBe(false)
  })

  it('rejects Infinity', () => {
    expect(topicRequiredQuestionsSchema.safeParse(Infinity).success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(topicRequiredQuestionsSchema.safeParse('').success).toBe(false)
  })

  it('rejects null', () => {
    expect(topicRequiredQuestionsSchema.safeParse(null).success).toBe(false)
  })

  it('rejects undefined', () => {
    expect(topicRequiredQuestionsSchema.safeParse(undefined).success).toBe(false)
  })
})

// ─── ExamSubject Schema (no threshold fields in V2) ──────────────────────────

describe('examSubjectSchema', () => {
  const validSubject = {
    subject_name: 'Mathematics',
    question_count: 15,
    marks_per_question: 1,
  }

  it('accepts a valid subject with allocation fields only', () => {
    expect(examSubjectSchema.safeParse(validSubject).success).toBe(true)
  })

  it('rejects subject missing subject_name', () => {
    const { subject_name, ...rest } = validSubject
    expect(examSubjectSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects subject missing question_count', () => {
    const { question_count, ...rest } = validSubject
    expect(examSubjectSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects subject with question_count = 0', () => {
    expect(examSubjectSchema.safeParse({ ...validSubject, question_count: 0 }).success).toBe(false)
  })

  it('rejects subject with marks_per_question = 0', () => {
    expect(examSubjectSchema.safeParse({ ...validSubject, marks_per_question: 0 }).success).toBe(false)
  })
})

// ─── ExamCreationSchema (no threshold fields in V2) ──────────────────────────

describe('examCreationSchema', () => {
  const VALID = {
    examId: 'GATE_CS',
    examName: 'GATE Computer Science',
    examSelection: 'GATE',
    totalQuestions: 65,
    totalMarks: 100,
    durationMinutes: 180,
    negativeMarking: true,
    negativeMarkValue: 0.33,
    isPublished: true,
    paperName: 'Core Paper',
    paperStage: 'SINGLE' as const,
    subjects: [
      { subject_name: 'Mathematics', question_count: 15, marks_per_question: 1 },
      { subject_name: 'Computer Science', question_count: 50, marks_per_question: 1.7 },
    ],
  }

  it('accepts a valid exam without threshold fields', () => {
    expect(examCreationSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects exam where subject question_count sum does not match total', () => {
    const result = examCreationSchema.safeParse({
      ...VALID,
      subjects: [
        { subject_name: 'Mathematics', question_count: 10, marks_per_question: 1 },
        { subject_name: 'Computer Science', question_count: 50, marks_per_question: 1.7 },
      ],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(i => i.message.includes('Subject question counts must equal'))).toBe(true)
  })

  it('rejects exam with no subjects', () => {
    const result = examCreationSchema.safeParse({ ...VALID, subjects: [] })
    expect(result.success).toBe(false)
  })

  it('rejects exam with 21 subjects', () => {
    const manySubjects = Array.from({ length: 21 }, (_, i) => ({
      subject_name: `Subject ${i}`,
      question_count: 1,
      marks_per_question: 1,
    }))
    const result = examCreationSchema.safeParse({ ...VALID, subjects: manySubjects })
    expect(result.success).toBe(false)
  })
})
