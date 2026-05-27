import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { WorkOrderForm, workOrderToFormValues } from './WorkOrderForm'
import { useUpdateWorkOrder, useWorkOrder } from './hooks'
import type { WorkOrderFormValues } from './schemas'

export function WorkOrderEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: workOrder, isLoading } = useWorkOrder(id)
  const updateWorkOrder = useUpdateWorkOrder(id)

  async function handleSubmit(values: WorkOrderFormValues) {
    try {
      await updateWorkOrder.mutateAsync({
        title: values.title,
        description: values.description ?? '',
        priority: values.priority,
        vehicleId: values.vehicleId || null,
        assetId: values.assetId || null,
        assignedUserId: values.assignedUserId || null,
      })
      toast.success('Work order updated')
      navigate(`/work-orders/${id}`)
    } catch (err) {
      toast.error('Failed to update work order', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!workOrder) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Work order not found.{' '}
        <Link to="/work-orders" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  if (workOrder.status === 'Completed' || workOrder.status === 'Cancelled') {
    return (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Work orders in {workOrder.status} status cannot be edited.
        </p>
        <Link to={`/work-orders/${id}`} className="text-sm text-brand-600 hover:underline">
          Back to work order
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/work-orders/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to work order"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Edit work order" subtitle={workOrder.title} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <WorkOrderForm
            defaultValues={workOrderToFormValues(workOrder)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateWorkOrder.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
