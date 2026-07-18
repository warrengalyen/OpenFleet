import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getApiValidationErrors } from '@/lib/api'
import { zodFormResolver } from '@/lib/form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { CurrentUserResponse, UpdateProfileRequest } from '@/types'
import { profileFormSchema, type ProfileFormValues } from './schemas'

interface ProfileFormProps {
  user: CurrentUserResponse
  onSubmit: (request: UpdateProfileRequest) => Promise<void>
  isLoading?: boolean
}

export function userToProfileFormValues(user: CurrentUserResponse): ProfileFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

export function ProfileForm({ user, onSubmit, isLoading }: ProfileFormProps) {
  const isDemoUser = user.isDemoUser
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodFormResolver(profileFormSchema),
    defaultValues: userToProfileFormValues(user),
  })

  useEffect(() => {
    reset(userToProfileFormValues(user))
  }, [user, reset])

  async function handleFormSubmit(values: ProfileFormValues) {
    if (isDemoUser) return

    const request: UpdateProfileRequest = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    }

    if (values.newPassword) {
      request.currentPassword = values.currentPassword
      request.newPassword = values.newPassword
    }

    try {
      await onSubmit(request)
      reset({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      const fieldErrors = getApiValidationErrors(err)
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof ProfileFormValues, { type: 'server', message })
        }
      }
      // Parent page surfaces non-field API errors (including 403) via toast.
    }
  }

  const busy = isLoading || isSubmitting
  const canSubmit = !isDemoUser && isDirty && !busy

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleFormSubmit)(e)
      }}
      className="space-y-8"
      noValidate
    >
      {isDemoUser && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          Profile and password changes are disabled for the shared demo account.
        </div>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Display name</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This name appears in the header and throughout the app.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="First name" required error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              autoComplete="given-name"
              disabled={isDemoUser}
            />
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              autoComplete="family-name"
              disabled={isDemoUser}
            />
          </FormField>
        </div>

        <FormField label="Email">
          <Input value={user.email} disabled readOnly autoComplete="email" />
        </FormField>
      </section>

      <section className="space-y-5 border-t border-gray-200 pt-8 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change password</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leave blank to keep your current password.
          </p>
        </div>

        <FormField label="Current password" error={errors.currentPassword?.message}>
          <Input
            {...register('currentPassword')}
            type="password"
            autoComplete="current-password"
            disabled={isDemoUser}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="New password" error={errors.newPassword?.message}>
            <Input
              {...register('newPassword')}
              type="password"
              autoComplete="new-password"
              disabled={isDemoUser}
            />
          </FormField>
          <FormField label="Confirm new password" error={errors.confirmPassword?.message}>
            <Input
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              disabled={isDemoUser}
            />
          </FormField>
        </div>
      </section>

      <div className="flex justify-end border-t border-gray-200 pt-6 dark:border-gray-800">
        <Button type="submit" disabled={!canSubmit}>
          {busy ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}
