import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveExamIds, KNOWN_EXAM_IDS } from '../../../lib/examUtils'

export function useAdminOverview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawExam = searchParams.get('exam') || 'all'

  // Single source of truth: an unknown/deep-linked ?exam= value behaves as
  // 'all' EVERYWHERE — tabs, resolvedIds and query keys. This makes an invalid
  // URL parameter impossible to produce a hybrid filtered/global state while
  // the raw URL is preserved temporarily (no history pollution).
  const isValidExam = KNOWN_EXAM_IDS.includes(rawExam)
  const selectedExam = isValidExam ? rawExam : 'all'

  const resolvedIds = useMemo(() => resolveExamIds(selectedExam), [selectedExam])

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
