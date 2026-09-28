import type { ExamConfig, ExamSubject, ExamTopicConfig } from '../../../../types/exam.types'

/* ═══ Admin Settings draft normalization — single comparison authority ══════
 * ONE canonical representation of the PERSISTED, editable Admin Settings
 * data. Used by the dual-baseline dirty model:
 *
 *   isDirty                 = normalize(currentDraft) !== initBaseline
 *   draftDivergesFromServer = normalize(currentDraft) !== serverSnapshot
 *
 * Only fields the existing save paths (saveAll / saveSubjectTest) actually
 * persist are included. Navigation context (exam/paper/subject selection),
 * loading/error/modal state and other UI-only values NEVER enter the
 * snapshot. Numeric coercion removes string-vs-number false positives;
 * topic arrays are sorted by id so ordering can never fabricate a diff.
 * ═══════════════════════════════════════════════════════════════════════ */

/** Persisted paper/exam parameter fields written by saveAll. */
export interface NormalizedParams {
  total_questions: number
  total_marks: number
  duration_minutes: number
  negative_marking: boolean
  negative_mark_value: number
  is_published: boolean
  allow_multiple_attempts: boolean
}

export interface NormalizedTopicThresholds {
  id: string
  required_questions: number
  test_20_required: number
  test_30_required: number
  test_50_required: number
}

export interface NormalizedSettingsDraft {
  config: NormalizedParams | null
  /** question_count per subject row id (stable unique key). */
  subjects: Record<string, number>
  /** Per-subject threshold rows sorted by topic id. */
  topics: Record<string, NormalizedTopicThresholds[]>
}

const toNum = (v: unknown): number => Number(v ?? 0)
const toBool = (v: unknown): boolean => v === true || v === 'true'

function normalizeConfig(config: ExamConfig | null): NormalizedParams | null {
  if (!config) return null
  return {
    total_questions: toNum(config.total_questions),
    total_marks: toNum(config.total_marks),
    duration_minutes: toNum(config.duration_minutes),
    negative_marking: toBool(config.negative_marking),
    negative_mark_value: toNum(config.negative_mark_value),
    is_published: toBool(config.is_published),
    allow_multiple_attempts: toBool(config.allow_multiple_attempts),
  }
}

function normalizeTopics(topics: ExamTopicConfig[] | undefined): NormalizedTopicThresholds[] {
  if (!topics?.length) return []
  return [...topics]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(t => ({
      id: t.id,
      required_questions: toNum(t.required_questions),
      test_20_required: toNum(t.test_20_required),
      test_30_required: toNum(t.test_30_required),
      test_50_required: toNum(t.test_50_required),
    }))
}

/**
 * Canonical normalization of the Admin Settings draft. Accepts the three live
 * state slices plus an optional raw-server topic payload map so the same
 * function normalizes both sides of each comparison:
 *   - `topicConfigs` → the current/initialized draft
 *   - `rawTopics`    → exactly what the server returned, pre-distribution
 */
export function normalizeAdminSettingsDraft(input: {
  config: ExamConfig | null
  subjects: ExamSubject[]
  /** Current draft topic configs keyed by subject name. */
  topicConfigs?: Record<string, ExamTopicConfig[]>
  /** Raw server topic payloads keyed by subject name (pre-redistribution). */
  rawTopics?: Record<string, ExamTopicConfig[]>
}): NormalizedSettingsDraft {
  const subjects: Record<string, number> = {}
  for (const s of input.subjects) subjects[s.id] = toNum(s.question_count)

  const topics: Record<string, NormalizedTopicThresholds[]> = {}
  const source = input.rawTopics ?? input.topicConfigs ?? {}
  for (const [name, list] of Object.entries(source)) {
    if (list?.length) topics[name] = normalizeTopics(list)
  }

  return { config: normalizeConfig(input.config), subjects, topics }
}

/** Structural deep equality for plain normalized JSON data. */
export function deepEqualPlain(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => deepEqualPlain(item, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    if (ka.length !== kb.length) return false
    return ka.every(k =>
      deepEqualPlain((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    )
  }
  return false
}
