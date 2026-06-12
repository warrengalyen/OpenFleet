import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { UserForm, userToEditFormValues } from './UserForm'
import { useUpdateUser, useUser } from './hooks'
import type { EditUserFormValues } from './schemas'

export function UserEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: user, isLoading, isError, refetch } = useUser(id)
  const updateUser = useUpdateUser(id)

  async function handleSubmit(values: EditUserFormValues) {
    try {
      await updateUser.mutateAsync(values)
      toast.success('User updated')
      navigate(`/admin/users/${id}`)
    } catch (err) {
      toast.error('Failed to update user', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (isError || !user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">User not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Users" />

      <PageTitle title="Edit user" subtitle={user.email} />

      <Card>
        <CardContent className="pt-6">
          <UserForm
            mode="edit"
            email={user.email}
            defaultValues={userToEditFormValues(user)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateUser.isPending}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link to={`/admin/users/${id}`} className="text-brand-600 hover:underline dark:text-brand-400">
          Cancel and return to user details
        </Link>
      </p>
    </div>
  )
}
