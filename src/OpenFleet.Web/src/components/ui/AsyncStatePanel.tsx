import { AlertCircle } from 'lucide-react'
import { type ReactNode } from 'react'
import { Button } from './Button'
import { EmptyState } from '@/components/EmptyState'
import { PanelSkeleton } from './Skeleton'
import { Spinner } from './Spinner'
import { type LucideIcon } from 'lucide-react'

interface AsyncStatePanelProps {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  onRetry: () => void
  errorMessage?: string
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  loadingLabel?: string
  useSkeleton?: boolean
  children: ReactNode
}

export function AsyncStatePanel({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  errorMessage = 'Failed to load data.',
  emptyIcon,
  emptyTitle = 'No data',
  emptyDescription,
  loadingLabel = 'Loading data',
  useSkeleton = false,
  children,
}: AsyncStatePanelProps) {
  if (isLoading) {
    if (useSkeleton) {
      return <PanelSkeleton />
    }
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label={loadingLabel}>
        <Spinner size="lg" />
        <span className="sr-only">{loadingLabel}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center gap-3 px-6 py-12 text-center"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{errorMessage}</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="p-6">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return <>{children}</>
}
