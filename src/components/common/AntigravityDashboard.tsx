import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, FileText } from 'lucide-react'
import { Card } from './AntigravityCard'
import { Badge } from './AntigravityData'
import { Button } from './AntigravityButton'
import { Body } from './AntigravityTypography'
import { PremiumIconContainer } from './PremiumIconContainer'

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
    <Card variant="premium-dark-neutral" className="flex flex-col gap-4 group h-full !p-5 md:!p-6" role="article" aria-label={title}>
      <div className="flex justify-between items-start">
        <PremiumIconContainer
          icon={Icon ?? FileText}
          iconSize={24}
          className="w-12 h-12 rounded-[14px]"
          darkClassName={disabled ? 'bg-hover-bg text-text-secondary' : 'bg-primary/10 text-primary lg:group-hover:bg-primary lg:group-hover:text-white'}
        />
        {status && <Badge variant={disabled ? 'default' : 'primary'}>{status}</Badge>}
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <Body className={`!text-[13px] md:!text-[14px] font-bold mt-2 !leading-tight uppercase tracking-tight line-clamp-2 transition-colors ${!disabled && 'lg:group-hover:text-primary'}`}>
          {title}
        </Body>
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
        >
          <span>{disabled ? (disabledMessage || 'Not Available') : 'Start Practice'}</span>
          {!disabled && <ArrowRight size={16} />}
        </Button>
      </div>
    </Card>
  )
}
