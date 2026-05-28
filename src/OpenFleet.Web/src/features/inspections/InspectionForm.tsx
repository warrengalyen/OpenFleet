import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAssets } from '@/features/assets/hooks'
import { useVehicles } from '@/features/vehicles/hooks'
import { useAssignableUsers } from '@/features/work-orders/hooks'
import type { InspectionResponse } from '@/types'
import { userDisplayName } from '@/types/user'
import { FailedWorkOrderBanner } from './FailedWorkOrderBanner'
import { inspectionFormSchema, type InspectionFormValues } from './schemas'

interface InspectionFormProps {
  defaultValues?: Partial<InspectionFormValues>
  onSubmit: (values: InspectionFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'NeedsReview', label: 'Needs Review' },
] as const

export function inspectionToFormValues(inspection: InspectionResponse): InspectionFormValues {
  return {
    vehicleId: inspection.vehicleId ?? undefined,
    assetId: inspection.assetId ?? undefined,
    inspectorUserId: inspection.inspectorUserId,
    inspectedAt: new Date(inspection.inspectedAt).toISOString().slice(0, 16),
    status: inspection.status,
    notes: inspection.notes || undefined,
  }
}

export function InspectionForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: InspectionFormProps) {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { users: assignableUsers, isLoading: usersLoading } = useAssignableUsers()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      vehicleId: undefined,
      assetId: undefined,
      inspectorUserId: '',
      inspectedAt: new Date().toISOString().slice(0, 16),
      status: 'Passed',
      notes: undefined,
      ...defaultValues,
    },
  })

  const status = useWatch({ control, name: 'status' })
  const targetError = errors.vehicleId?.message ?? errors.assetId?.message

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
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
        <FormField label="Inspector" required error={errors.inspectorUserId?.message}>
          <Select
            {...register('inspectorUserId')}
            disabled={usersLoading}
            placeholder="Select inspector"
          >
            <option value="">Select inspector</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {userDisplayName(user)} ({user.role})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Inspected at" required error={errors.inspectedAt?.message}>
          <Input {...register('inspectedAt')} type="datetime-local" />
        </FormField>
      </div>

      <FormField label="Result" required error={errors.status?.message}>
        <Select {...register('status')}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormField>

      {status === 'Failed' && <FailedWorkOrderBanner variant="form" />}

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} rows={4} placeholder="Inspection findings…" />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
