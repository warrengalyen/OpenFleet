import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Search } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { EmptyState } from '@/components/EmptyState'
import { useDepartments } from '@/hooks/useDepartments'
import { formatDate, formatNumber } from '@/lib/formatters'
import { isQueryLoadFailure } from '@/lib/query'
import type { DepartmentResponse } from '@/types'
import { AdminBreadcrumb } from './AdminBreadcrumb'

const PAGE_SIZE = 10

export function DepartmentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const { data, isLoading, isError, refetch } = useDepartments()
  const loadFailed = isQueryLoadFailure(isError, data)

  const filtered = useMemo(() => {
    const search = searchParams.get('search')?.toLowerCase()
    let rows = data ?? []
    if (search) {
      rows = rows.filter(
        (dept) =>
          dept.name.toLowerCase().includes(search) || dept.code.toLowerCase().includes(search),
      )
    }
    return rows
  }, [data, searchParams])

  const paginatedData = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchInput.trim() || null, page: '1' })
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Departments" />

      <PageTitle
        title="Departments"
        subtitle="Organizational units used for vehicles, assets, and user assignments"
      />

      <form onSubmit={handleSearchSubmit} className="flex max-w-sm gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or code…"
          aria-label="Search departments"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load departments."
        onRetry={() => void refetch()}
      />

      {!loadFailed && !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Departments are seeded in the database. Create and edit endpoints are not yet available in the API."
        />
      )}

      {!loadFailed && (isLoading || filtered.length > 0) && (
        <>
          <DataTable<DepartmentResponse>
            isLoading={isLoading}
            columns={[
              {
                key: 'name',
                header: 'Department',
                sortable: true,
                render: (row) => (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{row.code}</p>
                  </div>
                ),
              },
              {
                key: 'vehicleCount',
                header: 'Vehicles',
                render: (row) => formatNumber(row.vehicleCount),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            data={paginatedData}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/admin/departments/${row.id}`)}
          />

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </>
      )}
    </div>
  )
}
