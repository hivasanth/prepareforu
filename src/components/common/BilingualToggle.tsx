import { Globe, Languages } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface BilingualToggleProps {
  displayLang: 'en' | 'te';
  onChange: (lang: 'en' | 'te') => void;
  className?: string;
  shortLabels?: boolean;
  showShadow?: boolean;
  fill?: boolean;
}

export function BilingualToggle({
  displayLang,
  onChange,
  className = '',
  shortLabels = false,
  showShadow = false,
  fill = false,
}: BilingualToggleProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl transition-all ${
        !isDark
          ? 'bg-[#F5EAD4] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10]'
          : 'bg-hover-bg/30'
      } ${className}`}
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
                ? !isDark
                  ? 'bg-primary border-[1.5px] border-[#A87828] text-white shadow-[1px_1px_0px_#8B5A10]'
                  : 'bg-primary text-white shadow-sm'
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
