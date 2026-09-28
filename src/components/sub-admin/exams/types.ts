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
  /** Full question rows (for the Questions section). Optional for backwards
   *  compatibility with data constructed without it (e.g. tests). */
  questions?: ExamDetailQuestion[]
}

// ─── Modal Types ─────────────────────────────────────────────────────────────

export interface ExamDetailQuestion {
  id: string
  question_text_en: string | null
  question_text_te?: string | null
  correct_option: string
  display_order: number
  difficulty?: 'easy' | 'medium' | 'hard' | null
  option_a_en?: string | null
  option_b_en?: string | null
  option_c_en?: string | null
  option_d_en?: string | null
  option_a_te?: string | null
  option_b_te?: string | null
  option_c_te?: string | null
  option_d_te?: string | null
  explanation_en?: string | null
  explanation_te?: string | null
}

export interface ExamDetailLeaderboardEntry {
  id: string
  user_id: string
  score: number
  total_marks: number
  accuracy: number
  duration_seconds: number | null
  submitted_at?: string | null
  users: { full_name: string } | null
}

export interface ExamDetailData {
  questions: ExamDetailQuestion[]
  leaderboard: ExamDetailLeaderboardEntry[]
}

// ─── Service Boundary Transformers ───────────────────────────────────────────

import type { AdminLeaderboardEntry } from '../../../types/leaderboard.types'

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

/* Aggregates the exam's per-attempt rows into the ADMIN leaderboard view model
 * (per-student best score) so the shared Admin LeaderboardView renders the
 * identical Rank · Participant · Score · Duration · Attempts · Last Active look
 * used on the admin page. Tier: score desc → duration asc → last active asc →
 * user_id, so ranks are deterministic. `last_attempt_date` keeps the newest
 * submitted_at for the "Last Active" column. */
export function toAdminLeaderboardEntries(
  rows: ExamDetailLeaderboardEntry[],
  examId: string,
  examTitle: string,
): AdminLeaderboardEntry[] {
  interface StudentAgg {
    name: string
    best: ExamDetailLeaderboardEntry
    attempts: number
    lastActive: string | null
  }

  const byUser = new Map<string, StudentAgg>()
  for (const row of rows) {
    if (!row.user_id) continue
    const name = row.users?.full_name?.trim() || 'Anonymous Student'
    const cur = byUser.get(row.user_id)
    if (!cur) {
      byUser.set(row.user_id, { name, best: row, attempts: 1, lastActive: row.submitted_at ?? null })
      continue
    }
    cur.attempts += 1
    if (row.submitted_at && (!cur.lastActive || row.submitted_at > cur.lastActive)) {
      cur.lastActive = row.submitted_at
    }
    const isBetter = (candidate: ExamDetailLeaderboardEntry, current: ExamDetailLeaderboardEntry) => {
      if (candidate.score !== current.score) return candidate.score > current.score
      const tC = candidate.duration_seconds ?? Number.POSITIVE_INFINITY
      const tK = current.duration_seconds ?? Number.POSITIVE_INFINITY
      if (tC !== tK) return tC < tK
      return (candidate.submitted_at ?? '') > (current.submitted_at ?? '')
    }
    if (isBetter(row, cur.best)) cur.best = row
  }

  const sorted = [...byUser.entries()].sort((a, b) => {
    const ea = a[1].best
    const eb = b[1].best
    if (eb.score !== ea.score) return eb.score - ea.score
    const tA = ea.duration_seconds ?? Number.POSITIVE_INFINITY
    const tB = eb.duration_seconds ?? Number.POSITIVE_INFINITY
    if (tA !== tB) return tA - tB
    return (a[1].lastActive ?? '').localeCompare(b[1].lastActive ?? '') || a[0].localeCompare(b[0])
  })

  return sorted.map(([userId, agg], index) => ({
    user_id: userId,
    user_name: agg.name,
    exam_id: examId,
    exam_selection: examTitle,
    paper_id: null,
    best_score: agg.best.score,
    best_accuracy: agg.best.accuracy,
    best_time_secs: agg.best.duration_seconds ?? 0,
    last_attempt_date: agg.lastActive ?? agg.best.submitted_at ?? '1970-01-01T00:00:00Z',
    total_attempts: agg.attempts,
    rank: index + 1,
  }))
}
