import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ClipboardList } from 'lucide-react'
import {
  workOrderStatusLabel,
  workOrderStatusVariant,
  workOrderPriorityLabel,
  workOrderPriorityVariant,
  formatDate,
} from '@/lib/formatters'
import { useOpenWorkOrders } from './hooks'

export function OpenWorkOrdersTable() {
  const { data, isLoading } = useOpenWorkOrders()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Work Orders</CardTitle>
        {isLoading && <Spinner size="sm" />}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !data?.items.length ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No open work orders"
              description="All caught up — no work orders require attention right now."
            />
          </div>
        ) : (
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
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((wo) => (
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
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(wo.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
