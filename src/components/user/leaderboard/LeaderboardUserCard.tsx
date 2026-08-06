import { memo } from 'react'
import { Card } from '../../common/AntigravityUI'
import { Body, Label } from '../../common/AntigravityTypography'
import { MetricItem } from './LeaderboardComponents'
import type { LeaderboardEntry } from './types'

interface LeaderboardUserCardProps {
  userRank: LeaderboardEntry;
  formatDuration: (secs?: number) => string;
}

export const LeaderboardUserCard = memo(function LeaderboardUserCard({ userRank, formatDuration }: LeaderboardUserCardProps) {
  return (
    <div className="sticky bottom-6 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <Card className="max-w-[1280px] mx-auto border-primary/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 backdrop-blur-md bg-card-bg/90">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary text-white flex flex-col items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <Label className="text-[7px] md:text-[8px] font-bold uppercase opacity-60 m-0">RANK</Label>
            <Body className="text-[16px] md:text-[18px] font-black leading-none m-0">{userRank.rank}</Body>
          </div>
          <div className="hidden sm:block">
            <Body className="text-[12px] md:text-[13px] font-bold text-text-primary uppercase m-0 leading-tight">Your Standing</Body>
            <Body className="text-[10px] md:text-[11px] text-text-muted m-0 uppercase">Ranked #{userRank.rank} Overall</Body>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
          <MetricItem label="SCORE" value={userRank.score} />
          <MetricItem label="ACCURACY" value={`${userRank.accuracy}%`} color="text-success" />
          <MetricItem label="BEST TIME" value={formatDuration(userRank.duration_seconds)} />
        </div>
      </Card>
    </div>
  )
})
