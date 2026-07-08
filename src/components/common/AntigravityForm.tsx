import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: LucideIcon
  leftIcon?: LucideIcon
  onRightIconClick?: () => void
}

export const Input: React.FC<InputProps> = ({ rightIcon: RightIcon, leftIcon: LeftIcon, onRightIconClick, className = '', ...props }) => {
  return (
    <div className="relative group">
      {LeftIcon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors pointer-events-none">
          <LeftIcon size={18} />
        </div>
      )}
      <input
        className={`
          w-full h-[48px] bg-hover-bg border border-border-subtle rounded-[12px]
          text-[14px] font-bold text-text-primary placeholder:text-text-secondary placeholder:opacity-40 placeholder:font-medium
          focus:outline-none focus:border-primary transition-all
          ${LeftIcon ? 'pl-11' : 'px-4'}
          ${RightIcon ? 'pr-12' : 'pr-4'}
          ${className}
        `}
        {...props}
      />
      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary/40 hover:text-primary transition-colors"
        >
          <RightIcon size={18} />
        </button>
      )}
    </div>
  )
}

interface SelectOption {
  id: string
  name: string
}

interface SelectProps {
  label?: string
  icon?: LucideIcon
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}>
      {label && (
        <label className={'text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1'}>
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className={'absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 text-text-secondary group-focus-within:text-primary'}>
            <Icon size={16} />
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full h-[48px] border transition-all appearance-none cursor-pointer
            text-[12px] font-bold uppercase tracking-wide
            focus:outline-none pr-10
            ${Icon ? 'pl-11' : 'pl-4'}
            bg-hover-bg border-border-subtle rounded-[12px] text-text-primary focus:border-primary
            ${className}
          `}
        >
          {placeholder && <option value="" className={'bg-card-bg text-text-primary'}>{placeholder}</option>}
          {options.map((opt, idx) => (
            <option key={`${opt.id}-${idx}`} value={String(opt.id)} className={'bg-card-bg text-text-primary'}>
              {opt.name}
            </option>
          ))}
        </select>
        <div className={'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity text-text-secondary opacity-40'}>
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <span className="text-[13px] font-bold text-text-primary uppercase tracking-tight">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-300 ease-in-out focus:outline-none
          ${checked ? 'bg-primary' : 'bg-hover-bg'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 
            transition duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)
            bg-white
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}
