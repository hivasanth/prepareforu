import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { User, CheckCircle2, AlertCircle } from 'lucide-react'
import { ThemeProvider } from './context/ThemeContext'
import { IconBadge } from './components/common/IconBadge'
import { AdminIconWrap } from './components/common/AdminIconWrap'

afterEach(cleanup)

function renderBadge(ui: React.ReactNode, light = false) {
  const r = render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
  return r.container.firstChild?.firstChild as HTMLElement
}

describe('DS-004 IconBadge — status material', () => {
  it('status success', () => {
    const el = renderBadge(<IconBadge icon={User} status="success" />)
    expect(el).toHaveClass('bg-success/10', 'text-success')
  })
  it('status danger', () => {
    const el = renderBadge(<IconBadge icon={AlertCircle} status="danger" />)
    expect(el).toHaveClass('bg-danger/10', 'text-danger')
  })
  it('status warning', () => {
    const el = renderBadge(<IconBadge icon={User} status="warning" />)
    expect(el).toHaveClass('bg-warning/10', 'text-warning')
  })
  it('status secondary', () => {
    const el = renderBadge(<IconBadge icon={User} status="secondary" />)
    expect(el).toHaveClass('bg-secondary/10', 'text-secondary')
  })
  it('status muted', () => {
    const el = renderBadge(<IconBadge icon={User} status="muted" />)
    expect(el).toHaveClass('bg-hover-bg', 'text-text-muted')
  })
  it('status primary (default)', () => {
    const el = renderBadge(<IconBadge icon={User} />)
    expect(el).toHaveClass('bg-primary/10', 'text-primary')
  })
  it('legacy darkClassName still works (backward compatible)', () => {
    const el = renderBadge(<IconBadge icon={User} darkClassName="bg-hover-bg text-text-muted" />)
    expect(el).toHaveClass('bg-hover-bg', 'text-text-muted')
  })
  it('status takes precedence over default darkClassName', () => {
    const el = renderBadge(<IconBadge icon={User} />)
    expect(el).toHaveClass('bg-primary/10', 'text-primary')
  })
})

describe('DS-004 IconBadge — sizing & shape', () => {
  it('size maps to container class (md => w-8 h-8)', () => {
    const el = renderBadge(<IconBadge icon={User} size="md" />)
    expect(el).toHaveClass('w-8', 'h-8')
  })
  it('shape circle applies rounded-full', () => {
    const el = renderBadge(<IconBadge icon={User} shape="circle" />)
    expect(el).toHaveClass('rounded-full')
  })
  it('shape rounded applies rounded-xl', () => {
    const el = renderBadge(<IconBadge icon={User} shape="rounded" />)
    expect(el).toHaveClass('rounded-xl')
  })
  it('renders lucide icon with correct size (2xl => 24)', () => {
    const el = renderBadge(<IconBadge icon={User} size="2xl" />)
    const svg = el.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('24')
  })
})

describe('DS-004 IconBadge — light/dark', () => {
  it('renders in DARK (no .light)', () => {
    const el = renderBadge(<IconBadge icon={CheckCircle2} status="success" />)
    expect(el).toHaveClass('bg-success/10', 'text-success')
  })
  it('renders in LIGHT (.light wrapper)', () => {
    const el = renderBadge(<IconBadge icon={CheckCircle2} status="success" />, true)
    expect(el).toHaveClass('bg-success/10', 'text-success')
  })
})

describe('DS-004 AdminIconWrap — admin icon wrapper', () => {
  it('renders default md/lg material', () => {
    const el = renderBadge(<AdminIconWrap size="md" rounded="lg"><User /></AdminIconWrap>)
    expect(el).toHaveClass('w-9', 'h-9', 'rounded-xl', 'flex', 'items-center', 'justify-center')
  })
  it('full rounded => rounded-full', () => {
    const el = renderBadge(<AdminIconWrap size="sm" rounded="full"><User /></AdminIconWrap>)
    expect(el).toHaveClass('rounded-full', 'w-7', 'h-7')
  })
  it('renders child icon', () => {
    const el = renderBadge(<AdminIconWrap><User /></AdminIconWrap>)
    expect(el.querySelector('svg')).toBeTruthy()
  })
})
