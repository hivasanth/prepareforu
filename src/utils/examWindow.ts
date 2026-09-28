/* Exam-window classification for the Sub-Admin My Exams LIVE/UPCOMING/PUBLISHED
 * view. LIVE vs UPCOMING vs PUBLISHED is a pure function of the sub-admin-set
 * start_time / end_time window — the same semantics the student-facing educator
 * exams page uses (useTeacherExams) and the dashboard "active exams" count
 * (countActiveTeacherExamsBySubAdminId: start_time <= now AND end_time >= now).
 *
 * Boundary rule (matches existing app, not strict <): an exam is still LIVE at
 * the exact end_time; it becomes PUBLISHED (ended) strictly after end_time.
 *
 * This is a PRESENTATION/VIEW classification only — it is not a security
 * boundary. Rows are already authorized by the service layer (sub_admin_id +
 * ensureRole + RLS); this util never grants or revokes access. */

export type ExamViewFilter = 'live' | 'upcoming' | 'published'

export type ExamWindowState = 'live' | 'upcoming' | 'published'

export interface ExamWindowInput {
  start_time: string | null | undefined
  end_time: string | null | undefined
}

/** Classify an exam against the current instant. Invalid or missing schedule
 * data is never classified LIVE (malformed scheduling must not look active). */
export function classifyExamWindow(exam: ExamWindowInput, now: Date): ExamWindowState {
  const start = toMs(exam.start_time)
  const end = toMs(exam.end_time)
  if (start === null || end === null) return 'published'
  if (end < start) return 'published' // invalid schedule: never live/upcoming
  const t = now.getTime()
  if (t < start) return 'upcoming'
  if (t <= end) return 'live'
  return 'published'
}

function toMs(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? null : ms
}
