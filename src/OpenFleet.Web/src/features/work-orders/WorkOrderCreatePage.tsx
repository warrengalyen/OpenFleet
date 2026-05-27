import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { WorkOrderForm } from './WorkOrderForm'
import { useCreateWorkOrder } from './hooks'
import type { WorkOrderFormValues } from './schemas'

export function WorkOrderCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createWorkOrder = useCreateWorkOrder()

  async function handleSubmit(values: WorkOrderFormValues) {
    try {
      const workOrder = await createWorkOrder.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        vehicleId: values.vehicleId || undefined,
        assetId: values.assetId || undefined,
        assignedUserId: values.assignedUserId || undefined,
      })
      toast.success('Work order created')
      navigate(`/work-orders/${workOrder.id}`)
    } catch (err) {
      toast.error('Failed to create work order', getApiErrorMessage(err))
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
        <PageTitle title="New work order" subtitle="Create a maintenance or repair work order" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <WorkOrderForm
            onSubmit={handleSubmit}
            submitLabel="Create work order"
            isLoading={createWorkOrder.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
