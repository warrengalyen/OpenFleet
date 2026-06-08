import { type ReactNode } from 'react'
import { AlertCircle, Download, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { type LucideIcon } from 'lucide-react'
import { isQueryLoadFailure } from '@/lib/query'

interface ReportShellProps {
  title: string
  description?: string
  isLoading: boolean
  isError: boolean
  data: unknown
  onRetry: () => void
  isFetching?: boolean
  isEmpty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  onExportCsv?: () => void
  exportLabel?: string
  filters?: ReactNode
  children: ReactNode
}

export function ReportShell({
  title,
  description,
  isLoading,
  isError,
  data,
  onRetry,
  isFetching,
  isEmpty,
  emptyIcon,
  emptyTitle = 'No data',
  emptyDescription,
  onExportCsv,
  exportLabel = 'Export CSV',
  filters,
  children,
}: ReportShellProps) {
  const loadFailed = isQueryLoadFailure(isError, data)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {onExportCsv && !loadFailed && !isEmpty && (
            <Button variant="secondary" size="sm" onClick={onExportCsv}>
              <Download className="h-4 w-4" />
              {exportLabel}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRetry} disabled={isFetching}>
            <RefreshCw className={clsx('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {filters}

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : loadFailed ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load this report.</p>
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="p-8">
              <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            <div className="p-6">{children}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
