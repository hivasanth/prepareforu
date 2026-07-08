import { createPortal } from 'react-dom'
import { useState, useEffect, type ReactNode } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface PageHeaderProps {
  actionButton?: ReactNode
}

export function PageHeader({
  actionButton,
}: PageHeaderProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint.isXs || breakpoint.isSm

  // Portalling action buttons ensures they remain accessible when the main header is hidden
  useEffect(() => {
    const targetId = isMobile ? 'portal-header-actions-mobile' : 'portal-header-actions-desktop'
    
    const updateTarget = () => {
      const target = document.getElementById(targetId)
      if (target) {
        setPortalTarget(target)
        return true
      }
      return false
    }

    // Initial check
    if (updateTarget()) {
      // If found immediately, we still set up observer to handle potential layout re-mounts
    }

    // Robust observation for when the layout renders the target elements
    const observer = new MutationObserver(() => {
      if (updateTarget()) {
        // Once found and stable, we can theoretically stop observing, 
        // but keeping it handles dynamic DOM shifts better.
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isMobile])

  return (
    <>
      {/* Visual headers are now handled globally by AdminLayout top bar. 
          PageHeader now exclusively portals action buttons. */}
      {portalTarget && actionButton && createPortal(actionButton, portalTarget)}
    </>
  )
}
