import { useMemo } from 'react'
import { Wrench } from 'lucide-react'
import { exportToCsv } from '@/lib/csv'
import { BarChart, DonutChart } from '@/features/dashboard/charts/BarChart'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { useWorkOrdersByPriorityReport } from '../hooks'

export function WorkOrdersByPriorityReportView() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkOrdersByPriorityReport()

  const items = useMemo(
    () =>
      data
        ? [
            { label: 'Low', value: data.low, color: '#9ca3af' },
            { label: 'Medium', value: data.medium, color: '#3b82f6' },
            { label: 'High', value: data.high, color: '#f59e0b' },
            { label: 'Critical', value: data.critical, color: '#ef4444' },
          ]
        : [],
    [data],
  )

  function handleExport() {
    if (!data) return
    exportToCsv('work-orders-by-priority', ['Priority', 'Count'], [
      ['Low', String(data.low)],
      ['Medium', String(data.medium)],
      ['High', String(data.high)],
      ['Critical', String(data.critical)],
      ['Total', String(data.total)],
    ])
  }

  return (
    <ReportShell
      title="Work Orders by Priority"
      description={`${data?.critical ?? 0} critical and ${data?.high ?? 0} high-priority work orders.`}
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={!!data && data.total === 0}
      emptyIcon={Wrench}
      emptyTitle="No work orders"
      emptyDescription="Priority breakdown will appear once work orders exist."
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
