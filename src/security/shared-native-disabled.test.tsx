import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ThemeProvider } from '../context/ThemeContext'
import { Button, IconButton } from '../components/common/AntigravityButton'
import { Switch } from '../components/common/AntigravityForm'

// S-1 regression: loading/disabled controls MUST expose native disabled
// semantics (DOM `disabled`), not merely CSS opacity/pointer-events — so mouse,
// keyboard and screen readers all see a truly non-interactive control. These
// tests capture the intended production behavior of the shared components.

afterEach(cleanup)

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('S-1 — shared native disabled semantics', () => {
  it('Button resolves to a native disabled button via disabled prop', () => {
    renderWithTheme(<Button disabled>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Button resolves to a native disabled button via loading (no explicit disabled prop)', () => {
    renderWithTheme(<Button loading>Save</Button>)
    // While loading the Button renders a spinner in place of its text, so its
    // disabled state is asserted on the single rendered button element.
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('Button is re-enabled when loading completes', () => {
    const { rerender } = renderWithTheme(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    rerender(
      <ThemeProvider>
        <Button>Save</Button>
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
  })

  it('Button keeps its accessible name while loading (spinner does not strip the label)', () => {
    renderWithTheme(<Button loading>Save Changes</Button>)
    // The spinner replaces the visible text, but the sr-only label keeps the
    // control addressable by its original accessible name while it is disabled.
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('Button does not fire onClick while natively disabled (loading)', () => {
    let clicks = 0
    renderWithTheme(<Button loading onClick={() => clicks++}>Save</Button>)
    const btn = screen.getByRole('button', { name: /save/i })
    // fireEvent.click is suppressed on a natively-disabled button.
    btn.click?.()
    expect(clicks).toBe(0)
  })

  it('IconButton resolves to a native disabled button via loading', () => {
    renderWithTheme(<IconButton loading aria-label="Export" />)
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('IconButton resolves to a native disabled button via disabled prop', () => {
    renderWithTheme(<IconButton disabled aria-label="Export" />)
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('Switch resolves to a native disabled button via disabled prop', () => {
    renderWithTheme(<Switch checked onChange={() => {}} disabled aria-label="Notify" />)
    expect(screen.getByRole('switch', { name: 'Notify' })).toBeDisabled()
  })

  it('Switch does not toggle while natively disabled', () => {
    let checked = true
    renderWithTheme(<Switch checked={checked} onChange={(v) => (checked = v)} disabled aria-label="Notify" />)
    const sw = screen.getByRole('switch', { name: 'Notify' })
    sw.click?.()
    expect(checked).toBe(true)
    expect(sw).toBeDisabled()
  })
})
