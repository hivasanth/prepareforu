import { useBreakpoint } from '../../../hooks/useBreakpoint'

export function useExamResponsive() {
  const { breakpoint } = useBreakpoint()

  const px = (map: Record<string, number>) => `${map[breakpoint] ?? map.xs}px`
  const isMobile = breakpoint === 'xs'

  return {
    breakpoint,
    isMobile,
    layout: {
      summaryGridCols: (['xs', 'sm'].includes(breakpoint) ? 'repeat(1,1fr)' : 'repeat(5,1fr)'),
      qGridCols: (isMobile ? 'repeat(1,1fr)' : breakpoint === 'sm' || breakpoint === 'md' ? 'repeat(2,1fr)' : 'repeat(3,1fr)'),
      cardH: ({ xs: 80, sm: 90, md: 100, lg: 110, xl: 110 }[breakpoint] ?? 80),
      cardPad: ({ xs: 12, sm: 14, md: 16, lg: 18, xl: 18 }[breakpoint] ?? 12),
      rowH: ({ xs: undefined, sm: 40, md: 44, lg: 48, xl: 48 }[breakpoint]),
      btnH: ({ xs: 36, sm: 38, md: 40, lg: 42, xl: 42 }[breakpoint] ?? 36),
    },
    typography: {
      titleFont: px({ xs: 16, sm: 18, md: 20, lg: 22, xl: 22 }),
      subFont: px({ xs: 12, sm: 13, md: 14, lg: 15, xl: 15 }),
      qFont: px({ xs: 12, sm: 14, md: 15, lg: 16, xl: 16 }),
      qStat: px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 }),
      perfFont: px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 }),
      tblFont: px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 }),
      barFont: px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 }),
      cardLbl: px({ xs: 11, sm: 12, md: 13, lg: 14, xl: 14 }),
      cardVal: px({ xs: 14, sm: 16, md: 18, lg: 20, xl: 20 }),
    },
    charts: {
      barH: ({ xs: 120, sm: 140, md: 160, lg: 180, xl: 180 }[breakpoint] ?? 120),
    },
  }
}
