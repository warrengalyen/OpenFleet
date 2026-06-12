import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { EmptyState } from '@/components/EmptyState'
import { auditActionLabel, auditActionVariant, formatDateTime } from '@/lib/formatters'
import { isQueryLoadFailure } from '@/lib/query'
import type { AuditAction, AuditLogResponse } from '@/types/audit'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useAuditLogs } from './hooks'

const PAGE_SIZE = 50

const ACTION_OPTIONS = Object.keys(auditActionLabel) as AuditAction[]

export function AuditPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const filter = useMemo(
    () => ({
      action: (searchParams.get('action') as AuditAction) || undefined,
      entityType: searchParams.get('entityType') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [searchParams, page],
  )

  const { data, isLoading, isError, refetch, isFetching } = useAuditLogs(filter)
  const loadFailed = isQueryLoadFailure(isError, data)
  const logs = data ?? []
  const hasMore = logs.length === PAGE_SIZE

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  const hasFilters =
    !!searchParams.get('action') ||
    !!searchParams.get('entityType') ||
    !!searchParams.get('dateFrom') ||
    !!searchParams.get('dateTo')

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Audit Logs" />

      <PageTitle
        title="Audit Logs"
        subtitle="Immutable history of changes to vehicles, work orders, users, and inventory"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select
          value={searchParams.get('action') ?? ''}
          onChange={(e) => updateParams({ action: e.target.value || null, page: '1' })}
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((action) => (
            <option key={action} value={action}>
              {auditActionLabel[action]}
            </option>
          ))}
        </Select>

        <Input
          value={searchParams.get('entityType') ?? ''}
          onChange={(e) => updateParams({ entityType: e.target.value || null, page: '1' })}
          placeholder="Entity type (e.g. Vehicle)"
          aria-label="Filter by entity type"
        />

        <Input
          type="date"
          value={searchParams.get('dateFrom') ?? ''}
          onChange={(e) => updateParams({ dateFrom: e.target.value || null, page: '1' })}
          aria-label="From date"
        />

        <Input
          type="date"
          value={searchParams.get('dateTo') ?? ''}
          onChange={(e) => updateParams({ dateTo: e.target.value || null, page: '1' })}
          aria-label="To date"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" onClick={() => updateParams({ action: null, entityType: null, dateFrom: null, dateTo: null, page: '1' })}>
          Clear filters
        </Button>
      )}

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load audit logs."
        onRetry={() => void refetch()}
      />

      {!loadFailed && !isLoading && logs.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No audit entries"
          description={
            hasFilters
              ? 'No entries match the current filters.'
              : 'Activity will appear here as changes are recorded.'
          }
        />
      )}

      {!loadFailed && (isLoading || logs.length > 0) && (
        <>
          <DataTable<AuditLogResponse>
            isLoading={isLoading}
            columns={[
              {
                key: 'action',
                header: 'Action',
                render: (row) => (
                  <Badge variant={auditActionVariant[row.action]}>
                    {auditActionLabel[row.action]}
                  </Badge>
                ),
              },
              {
                key: 'entityType',
                header: 'Entity',
                render: (row) => (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{row.entityType}</p>
                    {row.entityId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.entityId}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'changedBy',
                header: 'Changed by',
                render: (row) => row.changedBy ?? '—',
              },
              {
                key: 'createdAt',
                header: 'When',
                sortable: true,
                render: (row) => formatDateTime(row.createdAt),
              },
            ]}
            data={logs}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/admin/audit/${row.id}`)}
          />

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page}
              {isFetching && !isLoading ? ' · Refreshing…' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasMore}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
