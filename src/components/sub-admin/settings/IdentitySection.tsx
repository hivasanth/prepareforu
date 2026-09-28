import { User, Mail, Lock } from 'lucide-react'
import { Card, Stack, Input, Button, Label } from '../../../components/common/AntigravityUI'
import { FieldError } from '../../../components/common/SharedComponents'

interface IdentitySectionProps {
  name: string
  onNameChange: (v: string) => void
  email: string
  password: string
  onPasswordChange: (v: string) => void
  saving: boolean
  onSave: () => void
  fieldErrors?: Partial<Record<'name' | 'password', string>>
  onFieldBlur?: (field: 'name' | 'password') => void
}

export function IdentitySection({ name, onNameChange, email, password, onPasswordChange, saving, onSave, fieldErrors = {}, onFieldBlur }: IdentitySectionProps) {
  return (
    <Card variant="default" className="p-8">
      <Stack gap="lg">
        <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
          <User size={18} className="text-primary" />
          <Label>Identity Profile</Label>
        </Stack>

        <Stack gap="md">
          <Stack gap="xs">
            <Label htmlFor="identity-name">Full Name</Label>
            <Input
              id="identity-name"
              placeholder="e.g. Dr. Jane Smith"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => onFieldBlur?.('name')}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'identity-name-error' : undefined}
            />
            {fieldErrors.name && (
              <FieldError id="identity-name-error">{fieldErrors.name}</FieldError>
            )}
          </Stack>

          <Stack gap="xs">
            <Label htmlFor="identity-email">Email (Read Only)</Label>
            <Input
              id="identity-email"
              value={email}
              disabled
              leftIcon={Mail}
            />
          </Stack>

          <Stack gap="xs">
            <Label htmlFor="identity-password">Update Password</Label>
            <Input
              id="identity-password"
              type="password"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onBlur={() => onFieldBlur?.('password')}
              leftIcon={Lock}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'identity-password-error' : undefined}
            />
            {fieldErrors.password && (
              <FieldError id="identity-password-error">{fieldErrors.password}</FieldError>
            )}
          </Stack>

          <Button
            variant="primary"
            onClick={onSave}
            loading={saving}
            className="mt-2"
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}
