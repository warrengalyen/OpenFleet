import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardList, LayoutGrid, List, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { isQueryLoadFailure } from '@/lib/query'
import {
  formatDate,
  workOrderPriorityLabel,
  workOrderPriorityVariant,
  workOrderStatusLabel,
  workOrderStatusVariant,
} from '@/lib/formatters'
import type { WorkOrderFilterRequest, WorkOrderPriority, WorkOrderResponse, WorkOrderStatus } from '@/types'
import { useWorkOrders } from './hooks'
import { WorkOrderKanban } from './WorkOrderKanban'

const PAGE_SIZE = 10

type ViewMode = 'list' | 'board'

const STATUS_OPTIONS: { value: WorkOrderStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'WaitingForParts', label: 'Waiting for Parts' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const PRIORITY_OPTIONS: { value: WorkOrderPriority | ''; label: string }[] = [
  { value: '', label: 'All priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
]

export function WorkOrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)

  const view = (searchParams.get('view') as ViewMode) || 'list'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const filters = useMemo<WorkOrderFilterRequest>(() => {
    const status = searchParams.get('status') as WorkOrderStatus | null
    const priority = searchParams.get('priority') as WorkOrderPriority | null
    return {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    }
  }, [searchParams])

  const { data, isLoading, isError, refetch } = useWorkOrders(filters)
  const loadFailed = isQueryLoadFailure(isError, data)

  const boardData = useMemo(() => data ?? [], [data])
  const paginatedData = useMemo(
    () => paginate(boardData, page, PAGE_SIZE),
    [boardData, page],
  )

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Work Orders"
        subtitle="Create and manage repair and maintenance work orders"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
              <button
                type="button"
                onClick={() => updateParams({ view: 'list' })}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  view === 'list'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
                )}
                aria-pressed={view === 'list'}
              >
                <List className="h-4 w-4" />
                List
              </button>
              <button
                type="button"
                onClick={() => updateParams({ view: 'board', page: null })}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  view === 'board'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
                )}
                aria-pressed={view === 'board'}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </button>
            </div>
            {canWrite && (
              <Button onClick={() => navigate('/work-orders/new')}>
                <Plus className="h-4 w-4" />
                New work order
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('status') ?? ''}
          onChange={(e) => updateParams({ status: e.target.value || null, page: '1' })}
          className="w-full sm:w-48"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Select
          value={searchParams.get('priority') ?? ''}
          onChange={(e) => updateParams({ priority: e.target.value || null, page: '1' })}
          className="w-full sm:w-48"
          aria-label="Filter by priority"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        {(searchParams.get('status') || searchParams.get('priority')) && (
          <Button variant="ghost" onClick={() => updateParams({ status: null, priority: null, page: '1' })}>
            Clear filters
          </Button>
        )}
      </div>

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load work orders."
        onRetry={() => void refetch()}
      />

      {view === 'board' ? (
        <WorkOrderKanban workOrders={boardData} isLoading={isLoading} />
      ) : (
        <>
          <DataTable<WorkOrderResponse>
            columns={[
              {
                key: 'title',
                header: 'Title',
                sortable: true,
                render: (row) => (
                  <span className="font-medium text-gray-900 dark:text-white">{row.title}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={workOrderStatusVariant[row.status]}>
                    {workOrderStatusLabel[row.status]}
                  </Badge>
                ),
              },
              {
                key: 'priority',
                header: 'Priority',
                sortable: true,
                render: (row) => (
                  <Badge variant={workOrderPriorityVariant[row.priority]}>
                    {workOrderPriorityLabel[row.priority]}
                  </Badge>
                ),
              },
              {
                key: 'assignedUserName',
                header: 'Technician',
                className: 'hidden md:table-cell',
                headerClassName: 'hidden md:table-cell',
                render: (row) => row.assignedUserName ?? '-',
              },
              {
                key: 'vehicleDescription',
                header: 'Target',
                className: 'hidden lg:table-cell',
                headerClassName: 'hidden lg:table-cell',
                render: (row) => row.vehicleDescription ?? row.assetDescription ?? '-',
              },
              {
                key: 'createdAt',
                header: 'Created',
                sortable: true,
                className: 'hidden sm:table-cell',
                headerClassName: 'hidden sm:table-cell',
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            data={paginatedData}
            isLoading={isLoading}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/work-orders/${row.id}`)}
            emptyIcon={ClipboardList}
            emptyTitle="No work orders"
            emptyDescription="Create a work order to track maintenance and repairs."
            emptyAction={
              canWrite ? (
                <Link
                  to="/work-orders/new"
                  className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  New work order
                </Link>
              ) : undefined
            }
          />

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={boardData.length}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </>
      )}
    </div>
  )
}
