import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryTile } from './MemoryTile'

afterEach(() => cleanup())

const baseProps = {
  cellIndex: 0,
  number: null,
  revealed: true,
  found: false,
  isWrong: false,
  interactive: true,
  fontSize: '1rem',
  onSelect: vi.fn(),
}

describe('MemoryTile', () => {
  it('renders every cell as a real button with a non-leaking accessible label', () => {
    render(
      <MemoryTile
        {...baseProps}
        cellIndex={3}
        number={5}
        revealed
        interactive={false}
      />,
    )
    const button = screen.getByRole('button', { name: 'Number 5 tile' })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('labels empty cells "Empty tile" during show and "Hidden tile" during recall', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <MemoryTile {...baseProps} cellIndex={0} number={null} revealed onSelect={onSelect} />,
    )
    expect(screen.getByRole('button', { name: 'Empty tile' })).toBeEnabled()

    rerender(
      <MemoryTile
        {...baseProps}
        cellIndex={0}
        number={null}
        revealed={false}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByRole('button', { name: 'Hidden tile' })).toBeEnabled()
  })

  it('never reveals where numbers hide during recall', () => {
    render(
      <MemoryTile {...baseProps} cellIndex={4} number={2} revealed={false} />,
    )
    expect(screen.getByRole('button', { name: /Hidden tile/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Number 2/ })).not.toBeInTheDocument()
  })

  it('marks found cells disabled, off the tab order and aria-hidden but still visible', () => {
    const { container } = render(
      <MemoryTile {...baseProps} cellIndex={1} number={4} revealed={false} found />,
    )
    const button = container.querySelector('button[aria-label="Number 4, found"]')
    expect(button).not.toBeNull()
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveAttribute('tabindex', '-1')
    expect(button?.textContent).toBe('4')
  })

  it('fires onSelect with the cell index for an empty tap during recall', () => {
    const onSelect = vi.fn()
    render(
      <MemoryTile {...baseProps} cellIndex={7} number={null} revealed={false} onSelect={onSelect} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hidden tile' }))
    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('renders the shown number for revealed number cells', () => {
    const { container } = render(
      <MemoryTile {...baseProps} cellIndex={2} number={9} revealed />,
    )
    expect(container.querySelector('button[aria-label="Number 9 tile"]')?.textContent).toBe('9')
  })
})