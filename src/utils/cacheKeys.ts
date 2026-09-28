/**
 * Cache-key builders for the QueryCache layer. Single source of truth so key
 * formats are never duplicated across services (dashboardService /
 * performanceService) and can be invalidated consistently after writes.
 */

export const DASH_STATS_PREFIX = 'dash_stats_';
export const DASH_RECENT_PREFIX = 'dash_recent_';
export const PERF_ATTEMPTS_PREFIX = 'perf_attempts_';
export const PERF_METADATA_PREFIX = 'perf_metadata_';
export const PERF_SUBJECT_STATS_PREFIX = 'perf_subject_';

// Educator exams — leaderboard cache key. Deliberately user-scoped first so
// one account can never hydrate another account's cached rows, even though the
// board content is shared per exam. Invalidation after a submit targets this
// exact key (never a wildcard prefix).
export const TEACHER_EXAM_LB_PREFIX = 'teacher_exam_lb_';

export function teacherExamLeaderboardKey(userId: string, examId: string): string {
  return `${TEACHER_EXAM_LB_PREFIX}${userId}_${examId}`;
}

export function dashStatsKey(userId: string): string {
  return `${DASH_STATS_PREFIX}${userId}`;
}

export function dashRecentKey(userId: string, examSelection?: string | null): string {
  return `${DASH_RECENT_PREFIX}${userId}_${examSelection ?? 'none'}`;
}

export function perfAttemptsKey(userId: string): string {
  return `${PERF_ATTEMPTS_PREFIX}${userId}`;
}

export function perfMetadataKey(examSelection: string): string {
  return `${PERF_METADATA_PREFIX}${examSelection}`;
}

export interface SubjectStatsFilter {
  examId?: string | null
  paperId?: string | null
  from?: string | null
}

export function perfSubjectStatsKey(userId: string, filter: SubjectStatsFilter): string {
  return `${PERF_SUBJECT_STATS_PREFIX}${userId}:${filter.examId || 'all'}:${filter.paperId || 'all'}:${filter.from || 'all'}`;
}
