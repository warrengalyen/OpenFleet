import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Truck } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { useDepartments } from '@/hooks/useDepartments'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { isQueryLoadFailure } from '@/lib/query'
import {
  formatNumber,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from '@/lib/formatters'
import type { VehicleFilterRequest, VehicleResponse, VehicleStatus } from '@/types'
import { useVehicles } from './hooks'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: VehicleStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'InMaintenance', label: 'In Maintenance' },
  { value: 'OutOfService', label: 'Out of Service' },
  { value: 'Retired', label: 'Retired' },
]

export function VehiclesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)
  const { data: departments } = useDepartments()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

  const filters = useMemo<VehicleFilterRequest>(() => {
    const status = searchParams.get('status') as VehicleStatus | null
    const departmentId = searchParams.get('departmentId') ?? undefined
    const make = searchParams.get('make') ?? undefined
    const search = searchParams.get('search') ?? undefined
    return {
      ...(status ? { status } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(make ? { make } : {}),
      ...(search ? { search } : {}),
    }
  }, [searchParams])

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const { data, isLoading, isError, refetch } = useVehicles(filters)
  const loadFailed = isQueryLoadFailure(isError, data)

  const paginatedData = useMemo(
    () => paginate(data ?? [], page, PAGE_SIZE),
    [data, page],
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
        title="Vehicles"
        subtitle="Manage fleet vehicles, status, and department assignments"
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/vehicles/new')}>
              <Plus className="h-4 w-4" />
              Add vehicle
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label htmlFor="vehicle-search" className="sr-only">
              Search vehicles
            </label>
            <div className="relative">
              <Input
                id="vehicle-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search VIN, plate, make, model…"
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="vehicle-status" className="sr-only">
              Filter by status
            </label>
            <Select
              id="vehicle-status"
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

          <div className="lg:col-span-3">
            <label htmlFor="vehicle-department" className="sr-only">
              Filter by department
            </label>
            <Select
              id="vehicle-department"
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

          <div className="flex gap-2 lg:col-span-3">
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

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load vehicles."
        onRetry={() => void refetch()}
      />

      <DataTable<VehicleResponse>
        columns={[
          {
            key: 'make',
            header: 'Vehicle',
            sortable: true,
            render: (row) => (
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {row.year} {row.make} {row.model}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.vin}</p>
              </div>
            ),
          },
          {
            key: 'licensePlate',
            header: 'Plate',
            sortable: true,
            className: 'hidden sm:table-cell',
            headerClassName: 'hidden sm:table-cell',
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant={vehicleStatusVariant[row.status]}>
                {vehicleStatusLabel[row.status]}
              </Badge>
            ),
          },
          {
            key: 'departmentName',
            header: 'Department',
            sortable: true,
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
          },
          {
            key: 'mileage',
            header: 'Mileage',
            sortable: true,
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) => `${formatNumber(row.mileage)} mi`,
          },
        ]}
        data={paginatedData}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/vehicles/${row.id}`)}
        emptyIcon={Truck}
        emptyTitle="No vehicles found"
        emptyDescription="Try adjusting your filters or add a new vehicle."
        emptyAction={
          canWrite ? (
            <Link
              to="/vehicles/new"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add vehicle
            </Link>
          ) : undefined
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={data?.length ?? 0}
        onPageChange={(p) => updateParams({ page: String(p) })}
      />
    </div>
  )
}
