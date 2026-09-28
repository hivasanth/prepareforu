import { Typography } from '../common/Typography'

// ── Types ─────────────────────────────────────────────────────────────────────

type WelcomeBannerVariant = 'user' | 'educator'

interface BannerVariantConfig {
  /** Greeting label — static string or dynamic function */
  label: string | (() => string)
  /** Role or tagline displayed below the name */
  role: string
  /** Tagline heading displayed below the divider */
  heading: string
  /** Supporting text below the heading */
  subtitle: string
}

interface WelcomeBannerProps {
  /** Full display name — component internally extracts first name */
  displayName: string
  /** Banner variant — defaults to 'user' */
  variant?: WelcomeBannerVariant
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function extractFirstName(displayName: string): string {
  return displayName.trim().split(' ')[0] || 'User'
}

// ── Variant Configurations ────────────────────────────────────────────────────

const BANNER_VARIANTS: Record<WelcomeBannerVariant, BannerVariantConfig> = {
  user: {
    label: '❖ NAMASTE ❖',
    role: '— Keep growing everyday —',
    heading: 'Learn. Grow. Achieve.',
    subtitle: 'Ancient wisdom for modern minds.',
  },
  educator: {
    label: getGreeting,
    role: 'Instructor',
    heading: 'Create. Assess. Inspire.',
    subtitle: 'Build better assessments for better learning.',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

/* Phase 6.XB (USR-FND-01 / USR-FND-02) — the hero surface now consumes only
   certified Layer-2 semantic surface tokens (bg-card-premium-surface in dark,
   --gradient-header in light, --elevation-2, --border-*) instead of the retired
   .ancient-card-dark recipe and the Layer-1 --forest-* primitive. Visual
   hierarchy is preserved via the certified type scale (role="display" for the
   name).
   Phase 6.X (Task 1/7) — banner typography refined: greeting/heading/supporting
   text are pure white high-contrast (inherited from the banner surface — no
   underlying color token, no inline overrides), name uppercased, and the
   warning-tint primary chain removed.
   Divider is a neutral white hairline (decorative only). */
export function WelcomeBanner({ displayName, variant = 'user' }: WelcomeBannerProps) {
  const config = BANNER_VARIANTS[variant]
  const firstName = extractFirstName(displayName)
  const labelText = typeof config.label === 'function' ? config.label() : config.label

  return (
    <section
      role="region"
      aria-label="Welcome"
      className="relative overflow-hidden min-h-[200px] rounded-2xl bg-card-premium-surface light:bg-[image:var(--gradient-header)] shadow-elevation-2 border border-border-subtle"
    >
      {/* Decorative hero image is presentation-only (aria-hidden). */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg/hero-banner.jpg')" }}
      />

      <div className="relative z-[2] p-5 md:p-8 text-white">
        <div className="mb-6">
          <Typography role="label" as="label" color="inherit" className="mb-1">
            {labelText}
          </Typography>
          <Typography role="display" as="h2" color="inherit" className="uppercase">
            {firstName}
          </Typography>
          <Typography role="body" as="p" color="inherit" className="italic mt-[6px]">
            {config.role}
          </Typography>
        </div>

        <div className="w-12 h-[1px] mb-5 bg-white/40" />

        <Typography role="card-title" as="h3" color="inherit">{config.heading}</Typography>
        <Typography role="body" as="p" color="inherit" className="text-sm italic mt-[6px]">
          {config.subtitle}
        </Typography>
      </div>
    </section>
  )
}