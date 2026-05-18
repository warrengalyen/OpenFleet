import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogBody, DialogFooter } from './Dialog'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm" closeOnBackdrop={!loading}>
      <DialogBody className="flex gap-4">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            variant === 'danger' ? 'bg-red-100 dark:bg-red-950' : 'bg-brand-100 dark:bg-brand-950',
          ].join(' ')}
        >
          <AlertTriangle
            className={[
              'h-5 w-5',
              variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400',
            ].join(' ')}
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          loading={loading}
          onClick={() => { void handleConfirm() }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
