import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DollarSign } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { exportToCsv } from '@/lib/csv'
import { formatNumber } from '@/lib/formatters'
import { BarChart } from '@/features/dashboard/charts/BarChart'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { useMaintenanceCostReport } from '../hooks'

export function MaintenanceCostReportView() {
  const navigate = useNavigate()
  const { data, isLoading, isError, isFetching, refetch } = useMaintenanceCostReport()

  const vehicles = useMemo(() => data?.vehicles ?? [], [data])
  const chartItems = useMemo(
    () =>
      [...vehicles]
        .sort((a, b) => b.totalLaborHours - a.totalLaborHours)
        .slice(0, 8)
        .map((v) => ({
          label: v.vehicleLabel,
          value: v.totalLaborHours,
          color: '#3b82f6',
        })),
    [vehicles],
  )

  function handleExport() {
    exportToCsv(
      'maintenance-cost-by-vehicle',
      ['Vehicle', 'Total Labor Hours', 'Completed Work Orders'],
      vehicles.map((v) => [
        v.vehicleLabel,
        String(v.totalLaborHours),
        String(v.completedWorkOrders),
      ]),
    )
  }

  return (
    <ReportShell
      title="Maintenance Cost by Vehicle"
      description="Labor hours and completed work orders per vehicle."
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={vehicles.length === 0}
      emptyIcon={DollarSign}
      emptyTitle="No maintenance cost data"
      emptyDescription="Completed work orders with labor hours will populate this report."
      onExportCsv={handleExport}
      filters={<ReportFilters range={{}} onChange={() => {}} showDateFilter={false} />}
    >
      <div className="space-y-8">
        {chartItems.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Top vehicles by labor hours
            </h3>
            <BarChart items={chartItems} />
          </div>
        )}

        <DataTable
          columns={[
            {
              key: 'vehicleLabel',
              header: 'Vehicle',
              sortable: true,
              render: (row) => (
                <Link
                  to={`/vehicles/${row.vehicleId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {row.vehicleLabel}
                </Link>
              ),
            },
            {
              key: 'totalLaborHours',
              header: 'Labor hours',
              sortable: true,
              render: (row) => formatNumber(row.totalLaborHours),
            },
            {
              key: 'completedWorkOrders',
              header: 'Completed WOs',
              sortable: true,
              render: (row) => row.completedWorkOrders,
            },
          ]}
          data={vehicles}
          getRowKey={(row) => row.vehicleId}
          onRowClick={(row) => navigate(`/vehicles/${row.vehicleId}`)}
        />
      </div>
    </ReportShell>
  )
}
