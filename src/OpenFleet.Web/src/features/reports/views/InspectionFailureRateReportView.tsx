import { useMemo } from 'react'
import { ShieldAlert } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { exportToCsv } from '@/lib/csv'
import { BarChart, DonutChart } from '@/features/dashboard/charts/BarChart'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { useInspectionFailureRateReport } from '../hooks'

export function InspectionFailureRateReportView() {
  const { data, isLoading, isError, isFetching, refetch } = useInspectionFailureRateReport()

  const topFailed = useMemo(() => data?.topFailedVehicles ?? [], [data])

  const outcomeItems = useMemo(
    () =>
      data
        ? [
            { label: 'Passed', value: data.passed, color: '#10b981' },
            { label: 'Failed', value: data.failed, color: '#ef4444' },
            { label: 'Needs Review', value: data.needsReview, color: '#f59e0b' },
          ]
        : [],
    [data],
  )

  const barItems = useMemo(
    () =>
      topFailed.map((v) => ({
        label: v.vehicleLabel ?? 'Unknown',
        value: v.failedCount,
        color: '#ef4444',
      })),
    [topFailed],
  )

  function handleExport() {
    exportToCsv(
      'inspection-failure-rate',
      ['Vehicle', 'Failed Inspections'],
      topFailed.map((v) => [v.vehicleLabel ?? 'Unknown', String(v.failedCount)]),
    )
  }

  return (
    <ReportShell
      title="Inspection Failure Rate"
      description={
        data
          ? `${data.failureRatePercent.toFixed(1)}% failure rate across ${data.totalInspections} inspections`
          : undefined
      }
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={!!data && data.totalInspections === 0}
      emptyIcon={ShieldAlert}
      emptyTitle="No inspections"
      emptyDescription="Inspection outcomes will appear once inspections are logged."
      onExportCsv={handleExport}
      filters={<ReportFilters range={{}} onChange={() => {}} showDateFilter={false} />}
    >
      <div className="space-y-8">
        {data && data.totalInspections > 0 && (
          <DonutChart
            items={outcomeItems}
            total={data.totalInspections}
            centerLabel="inspections"
          />
        )}

        {barItems.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Top vehicles by failed inspections
            </h3>
            <BarChart items={barItems} />
          </div>
        )}

        <DataTable
          columns={[
            {
              key: 'vehicleLabel',
              header: 'Vehicle',
              render: (row) => row.vehicleLabel ?? '—',
            },
            {
              key: 'failedCount',
              header: 'Failed inspections',
              sortable: true,
              render: (row) => row.failedCount,
            },
          ]}
          data={topFailed}
          getRowKey={(row) => row.vehicleId ?? `failed-${row.vehicleLabel}`}
        />
      </div>
    </ReportShell>
  )
}
