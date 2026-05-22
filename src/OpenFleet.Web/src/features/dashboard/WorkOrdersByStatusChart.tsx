import { ClipboardList } from 'lucide-react'
import { DashboardPanel } from './DashboardPanel'
import { BarChart, type BarChartItem } from './charts/BarChart'
import { useWorkOrdersByStatus } from './hooks'

const STATUS_COLORS: BarChartItem[] = [
  { label: 'Open', value: 0, color: '#0ea5e9' },
  { label: 'In Progress', value: 0, color: '#3b82f6' },
  { label: 'Waiting for Parts', value: 0, color: '#f59e0b' },
  { label: 'Completed', value: 0, color: '#10b981' },
  { label: 'Cancelled', value: 0, color: '#9ca3af' },
]

export function WorkOrdersByStatusChart() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkOrdersByStatus()

  const items: BarChartItem[] = data
    ? [
        { label: 'Open', value: data.open, color: '#0ea5e9' },
        { label: 'In Progress', value: data.inProgress, color: '#3b82f6' },
        { label: 'Waiting for Parts', value: data.waitingForParts, color: '#f59e0b' },
        { label: 'Completed', value: data.completed, color: '#10b981' },
        { label: 'Cancelled', value: data.cancelled, color: '#9ca3af' },
      ]
    : STATUS_COLORS

  return (
    <DashboardPanel
      title="Work Orders by Status"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.total === 0}
      emptyIcon={ClipboardList}
      emptyTitle="No work orders"
      emptyDescription="Work orders will appear here once created."
      contentClassName="p-6"
    >
      <BarChart items={items} />
    </DashboardPanel>
  )
}
