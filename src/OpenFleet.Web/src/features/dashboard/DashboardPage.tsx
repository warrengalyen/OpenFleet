import {
  ClipboardList,
  Truck,
  ShieldAlert,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { StatCard } from './StatCard'
import { OpenWorkOrdersTable } from './OpenWorkOrdersTable'
import {
  useWorkOrdersByStatus,
  useVehiclesDue,
  useInspectionFailureRate,
  useVehicleDowntime,
} from './hooks'

export function DashboardPage() {
  const { data: woStatus, isLoading: woStatusLoading } = useWorkOrdersByStatus()
  const { data: vehiclesDue, isLoading: vehiclesDueLoading } = useVehiclesDue()
  const { data: failureRate, isLoading: failureRateLoading } = useInspectionFailureRate()
  const { data: downtime, isLoading: downtimeLoading } = useVehicleDowntime()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">Fleet overview and operational status</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open"
          value={woStatus?.open}
          icon={ClipboardList}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="In Progress"
          value={woStatus?.inProgress}
          icon={Wrench}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Waiting Parts"
          value={woStatus?.waitingForParts}
          icon={AlertCircle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Completed"
          value={woStatus?.completed}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Vehicles Due"
          value={vehiclesDue?.totalDue}
          icon={Truck}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          isLoading={vehiclesDueLoading}
          emphasis={!!vehiclesDue?.totalDue}
        />
        <StatCard
          label="In Maintenance"
          value={downtime?.vehiclesInMaintenance}
          icon={ShieldAlert}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          isLoading={downtimeLoading}
        />
      </div>

      {/* Secondary stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Inspection Failure Rate</p>
          {failureRateLoading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {failureRate?.failureRatePercent.toFixed(1)}%
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {failureRate?.failed} failed / {failureRate?.totalInspections} total
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Work Orders</p>
          {woStatusLoading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900">{woStatus?.total}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {woStatus?.completed} completed · {woStatus?.cancelled} cancelled
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Vehicles Under Review</p>
          {downtimeLoading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {downtime?.vehicles.length ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">with open work orders or in maintenance</p>
            </>
          )}
        </div>
      </div>

      {/* Open work orders table */}
      <OpenWorkOrdersTable />
    </div>
  )
}
