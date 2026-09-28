import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ThemeProvider, AuthThemeProvider } from './context/ThemeContext'
import { Avatar } from './components/common/Avatar'

afterEach(cleanup)

function renderAvatar(ui: React.ReactNode, light = false) {
  // Light mode must be driven by React state (isDark=false), not a bare CSS
  // `.light` class — AdminIconWrap decides its material via useTheme(). The
  // AuthThemeProvider forces isDark=false AND emits the `.light` wrapper.
  const r = render(
    light ? (
      <AuthThemeProvider>{ui}</AuthThemeProvider>
    ) : (
      <ThemeProvider>
        <div>{ui}</div>
      </ThemeProvider>
    ),
  )
  return r.container.firstChild?.firstChild as HTMLElement
}

describe('DS-014 Avatar — monogram derivation', () => {
  it('renders uppercased first character of name', () => {
    const el = renderAvatar(<Avatar name="Alice Wonder" />)
    expect(el).toHaveTextContent('A')
  })
  it('uppercases a lowercase name', () => {
    const el = renderAvatar(<Avatar name="alice" />)
    expect(el).toHaveTextContent('A')
  })
  it('falls back to email initial when name is empty', () => {
    const el = renderAvatar(<Avatar name="" email="bob@example.com" />)
    expect(el).toHaveTextContent('B')
  })
  it('falls back to email initial when name is whitespace', () => {
    const el = renderAvatar(<Avatar name="   " email="carol@example.com" />)
    expect(el).toHaveTextContent('C')
  })
  it('renders the fallback glyph when name and email are empty', () => {
    const el = renderAvatar(<Avatar name="" email="" />)
    expect(el).toHaveTextContent('?')
  })
  it('honours an explicit fallback glyph', () => {
    const el = renderAvatar(<Avatar name="" email="" fallback="·" />)
    expect(el).toHaveTextContent('·')
  })
})

describe('DS-014 Avatar — certified surface', () => {
  it('renders the certified AdminIconWrap circle material (dark)', () => {
    const el = renderAvatar(<Avatar name="Alice" size="md" />)
    expect(el).toHaveClass('relative', 'inline-flex', 'shrink-0')
    const badge = el.querySelector('div') as HTMLElement
    expect(badge).toHaveClass('w-9', 'h-9', 'rounded-full', 'flex', 'items-center', 'justify-center')
    expect(badge).toHaveClass('bg-primary/10', 'text-primary')
  })
  it('uses the ancient-icon-badge medallion in light mode', () => {
    const el = renderAvatar(<Avatar name="Alice" />, true)
    const badge = el.querySelector('div') as HTMLElement
    expect(badge).toHaveClass('ancient-icon-badge')
  })
  it('supports sm sizing', () => {
    const el = renderAvatar(<Avatar name="Alice" size="sm" />)
    const badge = el.querySelector('div') as HTMLElement
    expect(badge).toHaveClass('w-7', 'h-7', 'text-[10px]')
  })
  it('supports lg sizing', () => {
    const el = renderAvatar(<Avatar name="Alice" size="lg" />)
    const badge = el.querySelector('div') as HTMLElement
    expect(badge).toHaveClass('w-14', 'h-14', 'text-lg')
  })
  it('square shape maps to rounded-lg', () => {
    const el = renderAvatar(<Avatar name="Alice" shape="square" />)
    const badge = el.querySelector('div') as HTMLElement
    expect(badge).toHaveClass('rounded-lg')
  })
})

describe('DS-014 Avatar — accessibility contract', () => {
  it('is aria-hidden by default (decorative, adjacent to visible name)', () => {
    const el = renderAvatar(<Avatar name="Alice" />)
    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el).not.toHaveAttribute('role')
  })
  it('exposes role="img" and a name-derived label when decorative is false', () => {
    const el = renderAvatar(<Avatar name="Alice" decorative={false} />)
    expect(el).not.toHaveAttribute('aria-hidden')
    expect(el).toHaveAttribute('role', 'img')
    expect(el).toHaveAttribute('aria-label', "Alice's avatar")
  })
  it('honours an explicit ariaLabel override', () => {
    const el = renderAvatar(<Avatar name="Alice" decorative={false} ariaLabel="Alicia monogram" />)
    expect(el).toHaveAttribute('aria-label', 'Alicia monogram')
  })
})

describe('DS-014 Avatar — status slot', () => {
  it('renders the status indicator in the corner slot', () => {
    const el = renderAvatar(<Avatar name="Alice" status={<span data-testid="verified">✓</span>} />)
    expect(el.querySelector('[data-testid="verified"]')).toBeTruthy()
  })
})
