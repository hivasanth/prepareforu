import { memo, useMemo, type CSSProperties } from 'react'
import { MemoryTile } from './MemoryTile'
import { isStageActive } from '../../../utils/memoryGameLogic'
import type { SchulteTrailState } from '../../../utils/schulteTrailLogic'

interface SchulteTrailBoardProps {
  state: SchulteTrailState
  onSelect: (cellIndex: number) => void
}

/** Largest comfortable tile font for a given grid side (2-digit numbers). */
function schulteTileFontSize(gridSize: number): string {
  const preferredVw = (64 / gridSize).toFixed(2)
  const maxRem = gridSize <= 4 ? 1.7 : gridSize === 5 ? 1.4 : 1.2
  return `clamp(0.6rem, ${preferredVw}vw, ${maxRem}rem)`
}

/**
 * The Schulte Trail board. A full permutation — every cell hosts one number,
 * 1..gridSize², all visible from the start. A CSS Grid with
 * `repeat(n, minmax(0, 1fr))` inside an `aspect-ratio: 1 / 1` wrapper keeps
 * every cell square and tappable (≥44px) even at 320px, for every grid size.
 * Tiles reuse the shared `MemoryTile`: found numbers stay visible and green,
 * every remaining number is a keyboard-operable button.
 */
export const SchulteTrailBoard = memo(function SchulteTrailBoard({
  state,
  onSelect,
}: SchulteTrailBoardProps) {
  const { positions, gridSize, expected, status, wrongCell } = state

  const numberByCell = useMemo(() => {
    const map = new Map<number, number>()
    positions.forEach((cell, index) => map.set(cell, index + 1))
    return map
  }, [positions])

  const interactive = isStageActive(status)
  const lastFound = expected - 1
  const fontSize = schulteTileFontSize(gridSize)
  const gridStyle = { '--grid-size': gridSize } as CSSProperties

  return (
    <div className="grid-board" style={gridStyle} role="group" aria-label="Schulte trail board">
      {Array.from({ length: gridSize * gridSize }, (_, cellIndex) => {
        const number = numberByCell.get(cellIndex) ?? null

        return (
          <div className="cell" key={cellIndex}>
            <MemoryTile
              cellIndex={cellIndex}
              number={number}
              revealed={true}
              found={number !== null && number <= lastFound}
              isWrong={wrongCell === cellIndex}
              interactive={interactive}
              fontSize={fontSize}
              onSelect={onSelect}
            />
          </div>
        )
      })}
    </div>
  )
})