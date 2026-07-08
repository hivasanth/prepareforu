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
