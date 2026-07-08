import { useEffect } from 'react'

const BASE = 'PrepareForU'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — ${BASE}`
    return () => { document.title = BASE }
  }, [title])
}
