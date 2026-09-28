import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '../../context/ThemeContext'
import { UserSelectionTabs } from './UserSelectionTabs'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'user', exam_selection: 'APPSC_GROUPS', is_active: true },
    loading: false,
  }),
}))

const groupOptions = [
  { label: 'GROUP 1', id: 'APPSC_GROUP_1' },
  { label: 'GROUP 2', id: 'APPSC_GROUP_2' },
]

function renderTabs(overrides: Partial<React.ComponentProps<typeof UserSelectionTabs>> = {}) {
  const props = {
    selectedExam: 'APPSC_GROUP_1',
    setSelectedExam: vi.fn(),
    selectedPaper: 'p1',
    setSelectedPaper: vi.fn(),
    customExamTabs: groupOptions,
customPapers: [
      { id: 'p1', label: 'Paper 1' },
      { id: 'p2', label: 'Paper 2' },
    ],
    hideAll: true,
    showSubjects: false,
    ...overrides,
  }
  render(
    <ThemeProvider>
      <UserSelectionTabs {...props} />
    </ThemeProvider>,
  )
  return props
}

describe('FIND-6 :: UserSelectionTabs', () => {
    beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })




  it('renders exam tabs and paper tabs', async () => {
    renderTabs()
    await screen.findByRole('tab', { name: /group 1/i })
    expect(screen.getByRole('tab', { name: /group 2/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /paper 1/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /paper 2/i })).toBeTruthy()
  })

  it('marks the active exam and paper with aria-selected', async () => {
    renderTabs()
    const g1 = await screen.findByRole('tab', { name: /group 1/i })
    const p1 = screen.getByRole('tab', { name: /paper 1/i })
    expect(g1).toHaveAttribute('aria-selected', 'true')
    expect(p1).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /group 2/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('uses tablist/tab semantics with roving tabindex', async () => {
    renderTabs()
    await screen.findByRole('tab', { name: /group 1/i })
    const tablists = screen.getAllByRole('tablist')
    expect(tablists.length).toBeGreaterThanOrEqual(2)
    tablists.forEach(t => expect(t).toHaveAttribute('aria-orientation', 'horizontal'))
    const g1 = screen.getByRole('tab', { name: /group 1/i })
    expect(g1).toHaveAttribute('role', 'tab')
    expect(g1).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: /group 2/i })).toHaveAttribute('tabindex', '-1')
  })

  it('mouse selection fires setSelectedExam / setSelectedPaper', async () => {
    const props = renderTabs()
    fireEvent.click(await screen.findByRole('tab', { name: /group 2/i }))
    expect(props.setSelectedExam).toHaveBeenCalledWith('APPSC_GROUP_2')

    fireEvent.click(screen.getByRole('tab', { name: /paper 2/i }))
    expect(props.setSelectedPaper).toHaveBeenCalledWith('p2')
  })

  it('ArrowRight selects the next enabled tab', async () => {
    const props = renderTabs()
    const g1 = await screen.findByRole('tab', { name: /group 1/i })
    fireEvent.keyDown(g1, { key: 'ArrowRight' })
    expect(props.setSelectedExam).toHaveBeenCalledWith('APPSC_GROUP_2')
  })

  it('Home/End navigate to first/last enabled tab', async () => {
    const props = renderTabs()
    const g2 = await screen.findByRole('tab', { name: /group 2/i })
    fireEvent.keyDown(g2, { key: 'Home' })
    expect(props.setSelectedExam).toHaveBeenCalledWith('APPSC_GROUP_1')
    fireEvent.keyDown(g2, { key: 'End' })
    expect(props.setSelectedExam).toHaveBeenLastCalledWith('APPSC_GROUP_2')
  })

  it('paper switching triggers the caller callback', async () => {
    const props = renderTabs()
    const g1 = await screen.findByRole('tab', { name: /group 1/i })
    fireEvent.click(g1)
    fireEvent.click(screen.getByRole('tab', { name: /paper 2/i }))
    expect(props.setSelectedPaper).toHaveBeenCalledWith('p2')
  })

  it('keep custom paper row stable (paper ids render even while selectedExam active)', async () => {
    renderTabs()
    // Provoke a tab re-render cycle to ensure the custom tab/papers survive.
    const g2 = await screen.findByRole('tab', { name: /group 2/i })
    fireEvent.keyDown(g2, { key: 'Home' })
    fireEvent.keyDown(g2, { key: 'End' })
    await waitFor(() => expect(screen.getByRole('tab', { name: /paper 1/i })).toBeTruthy())
    expect(screen.getByRole('tab', { name: /paper 2/i })).toBeTruthy()
  })
})

