import type { ReactNode } from 'react'
import { Compass, Home, ChevronLeft } from 'lucide-react'
import { Button, IconBadge, PageContainer, PageTransition } from './AntigravityUI'

/* ─── NotFoundSurface ──────────────────────────────────────────────────────
 * State-container unification (audit §12): canonical route-level "404"
 * presentation. role="alert" so an unmatched route is announced, never
 * silently swallowed by a wildcard redirect.
 *
 * Consumers: NotFoundPage (/src/pages/NotFoundPage.tsx) wires the role-aware
 * actions. This primitive stays router-free so it can be reused by any flow
 * that needs a not-found presentation.
 * ────────────────────────────────────────────────────────────────────────── */

interface NotFoundSurfaceProps {
  title?: ReactNode
  body?: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export const NotFoundSurface: React.FC<NotFoundSurfaceProps> = ({
  title = 'Page Not Found',
  body = 'The link may be broken, or the page may have been moved or renamed.',
  primaryLabel = 'Back to Dashboard',
  onPrimary,
  secondaryLabel = 'Back to Login',
  onSecondary,
}) => {
  return (
    <PageContainer centered>
      <PageTransition>
        <div
          role="alert"
          aria-live="assertive"
          className="max-w-md w-full bg-card-bg border border-border-subtle rounded-[40px] p-8 sm:p-12 shadow-2xl text-center ancient-overlay"
        >
          <IconBadge icon={Compass} size="5xl" shape="circle" status="muted" className="mx-auto mb-8" />

          <h1 className="text-3xl font-black text-text-primary mb-4 uppercase tracking-tight">
            {title}
          </h1>

          <p className="text-text-secondary font-medium leading-relaxed mb-10 text-sm sm:text-base">
            {body}
          </p>

          <div className="flex flex-col gap-3">
            {onPrimary && (
              <Button onClick={onPrimary} fullWidth>
                <Home size={18} />
                {primaryLabel}
              </Button>
            )}
            {onSecondary && (
              <Button variant="secondary" onClick={onSecondary} fullWidth>
                <ChevronLeft size={16} />
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </PageTransition>
    </PageContainer>
  )
}