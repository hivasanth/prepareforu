export interface TeacherExamOption {
  id: string
  title: string
  total_questions: number
  total_marks: number
  marks_per_question: number
  start_time: string
  end_time: string
  created_at: string
  status: string
}

export interface AttemptRow {
  id: string
  user_id: string
  score: number
  total_marks: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  accuracy: number
  duration_seconds: number | null
  submitted_at: string | null
  status: string
  users: { full_name: string; email: string } | null
}

export interface AnswerRow {
  question_id: string
  selected_option: string | null
  is_correct: boolean | null
  attempt_id: string
}

export interface QuestionRow {
  id: string
  question_text_en: string
  correct_option: string
  display_order: number
}

export interface QuestionStat {
  question_id: string
  question_text_en: string
  display_order: number
  total: number
  correct: number
  incorrect: number
  skipped: number
  correctPct: number
  incorrectPct: number
  mostSelected: string
  optionCounts: Record<string, number>
}

export interface EvalData {
  attempts: AttemptRow[]
  questionStats: QuestionStat[]
}

// ─── Modal Types ─────────────────────────────────────────────────────────────

export interface ExamDetailQuestion {
  id: string
  question_text_en: string | null
  correct_option: string
  display_order: number
  option_a_en?: string | null
  option_b_en?: string | null
  option_c_en?: string | null
  option_d_en?: string | null
  explanation_en?: string | null
}

export interface ExamDetailLeaderboardEntry {
  id: string
  user_id: string
  score: number
  total_marks: number
  accuracy: number
  duration_seconds: number | null
  users: { full_name: string } | null
}

export interface ExamDetailData {
  questions: ExamDetailQuestion[]
  leaderboard: ExamDetailLeaderboardEntry[]
}

// ─── Service Boundary Transformers ───────────────────────────────────────────

export function toAttemptRows(data: unknown): AttemptRow[] {
  if (!Array.isArray(data)) return []
  return data as AttemptRow[]
}

export function toQuestionRows(data: unknown): QuestionRow[] {
  if (!Array.isArray(data)) return []
  return data as QuestionRow[]
}

export function toAnswerRows(data: unknown): AnswerRow[] {
  if (!Array.isArray(data)) return []
  return data as AnswerRow[]
}

export function toExamDetailQuestions(data: unknown): ExamDetailQuestion[] {
  if (!Array.isArray(data)) return []
  return data as ExamDetailQuestion[]
}

export function toExamDetailLeaderboard(data: unknown): ExamDetailLeaderboardEntry[] {
  if (!Array.isArray(data)) return []
  return data as ExamDetailLeaderboardEntry[]
}
