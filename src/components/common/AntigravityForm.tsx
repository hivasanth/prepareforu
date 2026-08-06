import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Check, Minus } from 'lucide-react'

/* Shared Input-role surface (P1 A-5 L-2): single source of truth for the field
   language used by Input / TextArea / Select. */
const FIELD_SURFACE = 'bg-input-bg border border-input-border rounded-xl text-input-text'
const FIELD_FOCUS = 'focus:border-input-focus-border'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: LucideIcon
  leftIcon?: LucideIcon
  onRightIconClick?: () => void
  /** DS-003: variant API. `default` (unchanged) | `compact` (smaller field) |
   *  `management` (Phase 3.9/D-144 — neutral Management Surface Family field;
   *  excludes `.ancient-input` so the light gold input material cannot override it). */
  variant?: 'default' | 'compact' | 'management'
}

export const Input: React.FC<InputProps> = ({
  rightIcon: RightIcon,
  leftIcon: LeftIcon,
  onRightIconClick,
  variant = 'default',
  className = '',
  ...props
}) => {
  const compact = variant === 'compact'
  const management = variant === 'management'
  const heightCls = compact ? 'h-[var(--material-input-compact-height)]' : 'h-[48px]'
  const textCls = compact ? 'text-[var(--material-input-compact-text)]' : 'text-[14px] font-bold'
  const paddingCls = compact
    ? `${LeftIcon ? 'pl-10' : 'px-[var(--material-input-compact-padding)]'} ${RightIcon ? 'pr-10' : 'pr-[var(--material-input-compact-padding)]'}`
    : `${LeftIcon ? 'pl-11' : 'px-4'} ${RightIcon ? 'pr-12' : 'pr-4'}`
  const focusCls = management
    ? 'focus:border-[var(--management-accent)]'
    : FIELD_FOCUS
  const surfaceCls = management
    ? 'bg-[var(--management-surface)] border border-[var(--management-border)] rounded-xl text-text-primary'
    : FIELD_SURFACE

  return (
    <div className="relative group">
      {LeftIcon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors pointer-events-none">
          <LeftIcon size={18} />
        </div>
      )}
      <input
        className={`
          w-full ${heightCls} ${management ? '' : 'ancient-input'} ${surfaceCls}
          ${textCls} placeholder:text-text-placeholder placeholder:opacity-40 placeholder:font-medium
          focus:outline-none ${focusCls} transition-all
          ${paddingCls}
          ${className}
        `}
        {...props}
      />
      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          aria-label={RightIcon.displayName || 'Input action'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-text-secondary/40 hover:text-primary transition-colors"
        >
          <RightIcon size={18} />
        </button>
      )}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** DS-003 variant API. `default` (unchanged) | `compact` (denser field) |
   *  `management` (Phase 4.1A/D-149 — neutral Management Surface Family field;
   *  excludes `.ancient-textarea` so the light gold textarea material cannot override it). */
  variant?: 'default' | 'compact' | 'management'
}

export const TextArea: React.FC<TextAreaProps> = ({
  variant = 'default',
  className = '',
  ...props
}) => {
  const compact = variant === 'compact'
  const management = variant === 'management'
  const paddingCls = compact ? 'p-3' : 'px-4 py-3'
  const surfaceCls = management
    ? 'bg-[var(--management-surface)] border border-[var(--management-border)] rounded-xl text-text-primary'
    : FIELD_SURFACE
  const focusCls = management
    ? 'focus:border-[var(--management-accent)]'
    : FIELD_FOCUS

  return (
    <textarea
      className={`
        w-full ${management ? '' : 'ancient-textarea'} resize-none ${surfaceCls}
        text-[14px] font-bold placeholder:text-text-placeholder placeholder:opacity-40 placeholder:font-medium
        focus:outline-none ${focusCls} transition-all leading-relaxed
        ${paddingCls}
        ${className}
      `}
      {...props}
    />
  )
}

interface SelectOption {
  id: string
  name: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string
  icon?: LucideIcon
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
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
  id: providedId,
  ...props
}) => {
  const selectId = providedId || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={'text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1'}>
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
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          {...props}
          className={`
            w-full h-[48px] ancient-select transition-all appearance-none cursor-pointer
            text-[12px] font-bold uppercase tracking-wide
            focus:outline-none pr-10
            ${Icon ? 'pl-11' : 'pl-4'}
            ${FIELD_SURFACE} ${FIELD_FOCUS}
          `}
        >
          {placeholder && <option value="" className={'bg-input-bg text-input-text'}>{placeholder}</option>}
          {options.map((opt, idx) => (
            <option key={`${opt.id}-${idx}`} value={String(opt.id)} className={'bg-input-bg text-input-text'}>
              {opt.name}
            </option>
          ))}
        </select>
        <div className={'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity text-text-muted'}>
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
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-300 ease-in-out focus:outline-none
          ${checked ? 'bg-primary' : 'bg-hover-bg'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-elevation-1 ring-0 
            transition duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)
            bg-white
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}

// --- DS-013: Checkbox Component ---

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  /** Accessible name for the sr-only input (bare checkbox usage, e.g. DataGrid). */
  ariaLabel?: string
  /** Additive: render a minus glyph for a partially-selected state (DataGrid
      select-all). Styled as checked. No effect when false. */
  indeterminate?: boolean
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ariaLabel,
  indeterminate = false,
}) => {
  const isChecked = checked || indeterminate

  return (
    <label
      className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
          className="sr-only peer"
        />
        <div className={`
          w-5 h-5 rounded-md border-2 transition-all duration-200
          flex items-center justify-center
          ${isChecked
            ? 'bg-checkbox-surface-checked border-checkbox-border-checked shadow-elevation-2 shadow-primary/30'
            : 'bg-checkbox-surface border-checkbox-border'
          }
          peer-focus:ring-4 peer-focus:ring-primary/25 peer-focus:border-checkbox-border-focus
          peer-hover:border-checkbox-border-hover
        `}>
          {isChecked && (
            indeterminate
              ? <Minus size={13} className="text-white" strokeWidth={3} />
              : <Check size={13} className="text-white" strokeWidth={3} />
          )}
        </div>
      </div>
      {label && (
        <span className="text-[13px] font-bold text-text-primary">{label}</span>
      )}
    </label>
  )
}

// --- DS-013: Radio Component ---

interface RadioProps {
  checked: boolean
  onChange: () => void
  label?: string
  disabled?: boolean
  className?: string
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="relative">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`
          w-5 h-5 rounded-full border-2 transition-all duration-200
          flex items-center justify-center
          ${checked
            ? 'border-radio-border-checked'
            : 'border-radio-border bg-radio-surface'
          }
          peer-focus:ring-2 peer-focus:ring-primary/30
          peer-hover:border-radio-border-hover
        `}>
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-radio-dot-checked" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-[13px] font-bold text-text-primary">{label}</span>
      )}
    </label>
  )
}

// --- DS-013: RadioGroup Component (Segmented Button Pattern) ---

interface RadioGroupOption<T extends string> {
  value: T
  label: string
}

interface RadioGroupProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: RadioGroupOption<T>[]
  label?: string
  disabled?: boolean
  className?: string
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled = false,
  className = '',
}: RadioGroupProps<T>) {
  return (
    <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {label && (
        <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
          {label}
        </span>
      )}
      <div
        className="flex gap-1 p-1 bg-radio-track-surface rounded-xl border border-border-subtle"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={`
                flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary bg-transparent'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
