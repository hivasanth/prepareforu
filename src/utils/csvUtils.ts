export interface CSVExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

// Choose where to temporarily mount the download anchor.
//
// Inside a focus-trapped modal the current focus lives within the dialog's
// trap region. Mounting the anchor on `document.body` (OUTSIDE the trap) gives
// Chrome the anchor's focus the instant we click it, and the focus trap
// immediately steals focus back into the dialog — which CANCELS the browser's
// pending download navigation. The click handler then reports success while no
// file ever downloads (silent no-op). Mounting the anchor inside the focused
// dialog keeps it within the focus region so the download actually starts.
//
// Outside any dialog we fall back to `document.body` (the classic behavior,
// which works fine on non-modal pages). The anchor is styled to a zero-size,
// off-screen box so mounting it inside the modal's content causes no layout
// shift, and it is removed immediately after the click.
function resolveDownloadHost(): HTMLElement {
  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) {
    const dialog = active.closest('[role="dialog"], [aria-modal="true"]')
    if (dialog instanceof HTMLElement) return dialog
  }
  return document.body
}

export function downloadCSV({ filename, headers, rows }: CSVExportOptions): void {
  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSVCell).join(','))
    .join('\n')

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('downloadCSV requires a browser environment')
  }

  // Primary scheme: a Blob backed by an object URL — the canonical, memory-safe
  // way to hand a CSV to the browser download manager.
  let url: string
  if (typeof URL.createObjectURL === 'function') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    url = URL.createObjectURL(blob)
  } else {
    // Fallback for restricted/webview contexts where object URLs are not
    // available: a data: URI carries the same typed CSV + filename.
    url = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
  }

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  // Zero-size, off-screen mount point (see resolveDownloadHost) so it takes no
  // visual space whether appended to the dialog or to <body>.
  link.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
  const host = resolveDownloadHost()
  host.appendChild(link)
  link.click()
  host.removeChild(link)

  // Deferred revocation: releasing the object URL synchronously (or too soon
  // after click) can race the browser's download manager and abort the transfer
  // before it starts — the classic "toast says generated, but no file" failure.
  // Keep the URL alive well past the click so the download pipeline has ample
  // time to pick it up, then revoke once it can no longer be raced. Only object
  // URLs need revoking (data: URIs are self-contained).
  if (url.startsWith('blob:')) {
    window.setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}

// CSV / spreadsheet formula-injection guard (OWASP). A cell whose text
// begins with a formula trigger is neutralised by prefixing a single
// apostrophe, which Excel/Sheets/LibreOffice treat as "force text". The guard
// runs ONLY at the serialization boundary — stored values are never mutated.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'] as const

export function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
  if (FORMULA_TRIGGERS.some(prefix => str.startsWith(prefix))) {
    str = `'${str}`
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')
}
