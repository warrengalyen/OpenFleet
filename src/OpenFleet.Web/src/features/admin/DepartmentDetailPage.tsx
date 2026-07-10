import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, formatNumber } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useDeleteDepartment, useDepartmentDetail } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function DepartmentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: department, isLoading, isError, refetch } = useDepartmentDetail(id)
  const deleteDepartment = useDeleteDepartment()

  if (isLoading) return <LoadingSpinner />

  if (isError || !department) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Department not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/admin/departments" className="text-sm text-brand-600 hover:underline">
            Back to departments
          </Link>
        </div>
      </div>
    )
  }

  async function handleDelete() {
    try {
      await deleteDepartment.mutateAsync(id)
      toast.success('Department deleted')
      navigate('/admin/departments')
    } catch (err) {
      toast.error('Failed to delete department', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Departments" />

      <PageTitle
        title={department.name}
        subtitle={`Code: ${department.code}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/admin/departments/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteOpen(true)}
              disabled={department.hasAssignments}
              title={
                department.hasAssignments
                  ? 'Reassign or remove assigned vehicles, users, and assets before deleting'
                  : undefined
              }
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {department.hasAssignments && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This department has {formatNumber(department.vehicleCount)} vehicle
          {department.vehicleCount === 1 ? '' : 's'},{' '}
          {formatNumber(department.userCount)} user{department.userCount === 1 ? '' : 's'}, and{' '}
          {formatNumber(department.assetCount)} asset{department.assetCount === 1 ? '' : 's'}{' '}
          assigned. Reassign or remove those records before deleting the department.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Department details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <DetailRow label="Code" value={department.code} />
            <DetailRow
              label="Vehicles assigned"
              value={
                department.vehicleCount > 0 ? (
                  <Link
                    to={`/vehicles?departmentId=${id}`}
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {formatNumber(department.vehicleCount)}
                  </Link>
                ) : (
                  formatNumber(department.vehicleCount)
                )
              }
            />
            <DetailRow label="Users assigned" value={formatNumber(department.userCount)} />
            <DetailRow
              label="Assets assigned"
              value={
                department.assetCount > 0 ? (
                  <Link
                    to={`/assets?departmentId=${id}`}
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {formatNumber(department.assetCount)}
                  </Link>
                ) : (
                  formatNumber(department.assetCount)
                )
              }
            />
            <DetailRow label="Created" value={formatDateTime(department.createdAt)} />
            <DetailRow label="Last updated" value={formatDateTime(department.updatedAt)} />
          </dl>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete department?"
        description={`"${department.name}" will be permanently removed.`}
        confirmLabel="Delete department"
        variant="danger"
      />
    </div>
  )
}
