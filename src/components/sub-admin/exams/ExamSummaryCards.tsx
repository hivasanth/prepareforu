import { Card, SectionHeader } from '../../../components/common/AntigravityUI'
import { useExamResponsive } from './useExamResponsive'
import { formatNumber, formatDurationShort } from '../../../utils/timeUtils'
import { Target, Users, BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface ExamSummaryCardsProps {
  summaryStats: { total: number; avg: number; hi: number; lo: number; avgTime: number } | null
  totalMarks: number
}

export function ExamSummaryCards({ summaryStats, totalMarks }: ExamSummaryCardsProps) {
  const {
    layout: { summaryGridCols, cardH, cardPad },
    typography: { cardLbl, cardVal },
  } = useExamResponsive()

  const ss = summaryStats
  const tm = totalMarks ?? 0
  const cards = [
    { icon: <Users size={16} />,       label: 'Total Students',  value: ss?.total.toString() ?? '0',                              color: 'text-primary' },
    { icon: <BarChart3 size={16} />,   label: 'Average Score',   value: `${formatNumber(ss?.avg ?? 0)} / ${tm}`,                             color: 'text-blue-400' },
    { icon: <TrendingUp size={16} />,  label: 'Highest Score',   value: `${ss?.hi ?? 0} / ${tm}`,                                  color: 'text-green-500' },
    { icon: <TrendingDown size={16} />,label: 'Lowest Score',    value: `${ss?.lo ?? 0} / ${tm}`,                                  color: 'text-red-400' },
    { icon: <Clock size={16} />,       label: 'Avg Time Taken',  value: formatDurationShort(Math.round(ss?.avgTime ?? 0)),                     color: 'text-amber-400' },
  ]

  return (
    <section aria-label="Exam summary overview">
      <SectionHeader title="Overview" icon={Target} />
      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: summaryGridCols }}>
        {cards.map((card, i) => (
          <Card
            key={i}
            variant="default"
            className="flex flex-col justify-between border-border-subtle/20"
            style={{ minHeight: cardH, padding: cardPad }}
          >
            <div className={`flex items-center gap-1.5 ${card.color} opacity-70`}>
              {card.icon}
              <span className="font-bold uppercase tracking-widest truncate" style={{ fontSize: cardLbl }}>
                {card.label}
              </span>
            </div>
            <span className="font-black text-text-primary leading-none" style={{ fontSize: cardVal }}>
              {card.value}
            </span>
          </Card>
        ))}
      </div>
    </section>
  )
}
