import { useMemo } from 'react'
import { ClipboardList } from 'lucide-react'
import { exportToCsv } from '@/lib/csv'
import { BarChart, DonutChart } from '@/features/dashboard/charts/BarChart'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { useWorkOrdersByStatusReport } from '../hooks'

export function WorkOrdersByStatusReportView() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkOrdersByStatusReport()

  const items = useMemo(
    () =>
      data
        ? [
            { label: 'Open', value: data.open, color: '#0ea5e9' },
            { label: 'In Progress', value: data.inProgress, color: '#3b82f6' },
            { label: 'Waiting for Parts', value: data.waitingForParts, color: '#f59e0b' },
            { label: 'Completed', value: data.completed, color: '#10b981' },
            { label: 'Cancelled', value: data.cancelled, color: '#9ca3af' },
          ]
        : [],
    [data],
  )

  function handleExport() {
    if (!data) return
    exportToCsv('work-orders-by-status', ['Status', 'Count'], [
      ['Open', String(data.open)],
      ['In Progress', String(data.inProgress)],
      ['Waiting for Parts', String(data.waitingForParts)],
      ['Completed', String(data.completed)],
      ['Cancelled', String(data.cancelled)],
      ['Total', String(data.total)],
    ])
  }

  return (
    <ReportShell
      title="Work Orders by Status"
      description={`${data?.total ?? 0} total work orders in the fleet.`}
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={!!data && data.total === 0}
      emptyIcon={ClipboardList}
      emptyTitle="No work orders"
      emptyDescription="Work order status breakdown will appear once orders are created."
      onExportCsv={handleExport}
      filters={<ReportFilters range={{}} onChange={() => {}} showDateFilter={false} />}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DonutChart items={items} total={data?.total ?? 0} centerLabel="work orders" />
        <BarChart items={items} />
      </div>
    </ReportShell>
  )
}
