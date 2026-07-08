import type { FC } from 'react'
import { Badge } from '../../common/AntigravityUI'
import type { BadgeProps } from '../../common/AntigravityData'

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard' | string
  className?: string
}

const DIFFICULTY_VARIANT: Record<string, BadgeProps['variant']> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
}

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  const diff = difficulty?.toLowerCase() || 'medium'
  return (
    <Badge variant={DIFFICULTY_VARIANT[diff] || 'warning'} className={className}>
      {diff}
    </Badge>
  )
}
