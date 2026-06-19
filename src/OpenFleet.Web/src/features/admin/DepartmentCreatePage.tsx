import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { DepartmentForm } from './DepartmentForm'
import { useCreateDepartment } from './hooks'
import type { DepartmentFormValues } from './schemas'

export function DepartmentCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createDepartment = useCreateDepartment()

  async function handleSubmit(values: DepartmentFormValues) {
    try {
      const department = await createDepartment.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
      })
      toast.success('Department created')
      navigate(`/admin/departments/${department.id}`)
    } catch (err) {
      toast.error('Failed to create department', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Departments" />

      <PageTitle
        title="New department"
        subtitle="Add an organizational unit for vehicles, assets, and users"
      />

      <Card>
        <CardContent className="pt-6">
          <DepartmentForm
            onSubmit={handleSubmit}
            submitLabel="Create department"
            isLoading={createDepartment.isPending}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link
          to="/admin/departments"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Cancel and return to departments
        </Link>
      </p>
    </div>
  )
}
