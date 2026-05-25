import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDepartments } from '@/hooks/useDepartments'
import type { VehicleResponse } from '@/types'
import { vehicleFormSchema, type VehicleFormValues } from './schemas'

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormValues>
  onSubmit: (values: VehicleFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'InMaintenance', label: 'In Maintenance' },
  { value: 'OutOfService', label: 'Out of Service' },
  { value: 'Retired', label: 'Retired' },
] as const

export function vehicleToFormValues(vehicle: VehicleResponse): VehicleFormValues {
  return {
    vin: vehicle.vin,
    licensePlate: vehicle.licensePlate,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    status: vehicle.status,
    departmentId: vehicle.departmentId,
  }
}

export function VehicleForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: VehicleFormProps) {
  const { data: departments, isLoading: departmentsLoading } = useDepartments()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      vin: '',
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
      status: 'Active',
      departmentId: '',
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
        <FormField label="VIN" required error={errors.vin?.message}>
          <Input {...register('vin')} autoComplete="off" placeholder="1HGBH41JXMN109186" />
        </FormField>

        <FormField label="License plate" required error={errors.licensePlate?.message}>
          <Input {...register('licensePlate')} autoComplete="off" placeholder="ABC-1234" />
        </FormField>

        <FormField label="Make" required error={errors.make?.message}>
          <Input {...register('make')} autoComplete="off" placeholder="Ford" />
        </FormField>

        <FormField label="Model" required error={errors.model?.message}>
          <Input {...register('model')} autoComplete="off" placeholder="Transit" />
        </FormField>

        <FormField label="Year" required error={errors.year?.message}>
          <Input {...register('year')} type="number" min={1900} />
        </FormField>

        <FormField label="Mileage" required error={errors.mileage?.message}>
          <Input {...register('mileage')} type="number" min={0} />
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
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
