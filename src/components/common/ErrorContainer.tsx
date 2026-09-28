import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, AlertTriangle, WifiOff, ShieldAlert, ServerCrash, Clock, Ban, Wrench } from 'lucide-react'
import { Card } from './AntigravityCard'
import { Stack } from './AntigravityLayout'
import { IconBadge } from './IconBadge'
import { SectionReveal } from './AntigravityAnimation'
import type { ErrorCategory, ErrorSeverity, ErrorContainerVariant } from '../../types/error.types'

/* ─── ErrorContainer ───────────────────────────────────────────────────────
 * Design role:
 *   Standard application error surface for retryable failures.
 *   Composes SectionReveal + Card + IconBadge into a centered error view.
 *
 * Variants:
 *   page   — Centered max-width error card (page-level failures)
 *   inline — Full-width error block (section-level failures)
 *
 * Categories: network, offline, timeout, authentication, authorization,
 *   server, validation, rateLimit, maintenance, business, unknown
 *
 * Severity mapping:
 *   low/medium → warning (yellow)
 *   high/critical → danger (red)
 *
 * Use for:
 *   - Network/server errors during data loading
 *   - Authentication/authorization failures
 *   - Retryable page-level failures
 *   - API timeout errors
 *
 * Do NOT use for:
 *   - Field validation errors (use inline Alert or helper text)
 *   - Success messages (use Alert variant="success")
 *   - Inline form errors (use Label with error prop)
 *
 * Retry contract: ErrorContainer does NOT own retry logic.
 *   Consumers pair it with <RetryButton onRetry={...} /> as a child.
 *
 * Theme: Light + Dark (inherits Card default variant)
 * Consumers: 7 files (admin overview, user dashboard, sub-admin, settings)
 * ────────────────────────────────────────────────────────────────────────── */

// ─── Category → Icon Mapping ───────────────────────────────────────────────
// Uses lucide-react icons already present in the PrepareForU codebase.

const CATEGORY_ICONS: Record<ErrorCategory, LucideIcon> = {
  network: WifiOff,
  offline: WifiOff,
  timeout: Clock,
  authentication: ShieldAlert,
  authorization: ShieldAlert,
  server: ServerCrash,
  validation: AlertCircle,
  rateLimit: Ban,
  maintenance: Wrench,
  business: AlertTriangle,
  unknown: AlertCircle,
}

// ─── Severity → IconBadge Status Mapping ───────────────────────────────────
// Maps to existing IconBadge status colors (DS-004).

const SEVERITY_STATUS: Record<ErrorSeverity, 'danger' | 'warning' | 'primary' | 'muted'> = {
  low: 'primary',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

// ─── Variant Layout Mapping ────────────────────────────────────────────────
// All variants render identically today. Future phases will differentiate.
// This structure ensures the API is frozen — no prop signature changes later.

const VARIANT_CLASSES: Record<ErrorContainerVariant, string> = {
  page: 'max-w-lg mx-auto',
  inline: '',
}

// ─── ErrorContainer ────────────────────────────────────────────────────────
// Root composable wrapper for error experiences.
// Provides: animation, card surface, icon badge, accessible container.
//
// Composition pattern:
//   <ErrorContainer category="network">
//     <H2>Connection Lost</H2>
//     <Body>Please check your internet.</Body>
//     <RetryButton onRetry={...} />
//   </ErrorContainer>

interface ErrorContainerProps {
  children: React.ReactNode
  category?: ErrorCategory
  severity?: ErrorSeverity
  icon?: LucideIcon
  variant?: ErrorContainerVariant
  /** Card padding override for compact placements (e.g. inline save-bar
   *  errors). Omitted → the DS default (24) — existing consumers unchanged.
   *  Uses the Card design-system padding scale. */
  padding?: 0 | 16 | 20 | 24
  className?: string
}

export const ErrorContainer: React.FC<ErrorContainerProps> = ({
  children,
  category = 'unknown',
  severity = 'medium',
  icon: IconProp,
  variant = 'page',
  padding,
  className = '',
}) => {
  const Icon = IconProp ?? CATEGORY_ICONS[category]
  const status = SEVERITY_STATUS[severity]
  const variantClass = VARIANT_CLASSES[variant]

  return (
    <SectionReveal>
      <Card variant="default" {...(padding !== undefined ? { padding } : {})} className={`${variantClass} ${className}`}>
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center text-center gap-5"
        >
          <IconBadge icon={Icon} size="4xl" shape="circle" status={status} />
          <Stack gap="sm" className="items-center w-full">
            {children}
          </Stack>
        </div>
      </Card>
    </SectionReveal>
  )
}
