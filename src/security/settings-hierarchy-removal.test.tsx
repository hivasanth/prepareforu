/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import AdminSettingsPage from '../pages/admin/AdminSettings'
import type { ExamConfig, ExamSubject, ExamTopicConfig } from '../types/exam.types'

/* ── Settings → Hierarchy removal regression suite ───────────────────────
 * Locked contracts after removing the duplicate Settings hierarchy tab and
 * the dedicated /admin/hierarchy page:
 *   HR-01  top-level filter offers exactly Exams and Subject Test
 *   HR-02  the filter does NOT offer Hierarchy
 *   HR-03  Exams remains selectable and renders its panel
 *   HR-04  Subject Test remains selectable and renders its panel
 *   HR-05  no Settings-only hierarchy component is rendered or imported
 *   HR-06  the dedicated /admin/hierarchy route no longer exists
 *   HR-07  the sidebar HIERARCHY navigation item no longer exists
 *   HR-08  a stale ?tab=hierarchy URL safely opens Settings on Exams
 */

vi.mock('../hooks/useAdminFilters', async () => {
  const { useSyncExternalStore, useCallback } = await import('react')
  const state = { exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' }
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(l => l())
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
  const snapshot = () => `${state.exam}|${state.paper}|${state.subject}`
  return {
    useAdminFilters: () => {
      useSyncExternalStore(subscribe, snapshot)
      const update = useCallback((patch: Partial<typeof state>) => {
        Object.assign(state, patch)
        notify()
      }, [])
      return {
        selectedExam: state.exam,
        selectedPaper: state.paper,
        selectedSubject: state.subject,
        setSelectedExam: (v: string) => update({ exam: v, paper: 'all', subject: 'all' }),
        setSelectedPaper: (v: string) => update({ paper: v, subject: 'all' }),
        setSelectedSubject: (v: string) => update({ subject: v }),
      }
    },
  }
})

const serviceMocks = vi.hoisted(() => ({
  fetchExamPapers: vi.fn(),
  fetchExamConfig: vi.fn(),
  fetchExamSubjects: vi.fn(),
  fetchTopicConfiguration: vi.fn(),
  saveAdminSettingsAtomic: vi.fn(),
  saveSubjectTestConfiguration: vi.fn(),
}))

const mockUser = vi.hoisted(() => ({ id: 'admin-1', role: 'admin' }))

vi.mock('../services/adminService', () => ({ adminService: serviceMocks }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }))
vi.mock('../components/admin/shared/AdminSelectionTabs', () => ({
  AdminSelectionTabs: () => <div data-testid="selection-tabs" />,
}))
vi.mock('../components/admin/settings/ExamModePanel', () => ({
  ExamModePanel: () => <div data-testid="exams-panel" />,
}))
vi.mock('../components/admin/settings/SubjectTestModePanel', () => ({
  SubjectTestModePanel: () => <div data-testid="subject-test-panel" />,
}))

function primeFetch() {
  const subjects: ExamSubject[] = [
    { id: 'sub-0', exam_id: 'APPSC_GROUP_1', paper_id: 'paper-1', subject_name: 'History', question_count: 5, marks_per_question: 1, display_order: 0 },
  ]
  const topics: ExamTopicConfig[] = [
    { id: 't-0', topic_en: 'Ancient India', topic_te: null, display_order: 0, required_questions: 5, test_20_required: 20, test_30_required: 30, test_50_required: 50, actual_count: 0 },
  ]
  serviceMocks.fetchExamPapers.mockResolvedValue([
    { id: 'paper-1', paper_name: 'General Studies', total_questions: 20, total_marks: 20, duration_minutes: 30, negative_marking: false, negative_mark_value: 0 },
  ])
  serviceMocks.fetchExamConfig.mockResolvedValue({
    id: 'cfg-1', exam_id: 'APPSC_GROUP_1', name: 'Group 1', exam_selection: 'APPSC_GROUP_1',
    total_questions: 20, total_marks: 20, duration_minutes: 30,
    negative_marking: false, negative_mark_value: 0, is_published: true,
  } as ExamConfig)
  serviceMocks.fetchExamSubjects.mockResolvedValue(subjects)
  serviceMocks.fetchTopicConfiguration.mockResolvedValue(topics)
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  primeFetch()
})

async function renderSettings(initialEntry = '/admin/settings') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeProvider>
        <AdminSettingsPage />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('HR — Settings top-level segmented filter', () => {
  it('HR-01: offers exactly Exams and Subject Test', async () => {
    await renderSettings()
    const tablist = await screen.findByRole('tablist', { name: 'Configuration mode' })
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')).map(t => t.textContent)
    expect(tabs).toEqual(['Exams', 'Subject Test'])
  })

  it('HR-02: does NOT offer Hierarchy anywhere in the filter', async () => {
    await renderSettings()
    await screen.findByRole('tablist', { name: 'Configuration mode' })
    expect(screen.queryByRole('tab', { name: /hierarchy/i })).toBeNull()
    expect(document.body.textContent?.toLowerCase()).not.toContain('hierarchy')
  })
})

describe('HR — remaining modes stay fully functional', () => {
  it('HR-03: Exams remains selectable and renders the exams panel', async () => {
    const user = userEvent.setup()
    await renderSettings()
    const examsTab = await screen.findByRole('tab', { name: 'Exams' })
    expect(examsTab).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(screen.getByTestId('exams-panel')).toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: 'Subject Test' }))
    await waitFor(() => expect(examsTab).toHaveAttribute('aria-selected', 'false'))

    await user.click(examsTab)
    await waitFor(() => expect(examsTab).toHaveAttribute('aria-selected', 'true'))
    await waitFor(() => expect(screen.getByTestId('exams-panel')).toBeInTheDocument())
  })

  it('HR-04: Subject Test remains selectable and renders the subject test panel', async () => {
    const user = userEvent.setup()
    await renderSettings()
    const subjectTestTab = await screen.findByRole('tab', { name: 'Subject Test' })
    expect(subjectTestTab).toHaveAttribute('aria-selected', 'false')

    await user.click(subjectTestTab)
    await waitFor(() => expect(subjectTestTab).toHaveAttribute('aria-selected', 'true'))
    await waitFor(() => expect(screen.getByTestId('subject-test-panel')).toBeInTheDocument())
    expect(screen.queryByTestId('exams-panel')).toBeNull()
  })
})

describe('HR — architecture contracts', () => {
  const read = (...p: string[]) => readFileSync(join(__dirname, ...p), 'utf8')

  it('HR-05: no Settings-only hierarchy component exists or is referenced by Settings', () => {
    expect(existsSync(join(__dirname, '../components/admin/settings/hierarchy'))).toBe(false)
    const settingsSrc = read('../pages/admin/AdminSettings.tsx')
    const hookSrc = read('../components/admin/settings/useAdminSettings.ts')
    expect(settingsSrc.toLowerCase()).not.toContain('hierarchy')
    expect(hookSrc).toContain("export type PageMode = 'exams' | 'subject_test'")
  })

  it('HR-06: the dedicated /admin/hierarchy route no longer exists', () => {
    const appSrc = read('../App.tsx')
    expect(appSrc).not.toContain("lazy(() => import('./pages/admin/AdminHierarchy'))")
    expect(appSrc).not.toContain('path="hierarchy"')
  })

  it('HR-07: the sidebar HIERARCHY navigation item no longer exists', () => {
    const navSrc = read('../config/navigation.ts')
    expect(navSrc).not.toContain("label: 'HIERARCHY'")
    expect(navSrc).not.toContain("path: '/admin/hierarchy'")
  })
})

describe('HR — stale URL safety', () => {
  it('HR-08: /admin/settings?tab=hierarchy opens safely on the default Exams mode', async () => {
    await renderSettings('/admin/settings?tab=hierarchy')
    const examsTab = await screen.findByRole('tab', { name: 'Exams' })
    expect(examsTab).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(screen.getByTestId('exams-panel')).toBeInTheDocument())
    // No broken/blank page, no phantom hierarchy content.
    expect(screen.queryByRole('tab', { name: /hierarchy/i })).toBeNull()
    expect(document.body.textContent?.toLowerCase()).not.toContain('hierarchy')
  })
})
