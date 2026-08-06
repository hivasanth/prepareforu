import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type AlertVariant = 'info' | 'success' | 'error' | 'warning'

interface AlertProps {
  variant?: AlertVariant
  icon?: LucideIcon
  title?: string
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
}

const iconWrapClasses: Record<AlertVariant, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  icon: Icon,
  title,
  children,
  className = '',
}) => {
  const hasTitle = Boolean(title)
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`
        flex items-start gap-2.5 rounded-[14px] border px-4 py-3
        text-[13px] font-medium leading-relaxed
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {Icon && (
        <span className={`mt-0.5 shrink-0 ${iconWrapClasses[variant]}`}>
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {hasTitle && (
          <p className="font-bold uppercase tracking-wide text-[11px] mb-0.5">
            {title}
          </p>
        )}
        <div>{children}</div>
      </div>
    </div>
  )
}
