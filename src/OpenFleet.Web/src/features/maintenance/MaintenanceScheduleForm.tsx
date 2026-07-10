import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAssets } from '@/features/assets/hooks'
import { useVehicles } from '@/features/vehicles/hooks'
import { zodFormResolver } from '@/lib/form'
import type { MaintenanceScheduleResponse } from '@/types'
import { maintenanceScheduleFormSchema, type MaintenanceScheduleFormValues } from './schemas'

interface MaintenanceScheduleFormProps {
  defaultValues?: Partial<MaintenanceScheduleFormValues>
  onSubmit: (values: MaintenanceScheduleFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

export function scheduleToFormValues(
  schedule: MaintenanceScheduleResponse,
): MaintenanceScheduleFormValues {
  return {
    name: schedule.name,
    description: schedule.description || undefined,
    vehicleId: schedule.vehicleId ?? undefined,
    assetId: schedule.assetId ?? undefined,
    mileageInterval: schedule.mileageInterval ?? undefined,
    dayInterval: schedule.dayInterval ?? undefined,
  }
}

export function MaintenanceScheduleForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: MaintenanceScheduleFormProps) {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { data: assets, isLoading: assetsLoading } = useAssets()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceScheduleFormValues>({
    resolver: zodFormResolver(maintenanceScheduleFormSchema),
    defaultValues: {
      name: '',
      description: undefined,
      vehicleId: undefined,
      assetId: undefined,
      mileageInterval: undefined,
      dayInterval: undefined,
      ...defaultValues,
    },
  })

  const targetError = errors.vehicleId?.message ?? errors.assetId?.message
  const intervalError = errors.mileageInterval?.message ?? errors.dayInterval?.message

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <FormField label="Schedule name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="Oil change" />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} rows={2} placeholder="Optional details…" />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Vehicle"
          required
          error={targetError}
          hint="At least one of vehicle or asset is required"
        >
          <Select
            {...register('vehicleId')}
            disabled={vehiclesLoading}
            placeholder="Select vehicle"
          >
            <option value="">No vehicle</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} ({v.licensePlate})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Asset" error={errors.assetId?.message}>
          <Select {...register('assetId')} disabled={assetsLoading} placeholder="Select asset">
            <option value="">No asset</option>
            {assets?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.assetTag})
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Mileage interval"
          error={intervalError}
          hint="Miles between service (optional if days set)"
        >
          <Input
            {...register('mileageInterval')}
            type="number"
            min={1}
            placeholder="e.g. 5000"
          />
        </FormField>

        <FormField label="Day interval" error={errors.dayInterval?.message} hint="Days between service">
          <Input {...register('dayInterval')} type="number" min={1} placeholder="e.g. 90" />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
