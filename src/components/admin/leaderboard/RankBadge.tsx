import { Medal } from 'lucide-react'

export function RankBadge({ rank }: { rank: number }) {
  const getRankStyles = () => {
    switch (rank) {
      case 1:
        return 'light:text-warning light:border-warning/20 text-primary border-primary/20'
      case 2:
        return 'text-text-muted border-border-subtle/40'
      case 3:
        return 'light:text-[var(--gold-300)] light:border-warning/20 text-text-secondary border-border-subtle/40'
      default:
        return 'text-text-secondary border-secondary/10 font-bold'
    }
  }

  return (
    <div role="img" aria-label={`Rank ${rank}`} className={`flex items-center justify-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border text-xs sm:text-sm font-bold tracking-tight light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon bg-hover-bg ${getRankStyles()}`}>
      {(rank >= 1 && rank <= 3) && <Medal size={12} className="sm:size-3.5 lg:size-4" />}
      <span>{rank}</span>
    </div>
  )
}
