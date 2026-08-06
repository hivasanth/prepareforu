import { Label } from '../common/AntigravityTypography'

interface TagBadgeProps {
  tag: string
}

const TAG_STYLES: Record<string, string> = {
  IMP: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  TIP: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  ALERT: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  KEY: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
      <Label className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border leading-none m-0 ${TAG_STYLES[tag] || 'bg-sky-500/15 text-sky-700 border-sky-500/30'}`}>
      {tag}
    </Label>
  )
}
