import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import {
  workOrderStatusLabel,
  workOrderStatusVariant,
  workOrderPriorityLabel,
  workOrderPriorityVariant,
  formatDate,
} from '@/lib/formatters'
import { DashboardPanel } from './DashboardPanel'
import { useOpenWorkOrders } from './hooks'

export function OpenWorkOrdersTable() {
  const { data, isLoading, isError, isFetching, refetch } = useOpenWorkOrders()

  return (
    <DashboardPanel
      title="Open Work Orders"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.items.length === 0}
      emptyIcon={ClipboardList}
      emptyTitle="No open work orders"
      emptyDescription="All caught up — no work orders require attention right now."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left dark:border-gray-800">
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                Title
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Priority
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Vehicle
              </th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 dark:text-gray-400 sm:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((wo) => (
              <tr
                key={wo.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/50"
              >
                <td className="max-w-xs truncate px-6 py-3 font-medium text-gray-900 dark:text-white">
                  {wo.title}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={workOrderStatusVariant[wo.status]}>
                    {workOrderStatusLabel[wo.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={workOrderPriorityVariant[wo.priority]}>
                    {workOrderPriorityLabel[wo.priority]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {wo.vehicleLabel ?? '—'}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400 sm:table-cell">
                  {formatDate(wo.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  )
}
