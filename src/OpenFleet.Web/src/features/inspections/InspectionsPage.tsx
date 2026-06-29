import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
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
  formatDateTime,
  inspectionStatusLabel,
  inspectionStatusVariant,
} from '@/lib/formatters'
import type { InspectionFilterRequest, InspectionResponse, InspectionStatus } from '@/types'
import { useInspections } from './hooks'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: InspectionStatus | ''; label: string }[] = [
  { value: '', label: 'All results' },
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'NeedsReview', label: 'Needs Review' },
]

export function InspectionsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const filters = useMemo<InspectionFilterRequest>(() => {
    const status = searchParams.get('status') as InspectionStatus | null
    return {
      ...(status ? { status } : {}),
    }
  }, [searchParams])

  const { data, isLoading, isError, refetch } = useInspections(filters)
  const loadFailed = isQueryLoadFailure(isError, data)

  const allData = useMemo(() => data ?? [], [data])
  const paginatedData = useMemo(() => paginate(allData, page, PAGE_SIZE), [allData, page])

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
        title="Inspections"
        subtitle="Log vehicle and asset inspections; failed results create work orders"
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/inspections/new')}>
              <Plus className="h-4 w-4" />
              New inspection
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('status') ?? ''}
          onChange={(e) => updateParams({ status: e.target.value || null, page: '1' })}
          className="w-full sm:w-48"
          aria-label="Filter by result"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        {searchParams.get('status') && (
          <Button variant="ghost" onClick={() => updateParams({ status: null, page: '1' })}>
            Clear filters
          </Button>
        )}
      </div>

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load inspections."
        onRetry={() => void refetch()}
      />

      <DataTable<InspectionResponse>
        columns={[
          {
            key: 'inspectedAt',
            header: 'Inspected',
            sortable: true,
            render: (row) => formatDateTime(row.inspectedAt),
          },
          {
            key: 'status',
            header: 'Result',
            render: (row) => (
              <Badge variant={inspectionStatusVariant[row.status]}>
                {inspectionStatusLabel[row.status]}
              </Badge>
            ),
          },
          {
            key: 'target',
            header: 'Vehicle / Asset',
            render: (row) => row.vehicleDescription ?? row.assetDescription ?? '-',
          },
          {
            key: 'inspectorName',
            header: 'Inspector',
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (row) => row.inspectorName,
          },
          {
            key: 'generatedWorkOrderId',
            header: 'Work order',
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) =>
              row.generatedWorkOrderId ? (
                <Link
                  to={`/work-orders/${row.generatedWorkOrderId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-brand-600 hover:underline"
                >
                  Linked
                </Link>
              ) : (
                '-'
              ),
          },
        ]}
        data={paginatedData}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/inspections/${row.id}`)}
        emptyIcon={Eye}
        emptyTitle="No inspections"
        emptyDescription="Log an inspection to track vehicle and asset condition."
        emptyAction={
          canWrite ? (
            <Link
              to="/inspections/new"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New inspection
            </Link>
          ) : undefined
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={allData.length}
        onPageChange={(p) => updateParams({ page: String(p) })}
      />
    </div>
  )
}
