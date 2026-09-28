import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import UserSubjectTests from './pages/user/UserSubjectTests'
import * as subjectTestService from './services/subjectTestService'
import './components/user/subject-tests/SubjectPortalView'
import './components/user/subject-tests/SubjectConfigView'

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'user', exam_selection: 'APPSC_GROUPS', is_active: true },
    loading: false,
  }),
}))

vi.mock('./services/subjectTestService', () => ({
  fetchSubjectsByExam: vi.fn(async () => []),
  fetchSubjectTestQuestions: vi.fn(async () => []),
  clearSubjectTestCache: vi.fn(async () => {}),
  fetchSubjectCounts: vi.fn(async () => ({})),
  fetchAppscPapers: vi.fn(async () => []),
  fetchSubjectsByPaper: vi.fn(async () => []),
  mapQuestionsToStandard: vi.fn((q: unknown[]) => q),
  getCachedSubjects: vi.fn(() => null),
  getCachedSubjectCounts: vi.fn(() => null),
  getCachedPapers: vi.fn(() => []),
  getCachedSubjectsByPaper: vi.fn(() => null),
  getCachedSubjectCountsByPaper: vi.fn(() => null),
}))

vi.mock('./services/questionAvailabilityService', () => ({
  getDefaultMinQuestions: () => 30,
  getMinQuestions: vi.fn(async () => 0),
}))

beforeEach(() => {
  const svc = vi.mocked(subjectTestService)
  svc.fetchAppscPapers.mockResolvedValue([
    { id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 1 },
    { id: 'p2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 2', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 2 },
  ])
  svc.fetchSubjectsByPaper.mockImplementation(async (paperId: string) =>
    paperId === 'p1' ? ['General Studies'] : ['Telugu'],
  )
  svc.fetchSubjectCounts.mockImplementation(async (_exam: string, paperId?: string) =>
    Object.fromEntries((paperId === 'p2' ? ['Telugu'] : ['General Studies']).map((s) => [s, 40])),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('DS-031 UserSubjectTests page mount', () => {
  it('mounts the real page without hook errors and switches paper', async () => {
    const errors: Error[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args[0] as Error)
    })

    render(
      <StrictMode>
        <MemoryRouter>
          <ThemeProvider>
            <UserSubjectTests />
          </ThemeProvider>
        </MemoryRouter>
      </StrictMode>,
    )

    await screen.findByText('General Studies', undefined, { timeout: 5000 })
    await screen.findByRole('tab', { name: /paper 1/i }, { timeout: 5000 })

    fireEvent.click(screen.getByRole('tab', { name: /paper 2/i }))
    await screen.findByText('Telugu', undefined, { timeout: 5000 })

    spy.mockRestore()

    const hookErrors = errors.filter((e) => /Should have a queue|Hooks conditionally|Invalid hook call/i.test(String(e?.message ?? e)))
    expect(hookErrors).toEqual([])
  })
})