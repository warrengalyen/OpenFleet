import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { DashboardPanel } from './DashboardPanel'
import { DonutChart, type BarChartItem } from './charts/BarChart'
import { useInspectionFailureRate } from './hooks'

export function FailedInspectionsPanel() {
  const { data, isLoading, isError, isFetching, refetch } = useInspectionFailureRate()

  const chartItems: BarChartItem[] = data
    ? [
        { label: 'Passed', value: data.passed, color: '#10b981' },
        { label: 'Failed', value: data.failed, color: '#ef4444' },
        { label: 'Needs Review', value: data.needsReview, color: '#f59e0b' },
      ]
    : []

  return (
    <DashboardPanel
      title="Inspection Outcomes"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && data.totalInspections === 0}
      emptyIcon={ShieldAlert}
      emptyTitle="No inspections recorded"
      emptyDescription="Inspection results will appear here once recorded."
      contentClassName="p-6"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
          <span className="text-sm text-gray-600 dark:text-gray-400">Failure rate</span>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {data?.failureRatePercent.toFixed(1)}%
          </span>
        </div>

        <DonutChart
          items={chartItems}
          total={data?.totalInspections ?? 0}
          centerLabel="total"
        />

        {data && data.topFailedVehicles.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Top failed vehicles
            </h3>
            <ul className="space-y-2">
              {data.topFailedVehicles.map((entry) => (
                <li
                  key={entry.vehicleId ?? entry.vehicleLabel ?? 'unknown'}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {entry.vehicleLabel ?? 'Unknown vehicle'}
                  </span>
                  <Badge variant="danger">{entry.failedCount} failed</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardPanel>
  )
}
