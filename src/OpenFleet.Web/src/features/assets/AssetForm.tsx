import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDepartments } from '@/hooks/useDepartments'
import { useVehicles } from '@/features/vehicles/hooks'
import type { AssetResponse } from '@/types'
import { assetFormSchema, type AssetFormValues } from './schemas'

interface AssetFormProps {
  defaultValues?: Partial<AssetFormValues>
  onSubmit: (values: AssetFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'InUse', label: 'In Use' },
  { value: 'UnderMaintenance', label: 'Under Maintenance' },
  { value: 'Decommissioned', label: 'Decommissioned' },
] as const

const CONDITION_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Damaged', label: 'Damaged' },
] as const

export function assetToFormValues(asset: AssetResponse): AssetFormValues {
  return {
    assetTag: asset.assetTag,
    name: asset.name,
    type: asset.type,
    condition: asset.condition,
    status: asset.status,
    departmentId: asset.departmentId ?? '',
    vehicleId: asset.vehicleId ?? undefined,
  }
}

export function AssetForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: AssetFormProps) {
  const { data: departments, isLoading: departmentsLoading } = useDepartments()
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetTag: '',
      name: '',
      type: '',
      condition: 'Good',
      status: 'Available',
      departmentId: '',
      vehicleId: undefined,
      ...defaultValues,
    },
  })

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Asset tag" required error={errors.assetTag?.message}>
          <Input {...register('assetTag')} autoComplete="off" placeholder="EQ-001" />
        </FormField>

        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register('name')} autoComplete="off" placeholder="Hydraulic lift" />
        </FormField>

        <FormField label="Type" required error={errors.type?.message}>
          <Input {...register('type')} autoComplete="off" placeholder="Equipment" />
        </FormField>

        <FormField label="Condition" required error={errors.condition?.message}>
          <Select {...register('condition')}>
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Status" required error={errors.status?.message}>
          <Select {...register('status')}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Department" required error={errors.departmentId?.message}>
          <Select
            {...register('departmentId')}
            disabled={departmentsLoading}
            placeholder="Select department"
          >
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Assigned vehicle"
          hint="Optional - link this asset to a fleet vehicle"
          error={errors.vehicleId?.message}
          className="sm:col-span-2"
        >
          <Select
            {...register('vehicleId')}
            disabled={vehiclesLoading}
            placeholder="No vehicle assigned"
          >
            <option value="">No vehicle assigned</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} ({v.licensePlate})
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
