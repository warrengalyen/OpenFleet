import { Link, useParams } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatDate, formatNumber } from '@/lib/formatters'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useDepartmentDetail } from './hooks'

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
  const { data: department, isLoading, isError, refetch } = useDepartmentDetail(id)

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

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Departments" />

      <PageTitle title={department.name} subtitle={`Code: ${department.code}`} />

      <Card>
        <CardHeader>
          <CardTitle>Department details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <DetailRow label="Code" value={department.code} />
            <DetailRow label="Vehicles assigned" value={formatNumber(department.vehicleCount)} />
            <DetailRow label="Created" value={formatDate(department.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The API currently exposes read-only department endpoints (
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
              GET /api/departments
            </code>
            ). Create and update operations require new backend endpoints.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
