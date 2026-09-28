import { Globe, Languages } from 'lucide-react'
import { TRANSITION_INTERACTION, FOCUS_RING } from './AntigravityMotion'

interface BilingualToggleProps {
  displayLang: 'en' | 'te';
  onChange: (lang: 'en' | 'te') => void;
  className?: string;
  shortLabels?: boolean;
  /** Shows just 'en' / 'te' text, no icons */
  minimal?: boolean;
  /** @deprecated No longer used internally — kept for page-level backward compatibility */
  showShadow?: boolean;
  fill?: boolean;
  /** Accessible name for the radiogroup. Defaults to "Language". */
  ariaLabel?: string;
}

export function BilingualToggle({
  displayLang,
  onChange,
  className = '',
  shortLabels = false,
  minimal = false,
  fill = false,
  ariaLabel = 'Language',
}: BilingualToggleProps) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl ${TRANSITION_INTERACTION} bg-hover-bg/30 ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {(['en', 'te'] as const).map(l => {
        const isActive = displayLang === l
        return (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`flex items-center gap-1 px-3 py-3 rounded-lg text-[11px] font-bold ${TRANSITION_INTERACTION} ${FOCUS_RING} cursor-pointer ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-option-surface text-text-secondary lg:hover:text-text-primary'
            } ${fill ? 'flex-1 justify-center' : ''}`}
            role="radio"
            aria-checked={isActive}
          >
            {!minimal && (l === 'en' ? <Globe size={12} /> : <Languages size={12} />)}
            {minimal ? l : (l === 'en' ? (shortLabels ? 'EN' : 'English') : (shortLabels ? 'TE' : 'Telugu'))}
          </button>
        )
      })}
    </div>
  );
}
