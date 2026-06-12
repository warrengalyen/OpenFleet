import { Link, useParams } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { auditActionLabel, auditActionVariant, formatDateTime } from '@/lib/formatters'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useAuditLog } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

function ValueBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {value}
      </pre>
    </div>
  )
}

export function AuditDetailPage() {
  const { id = '' } = useParams()
  const { data: log, isLoading, isError, refetch } = useAuditLog(id)

  if (isLoading) return <LoadingSpinner />

  if (isError || !log) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Audit entry not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/admin/audit" className="text-sm text-brand-600 hover:underline">
            Back to audit logs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Audit Logs" />

      <PageTitle
        title={auditActionLabel[log.action]}
        subtitle={formatDateTime(log.createdAt)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Entry details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-4">
            <DetailRow
              label="Action"
              value={
                <Badge variant={auditActionVariant[log.action]}>
                  {auditActionLabel[log.action]}
                </Badge>
              }
            />
            <DetailRow label="Entity type" value={log.entityType} />
            <DetailRow label="Entity ID" value={log.entityId ?? '—'} />
            <DetailRow label="Changed by" value={log.changedBy ?? '—'} />
            <DetailRow label="Recorded at" value={formatDateTime(log.createdAt)} />
          </dl>

          {log.notes && (
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <DetailRow label="Notes" value={log.notes} />
            </div>
          )}
        </CardContent>
      </Card>

      {(log.oldValue || log.newValue) && (
        <Card>
          <CardHeader>
            <CardTitle>Change payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValueBlock label="Previous value" value={log.oldValue} />
            <ValueBlock label="New value" value={log.newValue} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
