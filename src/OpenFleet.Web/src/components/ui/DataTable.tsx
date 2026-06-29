import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/EmptyState'
import { type LucideIcon } from 'lucide-react'

export interface TableColumn<T extends object> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  headerClassName?: string
  render?: (row: T, index: number) => ReactNode
}

type SortDir = 'asc' | 'desc'

interface SortState {
  key: string
  dir: SortDir
}

interface DataTableProps<T extends object> {
  columns: TableColumn<T>[]
  data: T[] | undefined
  isLoading?: boolean
  skeletonRows?: number
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  emptyAction?: ReactNode
  className?: string
}

function SortIcon({ columnKey, sort }: { columnKey: string; sort: SortState | null }) {
  if (!sort || sort.key !== columnKey) {
    return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  }
  return sort.dir === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
  )
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading,
  skeletonRows = 5,
  getRowKey,
  onRowClick,
  emptyTitle = 'No results',
  emptyDescription,
  emptyIcon,
  emptyAction,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null)

  function handleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const sorted = (() => {
    if (!data || !sort) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortable) return data
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key]
      const bv = (b as Record<string, unknown>)[sort.key]
      const cmp =
        typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv)
          : (av as number) < (bv as number)
            ? -1
            : (av as number) > (bv as number)
              ? 1
              : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  })()

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400',
                    col.sortable &&
                      'cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100',
                    col.headerClassName,
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} sort={sort} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {isLoading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted?.map((row, i) => (
                  <tr
                    key={getRowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={clsx(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-4 py-3 text-gray-700 dark:text-gray-300',
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row, i)
                          : String((row as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && (!sorted || sorted.length === 0) && (
          <div className="p-6">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        )}
      </div>
    </div>
  )
}
