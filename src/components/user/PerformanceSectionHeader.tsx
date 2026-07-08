import { useTheme } from '../../context/ThemeContext'

interface PerformanceSectionHeaderProps {
  title: string
  subtitle: string
}

export function PerformanceSectionHeader({ title, subtitle }: PerformanceSectionHeaderProps) {
  const { isDark } = useTheme()

  return (
    <div>
      <h3 className={`text-[14px] lg:text-[16px] font-bold text-text-primary uppercase tracking-tight mb-1 m-0 ${!isDark ? 'font-cinzel' : ''}`}>
        {title}
      </h3>
      <p className={`text-[11px] text-text-secondary opacity-50 uppercase tracking-widest m-0 ${!isDark ? 'font-garamond italic' : ''}`}>
        {subtitle}
      </p>
    </div>
  )
}
