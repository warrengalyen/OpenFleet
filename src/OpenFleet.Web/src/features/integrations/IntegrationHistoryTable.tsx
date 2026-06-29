import { useNavigate } from 'react-router-dom'
import { PlugZap } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { formatDateTime, formatNumber } from '@/lib/formatters'
import {
  integrationDirectionLabel,
  integrationSourceLabel,
} from '@/lib/integrations'
import { isQueryLoadFailure } from '@/lib/query'
import type { IntegrationLogResponse } from '@/types'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'

interface IntegrationHistoryTableProps {
  data: IntegrationLogResponse[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  showDirection?: boolean
}

export function IntegrationHistoryTable({
  data,
  isLoading,
  isError,
  onRetry,
  showDirection = true,
}: IntegrationHistoryTableProps) {
  const navigate = useNavigate()
  const loadFailed = isQueryLoadFailure(isError, data)

  if (loadFailed) {
    return (
      <QueryErrorBanner
        show
        message="Failed to load integration history."
        onRetry={onRetry}
      />
    )
  }

  return (
    <DataTable<IntegrationLogResponse>
      columns={[
        {
          key: 'source',
          header: 'System',
          sortable: true,
          render: (row) => (
            <span className="font-medium text-gray-900 dark:text-white">
              {integrationSourceLabel[row.source]}
            </span>
          ),
        },
        ...(showDirection
          ? [
              {
                key: 'direction',
                header: 'Direction',
                className: 'hidden sm:table-cell',
                headerClassName: 'hidden sm:table-cell',
                render: (row: IntegrationLogResponse) =>
                  integrationDirectionLabel[row.direction],
              } as const,
            ]
          : []),
        {
          key: 'status',
          header: 'Status',
          render: (row) => <IntegrationStatusBadge status={row.status} />,
        },
        {
          key: 'recordsProcessed',
          header: 'Records',
          className: 'hidden md:table-cell',
          headerClassName: 'hidden md:table-cell',
          render: (row) =>
            row.recordsProcessed != null ? formatNumber(row.recordsProcessed) : '-',
        },
        {
          key: 'errorMessage',
          header: 'Error',
          className: 'hidden lg:table-cell max-w-xs',
          headerClassName: 'hidden lg:table-cell',
          render: (row) => (
            <span className="truncate text-red-600 dark:text-red-400">
              {row.errorMessage ?? '-'}
            </span>
          ),
        },
        {
          key: 'createdAt',
          header: 'Timestamp',
          sortable: true,
          render: (row) => formatDateTime(row.createdAt),
        },
        {
          key: 'attemptCount',
          header: 'Attempts',
          className: 'hidden sm:table-cell',
          headerClassName: 'hidden sm:table-cell',
          render: (row) => row.attemptCount,
        },
      ]}
      data={data}
      isLoading={isLoading}
      getRowKey={(row) => row.id}
      onRowClick={(row) => navigate(`/integrations/${row.id}`)}
      emptyIcon={PlugZap}
      emptyTitle="No integration activity"
      emptyDescription="Trigger a sync from the dashboard to see history here."
    />
  )
}
