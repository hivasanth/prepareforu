export function StatChip({ label, value, color, font }: { label: string; value: number; color: string; font: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-[var(--text-muted)]" style={{ fontSize: font }}>{label}:</span>
      <span className={`font-black ${color}`} style={{ fontSize: font }}>{value}</span>
    </div>
  )
}