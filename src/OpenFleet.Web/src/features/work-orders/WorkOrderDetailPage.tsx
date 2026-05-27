import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import {
  formatDate,
  formatDateTime,
  workOrderPriorityLabel,
  workOrderPriorityVariant,
  workOrderStatusLabel,
  workOrderStatusVariant,
} from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { useCancelWorkOrder, useWorkOrder } from './hooks'
import { WorkOrderStatusActions } from './WorkOrderStatusActions'
import { WorkOrderNotes } from './WorkOrderNotes'
import { WorkOrderLaborForm } from './WorkOrderLaborForm'
import { MaintenanceRecordSection } from './MaintenanceRecordSection'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function WorkOrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)
  const toast = useToast()
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: workOrder, isLoading, isError, refetch } = useWorkOrder(id)
  const cancelWorkOrder = useCancelWorkOrder()

  if (isLoading) return <LoadingSpinner />

  if (isError || !workOrder) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Work order not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/work-orders" className="text-sm text-brand-600 hover:underline">
            Back to work orders
          </Link>
        </div>
      </div>
    )
  }

  const isTerminal = workOrder.status === 'Completed' || workOrder.status === 'Cancelled'

  async function handleCancel() {
    try {
      await cancelWorkOrder.mutateAsync(id)
      toast.success('Work order cancelled')
      navigate('/work-orders')
    } catch (err) {
      toast.error('Failed to cancel work order', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/work-orders"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to work orders"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title={workOrder.title} subtitle={`Created ${formatDate(workOrder.createdAt)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={workOrderStatusVariant[workOrder.status]}>
          {workOrderStatusLabel[workOrder.status]}
        </Badge>
        <Badge variant={workOrderPriorityVariant[workOrder.priority]}>
          {workOrderPriorityLabel[workOrder.priority]}
        </Badge>
      </div>

      {canWrite && !isTerminal && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/work-orders/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {workOrder.allowedNextStatuses.includes('Cancelled') && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel work order
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {workOrder.description && (
                <div>
                  <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">Description</dt>
                  <dd className="text-sm text-gray-800 dark:text-gray-200">{workOrder.description}</dd>
                </div>
              )}
              <DetailRow
                label="Vehicle"
                value={workOrder.vehicleDescription ?? '—'}
              />
              <DetailRow label="Asset" value={workOrder.assetDescription ?? '—'} />
              <DetailRow label="Technician" value={workOrder.assignedUserName ?? 'Unassigned'} />
              <DetailRow label="Last updated" value={formatDateTime(workOrder.updatedAt)} />
              {workOrder.completedAt && (
                <DetailRow label="Completed" value={formatDateTime(workOrder.completedAt)} />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status actions</CardTitle>
          </CardHeader>
          <CardContent>
            {canWrite ? (
              <WorkOrderStatusActions workOrder={workOrder} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You do not have permission to change work order status.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Labor hours</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrderLaborForm workOrder={workOrder} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance record</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceRecordSection workOrder={workOrder} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes ({workOrder.noteCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderNotes workOrderId={id} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel work order?"
        description="This will transition the work order to Cancelled. This action follows the same rules as a status transition."
        confirmLabel="Cancel work order"
        variant="danger"
      />
    </div>
  )
}
