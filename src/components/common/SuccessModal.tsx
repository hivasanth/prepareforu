import { CheckCircle2 } from 'lucide-react'
import { AdminModal } from './AdminModal'
import { IconBadge } from './IconBadge'
import { Button, Stack, Body } from './AntigravityUI'

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  okLabel?: string
  onClose: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  okLabel = 'OK',
  onClose,
}) => {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm:max-w-md"
      footer={
        <Button variant="success" fullWidth onClick={onClose}>
          {okLabel}
        </Button>
      }
    >
      <Stack gap="lg" align="center" className="text-center py-4">
        <IconBadge icon={CheckCircle2} size="5xl" shape="circle" status="success" />
        <Body secondary className="text-[14px] leading-relaxed max-w-[340px] m-0">
          {message}
        </Body>
      </Stack>
    </AdminModal>
  )
}
