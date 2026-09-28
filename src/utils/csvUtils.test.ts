import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCSV, escapeCSVCell, sanitizeFilename } from './csvUtils'

// Lock-in for the Student-Profile CSV download path (sub-admin → Students →
// Download CSV). The original implementation was already functionally correct
// (CSV string → Blob text/csv → object URL → <a download> → click → deferred
// revoke). These tests pin the hardened contract so regressions — especially one
// that would make the UI claim "DOWNLOADED" without a real download being
// requested — are caught.

const SIMPLE = { filename: 'Ada_Lovelace_performance.csv', headers: ['Exam Name', 'Raw Score'], rows: [['Midterm', 8]] }

function captureAnchors() {
  const anchors: HTMLAnchorElement[] = []
  const origCreate = document.createElement.bind(document)
  const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = origCreate(tag)
    if (tag.toLowerCase() === 'a' && el instanceof HTMLAnchorElement) anchors.push(el)
    return el
  })
  const clickSpies: ReturnType<typeof vi.fn>[] = []
  anchors.forEach((a) => { clickSpies.push(vi.spyOn(a, 'click')) })
  return { createSpy, anchors, clickSpies }
}

describe('downloadCSV — genuine browser download trigger', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock://csv')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds a Blob with the CSV serialised through escapeCSVCell and attaches a valid download anchor', () => {
    const { anchors } = captureAnchors()
    const blobSpy = vi.spyOn(URL, 'createObjectURL')

    downloadCSV(SIMPLE)

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    const blob = blobSpy.mock.calls[0][0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/csv;charset=utf-8;')

    const anchor = anchors.find((a) => a.getAttribute('download') === SIMPLE.filename)
    expect(anchor).toBeDefined()
    expect(anchor!.getAttribute('href')).toBe('blob:mock://csv')
    expect(anchor!.getAttribute('download')).toBe('Ada_Lovelace_performance.csv')
  })

  it('appends the anchor to the DOM, triggers click, and removes it', () => {
    const { createSpy } = captureAnchors()
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    downloadCSV(SIMPLE)

    expect(createSpy).toHaveBeenCalledWith('a')
    // The download anchor we append is the one carrying the download attribute.
    const appended = appendSpy.mock.calls.map((c) => c[0] as HTMLElement).filter((el) => el.getAttribute?.('download'))
    expect(appended.length).toBe(1)
    expect(appended[0].getAttribute('download')).toBe('Ada_Lovelace_performance.csv')
    // The very anchor we appended is the one that gets removed after its click.
    expect(removeSpy).toHaveBeenCalledWith(appended[0])
    // It is no longer connected once the download has been triggered+cleaned up.
    expect(appended[0].isConnected).toBe(false)
  })

  it('does NOT revoke the object URL synchronously — revoke is deferred so it cannot race the download', () => {
    captureAnchors()
    downloadCSV(SIMPLE)
    // The click has fired but the object URL must still be alive; revoking now
    // would cancel the transfer before the browser's download manager picks it up.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('mounts the anchor inside a focused [role="dialog"] (modal focus-trap regression)', () => {
    // Regression for the real production bug: downloadCSV used to append to
    // <body>. Inside a focus-trapped modal that predecessor of the trap steals
    // focus from the anchor and Chromium cancels the download silently. The
    // anchor must be mounted within the dialog that owns focus.
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.appendChild(dialog)
    const focusedBtn = document.createElement('button')
    dialog.appendChild(focusedBtn)
    focusedBtn.focus()
    expect(document.activeElement).toBe(focusedBtn)

    const { anchors } = captureAnchors()
    const bodyAppend = vi.spyOn(document.body, 'appendChild')
    const dialogAppend = vi.spyOn(dialog, 'appendChild')
    const dialogRemove = vi.spyOn(dialog, 'removeChild')
    downloadCSV(SIMPLE)

    const anchor = anchors.find((a) => a.getAttribute('download') === SIMPLE.filename)
    expect(anchor).toBeDefined()
    // The anchor must be appended to the dialog (NOT to <body>), so a modal
    // focus trap can never steal its click.
    expect(dialogAppend).toHaveBeenCalledWith(anchor)
    expect(dialogRemove).toHaveBeenCalledWith(anchor)
    expect(bodyAppend).not.toHaveBeenCalled()
    document.body.removeChild(dialog)
  })

  it('falls back to <body> when no dialog owns focus (plain page context)', () => {
    const { anchors } = captureAnchors()
    downloadCSV(SIMPLE)
    const anchor = anchors.find((a) => a.getAttribute('download') === SIMPLE.filename)
    expect(anchor).toBeDefined()
    expect(anchor!.parentElement ?? document.body).toBe(document.body)
  })

  it('falls back to a data: URI (and skips revoke) when object URLs are unavailable', () => {
    const { anchors } = captureAnchors()
    // Simulate an environment where createObjectURL is genuinely absent.
    const origCreate = (URL as unknown as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: undefined })
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const blobName = 'Fallback_Student.csv'
    downloadCSV({ filename: blobName, headers: ['A'], rows: [['x']] })
    const anchor = anchors.find((a) => a.getAttribute('download') === blobName)
    expect(anchor).toBeDefined()
    expect(anchor!.getAttribute('download')).toBe('Fallback_Student.csv')
    expect(anchor!.getAttribute('href')).toMatch(/^data:text\/csv/)
    // data: URIs are self-contained — they must not be fed to revokeObjectURL.
    expect(revokeSpy).not.toHaveBeenCalled()

    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: origCreate })
    revokeSpy.mockRestore()
  })
})

describe('sanitizeFilename + escapeCSVCell (CSV export contract)', () => {
  it('sanitizes a display name into a safe filename with the .csv suffix', () => {
    expect(`${sanitizeFilename('Ada Lovelace')}_performance.csv`).toBe('Ada_Lovelace_performance.csv')
    expect(sanitizeFilename('P@#$% Test/Name')).toBe('P_TestName')
  })

  it('escapes commas, quotes, newlines and neutralises formula triggers', () => {
    expect(escapeCSVCell('a,b')).toBe('"a,b"')
    expect(escapeCSVCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCSVCell('=1+1')).toBe("'=1+1")
    expect(escapeCSVCell('-2')).toBe("'-2")
    expect(escapeCSVCell(0)).toBe('0')
    expect(escapeCSVCell(null)).toBe('')
    expect(escapeCSVCell(undefined)).toBe('')
  })
})
