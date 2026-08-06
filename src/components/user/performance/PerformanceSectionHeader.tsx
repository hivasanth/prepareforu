import { H3, Body } from '../../common/AntigravityTypography'
import { useTheme } from '../../../context/ThemeContext'

interface PerformanceSectionHeaderProps {
  title: string
  subtitle: string
}

export function PerformanceSectionHeader({ title, subtitle }: PerformanceSectionHeaderProps) {
  const { isDark } = useTheme()

  return (
    <div>
      <H3 className={`uppercase tracking-tight mb-1 ${!isDark ? 'font-cinzel' : ''}`}>
        {title}
      </H3>
      <Body className={`text-[11px] text-text-muted uppercase tracking-widest ${!isDark ? 'font-garamond italic' : ''}`} secondary>
        {subtitle}
      </Body>
    </div>
  )
}
