import React from 'react'
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DOMPurify from 'dompurify'
import { Card } from './AntigravityCard'
import { IconBadge } from './IconBadge'

export const QuestionCard: React.FC<{ number: number; question: string; children: React.ReactNode; status?: 'correct' | 'wrong' | 'skipped' }> = ({ number, question, children, status }) => {
  const statusConfig = {
    correct: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5' },
    wrong: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/5' },
    skipped: { icon: AlertCircle, color: 'text-text-secondary', bg: 'bg-hover-bg' }
  }
  const config = status ? statusConfig[status] : { icon: HelpCircle, color: 'text-primary', bg: 'bg-primary/5' }

  return (
    <Card className="p-8 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className={`w-14 h-14 rounded-[18px] flex-shrink-0 flex items-center justify-center font-black text-[20px] border shadow-sm border-border-subtle ${config.bg} ${config.color}`}>
          {number}
        </div>
        <div className="flex-1 space-y-8">
          <div className="text-[18px] md:text-[20px] font-semibold text-text-primary leading-relaxed exam-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question) }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
          </div>
        </div>
      </div>
    </Card>
  )
}

export const QuestionOption: React.FC<{ label: string; text: string; isCorrect?: boolean; isSelected?: boolean }> = ({ label, text, isCorrect, isSelected }) => {
  const isUserCorrect = isCorrect && isSelected
  const isUserWrong   = !isCorrect && isSelected
  const isJustCorrect = isCorrect && !isSelected

  const stateClass =
    isUserCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
    : isJustCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
    : isUserWrong   ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
    : 'bg-hover-bg/40 border-border-subtle/50 text-text-secondary'

  return (
    <div className={`p-4 rounded-[16px] border-2 transition-all flex items-start gap-4 text-[15px] font-medium leading-relaxed ${stateClass}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[13px] shrink-0 mt-0.5
        ${isCorrect || isSelected
          ? 'bg-white/25 text-white'
          : 'bg-primary/15 text-primary'
        }`}>
        {label}
      </div>

      <span
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
        className="exam-content flex-1 leading-relaxed"
      />

      <div className="ml-auto shrink-0 flex flex-col items-end gap-1 mt-0.5">
        {isCorrect && (
          <CheckCircle2 size={20} className="opacity-90" />
        )}
        {isUserWrong && (
          <XCircle size={20} className="opacity-90" />
        )}
        {isSelected && (
          <span className="text-[9px] font-black uppercase tracking-widest opacity-80 whitespace-nowrap">
            Your Answer
          </span>
        )}
      </div>
    </div>
  )
}

export const InsightCard: React.FC<{ title: string; children: React.ReactNode; icon: LucideIcon; variant?: 'success' | 'danger' | 'warning' | 'default' }> = ({ title, children, icon: Icon, variant = 'default' }) => {
  const variants: Record<string, string> = {
    default: 'border-primary/10 bg-primary/5 text-primary',
    success: 'border-success/20 bg-success/5 text-success',
    danger:  'border-danger/20 bg-danger/5 text-danger',
    warning: 'border-warning/20 bg-warning/5 text-warning',
  }
  const iconClasses: Record<string, string> = {
    default: 'rounded-xl bg-primary/10 text-primary',
    success: 'rounded-xl bg-success/10 text-success',
    danger: 'rounded-xl bg-danger/10 text-danger',
    warning: 'rounded-xl bg-warning/10 text-warning',
  }
  return (
    <div className={`p-4 rounded-[14px] border flex gap-3 ${variants[variant]}`}>
      <IconBadge icon={Icon} size="lg" darkClassName={iconClasses[variant]} />
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-current uppercase tracking-widest">{title}</span>
        <p className="text-[13px] font-bold text-current leading-relaxed m-0">{children}</p>
      </div>
    </div>
  )
}
