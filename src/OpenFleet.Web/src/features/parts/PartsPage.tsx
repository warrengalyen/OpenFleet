import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Plus, Search, Wrench } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import {
  formatCurrency,
  formatNumber,
  stockLevel,
  stockLevelLabel,
  stockLevelVariant,
} from '@/lib/formatters'
import { useVendors } from '@/features/vendors/hooks'
import type { PartFilterRequest, PartResponse } from '@/types'
import { useParts } from './hooks'

const PAGE_SIZE = 10

export function PartsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const { data: vendors } = useVendors()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const filters = useMemo<PartFilterRequest>(() => {
    const vendorId = searchParams.get('vendorId') ?? undefined
    const lowStockOnly = searchParams.get('lowStock') === 'true'
    const search = searchParams.get('search') ?? undefined
    return {
      ...(vendorId ? { vendorId } : {}),
      ...(lowStockOnly ? { lowStockOnly: true } : {}),
      ...(search ? { search } : {}),
    }
  }, [searchParams])

  const { data, isLoading, isError, refetch } = useParts(filters)

  const allData = useMemo(() => data ?? [], [data])
  const paginatedData = useMemo(() => paginate(allData, page, PAGE_SIZE), [allData, page])
  const lowStockCount = useMemo(() => allData.filter((p) => p.isLowStock).length, [allData])

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
      <PageTitle
        title="Parts Inventory"
        subtitle="Manage stock levels, vendors, and part usage"
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/parts/new')}>
              <Plus className="h-4 w-4" />
              New part
            </Button>
          ) : undefined
        }
      />

      {lowStockCount > 0 && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span>
            <strong>{lowStockCount}</strong> part{lowStockCount === 1 ? '' : 's'} at or below low
            stock threshold.
          </span>
          {searchParams.get('lowStock') !== 'true' && (
            <button
              type="button"
              onClick={() => updateParams({ lowStock: 'true', page: '1' })}
              className="ml-auto underline"
            >
              Show low stock only
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 sm:max-w-sm">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or part number…"
            aria-label="Search parts"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select
          value={searchParams.get('vendorId') ?? ''}
          onChange={(e) => updateParams({ vendorId: e.target.value || null, page: '1' })}
          className="w-full sm:w-48"
          aria-label="Filter by vendor"
        >
          <option value="">All vendors</option>
          {vendors?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>

        <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={searchParams.get('lowStock') === 'true'}
            onChange={(e) =>
              updateParams({ lowStock: e.target.checked ? 'true' : null, page: '1' })
            }
            className="rounded border-gray-300"
          />
          Low stock only
        </label>

        {(searchParams.get('search') ||
          searchParams.get('vendorId') ||
          searchParams.get('lowStock')) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('')
              updateParams({ search: null, vendorId: null, lowStock: null, page: '1' })
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load parts.{' '}
          <button type="button" onClick={() => void refetch()} className="underline">
            Try again
          </button>
        </div>
      )}

      <DataTable<PartResponse>
        columns={[
          {
            key: 'name',
            header: 'Part',
            sortable: true,
            render: (row) => (
              <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
            ),
          },
          {
            key: 'partNumber',
            header: 'Part #',
            sortable: true,
            className: 'hidden sm:table-cell',
            headerClassName: 'hidden sm:table-cell',
            render: (row) => row.partNumber,
          },
          {
            key: 'vendorName',
            header: 'Vendor',
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (row) => (
              <Link
                to={`/vendors/${row.vendorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-brand-600 hover:underline"
              >
                {row.vendorName}
              </Link>
            ),
          },
          {
            key: 'quantityOnHand',
            header: 'Qty',
            sortable: true,
            render: (row) => formatNumber(row.quantityOnHand),
          },
          {
            key: 'stock',
            header: 'Stock',
            render: (row) => {
              const level = stockLevel(row.quantityOnHand, row.lowStockThreshold)
              return <Badge variant={stockLevelVariant[level]}>{stockLevelLabel[level]}</Badge>
            },
          },
          {
            key: 'unitCost',
            header: 'Unit cost',
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) => formatCurrency(row.unitCost),
          },
          {
            key: 'totalValue',
            header: 'Total value',
            sortable: true,
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) => formatCurrency(row.totalValue),
          },
        ]}
        data={paginatedData}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/parts/${row.id}`)}
        emptyIcon={Wrench}
        emptyTitle="No parts"
        emptyDescription="Add parts to track inventory and stock levels."
        emptyAction={
          canWrite ? (
            <Link
              to="/parts/new"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New part
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
