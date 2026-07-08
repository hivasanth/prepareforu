import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { Card } from './AntigravityCard'
import { Label } from './AntigravityTypography'
import { H3, Body } from './AntigravityTypography'

export const ScoreCard: React.FC<{ score: number; total?: number; label?: string; subtitle?: string; children?: React.ReactNode; className?: string }> = ({ score, total, label = 'Final Score', subtitle, children, className = '' }) => {
  const { isDark } = useTheme()
  return (
    <Card className={`flex flex-col items-center text-center p-6 md:p-8 lg:p-12 relative overflow-hidden ${className} ${!isDark ? 'ancient-card' : ''}`}>
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none ${!isDark ? 'bg-primary/10' : 'bg-primary/5'}`} />
      <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[28px] md:rounded-[36px] flex flex-col items-center justify-center text-white shadow-xl mb-3 md:mb-4 relative shrink-0 ${!isDark ? 'ancient-icon-badge shadow-primary/20' : 'bg-primary shadow-primary/20'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <Label className="text-white/70 text-[8px] md:text-[9px] mb-0">{label}</Label>
        <div className={`text-2xl sm:text-3xl md:text-4xl font-black leading-none ${!isDark ? 'text-amber-400' : ''}`}>{score}</div>
        {total && <div className="w-6 md:w-8 h-0.5 bg-white/30 rounded-full mt-1" />}
      </div>
      <H3 className={`mb-0.5 md:mb-1 text-[16px] md:text-[20px] font-black ${!isDark ? 'font-cinzel text-text-primary' : ''}`}>Assessment Finalized</H3>
      {subtitle && <p className={`text-[11px] md:text-[13px] text-text-secondary opacity-50 max-w-md mx-auto mb-4 md:mb-5 leading-relaxed font-bold ${!isDark ? 'font-garamond italic' : ''}`}>{subtitle}</p>}
      {children}
    </Card>
  )
}

export const ResultStatCard: React.FC<{ label: string; value: string | number; icon: LucideIcon; variant?: 'success' | 'danger' | 'warning' | 'primary' | 'default' }> = ({ label, value, icon: Icon, variant = 'default' }) => {
  const { isDark } = useTheme()
  const colors = {
    default: isDark ? 'bg-hover-bg text-text-secondary border-border-subtle' : 'ancient-card text-text-secondary',
    primary: isDark ? 'bg-primary/10 text-primary border-primary/20' : 'ancient-icon-badge !border-primary/30',
    success: isDark ? 'bg-success/10 text-success border-success/20' : 'ancient-icon-badge !bg-success/20 !border-success/30',
    danger:  isDark ? 'bg-danger/10 text-danger border-danger/20' : 'ancient-icon-badge !bg-danger/20 !border-danger/30',
    warning: isDark ? 'bg-warning/10 text-warning border-warning/20' : 'ancient-icon-badge !bg-warning/20 !border-warning/30',
  }
  return (
    <Card className={`flex items-center gap-6 group ancient-3d-lift ${!isDark ? 'ancient-card' : ''}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${colors[variant]}`}>
        <Icon size={28} />
      </div>
      <div>
        <Label className={`mb-1 ${!isDark ? 'font-cinzel text-[9px] tracking-widest' : ''}`}>{label}</Label>
        <div className={`text-3xl font-black text-text-primary leading-none tracking-tight ${!isDark ? 'font-cinzel' : ''}`}>{value}</div>
      </div>
    </Card>
  )
}

export const CTACard: React.FC<{ title: string; subtitle: string; icon: LucideIcon; onClick: () => void; badge?: string; className?: string }> = ({ title, subtitle, icon: Icon, onClick, badge, className = '' }) => {
  const { isDark } = useTheme()
  return (
    <button
      onClick={onClick}
      className={`w-full relative group overflow-hidden rounded-[24px] md:rounded-[32px] p-0.5 transition-all active:scale-[0.98] ${className}`}
    >
      <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-110 ${!isDark ? 'bg-primary' : 'bg-gradient-to-r from-primary via-primary-hover to-primary'}`} />
      <div className={`relative rounded-[18px] md:rounded-[24px] p-4 md:p-6 lg:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors group-hover:bg-transparent ${!isDark ? 'ancient-card' : 'bg-card-bg'}`}>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          {badge && <Label className={`mb-1.5 uppercase tracking-widest text-[9px] ${!isDark ? 'text-primary' : 'text-primary group-hover:text-white/60'}`}>{badge}</Label>}
          <H3 className={`transition-colors text-[16px] md:text-[18px] font-black group-hover:text-white ${!isDark ? 'font-cinzel text-text-primary' : ''}`}>{title}</H3>
          {subtitle && <Body className={`transition-colors mt-0.5 text-[12px] md:text-[13px] group-hover:text-white/80 ${!isDark ? 'font-garamond italic text-text-secondary' : ''}`}>{subtitle}</Body>}
        </div>
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center transition-all group-hover:translate-x-2 shrink-0 ${!isDark ? 'ancient-icon-badge group-hover:bg-white/20 group-hover:text-white' : 'bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white'}`}>
          <Icon size={20} md-size={24} />
        </div>
      </div>
    </button>
  )
}
