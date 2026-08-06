// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  passwordSchema,
  passwordCreateSchema,
  passwordChangeSchema,
  examCreationSchema,
  examParamsSchema,
  examConfigSchema,
  identityUpdateSchema,
  submitResultSchema,
  PASSWORD_MIN_LENGTH,
  hasMinLength,
  hasUppercase,
  hasNumber,
  hasSpecial,
  getPasswordStrengthScore,
} from './securitySchemas'

// ─── passwordSchema ──────────────────────────────────────────────────────────

describe('passwordSchema', () => {
  const VALID = 'StrongP@ss1'

  it('accepts a valid password', () => {
    expect(passwordSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty string', () => {
    expect(passwordSchema.safeParse('').success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    expect(passwordSchema.safeParse('Ab1!').success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    expect(passwordSchema.safeParse('strongp@ss1').success).toBe(false)
  })

  it('rejects password without number', () => {
    expect(passwordSchema.safeParse('Strong@pass').success).toBe(false)
  })

  it('rejects password without special character', () => {
    expect(passwordSchema.safeParse('Strongpass1').success).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(passwordSchema.safeParse(undefined as any).success).toBe(false)
    expect(passwordSchema.safeParse(null as any).success).toBe(false)
    expect(passwordSchema.safeParse(123 as any).success).toBe(false)
  })

  it('accepts password at exact minimum length (8 chars)', () => {
    expect(passwordSchema.safeParse('Abcdef1!').success).toBe(true)
  })

  it('accepts very long password', () => {
    const long = 'A' + 'a'.repeat(998) + '1!'
    expect(passwordSchema.safeParse(long).success).toBe(true)
  })

  it('uses correct minimum length constant', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
  })
})

// ─── password policy predicates ──────────────────────────────────────────────

describe('password policy predicates (shared with strength meter / checklist)', () => {
  const VALID = 'StrongP@ss1'

  it('hasMinLength follows PASSWORD_MIN_LENGTH', () => {
    expect(hasMinLength('')).toBe(false)
    expect(hasMinLength('Abcdef1!')).toBe(true)
    expect(hasMinLength(VALID)).toBe(true)
  })

  it('hasUppercase / hasNumber / hasSpecial match the schema rules', () => {
    expect(hasUppercase('strongp@ss1')).toBe(false)
    expect(hasUppercase(VALID)).toBe(true)
    expect(hasNumber('Strong@pass')).toBe(false)
    expect(hasNumber(VALID)).toBe(true)
    expect(hasSpecial('Strongpass1')).toBe(false)
    expect(hasSpecial(VALID)).toBe(true)
  })

  it('predicates agree with passwordSchema for every sampled value', () => {
    const samples = ['', 'weak', 'Ab1!', 'strongp@ss1', 'Strong@pass', 'Strongpass1', VALID, 'Abcdef1!']
    for (const sample of samples) {
      const predOk = hasMinLength(sample) && hasUppercase(sample) && hasNumber(sample) && hasSpecial(sample)
      expect(passwordSchema.safeParse(sample).success).toBe(predOk)
    }
  })

  it('getPasswordStrengthScore counts satisfied rules (0–4)', () => {
    expect(getPasswordStrengthScore('')).toBe(0)
    expect(getPasswordStrengthScore('abcdefgh1!')).toBe(3) // length + number + special
    expect(getPasswordStrengthScore(VALID)).toBe(4)
  })
})

// ─── passwordCreateSchema ────────────────────────────────────────────────────

describe('passwordCreateSchema', () => {
  const VALID = { password: 'StrongP@ss1', confirmPassword: 'StrongP@ss1' }

  it('accepts matching valid passwords', () => {
    expect(passwordCreateSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = passwordCreateSchema.safeParse({
      password: 'StrongP@ss1',
      confirmPassword: 'DifferentP@ss1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword')
    }
  })

  it('rejects weak password even if confirmed', () => {
    expect(passwordCreateSchema.safeParse({
      password: 'weak',
      confirmPassword: 'weak',
    }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(passwordCreateSchema.safeParse({
      password: '',
      confirmPassword: '',
    }).success).toBe(false)
  })

  it('rejects missing confirmPassword', () => {
    expect(passwordCreateSchema.safeParse({
      password: 'StrongP@ss1',
    }).success).toBe(false)
  })
})

// ─── passwordChangeSchema ────────────────────────────────────────────────────

describe('passwordChangeSchema', () => {
  const VALID = {
    currentPass: 'OldP@ssw0rd',
    newPass: 'NewP@ssw0rd1',
    confirmPass: 'NewP@ssw0rd1',
  }

  it('accepts valid password change', () => {
    expect(passwordChangeSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects when new passwords do not match', () => {
    const result = passwordChangeSchema.safeParse({
      ...VALID,
      confirmPass: 'DifferentP@ss1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPass')
    }
  })

  it('rejects when new password equals current password', () => {
    const result = passwordChangeSchema.safeParse({
      currentPass: 'SameP@ssw0rd',
      newPass: 'SameP@ssw0rd',
      confirmPass: 'SameP@ssw0rd',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('newPass')
    }
  })

  it('rejects empty current password', () => {
    expect(passwordChangeSchema.safeParse({
      currentPass: '',
      newPass: 'NewP@ssw0rd1',
      confirmPass: 'NewP@ssw0rd1',
    }).success).toBe(false)
  })

  it('rejects weak new password', () => {
    expect(passwordChangeSchema.safeParse({
      currentPass: 'OldP@ssw0rd',
      newPass: 'weak',
      confirmPass: 'weak',
    }).success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(passwordChangeSchema.safeParse({}).success).toBe(false)
  })
})

// ─── examCreationSchema ──────────────────────────────────────────────────────

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

  it('accepts a valid exam config', () => {
    expect(examCreationSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty examId', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examId: '' }).success).toBe(false)
  })

  it('rejects examId with special characters', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examId: 'GATE-CS!' }).success).toBe(false)
  })

  it('rejects examId with lowercase', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examId: 'gate_cs' }).success).toBe(false)
  })

  it('rejects examId exceeding 50 characters', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examId: 'A'.repeat(51) }).success).toBe(false)
  })

  it('accepts examId at exactly 50 characters', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examId: 'A'.repeat(50) }).success).toBe(true)
  })

  it('rejects totalQuestions < 1', () => {
    expect(examCreationSchema.safeParse({ ...VALID, totalQuestions: 0 }).success).toBe(false)
  })

  it('rejects totalQuestions > 1000', () => {
    expect(examCreationSchema.safeParse({ ...VALID, totalQuestions: 1001 }).success).toBe(false)
  })

  it('rejects totalQuestions as float', () => {
    expect(examCreationSchema.safeParse({ ...VALID, totalQuestions: 65.5 }).success).toBe(false)
  })

  it('rejects totalMarks < 1', () => {
    expect(examCreationSchema.safeParse({ ...VALID, totalMarks: 0 }).success).toBe(false)
  })

  it('rejects durationMinutes > 1440', () => {
    expect(examCreationSchema.safeParse({ ...VALID, durationMinutes: 1441 }).success).toBe(false)
  })

  it('rejects negativeMarkValue when negative', () => {
    expect(examCreationSchema.safeParse({ ...VALID, negativeMarkValue: -1 }).success).toBe(false)
  })

  it('rejects when subject sum != totalQuestions', () => {
    const bad = {
      ...VALID,
      totalQuestions: 100,
      subjects: [
        { subject_name: 'Math', question_count: 30, marks_per_question: 1 },
      ],
    }
    const result = examCreationSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('subjects'))).toBe(true)
    }
  })

  it('rejects empty subjects array', () => {
    expect(examCreationSchema.safeParse({ ...VALID, subjects: [] }).success).toBe(false)
  })

  it('rejects more than 20 subjects', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      subject_name: `Subject ${i}`,
      question_count: 1,
      marks_per_question: 1,
    }))
    expect(examCreationSchema.safeParse({ ...VALID, subjects: many, totalQuestions: 21 }).success).toBe(false)
  })

  it('rejects subject with empty name', () => {
    expect(examCreationSchema.safeParse({
      ...VALID,
      subjects: [
        { subject_name: '', question_count: 65, marks_per_question: 1 },
      ],
    }).success).toBe(false)
  })

  it('rejects subject with question_count < 1', () => {
    expect(examCreationSchema.safeParse({
      ...VALID,
      subjects: [
        { subject_name: 'Math', question_count: 0, marks_per_question: 1 },
      ],
    }).success).toBe(false)
  })

  it('rejects subject with marks_per_question < 0.1', () => {
    expect(examCreationSchema.safeParse({
      ...VALID,
      subjects: [
        { subject_name: 'Math', question_count: 65, marks_per_question: 0.05 },
      ],
    }).success).toBe(false)
  })

  it('rejects invalid paperStage', () => {
    expect(examCreationSchema.safeParse({ ...VALID, paperStage: 'FINAL' }).success).toBe(false)
  })

  it('accepts all valid paper stages', () => {
    expect(examCreationSchema.safeParse({ ...VALID, paperStage: 'SINGLE' }).success).toBe(true)
    expect(examCreationSchema.safeParse({ ...VALID, paperStage: 'PRELIMS' }).success).toBe(true)
    expect(examCreationSchema.safeParse({ ...VALID, paperStage: 'MAINS' }).success).toBe(true)
  })

  it('rejects empty examName', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examName: '' }).success).toBe(false)
  })

  it('rejects empty paperName', () => {
    expect(examCreationSchema.safeParse({ ...VALID, paperName: '' }).success).toBe(false)
  })

  it('rejects empty examSelection', () => {
    expect(examCreationSchema.safeParse({ ...VALID, examSelection: '' }).success).toBe(false)
  })

  it('rejects negativeMarkValue exceeding marks_per_question when negativeMarking enabled', () => {
    expect(examCreationSchema.safeParse({
      ...VALID,
      negativeMarking: true,
      negativeMarkValue: 999,
    }).success).toBe(false)
  })

  it('allows any negativeMarkValue when negativeMarking disabled', () => {
    expect(examCreationSchema.safeParse({
      ...VALID,
      negativeMarking: false,
      negativeMarkValue: 999,
    }).success).toBe(true)
  })
})

// ─── examParamsSchema ─────────────────────────────────────────────────────────

describe('examParamsSchema', () => {
  const VALID = {
    total_questions: 65,
    total_marks: 100,
    duration_minutes: 180,
    negative_marking: true,
    negative_mark_value: 0.33,
  }

  it('accepts a valid exam config', () => {
    expect(examParamsSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects 0 total questions', () => {
    expect(examParamsSchema.safeParse({ ...VALID, total_questions: 0 }).success).toBe(false)
  })

  it('rejects negative total questions', () => {
    expect(examParamsSchema.safeParse({ ...VALID, total_questions: -5 }).success).toBe(false)
  })

  it('rejects total questions as float', () => {
    expect(examParamsSchema.safeParse({ ...VALID, total_questions: 65.5 }).success).toBe(false)
  })

  it('rejects 0 total marks', () => {
    expect(examParamsSchema.safeParse({ ...VALID, total_marks: 0 }).success).toBe(false)
  })

  it('rejects 0 duration minutes', () => {
    expect(examParamsSchema.safeParse({ ...VALID, duration_minutes: 0 }).success).toBe(false)
  })

  it('rejects duration over 1440 minutes', () => {
    expect(examParamsSchema.safeParse({ ...VALID, duration_minutes: 1441 }).success).toBe(false)
  })

  it('rejects negative mark value when negative marking is enabled', () => {
    expect(examParamsSchema.safeParse({ ...VALID, negative_mark_value: -1 }).success).toBe(false)
  })

  it('rejects negative mark value exceeding marks per question when enabled', () => {
    expect(examParamsSchema.safeParse({ ...VALID, negative_mark_value: 999 }).success).toBe(false)
  })

  it('allows any negative mark value when negative marking is disabled', () => {
    expect(examParamsSchema.safeParse({
      ...VALID,
      negative_marking: false,
      negative_mark_value: 999,
    }).success).toBe(true)
  })
})

// ─── examConfigSchema (Sub-Admin create wizard Setup step) ────────────────────

describe('examConfigSchema', () => {
  // Build local "YYYY-MM-DDTHH:mm" strings the same way getLocalISOTime() does.
  const toLocalISO = (ms: number) => new Date(ms - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  const now = Date.now()
  const VALID = {
    title: 'APPSC Group 1 Mock Test',
    start_time: toLocalISO(now + 10 * 60000),
    end_time: toLocalISO(now + 90 * 60000),
    duration_minutes: 60,
    marks_per_question: 1,
    negative_mark_value: 0.25,
  }

  it('accepts a valid exam config', () => {
    expect(examConfigSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty title', () => {
    const res = examConfigSchema.safeParse({ ...VALID, title: '   ' })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('title')
  })

  it('rejects title shorter than 5 characters', () => {
    expect(examConfigSchema.safeParse({ ...VALID, title: 'abcd' }).success).toBe(false)
  })

  it('rejects title longer than 120 characters', () => {
    expect(examConfigSchema.safeParse({ ...VALID, title: 'a'.repeat(121) }).success).toBe(false)
  })

  it('rejects missing start time', () => {
    const res = examConfigSchema.safeParse({ ...VALID, start_time: '' })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('start_time')
  })

  it('rejects missing end time', () => {
    expect(examConfigSchema.safeParse({ ...VALID, end_time: '' }).success).toBe(false)
  })

  it('rejects start time in the past', () => {
    const res = examConfigSchema.safeParse({ ...VALID, start_time: toLocalISO(now - 60 * 60000) })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('start_time')
  })

  it('rejects end time not after start time', () => {
    const res = examConfigSchema.safeParse({
      ...VALID,
      start_time: toLocalISO(now + 10 * 60000),
      end_time: toLocalISO(now + 5 * 60000),
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('end_time')
  })

  it('rejects duration exceeding the scheduled window', () => {
    const res = examConfigSchema.safeParse({
      ...VALID,
      start_time: toLocalISO(now + 10 * 60000),
      end_time: toLocalISO(now + 30 * 60000),
      duration_minutes: 60,
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('duration_minutes')
  })

  it('rejects window longer than 30 days', () => {
    const res = examConfigSchema.safeParse({
      ...VALID,
      end_time: toLocalISO(now + 31 * 24 * 60 * 60000),
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('end_time')
  })

  it('rejects non-positive duration', () => {
    expect(examConfigSchema.safeParse({ ...VALID, duration_minutes: 0 }).success).toBe(false)
  })

  it('rejects duration over 1440 minutes', () => {
    expect(examConfigSchema.safeParse({ ...VALID, duration_minutes: 1441 }).success).toBe(false)
  })

  it('rejects non-positive marks per question', () => {
    expect(examConfigSchema.safeParse({ ...VALID, marks_per_question: 0 }).success).toBe(false)
  })

  it('rejects marks per question over 100', () => {
    expect(examConfigSchema.safeParse({ ...VALID, marks_per_question: 101 }).success).toBe(false)
  })

  it('rejects negative mark value', () => {
    const res = examConfigSchema.safeParse({ ...VALID, negative_mark_value: -1 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('negative_mark_value')
  })

  it('rejects negative mark value exceeding marks per question', () => {
    const res = examConfigSchema.safeParse({ ...VALID, negative_mark_value: 2 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('negative_mark_value')
  })

  it('allows zero negative mark value', () => {
    expect(examConfigSchema.safeParse({ ...VALID, negative_mark_value: 0 }).success).toBe(true)
  })
})

// ─── identityUpdateSchema (Sub-Admin settings Identity section) ───────────────

describe('identityUpdateSchema', () => {
  it('accepts a name with no password', () => {
    expect(identityUpdateSchema.safeParse({ name: 'Jane', password: '' }).success).toBe(true)
  })

  it('accepts a name with a valid password', () => {
    expect(identityUpdateSchema.safeParse({ name: 'Jane', password: 'StrongP@ss1' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const res = identityUpdateSchema.safeParse({ name: '   ' })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('name')
  })

  it('rejects a weak password and surfaces it at the password field', () => {
    const res = identityUpdateSchema.safeParse({ name: 'Jane', password: 'short' })
    expect(res.success).toBe(false)
    if (!res.success) {
      const passwordIssues = res.error.issues.filter(i => i.path[0] === 'password')
      expect(passwordIssues.length).toBeGreaterThan(0)
    }
  })
})

// ─── submitResultSchema (Exam Runtime result parsing) ─────────────────────────

describe('submitResultSchema', () => {
  it('parses canonical count fields', () => {
    const res = submitResultSchema.safeParse({
      correct: 5, wrong: 3, skipped: 2, duration_seconds: 1200, score: 8, accuracy: 50,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toMatchObject({ correct: 5, wrong: 3, skipped: 2, duration_seconds: 1200 })
    }
  })

  it('falls back to *_count naming variants', () => {
    const res = submitResultSchema.safeParse({
      correct_count: 5, wrong_count: 3, skipped_count: 2, duration: 900,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toMatchObject({ correct: 5, wrong: 3, skipped: 2, duration_seconds: 900 })
    }
  })

  it('coerces string-typed counts to numbers (prevents "5"+3 concatenation)', () => {
    const res = submitResultSchema.safeParse({ correct: '5', wrong: 3 })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.correct).toBe(5)
      expect(res.data.correct + res.data.wrong).toBe(8)
    }
  })

  it('defaults missing counts to 0', () => {
    const res = submitResultSchema.safeParse({})
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toMatchObject({ correct: 0, wrong: 0, skipped: 0, duration_seconds: 0 })
    }
  })

  it('rejects malformed payloads (non-numeric count)', () => {
    const res = submitResultSchema.safeParse({ correct: 'abc' })
    expect(res.success).toBe(false)
  })
})
