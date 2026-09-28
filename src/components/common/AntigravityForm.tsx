import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Minus } from 'lucide-react'
import { TRANSITION_INTERACTION } from './AntigravityMotion'

/* ─── Input Component ──────────────────────────────────────────────────────
 * Design role:
 *   Standard text input field for all form contexts.
 *
 * Variants:
 *   default — Standard input (h-48px, 14px bold text, ancient-input material)
 *   compact — Smaller input (h-40px, 13px text) for dense admin config
 *   management — Neutral management surface (no gold light material)
 *
 * Surface tokens:
 *   --input-bg / --input-text / --input-border / --input-focus-border
 *   Field surface: bg-input-bg border border-input-border rounded-xl
 *
 * Use for:
 *   - Search fields
 *   - Text entry forms
 *   - Numeric question-count config (compact variant)
 *   - Admin form fields (management variant)
 *
 * Do not use for:
 *   - Card surfaces (use Card)
 *   - Selection containers (use SelectionContainer)
 *   - Error displays (use ErrorContainer)
 *   - Button actions (use Button)
 *
 * Theme: Light + Dark (ancient-input = gold material in light;
 *         management = neutral in both)
 * Consumers: 15+ files across admin/, user/, auth/
 * ────────────────────────────────────────────────────────────────────────── */
const FIELD_SURFACE = 'bg-input-bg light:bg-white border border-input-border rounded-xl text-input-text'
const FIELD_FOCUS = 'focus:border-input-focus-border'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: LucideIcon
  leftIcon?: LucideIcon
  onRightIconClick?: () => void
  /** Explicit accessible name for the right-icon action button (A11-2). Falls
   *  back to the icon's display name, then "Input action". */
  rightIconAriaLabel?: string
  /** DS-003: variant API. `default` (unchanged) | `compact` (smaller field) |
   *  `management` (Phase 3.9/D-144 — neutral Management Surface Family field;
   *  excludes `.ancient-input` so the light gold input material cannot override it). */
  variant?: 'default' | 'compact' | 'management'
}

export const Input: React.FC<InputProps> = ({
  rightIcon: RightIcon,
  leftIcon: LeftIcon,
  onRightIconClick,
  rightIconAriaLabel,
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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-interaction duration-fast ease-standard pointer-events-none">
          <LeftIcon size={18} />
        </div>
      )}
      <input
        className={`
          w-full ${heightCls} ${management ? '' : 'ancient-input'} ${surfaceCls}
          ${textCls} placeholder:text-text-placeholder placeholder:opacity-40 placeholder:font-medium
          focus:outline-none ${focusCls} ${TRANSITION_INTERACTION}
          ${paddingCls}
          ${className}
        `}
        {...props}
      />
      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          aria-label={rightIconAriaLabel || RightIcon.displayName || 'Input action'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-text-secondary/40 hover:text-primary transition-interaction duration-fast ease-standard"
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
        focus:outline-none ${focusCls} ${TRANSITION_INTERACTION} leading-relaxed
        ${paddingCls}
        ${className}
      `}
      {...props}
    />
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  /** Forwarded to the switch button so an external <Label htmlFor> can name it. */
  id?: string
  /** Accessible name when no visible label pairing exists. */
  'aria-label'?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${className} ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <span className="text-[13px] font-bold text-text-primary uppercase tracking-tight">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        /* D-1: the button must always carry an accessible name. When the caller
         * supplies a visible label but no aria-label, the label text names the
         * control so screen readers announce it (the visible label span is a
         * sibling, not an associated <label>, so aria-label is the contract). */
        aria-label={ariaLabel ?? label}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent 
          ${TRANSITION_INTERACTION} duration-slow ease-standard focus:outline-none
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'}
          ${checked ? 'bg-primary' : 'bg-hover-bg light:bg-white'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-elevation-1 ring-0 
            transition-transform duration-slow ease-emphasized
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
          w-5 h-5 rounded-md border-2 ${TRANSITION_INTERACTION}
          flex items-center justify-center
          ${isChecked
            ? 'bg-checkbox-surface-checked border-checkbox-border-checked shadow-elevation-2 shadow-primary/30'
            : 'bg-checkbox-surface light:bg-white border-checkbox-border'
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
          w-5 h-5 rounded-full border-2 ${TRANSITION_INTERACTION}
          flex items-center justify-center
          ${checked
            ? 'border-radio-border-checked'
            : 'border-radio-border bg-radio-surface light:bg-white'
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
        className="flex gap-1 p-1 bg-radio-track-surface light:bg-white rounded-xl border border-border-subtle"
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
                flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider ${TRANSITION_INTERACTION} cursor-pointer
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
