import { H2, H3, Body, Label } from '../common/AntigravityTypography'

// ── Types ─────────────────────────────────────────────────────────────────────

type WelcomeBannerVariant = 'user' | 'educator' | 'admin'

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
  admin: {
    label: getGreeting,
    role: 'Administrator',
    heading: 'Manage. Optimize. Lead.',
    subtitle: 'Drive excellence across your institution.',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WelcomeBanner({ displayName, variant = 'user' }: WelcomeBannerProps) {
  const config = BANNER_VARIANTS[variant]
  const firstName = extractFirstName(displayName)
  const labelText = typeof config.label === 'function' ? config.label() : config.label

  return (
    <div className="ancient-card-dark overflow-hidden min-h-[200px] relative">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg/hero-banner.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--forest-900)]/95 via-[var(--forest-900)]/70 to-transparent" />

      <div className="p-5 md:p-8 relative z-[2]">
        <div className="mb-6">
          <Label className="text-warning tracking-[0.15em] mb-1">
            {labelText}
          </Label>
          <H2 className="text-[clamp(26px,4.5vw,36px)] font-black leading-[1.15] text-text-on-dark">
            {firstName}
          </H2>
          <Body className="italic text-[15px] mt-[6px] text-warning/90">
            {config.role}
          </Body>
        </div>

        <div className="w-12 h-[1px] mb-5 bg-warning/35" />

        <H3 className="text-[clamp(18px,3vw,24px)] font-extrabold leading-[1.2] text-warning">
          {config.heading}
        </H3>
        <Body className="text-sm italic mt-[6px] text-warning/60">
          {config.subtitle}
        </Body>
      </div>
    </div>
  )
}
