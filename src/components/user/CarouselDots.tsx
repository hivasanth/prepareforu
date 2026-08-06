import { useTheme } from '../../context/ThemeContext'

interface CarouselDotsProps {
  count: number
  currentIndex: number
  onClick: (index: number) => void
}

export function CarouselDots({ count, currentIndex, onClick }: CarouselDotsProps) {
  const { isDark } = useTheme()

  return (
    <div className="flex justify-center items-center gap-2 mt-2 pb-2" role="tablist" aria-label="Carousel navigation">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex
        return (
          <button
            key={index}
            role="tab"
            aria-selected={isActive}
            onClick={() => onClick(index)}
            className={`p-3 -m-1.5 rounded-full transition-colors duration-300 ${
              isActive
                ? !isDark
                  ? 'bg-[var(--gold-200)] w-6 border border-[var(--gold-300)] shadow-[0_0_6px_rgba(200,150,12,0.6)]'
                  : 'bg-primary w-6 shadow-[0_0_6px_var(--primary)]'
                : !isDark
                  ? 'bg-[var(--gold-300)]/10 border border-[var(--gold-300)]/40 lg:hover:bg-[var(--gold-300)]/25 w-2.5'
                  : 'bg-white/5 border border-white/20 lg:hover:bg-white/10 w-2.5'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className={`block h-2.5 rounded-full ${
              isActive
                ? !isDark
                  ? 'bg-[var(--gold-200)] w-6 border border-[var(--gold-300)] shadow-[0_0_6px_rgba(200,150,12,0.6)]'
                  : 'bg-primary w-6 shadow-[0_0_6px_var(--primary)]'
                : !isDark
                  ? 'bg-[var(--gold-300)]/10 border border-[var(--gold-300)]/40 lg:hover:bg-[var(--gold-300)]/25 w-2.5'
                  : 'bg-white/5 border border-white/20 lg:hover:bg-white/10 w-2.5'
            }`} />
          </button>
        )
      })}
    </div>
  )
}
