import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { MaintenanceScheduleForm } from './MaintenanceScheduleForm'
import { useCreateMaintenanceSchedule } from './hooks'
import type { MaintenanceScheduleFormValues } from './schemas'

export function MaintenanceScheduleCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createSchedule = useCreateMaintenanceSchedule()

  async function handleSubmit(values: MaintenanceScheduleFormValues) {
    try {
      const schedule = await createSchedule.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        vehicleId: values.vehicleId || undefined,
        assetId: values.assetId || undefined,
        mileageInterval: values.mileageInterval || undefined,
        dayInterval: values.dayInterval || undefined,
      })
      toast.success('Maintenance schedule created')
      navigate(`/maintenance/schedules/${schedule.id}/edit`)
    } catch (err) {
      toast.error('Failed to create schedule', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/maintenance?tab=schedules"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to maintenance"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle
          title="New maintenance schedule"
          subtitle="Set up recurring preventive maintenance by mileage or days"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <MaintenanceScheduleForm
            onSubmit={handleSubmit}
            submitLabel="Create schedule"
            isLoading={createSchedule.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
