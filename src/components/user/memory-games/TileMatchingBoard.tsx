import { memo, type CSSProperties } from 'react'
import { isStageActive } from '../../../utils/memoryGameLogic'
import { getTileMatchingValueTile } from '../../../config/memoryGames'
import type { TileMatchingState } from '../../../utils/tileMatchingLogic'

interface TileMatchingBoardProps {
  state: TileMatchingState
  onSelect: (cellIndex: number) => void
}

/** Largest comfortable tile font for a given column count (fruit emoji). */
function tileEmojiFontSize(cols: number): string {
  const preferredVw = (12 / cols).toFixed(2)
  const maxRem = cols <= 3 ? 2.1 : cols === 4 ? 1.7 : cols === 5 ? 1.5 : 1.35
  return `clamp(0.8rem, ${preferredVw}vw, ${maxRem}rem)`
}

/**
 * The Tile Matching board. Face-down tiles hold fruit symbols (two of each);
 * the player flips them two at a time until every pair is locked. A CSS Grid
 * with `repeat(var(--tm-cols), minmax(0, 1fr))` inside a
 * `aspect-ratio: var(--tm-cols) / var(--tm-rows)` wrapper keeps every tile
 * proportional and tappable (≥44px short side) even at 320px, for every board
 * shape up to the 6×6 cap. The whole board locks during a mismatch flash; a
 * revealed-but-unmatched tile is a disabled button so it can never be re-tapped.
 */
export const TileMatchingBoard = memo(function TileMatchingBoard({
  state,
  onSelect,
}: TileMatchingBoardProps) {
  const { positions, gridSize, rows, status, matchedIndices, mismatchIndices, firstPick } = state

  // The entire board pauses while a wrong pair flashes (the same momentum as a
  // stage retry) — no stray taps can resolve a third tile mid-reveal.
  const interactive = isStageActive(status) && mismatchIndices.length === 0
  const fontSize = tileEmojiFontSize(gridSize)
  const gridStyle = { '--tm-cols': gridSize, '--tm-rows': rows } as CSSProperties

  return (
    <div className="tm-grid" style={gridStyle} role="group" aria-label="Tile matching board">
      {positions.map((value, cellIndex) => {
        const matched = matchedIndices.includes(cellIndex)
        const mismatched = mismatchIndices.includes(cellIndex)
        const pending = firstPick === cellIndex
        const faceUp = matched || mismatched || pending
        const tile = getTileMatchingValueTile(value)
        const className = [
          'tm-tile',
          faceUp ? '' : 'hidden',
          matched ? 'matched' : '',
          mismatched ? 'wrong' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const label = matched
          ? `Tile ${cellIndex + 1}, ${tile.name}, matched`
          : faceUp
            ? `Tile ${cellIndex + 1}, ${tile.name}`
            : `Tile ${cellIndex + 1}, hidden`

        return (
          <button
            key={cellIndex}
            type="button"
            className={className}
            style={{ fontSize }}
            onClick={() => onSelect(cellIndex)}
            disabled={!interactive || matched || mismatched || pending}
            aria-label={label}
            aria-hidden={matched || undefined}
            tabIndex={matched ? -1 : undefined}
          >
            <span aria-hidden>{faceUp ? tile.emoji : ''}</span>
          </button>
        )
      })}
    </div>
  )
})