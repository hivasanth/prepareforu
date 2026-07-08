import { Zap, AlertTriangle, Brain } from 'lucide-react'
import { Card, useTheme } from '../common/AntigravityUI'
import { SubjectInsightItem } from './SubjectInsightItem'

interface SubjectStat {
  subject: string
  accuracy: number
  correct: number
  total: number
  status: string
  color: string
}

interface SubjectInsightsCardProps {
  subjectStats: SubjectStat[]
}

export function SubjectInsightsCard({ subjectStats }: SubjectInsightsCardProps) {
  const { isDark } = useTheme()

  return (
    <Card className="p-6 shadow-xl flex flex-col">
      <h3 className={`text-[14px] lg:text-[16px] font-bold text-text-primary uppercase tracking-tight mb-6 m-0 ${!isDark ? 'font-cinzel' : ''}`}>Subject Insights</h3>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-2 m-0">
            <Zap size={14} /> Strong Subjects
          </p>
          {subjectStats.filter(s => s.status === 'Strong').length > 0 ? (
            subjectStats.filter(s => s.status === 'Strong').slice(0, 3).map(s => (
              <SubjectInsightItem key={s.subject} label={s.subject} value={s.accuracy} color="success" />
            ))
          ) : (
            <p className="text-[11px] text-text-secondary opacity-40 italic m-0">Focus on subjects to reach 70%+</p>
          )}
        </div>

        <div className="h-px bg-border-subtle opacity-10" />

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-danger uppercase tracking-widest flex items-center gap-2 m-0">
            <AlertTriangle size={14} /> Needs Focus
          </p>
          {subjectStats.filter(s => s.status === 'Weak').length > 0 ? (
            subjectStats.filter(s => s.status === 'Weak').slice(0, 3).map(s => (
              <SubjectInsightItem key={s.subject} label={s.subject} value={s.accuracy} color="danger" />
            ))
          ) : (
            <p className="text-[11px] text-text-secondary opacity-40 italic m-0">No critical focus areas.</p>
          )}
        </div>
      </div>

      <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${!isDark ? 'ancient-icon-badge !bg-primary/10' : 'bg-primary/5 border border-primary/10'}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0 ${!isDark ? 'ancient-icon-badge' : 'bg-primary/10 text-primary'}`}>
          <Brain size={18} />
        </div>
        <p className={`text-[10px] lg:text-[11px] font-bold text-text-secondary leading-tight m-0 ${!isDark ? 'font-garamond italic' : ''}`}>Focus on weak areas daily to balance your overall score.</p>
      </div>
    </Card>
  )
}
