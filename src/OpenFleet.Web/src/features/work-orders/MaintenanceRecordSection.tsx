import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Wrench } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api'
import { formatDate, formatNumber } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { MaintenanceRecordResponse, WorkOrderResponse } from '@/types'
import { useLinkMaintenanceRecord, workOrderKeys } from './hooks'
import { maintenanceRecordSchema, type MaintenanceRecordFormValues } from './schemas'

interface MaintenanceRecordSectionProps {
  workOrder: WorkOrderResponse
}

export function MaintenanceRecordSection({ workOrder }: MaintenanceRecordSectionProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const linkRecord = useLinkMaintenanceRecord(workOrder.id)
  const [showForm, setShowForm] = useState(false)

  const cachedRecord = queryClient.getQueryData<MaintenanceRecordResponse>(
    workOrderKeys.maintenanceRecord(workOrder.id),
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      performedAt: new Date().toISOString().slice(0, 16),
      odometerReading: 0,
      notes: '',
    },
  })

  async function onSubmit(values: MaintenanceRecordFormValues) {
    try {
      await linkRecord.mutateAsync({
        performedAt: new Date(values.performedAt).toISOString(),
        odometerReading: values.odometerReading,
        notes: values.notes,
      })
      setShowForm(false)
      toast.success('Maintenance record linked')
    } catch (err) {
      toast.error('Failed to link maintenance record', getApiErrorMessage(err))
    }
  }

  if (cachedRecord) {
    return (
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">Performed</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatDate(cachedRecord.performedAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">Odometer</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatNumber(cachedRecord.odometerReading)} mi
          </dd>
        </div>
        {cachedRecord.notes && (
          <div>
            <dt className="mb-1 text-gray-500 dark:text-gray-400">Notes</dt>
            <dd className="text-gray-800 dark:text-gray-200">{cachedRecord.notes}</dd>
          </div>
        )}
      </dl>
    )
  }

  if (workOrder.hasMaintenanceRecord) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Wrench className="h-4 w-4" />
        A maintenance record is linked to this work order.
      </div>
    )
  }

  if (workOrder.status !== 'Completed') {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Complete this work order to link a maintenance record.
      </p>
    )
  }

  if (!showForm) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
        Link maintenance record
      </Button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-4"
      noValidate
    >
      <FormField label="Performed at" required error={errors.performedAt?.message}>
        <Input {...register('performedAt')} type="datetime-local" />
      </FormField>
      <FormField label="Odometer reading" required error={errors.odometerReading?.message}>
        <Input {...register('odometerReading')} type="number" min={0} />
      </FormField>
      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} rows={3} />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isSubmitting || linkRecord.isPending}>
          Save record
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
