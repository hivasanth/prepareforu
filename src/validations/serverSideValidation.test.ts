// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { passwordSchema, examCreationSchema } from './securitySchemas'
import { SingleQuestionSchema } from './questionSchema'

// ─── Server-Side Validation Tests ────────────────────────────────────────────
// These tests verify that the shared schemas execute correctly in a trusted
// execution context (Node.js / Deno / Edge Function). They simulate what
// happens when the schema is invoked server-side.

describe('Server-side password validation (authService.updatePassword path)', () => {
  it('accepts valid password', () => {
    const result = passwordSchema.safeParse('StrongP@ss1')
    expect(result.success).toBe(true)
  })

  it('rejects weak password (would be caught by server)', () => {
    const result = passwordSchema.safeParse('weak')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8')
    }
  })

  it('rejects password without uppercase (server enforcement)', () => {
    expect(passwordSchema.safeParse('lowercase1!').success).toBe(false)
  })

  it('rejects password without number (server enforcement)', () => {
    expect(passwordSchema.safeParse('NoNumber!here').success).toBe(false)
  })

  it('rejects password without special char (server enforcement)', () => {
    expect(passwordSchema.safeParse('NoSpecial1here').success).toBe(false)
  })

  it('returns structured error for invalid input', () => {
    const result = passwordSchema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues[0].message).toBeTruthy()
    }
  })
})

describe('Exam RPC validation rules (PL/pgSQL mirrors Zod)', () => {
  const VALID_EXAM = {
    examId: 'TEST_001',
    examName: 'Test Exam',
    examSelection: 'GATE',
    totalQuestions: 10,
    totalMarks: 20,
    durationMinutes: 60,
    negativeMarking: true,
    negativeMarkValue: 0.5,
    isPublished: true,
    paperName: 'Paper 1',
    paperStage: 'SINGLE' as const,
    subjects: [
      { subject_name: 'Math', question_count: 5, marks_per_question: 2 },
      { subject_name: 'CS', question_count: 5, marks_per_question: 2 },
    ],
  }

  it('valid exam passes all rules', () => {
    expect(examCreationSchema.safeParse(VALID_EXAM).success).toBe(true)
  })

  it('rejects examId with special characters (RPC mirror)', () => {
    expect(examCreationSchema.safeParse({ ...VALID_EXAM, examId: 'TEST-001!' }).success).toBe(false)
  })

  it('rejects examId > 50 chars (RPC mirror)', () => {
    expect(examCreationSchema.safeParse({ ...VALID_EXAM, examId: 'A'.repeat(51) }).success).toBe(false)
  })

  it('rejects totalQuestions > 1000 (RPC mirror)', () => {
    expect(examCreationSchema.safeParse({ ...VALID_EXAM, totalQuestions: 1001 }).success).toBe(false)
  })

  it('rejects duration > 1440 (RPC mirror)', () => {
    expect(examCreationSchema.safeParse({ ...VALID_EXAM, durationMinutes: 1441 }).success).toBe(false)
  })

  it('rejects subject sum mismatch (RPC mirror)', () => {
    const bad = {
      ...VALID_EXAM,
      totalQuestions: 100,
      subjects: [{ subject_name: 'Math', question_count: 30, marks_per_question: 1 }],
    }
    expect(examCreationSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects negativeMarkValue exceeding marks_per_question (RPC mirror)', () => {
    expect(examCreationSchema.safeParse({
      ...VALID_EXAM,
      negativeMarking: true,
      negativeMarkValue: 999,
    }).success).toBe(false)
  })
})

describe('Question schema validation (repository layer)', () => {
  const VALID_QUESTION = {
    question_text_en: 'What is 2+2?',
    option_a_en: '3',
    option_b_en: '4',
    option_c_en: '5',
    option_d_en: '6',
    correct_option: 'B' as const,
    exam_id: 'GATE_CS',
    paper_id: 'paper-1',
    subject_name: 'Math',
  }

  it('valid question passes SingleQuestionSchema', () => {
    expect(SingleQuestionSchema.safeParse(VALID_QUESTION).success).toBe(true)
  })

  it('rejects empty question text', () => {
    expect(SingleQuestionSchema.safeParse({
      ...VALID_QUESTION,
      question_text_en: '',
    }).success).toBe(false)
  })

  it('rejects invalid correct_option', () => {
    expect(SingleQuestionSchema.safeParse({
      ...VALID_QUESTION,
      correct_option: 'E',
    }).success).toBe(false)
  })
})
