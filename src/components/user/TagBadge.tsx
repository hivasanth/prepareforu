import { Pill } from '../common/AntigravityUI'
import type { PillVariant } from '../common/AntigravityUI'

interface TagBadgeProps {
  tag: string
}

/* Phase 5.4D: Tag is a Pill role. The legacy raw palette (amber/emerald/rose/
   purple/sky) is replaced by the semantic token language — no hardcoded amber
   or Tailwind palette borders remain. IMP→warning, TIP→success, ALERT→danger,
   KEY→primary, any other tag→secondary. */
const TAG_VARIANTS: Record<string, PillVariant> = {
  IMP: 'warning',
  TIP: 'success',
  ALERT: 'danger',
  KEY: 'primary',
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Pill role="tag" variant={TAG_VARIANTS[tag] || 'secondary'} size="xs" inline>
      {tag}
    </Pill>
  )
}
