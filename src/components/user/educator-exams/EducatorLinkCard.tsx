import { useState, useCallback } from 'react'
import { Search, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, Input, Button, H2, Body, IconBadge, Stack, PageContainer } from '../../common/AntigravityUI'
import { useCouponValidation } from '../../../hooks/useCouponValidation'
import { linkUserToEducator } from '../../../services/userService'
import { queryCache } from '../../../utils/queryCache'
import { useAuth } from '../../../context/AuthContext'

interface EducatorLinkCardProps {
  onLinked: () => void
}

export function EducatorLinkCard({ onLinked }: EducatorLinkCardProps) {
  const { refreshUser } = useAuth()
  const [couponCode, setCouponCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { couponStatus, couponMessage } = useCouponValidation(couponCode)

  const isValid = couponStatus === 'valid'

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !couponCode.trim() || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await linkUserToEducator(couponCode)
      if (result.success) {
        queryCache.invalidateByPrefix('teacher_exams_')
        await refreshUser()
        onLinked()
      } else {
        setSubmitError(result.error || 'Failed to link your educator. Please try again.')
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isValid, couponCode, isSubmitting, refreshUser, onLinked])

  return (
    <PageContainer>
      <div className="max-w-md mx-auto py-12">
        <Card variant="premium-dark-neutral" className="shadow-premium-card">
          <Stack gap={24}>
            <div className="flex flex-col items-center text-center">
              <IconBadge icon={Search} status="primary" size="2xl" shape="circle" />
              <H2 className="mt-4">Link to Your Educator</H2>
              <Body className="text-text-secondary mt-2">
                Enter the coupon code your educator provided to unlock your assigned exams.
              </Body>
            </div>

            <form onSubmit={handleSubmit}>
              <Stack gap={12}>
                <div>
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setSubmitError(null)
                    }}
                    leftIcon={Search}
                    aria-label="Coupon code"
                    autoComplete="off"
                    autoFocus
                  />

                  {couponStatus === 'loading' && (
                    <Body className="text-text-secondary mt-2 text-xs">
                      Validating coupon code...
                    </Body>
                  )}

                  {couponStatus === 'valid' && couponMessage && (
                    <Body className="text-success mt-2 text-xs flex items-center gap-1">
                      <CheckCircle size={14} /> {couponMessage}
                    </Body>
                  )}

                  {couponStatus === 'invalid' && couponMessage && (
                    <Body className="text-warning mt-2 text-xs flex items-center gap-1">
                      <AlertCircle size={14} /> {couponMessage}
                    </Body>
                  )}
                </div>

                {submitError && (
                  <Body className="text-danger text-xs flex items-center gap-1">
                    <AlertCircle size={14} /> {submitError}
                  </Body>
                )}

                <Button
                  type="submit"
                  variant={isValid ? 'primary' : 'secondary'}
                  disabled={!isValid || isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? 'Linking...' : 'Link Educator'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Card>
      </div>
    </PageContainer>
  )
}
