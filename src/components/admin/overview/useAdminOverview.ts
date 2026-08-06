import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveExamIds, KNOWN_EXAM_IDS } from '../../../lib/examUtils'

export function useAdminOverview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedExam = searchParams.get('exam') || 'all'

  const isValidExam = KNOWN_EXAM_IDS.includes(selectedExam)
  const resolvedIds = useMemo(() => isValidExam ? resolveExamIds(selectedExam) : [], [selectedExam, isValidExam])

  const setSelectedExam = useCallback((exam: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (exam === 'all') next.delete('exam')
      else next.set('exam', exam)
      return next
    }, { replace: true })
  }, [setSearchParams])

  return { selectedExam, setSelectedExam, isValidExam, resolvedIds }
}
