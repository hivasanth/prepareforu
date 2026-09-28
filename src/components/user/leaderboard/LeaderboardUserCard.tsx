import { memo } from 'react'
import { Card, NumberBadge } from '../../common/AntigravityUI'
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
      <Card className="max-w-[1280px] mx-auto border-primary/30 p-4 shadow-elevation-3 flex items-center justify-between gap-4 backdrop-blur-md bg-card-bg/90">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <Label className="text-[7px] md:text-[8px] font-bold uppercase opacity-60 m-0">RANK</Label>
            <NumberBadge value={userRank.rank} variant="rank" className="text-[16px] md:text-[18px] w-10 h-10 md:w-12 md:h-12" />
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
