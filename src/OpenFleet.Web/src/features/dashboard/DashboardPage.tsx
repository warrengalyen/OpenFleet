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

function SecondaryCard({
  label,
  value,
  sub,
  isLoading,
}: {
  label: string
  value: string | number | undefined
  sub?: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { data: woStatus, isLoading: woStatusLoading } = useWorkOrdersByStatus()
  const { data: vehiclesDue, isLoading: vehiclesDueLoading } = useVehiclesDue()
  const { data: failureRate, isLoading: failureRateLoading } = useInspectionFailureRate()
  const { data: downtime, isLoading: downtimeLoading } = useVehicleDowntime()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Fleet overview and operational status
        </p>
      </div>

      {/* Stat cards — icon backgrounds include paired dark: variants */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open"
          value={woStatus?.open}
          icon={ClipboardList}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="In Progress"
          value={woStatus?.inProgress}
          icon={Wrench}
          iconColor="text-brand-600 dark:text-brand-400"
          iconBg="bg-brand-50 dark:bg-brand-950"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Waiting Parts"
          value={woStatus?.waitingForParts}
          icon={AlertCircle}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Completed"
          value={woStatus?.completed}
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={woStatusLoading}
        />
        <StatCard
          label="Vehicles Due"
          value={vehiclesDue?.totalDue}
          icon={Truck}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950"
          isLoading={vehiclesDueLoading}
          emphasis={!!vehiclesDue?.totalDue}
        />
        <StatCard
          label="In Maintenance"
          value={downtime?.vehiclesInMaintenance}
          icon={ShieldAlert}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950"
          isLoading={downtimeLoading}
        />
      </div>

      {/* Secondary stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SecondaryCard
          label="Inspection Failure Rate"
          value={
            failureRate !== undefined
              ? `${failureRate.failureRatePercent.toFixed(1)}%`
              : undefined
          }
          sub={
            failureRate
              ? `${failureRate.failed} failed / ${failureRate.totalInspections} total`
              : undefined
          }
          isLoading={failureRateLoading}
        />
        <SecondaryCard
          label="Total Work Orders"
          value={woStatus?.total}
          sub={
            woStatus
              ? `${woStatus.completed} completed · ${woStatus.cancelled} cancelled`
              : undefined
          }
          isLoading={woStatusLoading}
        />
        <SecondaryCard
          label="Vehicles Under Review"
          value={downtime?.vehicles.length ?? 0}
          sub="with open work orders or in maintenance"
          isLoading={downtimeLoading}
        />
      </div>

      {/* Open work orders table */}
      <OpenWorkOrdersTable />
    </div>
  )
}
