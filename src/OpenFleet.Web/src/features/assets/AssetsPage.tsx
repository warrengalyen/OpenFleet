import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Package, Plus, Search } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { useDepartments } from '@/hooks/useDepartments'
import {
  assetConditionLabel,
  assetConditionVariant,
  assetStatusLabel,
  assetStatusVariant,
} from '@/lib/formatters'
import type { AssetCondition, AssetFilterRequest, AssetResponse, AssetStatus } from '@/types'
import { useAssets } from './hooks'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: AssetStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'InUse', label: 'In Use' },
  { value: 'UnderMaintenance', label: 'Under Maintenance' },
  { value: 'Decommissioned', label: 'Decommissioned' },
]

const CONDITION_OPTIONS: { value: AssetCondition | ''; label: string }[] = [
  { value: '', label: 'All conditions' },
  { value: 'New', label: 'New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Damaged', label: 'Damaged' },
]

export function AssetsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: departments } = useDepartments()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

  const apiFilters = useMemo<AssetFilterRequest>(() => {
    const status = searchParams.get('status') as AssetStatus | null
    const condition = searchParams.get('condition') as AssetCondition | null
    const departmentId = searchParams.get('departmentId') ?? undefined
    const type = searchParams.get('type') ?? undefined
    return {
      ...(status ? { status } : {}),
      ...(condition ? { condition } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(type ? { type } : {}),
    }
  }, [searchParams])

  const clientSearch = searchParams.get('search')?.toLowerCase() ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const { data, isLoading, isError, refetch } = useAssets(apiFilters)

  const filteredData = useMemo(() => {
    if (!data) return []
    if (!clientSearch) return data
    return data.filter(
      (a) =>
        a.name.toLowerCase().includes(clientSearch) ||
        a.assetTag.toLowerCase().includes(clientSearch) ||
        a.type.toLowerCase().includes(clientSearch),
    )
  }, [data, clientSearch])

  const paginatedData = useMemo(
    () => paginate(filteredData, page, PAGE_SIZE),
    [filteredData, page],
  )

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchInput || null, page: '1' })
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Assets"
        subtitle="Track equipment, tools, and fleet assets"
        actions={
          <Button onClick={() => navigate('/assets/new')}>
            <Plus className="h-4 w-4" />
            Add asset
          </Button>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label htmlFor="asset-search" className="sr-only">
              Search assets
            </label>
            <Input
              id="asset-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, tag, type…"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="asset-status" className="sr-only">
              Filter by status
            </label>
            <Select
              id="asset-status"
              value={searchParams.get('status') ?? ''}
              onChange={(e) =>
                updateParams({ status: e.target.value || null, page: '1' })
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="asset-condition" className="sr-only">
              Filter by condition
            </label>
            <Select
              id="asset-condition"
              value={searchParams.get('condition') ?? ''}
              onChange={(e) =>
                updateParams({ condition: e.target.value || null, page: '1' })
              }
            >
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="asset-department" className="sr-only">
              Filter by department
            </label>
            <Select
              id="asset-department"
              value={searchParams.get('departmentId') ?? ''}
              onChange={(e) =>
                updateParams({ departmentId: e.target.value || null, page: '1' })
              }
              placeholder="All departments"
            >
              <option value="">All departments</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <Button type="submit" variant="secondary" className="flex-1">
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput('')
                setSearchParams({})
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load assets.{' '}
          <button type="button" onClick={() => void refetch()} className="underline">
            Try again
          </button>
        </div>
      )}

      <DataTable<AssetResponse>
        columns={[
          {
            key: 'name',
            header: 'Asset',
            sortable: true,
            render: (row) => (
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.assetTag}</p>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            sortable: true,
            className: 'hidden sm:table-cell',
            headerClassName: 'hidden sm:table-cell',
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant={assetStatusVariant[row.status]}>
                {assetStatusLabel[row.status]}
              </Badge>
            ),
          },
          {
            key: 'condition',
            header: 'Condition',
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (row) => (
              <Badge variant={assetConditionVariant[row.condition]}>
                {assetConditionLabel[row.condition]}
              </Badge>
            ),
          },
          {
            key: 'departmentName',
            header: 'Department',
            sortable: true,
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) => row.departmentName ?? '—',
          },
        ]}
        data={paginatedData}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/assets/${row.id}`)}
        emptyIcon={Package}
        emptyTitle="No assets found"
        emptyDescription="Try adjusting your filters or add a new asset."
        emptyAction={
          <Link
            to="/assets/new"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add asset
          </Link>
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filteredData.length}
        onPageChange={(p) => updateParams({ page: String(p) })}
      />
    </div>
  )
}
