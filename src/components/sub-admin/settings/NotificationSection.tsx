import { Bell } from 'lucide-react'
import { Card, Stack, Label, Body, Switch } from '../../../components/common/AntigravityUI'

interface NotificationSectionProps {
  notifyAttempt: boolean
  onNotifyAttemptChange: (v: boolean) => void
  notifyCompletion: boolean
  onNotifyCompletionChange: (v: boolean) => void
  notifyNewStudent: boolean
  onNotifyNewStudentChange: (v: boolean) => void
  saving: boolean
}

export function NotificationSection({
  notifyAttempt,
  onNotifyAttemptChange,
  notifyCompletion,
  onNotifyCompletionChange,
  notifyNewStudent,
  onNotifyNewStudentChange,
  saving,
}: NotificationSectionProps) {
  return (
    <Card variant="default" className="p-8">
      <Stack gap="lg">
        <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
          <Bell size={18} className="text-primary" />
          <Label>Engagement Alerts</Label>
        </Stack>

        <Stack gap="md">
          <div className="flex items-center justify-between">
            <Body>Notify on student attempts</Body>
            <Switch checked={notifyAttempt} onChange={onNotifyAttemptChange} disabled={saving} aria-label="Notify on student attempts" />
          </div>
          <div className="flex items-center justify-between">
            <Body>Notify on exam closure</Body>
            <Switch checked={notifyCompletion} onChange={onNotifyCompletionChange} disabled={saving} aria-label="Notify on exam closure" />
          </div>
          <div className="flex items-center justify-between">
            <Body>Notify on new student signup</Body>
            <Switch checked={notifyNewStudent} onChange={onNotifyNewStudentChange} disabled={saving} aria-label="Notify on new student signup" />
          </div>
          {saving && (
            <Body secondary className="text-xs">Saving...</Body>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}
