import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { usePageError } from './hooks/usePageError'

// DS-032 — shared retry contract (BUG-1 / BUG-2 remediation).
// `usePageError.retry` must ONLY clear the captured error when the retryFn
// reports a truthful `true`. A resolved `false` (the load path captured the
// failure itself) or a thrown error must leave the error state in place —
// otherwise retry clobbers the error and the page falls through to an empty
// (BUG-1) or loading-flag-disabled (BUG-2) state.

type RetryOutcome = () => boolean | Promise<boolean>

function RetryHarness({ outcome }: { outcome: RetryOutcome }) {
  const { state, error, captureNetworkError, retry } = usePageError()
  return (
    <div>
      <div data-testid="state">{state}</div>
      <div data-testid="error">{error ? 'ERROR' : 'NONE'}</div>
      <button type="button" onClick={() => captureNetworkError('offline', { retryFn: outcome })}>
        fail
      </button>
      <button type="button" onClick={() => retry()}>
        retry
      </button>
    </div>
  )
}

afterEach(() => {
  cleanup()
})

describe('DS-032 retry contract (usePageError.retry)', () => {
  it('keeps the error when the retryFn resolves false (BUG-1 no clobber)', async () => {
    render(<RetryHarness outcome={() => false} />)

    fireEvent.click(screen.getByText('fail'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))
    expect(screen.getByTestId('error').textContent).toBe('ERROR')

    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))
    expect(screen.getByTestId('error').textContent).toBe('ERROR')
  })

  it('keeps the error when an async retryFn resolves false (consumer load path)', async () => {
    const load = async (): Promise<boolean> => {
      try {
        throw new Error('Failed to fetch')
      } catch {
        return false
      }
    }
    render(<RetryHarness outcome={load} />)

    fireEvent.click(screen.getByText('fail'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))

    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))
    expect(screen.getByTestId('error').textContent).toBe('ERROR')
  })

  it('clears the error when the retryFn resolves true (retry restored)', async () => {
    render(<RetryHarness outcome={() => true} />)

    fireEvent.click(screen.getByText('fail'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))

    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('success'))
    expect(screen.getByTestId('error').textContent).toBe('NONE')
  })

  it('keeps the error when the retryFn throws (fallback path)', async () => {
    render(
      <RetryHarness
        outcome={() => {
          throw new Error('offline')
        }}
      />,
    )

    fireEvent.click(screen.getByText('fail'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))

    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'))
    expect(screen.getByTestId('error').textContent).toBe('ERROR')
  })
})
