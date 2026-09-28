import { describe, it, expect } from 'vitest'
import { toAdminLeaderboardEntries, type ExamDetailLeaderboardEntry } from './types'

function attempt(
  p: { id: string; user_id: string; score: number } & Partial<ExamDetailLeaderboardEntry>
): ExamDetailLeaderboardEntry {
  const base: ExamDetailLeaderboardEntry = {
    id: p.id, user_id: p.user_id, score: p.score,
    total_marks: 10, accuracy: 100, duration_seconds: 60,
    submitted_at: '2026-08-05T10:00:00Z', users: { full_name: 'Test User' },
  }
  return { ...base, ...p }
}

describe('toAdminLeaderboardEntries — per-student best aggregation (admin leaderboard view model)', () => {
  it('keeps the best score per student, counts attempts, and ranks deterministically', () => {
    const rows = [
      attempt({ id: 'a1', user_id: 'u2', score: 40, users: { full_name: 'Beta' } }),
      attempt({ id: 'a2', user_id: 'u1', score: 70, users: { full_name: 'Alpha' } }),
      attempt({ id: 'a3', user_id: 'u1', score: 55, users: { full_name: 'Alpha' } }),
    ]
    const out = toAdminLeaderboardEntries(rows, 'ex-1', 'Probe Exam One')
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ user_name: 'Alpha', best_score: 70, total_attempts: 2, rank: 1, exam_id: 'ex-1', exam_selection: 'Probe Exam One' })
    expect(out[1]).toMatchObject({ user_name: 'Beta', best_score: 40, total_attempts: 1, rank: 2 })
  })

  it('ties break by quicker duration, then by last-active date', () => {
    const rows = [
      attempt({ id: 'a1', user_id: 'u1', score: 80, duration_seconds: 120, submitted_at: '2026-08-05T10:00:00Z', users: { full_name: 'Slow' } }),
      attempt({ id: 'a2', user_id: 'u2', score: 80, duration_seconds: 90, submitted_at: '2026-08-05T09:00:00Z', users: { full_name: 'Fast' } }),
    ]
    const out = toAdminLeaderboardEntries(rows, 'ex-1', 'Exam')
    expect(out.map(e => e.user_name)).toEqual(['Fast', 'Slow'])
    expect(out[0].best_time_secs).toBe(90)
    expect(out[0].rank).toBe(1)
  })

  it('last_attempt_date is the newest attempt for repeated students', () => {
    const rows = [
      attempt({ id: 'a1', user_id: 'u1', score: 60, submitted_at: '2026-08-05T10:00:00Z', users: { full_name: 'First' } }),
      attempt({ id: 'a2', user_id: 'u1', score: 80, submitted_at: '2026-08-08T14:30:00Z', users: { full_name: 'Later' } }),
    ]
    const out = toAdminLeaderboardEntries(rows, 'ex-1', 'Exam')
    expect(out[0].best_score).toBe(80)
    expect(out[0].last_attempt_date).toBe('2026-08-08T14:30:00Z')
    expect(out[0].total_attempts).toBe(2)
  })

  it('falls back to Anonymous Student, empty exam title, and zero time', () => {
    const rows = [
      attempt({ id: 'a1', user_id: 'u9', score: 30, users: null, submitted_at: null, duration_seconds: null }),
    ]
    const [out] = toAdminLeaderboardEntries(rows, 'ex-9', '')
    expect(out.user_name).toBe('Anonymous Student')
    expect(out.exam_selection).toBe('')
    expect(out.last_attempt_date).toBe('1970-01-01T00:00:00Z')
    expect(out.best_time_secs).toBe(0)
    expect(out.best_accuracy).toBe(100)
  })

  it('returns no rows for an empty input', () => {
    expect(toAdminLeaderboardEntries([], 'ex-1', 'Exam')).toEqual([])
  })
})