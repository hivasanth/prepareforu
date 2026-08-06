import { memo } from 'react'
import { Checkbox } from './AntigravityForm'

interface SelectionCheckboxProps {
  checked: boolean
  onChange: () => void
  /** Screen-reader-only label — the box itself is the visible affordance. */
  label?: string
  className?: string
}

/**
 * SelectionCheckbox — reusable row-selection checkbox for management
 * collections (Questions, Users, Students, Leaderboard, Topics, Exams).
 * Wraps the certified `Checkbox` (square, premium border/hover/focus, centered
 * white checkmark) and hides the label visually while keeping it in the
 * accessibility tree. Presentation only — selection state stays in the page.
 */
export const SelectionCheckbox = memo(function SelectionCheckbox({ checked, onChange, label, className = '' }: SelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      label={label}
      className={`[&>span]:sr-only ${className}`}
    />
  )
})
