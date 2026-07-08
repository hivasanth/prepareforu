import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  fullWidth?: boolean
  loading?: boolean
}

const variants = {
  primary:   'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30',
  secondary: 'bg-hover-bg text-text-primary border border-border-subtle hover:bg-hover-bg/80',
  success:   'bg-success text-white shadow-lg shadow-success/20 hover:shadow-success/30',
  danger:    'bg-danger text-white shadow-lg shadow-danger/20 hover:shadow-danger/30',
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: props.disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      className={`
        h-[48px] px-6 rounded-[14px] font-bold text-[13px] uppercase tracking-wider
        flex items-center justify-center gap-2 transition-all duration-200
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${props.disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  )
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Button
      className={`h-[48px] px-8 text-[14px] font-bold rounded-[14px] w-full sm:w-auto sm:min-w-[320px] md:min-w-[400px] lg:min-w-[480px] max-w-full ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}

interface IconButtonProps extends HTMLMotionProps<'button'> {
  loading?: boolean
  size?: 'sm' | 'md'
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  loading = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'w-[36px] h-[36px] rounded-[10px]',
    md: 'w-[44px] h-[44px] rounded-[12px]'
  }

  return (
    <motion.button
      whileHover={{ scale: props.disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled || loading ? 1 : 0.95 }}
      className={`
        ${sizes[size]} bg-primary/10 text-primary
        flex items-center justify-center flex-shrink-0
        hover:bg-primary hover:text-white transition-all
        ${props.disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  )
}
