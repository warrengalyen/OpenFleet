import { Link } from 'react-router-dom'
import { PlugZap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { integrationSourceLabel } from '@/lib/integrations'
import { formatDateTime } from '@/lib/formatters'
import { DashboardPanel } from './DashboardPanel'
import { useIntegrationFailures } from './hooks'

export function IntegrationFailuresPanel() {
  const { data, isLoading, isError, isFetching, refetch } = useIntegrationFailures()

  return (
    <DashboardPanel
      title="Recent Integration Failures"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.items.length === 0}
      emptyIcon={PlugZap}
      emptyTitle="No recent failures"
      emptyDescription="All integration syncs completed successfully."
    >
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {data?.items.map((log) => (
          <li key={log.id} className="px-6 py-4">
            <Link to={`/integrations/${log.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {integrationSourceLabel[log.source]}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {log.errorMessage ?? 'Unknown error'}
                </p>
              </div>
              <Badge variant="danger">{log.status}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{formatDateTime(log.createdAt)}</span>
              {log.attemptCount > 1 && (
                <span>{log.attemptCount} attempts</span>
              )}
            </div>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  )
}
