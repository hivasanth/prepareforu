import { Medal } from 'lucide-react'

export function RankBadge({ rank }: { rank: number }) {
  const getRankStyles = () => {
    switch (rank) {
      case 1:
        return 'bg-warning/10 text-warning border-warning/20 shadow-warning/30'
      case 2:
        return 'bg-hover-bg/30 text-text-muted border-border-subtle/40'
      case 3:
        return 'bg-warning/10 text-[var(--gold-300)] border-warning/20'
      default:
        return 'bg-secondary/5 text-text-secondary border-secondary/10 font-bold'
    }
  }

  return (
    <div role="img" aria-label={`Rank ${rank}`} className={`flex items-center justify-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[9px] sm:text-[11px] lg:text-xs font-bold tracking-tighter sm:tracking-normal ${getRankStyles()}`}>
      {(rank >= 1 && rank <= 3) && <Medal size={10} className="sm:size-3 lg:size-3.5" />}
      <span>{rank}</span>
    </div>
  )
}
