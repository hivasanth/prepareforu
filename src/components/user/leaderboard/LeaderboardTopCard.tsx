import { memo } from 'react'
import { Trophy } from 'lucide-react'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { H3, Label } from '../../common/AntigravityTypography'
import type { LeaderboardEntry } from './types'

interface LeaderboardTopCardProps {
  entry: LeaderboardEntry;
}

export const LeaderboardTopCard = memo(function LeaderboardTopCard({ entry }: LeaderboardTopCardProps) {
  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm

  return (
    <section className="flex justify-center">
      <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-[24px] shadow-[0_20px_50px_rgba(184,134,11,0.2)] p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px] md:min-h-[240px]">
        <div className="absolute inset-0 bg-white/10 opacity-0 lg:group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-4 right-4 text-white/20">
          <Trophy size={isMobile ? 60 : 80} strokeWidth={1} />
        </div>
        <Label className="md:text-[11px] font-semibold text-white/60 uppercase tracking-[0.2em] mb-2 m-0">CURRENT LEADER</Label>
        <div className="text-[48px] md:text-[64px] font-black text-white italic leading-none mb-4 drop-shadow-2xl">#1</div>
        <H3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold text-white uppercase tracking-tight m-0 text-center truncate w-full px-4">{entry.full_name}</H3>
        <div className="flex items-center gap-3 mt-3">
          <Label className="text-[11px] md:text-[12px] font-bold text-white/80 m-0">{entry.score} PTS</Label>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <Label className="text-[11px] md:text-[12px] font-bold text-white/80 m-0">{entry.accuracy}% ACC</Label>
        </div>
      </div>
    </section>
  )
})
