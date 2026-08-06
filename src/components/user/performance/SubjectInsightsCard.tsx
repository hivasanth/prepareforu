import { memo } from 'react'
import { Zap, AlertTriangle, Brain } from 'lucide-react'
import { Card, IconBadge, useTheme } from '../../common/AntigravityUI'
import { H3, Body, Label } from '../../common/AntigravityTypography'
import { SubjectInsightItem } from './SubjectInsightItem'
import type { SubjectStat } from '../../../services/performanceService'

interface SubjectInsightsCardProps {
  subjectStats: SubjectStat[]
}

export const SubjectInsightsCard = memo(function SubjectInsightsCard({ subjectStats }: SubjectInsightsCardProps) {
  const { isDark } = useTheme()

  return (
    <Card variant="premium-neutral" padding={24} className="flex flex-col">
      <H3 className={`uppercase tracking-tight mb-6 ${!isDark ? 'font-cinzel' : ''}`}>Subject Insights</H3>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
        <div className="space-y-3">
          <Label className="text-success flex items-center gap-2">
            <Zap size={14} /> Strong Subjects
          </Label>
          {subjectStats.filter(s => s.status === 'Strong').length > 0 ? (
            subjectStats.filter(s => s.status === 'Strong').slice(0, 3).map(s => (
              <SubjectInsightItem key={s.subject} label={s.subject} value={s.accuracy} color="success" />
            ))
          ) : (
            <Body className="text-[11px] text-text-muted italic m-0">Focus on subjects to reach 70%+.</Body>
          )}
        </div>

        <div className="h-px bg-border-subtle opacity-10" />

        <div className="space-y-3">
          <Label className="text-danger flex items-center gap-2">
            <AlertTriangle size={14} /> Needs Focus
          </Label>
          {subjectStats.filter(s => s.status === 'Weak').length > 0 ? (
            subjectStats.filter(s => s.status === 'Weak').slice(0, 3).map(s => (
              <SubjectInsightItem key={s.subject} label={s.subject} value={s.accuracy} color="danger" />
            ))
          ) : (
            <Body className="text-[11px] text-text-muted italic m-0">No critical focus areas.</Body>
          )}
        </div>
      </div>

        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${!isDark ? 'ancient-icon-badge !bg-primary/10' : 'bg-primary/5 border border-primary/10'}`}>
        <IconBadge icon={Brain} size="xl" status="primary" />
        <Body className={`text-[10px] lg:text-[11px] font-bold text-text-secondary leading-tight ${!isDark ? 'font-garamond italic' : ''}`} secondary>Focus on weak areas daily to balance your overall score.</Body>
      </div>
    </Card>
  )
})
