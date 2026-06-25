import { Link } from 'react-router-dom'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'
import { getApiErrorMessage } from '@/lib/api'
import { isQueryLoadFailure } from '@/lib/query'
import { useToast } from '@/components/ui/Toaster'
import { useSettings } from '@/hooks/useSettings'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { SettingsForm, settingsToFormValues } from './SettingsForm'
import { useUpdateSettings } from './hooks'
import type { SettingsFormValues } from './schemas'

export function SettingsPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useSettings()
  const updateSettings = useUpdateSettings()
  const loadFailed = isQueryLoadFailure(isError, data)

  async function handleSubmit(values: SettingsFormValues) {
    try {
      await updateSettings.mutateAsync(values)
      toast.success('Settings saved')
    } catch (err) {
      toast.error('Failed to save settings', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Settings" />

      <PageTitle
        title="Settings"
        subtitle="Configure fleet-wide operational defaults and business rules"
      />

      <QueryErrorBanner
        show={loadFailed}
        message="Failed to load application settings."
        onRetry={() => void refetch()}
      />

      {!loadFailed && data && (
        <Card>
          <CardContent className="pt-6">
            <SettingsForm
              defaultValues={settingsToFormValues(data)}
              onSubmit={handleSubmit}
              onCancel={() => void refetch()}
              isLoading={updateSettings.isPending}
            />
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link to="/admin" className="text-brand-600 hover:underline dark:text-brand-400">
          Back to administration
        </Link>
      </p>
    </div>
  )
}
