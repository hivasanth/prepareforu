import { z } from 'zod'

// ─── Shared Password Policy ──────────────────────────────────────────────────
// Canonical password rules used across ALL password creation/change flows.
// Matches the SignupPage policy (the strictest existing policy).
// The regex constants are the single source of truth for the policy; the
// predicates and schema below both derive from them so the rules never drift.

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/
export const PASSWORD_NUMBER_REGEX = /[0-9]/
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9]/

export const hasMinLength = (value: string) => value.length >= PASSWORD_MIN_LENGTH
export const hasUppercase = (value: string) => PASSWORD_UPPERCASE_REGEX.test(value)
export const hasNumber = (value: string) => PASSWORD_NUMBER_REGEX.test(value)
export const hasSpecial = (value: string) => PASSWORD_SPECIAL_REGEX.test(value)

// 0–4 score used by password strength meters (one rule per point).
export const getPasswordStrengthScore = (value: string): number => {
  let score = 0
  if (hasMinLength(value)) score++
  if (hasUppercase(value)) score++
  if (hasNumber(value)) score++
  if (hasSpecial(value)) score++
  return score
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(PASSWORD_UPPERCASE_REGEX, 'Must include an uppercase letter')
  .regex(PASSWORD_NUMBER_REGEX, 'Must include a number')
  .regex(PASSWORD_SPECIAL_REGEX, 'Must include a special character')

// ─── Password Create/Reset (with confirmation) ───────────────────────────────
// Used by: UpdatePasswordPage, SubAdminSettings (when password is provided)

export const passwordCreateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordCreateInput = z.infer<typeof passwordCreateSchema>

// ─── Password Change (with current password verification) ────────────────────
// Used by: UserProfile

export const passwordChangeSchema = z
  .object({
    currentPass: z.string().min(1, 'Current password is required'),
    newPass: passwordSchema,
    confirmPass: z.string(),
  })
  .refine((data) => data.newPass === data.confirmPass, {
    message: 'Passwords do not match',
    path: ['confirmPass'],
  })
  .refine((data) => data.newPass !== data.currentPass, {
    message: 'New password cannot be the same as the current password',
    path: ['newPass'],
  })

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

// ─── Exam Schemas ─────────────────────────────────────────────────────────────
// The scalar schemas below are the single source of truth for exam range rules.
// Both examCreationSchema (AddExamModal) and examParamsSchema (ExamParamsForm /
// AdminSettings config panel) derive from them so the rules never drift.

export const examTotalQuestionsSchema = z
  .number()
  .int()
  .min(1, 'Must have at least 1 question')
  .max(1000, 'Cannot exceed 1000 questions')

export const examTotalMarksSchema = z.number().min(1, 'Total marks must be at least 1')

export const examDurationMinutesSchema = z
  .number()
  .int()
  .min(1, 'Duration must be at least 1 minute')
  .max(1440, 'Cannot exceed 1440 minutes (24 hours)')

export const examNegativeMarkValueSchema = z.number().min(0, 'Negative mark cannot be negative')

// Canonical cross-field messages (single wording across every surface).
export const EXAM_SUBJECTS_SUM_MESSAGE = 'Subject question counts must equal total questions'
export const EXAM_NEGATIVE_MARK_RANGE_MESSAGE = 'Negative mark value must be between 0 and marks per question'

export const examSubjectSchema = z.object({
  subject_name: z.string().trim().min(1, 'Subject name is required'),
  question_count: z.number().int().min(1, 'Must have at least 1 question'),
  marks_per_question: z.number().min(0.1, 'Marks must be at least 0.1'),
})

export const examCreationSchema = z
  .object({
    examId: z
      .string()
      .trim()
      .min(1, 'Exam ID is required')
      .max(50, 'Exam ID must be 50 characters or less')
      .regex(/^[A-Z0-9_]+$/, 'Exam ID must contain only uppercase letters, numbers, and underscores'),
    examName: z.string().trim().min(1, 'Display name is required').max(200, 'Name must be 200 characters or less'),
    examSelection: z.string().trim().min(1, 'Selection category is required'),
    totalQuestions: examTotalQuestionsSchema,
    totalMarks: examTotalMarksSchema,
    durationMinutes: examDurationMinutesSchema,
    negativeMarking: z.boolean(),
    negativeMarkValue: examNegativeMarkValueSchema,
    isPublished: z.boolean(),
    paperName: z.string().trim().min(1, 'Paper name is required'),
    paperStage: z.enum(['SINGLE', 'PRELIMS', 'MAINS']),
    subjects: z
      .array(examSubjectSchema)
      .min(1, 'At least one subject is required')
      .max(20, 'Cannot have more than 20 subjects'),
  })
  .refine(
    (data) => {
      const subjectsSum = data.subjects.reduce((sum, s) => sum + s.question_count, 0)
      return subjectsSum === data.totalQuestions
    },
    {
      message: EXAM_SUBJECTS_SUM_MESSAGE,
      path: ['subjects'],
    }
  )
  .refine(
    (data) => {
      if (!data.negativeMarking) return true
      return data.negativeMarkValue >= 0 && data.negativeMarkValue <= data.totalMarks / data.totalQuestions
    },
    {
      message: EXAM_NEGATIVE_MARK_RANGE_MESSAGE,
      path: ['negativeMarkValue'],
    }
  )

export type ExamCreationInput = z.infer<typeof examCreationSchema>

// ─── Exam Params Schema (AdminSettings config panel) ─────────────────────────
// Used by: ExamParamsForm (via useAdminSettings.saveConfig). Mirrors the range
// rules of examCreationSchema against the ExamConfig field names so a
// configurable exam can never be saved with 0 questions, 0 minutes, or
// negative / out-of-range penalties.

export const examParamsSchema = z
  .object({
    total_questions: examTotalQuestionsSchema,
    total_marks: examTotalMarksSchema,
    duration_minutes: examDurationMinutesSchema,
    negative_marking: z.boolean(),
    negative_mark_value: z.number(),
  })
  .refine(
    (data) => {
      if (!data.negative_marking) return true
      return data.negative_mark_value >= 0
    },
    {
      message: 'Negative mark cannot be negative',
      path: ['negative_mark_value'],
    }
  )
  .refine(
    (data) => {
      if (!data.negative_marking) return true
      return data.negative_mark_value <= data.total_marks / data.total_questions
    },
    {
      message: EXAM_NEGATIVE_MARK_RANGE_MESSAGE,
      path: ['negative_mark_value'],
    }
  )

export type ExamParamsInput = z.infer<typeof examParamsSchema>

// Canonical "no questions yet" wording shared by every Sub-Admin navigation /
// publish guard that requires at least one parsed question.
export const EXAM_NO_QUESTIONS_MESSAGE = 'At least one question is required before proceeding'

// ─── Sub-Admin Exam Config Schema (create wizard — Setup step) ────────────────
// Used by: CreateStepSetup (via the wizard's ExamConfig state). Replaces the
// former file-local validateConfig() in sub-admin/create/types.ts. Reuses the
// shared range scalars so the 1–1440 duration and non-negative penalty limits
// cannot drift from the Admin exam schemas. Scheduling rules (past start,
// end-after-start, duration <= window, window <= 30 days) are wizard-specific
// and live here as cross-field refinements.

export const examConfigSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Exam title is required')
      .min(5, 'Exam title must be at least 5 characters')
      .max(120, 'Exam title cannot exceed 120 characters'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    duration_minutes: examDurationMinutesSchema,
    marks_per_question: z
      .number()
      .positive('Marks per question must be positive')
      .max(100, 'Marks per question cannot exceed 100'),
    negative_mark_value: examNegativeMarkValueSchema,
  })
  .superRefine((data, ctx) => {
    if (data.negative_mark_value > data.marks_per_question) {
      ctx.addIssue({ code: 'custom', message: EXAM_NEGATIVE_MARK_RANGE_MESSAGE, path: ['negative_mark_value'] })
    }
  })
  .superRefine((data, ctx) => {
    if (!data.start_time || !data.end_time) return
    const start = new Date(data.start_time).getTime()
    const end = new Date(data.end_time).getTime()
    if (!Number.isNaN(start) && start < Date.now() - 5 * 60000) {
      ctx.addIssue({ code: 'custom', message: 'Start time cannot be in the past', path: ['start_time'] })
    }
    if (end <= start) {
      ctx.addIssue({ code: 'custom', message: 'End time must be after the start time', path: ['end_time'] })
    } else {
      const windowMinutes = (end - start) / 60000
      if (data.duration_minutes > windowMinutes) {
        ctx.addIssue({ code: 'custom', message: 'Exam duration exceeds the scheduled window', path: ['duration_minutes'] })
      }
      if (windowMinutes > 24 * 60 * 30) {
        ctx.addIssue({ code: 'custom', message: 'Exam window cannot exceed 30 days', path: ['end_time'] })
      }
    }
  })

export type ExamConfigInput = z.infer<typeof examConfigSchema>

// ─── Sub-Admin Identity Update (settings — Identity section) ──────────────────
// Used by: useSettings.handleSaveProfile. Replaces the former manual
// `if (!name.trim())` + ad-hoc passwordSchema field mapping. name is required
// (non-empty); password is optional but must satisfy the shared password policy
// when provided (each policy issue is surfaced at the password field).

export const identityUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.trim().length > 0) {
      const pw = passwordSchema.safeParse(data.password)
      if (!pw.success) {
        for (const issue of pw.error.issues) {
          ctx.addIssue({ code: 'custom', message: issue.message, path: ['password'] })
        }
      }
    }
  })

export type IdentityUpdateInput = z.infer<typeof identityUpdateSchema>

// ─── Exam Submission Result Schema ────────────────────────────────────────────
// Used by: useResults.normalizeResult. Validates + coerces the submission-result
// payload (from location.state.result or the submit_attempt RPC) so string-typed
// counts ("5") can never produce number-concatenation bugs at runtime. Both the
// `correct`/`correct_count` and `duration_seconds`/`duration` naming variants are
// accepted; the transform emits a single canonical shape.

const resultCount = z.coerce.number().int().min(0)

export const submitResultSchema = z
  .object({
    correct: resultCount.optional(),
    correct_count: resultCount.optional(),
    wrong: resultCount.optional(),
    wrong_count: resultCount.optional(),
    skipped: resultCount.optional(),
    skipped_count: resultCount.optional(),
    duration_seconds: resultCount.optional(),
    duration: resultCount.optional(),
    score: z.coerce.number().optional(),
    accuracy: z.coerce.number().optional(),
  })
  .transform((res) => ({
    correct: res.correct ?? res.correct_count ?? 0,
    wrong: res.wrong ?? res.wrong_count ?? 0,
    skipped: res.skipped ?? res.skipped_count ?? 0,
    duration_seconds: res.duration_seconds ?? res.duration ?? 0,
    score: res.score ?? 0,
    accuracy: res.accuracy ?? 0,
  }))

export type SubmitResultInput = z.input<typeof submitResultSchema>
export type SubmitResultParsed = z.output<typeof submitResultSchema>
