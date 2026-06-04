import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Store } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { isQueryLoadFailure } from '@/lib/query'
import {
  formatDate,
  vendorAvailability,
  vendorAvailabilityLabel,
  vendorAvailabilityVariant,
} from '@/lib/formatters'
import type { VendorFilterRequest, VendorResponse } from '@/types'
import { useVendors } from './hooks'

const PAGE_SIZE = 10

export function VendorsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.FleetManagerOrAbove)

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const filters = useMemo<VendorFilterRequest>(() => {
    const search = searchParams.get('search') ?? undefined
    return search ? { search } : {}
  }, [searchParams])

  const { data, isLoading, isError, refetch } = useVendors(filters)

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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchInput.trim() || null, page: '1' })
  }

  const hasActiveFilters = !!searchParams.get('search')

  return (
    <div className="space-y-6">
      <PageTitle
        title="Vendors"
        subtitle="Manage suppliers and parts providers"
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/vendors/new')}>
              <Plus className="h-4 w-4" />
              New vendor
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={handleSearchSubmit} className="flex max-w-sm gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, contact, or email…"
          aria-label="Search vendors"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
        {searchParams.get('search') && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('')
              updateParams({ search: null, page: '1' })
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load vendors."
        onRetry={() => void refetch()}
      />

      {!loadFailed && (
        <>
      <DataTable<VendorResponse>
        columns={[
          {
            key: 'name',
            header: 'Vendor',
            sortable: true,
            render: (row) => (
              <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
            ),
          },
          {
            key: 'contactName',
            header: 'Contact',
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (row) => row.contactName || '—',
          },
          {
            key: 'email',
            header: 'Email',
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) =>
              row.email ? (
                <a href={`mailto:${row.email}`} className="text-brand-600 hover:underline">
                  {row.email}
                </a>
              ) : (
                '—'
              ),
          },
          {
            key: 'partCount',
            header: 'Parts',
            sortable: true,
            render: (row) => row.partCount,
          },
          {
            key: 'availability',
            header: 'Status',
            render: (row) => {
              const status = vendorAvailability(row.partCount)
              return (
                <Badge variant={vendorAvailabilityVariant[status]}>
                  {vendorAvailabilityLabel[status]}
                </Badge>
              )
            },
          },
          {
            key: 'createdAt',
            header: 'Added',
            sortable: true,
            className: 'hidden sm:table-cell',
            headerClassName: 'hidden sm:table-cell',
            render: (row) => formatDate(row.createdAt),
          },
        ]}
        data={paginatedData}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/vendors/${row.id}`)}
        emptyIcon={Store}
        emptyTitle={hasActiveFilters ? 'No matching vendors' : 'No vendors'}
        emptyDescription={
          hasActiveFilters
            ? 'Try adjusting your search.'
            : 'Add vendors to assign parts and track suppliers.'
        }
        emptyAction={
          canWrite ? (
            <Link
              to="/vendors/new"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New vendor
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
        </>
      )}
    </div>
  )
}
