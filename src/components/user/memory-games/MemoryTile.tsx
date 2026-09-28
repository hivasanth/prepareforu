import { memo } from 'react'

interface MemoryTileProps {
  cellIndex: number
  /** Number hosted by this cell (1-based); null for a permanently empty cell. */
  number: number | null
  /** Whether number tiles are currently visible (the "show" phase). */
  revealed: boolean
  /** Whether the player has already found this number (stays green + visible). */
  found: boolean
  isWrong: boolean
  interactive: boolean
  fontSize: string
  onSelect: (cellIndex: number) => void
}

/**
 * A single board tile. EVERY cell of the grid renders a tile so the player always
 * sees the FULL grid and can act on it:
 *   * Number cells are <button>s (keyboard-operable via Tab/Enter/Space).
 *   * EMPTY cells are <button>s too — during recall tapping one costs a life,
 *     exactly like tapping the wrong number.
 *
 * Non-leaky labels: during recall both hidden number cells AND empty cells read
 * "Hidden tile", so the accessible name can never reveal where numbers are
 * hidden. During the show phase empty cells read "Empty tile" and number cells
 * read "Number N tile". Found (correct) cells are disabled, removed from the tab
 * order and aria-hidden — they stay VISIBLE with the success treatment instead
 * of fading out, so the player always sees the numbers they already found.
 */
export const MemoryTile = memo(function MemoryTile({
  cellIndex,
  number,
  revealed,
  found,
  isWrong,
  interactive,
  fontSize,
  onSelect,
}: MemoryTileProps) {
  const hasNumber = number !== null
  const isCorrect = found

  // Empty cells always share the hidden look; hidden number cells join them
  // during recall. Only revealed numbers and found cells differ visually.
  const inactiveLook = !hasNumber || (!revealed && !isCorrect)

  const label = isCorrect
    ? `Number ${number}, found`
    : !revealed
      ? 'Hidden tile'
      : hasNumber
        ? `Number ${number} tile`
        : 'Empty tile'

  const className = [
    'tile',
    inactiveLook ? 'inactive' : '',
    isCorrect ? 'correct' : '',
    isWrong ? 'wrong' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const showText = hasNumber && (revealed || isCorrect)

  return (
    <button
      type="button"
      className={className}
      style={{ fontSize }}
      onClick={() => onSelect(cellIndex)}
      disabled={!interactive || isCorrect}
      aria-label={label}
      aria-hidden={isCorrect ? true : undefined}
      tabIndex={isCorrect ? -1 : undefined}
    >
      <span aria-hidden>{showText ? number : ''}</span>
    </button>
  )
})