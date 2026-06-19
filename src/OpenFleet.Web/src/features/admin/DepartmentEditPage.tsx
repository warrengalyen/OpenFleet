import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { DepartmentForm, departmentToFormValues } from './DepartmentForm'
import { useDepartmentDetail, useUpdateDepartment } from './hooks'
import type { DepartmentFormValues } from './schemas'

export function DepartmentEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: department, isLoading } = useDepartmentDetail(id)
  const updateDepartment = useUpdateDepartment(id)

  async function handleSubmit(values: DepartmentFormValues) {
    try {
      await updateDepartment.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
      })
      toast.success('Department updated')
      navigate(`/admin/departments/${id}`)
    } catch (err) {
      toast.error('Failed to update department', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!department) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Department not found.{' '}
        <Link to="/admin/departments" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Departments" />

      <PageTitle title="Edit department" subtitle={department.name} />

      <Card>
        <CardContent className="pt-6">
          <DepartmentForm
            defaultValues={departmentToFormValues(department)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateDepartment.isPending}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link
          to={`/admin/departments/${id}`}
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Cancel and return to department details
        </Link>
      </p>
    </div>
  )
}
