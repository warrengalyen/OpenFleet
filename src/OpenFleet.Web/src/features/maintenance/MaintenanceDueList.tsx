import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatNumber } from '@/lib/formatters'
import type { VehicleDueForServiceResponse } from '@/types'
import { useMaintenanceDue } from './hooks'

function DueVehicleCard({ vehicle }: { vehicle: VehicleDueForServiceResponse }) {
  const label = vehicle.vehicleDescription ?? vehicle.assetDescription ?? 'Unknown'
  const targetLink = vehicle.vehicleId
    ? `/vehicles/${vehicle.vehicleId}`
    : vehicle.assetId
      ? `/assets/${vehicle.assetId}`
      : undefined

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {targetLink ? (
            <Link
              to={targetLink}
              className="truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {label}
            </Link>
          ) : (
            <p className="truncate font-medium text-gray-900 dark:text-white">{label}</p>
          )}
          {vehicle.currentMileage != null && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <Link
              to={`/maintenance/schedules/${schedule.scheduleId}/edit`}
              className="text-gray-700 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
            >
              {schedule.scheduleName}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {schedule.nextDueDate && (
                <span>Due {formatDate(schedule.nextDueDate)}</span>
              )}
              {schedule.daysOverdue != null && schedule.daysOverdue > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  ({Math.ceil(schedule.daysOverdue)}d overdue)
                </span>
              )}
              {schedule.milesOverdue != null && schedule.milesOverdue > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  ({formatNumber(schedule.milesOverdue)} mi overdue)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </li>
  )
}

export function MaintenanceDueList() {
  const { data, isLoading, isError, refetch } = useMaintenanceDue()

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading due items…</p>
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Failed to load due maintenance.{' '}
        <button type="button" onClick={() => void refetch()} className="underline">
          Try again
        </button>
      </div>
    )
  }

  const dueItems = data ?? []

  if (dueItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 text-center dark:border-gray-800">
        <Truck className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 font-medium text-gray-900 dark:text-white">All up to date</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No vehicles or assets are currently due for scheduled maintenance.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {dueItems.map((vehicle) => {
        const key = vehicle.vehicleId ?? vehicle.assetId ?? vehicle.vehicleDescription ?? 'unknown'
        return <DueVehicleCard key={key} vehicle={vehicle} />
      })}
    </ul>
  )
}
