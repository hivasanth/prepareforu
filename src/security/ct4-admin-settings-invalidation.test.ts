import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/repositories/exam.repository', () => ({
  saveAdminSettingsAtomic: vi.fn(),
}))

vi.mock('../utils/queryCache', () => ({
  queryCache: { invalidateByPrefix: vi.fn(), invalidate: vi.fn(), get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}))

import * as repo from '../lib/repositories/exam.repository'
import { queryCache } from '../utils/queryCache'
import { adminService } from '../services/adminService'
import type { UserProfile } from '../types/auth.types'
import type { AdminSettingsAtomicPayload } from '../lib/repositories/exam.repository'

const admin = { id: 'u-admin', role: 'admin' } as unknown as UserProfile
const normalUser = { id: 'u-user', role: 'user' } as unknown as UserProfile

const m = (fn: unknown) => fn as unknown as ReturnType<typeof vi.fn>

const PAYLOAD: AdminSettingsAtomicPayload = {
  examId: 'EXAM_A',
  paperId: null,
  config: {
    total_questions: 10,
    total_marks: 12,
    duration_minutes: 45,
    negative_marking: false,
    negative_mark_value: 0,
    is_published: true,
    allow_multiple_attempts: true,
  },
  subjects: [
    { id: 'sub-0', question_count: 5, marks_per_question: 1 },
    { id: 'sub-1', question_count: 5, marks_per_question: 1 },
  ],
  topics: [],
}

// Every cache family that save_admin_settings_rpc can make stale — each one
// maps to a distinct config table the atomic RPC writes to.
const EXPECTED_PREFIXES = [
  'subjects_exam_',
  'subjects_paper_',
  'subject_counts_',
  'appsc_papers_',
  'topics_',
  'topic_counts_',
  'user_papers_',
  'papers_config_',
  'paper_dist_',
  'exams_config_',
]

const EXPECTED_ACTIVE_EXAMS_INVALIDATE = 'active_exams'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CT-4 :: Admin Settings atomic save cache invalidation', () => {
  it('invalidates every config-display cache family AFTER a successful DB write', async () => {
    m(repo.saveAdminSettingsAtomic).mockResolvedValue({
      ok: true, configs_updated: 1, papers_updated: 2, subjects_updated: 2, topics_updated: 8,
    })

    const result = await adminService.saveAdminSettingsAtomic({ user: admin }, PAYLOAD)

    expect(result.ok).toBe(true)
    for (const prefix of EXPECTED_PREFIXES) {
      expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith(prefix)
    }
    expect(m(queryCache.invalidate)).toHaveBeenCalledWith(EXPECTED_ACTIVE_EXAMS_INVALIDATE)
  })

  it('never invalidates any cache when the DB write rejects (atomicity first)', async () => {
    m(repo.saveAdminSettingsAtomic).mockRejectedValue(
      new Error('Failed to save settings atomically: SUM_MISMATCH: Topic requirements sum (6) must equal subject total (5)')
    )

    await expect(
      adminService.saveAdminSettingsAtomic({ user: admin }, PAYLOAD)
    ).rejects.toThrow(/SUM_MISMATCH/)

    expect(m(queryCache.invalidateByPrefix)).not.toHaveBeenCalled()
    expect(m(queryCache.invalidate)).not.toHaveBeenCalled()
  })

  it('does not invalidate a wholesale reset (no global clear) on success', async () => {
    m(repo.saveAdminSettingsAtomic).mockResolvedValue({
      ok: true, configs_updated: 0, papers_updated: 0, subjects_updated: 0, topics_updated: 0,
    })

    await adminService.saveAdminSettingsAtomic({ user: admin }, PAYLOAD)

    expect((queryCache.clear as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })

  it('rejects non-admin callers before any DB write or invalidation runs', async () => {
    await expect(
      adminService.saveAdminSettingsAtomic({ user: normalUser }, PAYLOAD)
    ).rejects.toThrow()

    expect(repo.saveAdminSettingsAtomic).not.toHaveBeenCalled()
    expect(m(queryCache.invalidateByPrefix)).not.toHaveBeenCalled()
    expect(m(queryCache.invalidate)).not.toHaveBeenCalled()
  })

  it('passes the exact atomic RPC payload contract (mode exams) to the repository', async () => {
    m(repo.saveAdminSettingsAtomic).mockResolvedValue({
      ok: true, configs_updated: 1, papers_updated: 2, subjects_updated: 2, topics_updated: 8,
    })

    await adminService.saveAdminSettingsAtomic({ user: admin }, PAYLOAD)
    expect(repo.saveAdminSettingsAtomic).toHaveBeenCalledTimes(1)
    expect(repo.saveAdminSettingsAtomic).toHaveBeenCalledWith(PAYLOAD)
  })
})
