import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination, paginate } from '@/components/ui/Pagination'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { EmptyState } from '@/components/EmptyState'
import { roleBadgeVariant, roleLabel } from '@/lib/auth'
import { formatDate } from '@/lib/formatters'
import { isQueryLoadFailure } from '@/lib/query'
import { userDisplayName, type UserResponse } from '@/types/user'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useUsers } from './hooks'

const PAGE_SIZE = 10

export function UsersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const statusFilter = searchParams.get('status') ?? ''

  const { data, isLoading, isError, refetch } = useUsers()
  const loadFailed = isQueryLoadFailure(isError, data)

  const filtered = useMemo(() => {
    let rows = data ?? []
    const search = searchParams.get('search')?.toLowerCase()
    if (search) {
      rows = rows.filter(
        (user) =>
          user.email.toLowerCase().includes(search) ||
          userDisplayName(user).toLowerCase().includes(search) ||
          (user.departmentName?.toLowerCase().includes(search) ?? false),
      )
    }
    if (statusFilter === 'active') rows = rows.filter((user) => user.isActive)
    if (statusFilter === 'inactive') rows = rows.filter((user) => !user.isActive)
    return rows
  }, [data, searchParams, statusFilter])

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
      <AdminBreadcrumb title="Users" />

      <PageTitle
        title="Users"
        subtitle="Manage fleet staff accounts, roles, and department assignments"
        actions={
          <Button onClick={() => navigate('/admin/users/new')}>
            <Plus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex max-w-sm flex-1 gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, or department…"
            aria-label="Search users"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value || null, page: '1' })}
          aria-label="Filter by status"
          className="sm:w-44"
        >
          <option value="">All users</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
      </div>

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load users."
        onRetry={() => void refetch()}
      />

      {!loadFailed && !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description={
            data?.length
              ? 'Try adjusting your search or filters.'
              : 'Create the first user account to get started.'
          }
          action={
            !data?.length ? (
              <Button onClick={() => navigate('/admin/users/new')}>
                <Plus className="h-4 w-4" />
                New user
              </Button>
            ) : undefined
          }
        />
      )}

      {!loadFailed && (isLoading || filtered.length > 0) && (
        <>
          <DataTable<UserResponse>
            isLoading={isLoading}
            columns={[
              {
                key: 'name',
                header: 'Name',
                sortable: true,
                render: (row) => (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {userDisplayName(row)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                render: (row) => (
                  <Badge variant={roleBadgeVariant[row.role]}>{roleLabel[row.role]}</Badge>
                ),
              },
              {
                key: 'departmentName',
                header: 'Department',
                render: (row) => row.departmentName ?? '-',
              },
              {
                key: 'isActive',
                header: 'Status',
                render: (row) => (
                  <Badge variant={row.isActive ? 'success' : 'neutral'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            data={paginatedData}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
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
