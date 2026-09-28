import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from './AntigravityCard'
import { Label } from './AntigravityTypography'
import { H3 } from './AntigravityTypography'
import { TRANSITION_INTERACTION } from './AntigravityMotion'

export const ScoreCard: React.FC<{ score: number; total?: number; label?: string; subtitle?: string; children?: React.ReactNode; className?: string }> = ({ score, total, label = 'Final Score', subtitle, children, className = '' }) => {
  return (
    <Card variant="premium-dark-neutral" className={`flex flex-col items-center text-center p-6 md:p-8 lg:p-12 ${className}`}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[28px] md:rounded-[36px] flex flex-col items-center justify-center text-white shadow-xl mb-3 md:mb-4 relative shrink-0 bg-primary shadow-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <Label className="text-white/70 text-[8px] md:text-[9px] mb-0">{label}</Label>
        <div className="text-2xl sm:text-3xl md:text-4xl font-black leading-none">{score}</div>
        {total && <div className="w-6 md:w-8 h-0.5 bg-white/30 rounded-full mt-1" />}
      </div>
      <H3 className="mb-0.5 md:mb-1 text-[16px] md:text-[20px] font-bold">Assessment Finalized</H3>
      {subtitle && <p className="text-[11px] md:text-[13px] text-text-secondary max-w-md mx-auto mb-4 md:mb-5 leading-relaxed font-bold">{subtitle}</p>}
      {children}
    </Card>
  )
}

export const ResultStatCard: React.FC<{ label: string; value: string | number; icon: LucideIcon; variant?: 'success' | 'danger' | 'default' }> = ({ label, value, icon: Icon, variant = 'default' }) => {
  const colors = {
    default: 'bg-hover-bg text-text-secondary border-border-subtle',
    success: 'bg-success/10 text-success border-success/20',
    danger:  'bg-danger/10 text-danger border-danger/20',
  }
  return (
    <Card variant="premium-dark-neutral" className="flex items-center gap-6 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${TRANSITION_INTERACTION} ${colors[variant]}`}>
        <Icon size={28} />
      </div>
      <div>
        <Label className="mb-1">{label}</Label>
        <div className="text-3xl font-black text-text-primary leading-none tracking-tight">{value}</div>
      </div>
    </Card>
  )
}


