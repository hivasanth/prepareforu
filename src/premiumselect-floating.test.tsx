import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from './context/ThemeContext'
import { PremiumSelect } from './components/common/PremiumSelect'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderWithTheme(ui: React.ReactNode, light = false) {
  return render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
}

const OPTS = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

function getTrigger(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('button[role="combobox"]')!
}

/** jsdom reports zero rects; give the trigger a real geometry for collision tests. */
function mockTriggerRect(el: HTMLElement, rect: Partial<DOMRect>) {
  const width = rect.width ?? 160
  const height = rect.height ?? 48
  const left = rect.left ?? 0
  const top = rect.top ?? 0
  const right = rect.right ?? left + width
  const bottom = rect.bottom ?? top + height
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: left, y: top, top, left, right, bottom, width, height,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('PremiumSelect — Floating layer remediation', () => {
  it('portals the open menu to document.body (escapes ancestor clipping/stacking)', () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    fireEvent.click(getTrigger(container))
    const listbox = screen.getByRole('listbox')
    // Menu is a child of <body>, NOT of the component's subtree.
    expect(listbox.parentElement!.parentElement).toBe(document.body)
    expect(container.querySelector('[role="listbox"]')).toBeNull()
  })

  it('menu wrapper is position:fixed on the canonical --z-dropdown layer token', () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    fireEvent.click(getTrigger(container))
    const wrapper = screen.getByRole('listbox').parentElement!
    expect(wrapper).toHaveClass('fixed')
    expect(wrapper).toHaveClass('z-[var(--z-dropdown)]')
  })

  it('no arbitrary z-index remains (legacy z-[1000] removed)', () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    fireEvent.click(getTrigger(container))
    expect(container.innerHTML).not.toContain('z-[1000]')
    expect(document.body.innerHTML).not.toContain('z-[1000]')
  })

  it('opens below with start alignment when there is room', () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    const trigger = getTrigger(container)
    mockTriggerRect(trigger, { top: 100, bottom: 148, left: 40 })
    fireEvent.click(trigger)
    const wrapper = screen.getByRole('listbox').parentElement! as HTMLElement
    expect(wrapper.style.top).toBe('152px') // bottom + offset(4)
    expect(wrapper.style.left).toBe('40px')
    expect(wrapper.style.transform).toBe('')
  })

  it('flips above near the viewport bottom and pins its bottom edge to the trigger', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 })
    const { container } = renderWithTheme(
      <PremiumSelect value="a" onChange={() => {}} options={OPTS} maxVisible={10} />,
    )
    const trigger = getTrigger(container)
    // Trigger at the very bottom: spaceBelow ≈ 0, spaceAbove large.
    mockTriggerRect(trigger, { top: 760, bottom: 768, left: 0 })
    fireEvent.click(trigger)
    const wrapper = screen.getByRole('listbox').parentElement! as HTMLElement
    expect(wrapper.style.top).toBe('756px') // top - offset(4); panel grows upward
    expect(wrapper.style.transform).toBe('translateY(-100%)')
  })

  it('shifts left near the right viewport edge to stay visible', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    const trigger = getTrigger(container)
    mockTriggerRect(trigger, { top: 100, bottom: 148, left: 900, right: 1060 })
    // Simulate the rendered menu width (jsdom has no layout).
    const widthSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(288)
    fireEvent.click(trigger)
    expect(widthSpy).toHaveBeenCalled()
    const wrapper = screen.getByRole('listbox').parentElement! as HTMLElement
    // clamped to vw - margin(8) - menuWidth(288) = 728
    expect(Number.parseFloat(wrapper.style.left)).toBeLessThanOrEqual(1024 - 8)
    expect(Number.parseFloat(wrapper.style.left)).toBe(728)
  })

  it('caps maxHeight to the available space near the viewport edge', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 })
    const { container } = renderWithTheme(
      <PremiumSelect value="a" onChange={() => {}} options={OPTS} maxVisible={6} />,
    )
    const trigger = getTrigger(container)
    mockTriggerRect(trigger, { top: 250, bottom: 298, left: 0 }) // ~2px below
    fireEvent.click(trigger)
    const surface = screen.getByRole('listbox') as HTMLElement
    expect(surface.style.maxHeight).not.toBe(`${6 * 44 + 8}px`)
    expect(Number.parseFloat(surface.style.maxHeight)).toBeLessThan(6 * 44 + 8)
  })

  it('Escape closes the menu and returns focus to the trigger', async () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('click outside closes the menu', async () => {
    const { container } = renderWithTheme(<PremiumSelect value="a" onChange={() => {}} options={OPTS} />)
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('click inside the portaled menu does NOT close it', () => {
    const { container } = renderWithTheme(<PremiumSelect value="b" onChange={() => {}} options={OPTS} placeholder="Pick" />)
    fireEvent.click(getTrigger(container))
    const listbox = screen.getByRole('listbox')
    fireEvent.mouseDown(listbox)
    expect(screen.queryByRole('listbox')).toBeTruthy()
  })

  it('selecting an option from the portal calls onChange and closes', async () => {
    let val = 'a'
    const { container } = renderWithTheme(
      <PremiumSelect value={val} onChange={v => (val = v)} options={OPTS} />,
    )
    fireEvent.click(getTrigger(container))
    fireEvent.click(screen.getByText('Gamma'))
    expect(val).toBe('c')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('keyboard: ArrowDown opens + highlights selection, arrows cycle, Enter selects', async () => {
    let val = 'b'
    const { container } = renderWithTheme(
      <PremiumSelect value={val} onChange={v => (val = v)} options={OPTS} />,
    )
    const trigger = getTrigger(container)
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeTruthy()
    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true') // selected "Beta" highlighted
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }) // → Gamma
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(val).toBe('c')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('keyboard: ArrowUp wraps to the last option', async () => {
    let val = 'a'
    const { container } = renderWithTheme(
      <PremiumSelect value={val} onChange={v => (val = v)} options={OPTS} />,
    )
    const trigger = getTrigger(container)
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }) // opens, highlights "Alpha"
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }) // wraps to Gamma
    fireEvent.keyDown(trigger, { key: 'Enter' })
    await waitFor(() => expect(val).toBe('c'))
  })

  it('placeholder row selects "all"', async () => {
    let val = 'b'
    const { container } = renderWithTheme(
      <PremiumSelect value={val} onChange={v => (val = v)} options={OPTS} placeholder="Pick" />,
    )
    fireEvent.click(getTrigger(container))
    fireEvent.click(screen.getByText('Pick'))
    expect(val).toBe('all')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('ARIA contract preserved through the portal', () => {
    const { container } = renderWithTheme(
      <PremiumSelect value="a" onChange={() => {}} options={OPTS} label="Language" />,
    )
    const trigger = getTrigger(container)
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const listbox = screen.getByRole('listbox')
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id)
    expect(listbox.getAttribute('aria-label')).toBe('Language')
  })
})
