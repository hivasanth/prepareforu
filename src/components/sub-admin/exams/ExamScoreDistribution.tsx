import { motion } from 'framer-motion'
import { MOTION_DURATION, MOTION_EASE } from '../../../components/common/AntigravityMotion'
import { Card, SectionHeader } from '../../../components/common/AntigravityUI'
import { useExamResponsive } from './useExamResponsive'
import { BarChart3 } from 'lucide-react'

interface ExamScoreDistributionProps {
  scoreDistribution: { label: string; count: number; pct: number }[]
}

export function ExamScoreDistribution({ scoreDistribution }: ExamScoreDistributionProps) {
  const {
    charts: { barH },
    typography: { barFont },
  } = useExamResponsive()

  const barMaxPct = Math.max(...scoreDistribution.map(b => b.pct)) || 1
  const colors = [
    'bg-red-400/70',
    'bg-amber-400/70',
    'bg-yellow-400/70',
    'bg-blue-400/70',
    'bg-green-500/70',
  ]

  return (
    <section aria-label="Score distribution chart">
      <SectionHeader title="Score Distribution" icon={BarChart3} />
      {/* Leaderboard-style wrapper container hosting the band chart */}
      <Card variant="elevated" className="animate-in mt-3 overflow-hidden">
        <div
          className="p-4"
          style={{ height: barH + 56 }}
          role="img"
          aria-label={`Score distribution: ${scoreDistribution.map(b => `${b.label}: ${b.count} students (${Math.round(b.pct)}%)`).join(', ')}`}
        >
          {/* Bounded horizontal scroll (same x-auto flow as the section nav track) */}
          <div className="overflow-x-auto custom-scrollbar h-full">
            <div className="flex items-end justify-between gap-2 h-full pb-6 min-w-[420px]">
              {scoreDistribution.map((band, i) => {
                const heightPct = (band.pct / barMaxPct) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="font-black text-text-primary" style={{ fontSize: barFont }}>
                      {band.count}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, band.count > 0 ? 4 : 0)}%` }}
                      transition={{ duration: MOTION_DURATION.verySlow, ease: MOTION_EASE.standard, delay: i * 0.08 }}
                      className={`w-full rounded-t-xl ${colors[i]} min-h-[4px]`}
                      style={{ maxHeight: `${barH - 40}px` }}
                    />
                    <span
                      className="text-text-secondary font-bold text-center leading-tight"
                      style={{ fontSize: barFont, marginTop: 4 }}
                    >
                      {band.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
