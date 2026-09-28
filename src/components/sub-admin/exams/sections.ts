/* ─── Exam detail section registry ───────────────────────────────────────────
 * Single source of truth for the segmented exam-detail views. Stable string
 * ids are URL-addressable (`?section=<id>`) — never fragile array indexes.
 * Order here is the canonical display order.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ExamSectionDef {
  id: string
  label: string
}

export const EXAM_SECTIONS: ExamSectionDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'questions', label: 'Questions' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'score-distribution', label: 'Score Distribution' },
  { id: 'question-analysis', label: 'Question Analysis' },
  { id: 'performers', label: 'Top & Bottom' },
]

export const EXAM_SECTION_IDS = EXAM_SECTIONS.map(s => s.id)

export function isExamSectionId(value: string | null | undefined): value is string {
  return value != null && value !== '' && EXAM_SECTION_IDS.includes(value)
}

export function resolveExamSection(value: string | null | undefined): string {
  return isExamSectionId(value) ? value : EXAM_SECTIONS[0].id
}
