import { useMemo, useState } from 'react'
import {
  ClipboardList,
  Truck,
  ShieldAlert,
  Package,
  PlugZap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Button } from '@/components/ui/Button'
import { StatCard } from './StatCard'
import { OpenWorkOrdersTable } from './OpenWorkOrdersTable'
import { WorkOrdersByStatusChart } from './WorkOrdersByStatusChart'
import { WorkOrdersByPriorityChart } from './WorkOrdersByPriorityChart'
import { VehiclesDuePanel } from './VehiclesDuePanel'
import { FailedInspectionsPanel } from './FailedInspectionsPanel'
import { LowStockPartsPanel } from './LowStockPartsPanel'
import { IntegrationFailuresPanel } from './IntegrationFailuresPanel'
import { LOW_STOCK_THRESHOLD } from './constants'
import {
  useOpenWorkOrders,
  useVehiclesDue,
  useInspectionFailureRate,
  usePartsUsage,
  useIntegrationFailures,
  useWorkOrdersByPriority,
  useDashboardRefresh,
} from './hooks'

export function DashboardPage() {
  const refreshAll = useDashboardRefresh()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const openWorkOrders = useOpenWorkOrders()
  const vehiclesDue = useVehiclesDue()
  const failureRate = useInspectionFailureRate()
  const partsUsage = usePartsUsage()
  const integrationFailures = useIntegrationFailures()
  const workOrdersByPriority = useWorkOrdersByPriority()

  const lowStockCount = useMemo(
    () =>
      partsUsage.data?.parts.filter((p) => p.quantityOnHand <= LOW_STOCK_THRESHOLD)
        .length ?? 0,
    [partsUsage.data],
  )

  async function handleRefreshAll() {
    setIsRefreshing(true)
    try {
      await refreshAll()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Dashboard"
        subtitle="Fleet overview and operational status"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleRefreshAll()}
            loading={isRefreshing}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open Work Orders"
          value={openWorkOrders.data?.totalOpen}
          icon={ClipboardList}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950"
          isLoading={openWorkOrders.isLoading}
          isError={openWorkOrders.isError}
          emphasis={!!openWorkOrders.data?.totalOpen}
        />
        <StatCard
          label="Vehicles Due"
          value={vehiclesDue.data?.totalDue}
          icon={Truck}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950"
          isLoading={vehiclesDue.isLoading}
          isError={vehiclesDue.isError}
          emphasis={!!vehiclesDue.data?.totalDue}
        />
        <StatCard
          label="Failed Inspections"
          value={failureRate.data?.failed}
          icon={ShieldAlert}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950"
          isLoading={failureRate.isLoading}
          isError={failureRate.isError}
          sub={
            failureRate.data
              ? `${failureRate.data.failureRatePercent.toFixed(1)}% failure rate`
              : undefined
          }
          emphasis={!!failureRate.data?.failed}
        />
        <StatCard
          label="Low-Stock Parts"
          value={partsUsage.isLoading ? undefined : lowStockCount}
          icon={Package}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950"
          isLoading={partsUsage.isLoading}
          isError={partsUsage.isError}
          sub={`≤ ${LOW_STOCK_THRESHOLD} units`}
          emphasis={lowStockCount > 0}
        />
        <StatCard
          label="Integration Failures"
          value={integrationFailures.data?.totalCount}
          icon={PlugZap}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-950"
          isLoading={integrationFailures.isLoading}
          isError={integrationFailures.isError}
          emphasis={!!integrationFailures.data?.totalCount}
        />
        <StatCard
          label="Critical Priority"
          value={workOrdersByPriority.data?.critical}
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950"
          isLoading={workOrdersByPriority.isLoading}
          isError={workOrdersByPriority.isError}
          emphasis={!!workOrdersByPriority.data?.critical}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkOrdersByStatusChart />
        <WorkOrdersByPriorityChart />
      </div>

      {/* Open work orders table */}
      <OpenWorkOrdersTable />

      {/* Operational panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VehiclesDuePanel />
        <FailedInspectionsPanel />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LowStockPartsPanel />
        <IntegrationFailuresPanel />
      </div>
    </div>
  )
}
