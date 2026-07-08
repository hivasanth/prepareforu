import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, FileText } from 'lucide-react'
import { Card } from './AntigravityCard'
import { Badge } from './AntigravityData'
import { Button } from './AntigravityButton'
import { Body } from './AntigravityTypography'

export const ActivityCard: React.FC<{
  icon: LucideIcon
  title: string
  subtitle: string
  value: string|number
  unit?: string
  onClick?: () => void
}> = ({
  icon: Icon,
  title,
  subtitle,
  value,
  unit = 'PTS',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        min-h-[64px] px-4 py-4 rounded-[14px] shadow-sm flex items-center justify-between gap-4
        border transition-all cursor-pointer group
        bg-card-bg border-border-subtle/50 hover:bg-hover-bg/40
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all shrink-0 bg-hover-bg text-text-secondary lg:group-hover:bg-primary lg:group-hover:text-white">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] md:text-[15px] font-bold text-text-primary leading-tight m-0 truncate">{title}</p>
          <p className="text-[12px] text-text-secondary m-0 opacity-60 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="text-right flex-shrink-0 flex flex-col items-end">
        <p className="text-[16px] font-black text-text-primary m-0 leading-none">{value}</p>
        <p className="text-[10px] text-text-secondary uppercase m-0 font-bold tracking-widest opacity-40">{unit}</p>
      </div>
    </div>
  )
}

export const ExamCard: React.FC<{
  title: string
  description?: string
  children?: React.ReactNode
  icon?: LucideIcon
  status?: string
  onClick?: () => void
  isStarting?: boolean
  disabled?: boolean
  disabledMessage?: string
}> = ({
  title,
  description,
  children,
  icon: Icon,
  status,
  onClick,
  isStarting,
  disabled,
  disabledMessage
}) => {
  return (
    <Card className={`flex flex-col gap-4 group h-full !p-5 md:!p-6 ${disabled ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 ${disabled ? 'bg-hover-bg text-text-secondary' : 'bg-primary/10 text-primary lg:group-hover:bg-primary lg:group-hover:text-white'}`}>
          {Icon ? <Icon size={24} /> : <FileText size={24} />}
        </div>
        {status && <Badge variant={disabled ? 'default' : 'primary'}>{status}</Badge>}
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <p className={`!text-[13px] md:!text-[14px] font-black mt-2 m-0 transition-colors !leading-tight uppercase tracking-tight ${!disabled && 'lg:group-hover:text-primary text-text-primary'}`}>
          {title}
        </p>
        {description && <Body secondary className="line-clamp-2">{description}</Body>}
        {children && (
          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            {children}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle/30">
        <Button
          variant={disabled ? "secondary" : "primary"}
          fullWidth
          onClick={disabled ? undefined : onClick}
          loading={isStarting}
          disabled={disabled}
          className="!h-[44px]"
        >
          <span>{disabled ? (disabledMessage || 'Not Available') : 'Start Practice'}</span>
          {!disabled && <ArrowRight size={16} />}
        </Button>
      </div>
    </Card>
  )
}
