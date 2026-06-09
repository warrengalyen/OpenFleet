import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { exportToCsv } from '@/lib/csv'
import { formatDate, formatNumber } from '@/lib/formatters'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { isWithinDateRange, type ReportDateRange } from '../filters'
import { useVehiclesDueReport } from '../hooks'

export function VehiclesDueReportView() {
  const [range, setRange] = useState<ReportDateRange>({})
  const { data, isLoading, isError, isFetching, refetch } = useVehiclesDueReport()

  const vehicles = useMemo(() => {
    if (!data?.vehicles) return []
    if (!range.dateFrom && !range.dateTo) return data.vehicles

    return data.vehicles
      .map((v) => ({
        ...v,
        dueSchedules: v.dueSchedules.filter((s) => isWithinDateRange(s.nextDueDate, range)),
      }))
      .filter((v) => v.dueSchedules.length > 0)
  }, [data, range])

  function handleExport() {
    const rows: string[][] = []
    for (const v of vehicles) {
      const label = v.vehicleDescription ?? v.assetDescription ?? 'Unknown'
      for (const s of v.dueSchedules) {
        rows.push([
          label,
          s.scheduleName,
          s.nextDueDate ? formatDate(s.nextDueDate) : '',
          s.nextDueMileage != null ? String(s.nextDueMileage) : '',
          s.daysOverdue != null ? String(Math.ceil(s.daysOverdue)) : '',
          s.milesOverdue != null ? String(s.milesOverdue) : '',
        ])
      }
    }
    exportToCsv(
      'vehicles-due-for-service',
      ['Vehicle/Asset', 'Schedule', 'Due Date', 'Due Mileage', 'Days Overdue', 'Miles Overdue'],
      rows,
    )
  }

  return (
    <ReportShell
      title="Vehicles Due for Service"
      description={`${data?.totalDue ?? 0} vehicles or assets with overdue maintenance schedules.`}
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={vehicles.length === 0}
      emptyIcon={BarChart3}
      emptyTitle="All up to date"
      emptyDescription="No vehicles or assets are currently due for scheduled maintenance."
      onExportCsv={handleExport}
      filters={<ReportFilters range={range} onChange={setRange} />}
    >
      <ul className="space-y-4">
        {vehicles.map((vehicle) => {
          const label = vehicle.vehicleDescription ?? vehicle.assetDescription ?? 'Unknown'
          const key = vehicle.vehicleId ?? vehicle.assetId ?? label
          const targetLink = vehicle.vehicleId
            ? `/vehicles/${vehicle.vehicleId}`
            : vehicle.assetId
              ? `/assets/${vehicle.assetId}`
              : undefined

          return (
            <li
              key={key}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {targetLink ? (
                    <Link to={targetLink} className="font-medium text-brand-600 hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                  )}
                  {vehicle.currentMileage != null && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatNumber(vehicle.currentMileage)} mi
                    </p>
                  )}
                </div>
                <Badge variant="warning">{vehicle.dueSchedules.length} due</Badge>
              </div>
              <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                {vehicle.dueSchedules.map((schedule) => (
                  <li
                    key={schedule.scheduleId}
                    className="flex flex-wrap justify-between gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span>{schedule.scheduleName}</span>
                    <span className="text-xs">
                      {schedule.nextDueDate && `Due ${formatDate(schedule.nextDueDate)}`}
                      {schedule.daysOverdue != null && schedule.daysOverdue > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({Math.ceil(schedule.daysOverdue)}d overdue)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </ReportShell>
  )
}
