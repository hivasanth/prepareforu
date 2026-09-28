/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useExamData } from '../components/sub-admin/exams/useExamData'
import { ExamListSection } from '../components/sub-admin/exams/ExamListSection'
import { ExamDetailSection } from '../components/sub-admin/exams/ExamDetailSection'
import { copyToClipboard } from '../components/sub-admin/exams/clipboard'
import { ThemeProvider } from '../context/ThemeContext'
import * as teacherExamService from '../services/teacherExamService'
import type { UserProfile } from '../types/auth.types'

const {
  fetchSubAdminIdByUserId,
  fetchTeacherExamQuestions,
  fetchAttemptsWithUsersByTeacherExam,
} = teacherExamService

/* ── SUB-ADMIN MY-EXAMS REMEDIATION REGRESSION SUITE ─────────────────────────
 * F1 (HIGH) RLS repair is proven at the LIVE database layer (policy
 *           answers_select_subadmin). This suite locks the UI/service
 *           contract that must never again turn a data failure into a
 *           silent success:
 * F2        Profile lookup: technical failure → classified safe error;
 *           genuine no-row → null (setup-required path preserved).
 * F3        Exam-scoped reads: PGRST116 → "not found or no access";
 *           transport/server failures → canonical safe messages. Raw
 *           PostgREST/auth text must NEVER reach the thrown message.
 *           The REAL service + classifier run here — only the repository
 *           layer is mocked.
 * F4        Retry controls are busy/disabled while their request chain is
 *           in flight — repeated clicks cannot start duplicate chains.
 * F7        Clipboard failure produces visible toast feedback.
 * F9        Selection lives in the URL (`?exam=`): deep-link opens detail,
 *           unknown id safely falls back to list.
 * ─────────────────────────────────────────────────────────────────────────── */

const mockUser = {
  id: 'sa-user-1',
  sub_admin_id: 'sa-row-1',
  role: 'sub_admin',
} as unknown as UserProfile

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

const teacherExamRepoMocks = vi.hoisted(() => ({
  fetchTeacherExamsWithAttempts: vi.fn(),
  findTeacherExamById: vi.fn(),
  deleteTeacherExamById: vi.fn(),
  fetchTeacherExamQuestions: vi.fn(),
  fetchTeacherExamsBySubAdminId: vi.fn(),
  fetchTeacherExamsWithFullFields: vi.fn(),
  createTeacherExamAtomicRpc: vi.fn(),
  fetchSubAdminIdByUserId: vi.fn(),
}))

const attemptRepoMocks = vi.hoisted(() => ({
  fetchCompletedAttemptsByTeacherExam: vi.fn(),
  fetchAttemptsWithUsersByTeacherExam: vi.fn(),
  fetchAttemptAnswersByAttemptIds: vi.fn(),
  fetchTeacherExamAttempts: vi.fn(),
  countAttemptsByTeacherExamIds: vi.fn(),
}))

vi.mock('../lib/repositories/teacherExam.repository', () => teacherExamRepoMocks)
vi.mock('../lib/repositories/attempt.repository', () => attemptRepoMocks)

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
}

function ui(node: ReactNode) {
  return (
    <ThemeProvider>
      <MemoryRouter>{node}</MemoryRouter>
    </ThemeProvider>
  )
}

const mockExam = {
  id: 'EXAM_1',
  title: 'Power BI Basics',
  total_questions: 10,
  total_marks: 100,
  marks_per_question: 10,
  start_time: '2026-08-01T00:00:00Z',
  end_time: '2026-08-02T00:00:00Z',
  created_at: '2026-08-01T00:00:00Z',
  status: 'published',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Ownership probe target for exam-scoped reads.
  teacherExamRepoMocks.findTeacherExamById.mockResolvedValue({ sub_admin_id: 'sa-row-1' })
})

// ─── F2 — profile lookup error separation ────────────────────────────────────

describe('F2: fetchSubAdminIdByUserId error separation', () => {
  it('returns null for a genuine no-row result (setup-required path)', async () => {
    teacherExamRepoMocks.fetchSubAdminIdByUserId.mockResolvedValueOnce(null)
    const result = await fetchSubAdminIdByUserId({ user: mockUser }, mockUser.id)
    expect(result).toBeNull()
  })

  it('THROWS a classified safe message on network failure (never null)', async () => {
    teacherExamRepoMocks.fetchSubAdminIdByUserId.mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    )
    await expect(fetchSubAdminIdByUserId({ user: mockUser }, mockUser.id))
      .rejects.toThrow(/internet connection/i)
  })

  it('THROWS a session-expiry message on 401 (never null)', async () => {
    teacherExamRepoMocks.fetchSubAdminIdByUserId.mockRejectedValueOnce(
      Object.assign(new Error('JWT expired'), { status: 401 })
    )
    await expect(fetchSubAdminIdByUserId({ user: mockUser }, mockUser.id))
      .rejects.toThrow(/session has expired/i)
  })

  it('THROWS a server message on 500 (never null)', async () => {
    teacherExamRepoMocks.fetchSubAdminIdByUserId.mockRejectedValueOnce(
      Object.assign(new Error('Internal server error'), { status: 500 })
    )
    await expect(fetchSubAdminIdByUserId({ user: mockUser }, mockUser.id))
      .rejects.toThrow(/servers are having trouble/i)
  })
})

// ─── F3 — safe exam-scoped errors ────────────────────────────────────────────

describe('F3: exam read error sanitization', () => {
  it('maps PGRST116 (no such exam) to the not-found/access message', async () => {
    teacherExamRepoMocks.findTeacherExamById.mockRejectedValueOnce(
      { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
    )
    await expect(fetchTeacherExamQuestions({ user: mockUser }, 'missing-exam'))
      .rejects.toThrow('Exam not found or you no longer have access.')
  })

  it('never leaks raw PostgREST text on transport failures', async () => {
    attemptRepoMocks.fetchAttemptsWithUsersByTeacherExam.mockRejectedValueOnce(
      { code: '42P01', message: 'relation "attempts" does not exist', status: 500 }
    )
    await expect(fetchAttemptsWithUsersByTeacherExam({ user: mockUser }, 'EXAM_1'))
      .rejects.toThrow(/servers are having trouble/i)
  })

  it('maps auth expiry to the session message on exam reads', async () => {
    teacherExamRepoMocks.fetchTeacherExamQuestions.mockRejectedValueOnce(
      { code: 'PGRST301', message: 'JWT expired' }
    )
    await expect(fetchTeacherExamQuestions({ user: mockUser }, 'EXAM_1'))
      .rejects.toThrow(/session has expired/i)
  })
})

// ─── F4 — retry busy state ───────────────────────────────────────────────────

function renderListSection(loading: boolean) {
  return render(ui(
    <ExamListSection
      examsLoading={loading}
      examsError="Unable to load exam list."
      filteredExams={[]}
      activeFilter="live"
      onFilterChange={() => {}}
      filterCounts={{ live: 0, upcoming: 0, published: 0 }}
      activeFilterResults={[]}
      searchTerm=""
      onSearchChange={() => {}}
      yearFilter={2026}
      onYearChange={() => {}}
      yearOptions={[{ id: '2026', name: '2026' }]}
      monthFilter={8}
      onMonthChange={() => {}}
      monthOptions={[{ id: '8', name: 'August' }]}
      onRefresh={() => {}}
      onSelectExam={() => {}}
    />
  ))
}

describe('F4: retry busy states', () => {
  it('list retry control is replaced by the skeleton while examsLoading (no duplicate chain)', () => {
    renderListSection(true)
    // Loading branch wins over the error branch: the retry control is not in
    // the DOM at all, so repeated clicks cannot start duplicate chains.
    expect(screen.queryByRole('button', { name: /re-sync vault/i })).toBeNull()
    cleanup()
  })

  it('list RetryButton is enabled and labelled when idle', () => {
    renderListSection(false)
    expect(screen.getByRole('button', { name: /re-sync vault/i })).toBeEnabled()
    cleanup()
  })

  it('detail retry control disappears while dataLoading (no duplicate chain)', () => {
    const props = {
      selectedExam: mockExam,
      evalData: null,
      summaryStats: null,
      scoreDistribution: [],
      onBack: () => {},
      onRetry: () => {},
    }
    // Error + idle → retry exists and is enabled.
    render(ui(<ExamDetailSection {...props} dataLoading={false} dataError="Timed out." />))
    expect(screen.getByRole('button', { name: /retry loading exam data/i })).toBeEnabled()
    cleanup()

    // While retrying, the skeleton replaces the error panel entirely — the
    // retry control cannot be clicked again, so no duplicate request chain.
    render(ui(<ExamDetailSection {...props} dataLoading dataError={null} />))
    expect(screen.queryByRole('button', { name: /retry loading exam data/i })).toBeNull()
    cleanup()
  })
})

// ─── F7 — clipboard feedback ─────────────────────────────────────────────────

describe('F7: clipboard failure feedback', () => {
  it('copyToClipboard resolves false on failure instead of throwing silently', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    stubClipboard(writeText)
    await expect(copyToClipboard('hello')).resolves.toBe(false)

    writeText.mockResolvedValueOnce(undefined)
    await expect(copyToClipboard('hello')).resolves.toBe(true)
  })

  it('shows an error toast when Copy Summary fails', async () => {
    const user = userEvent.setup()
    stubClipboard(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')))

    render(ui(
      <ExamDetailSection
        selectedExam={mockExam}
        evalData={{ attempts: [], questionStats: [] }}
        dataLoading={false}
        dataError={null}
        summaryStats={{ total: 3, avg: 50, hi: 80, lo: 20, avgTime: 600 }}
        scoreDistribution={[]}
        onBack={() => {}}
        onRetry={() => {}}
      />
    ))
    await user.click(screen.getByRole('button', { name: /copy exam summary/i }))
    await waitFor(() => {
      expect(screen.getByText('Unable to copy to clipboard.')).toBeInTheDocument()
    })
    cleanup()
  })
})

// ─── F9 — URL-owned selection ────────────────────────────────────────────────

function HookProbe({ onState }: { onState: (s: ReturnType<typeof useExamData>) => void }) {
  const state = useExamData()
  onState(state)
  return null
}

describe('F9: URL-based exam selection', () => {
  it('deep-links into the detail view for ?exam=EXAM_1 and fetches eval data once', async () => {
    const profileSpy = vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId')
      .mockResolvedValue({ id: 'sa-row-1' })
    vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([mockExam])
    const attemptsSpy = vi.spyOn(teacherExamService, 'fetchAttemptsWithUsersByTeacherExam')
      .mockResolvedValue([])
    vi.spyOn(teacherExamService, 'fetchTeacherExamQuestions').mockResolvedValue([])

    let latest: ReturnType<typeof useExamData> | null = null
    render(
      <MemoryRouter initialEntries={['/?exam=EXAM_1']}>
        <HookProbe onState={(s) => { latest = s }} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(latest?.selectedExam?.id).toBe('EXAM_1')
    }, { timeout: 3000 })
    await waitFor(() => {
      expect(latest?.dataLoading).toBe(false)
      expect(attemptsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUser }), 'EXAM_1'
      )
      expect(profileSpy).toHaveBeenCalledTimes(1)
    }, { timeout: 3000 })
    cleanup()
  })

  it('falls back to the list for an unknown ?exam= id', async () => {
    vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' })
    vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([mockExam])

    let latest: ReturnType<typeof useExamData> | null = null
    render(
      <MemoryRouter initialEntries={['/?exam=DOES_NOT_EXIST']}>
        <HookProbe onState={(s) => { latest = s }} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(latest?.examsLoading).toBe(false)
    }, { timeout: 3000 })
    await waitFor(() => {
      expect(latest?.selectedExamId).toBe('')
      expect(latest?.selectedExam).toBeNull()
    }, { timeout: 3000 })
    cleanup()
  })
})
