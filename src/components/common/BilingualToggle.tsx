import { Globe, Languages } from 'lucide-react'

interface BilingualToggleProps {
  displayLang: 'en' | 'te';
  onChange: (lang: 'en' | 'te') => void;
  className?: string;
  shortLabels?: boolean;
  /** @deprecated No longer used internally — kept for page-level backward compatibility */
  showShadow?: boolean;
  fill?: boolean;
}

export function BilingualToggle({
  displayLang,
  onChange,
  className = '',
  shortLabels = false,
  fill = false,
}: BilingualToggleProps) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl transition-all bg-hover-bg/30 ${className}`}
      role="radiogroup"
      aria-label="Language"
    >
      {(['en', 'te'] as const).map(l => {
        const isActive = displayLang === l
        return (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary lg:hover:text-text-primary'
            } ${fill ? 'flex-1 justify-center' : ''}`}
            role="radio"
            aria-checked={isActive}
          >
            {l === 'en' ? <Globe size={12} /> : <Languages size={12} />}
            {l === 'en' ? (shortLabels ? 'EN' : 'English') : (shortLabels ? 'TE' : 'Telugu')}
          </button>
        )
      })}
    </div>
  );
}
