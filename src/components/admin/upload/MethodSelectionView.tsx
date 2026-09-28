import { PlusCircle, FileJson } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionReveal, Grid, Card, Body } from '../../common/AntigravityUI'
import { AdminIconWrap } from '../../common/AdminIconWrap'
import { AdminText } from '../../common/AdminText'
import { FOCUS_RING } from '../../common/AntigravityMotion'

interface MethodSelectionViewProps {
  onSelect: (type: 'single' | 'bulk') => void
}

interface MethodOption {
  type: 'single' | 'bulk'
  icon: LucideIcon
  title: string
  description: string
  cta: string
  /* Full literal utilities so the Tailwind scanner sees them. */
  accentClass: string
  hoverAccentClass: string
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    type: 'single',
    icon: PlusCircle,
    title: 'Add One by One',
    description: 'Type each question manually with full control over formatting.',
    cta: 'Go to Manual Entry →',
    accentClass: 'text-primary',
    hoverAccentClass: 'group-hover:text-primary',
  },
  {
    type: 'bulk',
    icon: FileJson,
    title: 'Upload Many at Once',
    description: 'Use AI to extract and upload multiple questions instantly from your documents.',
    cta: 'Go to Bulk Upload →',
    accentClass: 'text-secondary',
    hoverAccentClass: 'group-hover:text-secondary',
  },
]

export function MethodSelectionView({ onSelect }: MethodSelectionViewProps) {
  return (
    <SectionReveal>
      <Grid cols={2} gap={24} className="max-md:grid-cols-1">
        {METHOD_OPTIONS.map(({ type, icon: Icon, title, description, cta, accentClass, hoverAccentClass }) => (
          <Card
            key={type}
            variant="default"
            padding={24}
            className={`h-full flex flex-col group cursor-pointer ${FOCUS_RING}`}
            onClick={() => onSelect(type)}
            role="button"
            tabIndex={0}
            aria-label={title}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(type) }}
          >
            <AdminIconWrap size="lg" rounded="lg" className="mb-6">
              <Icon size={28} />
            </AdminIconWrap>
            <div className="flex-1">
              <AdminText
                as="h2"
                variant="cinzel"
                className={`text-xl font-bold mb-2 uppercase tracking-tight ${hoverAccentClass} transition-interaction duration-fast ease-standard`}
              >
                {title}
              </AdminText>
              <Body secondary>
                {description}
              </Body>
            </div>
            <div className={`mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between font-bold text-xs uppercase tracking-widest ${accentClass}`}>
              {cta}
            </div>
          </Card>
        ))}
      </Grid>
    </SectionReveal>
  )
}
