import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { CheckCircle2 } from 'lucide-react'
import { ThemeProvider } from './context/ThemeContext'
import { Badge } from './components/common/AntigravityData'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'secondary'

afterEach(cleanup)

function renderBadge(ui: React.ReactNode, light = false) {
  const r = render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
  return r.container.firstChild?.firstChild as HTMLElement
}

const VARIANTS: BadgeVariant[] = ['default', 'success', 'danger', 'warning', 'primary', 'secondary']
const VARIANT_MATERIAL: Record<BadgeVariant, [string, string]> = {
  default: ['bg-hover-bg', 'text-text-secondary'],
  success: ['bg-success/15', 'text-success'],
  danger: ['bg-danger/15', 'text-danger'],
  warning: ['bg-warning/15', 'text-warning'],
  primary: ['bg-primary/15', 'text-primary'],
  secondary: ['bg-secondary/15', 'text-secondary'],
}

const LIGHT_SEMANTIC_VARIANTS: BadgeVariant[] = ['success', 'danger', 'warning']

describe('DS-005 Badge — variant material', () => {
  VARIANTS.forEach((v) => {
    it(`renders ${v} variant material (DARK)`, () => {
      const el = renderBadge(<Badge variant={v}>x</Badge>)
      expect(el).toHaveClass(VARIANT_MATERIAL[v][0], VARIANT_MATERIAL[v][1])
    })
    it(`renders ${v} variant material (LIGHT)`, () => {
      const el = renderBadge(<Badge variant={v}>x</Badge>, true)
      expect(el).toHaveClass(VARIANT_MATERIAL[v][0], VARIANT_MATERIAL[v][1])
      if (LIGHT_SEMANTIC_VARIANTS.includes(v)) {
        expect(el).toHaveClass(
          'light:bg-[var(--badge-light-bg)]',
          `light:text-${v}`,
          `light:border-${v}`,
        )
      }
    })
  })
})

describe('DS-005 Badge — sizing, shape, content', () => {
  it('md size (default) => h-7 px-3 rounded-button-md text-[10px]', () => {
    const el = renderBadge(<Badge>x</Badge>)
    expect(el).toHaveClass('h-7', 'px-3', 'rounded-button-md', 'text-[10px]')
  })
  it('sm size => h-5 px-2.5 rounded-full text-[9px]', () => {
    const el = renderBadge(<Badge size="sm">x</Badge>)
    expect(el).toHaveClass('h-5', 'px-2.5', 'rounded-full', 'text-[9px]')
  })
  it('curved opt-in => rounded-full overrides the size radius', () => {
    const el = renderBadge(<Badge curved>x</Badge>)
    expect(el).toHaveClass('rounded-full')
    expect(el).not.toHaveClass('rounded-button-md')
  })
  it('renders icon when provided', () => {
    const el = renderBadge(<Badge icon={CheckCircle2}>ok</Badge>)
    expect(el.querySelector('svg')).toBeTruthy()
  })
  it('renders children content', () => {
    const el = renderBadge(<Badge>Required</Badge>)
    expect(el.textContent).toBe('Required')
  })
  it('pulse applies animate-pulse', () => {
    const el = renderBadge(<Badge pulse>x</Badge>)
    expect(el).toHaveClass('animate-pulse')
  })
  it('uppercase + border + flex layout owned by Foundation', () => {
    const el = renderBadge(<Badge>x</Badge>)
    expect(el).toHaveClass('uppercase', 'border', 'flex', 'items-center')
  })
})
