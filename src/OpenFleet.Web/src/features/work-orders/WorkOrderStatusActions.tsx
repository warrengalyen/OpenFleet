import { getApiErrorMessage } from '@/lib/api'
import { workOrderStatusLabel } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { Button } from '@/components/ui/Button'
import type { WorkOrderResponse, WorkOrderStatus } from '@/types'
import { useTransitionWorkOrderStatus } from './hooks'

interface WorkOrderStatusActionsProps {
  workOrder: WorkOrderResponse
}

export function WorkOrderStatusActions({ workOrder }: WorkOrderStatusActionsProps) {
  const toast = useToast()
  const transition = useTransitionWorkOrderStatus(workOrder.id)

  async function handleTransition(newStatus: WorkOrderStatus) {
    try {
      await transition.mutateAsync({ newStatus })
      toast.success(
        'Status updated',
        `Work order moved to ${workOrderStatusLabel[newStatus]}.`,
      )
    } catch (err) {
      toast.error('Status update failed', getApiErrorMessage(err))
    }
  }

  if (workOrder.allowedNextStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No further status transitions available.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {workOrder.allowedNextStatuses.map((status) => (
        <Button
          key={status}
          variant={status === 'Cancelled' ? 'danger' : 'secondary'}
          size="sm"
          loading={transition.isPending}
          onClick={() => void handleTransition(status)}
        >
          Move to {workOrderStatusLabel[status]}
        </Button>
      ))}
    </div>
  )
}
