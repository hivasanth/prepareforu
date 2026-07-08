import { useState, useEffect } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Custom hook to detect the current layout breakpoint.
 * XS: < 640px (Mobile)
 * SM: 640px - 768px (Small Tablet / Landscape Mobile)
 * MD: 768px - 1024px (Tablet)
 * LG: 1024px - 1280px (Laptop / Desktop)
 * XL: > 1280px (Large Desktop)
 */
export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
}

/**
 * Custom hook to detect the current layout breakpoint.
 */
export function useBreakpoint(): BreakpointInfo {
  const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'lg'
    if (window.matchMedia('(min-width: 1280px)').matches) return 'xl'
    if (window.matchMedia('(min-width: 1024px)').matches) return 'lg'
    if (window.matchMedia('(min-width: 768px)').matches) return 'md'
    if (window.matchMedia('(min-width: 640px)').matches) return 'sm'
    return 'xs'
  }

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const queries = {
      xl: window.matchMedia('(min-width: 1280px)'),
      lg: window.matchMedia('(min-width: 1024px) and (max-width: 1279px)'),
      md: window.matchMedia('(min-width: 768px) and (max-width: 1023px)'),
      sm: window.matchMedia('(min-width: 640px) and (max-width: 767px)'),
      xs: window.matchMedia('(max-width: 639px)')
    }

    const listener = () => {
      setBreakpoint(getBreakpoint())
    }

    // Attach listeners
    Object.values(queries).forEach(mql => {
      // Compatibility for older browsers/engines
      if (mql.addEventListener) {
        mql.addEventListener('change', listener)
      } else {
        mql.addListener(listener)
      }
    })

    return () => {
      Object.values(queries).forEach(mql => {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', listener)
        } else {
          mql.removeListener(listener)
        }
      })
    }
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
  }
}
