import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, formatNumber } from '@/lib/formatters'
import {
  canRetryIntegration,
  integrationDirectionLabel,
  integrationSourceLabel,
} from '@/lib/integrations'
import { useToast } from '@/components/ui/Toaster'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'
import { JsonPayloadPanel } from './JsonPayloadPanel'
import { useIntegration, useRetryIntegration } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function IntegrationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canSync = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const toast = useToast()

  const { data: log, isLoading, isError, refetch } = useIntegration(id)
  const retryIntegration = useRetryIntegration()

  if (isLoading) return <LoadingSpinner />

  if (isError || !log) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Integration log not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/integrations" className="text-sm text-brand-600 hover:underline">
            Back to integrations
          </Link>
        </div>
      </div>
    )
  }

  const showRetry = canSync && canRetryIntegration(log.status)

  async function handleRetry() {
    try {
      const updated = await retryIntegration.mutateAsync(id)
      if (updated.status === 'Success') {
        toast.success('Sync retry succeeded', `${updated.recordsProcessed ?? 0} records processed`)
      } else {
        toast.error('Sync retry failed', updated.errorMessage ?? 'The connector reported a failure.')
      }
    } catch (err) {
      toast.error('Failed to retry sync', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/integrations?tab=history"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to integrations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle
          title={integrationSourceLabel[log.source]}
          subtitle={`${integrationDirectionLabel[log.direction]} · ${formatDateTime(log.createdAt)}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <IntegrationStatusBadge status={log.status} className="text-base px-3 py-1" />
      </div>

      {log.status === 'Failed' && log.errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p className="font-medium">Sync failed</p>
          <p className="mt-1">{log.errorMessage}</p>
        </div>
      )}

      {log.status === 'Retrying' && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <p className="font-medium">Retry scheduled</p>
          <p className="mt-1">
            {log.nextRetryAt
              ? `Next automatic retry at ${formatDateTime(log.nextRetryAt)}`
              : 'Waiting for the next retry attempt.'}
            {log.errorMessage ? ` Last error: ${log.errorMessage}` : ''}
          </p>
        </div>
      )}

      {showRetry && (
        <Button onClick={() => void handleRetry()} loading={retryIntegration.isPending}>
          <RefreshCw className="h-4 w-4" />
          Retry sync now
        </Button>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="System" value={integrationSourceLabel[log.source]} />
              <DetailRow label="Direction" value={integrationDirectionLabel[log.direction]} />
              <DetailRow label="Status" value={<IntegrationStatusBadge status={log.status} />} />
              <DetailRow
                label="Records processed"
                value={log.recordsProcessed != null ? formatNumber(log.recordsProcessed) : '-'}
              />
              <DetailRow label="Attempts" value={log.attemptCount} />
              <DetailRow
                label="Last attempt"
                value={log.lastAttemptAt ? formatDateTime(log.lastAttemptAt) : '-'}
              />
              <DetailRow
                label="Next retry"
                value={log.nextRetryAt ? formatDateTime(log.nextRetryAt) : '-'}
              />
              <DetailRow label="Created" value={formatDateTime(log.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(log.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        <JsonPayloadPanel payload={log.payload} />
      </div>

      {log.errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Error details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              {log.errorMessage}
            </pre>
          </CardContent>
        </Card>
      )}

      <div>
        <Button variant="ghost" onClick={() => navigate('/integrations?tab=history')}>
          Back to history
        </Button>
      </div>
    </div>
  )
}
