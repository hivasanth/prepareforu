import { Medal } from 'lucide-react'

export function RankBadge({ rank }: { rank: number }) {
  const getRankStyles = () => {
    switch (rank) {
      case 1:
        return 'bg-warning/10 text-warning border-warning/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]'
      case 2:
        return 'bg-slate-300/20 text-slate-400 border-slate-300/30'
      case 3:
        return 'bg-orange-400/10 text-orange-500 border-orange-400/20'
      default:
        return 'bg-secondary/5 text-text-secondary border-secondary/10 font-bold'
    }
  }

  return (
    <div role="img" aria-label={`Rank ${rank}`} className={`flex items-center justify-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[9px] sm:text-[11px] lg:text-xs font-black tracking-tighter sm:tracking-normal ${getRankStyles()}`}>
      {(rank >= 1 && rank <= 3) && <Medal size={10} className="sm:size-3 lg:size-3.5" />}
      <span>{rank}</span>
    </div>
  )
}
