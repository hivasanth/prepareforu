export interface CSVExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export function downloadCSV({ filename, headers, rows }: CSVExportOptions): void {
  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSVCell).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')
}
