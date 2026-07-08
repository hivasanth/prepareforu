import { Tabs } from '../common/AntigravityUI'
import { LoadingSkeleton } from '../common/SharedComponents'

interface ExamGroupBarProps {
  options: { label: string; id: string }[]
  activeId: string
  onChange: (id: string) => void
  loading?: boolean
}

export function ExamGroupBar({ options, activeId, onChange, loading }: ExamGroupBarProps) {
  if (loading) {
    return (
      <div className="flex justify-center">
        <LoadingSkeleton height={44} width={320} borderRadius={14} />
      </div>
    )
  }

  return (
    <div className="md:flex md:justify-center">
      <Tabs
        options={options}
        activeId={activeId}
        onChange={onChange}
      />
    </div>
  )
}
