import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyText, copyTextFallback } from './clipboardUtils'

// LAN-ORIGIN FIX: pins the canonical clipboard contract — copyText resolves
// true ONLY after the write demonstrably succeeded (Clipboard API or the
// execCommand fallback) and false on every failure, so no caller can ever
// flash a fake "Copied" state.

function stubClipboard(writeText: ((t: string) => Promise<unknown>) | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

function stubExecCommand(fn: (() => boolean) | undefined) {
  Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: fn })
}

beforeEach(() => {
  vi.restoreAllMocks()
  stubClipboard(undefined)
  stubExecCommand(undefined)
})

describe('copyText — canonical clipboard contract', () => {
  it('resolves true when the Clipboard API succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    await expect(copyText('payload')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('payload')
  })

  it('falls back to execCommand and resolves true when the Clipboard API rejects but the fallback succeeds', async () => {
    stubClipboard(() => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')))
    const exec = vi.fn(() => true)
    stubExecCommand(exec)

    await expect(copyText('payload')).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('falls back when navigator.clipboard is unavailable (non-secure origin)', async () => {
    stubClipboard(undefined)
    const exec = vi.fn(() => true)
    stubExecCommand(exec)

    await expect(copyText('payload')).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('resolves false when the Clipboard API rejects and the fallback fails', async () => {
    stubClipboard(() => Promise.reject(new DOMException('denied', 'NotAllowedError')))
    stubExecCommand(() => false)

    await expect(copyText('payload')).resolves.toBe(false)
  })

  it('resolves false when clipboard is unavailable and execCommand is unavailable', async () => {
    stubClipboard(undefined)
    stubExecCommand(undefined)

    await expect(copyText('payload')).resolves.toBe(false)
  })

  it('never reports success for a rejected write (no silent swallow)', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('clipboard write failed')))
    stubClipboard(writeText)
    stubExecCommand(() => false)

    expect(await copyText('payload')).toBe(false)
    expect(writeText).toHaveBeenCalledWith('payload')
  })
})

describe('copyTextFallback — legacy execCommand path', () => {
  it('returns true and performs the copy when execCommand succeeds', () => {
    const exec = vi.fn(() => true)
    stubExecCommand(exec)
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    expect(copyTextFallback('legacy payload')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(appendSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it('returns false and still cleans up when execCommand throws', () => {
    stubExecCommand(() => { throw new DOMException('NotSupportedError', 'NotSupportedError') })
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    expect(copyTextFallback('legacy payload')).toBe(false)
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it('returns false when there is no DOM', () => {
    vi.stubGlobal('document', undefined)
    try {
      expect(copyTextFallback('n/a')).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})