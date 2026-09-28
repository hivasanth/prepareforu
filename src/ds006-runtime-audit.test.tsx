import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AlertTriangle, Info } from 'lucide-react'
import { ThemeProvider } from './context/ThemeContext'
import { Alert, type AlertVariant } from './components/common/Alert'

afterEach(cleanup)

function renderAlert(ui: React.ReactNode, light = false) {
  const r = render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
  return r.container.firstChild?.firstChild as HTMLElement
}

const VARIANTS: AlertVariant[] = ['info', 'success', 'error', 'warning']
const MATERIAL: Record<AlertVariant, [string, string, string]> = {
  info: ['bg-primary/10', 'text-primary', 'border-primary/20'],
  success: ['bg-success/10', 'text-success', 'border-success/20'],
  error: ['bg-danger/10', 'text-danger', 'border-danger/20'],
  warning: ['bg-warning/10', 'text-warning', 'border-warning/20'],
}

describe('DS-006 Alert — variant material', () => {
  VARIANTS.forEach((v) => {
    it(`renders ${v} material (DARK)`, () => {
      const el = renderAlert(<Alert variant={v}>msg</Alert>)
      expect(el).toHaveClass(MATERIAL[v][0], MATERIAL[v][1], MATERIAL[v][2])
    })
    it(`renders ${v} material (LIGHT)`, () => {
      const el = renderAlert(<Alert variant={v}>msg</Alert>, true)
      expect(el).toHaveClass(MATERIAL[v][0], MATERIAL[v][1], MATERIAL[v][2])
    })
  })
})

describe('DS-006 Alert — structure & a11y', () => {
  it('error variant has role="alert"; others role="status"', () => {
    expect(renderAlert(<Alert variant="error">e</Alert>)).toHaveAttribute('role', 'alert')
    expect(renderAlert(<Alert variant="info">i</Alert>)).toHaveAttribute('role', 'status')
    expect(renderAlert(<Alert variant="success">s</Alert>)).toHaveAttribute('role', 'status')
    expect(renderAlert(<Alert variant="warning">w</Alert>)).toHaveAttribute('role', 'status')
  })
  it('renders icon when provided', () => {
    const el = renderAlert(<Alert variant="error" icon={AlertTriangle}>e</Alert>)
    expect(el.querySelector('svg')).toBeTruthy()
  })
  it('renders title (uppercase bold) and children', () => {
    const el = renderAlert(<Alert variant="warning" title="Heads up" icon={Info}>detail</Alert>)
    expect(el.textContent).toContain('Heads up')
    expect(el.textContent).toContain('detail')
  })
  it('owns radius/padding/typography/icon-placement', () => {
    const el = renderAlert(<Alert variant="info" icon={Info}>x</Alert>)
    expect(el).toHaveClass('rounded-button-md', 'border', 'px-4', 'py-3', 'text-[13px]', 'flex', 'items-start', 'gap-2.5')
  })
  it('renders without title or icon (minimal)', () => {
    const el = renderAlert(<Alert>x</Alert>)
    expect(el.textContent).toBe('x')
    expect(el).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/20')
  })
})
