import { useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

function sanitizeParam(value: string | null, maxLen = 100): string {
  if (!value) return 'all'
  // Preserve characters that legitimately appear in exam/paper/subject names
  // (e.g. "Computer & IT", "Economic & Social Issues", "Maths (Optional)").
  // These survive the URL round-trip (router encodes/decodes them) and are used
  // only in parameterized queries, so stripping them would break selection matching.
  const sanitized = value.slice(0, maxLen).replace(/[^A-Za-z0-9_\-\s&/().,+:'’]/g, '')
  return sanitized || 'all'
}

/* Topic param: '' (empty string) is the canonical "no topic yet" sentinel —
 * there is NO 'all topics' identity anymore. Missing/empty values sanitize to
 * '', so a topic-less URL scans as pending, never as "every topic". */
const sanitizeTopicParam = (value: string | null): string => {
  if (!value) return ''
  const sanitized = value.slice(0, 320).replace(/[^A-Za-z0-9_\-\s&/().,+:'’]/g, '')
  return sanitized
}

export function useAdminFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawExam = searchParams.get('exam')
  const rawPaper = searchParams.get('paper')
  const rawSubject = searchParams.get('subject')
  const rawTopic = searchParams.get('topic')

  const selectedExam = sanitizeParam(rawExam)
  const selectedPaper = sanitizeParam(rawPaper)
  const selectedSubject = sanitizeParam(rawSubject)
  const selectedTopic = sanitizeTopicParam(rawTopic)

  useEffect(() => {
    if (selectedExam === 'all') {
      updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all', topic: 'all' })
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
          if (value === 'all' || value === '') next.delete(key)
          else next.set(key, value)
        }
      })
      return changed ? next : prev
    }, { replace: true })
  }, [setSearchParams])

  // Cascade clears: an Exam change invalidates paper+subject+topic, a Paper
  // change invalidates subject+topic, a Subject change invalidates topic. The
  // topic belongs to a (exam, paper, subject) segment, so any ancestor change
  // must reset it to none ("") while child rows reload against live data.
  const setSelectedExam = useCallback((val: string) => updateParams({ exam: val, paper: 'all', subject: 'all', topic: 'all' }), [updateParams])
  const setSelectedPaper = useCallback((val: string) => updateParams({ paper: val, subject: 'all', topic: 'all' }), [updateParams])
  const setSelectedSubject = useCallback((val: string) => updateParams({ subject: val, topic: 'all' }), [updateParams])
  const setSelectedTopic = useCallback((val: string) => updateParams({ topic: val }), [updateParams])

  return {
    selectedExam,
    selectedPaper,
    selectedSubject,
    selectedTopic,
    setSelectedExam,
    setSelectedPaper,
    setSelectedSubject,
    setSelectedTopic,
  }
}
