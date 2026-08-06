import { Ticket, Copy, Share2, Check } from 'lucide-react'
import { Card, Stack, Label, IconButton } from '../../../components/common/AntigravityUI'

interface RecruitmentSectionProps {
  couponCode: string | null
  copied: boolean
  onCopy: () => void
  onShare: () => void
}

export function RecruitmentSection({ couponCode, copied, onCopy, onShare }: RecruitmentSectionProps) {
  return (
    <Card variant="elevated" className="p-8 bg-primary/5 border-primary/20">
      <Stack gap="lg">
        <Stack direction="row" gap="sm" align="center">
          <Ticket size={18} className="text-primary" />
          <Label className="text-primary">Recruitment Protocol</Label>
        </Stack>

        <div className="bg-card-bg border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
          <Stack gap="xs">
            <Label>Your unique coupon code</Label>
            <span className="text-xl font-black tracking-widest text-text-primary">
              {couponCode || 'UNASSIGNED'}
            </span>
          </Stack>
          <Stack direction="row" gap="sm">
            <IconButton onClick={onCopy} aria-label="Copy coupon">
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </IconButton>
            <IconButton onClick={onShare} aria-label="Share coupon">
              <Share2 size={16} />
            </IconButton>
          </Stack>
        </div>
      </Stack>
    </Card>
  )
}
