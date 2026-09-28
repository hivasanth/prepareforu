import { memo, useMemo, type CSSProperties } from 'react'
import { MemoryTile } from './MemoryTile'
import { isStageActive, type MemoryGameState } from '../../../utils/memoryGameLogic'

interface MemoryGameBoardProps {
  state: MemoryGameState
  onSelect: (cellIndex: number) => void
}

/** Largest comfortable tile font for a given grid side — caps shrink as it grows. */
function tileFontSize(gridSize: number): string {
  const preferredVw = (72 / gridSize).toFixed(2)
  const maxRem =
    gridSize <= 4 ? 1.9 : gridSize === 5 ? 1.6 : gridSize === 6 ? 1.35 : gridSize === 7 ? 1.15 : 1
  return `clamp(0.62rem, ${preferredVw}vw, ${maxRem}rem)`
}

/**
 * The board. A CSS Grid with `repeat(n, minmax(0, 1fr))` columns and rows inside
 * an `aspect-ratio: 1 / 1` wrapper keeps every cell square and guarantees the
 * board never overflows horizontally even at 320px, for every grid size.
 */
export const MemoryGameBoard = memo(function MemoryGameBoard({
  state,
  onSelect,
}: MemoryGameBoardProps) {
  const { positions, gridSize, phase, expected, status, wrongCell } = state

  const numberByCell = useMemo(() => {
    const map = new Map<number, number>()
    positions.forEach((cell, index) => map.set(cell, index + 1))
    return map
  }, [positions])

  const interactive = isStageActive(status)
  const lastFound = expected - 1
  const fontSize = tileFontSize(gridSize)
  const gridStyle = { '--grid-size': gridSize } as CSSProperties

  return (
    <div className="grid-board" style={gridStyle} role="group" aria-label="Number memory board">
      {Array.from({ length: gridSize * gridSize }, (_, cellIndex) => {
        const number = numberByCell.get(cellIndex) ?? null

        return (
          <div className="cell" key={cellIndex}>
            <MemoryTile
              cellIndex={cellIndex}
              number={number}
              revealed={phase === 'show'}
              found={number !== null && phase === 'recall' && number <= lastFound}
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
