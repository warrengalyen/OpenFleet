import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAssets } from '@/features/assets/hooks'
import { useVehicles } from '@/features/vehicles/hooks'
import type { WorkOrderResponse } from '@/types'
import { userDisplayName } from '@/types/user'
import { useAssignableUsers } from './hooks'
import { workOrderFormSchema, type WorkOrderFormValues } from './schemas'

interface WorkOrderFormProps {
  defaultValues?: Partial<WorkOrderFormValues>
  onSubmit: (values: WorkOrderFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
] as const

export function workOrderToFormValues(workOrder: WorkOrderResponse): WorkOrderFormValues {
  return {
    title: workOrder.title,
    description: workOrder.description || undefined,
    priority: workOrder.priority,
    vehicleId: workOrder.vehicleId ?? undefined,
    assetId: workOrder.assetId ?? undefined,
    assignedUserId: workOrder.assignedUserId ?? undefined,
  }
}

export function WorkOrderForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: WorkOrderFormProps) {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { users: assignableUsers, isLoading: usersLoading } = useAssignableUsers()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      vehicleId: undefined,
      assetId: undefined,
      assignedUserId: undefined,
      ...defaultValues,
    },
  })

  const targetError = errors.vehicleId?.message ?? errors.assetId?.message

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <FormField label="Title" required error={errors.title?.message}>
        <Input {...register('title')} placeholder="Brake pad replacement" />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} rows={3} placeholder="Optional details…" />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Priority" required error={errors.priority?.message}>
          <Select {...register('priority')}>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Assigned technician" error={errors.assignedUserId?.message}>
          <Select
            {...register('assignedUserId')}
            disabled={usersLoading}
            placeholder="Unassigned"
          >
            <option value="">Unassigned</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {userDisplayName(user)} ({user.role})
              </option>
            ))}
          </Select>
        </FormField>

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

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
