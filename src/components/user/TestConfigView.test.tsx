import { describe, it, expect, afterEach, vi } from 'vitest'
import { useState } from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../context/ThemeContext'
import { TestConfigView } from './TestConfigView'
import { SubjectConfigView } from './subject-tests/SubjectConfigView'
import { StartTestButton } from '../common/StartTestButton'

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

// Stateful harness — mirrors how useSubjectTests owns `questionCount` so the
// radiogroup's Arrow/Home/End navigation behaves exactly like the real app.
function StatefulConfig(overrides: Partial<React.ComponentProps<typeof TestConfigView>> = {}) {
  const props = {
    title: 'History and Culture',
    options: [30, 50, 80],
    totalQuestions: 80,
    questionCount: 30,
    setQuestionCount: vi.fn(),
    isLaunching: false,
    onLaunch: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  }
  const [q, setQ] = useState(props.questionCount)
  const effectiveSet = (n: number) => {
    props.setQuestionCount(n)
    setQ(n)
  }
  return (
    <ThemeProvider>
      <TestConfigView {...props} questionCount={q} setQuestionCount={effectiveSet} />
    </ThemeProvider>
  )
}

function renderConfig(overrides: Partial<React.ComponentProps<typeof TestConfigView>> = {}) {
  const props = {
    title: 'History and Culture',
    options: [30, 50, 80],
    totalQuestions: 80,
    questionCount: 30,
    setQuestionCount: vi.fn(),
    isLaunching: false,
    onLaunch: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  }
  const utils = render(
    <ThemeProvider>
      <TestConfigView {...props} />
    </ThemeProvider>,
  )
  return { props, ...utils }
}

describe('FIND-6 :: TestConfigView', () => {
  it('renders all options as radios with correct aria semantics', () => {
    renderConfig()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAccessibleName('30 questions')
    expect(radios[1]).toHaveAccessibleName('50 questions')
    expect(radios[2]).toHaveAccessibleName('80 questions')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('tabindex', '0')
  })

  it('disables unavailable options (count > totalQuestions) and skips them in selection', () => {
    renderConfig({ totalQuestions: 40 })
    const radios = screen.getAllByRole('radio')
    // 30 available, 50 & 80 unavailable
    expect(radios[0]).toBeEnabled()
    expect(radios[1]).toBeDisabled()
    expect(radios[2]).toBeDisabled()
  })

  it('mouse selection calls setQuestionCount with the clicked count', () => {
    const { props } = renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: '50 questions' }))
    expect(props.setQuestionCount).toHaveBeenCalledWith(50)
  })

  it('keyboard ArrowRight/ArrowDown moves selection among available options', () => {
    render(<StatefulConfig />)
    const group = screen.getByRole('radiogroup')
    expect(screen.getByRole('radio', { name: '30 questions' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: '50 questions' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: '80 questions' })).toHaveAttribute('aria-checked', 'true')
    // wrap-around
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: '30 questions' })).toHaveAttribute('aria-checked', 'true')
    // ArrowUp/ArrowDown are equally valid
    fireEvent.keyDown(group, { key: 'ArrowDown' })
    expect(screen.getByRole('radio', { name: '50 questions' })).toHaveAttribute('aria-checked', 'true')
  })

  it('keyboard Home/End jump to first/last available option', () => {
    render(<StatefulConfig />)
    const group = screen.getByRole('radiogroup')
    fireEvent.keyDown(group, { key: 'End' })
    expect(screen.getByRole('radio', { name: '80 questions' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(group, { key: 'Home' })
    expect(screen.getByRole('radio', { name: '30 questions' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Start Session triggers onLaunch; is disabled while launching', () => {
    const { props } = renderConfig({ isLaunching: true })
    const start = screen.getByRole('button', { name: /launching/i })
    expect(start).toBeDisabled()
    fireEvent.click(start)
    expect(props.onLaunch).not.toHaveBeenCalled()
  })

  it('Start Session invokes onLaunch when not launching', () => {
    const { props } = renderConfig()
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    expect(props.onLaunch).toHaveBeenCalledTimes(1)
  })

  it('Back button invokes onBack', () => {
    const { props } = renderConfig()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(props.onBack).toHaveBeenCalledTimes(1)
  })

  it('shows the configured title', () => {
    renderConfig({ title: 'Indian History' })
    expect(screen.getByText('Indian History')).toBeTruthy()
  })
})

describe('FIND-6 :: SubjectConfigView (delegates to TestConfigView)', () => {
  function renderSubjectConfig(overrides: Partial<React.ComponentProps<typeof SubjectConfigView>> = {}) {
    const props = {
      selectedSubject: 'History and Culture',
      subjectCounts: { 'History and Culture': 40 },
      questionCount: 30,
      setQuestionCount: vi.fn(),
      isLaunching: false,
      onLaunch: vi.fn(),
      onBack: vi.fn(),
      ...overrides,
    }
    render(
      <ThemeProvider>
        <SubjectConfigView {...props} />
      </ThemeProvider>,
    )
    return props
  }

  it('renders the selected subject title', () => {
    renderSubjectConfig()
    expect(screen.getByText('History and Culture')).toBeTruthy()
  })

  it('disables options above the available subject count', () => {
    renderSubjectConfig({ subjectCounts: { 'History and Culture': 40 } })
    expect(screen.getByRole('radio', { name: '30 questions' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: '80 questions' })).toBeDisabled()
  })

  it('provides a Back that returns to the portal', () => {
    const props = renderSubjectConfig()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(props.onBack).toHaveBeenCalledTimes(1)
  })
})

describe('FIND-6 :: StartTestButton', () => {
  it('renders an enabled Start Test button when hasMinimum is true', () => {
    render(
      <ThemeProvider>
        <StartTestButton hasMinimum onClick={vi.fn()} subjectName="History and Culture" />
      </ThemeProvider>,
    )
    const btn = screen.getByRole('button', { name: /start test/i })
    expect(btn).toBeEnabled()
  })

  it('exposes subject-specific accessible name', () => {
    render(
      <ThemeProvider>
        <StartTestButton hasMinimum onClick={vi.fn()} subjectName="History and Culture" />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Start Test: History and Culture' })).toBeTruthy()
  })

  it('falls back to generic label without subjectName', () => {
    render(
      <ThemeProvider>
        <StartTestButton hasMinimum onClick={vi.fn()} />
      </ThemeProvider>,
    )
    const btn = screen.getByRole('button', { name: 'Start Test' })
    expect(btn).toHaveAccessibleName('Start Test')
  })

  it('keyboard Enter/Space activate the enabled button', () => {
    const onClick = vi.fn()
    render(
      <ThemeProvider>
        <StartTestButton hasMinimum onClick={onClick} subjectName="S" />
      </ThemeProvider>,
    )
    const btn = screen.getByRole('button', { name: /start test/i })
    fireEvent.keyDown(btn, { key: 'Enter' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('insufficient state is a non-interactive role=status with no clickable affordance', () => {
    render(
      <ThemeProvider>
        <StartTestButton hasMinimum={false} onClick={vi.fn()} subjectName="S" />
      </ThemeProvider>,
    )
    expect(screen.queryByRole('button', { name: /start test/i })).toBeNull()
    expect(screen.getByText('Not Enough Questions')).toBeTruthy()
    const status = screen.getByRole('status')
    expect(status).toHaveAccessibleName('Not enough questions available')
  })
})
