import { useMemo } from 'react'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/formatters'
import { DashboardPanel } from './DashboardPanel'
import { LOW_STOCK_THRESHOLD } from './constants'
import { usePartsUsage } from './hooks'

export function LowStockPartsPanel() {
  const { data, isLoading, isError, isFetching, refetch } = usePartsUsage()

  const lowStockParts = useMemo(
    () =>
      data?.parts
        .filter((p) => p.quantityOnHand <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.quantityOnHand - b.quantityOnHand) ?? [],
    [data],
  )

  return (
    <DashboardPanel
      title="Low-Stock Parts"
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isEmpty={!!data && lowStockParts.length === 0}
      emptyIcon={Package}
      emptyTitle="Stock levels healthy"
      emptyDescription={`No parts at or below ${LOW_STOCK_THRESHOLD} units on hand.`}
    >
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {lowStockParts.map((part) => (
          <li key={part.partId} className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {part.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {part.partNumber}
                {part.vendorName && ` · ${part.vendorName}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant={part.quantityOnHand === 0 ? 'danger' : 'warning'}>
                {part.quantityOnHand} on hand
              </Badge>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {formatCurrency(part.unitCost)} each
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  )
}
