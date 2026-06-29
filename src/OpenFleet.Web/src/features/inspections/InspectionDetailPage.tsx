import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import {
  formatDateTime,
  inspectionStatusLabel,
  inspectionStatusVariant,
} from '@/lib/formatters'
import { useInspection } from './hooks'
import { FailedWorkOrderBanner } from './FailedWorkOrderBanner'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function InspectionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)

  const { data: inspection, isLoading, isError, refetch } = useInspection(id)

  if (isLoading) return <LoadingSpinner />

  if (isError || !inspection) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Inspection not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/inspections" className="text-sm text-brand-600 hover:underline">
            Back to inspections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/inspections"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to inspections"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle
          title="Inspection"
          subtitle={`Inspected ${formatDateTime(inspection.inspectedAt)}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={inspectionStatusVariant[inspection.status]} className="text-base px-3 py-1">
          {inspectionStatusLabel[inspection.status]}
        </Badge>
      </div>

      {inspection.status === 'Failed' && inspection.generatedWorkOrderId && (
        <FailedWorkOrderBanner workOrderId={inspection.generatedWorkOrderId} />
      )}

      {inspection.status === 'Failed' && !inspection.generatedWorkOrderId && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          This inspection is marked as failed. No linked work order was found - one may still be
          processing or was created separately.
        </div>
      )}

      {canWrite && (
        <Button variant="secondary" onClick={() => navigate(`/inspections/${id}/edit`)}>
          <Pencil className="h-4 w-4" />
          Update result / notes
        </Button>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inspection details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Result" value={inspectionStatusLabel[inspection.status]} />
              <DetailRow label="Inspected at" value={formatDateTime(inspection.inspectedAt)} />
              <DetailRow label="Inspector" value={inspection.inspectorName} />
              <DetailRow
                label="Vehicle"
                value={
                  inspection.vehicleId ? (
                    <Link
                      to={`/vehicles/${inspection.vehicleId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {inspection.vehicleDescription}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Asset"
                value={
                  inspection.assetId ? (
                    <Link
                      to={`/assets/${inspection.assetId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {inspection.assetDescription}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Work order"
                value={
                  inspection.generatedWorkOrderId ? (
                    <Link
                      to={`/work-orders/${inspection.generatedWorkOrderId}`}
                      className="text-brand-600 hover:underline"
                    >
                      View work order
                    </Link>
                  ) : (
                    'None'
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {inspection.notes ? (
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {inspection.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No notes recorded.</p>
            )}
            <dl className="mt-6 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <DetailRow label="Created" value={formatDateTime(inspection.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(inspection.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
