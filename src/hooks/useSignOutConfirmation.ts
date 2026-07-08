import { useState, useCallback } from 'react'

interface UseSignOutConfirmationReturn {
  isOpen: boolean
  openDialog: () => void
  closeDialog: () => void
  handleConfirm: () => void
}

export function useSignOutConfirmation(onSignOut: () => Promise<void> | void): UseSignOutConfirmationReturn {
  const [isOpen, setIsOpen] = useState(false)

  const openDialog = useCallback(() => setIsOpen(true), [])
  const closeDialog = useCallback(() => setIsOpen(false), [])
  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    onSignOut()
  }, [onSignOut])

  return { isOpen, openDialog, closeDialog, handleConfirm }
}
