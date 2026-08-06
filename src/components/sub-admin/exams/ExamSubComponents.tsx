import type { AttemptRow } from './types'

export async function copyToClipboard(text: string, onSuccess: () => void) {
  try {
    await navigator.clipboard.writeText(text)
    onSuccess()
  } catch {
    /* silent */
  }
}

export function StatChip({ label, value, color, font }: { label: string; value: number; color: string; font: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-[var(--text-muted)]" style={{ fontSize: font }}>{label}:</span>
      <span className={`font-black ${color}`} style={{ fontSize: font }}>{value}</span>
    </div>
  )
}

export function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1 ? 'bg-amber-400/20 text-amber-400' :
      rank === 2 ? 'bg-slate-400/20 text-[var(--text-muted)]' :
    rank === 3 ? 'bg-orange-400/20 text-orange-400' :
    'bg-border-subtle/15 text-text-secondary'
  return (
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${colors}`}>
      {rank}
    </div>
  )
}

export function AccuracyBadge({ acc }: { acc: number }) {
  const color = acc >= 70 ? 'text-green-500' : acc >= 40 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{isNaN(acc) ? '—' : `${acc.toFixed(1)}%`}</span>
}

export function Dot() {
  return <span className="text-border-subtle opacity-40">·</span>
}

export function PerformerList({
  title, icon, accent, border, bg, performers, totalMarks, font
}: {
  title: string
  icon: React.ReactNode
  accent: string
  border: string
  bg: string
  performers: AttemptRow[]
  totalMarks: number
  font: string
}) {
  return (
    <div className={`${bg} border ${border} rounded-2xl overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${border} flex items-center gap-2`}>
        {icon}
        <span className={`font-bold uppercase tracking-widest text-[11px] ${accent}`}>{title}</span>
      </div>
      <div className="divide-y divide-border-subtle/10">
        {performers.length === 0 ? (
          <div className="px-4 py-5 text-center text-text-secondary font-medium" style={{ fontSize: font }}>
            No data
          </div>
        ) : performers.map((p, i) => (
          <div key={p.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-card-bg border border-border-subtle/20 flex items-center justify-center font-bold text-[10px] text-text-secondary shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary truncate" style={{ fontSize: font }}>
                {p.users?.full_name ?? 'Unknown'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black ${accent}`} style={{ fontSize: font }}>
                {p.score} / {totalMarks}
              </p>
              <p className="text-[var(--text-muted)] text-[10px]">
                {Number(p.accuracy).toFixed(1)}% acc
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
