import { memo } from 'react'
import { ProgressBar, useTheme } from '../../common/AntigravityUI'
import { Label } from '../../common/AntigravityTypography'

interface SubjectInsightItemProps {
  label: string;
  value: number;
  color: 'success' | 'danger';
}

export const SubjectInsightItem = memo(function SubjectInsightItem({ label, value, color }: SubjectInsightItemProps) {
  const { isDark } = useTheme();
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <Label className={`text-[10px] lg:text-[11px] font-bold text-text-primary uppercase tracking-tight truncate max-w-[80%] m-0 ${!isDark ? 'font-cinzel' : ''}`}>{label}</Label>
        <Label className={`text-[10px] lg:text-[11px] font-bold m-0 ${color === 'success' ? 'text-success' : 'text-danger'} ${!isDark ? 'font-cinzel' : ''}`}>{value}%</Label>
      </div>
      <ProgressBar value={value} color={color} />
    </div>
  );
})
