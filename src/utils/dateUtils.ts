export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-US', options)
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, { month: 'short', day: 'numeric' })
}

export function formatDateJoined(date: string | Date): string {
  return `Joined ${formatDate(date)}`
}

export function formatDateDDMMYYYY(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Local-calendar month key ("YYYY-MM") for a timestamp. Uses the LOCAL
// calendar domain so it matches month-picker labels rendered via
// toLocaleString and dates displayed via toLocaleDateString; never slice a UTC
// ISO prefix, which drifts from the calendar month under non-UTC timezones.
export function getLocalMonthKey(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
