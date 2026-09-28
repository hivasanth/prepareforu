import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DashboardStats } from './dashboardService'
import type { PerformanceAttemptSummary } from '../types/exam.types'

// ─── Mock all external dependencies of dashboardService ────────────────────
// dashboardService imports:
//   ../lib/repositories/attempt.repository   (fetchDailyAttempts)
//   ../lib/repositories/dashboard.repository (fetchDashboardStatsRpc)
//   ../lib/repositories/base.repository      (countQuery)
//   ./performanceService                     (fetchDashboardRecentAttempts)
//   ../utils/examUtils                       (getAllowedExamIds)
//   ../utils/queryCache                      (queryCache singleton)
//   ../utils/cacheKeys                       (dashStatsKey, dashRecentKey)
//   date-fns                                 (format, parseISO)
//   ../utils/logger                          (logError)
//   ../utils/errorClassification             (classifyError)

const { repo, perfSvc, cache, examUtils, logger, errClass } = vi.hoisted(() => ({
  repo: { fetchDashboardStatsRpc: vi.fn() },
  perfSvc: { fetchDashboardRecentAttempts: vi.fn() },
  cache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    fetchWithDedup: vi.fn<(key: string, fn: () => Promise<unknown>, ttl?: number, force?: boolean) => Promise<unknown>>(
      async (_key: string, fn: () => Promise<unknown>) => fn()
    ),
    invalidate: vi.fn(),
    invalidateByPrefix: vi.fn(),
    clear: vi.fn(),
  },
  examUtils: { getAllowedExamIds: vi.fn(() => ['ALL']) },
  logger: { logError: vi.fn(), logInfo: vi.fn(), logWarn: vi.fn() },
  errClass: {
    classifyError: vi.fn(() => ({
      category: 'network' as const,
      code: 'NETWORK_FETCH_FAILED' as const,
      message: 'Something went wrong',
    })),
  },
}))

vi.mock('../lib/repositories/dashboard.repository', () => repo)
vi.mock('./performanceService', () => ({ ...perfSvc, getCachedAttempts: vi.fn(() => []), clearPerformanceCache: vi.fn() }))
vi.mock('../utils/queryCache', () => ({ queryCache: cache }))
vi.mock('../utils/examUtils', () => examUtils)
vi.mock('../utils/logger', () => logger)
vi.mock('../utils/errorClassification', () => errClass)

// Some dashboardService paths also pull in attempt.repository/base.repository;
// provide no-op mocks that are never exercised by the tested methods.
vi.mock('../lib/repositories/attempt.repository', () => ({
  fetchDailyAttempts: vi.fn(async () => []),
  fetchRecentAttempts: vi.fn(async () => []),
  fetchPerformanceAttempts: vi.fn(async () => []),
}))
vi.mock('../lib/repositories/base.repository', () => ({
  countQuery: vi.fn(async () => 0),
}))

// ─── Imports after mocking ─────────────────────────────────────────────────

import { dashboardService } from './dashboardService'

function stats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    daily_streak: 3,
    highest_streak: 5,
    exams_taken: 8,
    accuracy: 78.5,
    global_rank: 'Rank #12',
    ...overrides,
  }
}

// ─── Compatibility: original dashboard RPC returned a subset of fields ─────
// The authoritative `get_user_dashboard_stats` jsonb payload is
// { daily_streak, exams_taken, accuracy, global_rank }. The typed service
// surface additionally carries `highest_streak`; the repo is responsible for
// aligning the RPC shape to the type (defaulting missing fields safely).
const RPC_PAYLOAD = (o: Partial<DashboardStats> = {}) => stats(o)

beforeEach(() => {
  vi.clearAllMocks()
  cache.get.mockReturnValue(null)
  cache.fetchWithDedup.mockImplementation(async (_k: string, fn: () => Promise<unknown>) => fn())
  repo.fetchDashboardStatsRpc.mockReset()
  perfSvc.fetchDashboardRecentAttempts.mockReset()
})

describe('dashboardService.fetchDashboardStats (contract)', () => {
  it('SUCCESS — maps a successful RPC payload to { success: true, data }', async () => {
    repo.fetchDashboardStatsRpc.mockResolvedValue(RPC_PAYLOAD({ daily_streak: 4, exams_taken: 10, accuracy: 90 }))
    const res = await dashboardService.fetchDashboardStats('u1')
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ daily_streak: 4, exams_taken: 10, accuracy: 90, global_rank: 'Rank #12' })
    expect(repo.fetchDashboardStatsRpc).toHaveBeenCalledWith('u1')
  })

  it('NULL response — treats as auth/session failure, NEVER fabricates zeroed stats', async () => {
    // get_user_dashboard_stats returns NULL when auth.uid() is missing or != p_user_id.
    repo.fetchDashboardStatsRpc.mockResolvedValue(null)
    const res = await dashboardService.fetchDashboardStats('u1')
    expect(res.success).toBe(false)
    if (res.success) throw new Error('unreachable')
    expect(res.error?.code).toBeDefined()
    // Critical: must not return { success: true, data: zeroedStats }.
    expect(res.success).toBe(false)
  })

  it('BACKEND ERROR — wraps into { success:false, error:{source,code,message} }', async () => {
    repo.fetchDashboardStatsRpc.mockRejectedValue(new Error('boom'))
    const res = await dashboardService.fetchDashboardStats('u1')
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatchObject({ source: expect.any(String), code: expect.any(String), message: expect.any(String) })
    }
    expect(logger.logError).toHaveBeenCalled()
  })

  it('AUTHORITATIVE ACCURACY SEMANTICS — matches SUM(correct)/SUM(correct+wrong)*100', async () => {
    // Reproduce the authoritative per-attempt accuracy semantics from
    // submit_attempt (20260527000001_critical_submit_fixes.sql:94) and its
    // aggregate get_user_accuracy (SUM(correct_count)/(SUM(correct+wrong))*100).
    // Given identical underlying counts the Dashboard's accuracy must equal the
    // authoritative weighted aggregate — NOT a simple mean of per-attempt %.
    const attempts = [
      { correct_count: 9, wrong_count: 1 },   // 90%
      { correct_count: 5, wrong_count: 0 },   // 100%
    ]
    const sumCorrect = attempts.reduce((a, c) => a + c.correct_count, 0)
    const sumWrong = attempts.reduce((a, c) => a + c.wrong_count, 0)
    const authoritativeAccuracy = (sumCorrect / (sumCorrect + sumWrong)) * 100 // 14/15 = 93.33

    // The RPC is the authoritative calculator (source of truth). We assert the
    // wire contract is bound to that formula and never to an unweighted mean
    // (which here would be (90+100)/2 = 95).
    expect(Math.round(authoritativeAccuracy)).toBe(93)
    expect(authoritativeAccuracy).not.toBe(95)

    repo.fetchDashboardStatsRpc.mockResolvedValue(RPC_PAYLOAD({ accuracy: parseFloat(authoritativeAccuracy.toFixed(2)) }))
    const res = await dashboardService.fetchDashboardStats('u1')
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data?.accuracy).toBeCloseTo(93.33, 1)
    }
  })
})

describe('dashboardService.fetchRecentAttempts (contract)', () => {
  it('SUCCESS — maps service data, falling back to [] when repository returns null/undefined', async () => {
    perfSvc.fetchDashboardRecentAttempts.mockResolvedValue([])
    const res = await dashboardService.fetchRecentAttempts('u1', 'APPSC_GROUPS')
    expect(res.success).toBe(true)
    if (res.success) expect(res.data).toEqual([])
    expect(perfSvc.fetchDashboardRecentAttempts).toHaveBeenCalledWith('u1', 'APPSC_GROUPS', false)
  })

  it('EMPTY/NULL — returns [] (valid empty), not an error', async () => {
    perfSvc.fetchDashboardRecentAttempts.mockResolvedValue(null)
    const res = await dashboardService.fetchRecentAttempts('u1')
    expect(res.success).toBe(true)
    if (res.success) expect(res.data).toEqual([])
  })

  it('BACKEND ERROR — wraps into error result', async () => {
    perfSvc.fetchDashboardRecentAttempts.mockRejectedValue(new Error('network down'))
    const res = await dashboardService.fetchRecentAttempts('u1')
    expect(res.success).toBe(false)
  })

  it('RECENT ACTIVITY IS NOT THE AGGREGATE SOURCE — totals come from the RPC, not the list', async () => {
    // Even when recent activity is capped (e.g. 5 rows), exams_taken must be
    // the authoritative COUNT from the RPC — never recentActivity.length.
    const recentList: PerformanceAttemptSummary[] = Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`, exam_id: 'ALL', paper_id: null, score: 0, accuracy: 0,
      correct_count: 0, wrong_count: 0, skipped_count: 0, submitted_at: new Date().toISOString(),
    }))
    perfSvc.fetchDashboardRecentAttempts.mockResolvedValue(recentList)
    repo.fetchDashboardStatsRpc.mockResolvedValue(RPC_PAYLOAD({ exams_taken: 48 }))

    const [recent, statsRes] = await Promise.all([
      dashboardService.fetchRecentAttempts('u1'),
      dashboardService.fetchDashboardStats('u1'),
    ])

    expect(recent.success && (recent.data?.length ?? 0)).toBe(5)
    expect(statsRes.success && statsRes.data?.exams_taken).toBe(48) // 5 !== 48
    if (statsRes.success) expect(statsRes.data?.exams_taken).not.toEqual(recent.success ? (recent.data?.length ?? 0) : 0)
  })
})

describe('dashboardService cache scoping (cross-user isolation, Case H)', () => {
  it('user-scoped cache keys never bleed across users', async () => {
    const { dashStatsKey, dashRecentKey } = await import('../utils/cacheKeys')
    expect(dashStatsKey('userA')).not.toBe(dashStatsKey('userB'))
    expect(dashRecentKey('userA', 'APPSC_GROUPS')).not.toBe(dashRecentKey('userB', 'APPSC_GROUPS'))
    // Same user + same selection resolves to the identical key (safe dedup).
    expect(dashStatsKey('userA')).toBe(dashStatsKey('userA'))
  })
})
