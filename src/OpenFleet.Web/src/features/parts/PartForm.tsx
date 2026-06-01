import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useVendors } from '@/features/vendors/hooks'
import type { PartResponse } from '@/types'
import { partFormSchema, type PartFormValues } from './schemas'

interface PartFormProps {
  defaultValues?: Partial<PartFormValues>
  onSubmit: (values: PartFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

export function partToFormValues(part: PartResponse): PartFormValues {
  return {
    name: part.name,
    partNumber: part.partNumber,
    vendorId: part.vendorId,
    quantityOnHand: part.quantityOnHand,
    unitCost: part.unitCost,
  }
}

export function PartForm({ defaultValues, onSubmit, submitLabel, isLoading }: PartFormProps) {
  const { data: vendors, isLoading: vendorsLoading } = useVendors()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      name: '',
      partNumber: '',
      vendorId: '',
      quantityOnHand: 0,
      unitCost: 0,
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
        <FormField label="Part name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="Oil filter" />
        </FormField>

        <FormField label="Part number" required error={errors.partNumber?.message}>
          <Input {...register('partNumber')} placeholder="OF-2024-STD" />
        </FormField>
      </div>

      <FormField label="Vendor" required error={errors.vendorId?.message}>
        <Select {...register('vendorId')} disabled={vendorsLoading} placeholder="Select vendor">
          <option value="">Select vendor</option>
          {vendors?.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Quantity on hand" required error={errors.quantityOnHand?.message}>
          <Input {...register('quantityOnHand')} type="number" min={0} />
        </FormField>

        <FormField label="Unit cost" required error={errors.unitCost?.message}>
          <Input {...register('unitCost')} type="number" min={0} step="0.01" />
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
