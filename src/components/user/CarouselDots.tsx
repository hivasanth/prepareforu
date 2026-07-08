import { useTheme } from '../../context/ThemeContext'

interface CarouselDotsProps {
  count: number
  currentIndex: number
  onClick: (index: number) => void
}

export function CarouselDots({ count, currentIndex, onClick }: CarouselDotsProps) {
  const { isDark } = useTheme()

  return (
    <div className="flex justify-center items-center gap-2 mt-2 pb-2">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex
        return (
          <button
            key={index}
            onClick={() => onClick(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isActive
                ? !isDark
                  ? 'bg-[#C8960C] w-6 border border-[#A87828] shadow-[0_0_6px_rgba(200,150,12,0.6)]'
                  : 'bg-primary w-6 shadow-[0_0_6px_var(--primary)]'
                : !isDark
                  ? 'bg-[#A87828]/10 border border-[#A87828]/40 lg:hover:bg-[#A87828]/25 w-2.5'
                  : 'bg-white/5 border border-white/20 lg:hover:bg-white/10 w-2.5'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        )
      })}
    </div>
  )
}
