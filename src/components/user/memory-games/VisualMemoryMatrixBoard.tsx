import { memo, type CSSProperties } from 'react'
import { PatternTile } from './PatternTile'
import { isStageActive } from '../../../utils/memoryGameLogic'
import type { VisualMemoryMatrixState } from '../../../utils/visualMemoryMatrixLogic'

interface VisualMemoryMatrixBoardProps {
  state: VisualMemoryMatrixState
  onSelect: (cellIndex: number) => void
}

/**
 * The pattern board. The same CSS Grid + aspect-ratio wrapper as Number Memory
 * Rush keeps every cell square at every grid size (Game 2 ships 4×4 → 6×6; the
 * shared `grid-board` cell scaling handles all of them). During the preview the
 * pattern tiles glow; afterwards only recalled tiles stay visible.
 */
export const VisualMemoryMatrixBoard = memo(function VisualMemoryMatrixBoard({
  state,
  onSelect,
}: VisualMemoryMatrixBoardProps) {
  const { positions, correctTiles, gridSize, phase, status, wrongCell } = state

  const interactive = isStageActive(status)
  const gridStyle = { '--grid-size': gridSize } as CSSProperties

  return (
    <div className="grid-board" style={gridStyle} role="group" aria-label="Pattern memory board">
      {Array.from({ length: gridSize * gridSize }, (_, cellIndex) => (
        <div className="cell" key={cellIndex}>
          <PatternTile
            cellIndex={cellIndex}
            isPattern={positions.includes(cellIndex)}
            revealed={phase === 'show'}
            found={correctTiles.includes(cellIndex)}
            isWrong={wrongCell === cellIndex}
            interactive={interactive}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
})