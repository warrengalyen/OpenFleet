import { formatDateTime, formatNumber } from '@/lib/formatters'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { PartUsageHistoryEntry } from '@/types'
import { usePartUsageHistory } from './hooks'

interface PartUsageHistoryProps {
  partId: string
}

export function PartUsageHistory({ partId }: PartUsageHistoryProps) {
  const { data, isLoading, isError, refetch } = usePartUsageHistory(partId)

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Failed to load usage history.{' '}
        <button type="button" onClick={() => void refetch()} className="underline">
          Retry
        </button>
      </p>
    )
  }

  const entries = data ?? []

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No quantity changes recorded yet.
      </p>
    )
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry, index) => (
        <UsageHistoryItem key={`${entry.occurredAt}-${index}`} entry={entry} />
      ))}
    </ol>
  )
}

function UsageHistoryItem({ entry }: { entry: PartUsageHistoryEntry }) {
  const change =
    entry.previousQuantity != null ? entry.newQuantity - entry.previousQuantity : null

  return (
    <li className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.source}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(entry.occurredAt)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium text-gray-900 dark:text-white">
            {formatNumber(entry.newQuantity)} on hand
          </p>
          {change != null && change !== 0 && (
            <p
              className={
                change > 0
                  ? 'text-xs text-green-600 dark:text-green-400'
                  : 'text-xs text-red-600 dark:text-red-400'
              }
            >
              {change > 0 ? '+' : ''}
              {formatNumber(change)}
            </p>
          )}
        </div>
      </div>
      {entry.notes && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{entry.notes}</p>
      )}
    </li>
  )
}
