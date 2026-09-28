import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import UserProfile from './pages/user/UserProfile'
import * as authService from './services/authService'

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }))

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      email: 'student@example.com',
      full_name: 'Test Student',
      role: 'user',
      exam_selection: 'APPSC_GROUPS',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    loading: false,
    initialized: true,
    logout: logoutMock,
    refreshUser: vi.fn(async () => {}),
  }),
}))

vi.mock('./services/authService', () => ({
  reauthenticate: vi.fn(),
  updatePassword: vi.fn(),
  sendPasswordResetWithRedirect: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('./services/dashboardService', () => ({
  dashboardService: {
    fetchDashboardStats: vi.fn(async () => ({
      success: true,
      data: { daily_streak: 3, highest_streak: 7, exams_taken: 4, accuracy: 82, global_rank: 'Rank #12' },
    })),
  },
}))

vi.mock('./components/common/CaptchaField', () => ({
  CaptchaField: ({ onTokenChange }: { onTokenChange: (t: string | null) => void }) => (
    <button type="button" onClick={() => onTokenChange?.('test-token')}>
      Solve Captcha
    </button>
  ),
}))

const validNewPass = 'NewPass1!'
const validConfirm = 'NewPass1!'

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <UserProfile />
      </ThemeProvider>
    </MemoryRouter>
  )
}

async function openPasswordForm() {
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: /update password/i }))
  await screen.findByLabelText('Current Password', {}, { timeout: 4000 })
}

function solveCaptcha() {
  fireEvent.click(screen.getByRole('button', { name: /solve captcha/i }))
}

async function verifyAccess() {
  solveCaptcha()
  fireEvent.click(screen.getByRole('button', { name: /verify access/i }))
}

async function fillNewPassword(pass = validNewPass, confirm = validConfirm) {
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: pass } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirm } })
}

beforeEach(() => {
  window.scrollTo = vi.fn()
  logoutMock.mockClear()
  vi.mocked(authService.reauthenticate).mockResolvedValue({ success: true, data: null })
  vi.mocked(authService.updatePassword).mockResolvedValue({ success: true, data: null })
})

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('Profile Update Password flow (canonical re-auth + update)', () => {
  it('F1: password form is hidden by default; "Update Password" action reveals it', async () => {
    renderPage()
    expect(screen.queryByLabelText('Current Password')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: /update password/i }))
    expect(await screen.findByLabelText('Current Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: /verify access/i })).toBeTruthy()
  })

  it('F2: "Update Password" toggles the form closed again', async () => {
    renderPage()
    const toggle = await screen.findByRole('button', { name: /update password/i })
    fireEvent.click(toggle)
    await screen.findByLabelText('Current Password')
    fireEvent.click(screen.getByRole('button', { name: /hide password settings/i }))
    await waitFor(() => expect(screen.queryByLabelText('Current Password')).toBeNull())
  })

  it('F3: Verify Access is disabled until a current password is entered', async () => {
    await openPasswordForm()
    solveCaptcha()
    const verify = screen.getByRole('button', { name: /verify access/i })
    expect(verify.closest('button')?.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    expect(screen.getByRole('button', { name: /verify access/i }).closest('button')?.disabled).toBe(false)
    expect(authService.reauthenticate).not.toHaveBeenCalled()
  })

  it('F4: Verify Access is disabled until the security check is solved', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    expect(screen.getByRole('button', { name: /verify access/i }).closest('button')?.disabled).toBe(true)
    solveCaptcha()
    expect(screen.getByRole('button', { name: /verify access/i }).closest('button')?.disabled).toBe(false)
    expect(authService.reauthenticate).not.toHaveBeenCalled()
  })

  it('F5: Verify Access calls reauthenticate with email, current password and captcha token', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await waitFor(() =>
      expect(authService.reauthenticate).toHaveBeenCalledWith(
        'student@example.com',
        'OldPass1!',
        'test-token'
      )
    )
  })

  it('F6: failed re-authentication surfaces an error and does not reveal the new-password fields', async () => {
    vi.mocked(authService.reauthenticate).mockResolvedValueOnce({
      success: false,
      error: { source: 'auth', code: 'INVALID_CREDENTIALS', message: 'Incorrect password.', field: 'general' },
    })
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'Wrong!' } })
    await verifyAccess()
    await screen.findByText(/Incorrect password/i)
    expect(screen.queryByLabelText('New Password')).toBeNull()
  })

  it('F7: successful re-authentication reveals the new-password fields and authenticated badge', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    expect(await screen.findByLabelText('New Password')).toBeTruthy()
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy()
    expect(screen.getByText('AUTHENTICATED')).toBeTruthy()
  })

  it('F8: new-password strength badges reflect incomplete password (not valid, submit disabled)', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'weak' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'weak' } })
    expect(screen.getByRole('button', { name: /commit changes/i }).closest('button')?.disabled).toBe(true)
  })

  it('F9: mismatched confirmation disables the commit button', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword(validNewPass, 'Different1!')
    expect(screen.getByRole('button', { name: /commit changes/i }).closest('button')?.disabled).toBe(true)
  })

  it('F10: a valid, matching new password enables the commit button', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword()
    expect(screen.getByRole('button', { name: /commit changes/i }).closest('button')?.disabled).toBe(false)
  })

  it('F11: submitting a valid password calls updatePassword with the new password', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword()
    fireEvent.click(screen.getByRole('button', { name: /commit changes/i }))
    await waitFor(() => expect(authService.updatePassword).toHaveBeenCalledWith('NewPass1!'))
  })

  it('F12: successful update shows a success toast and logs the user out', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword()
    fireEvent.click(screen.getByRole('button', { name: /commit changes/i }))
    await screen.findByText(/Password updated successfully/i)

    expect(logoutMock).not.toHaveBeenCalled()
    await new Promise(r => setTimeout(r, 2200))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('F13: failed update surfaces an inline error and keeps the user signed in', async () => {
    vi.mocked(authService.updatePassword).mockResolvedValueOnce({
      success: false,
      error: { source: 'auth', code: 'UPDATE_FAILED', message: 'Password update failed.', field: 'general' },
    })
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword()
    fireEvent.click(screen.getByRole('button', { name: /commit changes/i }))
    await screen.findByText(/Password update failed/i)
    expect(logoutMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText('New Password')).toBeTruthy()
  })

  it('F14: invalid/weak new password is blocked client-side and updatePassword is never called', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fillNewPassword('short', 'short')
    fireEvent.click(screen.getByRole('button', { name: /commit changes/i }))
    await waitFor(() => expect(authService.updatePassword).not.toHaveBeenCalled())
  })

  it('F15: resetting verification clears the authenticated state before committing', async () => {
    await openPasswordForm()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } })
    await verifyAccess()
    await screen.findByLabelText('New Password')
    fireEvent.click(screen.getByRole('button', { name: /reset password verification/i }))
    await waitFor(() => expect(screen.queryByLabelText('New Password')).toBeNull())
    expect(screen.getByText('Verify Access')).toBeTruthy()
  })
})
