import { Tabs } from '../common/AntigravityUI'

interface ExamGroupBarProps {
  options: { label: string; id: string }[]
  activeId: string
  onChange: (id: string) => void
  bare?: boolean
  ariaLabel?: string
}

export function ExamGroupBar({ options, activeId, onChange, bare = false, ariaLabel }: ExamGroupBarProps) {
  return (
    <div className="md:flex md:justify-center">
      <Tabs
        options={options}
        activeId={activeId}
        onChange={onChange}
        bare={bare}
        ariaLabel={ariaLabel}
      />
    </div>
  )
}
