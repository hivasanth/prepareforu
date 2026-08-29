import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { useSubjectTests } from './components/user/subject-tests/useSubjectTests'
import { SubjectPortalView } from './components/user/subject-tests/SubjectPortalView'
import * as subjectTestService from './services/subjectTestService'

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
  fetchSubjectCounts: vi.fn(),
  fetchAppscPapers: vi.fn(),
  fetchSubjectsByPaper: vi.fn(),
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

const group1 = [
  { id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 1 },
  { id: 'p2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 2', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 2 },
]
const group2 = [
  { id: 'p3', exam_id: 'APPSC_GROUP_2', paper_name: 'Paper 3', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 1 },
]

function subjectsFor(paperId: string): string[] {
  if (paperId === 'p1') return ['General Studies']
  if (paperId === 'p2') return ['Telugu']
  if (paperId === 'p3') return ['Paper 3 Subject']
  return []
}

function Harness() {
  const h = useSubjectTests()
  return (
    <SubjectPortalView
      isAppsc={h.isAppsc}
      groupOptions={h.groupOptions}
      papers={h.papers}
      activeGroup={h.activeGroup}
      selectedPaperId={h.selectedPaperId}
      onExamChange={h.handleExamChange}
      onPaperChange={h.handlePaperChange}
      subjects={h.subjects}
      subjectCounts={h.subjectCounts}
      minQuestions={h.minQuestions}
      onSubjectClick={h.handleSubjectClick}
    />
  )
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function waitForLoad() {
  await screen.findByText('General Studies')
  await screen.findByRole('tab', { name: /paper 1/i })
}

beforeEach(() => {
  const svc = vi.mocked(subjectTestService)
  svc.fetchAppscPapers.mockResolvedValue([...group1, ...group2])
  svc.fetchSubjectsByPaper.mockImplementation(async (paperId: string) => subjectsFor(paperId))
  svc.fetchSubjectCounts.mockImplementation(async (_exam: string, paperId?: string) =>
    Object.fromEntries(subjectsFor(paperId || 'p1').map((s) => [s, 40])),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('DS-030 subject-tests: subjects follow exam/paper selection (APPSC)', () => {
  it('shows first paper subjects on load', async () => {
    renderPage()
    await waitForLoad()
    expect(screen.getByText('General Studies')).toBeTruthy()
    expect(screen.queryByText('Telugu')).toBeNull()
  })

  it('changes subjects when switching to a different paper in the same group', async () => {
    renderPage()
    await waitForLoad()

    fireEvent.click(screen.getByRole('tab', { name: /paper 2/i }))

    await screen.findByText('Telugu')
    expect(screen.queryByText('General Studies')).toBeNull()
  })

  it('changes subjects when switching to a different exam group', async () => {
    renderPage()
    await waitForLoad()

    fireEvent.click(screen.getByRole('tab', { name: /group 2/i }))

    await screen.findByText('Paper 3 Subject')
    expect(screen.queryByText('General Studies')).toBeNull()
    expect(screen.getByRole('tab', { name: /paper 3/i })).toBeTruthy()
  })

  it('switches subjects back when returning to group 1', async () => {
    renderPage()
    await waitForLoad()

    fireEvent.click(screen.getByRole('tab', { name: /group 2/i }))
    await screen.findByText('Paper 3 Subject')

    fireEvent.click(screen.getByRole('tab', { name: /group 1/i }))
    await screen.findByText('General Studies')
  })
})
