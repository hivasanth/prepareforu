/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const qcMocks = vi.hoisted(() => ({
  fetchWithDedup: vi.fn(),
  invalidate: vi.fn(),
  invalidateByPrefix: vi.fn(),
}))

const trRepoMocks = vi.hoisted(() => ({
  findTeacherExamById: vi.fn(),
  fetchTeacherExamLeaderboardRpc: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  ensureRole: vi.fn(),
}))

vi.mock('../utils/queryCache', () => ({
  queryCache: {
    fetchWithDedup: qcMocks.fetchWithDedup,
    invalidate: qcMocks.invalidate,
    invalidateByPrefix: qcMocks.invalidateByPrefix,
  },
}))

vi.mock('../utils/authUtils', () => ({
  ensureRole: authMocks.ensureRole,
}))

vi.mock('../lib/repositories/teacherExam.repository', () => ({
  findTeacherExamById: trRepoMocks.findTeacherExamById,
  fetchTeacherExamLeaderboardRpc: trRepoMocks.fetchTeacherExamLeaderboardRpc,
}))

vi.mock('../lib/repositories/attempt.repository', () => ({}))

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

// ─── Subject under test ──────────────────────────────────────────────────────

import { fetchTeacherExamLeaderboard, invalidateTeacherExamLeaderboard } from '../services/teacherExamService'
import type { UserProfile } from '../types/auth.types'

const mockUser = {
  id: 'user-1',
  sub_admin_id: 'sa-1',
  role: 'sub_admin',
} as unknown as UserProfile

function ownableExam() {
  return { sub_admin_id: 'sa-1', title: 'Math Midterm', created_at: '2026-09-01T00:00:00Z' }
}

beforeEach(() => {
  vi.clearAllMocks()
  trRepoMocks.findTeacherExamById.mockResolvedValue(ownableExam())
  trRepoMocks.fetchTeacherExamLeaderboardRpc.mockResolvedValue([
    { rank: 1, name: 'Ada', score: 90, accuracy: 0.9, duration_seconds: 125 },
    { rank: 2, name: 'Grace', score: 75, accuracy: 0.75, duration_seconds: 600 },
    { rank: 3, name: '', score: 30, accuracy: 0.3, duration_seconds: null },
  ])
  authMocks.ensureRole.mockResolvedValue(undefined)
  qcMocks.fetchWithDedup.mockImplementation(async (_key: string, fn: () => unknown) => fn())
})

describe('M-1: leaderboard is server-ranked via RPC', () => {
  it('maps RPC rows to display entries with derived time strings', async () => {
    const entries = await fetchTeacherExamLeaderboard({ user: mockUser }, 'EXAM_1')

    expect(entries).toEqual([
      { rank: 1, name: 'Ada', score: 90, accuracy: 0.9, time: '2m 5s' },
      { rank: 2, name: 'Grace', score: 75, accuracy: 0.75, time: '10m 0s' },
      { rank: 3, name: 'Anonymous', score: 30, accuracy: 0.3, time: '--m --s' },
    ])
    expect(trRepoMocks.findTeacherExamById).toHaveBeenCalledWith('EXAM_1')
    expect(trRepoMocks.fetchTeacherExamLeaderboardRpc).toHaveBeenCalledWith('EXAM_1')
    expect(authMocks.ensureRole).toHaveBeenCalledTimes(1)
  })

  it('keeps the client-side ownership gate as defense-in-depth', async () => {
    // ensureRole is a synchronous validation guard that THROWS on failure
    // (not an async reject) — before the RPC is ever reached.
    authMocks.ensureRole.mockImplementationOnce(() => {
      throw new Error('Not authorized')
    })
    await expect(fetchTeacherExamLeaderboard({ user: mockUser }, 'EXAM_1'))
      .rejects.toThrow('Not authorized')
    expect(trRepoMocks.fetchTeacherExamLeaderboardRpc).not.toHaveBeenCalled()
  })
})

describe('M-4: leaderboard cache key is user-scoped and invalidated exactly-on-target', () => {
  it('caches under the user-scoped canonical key without cross-user collisions', async () => {
    const keys: string[] = []
    qcMocks.fetchWithDedup.mockImplementation(async (key: string, fn: () => unknown) => {
      keys.push(key)
      return fn()
    })

    await fetchTeacherExamLeaderboard({ user: mockUser }, 'EXAM_1')
    await fetchTeacherExamLeaderboard({ user: { ...mockUser, id: 'user-2' } }, 'EXAM_1')

    expect(keys[0]).toBe('teacher_exam_lb_user-1_EXAM_1')
    expect(keys[1]).toBe('teacher_exam_lb_user-2_EXAM_1')
    expect(keys[0]).not.toBe(keys[1])
  })

  it('invalidateTeacherExamLeaderboard removes exactly the submitting user exam entry', () => {
    invalidateTeacherExamLeaderboard('user-1', 'EXAM_1')
    expect(qcMocks.invalidate).toHaveBeenCalledTimes(1)
    expect(qcMocks.invalidate).toHaveBeenCalledWith('teacher_exam_lb_user-1_EXAM_1')

    // A different user's row for the same exam must stay untouched.
    expect(qcMocks.invalidate).not.toHaveBeenCalledWith('teacher_exam_lb_other_EXAM_1')
    expect(qcMocks.invalidateByPrefix).not.toHaveBeenCalled()
  })

  it('is a safe no-op when the user id is missing', () => {
    invalidateTeacherExamLeaderboard(null, 'EXAM_1')
    expect(qcMocks.invalidate).not.toHaveBeenCalled()
  })
})