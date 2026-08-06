import { SectionHeader } from '../../../components/common/AntigravityUI'
import { PerformerList } from './ExamSubComponents'
import { useExamResponsive } from './useExamResponsive'
import { Award, ChevronUp, ChevronDown } from 'lucide-react'
import type { AttemptRow } from './types'

interface ExamPerformersProps {
  topPerformers: AttemptRow[]
  bottomPerformers: AttemptRow[]
  totalMarks: number
}

export function ExamPerformers({ topPerformers, bottomPerformers, totalMarks }: ExamPerformersProps) {
  const { isMobile, typography: { perfFont } } = useExamResponsive()

  return (
    <section aria-label="Top and bottom performers">
      <SectionHeader title="Top & Bottom Performers" icon={Award} />
      <div className={`mt-3 ${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
        <PerformerList
          title="Top 5"
          icon={<ChevronUp size={15} className="text-green-500" />}
          accent="text-green-500"
          border="border-green-500/15"
          bg="bg-green-500/5"
          performers={topPerformers}
          totalMarks={totalMarks}
          font={perfFont}
        />
        <PerformerList
          title="Bottom 5"
          icon={<ChevronDown size={15} className="text-red-400" />}
          accent="text-red-400"
          border="border-red-400/15"
          bg="bg-red-400/5"
          performers={bottomPerformers}
          totalMarks={totalMarks}
          font={perfFont}
        />
      </div>
    </section>
  )
}
