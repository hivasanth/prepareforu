import React from 'react'
import { useTheme } from '../../context/ThemeContext'

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  section: '32px',
}

export const H1: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-[22px] md:text-[26px] lg:text-[30px] font-black text-text-primary tracking-tight m-0 ${className}`}>
    {children}
  </h1>
)

export const H2: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-[18px] md:text-[20px] font-bold text-text-primary tracking-tight m-0 ${className}`}>
    {children}
  </h2>
)

export const H3: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-[14px] md:text-[15px] font-semibold text-text-primary tracking-tight m-0 ${className}`}>
    {children}
  </h3>
)

export const Body: React.FC<{ children: React.ReactNode; className?: string; secondary?: boolean }> = ({ children, className = '', secondary = false }) => (
  <p className={`text-[13px] md:text-[14px] font-medium leading-relaxed m-0 ${secondary ? 'text-text-secondary opacity-70' : 'text-text-primary'} ${className}`}>
    {children}
  </p>
)

interface LabelProps {
  children: React.ReactNode
  className?: string
  error?: boolean
  htmlFor?: string
}

export const Label: React.FC<LabelProps> = ({ children, className = '', error = false, htmlFor }) => {
  const { isDark } = useTheme()
  return (
    <label htmlFor={htmlFor} className={`text-[10px] font-bold uppercase tracking-widest ${error ? 'text-danger' : (isDark ? 'text-text-secondary opacity-60' : 'text-text-secondary opacity-95')} ${className}`}>
      {children}
    </label>
  )
}
