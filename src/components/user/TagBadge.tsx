interface TagBadgeProps {
  tag: string
}

const TAG_STYLES: Record<string, string> = {
  IMP: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  TIP: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  ALERT: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  KEY: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${TAG_STYLES[tag] || 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30'}`}>
      {tag}
    </span>
  )
}
