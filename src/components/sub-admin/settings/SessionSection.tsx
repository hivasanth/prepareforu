import { Shield, LogOut } from 'lucide-react'
import { Card, Stack, Label, Button } from '../../../components/common/AntigravityUI'
import { ConfirmModal } from '../../../components/common/SharedComponents'

interface SessionSectionProps {
  lastLogin: string
  isSignOutOpen: boolean
  openSignOut: () => void
  closeSignOut: () => void
  confirmSignOut: () => void
}

export function SessionSection({ lastLogin, isSignOutOpen, openSignOut, closeSignOut, confirmSignOut }: SessionSectionProps) {
  return (
    <>
      <Card variant="default" className="p-8">
        <Stack gap="lg">
          <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
            <Shield size={18} className="text-primary" />
            <Label>Session Security</Label>
          </Stack>

          <div className="flex items-center justify-between flex-1">
            <Stack gap="xs">
              <Label>Last Protocol Sync</Label>
              <span className="font-black text-text-primary text-sm">{lastLogin}</span>
            </Stack>
            <Button variant="danger" onClick={openSignOut}>
              <LogOut size={16} className="mr-2" /> Terminate Session
            </Button>
          </div>
        </Stack>
      </Card>

      <ConfirmModal
        open={isSignOutOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to sign in again to continue."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={confirmSignOut}
        onCancel={closeSignOut}
        danger
      />
    </>
  )
}
