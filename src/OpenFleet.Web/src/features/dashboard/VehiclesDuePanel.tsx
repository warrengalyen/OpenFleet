import { Truck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/formatters'
import { DashboardPanel } from './DashboardPanel'
import { useVehiclesDue } from './hooks'

export function VehiclesDuePanel() {
  const { data, isLoading, isError, isFetching, refetch } = useVehiclesDue()

  return (
    <DashboardPanel
      title="Vehicles Due for Service"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.totalDue === 0}
      emptyIcon={Truck}
      emptyTitle="All vehicles up to date"
      emptyDescription="No maintenance schedules are currently overdue."
    >
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {data?.vehicles.map((vehicle) => {
          const label =
            vehicle.vehicleDescription ??
            vehicle.assetDescription ??
            'Unknown asset'
          const key = vehicle.vehicleId ?? vehicle.assetId ?? label

          return (
            <li key={key} className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {label}
                  </p>
                  {vehicle.currentMileage != null && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(vehicle.currentMileage)} mi
                    </p>
                  )}
                </div>
                <Badge variant="warning">{vehicle.dueSchedules.length} due</Badge>
              </div>
              <ul className="mt-2 space-y-1">
                {vehicle.dueSchedules.map((schedule) => (
                  <li
                    key={schedule.scheduleId}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {schedule.scheduleName}
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
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </DashboardPanel>
  )
}
