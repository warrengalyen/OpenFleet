import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { UserForm } from './UserForm'
import { useCreateUser } from './hooks'
import type { CreateUserFormValues } from './schemas'

export function UserCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createUser = useCreateUser()

  async function handleSubmit(values: CreateUserFormValues) {
    try {
      const user = await createUser.mutateAsync(values)
      toast.success('User created')
      navigate(`/admin/users/${user.id}`)
    } catch (err) {
      toast.error('Failed to create user', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Users" />

      <PageTitle title="New user" subtitle="Create a fleet staff account with role and department" />

      <Card>
        <CardContent className="pt-6">
          <UserForm
            mode="create"
            onSubmit={handleSubmit}
            submitLabel="Create user"
            isLoading={createUser.isPending}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link to="/admin/users" className="text-brand-600 hover:underline dark:text-brand-400">
          Cancel and return to users
        </Link>
      </p>
    </div>
  )
}
