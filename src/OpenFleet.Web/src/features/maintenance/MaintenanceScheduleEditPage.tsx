import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import {
  MaintenanceScheduleForm,
  scheduleToFormValues,
} from './MaintenanceScheduleForm'
import {
  useDeactivateMaintenanceSchedule,
  useMaintenanceSchedule,
  useMarkMaintenancePerformed,
  useUpdateMaintenanceSchedule,
} from './hooks'
import { MarkPerformedDialog } from './MarkPerformedDialog'
import type { MaintenanceScheduleFormValues, MarkPerformedFormValues } from './schemas'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function MaintenanceScheduleEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [markOpen, setMarkOpen] = useState(false)

  const { data: schedule, isLoading } = useMaintenanceSchedule(id)
  const updateSchedule = useUpdateMaintenanceSchedule(id)
  const deactivateSchedule = useDeactivateMaintenanceSchedule()
  const markPerformed = useMarkMaintenancePerformed(id)

  async function handleSubmit(values: MaintenanceScheduleFormValues) {
    try {
      await updateSchedule.mutateAsync({
        name: values.name,
        description: values.description ?? '',
        vehicleId: values.vehicleId || null,
        assetId: values.assetId || null,
        mileageInterval: values.mileageInterval ?? null,
        dayInterval: values.dayInterval ?? null,
      })
      toast.success('Schedule updated')
    } catch (err) {
      toast.error('Failed to update schedule', getApiErrorMessage(err))
    }
  }

  async function handleDeactivate() {
    try {
      await deactivateSchedule.mutateAsync(id)
      toast.success('Schedule deactivated')
      navigate('/maintenance?tab=schedules')
    } catch (err) {
      toast.error('Failed to deactivate schedule', getApiErrorMessage(err))
    }
  }

  async function handleMarkPerformed(values: MarkPerformedFormValues) {
    try {
      await markPerformed.mutateAsync({
        performedAt: new Date(values.performedAt).toISOString(),
        mileage: values.mileage ?? null,
      })
      toast.success('Service marked as performed')
      setMarkOpen(false)
    } catch (err) {
      toast.error('Failed to mark performed', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!schedule) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Schedule not found.{' '}
        <Link to="/maintenance?tab=schedules" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
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
        <PageTitle title={schedule.name} subtitle="Edit preventive maintenance schedule" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {schedule.isDue ? (
          <Badge variant="warning">Due now</Badge>
        ) : schedule.isActive ? (
          <Badge variant="success">On track</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
        )}
      </div>

      {schedule.isActive && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMarkOpen(true)}>
            Mark performed
          </Button>
          <Button variant="danger" onClick={() => setDeactivateOpen(true)}>
            Deactivate
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow
                label="Vehicle"
                value={
                  schedule.vehicleId ? (
                    <Link
                      to={`/vehicles/${schedule.vehicleId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {schedule.vehicleDescription}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Asset"
                value={
                  schedule.assetId ? (
                    <Link
                      to={`/assets/${schedule.assetId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {schedule.assetDescription}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Mileage interval"
                value={
                  schedule.mileageInterval
                    ? `${formatNumber(schedule.mileageInterval)} mi`
                    : '-'
                }
              />
              <DetailRow
                label="Day interval"
                value={schedule.dayInterval ? `${schedule.dayInterval} days` : '-'}
              />
              <DetailRow
                label="Last performed"
                value={
                  schedule.lastPerformedAt
                    ? formatDateTime(schedule.lastPerformedAt)
                    : 'Never'
                }
              />
              <DetailRow
                label="Last odometer"
                value={
                  schedule.lastPerformedMileage != null
                    ? `${formatNumber(schedule.lastPerformedMileage)} mi`
                    : '-'
                }
              />
              <DetailRow
                label="Next due"
                value={[
                  schedule.nextDueDate ? formatDate(schedule.nextDueDate) : null,
                  schedule.nextDueMileage
                    ? `${formatNumber(schedule.nextDueMileage)} mi`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' / ') || '-'}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceScheduleForm
              defaultValues={scheduleToFormValues(schedule)}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
              isLoading={updateSchedule.isPending}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate schedule?"
        description={`"${schedule.name}" will no longer generate due reminders. Existing history is preserved.`}
        confirmLabel="Deactivate"
        variant="danger"
      />

      <MarkPerformedDialog
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        onSubmit={handleMarkPerformed}
        scheduleName={schedule.name}
        isLoading={markPerformed.isPending}
      />
    </div>
  )
}
