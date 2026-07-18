import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useToast } from '@/components/ui/Toaster'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/api'
import { authService } from '@/services/auth.service'
import type { UpdateProfileRequest } from '@/types'
import { ProfileForm } from './ProfileForm'

const ME_QUERY_KEY = ['auth', 'me'] as const

export function ProfilePage() {
  const toast = useToast()
  const { user, isLoading } = useAuth()
  const queryClient = useQueryClient()

  const updateProfile = useMutation({
    mutationFn: (request: UpdateProfileRequest) => authService.updateProfile(request),
    onSuccess: (updated) => {
      queryClient.setQueryData(ME_QUERY_KEY, updated)
    },
  })

  async function handleSubmit(request: UpdateProfileRequest) {
    try {
      await updateProfile.mutateAsync(request)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Failed to update profile', getApiErrorMessage(err))
      throw err
    }
  }

  if (isLoading || !user) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageTitle
        title="Profile"
        subtitle="Update your display name and password"
      />

      <Card>
        <CardContent className="pt-6">
          <ProfileForm
            user={user}
            onSubmit={handleSubmit}
            isLoading={updateProfile.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
