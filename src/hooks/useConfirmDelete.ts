import { useState, useCallback } from 'react'

interface UseConfirmDeleteOptions<T> {
  onDelete: (item: T) => Promise<void>
  onSuccess?: () => void
}

export function useConfirmDelete<T extends { id: string }>({ onDelete, onSuccess }: UseConfirmDeleteOptions<T>) {
  const [item, setItem] = useState<T | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = useCallback((target: T) => {
    setItem(target)
  }, [])

  const cancelDelete = useCallback(() => {
    setItem(null)
  }, [])

  const executeDelete = useCallback(async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      await onDelete(item)
      setItem(null)
      onSuccess?.()
    } finally {
      setIsDeleting(false)
    }
  }, [item, onDelete, onSuccess])

  return { item, isDeleting, confirmDelete, cancelDelete, executeDelete }
}
