import { AlertTriangle } from 'lucide-react'
import { DashboardPanel } from '../DashboardPanel'
import { BarChart, type BarChartItem } from '../charts/BarChart'
import { useWorkOrdersByPriority } from '../hooks'

export function WorkOrdersByPriorityChart() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkOrdersByPriority()

  const items: BarChartItem[] = data
    ? [
        { label: 'Low', value: data.low, color: '#9ca3af' },
        { label: 'Medium', value: data.medium, color: '#3b82f6' },
        { label: 'High', value: data.high, color: '#f59e0b' },
        { label: 'Critical', value: data.critical, color: '#ef4444' },
      ]
    : []

  return (
    <DashboardPanel
      title="Work Orders by Priority"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.total === 0}
      emptyIcon={AlertTriangle}
      emptyTitle="No work orders"
      emptyDescription="Priority breakdown will appear once work orders exist."
      contentClassName="p-6"
    >
      <BarChart items={items} />
    </DashboardPanel>
  )
}
