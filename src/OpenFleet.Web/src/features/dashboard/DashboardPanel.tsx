import { clsx } from 'clsx'
import { AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/EmptyState'

interface DashboardPanelProps {
  title: string
  isLoading: boolean
  isError: boolean
  isFetching?: boolean
  onRetry: () => void
  onRefresh?: () => void
  isEmpty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function DashboardPanel({
  title,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onRefresh,
  isEmpty,
  emptyIcon,
  emptyTitle = 'No data',
  emptyDescription,
  children,
  className,
  contentClassName,
}: DashboardPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && <Spinner size="sm" />}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              title="Refresh"
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <RefreshCw className={clsx('h-4 w-4', isFetching && 'animate-spin')} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className={clsx('p-0', contentClassName)}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Failed to load this section.
            </p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="p-6">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
