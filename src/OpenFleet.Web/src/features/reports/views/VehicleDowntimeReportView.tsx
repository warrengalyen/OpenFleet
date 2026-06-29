import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { exportToCsv } from '@/lib/csv'
import { formatDate, vehicleStatusLabel, vehicleStatusVariant } from '@/lib/formatters'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { isWithinDateRange, type ReportDateRange } from '../filters'
import { useVehicleDowntimeReport } from '../hooks'

export function VehicleDowntimeReportView() {
  const navigate = useNavigate()
  const [range, setRange] = useState<ReportDateRange>({})
  const { data, isLoading, isError, isFetching, refetch } = useVehicleDowntimeReport()

  const vehicles = useMemo(
    () =>
      (data?.vehicles ?? []).filter((v) => isWithinDateRange(v.lastMaintenanceAt, range)),
    [data, range],
  )

  function handleExport() {
    exportToCsv(
      'vehicle-downtime',
      ['Vehicle', 'License Plate', 'Status', 'Open Work Orders', 'Last Maintenance'],
      vehicles.map((v) => [
        v.vehicleLabel,
        v.licensePlate,
        vehicleStatusLabel[v.status],
        String(v.openWorkOrderCount),
        v.lastMaintenanceAt ? formatDate(v.lastMaintenanceAt) : '',
      ]),
    )
  }

  return (
    <ReportShell
      title="Vehicle Downtime"
      description={`${data?.vehiclesInMaintenance ?? 0} vehicles currently in maintenance status.`}
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={vehicles.length === 0}
      emptyIcon={Truck}
      emptyTitle="No downtime vehicles"
      emptyDescription="All vehicles are available or have no open maintenance activity."
      onExportCsv={handleExport}
      filters={<ReportFilters range={range} onChange={setRange} />}
    >
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
          { key: 'licensePlate', header: 'Plate', render: (row) => row.licensePlate },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant={vehicleStatusVariant[row.status]}>
                {vehicleStatusLabel[row.status]}
              </Badge>
            ),
          },
          {
            key: 'openWorkOrderCount',
            header: 'Open WOs',
            sortable: true,
            render: (row) => row.openWorkOrderCount,
          },
          {
            key: 'lastMaintenanceAt',
            header: 'Last maintenance',
            render: (row) => (row.lastMaintenanceAt ? formatDate(row.lastMaintenanceAt) : '-'),
          },
        ]}
        data={vehicles}
        getRowKey={(row) => row.vehicleId}
        onRowClick={(row) => navigate(`/vehicles/${row.vehicleId}`)}
      />
    </ReportShell>
  )
}
