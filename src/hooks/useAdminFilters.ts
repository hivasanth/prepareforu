import { useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

function sanitizeParam(value: string | null, maxLen = 100): string {
  if (!value) return 'all'
  const sanitized = value.slice(0, maxLen).replace(/[^A-Za-z0-9_\-\s]/g, '')
  return sanitized || 'all'
}

export function useAdminFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawExam = searchParams.get('exam')
  const rawPaper = searchParams.get('paper')
  const rawSubject = searchParams.get('subject')

  const selectedExam = sanitizeParam(rawExam)
  const selectedPaper = sanitizeParam(rawPaper)
  const selectedSubject = sanitizeParam(rawSubject)

  useEffect(() => {
    if (selectedExam === 'all') {
      updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' })
    }
  }, [selectedExam])

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false
      Object.entries(updates).forEach(([key, value]) => {
        const current = prev.get(key) || 'all'
        if (current !== value) {
          changed = true
          if (value === 'all') next.delete(key)
          else next.set(key, value)
        }
      })
      return changed ? next : prev
    }, { replace: true })
  }, [setSearchParams])

  const setSelectedExam = useCallback((val: string) => updateParams({ exam: val, paper: 'all', subject: 'all' }), [updateParams])
  const setSelectedPaper = useCallback((val: string) => updateParams({ paper: val, subject: 'all' }), [updateParams])
  const setSelectedSubject = useCallback((val: string) => updateParams({ subject: val }), [updateParams])

  return {
    selectedExam,
    selectedPaper,
    selectedSubject,
    setSelectedExam,
    setSelectedPaper,
    setSelectedSubject,
  }
}
