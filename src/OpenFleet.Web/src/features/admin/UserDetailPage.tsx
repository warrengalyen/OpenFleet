import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, UserCheck, UserX } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { roleBadgeVariant, roleLabel } from '@/lib/auth'
import { formatDateTime } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { userDisplayName } from '@/types/user'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { useDeactivateUser, useUpdateUser, useUser } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)

  const { data: user, isLoading, isError, refetch } = useUser(id)
  const updateUser = useUpdateUser(id)
  const deactivateUser = useDeactivateUser()

  if (isLoading) return <LoadingSpinner />

  if (isError || !user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">User not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/admin/users" className="text-sm text-brand-600 hover:underline">
            Back to users
          </Link>
        </div>
      </div>
    )
  }

  async function handleDeactivate() {
    try {
      await deactivateUser.mutateAsync(id)
      toast.success('User deactivated')
      setDeactivateOpen(false)
      void refetch()
    } catch (err) {
      toast.error('Failed to deactivate user', getApiErrorMessage(err))
    }
  }

  async function handleActivate() {
    try {
      await updateUser.mutateAsync({ isActive: true })
      toast.success('User activated')
      setActivateOpen(false)
    } catch (err) {
      toast.error('Failed to activate user', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Users" />

      <PageTitle
        title={userDisplayName(user)}
        subtitle={user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/admin/users/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {user.isActive ? (
              <Button variant="danger" onClick={() => setDeactivateOpen(true)}>
                <UserX className="h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setActivateOpen(true)}>
                <UserCheck className="h-4 w-4" />
                Activate
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <DetailRow
              label="Status"
              value={
                <Badge variant={user.isActive ? 'success' : 'neutral'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
            <DetailRow
              label="Role"
              value={<Badge variant={roleBadgeVariant[user.role]}>{roleLabel[user.role]}</Badge>}
            />
            <DetailRow label="Department" value={user.departmentName ?? '—'} />
            <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => void handleDeactivate()}
        title="Deactivate user"
        description={`Deactivate ${userDisplayName(user)}? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        variant="danger"
      />

      <ConfirmDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onConfirm={() => void handleActivate()}
        title="Activate user"
        description={`Reactivate ${userDisplayName(user)}? They will be able to sign in again.`}
        confirmLabel="Activate"
        variant="primary"
      />
    </div>
  )
}
