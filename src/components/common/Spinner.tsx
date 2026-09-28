import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerVariant = 'primary' | 'current'

interface SpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

const variantClasses: Record<SpinnerVariant, string> = {
  primary: 'border-primary/20 border-t-primary',
  current: 'border-current border-t-transparent',
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`rounded-full animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    />
  )
}
