/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN DESIGN SYSTEM — ERROR & FEEDBACK SHOWCASE TESTS (Section 23)
 *
 * Verifies the production error/feedback reference section renders every REAL
 * reusable surface (ErrorContainer, Alert, RetryButton, ErrorState,
 * ConfirmModal, AdminModal+Alert, SuccessModal) with LOCAL-ONLY
 * state and ZERO backend requests. Toast infra has been removed; §23.10
 * documents the Alert feedback-replacement contract.
 *
 * NOTE: canonical classifier copy is intentionally shown in several places
 * (component demos + reference tables), so queries are duplicate-tolerant.
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import AdminDesignSystem from './pages/admin/AdminDesignSystem'

/* ─── Mocks ───────────────────────────────────────────────────────────────── */

vi.mock('./utils/logger', () => ({
  generateRequestId: (p: string) => `${p}_test`,
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}))

vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('./components/common/AntigravityAnimation', async (orig) => {
  const actual = await orig<typeof import('./components/common/AntigravityAnimation')>()
  return {
    ...actual,
    SectionReveal: ({ children }: { children?: ReactNode }) => <>{children}</>,
    PageTransition: ({ children }: { children?: ReactNode }) => <>{children}</>,
  }
})

/* Any network access at all fails loudly — the showcase must be backend-free. */
const fetchSpy = vi.fn(() => Promise.reject(new Error('NO NETWORK IN SHOWCASE')))

beforeEach(() => {
  vi.clearAllMocks()
  cleanup()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/* The full design-system page is heavy in jsdom — allow ample time per test.
 * Timeouts must exceed render cost or a late mount can leak into the next
 * test's document (duplicate DOM). */
const TEST_TIMEOUT = 60_000

async function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AdminDesignSystem />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('Admin Design System — Section 23: Error & Feedback System', () => {

  it('section renders with its heading', async () => {
    await renderPage()
    expect(screen.getByText('23. Error & Feedback System')).toBeTruthy()
  }, TEST_TIMEOUT)

  it('ErrorContainer examples render real category titles derived from the classifier', async () => {
    await renderPage()

    /* Titles come live from normalizeError/buildTitle — canonical copy. */
    expect(screen.getAllByText('Connection Lost').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Server Error').length).toBeGreaterThan(0)
    expect(screen.getAllByText('You Are Offline').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Session Expired').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Access Denied').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Too Many Requests').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Under Maintenance').length).toBeGreaterThan(0)

    /* Friendly message verbatim from buildFriendlyMessage('network'). */
    expect(screen.getAllByText('Please check your internet connection and try again.').length).toBeGreaterThan(0)

    /* Severity gallery rows. */
    expect(screen.getByText('severity="critical"')).toBeTruthy()
  }, TEST_TIMEOUT)

  it('all four Alert variants render; the error variant carries role="alert"', async () => {
    await renderPage()

    /* Titles also exist in the legacy section 11 — duplicate-tolerant. */
    expect(screen.getAllByText('Info').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Success').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warning').length).toBeGreaterThan(0)

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some(a => a.textContent?.includes('Inline error'))).toBe(true)
  }, TEST_TIMEOUT)

  it('RetryButton renders and its interactive demo cycles loading without a backend call', async () => {
    await renderPage()

    expect(screen.getAllByRole('button', { name: /try again/i }).length).toBeGreaterThan(0)

    /* The dedicated interactive demo is targeted by data-testid so the
     * Section 24 Error Container catalog can add realistic "Try Again"
     * buttons without shifting a positional (.pop) selector. */
    const demoButton = within(screen.getByTestId('ds-retry-interactive')).getByRole('button')
    fireEvent.click(demoButton)

    await waitFor(() => {
      expect(demoButton.getAttribute('aria-label')).toBe('Retrying…')
      expect(demoButton).toBeDisabled()
    })

    await waitFor(() => {
      expect(demoButton.getAttribute('aria-label')).toBe('Try Again')
      expect(demoButton).not.toBeDisabled()
    }, { timeout: 4000 })
  }, TEST_TIMEOUT)

  it('legacy ErrorState renders separately and is labelled LEGACY', async () => {
    await renderPage()

    expect(screen.getByText('LEGACY')).toBeTruthy()
    expect(screen.getByText('Failed to load leaderboard data.')).toBeTruthy()
  }, TEST_TIMEOUT)

  it('§23.10 records the toast-replacement feedback contract (no toast buttons remain)', async () => {
    await renderPage()

    /* The Archive section documents that toast infra was removed — the demo
     * is now the persistent Alert feedback contract, not trigger buttons. */
    expect(screen.getAllByText(/Toast infrastructure \(useToast \/ ToastContainer\) was removed/i).length).toBeGreaterThan(0)

    /* Decision guide routes transient success/failure through Alert now. */
    expect(screen.getAllByText('Alert (success) — persistent until dismissed').length).toBeGreaterThan(0)
  }, TEST_TIMEOUT)

  it('AdminModal save-failure demo: modal opens, error alert persists, modal stays open', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: /open save-failure modal/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('Save failed')

    /* Save attempt keeps the modal open with the error still visible. */
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }))
    const stillOpen = screen.getByRole('dialog')
    expect(within(stillOpen).getAllByText(/servers are having trouble/i).length).toBeGreaterThan(0)

    fireEvent.click(within(stillOpen).getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  }, TEST_TIMEOUT)

  it('ConfirmModal demo: failure keeps dialog open with composed Alert; retry recovers and closes', async () => {
    await renderPage()

    /* Failure path */
    fireEvent.click(screen.getByRole('button', { name: /open confirm modal \(fails\)/i }))
    let dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('Yes, Delete Permanently')

    fireEvent.click(within(dialog).getByRole('button', { name: /yes, delete permanently/i }))

    /* Busy clears, dialog stays OPEN, composed error Alert becomes visible. */
    await waitFor(() => {
      dialog = screen.getByRole('dialog')
      expect(dialog.textContent).toContain('Failed to delete the topic.')
    })

    /* Retry attempt succeeds (recovery) → modal closes. */
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /yes, delete permanently/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  }, TEST_TIMEOUT)

  it('SuccessModal demo renders the non-transient success surface', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: /open success modal/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('Exam Submitted')
    expect(dialog.textContent).toContain('performance report is ready')
    fireEvent.click(within(dialog).getByRole('button', { name: /^ok$/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  }, TEST_TIMEOUT)

  it('classification reference shows raw inputs mapped to friendly user-facing results', async () => {
    await renderPage()

    /* Raw technical input documented (struck-through column)... */
    expect(screen.getByText('permission denied for table study_topics')).toBeTruthy()
    /* ...and the user-facing replacement beside it. */
    expect(screen.getAllByText("You don't have permission to access this.").length).toBeGreaterThan(0)
  }, TEST_TIMEOUT)

  it('no backend request occurs while rendering or interacting', async () => {
    await renderPage()

    const demoButton = within(screen.getByTestId('ds-retry-interactive')).getByRole('button')
    fireEvent.click(demoButton)

    await waitFor(() => {
      expect(demoButton.getAttribute('aria-label')).toBe('Try Again')
      expect(demoButton).not.toBeDisabled()
    }, { timeout: 10000 })

    expect(fetchSpy).not.toHaveBeenCalled()
  }, TEST_TIMEOUT)
})
