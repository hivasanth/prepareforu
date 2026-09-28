import { memo } from 'react'

interface PatternTileProps {
  cellIndex: number
  /** True when this cell is a highlighted pattern target for the arrangement. */
  isPattern: boolean
  /** Pattern currently visible (the preview/memorise phase). */
  revealed: boolean
  /** Recalled correctly — stays highlighted and locked in. */
  found: boolean
  isWrong: boolean
  interactive: boolean
  onSelect: (cellIndex: number) => void
}

/**
 * A single Pattern Memory Matrix tile. Like the Number Memory Rush tile every
 * cell renders a <button> so the player always sees the FULL grid.
 *
 * Non-leaky labels: during recall every tile not yet found reads "Hidden tile",
 * so the accessible name can never reveal where the pattern sits. Found tiles
 * are disabled, removed from the tab order and aria-hidden — they stay visible
 * with the success treatment instead of fading out.
 */
export const PatternTile = memo(function PatternTile({
  cellIndex,
  isPattern,
  revealed,
  found,
  isWrong,
  interactive,
  onSelect,
}: PatternTileProps) {
  const label = found
    ? 'Pattern tile, found'
    : revealed
      ? isPattern
        ? 'Pattern tile'
        : 'Empty tile'
      : 'Hidden tile'

  const className = [
    'tile',
    found ? 'correct' : revealed ? (isPattern ? 'preview' : '') : 'inactive',
    isWrong ? 'wrong' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(cellIndex)}
      disabled={!interactive || found}
      aria-label={label}
      aria-hidden={found ? true : undefined}
      tabIndex={found ? -1 : undefined}
    >
      <span aria-hidden />
    </button>
  )
})