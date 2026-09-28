// ─── Diagram Types (canonical definition) ─────────────────────────────────────

export type DiagramData =
  | { type: "pie_chart"; metadata: { labels: string[]; values: number[] } }
  | { type: "bar_chart"; metadata: { x: string[]; y: number[] } }
  | { type: "line_graph"; metadata: { x: string[]; y: number[] } }
  | { type: "table"; metadata: { columns: string[]; rows: unknown[][] } }
  | { type: "venn_diagram"; metadata: { sets: string[]; intersections: Record<string, unknown[]> } }
  | null;

// ─── Question ─────────────────────────────────────────────────────────────────

export interface Question {
  id: string
  exam_id: string
  paper_id: string
  subject_name: string

  correct_option?: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  negative_marks: number
  visual?: QuestionVisual | null
  diagram?: DiagramData

  // ── Bilingual fields (optional, service-layer populated) ──
  question_text_en?: string | null
  question_text_te?: string | null
  topic_en?: string | null
  topic_te?: string | null
  option_a_en?: string | null
  option_a_te?: string | null
  option_b_en?: string | null
  option_b_te?: string | null
  option_c_en?: string | null
  option_c_te?: string | null
  option_d_en?: string | null
  option_d_te?: string | null
  explanation_en?: string | null
  explanation_te?: string | null
}

export const SUPPORTED_VISUAL_TYPES = ['venn', 'chart', 'geometry', 'table', 'mermaid', 'latex', 'svg', 'map_overlay'] as const;
export type VisualType = typeof SUPPORTED_VISUAL_TYPES[number];

export interface QuestionVisual {
  type: VisualType
  title?: string | null
  data: Record<string, unknown>
}

export interface ExamConfig {
  id: string
  exam_id: string
  name: string
  exam_selection: string
  total_questions: number
  total_marks: number
  duration_minutes: number
  negative_marking: boolean
  negative_mark_value: number
  is_published: boolean
  allow_multiple_attempts?: boolean
  min_questions?: number
  created_by?: string | null
  created_at?: string
  updated_at?: string
  pass_marks?: number | null
  active_version_id?: string | null
  start_time?: string | null
  end_time?: string | null
  max_attempts?: number | null
}

export interface ExamPaper {
  id: string
  exam_id: string
  paper_name: string
  stage: 'PRELIMS' | 'MAINS' | 'SINGLE'
  total_questions: number
  total_marks: number
  duration_minutes: number
  negative_marking: boolean
  negative_mark_value: number
  display_order: number
  start_time: string | null
  end_time: string | null
}

export interface ExamSubject {
  id: string
  exam_id: string
  paper_id: string
  subject_name: string
  question_count: number
  marks_per_question: number
  display_order: number
}

export interface ExamTopicConfig {
  id: string
  topic_en: string
  topic_te: string | null
  display_order: number
  required_questions: number
  test_20_required: number
  test_30_required: number
  test_50_required: number
  actual_count: number
}

export type AttemptSource = 'exam_tab' | 'subject_test' | 'prepare_write' | 'teacher_exam' | 'topic_exam';
export type AttemptStatus = 'in_progress' | 'completed' | 'auto_submitted';

export interface Attempt {
  id: string
  user_id: string
  exam_id: string | null
  paper_id: string | null
  teacher_exam_id: string | null
  source: AttemptSource
  status: AttemptStatus
  started_at: string
  submitted_at: string | null
  duration_seconds: number | null
  score: number
  total_marks: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  accuracy: number
  tab_switch_count: number
  has_security_issues: boolean
  review_accessed: boolean
  questions_snapshot: Question[]
  answers_json: Record<string, string | null> | null
}

export interface AttemptWithRelations extends Attempt {
  exam_papers?: { paper_name: string };
  exam_configs?: { name: string };
}

/**
 * Subset of an Attempt used by the performance/dashboard analytics flows.
 * Populated from the narrow `fetchPerformanceAttempts`/`fetchRecentAttempts`
 * queries (attempt.repository.ts) — only these fields are guaranteed present,
 * plus the resolved paper/exam names.
 */
export interface PerformanceAttemptSummary {
  id: string
  exam_id: string
  paper_id: string | null
  score: number
  accuracy: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  submitted_at: string
  /** Whether the one-time review gate (`review_accessed`) has been tripped.
   *  Optional because pre-change cached summaries lack the field; absence
   *  means "not reviewed" and keeps the card's Full Review affordance. */
  review_accessed?: boolean
  exam_papers?: { paper_name: string }
  exam_configs?: { name: string }
}

export interface AttemptAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean | null
  marks_awarded?: number
  time_spent_secs: number
  visited: boolean
  marked_for_review: boolean
  last_visited_at: string | null
}

export interface TeacherExam {
  id: string
  sub_admin_id: string
  title: string
  instructions: string | null
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'published' | 'draft' | 'expired'
  marks_per_question: number
  negative_marking: boolean
  negative_mark_value: number
  total_questions: number
  total_marks: number
  attempt_count: number
  created_at: string
}

export type TeacherExamStatus = 'upcoming' | 'live' | 'ended'

export interface TeacherExamAttempt {
  status: string
  id: string
  score: number
  accuracy: number
  source: AttemptSource
  started_at: string
  submitted_at: string | null
}

export interface TeacherExamWithAttempt extends TeacherExam {
  attempts: TeacherExamAttempt[];
}

export interface TeacherExamLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
  time: string;
}

export interface SubmitResult {
  success: boolean
  score: number
  correct: number
  wrong: number
  skipped: number
  accuracy: number
  duration_seconds: number
}

// ─── Study Topics ─────────────────────────────────────────────────────────────

export type TopicSectionType =
  | 'key_features'
  | 'sites'
  | 'list'
  | 'cards'
  | 'memory_trick'
  | 'quick_summary'

export interface TopicSectionItem {
  icon?: string
  heading_en?: string
  heading_te?: string
  body_en?: string
  body_te?: string
}

export interface TopicSection {
  type: TopicSectionType
  label_en: string
  label_te: string
  items: TopicSectionItem[]
}

export interface StudyTopic {
  id: string
  exam_id: string
  paper_id: string
  subject_name: string
  title_en: string
  title_te: string
  summary_en: string
  summary_te: string
  content_en: TopicSection[]
  content_te: TopicSection[]
  youtube_url: string | null
  display_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}
