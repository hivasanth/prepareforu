import { ProgressBar, useTheme } from '../common/AntigravityUI'

interface SubjectInsightItemProps {
  label: string;
  value: number;
  color: 'success' | 'danger';
}

export const SubjectInsightItem = ({ label, value, color }: SubjectInsightItemProps) => {
  const { isDark } = useTheme();
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[11px] font-bold text-text-primary uppercase tracking-tight truncate max-w-[80%] ${!isDark ? 'font-cinzel text-[10px]' : ''}`}>{label}</span>
        <span className={`text-[11px] font-bold ${color === 'success' ? 'text-success' : 'text-danger'} ${!isDark ? 'font-cinzel' : ''}`}>{value}%</span>
      </div>
      <ProgressBar value={value} color={color} />
    </div>
  );
};
