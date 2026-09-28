import type { FC } from 'react'
import { Pill } from '../../common/AntigravityUI'
import type { PillVariant } from '../../common/AntigravityUI'

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard' | string
  className?: string
}

/* Phase 5.4D: Difficulty is a Pill role. Easy/Medium/Hard map to semantic
   colors ONLY (success/warning/danger) — no other color is ever shown. */
const DIFFICULTY_VARIANT: Record<string, PillVariant> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
}

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  const diff = difficulty?.toLowerCase() || 'medium'
  return (
    <Pill role="difficulty" variant={DIFFICULTY_VARIANT[diff] || 'warning'} className={className}>
      {diff}
    </Pill>
  )
}
