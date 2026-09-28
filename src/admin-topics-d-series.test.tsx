/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN TOPICS D-SERIES REGRESSION TESTS
 *
 * Guards the PUBLISH-READY remediation fixes:
 *   D-1 — Switch primitive always carries an accessible name (aria-label
 *         derived from visible label when no explicit aria-label is given).
 *   D-2 — Tabs `idBase` opt-in emits deterministic tab ids + aria-controls, and
 *         the AdminTopics language tabpanel round-trips (tab aria-controls →
 *         panel id; panel aria-labelledby → tab id). Legacy Tabs (no idBase)
 *         must NEVER emit an aria-controls (BUG-09 contract preserved).
 *   D-3 — Add/Edit Topic modal targets the English title field
 *         (#topic-title-en) via [data-modal-initial-focus] on open.
 *   D-4 — Topics loading skeleton bars are aria-hidden (decorative); the single
 *         role="status" wrapper owns the announcement.
 *   D-9 — topicMetadataSchema display_order bounds: 0 / negative / >100000 fail.
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { Switch } from './components/common/AntigravityForm'
import { Tabs } from './components/common/AntigravityData'
import { GridSkeleton } from './components/common/SharedComponents'
import { topicMetadataSchema } from './validations/adminSchemas'
import type { StudyTopic } from './types/exam.types'
import type { UserProfile } from './types/auth.types'

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

afterEach(cleanup)

/* ═══════════ D-1 — Switch accessible name contract ════════════════════════ */

describe('D-1 — Switch primitive accessible name', () => {
  it('derives aria-label from the visible label when no aria-label is passed', () => {
    renderWithTheme(<Switch label="Visible to students" checked={false} onChange={() => {}} />)
    const el = screen.getByRole('switch')
    expect(el).toHaveAttribute('aria-label', 'Visible to students')
  })

  it('explicit aria-label wins over label', () => {
    renderWithTheme(
      <Switch label="Visible to students" aria-label="Publish switch" checked onChange={() => {}} />,
    )
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Publish switch')
  })

  it('is queriable by its derived name (announced to screen readers)', () => {
    renderWithTheme(<Switch label="Visible to students" checked onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Visible to students' })).toBeTruthy()
  })
})

/* ═══════════ D-2 — Tabs idBase ARIA linkage ══════════════════════════════ */

describe('D-2 — Tabs idBase ARIA tab<->panel linkage', () => {
  it('legacy Tabs (no idBase) never emit aria-controls (BUG-09 contract)', () => {
    renderWithTheme(
      <Tabs
        ariaLabel="Topics"
        activeId="en"
        onChange={() => {}}
        options={[{ id: 'en', label: 'English' }, { id: 'te', label: 'Telugu' }]}
      />,
    )
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).not.toHaveAttribute('aria-controls')
    }
  })

  it('opt-in idBase emits deterministic tab ids + matching aria-controls', () => {
    renderWithTheme(
      <Tabs
        ariaLabel="Topics"
        idBase="topic-lang"
        activeId="en"
        onChange={() => {}}
        options={[{ id: 'en', label: 'English' }, { id: 'te', label: 'Telugu' }]}
      />,
    )
    const enTab = screen.getByRole('tab', { name: 'English' })
    const teTab = screen.getByRole('tab', { name: 'Telugu' })
    expect(enTab).toHaveAttribute('id', 'topic-lang-tab-en')
    expect(enTab).toHaveAttribute('aria-controls', 'topic-lang-panel-en')
    expect(teTab).toHaveAttribute('id', 'topic-lang-tab-te')
    expect(teTab).toHaveAttribute('aria-controls', 'topic-lang-panel-te')
  })
})

/* ═══════════ D-4 — decorative skeleton bars ══════════════════════════════ */

describe('D-4 — loading skeleton is decorative below the status owner', () => {
  it('GridSkeleton bars are aria-hidden when decorative, no nested role=status', () => {
    const { container } = renderWithTheme(
      <GridSkeleton count={2} height={100} columns="grid-cols-1" unit="row" decorative />,
    )
    const statuses = container.querySelectorAll('[role="status"]')
    expect(statuses.length).toBe(0)
    const hiddenBars = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
    expect(hiddenBars.length).toBeGreaterThan(0)
  })

  it('non-decorative skeleton keeps its announcement role (regression guard)', () => {
    const { container } = renderWithTheme(
      <GridSkeleton count={1} height={100} columns="grid-cols-1" unit="row" />,
    )
    expect(container.querySelectorAll('[role="status"]').length).toBeGreaterThan(0)
  })
})

/* ═══════════ D-9 — display_order schema bounds ═══════════════════════════ */

describe('D-9 — topicMetadataSchema display_order bounds', () => {
  it('rejects 0 and negatives', () => {
    for (const v of [0, -1, -5]) {
      expect(topicMetadataSchema.safeParse({ display_order: v, youtube_url: '' }).success).toBe(false)
    }
  })

  it('accepts 1 .. 100000', () => {
    for (const v of [1, 2, 999, 100000]) {
      expect(topicMetadataSchema.safeParse({ display_order: v, youtube_url: '' }).success).toBe(true)
    }
  })

  it('rejects above 100000', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 100001, youtube_url: '' }).success).toBe(false)
  })
})

/* ═══════════ AdminTopics integration — D-2 / D-3 in the real page ════════ */

vi.mock('./utils/logger', () => ({
  generateRequestId: (p: string) => `${p}_test`,
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}))

vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('./components/common/AntigravityAnimation', async (orig) => {
  const actual = await orig<typeof import('./components/common/AntigravityAnimation')>()
  return {
    ...actual,
    SectionReveal: ({ children }: { children?: ReactNode }) => <>{children}</>,
    PageTransition: ({ children }: { children?: ReactNode }) => <>{children}</>,
  }
})

const adminUser = { id: 'u-admin', role: 'admin', exam_selection: 'APPSC_GROUPS', is_active: true } as UserProfile

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: adminUser }),
}))

vi.mock('./hooks/useExamPaperSubjectSelection', () => ({
  APPSC_SUB_TABS: [],
  useExamPaperSubjectSelection: () => ({
    examTabs: [{ id: 'APPSC_GROUP_1', label: 'Group 1' }],
    isAppscActive: true,
    displayPapers: [{ id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }],
    displaySubjects: [{ subject_name: 'Maths' }],
    paperRowOpen: true,
    subjectRowOpen: true,
  }),
}))

let filtersState: {
  selectedExam: string; selectedPaper: string; selectedSubject: string; selectedTopic: string
  setSelectedExam: ReturnType<typeof vi.fn>
  setSelectedPaper: ReturnType<typeof vi.fn>
  setSelectedSubject: ReturnType<typeof vi.fn>
  setSelectedTopic: ReturnType<typeof vi.fn>
}

vi.mock('./hooks/useAdminFilters', () => ({
  useAdminFilters: () => filtersState,
}))

vi.mock('./lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue(undefined) } },
}))

vi.mock('./services/topicsService', async (orig) => {
  const actual = await orig<typeof import('./services/topicsService')>()
  return {
    ...actual,
    fetchTopicsAdmin: vi.fn(),
    createTopic: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
    toggleTopicPublish: vi.fn(),
    getNextDisplayOrder: vi.fn(),
  }
})

import * as topicsService from './services/topicsService'

const svc = vi.mocked(topicsService)

const EX = 'APPSC_GROUP_1'
const P = 'p1'
const SUBJ = 'Maths'

function makeTopic(id: string, title: string): StudyTopic {
  return {
    id, exam_id: EX, paper_id: P, subject_name: SUBJ,
    title_en: title, title_te: '',
    summary_en: '', summary_te: '',
    content_en: [], content_te: [],
    youtube_url: null, display_order: 1, is_published: true,
    created_by: null, created_at: '', updated_at: '',
  }
}

let AdminTopics: typeof import('./pages/admin/AdminTopics').default

beforeEach(async () => {
  vi.clearAllMocks()
  cleanup()

  filtersState = {
    selectedExam: EX, selectedPaper: P, selectedSubject: SUBJ, selectedTopic: '',
    setSelectedExam: vi.fn(), setSelectedPaper: vi.fn(), setSelectedSubject: vi.fn(), setSelectedTopic: vi.fn(),
  }

  svc.fetchTopicsAdmin.mockResolvedValue([
    makeTopic('t1', 'Algebra'),
    makeTopic('t2', 'Geometry'),
  ])
  svc.deleteTopic.mockResolvedValue(undefined)
  svc.toggleTopicPublish.mockResolvedValue(undefined)
  svc.getNextDisplayOrder.mockResolvedValue(3)

  const mod = await import('./pages/admin/AdminTopics')
  AdminTopics = mod.default
})

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[`/admin/topics?exam=${EX}&paper=${P}&subject=${SUBJ}`]}>
        <AdminTopics />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('AdminTopics page — D-2 panel round-trip + D-3 initial focus', () => {
  it('opens Add modal: EN tab aria-controls resolves to a real panel that points back', async () => {
    renderPage()
    await screen.findByText('Algebra')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add topic/i }))
    })

    await screen.findByText('Parse English Content')

    const enTab = screen.getByRole('tab', { name: 'English' })
    expect(enTab).toHaveAttribute('id', 'topic-lang-tab-en')
    const paneId = enTab.getAttribute('aria-controls')
    expect(paneId).toBe('topic-lang-panel-en')

    const panel = document.getElementById(paneId!)
    expect(panel).toBeTruthy()
    expect(panel!.getAttribute('role')).toBe('tabpanel')
    expect(panel!.getAttribute('aria-labelledby')).toBe('topic-lang-tab-en')
  })

  it('D-3: English title input is the modal initial-focus target', async () => {
    renderPage()
    await screen.findByText('Algebra')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add topic/i }))
    })

    await screen.findByText('Parse English Content')

    const titleInput = document.getElementById('topic-title-en') as HTMLElement
    expect(titleInput).toBeTruthy()
    expect(titleInput).toHaveAttribute('data-modal-initial-focus')
  })
})