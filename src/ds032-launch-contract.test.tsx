import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { useSubjectTests } from './components/user/subject-tests/useSubjectTests'
import { SubjectPortalView } from './components/user/subject-tests/SubjectPortalView'
import { SubjectConfigView } from './components/user/subject-tests/SubjectConfigView'
import { NoAvailableQuestionsError } from './services/subjectTestService'
import * as subjectTestService from './services/subjectTestService'
import type { Question } from './types/exam.types'

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'user', exam_selection: 'APPSC_GROUPS', is_active: true },
    loading: false,
  }),
}))

vi.mock('./services/subjectTestService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/subjectTestService')>()
  return {
    ...actual,
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
  }
})

vi.mock('./services/questionAvailabilityService', () => ({
  getDefaultMinQuestions: () => 30,
  getMinQuestions: vi.fn(async () => 0),
}))

const paper1 = { id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1', stage: 1, total_questions: 30, total_marks: 30, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, display_order: 1 }

function makeQuestions(n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    exam_id: 'APPSC_GROUP_1',
    paper_id: 'p1',
    subject_name: 'General Studies',
    correct_option: 'A' as const,
    difficulty: 'medium' as const,
    negative_marks: 0,
    question_text_en: `Q ${i}`,
    question_text_te: null,
    explanation_en: '',
    explanation_te: null,
    topic_en: null,
    topic_te: null,
    option_a_en: 'a', option_b_en: 'b', option_c_en: 'c', option_d_en: 'd',
    option_a_te: null, option_b_te: null, option_c_te: null, option_d_te: null,
    diagram: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any))
}

function NavCapture() {
  const location = useLocation()
  return <div data-testid="nav-state">{JSON.stringify(location.state)}</div>
}

function Harness() {
  const h = useSubjectTests()
  return (
    <>
      {h.view === 'CONFIG' && h.selectedSubject && (
        <SubjectConfigView
          selectedSubject={h.selectedSubject}
          subjectCounts={h.subjectCounts}
          questionCount={h.questionCount}
          setQuestionCount={h.setQuestionCount}
          isLaunching={h.isLaunching}
          onLaunch={h.handleLaunch}
          onBack={h.handleBack}
        />
      )}
      {h.view === 'PORTAL' && (
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
      )}
    </>
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/subject-tests']}>
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
      <Routes>
        <Route path="/active-exam/subject-test" element={<NavCapture />} />
      </Routes>
    </MemoryRouter>,
  )
}

const svc = vi.mocked(subjectTestService)

beforeEach(() => {
  svc.fetchAppscPapers.mockResolvedValue([paper1])
  svc.fetchSubjectsByPaper.mockResolvedValue(['General Studies'])
  svc.fetchSubjectCounts.mockImplementation(async () => ({ 'General Studies': 40 }))
})

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('FIND-5 :: launch contract derives from ACTUAL delivered questions', () => {
  it('launches with durationMinutes/totalMarks == delivered question count (25)', async () => {
    svc.fetchSubjectTestQuestions.mockResolvedValue(makeQuestions(25) as unknown as Awaited<ReturnType<typeof svc.fetchSubjectTestQuestions>>)
    renderPage()
    await screen.findByText('General Studies')

    fireEvent.click(screen.getByRole('button', { name: 'Start Test: General Studies' }))
    await screen.findByText('Session Configuration')

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    const state = JSON.parse(
      (await screen.findByTestId('nav-state')).textContent as string,
    )
    expect(state.source).toBe('subject_test')
    expect(state.durationMinutes).toBe(25)
    expect(state.totalMarks).toBe(25)
    expect(state.marksPerQuestion).toBe(1)
    // The consistent contract: marks per question == totalMarks / delivered count
    expect(state.totalMarks / state.questions.length).toBe(1)
  })

  it('launches with durationMinutes/totalMarks == requested count when delivered in full (30)', async () => {
    svc.fetchSubjectTestQuestions.mockResolvedValue(makeQuestions(30) as unknown as Awaited<ReturnType<typeof svc.fetchSubjectTestQuestions>>)
    renderPage()
    await screen.findByText('General Studies')
    fireEvent.click(screen.getByRole('button', { name: 'Start Test: General Studies' }))
    await screen.findByText('Session Configuration')
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    const state = JSON.parse((await screen.findByTestId('nav-state')).textContent as string)
    expect(state.durationMinutes).toBe(30)
    expect(state.totalMarks).toBe(30)
  })

  it('exactly-requested number keeps 1:1 mark and duration contract', async () => {
    svc.fetchSubjectTestQuestions.mockResolvedValue(makeQuestions(30) as unknown as Awaited<ReturnType<typeof svc.fetchSubjectTestQuestions>>)
    renderPage()
    await screen.findByText('General Studies')
    fireEvent.click(screen.getByRole('button', { name: 'Start Test: General Studies' }))
    await screen.findByText('Session Configuration')
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    const state = JSON.parse((await screen.findByTestId('nav-state')).textContent as string)
    expect(state.questions.length).toBe(30)
    expect(state.durationMinutes).toBe(state.questions.length)
    expect(state.totalMarks).toBe(state.questions.length)
  })

  it('a product empty-set rejects and never launches an inconsistent exam (no navigation)', async () => {
    svc.fetchSubjectTestQuestions.mockRejectedValue(new NoAvailableQuestionsError('General Studies'))
    renderPage()
    await screen.findByText('General Studies')
    fireEvent.click(screen.getByRole('button', { name: 'Start Test: General Studies' }))
    await screen.findByText('Session Configuration')

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    // The launch must NOT navigate to the exam engine with an empty/invalid
    // question set — no nav-state is ever produced.
    await waitFor(() => expect(screen.queryByTestId('nav-state')).toBeNull())
    expect(screen.queryByTestId('nav-state')).toBeNull()
  })
})
