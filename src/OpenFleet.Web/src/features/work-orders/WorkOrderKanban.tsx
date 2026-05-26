import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import {
  workOrderPriorityLabel,
  workOrderPriorityVariant,
  workOrderStatusLabel,
} from '@/lib/formatters'
import type { WorkOrderResponse, WorkOrderStatus } from '@/types'
import { KANBAN_COLUMNS } from './hooks'

interface WorkOrderKanbanProps {
  workOrders: WorkOrderResponse[]
  isLoading?: boolean
}

const COLUMN_STYLES: Record<WorkOrderStatus, string> = {
  Open: 'border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/30',
  InProgress: 'border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/30',
  WaitingForParts:
    'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30',
  Completed:
    'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30',
  Cancelled: 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30',
}

export function WorkOrderKanban({ workOrders, isLoading }: WorkOrderKanbanProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((status) => (
          <div
            key={status}
            className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
            aria-hidden
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {KANBAN_COLUMNS.map((status) => {
        const items = workOrders.filter((wo) => wo.status === status)
        return (
          <div
            key={status}
            className={clsx('flex flex-col rounded-xl border p-3', COLUMN_STYLES[status])}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {workOrderStatusLabel[status]}
              </h3>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-900/80 dark:text-gray-400">
                {items.length}
              </span>
            </div>

            <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {items.length === 0 ? (
                <li className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-700">
                  No work orders
                </li>
              ) : (
                items.map((wo) => (
                  <li key={wo.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/work-orders/${wo.id}`)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-brand-300 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-700"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                        {wo.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant={workOrderPriorityVariant[wo.priority]} className="text-xs">
                          {workOrderPriorityLabel[wo.priority]}
                        </Badge>
                        {wo.assignedUserName && (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {wo.assignedUserName}
                          </span>
                        )}
                      </div>
                      {(wo.vehicleDescription || wo.assetDescription) && (
                        <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                          {wo.vehicleDescription ?? wo.assetDescription}
                        </p>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
