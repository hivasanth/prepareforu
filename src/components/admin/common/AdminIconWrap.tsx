import type { ReactNode } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface AdminIconWrapProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'md' | 'lg' | 'full'
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14',
}

const roundedMap = {
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
}

export function AdminIconWrap({
  children,
  className = '',
  size = 'md',
  rounded = 'lg',
}: AdminIconWrapProps) {
  const { isDark } = useTheme()

  return (
    <div
      className={`${sizeMap[size]} ${roundedMap[rounded]} flex items-center justify-center font-black flex-shrink-0 ${
        !isDark ? 'ancient-icon-badge' : 'bg-primary/10 text-primary'
      } ${className}`}
    >
      {children}
    </div>
  )
}
